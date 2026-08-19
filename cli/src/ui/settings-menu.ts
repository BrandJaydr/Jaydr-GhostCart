import { select, Separator } from '@inquirer/prompts';
import { loadPreferences, savePreferences } from '../config.js';
import { BANNER_REGISTRY, getSmallBanners, getWideBanners, Banner } from './banners.js';
import { color } from './theme.js';

export async function settingsMenu() {
  while (true) {
    const prefs = loadPreferences();
    
    // Determine current banner selection text
    let currentBannerText = 'Randomized based on terminal width';
    if (prefs.staticBannerId) {
      const banner = BANNER_REGISTRY.find(b => b.id === prefs.staticBannerId);
      if (banner) {
        currentBannerText = `Static: ${banner.name}`;
      }
    }

    const choice = await select({
      message: color.brand('⚙ Settings Menu'),
      choices: [
        {
          name: `Display Banners (Current: ${currentBannerText})`,
          value: 'banners',
          description: 'Choose whether banners should be randomized or set to a static option.',
        },
        {
          name: 'Image Generator Preferences (Coming Soon)',
          value: 'images',
          description: 'Configure how ASCII avatars are generated and sourced.',
          disabled: true,
        },
        {
          name: 'Back to Main Menu',
          value: 'back',
        }
      ]
    });

    if (choice === 'back') break;

    if (choice === 'banners') {
      await bannerSettingsMenu();
    }
  }
}

async function bannerSettingsMenu() {
  const prefs = loadPreferences();
  
  const choices: any[] = [
    {
      name: 'Randomize Banners (Default)',
      value: 'random',
      description: 'Banners will randomize on load based on your terminal width.',
    }
  ];

  // Group banners into choices
  const small = getSmallBanners();
  const wide = getWideBanners();

  choices.push(new Separator(color.dim('--- Small Screens (<= 80 cols) ---')));

  for (const b of small) {
    choices.push({
      name: b.name,
      value: b.id,
      description: `Set static banner to ${b.name}`,
    });
  }

  choices.push(new Separator(color.dim('--- Wide Screens (> 80 cols) ---')));

  for (const b of wide) {
    choices.push({
      name: b.name,
      value: b.id,
      description: `Set static banner to ${b.name}`,
    });
  }

  choices.push(new Separator());
  
  choices.push({
    name: 'Cancel',
    value: 'cancel',
    description: 'Go back to Settings',
  });

  const bannerChoice = await select({
    message: 'Select a Banner mode:',
    choices: choices,
  }) as string;

  if (bannerChoice === 'cancel') return;

  if (bannerChoice === 'random') {
    savePreferences({ staticBannerId: null });
    console.log(color.success('\n  ✓ Banner set to Randomize\n'));
  } else {
    savePreferences({ staticBannerId: bannerChoice });
    console.log(color.success(`\n  ✓ Static Banner set successfully\n`));
  }
}
