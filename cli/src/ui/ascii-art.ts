import { color } from './theme.js';

export const GHOSTCART_LOGO = [
  String.raw`   ____ _               _    ____           _   `,
  String.raw`  / ___| |__   ___  ___| |_ / ___|__ _ _ __| |_ `,
  String.raw` | |  _| '_ \ / _ \/ __| __| |   / _\ | '__| __|`,
  String.raw` | |_| | | | | (_) \__ \ |_| |__| (_| | |  | |_ `,
  String.raw`  \____|_| |_|\___/|___/\__|\____\__,_|_|   \__|`
];

export const GAME_SPRITES = {
  cart: color.brand('[C]'),
  ghostCerulean: color.brand('{G}'),
  ghostPink: color.pink('{G}'),
  ghostPurple: color.purple('{G}'),
  ghostGreen: color.success('{G}'),
  dot: color.muted('·'),
  powerPellet: color.warning('●'),
  wallH: color.border('═'),
  wallV: color.border('║'),
  cornerTL: color.border('╔'),
  cornerTR: color.border('╗'),
  cornerBL: color.border('╚'),
  cornerBR: color.border('╝')
};
