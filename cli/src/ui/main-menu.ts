import { select, input } from '@inquirer/prompts';
import { clearScreen, drawFrame, drawHeaderBar, drawStatusBar } from './screen.js';
import { color, box } from './theme.js';
import { BANNER_REGISTRY, pickRandomBanner, getBannerById } from './banners.js';
import { settingsMenu } from './settings-menu.js';
import { spawnSync } from 'child_process';
import { loadConfig, loadPreferences } from '../config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve to the cli/dist directory (this file lives at cli/dist/ui/main-menu.js)
const CLI_DIST = path.resolve(__dirname, '..');
const CLI_INDEX = path.join(CLI_DIST, 'index.js');
const GAME_PATH = path.join(__dirname, 'ghost-game.js');

function runCliCommand(args: string[]) {
  clearScreen();
  // Using spawnSync to inherit stdio and block until command completes
  spawnSync('node', [CLI_INDEX, ...args], { stdio: 'inherit' });
  console.log('\n\n' + color.muted('Press Enter to return to the BBS...'));
  spawnSync('node', ['-e', 'process.stdin.once("data", () => process.exit(0))'], { stdio: 'inherit' });
}

async function runTerminalEmulator() {
  clearScreen();
  console.log(color.magenta('=== TERMINAL EMULATOR MODE ==='));
  console.log(color.muted('Type "exit" or "quit" to return to BBS'));
  console.log(color.muted('Prefix commands with "ghostcart" or run directly.\n'));

  while (true) {
    const cmd = await input({ message: color.cyan('ghostcart> ') });
    if (cmd.trim().toLowerCase() === 'exit' || cmd.trim().toLowerCase() === 'quit') {
      break;
    }
    
    if (cmd.trim() === '') continue;

    let args = cmd.split(' ');
    if (args[0] === 'ghostcart') {
      args.shift();
    }
    
    spawnSync('node', [CLI_INDEX, ...args], { stdio: 'inherit' });
    console.log();
  }
}

async function playGhostCartGame() {
  clearScreen();
  // We'll spawn the game here
  spawnSync('node', [GAME_PATH], { stdio: 'inherit' });
  console.log('\n\n' + color.muted('Press Enter to return to the BBS...'));
  spawnSync('node', ['-e', 'process.stdin.once("data", () => process.exit(0))'], { stdio: 'inherit' });
}

export async function showMainMenu() {
  while (true) {
    clearScreen();
    
    const cfg = loadConfig();
    const prefs = loadPreferences();
    const userDisplay = cfg.email ? cfg.email : 'NOT LOGGED IN';
    const tenantDisplay = cfg.tenantId ? cfg.tenantId : 'NONE';
    
    const header = drawHeaderBar(color.brand('GHOSTCART SECURE BBS'), color.muted(`USER: ${userDisplay}`));
    const status = drawStatusBar([
      color.success('STATUS: ONLINE'),
      color.info('NET: ENCRYPTED'),
      color.muted(`TENANT: ${tenantDisplay}`)
    ]);
    
    // Draw Logo dynamically based on preferences and terminal width
    let activeBanner = pickRandomBanner(process.stdout.columns || 80);
    if (prefs.staticBannerId) {
      const b = getBannerById(prefs.staticBannerId);
      if (b) activeBanner = b;
    }

    const logoColored = activeBanner.lines.map(l => color.brand(l));
    
    const content = [
      '',
      ...logoColored,
      '',
      color.muted('    ' + box.horizontal.repeat(50)),
      '',
      color.white('    1. Authenticate (Login)'),
      color.white('    2. Account Usage'),
      color.white('    3. Products List'),
      color.white('    4. Listings Status'),
      color.white('    5. API Keys'),
      color.magenta('    6. Play GhostCart (SysOp Game)'),
      color.yellow('    8. Settings'),
      color.cyan('    9. Terminal Emulator Mode'),
      color.error('    0. Logoff / Disconnect'),
      '',
    ];
    
    console.log(drawFrame(content, header, status));
    
    const choice = await input({ message: 'Select an option: ' });
    
    switch (choice.trim()) {
      case '1':
        runCliCommand(['login']);
        break;
      case '2':
        runCliCommand(['account', 'usage']);
        break;
      case '3':
        runCliCommand(['products', 'list']);
        break;
      case '4':
        runCliCommand(['listings', 'status']);
        break;
      case '5':
        runCliCommand(['keys', 'list']);
        break;
      case '6':
        await playGhostCartGame();
        break;
      case '8':
        await settingsMenu();
        break;
      case '9':
        await runTerminalEmulator();
        break;
      case '0':
        if (cfg.token) {
          runCliCommand(['logout']);
        }
        clearScreen();
        console.log(color.magenta('DISCONNECTED. CARRIER LOST.'));
        process.exit(0);
      default:
        // Ignore invalid input
        break;
    }
  }
}
