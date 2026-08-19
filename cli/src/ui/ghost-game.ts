import { color, box, getTermWidth } from './theme.js';
import { GAME_SPRITES } from './ascii-art.js';

// Simple map for Pac-Man style game (GhostCart)
// 0: Empty, 1: Wall, 2: Dot, 3: Power Pellet
const MAP_WIDTH = 28;
const MAP_HEIGHT = 15;
const rawMap = [
  "1111111111111111111111111111",
  "1222222222221111222222222221",
  "1211112111121111211112111121",
  "1311112111121111211112111131",
  "1222222222222222222222222221",
  "1211112112111111112112111121",
  "1222222112221111222112222221",
  "1111112111101111011112111111",
  "0000012110000000000112100000",
  "1111112110111001110112111111",
  "1222222220100000010222222221",
  "1211112110111111110112111121",
  "1222112112222222222112112221",
  "1113112112111111112112113111",
  "1222222222222222222222222221",
  "1111111111111111111111111111"
];

let map: number[][] = [];
let score = 0;
let player = { x: 14, y: 11, dirX: 0, dirY: 0 };
let ghosts = [
  { x: 13, y: 8, char: GAME_SPRITES.ghostCerulean, dirX: 1, dirY: 0 },
  { x: 14, y: 8, char: GAME_SPRITES.ghostPink, dirX: -1, dirY: 0 },
  { x: 13, y: 9, char: GAME_SPRITES.ghostPurple, dirX: 1, dirY: 0 },
  { x: 14, y: 9, char: GAME_SPRITES.ghostGreen, dirX: -1, dirY: 0 }
];

let isRunning = true;
let loopTimer: NodeJS.Timeout;

function initGame() {
  map = rawMap.map(row => row.split('').map(Number));
  score = 0;
  player = { x: 14, y: 11, dirX: 0, dirY: 0 };
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', handleInput);
  
  // Hide cursor
  process.stdout.write('\x1B[?25l');
  
  clearScreen();
  loopTimer = setInterval(update, 150);
}

function clearScreen() {
  process.stdout.write('\x1Bc');
}

function draw() {
  // Move cursor to home
  process.stdout.write('\x1B[0;0H');
  
  let frame = '';
  const termWidth = getTermWidth();
  const padding = ' '.repeat(Math.max(0, Math.floor((termWidth - MAP_WIDTH * 2) / 2)));
  
  frame += padding + color.magenta('◈ GHOSTCART ARCADE ◈') + '\n\n';
  
  for (let y = 0; y < map.length; y++) {
    frame += padding;
    for (let x = 0; x < map[y].length; x++) {
      let isEntity = false;
      
      if (player.x === x && player.y === y) {
        frame += GAME_SPRITES.cart;
        isEntity = true;
      } else {
        for (const g of ghosts) {
          if (g.x === x && g.y === y) {
            frame += g.char;
            isEntity = true;
            break;
          }
        }
      }
      
      if (!isEntity) {
        const cell = map[y][x];
        if (cell === 1) frame += color.border('██');
        else if (cell === 2) frame += ' ' + GAME_SPRITES.dot;
        else if (cell === 3) frame += ' ' + GAME_SPRITES.powerPellet;
        else frame += '  ';
      }
    }
    frame += '\n';
  }
  
  frame += '\n' + padding + color.brand(`SCORE: ${score}`);
  frame += '\n' + padding + color.muted('Use W/A/S/D or Arrows to move. Q to quit.');
  
  process.stdout.write(frame);
}

function update() {
  if (!isRunning) return;
  
  // Move Player
  let nextX = player.x + player.dirX;
  let nextY = player.y + player.dirY;
  
  // Portal wrap
  if (nextX < 0) nextX = MAP_WIDTH - 1;
  if (nextX >= MAP_WIDTH) nextX = 0;
  
  if (map[nextY] && map[nextY][nextX] !== 1) {
    player.x = nextX;
    player.y = nextY;
    
    // Eat dot
    if (map[nextY][nextX] === 2) {
      map[nextY][nextX] = 0;
      score += 10;
    } else if (map[nextY][nextX] === 3) {
      map[nextY][nextX] = 0;
      score += 50;
    }
  }
  
  // Move Ghosts (dumb AI)
  for (const g of ghosts) {
    // 10% chance to change direction randomly, or if hitting wall
    let gNextX = g.x + g.dirX;
    let gNextY = g.y + g.dirY;
    
    if (Math.random() < 0.2 || !map[gNextY] || map[gNextY][gNextX] === 1) {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      const validDirs = dirs.filter(d => {
        let ny = g.y + d[1];
        let nx = g.x + d[0];
        return map[ny] && map[ny][nx] !== 1;
      });
      if (validDirs.length > 0) {
        const chosen = validDirs[Math.floor(Math.random() * validDirs.length)];
        g.dirX = chosen[0];
        g.dirY = chosen[1];
      }
    } else {
      g.x = gNextX;
      g.y = gNextY;
    }
    
    // Portal wrap for ghosts
    if (g.x < 0) g.x = MAP_WIDTH - 1;
    if (g.x >= MAP_WIDTH) g.x = 0;
  }
  
  // Collision
  for (const g of ghosts) {
    if (g.x === player.x && g.y === player.y) {
      isRunning = false;
      clearInterval(loopTimer);
      draw(); // Draw final state
      process.stdout.write('\n\n' + color.error('  >>> SYSTEM FAILURE: GHOST COLLISION <<<') + '\n');
      quitGame();
      return;
    }
  }
  
  draw();
}

function handleInput(key: string) {
  if (key === '\u0003' || key.toLowerCase() === 'q') {
    quitGame();
    return;
  }
  
  // W/A/S/D or Arrows
  if (key === 'w' || key === '\u001B[A') { player.dirX = 0; player.dirY = -1; }
  else if (key === 's' || key === '\u001B[B') { player.dirX = 0; player.dirY = 1; }
  else if (key === 'd' || key === '\u001B[C') { player.dirX = 1; player.dirY = 0; }
  else if (key === 'a' || key === '\u001B[D') { player.dirX = -1; player.dirY = 0; }
}

function quitGame() {
  isRunning = false;
  clearInterval(loopTimer);
  process.stdin.setRawMode(false);
  process.stdin.pause();
  process.stdin.removeListener('data', handleInput);
  process.stdout.write('\x1B[?25h'); // Show cursor
  process.exit(0);
}

// Start immediately when run
initGame();
