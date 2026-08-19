# GhostCart CLI Arcade — Pac-Man

## What this is
A terminal-styled Pac-Man game, built to slot into GhostCart's Next.js 14 app
router. No image/audio assets — everything renders as text glyphs on a CSS
grid, so it reads as an 8-bit CLI game and stays responsive at any viewport.

- Pac-Man renders as a rotating **C** (mouth alternates C/O to animate a chomp).
- Ghosts render as colored **G**s — red Blinky, pink Pinky, cyan Inky, orange
  Clyde — each with a distinct chase behavior.
- Power pellets trigger a frightened state: ghosts turn blue, flee from
  Pac-Man instead of hunting him, slow down, and can be eaten for points. They
  flash white in the last ~1.5s before the powerup wears off.
- The maze is generated procedurally each level (recursive-backtracker +
  wall-braiding for loops), so it's always fully connected and never has an
  unreachable dot. Includes a side tunnel and a center ghost house.

## Files
- `components/arcade/PacmanGame.tsx` — the whole game (self-contained client
  component: maze gen, game loop, ghost AI, rendering, controls).
- `app/arcade/pacman/page.tsx` — a route that mounts it at `/arcade/pacman`.

## Integration
1. Copy `components/arcade/PacmanGame.tsx` into your `components/arcade/`
   directory (create it if it doesn't exist).
2. Copy `app/arcade/pacman/page.tsx` into your `app/arcade/pacman/` directory,
   or import `<PacmanGame />` from wherever you want the arcade to live (e.g.
   a tabbed `/arcade` shell if you add more games later).
3. Adjust the `@/components/arcade/PacmanGame` import path if your `tsconfig`
   path alias differs.
4. No new dependencies — it only uses React (already in your stack). It does
   not touch `DEV_TENANT_ID`, the DB, or any GhostCart data models, so it's
   safe to drop in ahead of the tenant-auth cleanup.

## Controls
- Arrow keys or WASD to move, Space to pause, Enter to start/restart.
- On-screen D-pad + pause button for touch/mobile.

## Extending toward a multi-game arcade
The reducer/rendering pattern here (procedural board + `useReducer` game loop
+ CSS-grid glyph rendering) is meant to be a template — a second game (Snake,
Breakout, etc.) can follow the same shape and share the terminal-window shell
styling (`.pacman-arcade` / `.pmterm-*` classes) if you want a consistent
arcade cabinet look. Happy to build the shell + game picker next if useful.

## Known simplifications (flagged honestly, not hidden)
- Ghost AI uses classic Pac-Man-style heuristics (straight-line distance to a
  personality-specific target at each intersection) rather than true
  pathfinding — this is actually how the original arcade game's ghosts work,
  not a shortcut.
- No scatter/chase phase timer — ghosts are always in "chase" (with their
  individual targeting quirks) outside of powerups, which keeps the code
  simpler while still giving each ghost a distinct feel.
- Styling uses a plain `<style>` tag rather than styled-jsx, so it has zero
  extra dependencies and works identically whether or not your Next config
  has styled-jsx enabled.
