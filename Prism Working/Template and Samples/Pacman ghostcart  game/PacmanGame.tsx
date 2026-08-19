'use client';

/**
 * PacmanGame — CLI/terminal-styled Pac-Man for GhostCart's arcade.
 *
 * Drop-in client component. No external assets — everything is rendered as
 * text glyphs on a CSS grid so it reads as an 8-bit terminal game and stays
 * responsive at any viewport size.
 *
 * Rendering choice: Capital "C" for Pac-Man (rotated to face travel
 * direction, mouth animates by alternating glyph), colored "G" for ghosts.
 * A maze is generated procedurally (recursive-backtracker + braiding) so
 * it's always fully connected and playable, with a tunnel and a ghost house.
 *
 * @agent:none — safe to extend; game logic lives in the reducer below.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Dir = 'up' | 'down' | 'left' | 'right';
type Cell = 'wall' | 'floor';
type GhostMode = 'chase' | 'frightened' | 'eaten';
type Status = 'ready' | 'playing' | 'paused' | 'gameover' | 'won';

interface Point {
  x: number;
  y: number;
}

interface GhostDef {
  id: string;
  name: string;
  color: string;
  frightColor: string;
  personality: 'chaser' | 'ambusher' | 'flanker' | 'shy';
}

interface GhostState extends Point {
  dir: Dir;
  mode: GhostMode;
  frightBlink: boolean;
  homeX: number;
  homeY: number;
  startX: number;
  startY: number;
  eatenStreak: number;
}

interface MazeData {
  grid: Cell[][];
  width: number;
  height: number;
  houseX: number;
  houseY: number;
}

interface GameState {
  maze: MazeData;
  dots: Set<string>;
  pellets: Set<string>;
  totalDots: number;
  pacman: { x: number; y: number; dir: Dir; nextDir: Dir; mouthOpen: boolean };
  ghosts: GhostState[];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  status: Status;
  powerTimer: number;
  powerDuration: number;
  tick: number;
  message: string | null;
}

type Action =
  | { type: 'SET_DIRECTION'; dir: Dir }
  | { type: 'TICK' }
  | { type: 'START' }
  | { type: 'RESTART' }
  | { type: 'TOGGLE_PAUSE' };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROOMS_W = 10;
const ROOMS_H = 8;
const BASE_TICK_MS = 170;
const POWER_TICKS = 34; // ~5.8s at base speed
const GHOST_DEFS: GhostDef[] = [
  { id: 'blinky', name: 'BLINKY', color: '#ff3b3b', frightColor: '#3b6bff', personality: 'chaser' },
  { id: 'pinky', name: 'PINKY', color: '#ff9bd2', frightColor: '#3b6bff', personality: 'ambusher' },
  { id: 'inky', name: 'INKY', color: '#41e0ff', frightColor: '#3b6bff', personality: 'flanker' },
  { id: 'clyde', name: 'CLYDE', color: '#ffb347', frightColor: '#3b6bff', personality: 'shy' },
];

const DIR_VEC: Record<Dir, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };
const ALL_DIRS: Dir[] = ['up', 'down', 'left', 'right'];

// ---------------------------------------------------------------------------
// Maze generation (recursive backtracker + braiding for loops)
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateMaze(roomsW: number, roomsH: number, seed: number): MazeData {
  const rand = mulberry32(seed);
  const width = roomsW * 2 + 1;
  const height = roomsH * 2 + 1;
  const grid: Cell[][] = Array.from({ length: height }, () => Array(width).fill('wall'));
  const visited: boolean[][] = Array.from({ length: roomsH }, () => Array(roomsW).fill(false));

  // Iterative recursive-backtracker (avoids stack depth issues)
  const stack: Point[] = [{ x: 0, y: 0 }];
  visited[0][0] = true;
  grid[1][1] = 'floor';

  while (stack.length) {
    const cur = stack[stack.length - 1];
    const dirs = [...ALL_DIRS];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    let advanced = false;
    for (const d of dirs) {
      const v = DIR_VEC[d];
      const nx = cur.x + v.x;
      const ny = cur.y + v.y;
      if (nx >= 0 && nx < roomsW && ny >= 0 && ny < roomsH && !visited[ny][nx]) {
        visited[ny][nx] = true;
        grid[cur.y * 2 + 1 + v.y][cur.x * 2 + 1 + v.x] = 'floor';
        grid[ny * 2 + 1][nx * 2 + 1] = 'floor';
        stack.push({ x: nx, y: ny });
        advanced = true;
        break;
      }
    }
    if (!advanced) stack.pop();
  }

  // Braid ~16% of remaining interior walls to add loops (safe: only adds
  // edges to an already fully-connected graph, never disconnects it)
  for (let ry = 0; ry < roomsH; ry++) {
    for (let rx = 0; rx < roomsW; rx++) {
      if (rx < roomsW - 1) {
        const wx = rx * 2 + 2;
        const wy = ry * 2 + 1;
        if (grid[wy][wx] === 'wall' && rand() < 0.16) grid[wy][wx] = 'floor';
      }
      if (ry < roomsH - 1) {
        const wx = rx * 2 + 1;
        const wy = ry * 2 + 2;
        if (grid[wy][wx] === 'wall' && rand() < 0.16) grid[wy][wx] = 'floor';
      }
    }
  }

  // Ghost house: open a room at the center
  const houseX = Math.floor(width / 2);
  const houseY = Math.floor(height / 2);
  for (let y = houseY - 1; y <= houseY + 1; y++) {
    for (let x = houseX - 2; x <= houseX + 2; x++) {
      if (grid[y]?.[x] !== undefined) grid[y][x] = 'floor';
    }
  }
  if (grid[houseY - 2]?.[houseX] !== undefined) grid[houseY - 2][houseX] = 'floor';

  // Tunnel: open a mid row on both edges for wraparound travel
  const tunnelRow = houseY % 2 === 1 ? houseY : houseY + 1;
  grid[tunnelRow][0] = 'floor';
  grid[tunnelRow][1] = 'floor';
  grid[tunnelRow][width - 1] = 'floor';
  grid[tunnelRow][width - 2] = 'floor';

  return { grid, width, height, houseX, houseY };
}

function isFloor(maze: MazeData, x: number, y: number): boolean {
  if (y < 0 || y >= maze.height) return false;
  const wx = ((x % maze.width) + maze.width) % maze.width;
  return maze.grid[y][wx] === 'floor';
}

function nearestFloor(maze: MazeData, sx: number, sy: number): Point {
  const cx = Math.max(0, Math.min(maze.width - 1, sx));
  const cy = Math.max(0, Math.min(maze.height - 1, sy));
  if (isFloor(maze, cx, cy)) return { x: cx, y: cy };
  const seen = new Set<string>([`${cx},${cy}`]);
  const queue: Point[] = [{ x: cx, y: cy }];
  while (queue.length) {
    const p = queue.shift()!;
    for (const d of ALL_DIRS) {
      const v = DIR_VEC[d];
      const nx = p.x + v.x;
      const ny = p.y + v.y;
      const key = `${nx},${ny}`;
      if (nx < 0 || nx >= maze.width || ny < 0 || ny >= maze.height || seen.has(key)) continue;
      seen.add(key);
      if (isFloor(maze, nx, ny)) return { x: nx, y: ny };
      queue.push({ x: nx, y: ny });
    }
  }
  return { x: cx, y: cy };
}

function farthestFloorFrom(maze: MazeData, from: Point): Point {
  // BFS over the maze to find a floor cell with max graph distance from `from`.
  const dist = new Map<string, number>();
  const start = nearestFloor(maze, from.x, from.y);
  dist.set(`${start.x},${start.y}`, 0);
  const queue: Point[] = [start];
  let best = start;
  let bestDist = 0;
  while (queue.length) {
    const p = queue.shift()!;
    const d = dist.get(`${p.x},${p.y}`)!;
    if (d > bestDist) {
      bestDist = d;
      best = p;
    }
    for (const dir of ALL_DIRS) {
      const v = DIR_VEC[dir];
      let nx = p.x + v.x;
      const ny = p.y + v.y;
      nx = ((nx % maze.width) + maze.width) % maze.width;
      if (!isFloor(maze, nx, ny)) continue;
      const key = `${nx},${ny}`;
      if (!dist.has(key)) {
        dist.set(key, d + 1);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return best;
}

function buildLevel(level: number): { maze: MazeData; dots: Set<string>; pellets: Set<string>; pacmanStart: Point; ghostStart: Point } {
  const maze = generateMaze(ROOMS_W, ROOMS_H, 1000 + level * 977);
  const ghostStart = { x: maze.houseX, y: maze.houseY };
  const pacmanStart = farthestFloorFrom(maze, ghostStart);

  const dots = new Set<string>();
  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      if (maze.grid[y][x] !== 'floor') continue;
      const inHouse = Math.abs(x - maze.houseX) <= 2 && Math.abs(y - maze.houseY) <= 1;
      if (inHouse) continue;
      if (x === pacmanStart.x && y === pacmanStart.y) continue;
      dots.add(`${x},${y}`);
    }
  }

  const pellets = new Set<string>();
  const corners: Point[] = [
    { x: 0, y: 0 },
    { x: maze.width - 1, y: 0 },
    { x: 0, y: maze.height - 1 },
    { x: maze.width - 1, y: maze.height - 1 },
  ];
  for (const c of corners) {
    const p = nearestFloor(maze, c.x, c.y);
    const key = `${p.x},${p.y}`;
    pellets.add(key);
    dots.delete(key);
  }

  return { maze, dots, pellets, pacmanStart, ghostStart };
}

// ---------------------------------------------------------------------------
// Ghost AI helpers
// ---------------------------------------------------------------------------

function validGhostDirs(maze: MazeData, pos: Point, dir: Dir): Dir[] {
  const options = ALL_DIRS.filter((d) => {
    if (d === OPPOSITE[dir]) return false;
    const v = DIR_VEC[d];
    let nx = pos.x + v.x;
    const ny = pos.y + v.y;
    nx = ((nx % maze.width) + maze.width) % maze.width;
    return isFloor(maze, nx, ny);
  });
  if (options.length > 0) return options;
  // Dead end: reversing is the only legal move
  const v = DIR_VEC[OPPOSITE[dir]];
  let nx = pos.x + v.x;
  const ny = pos.y + v.y;
  nx = ((nx % maze.width) + maze.width) % maze.width;
  return isFloor(maze, nx, ny) ? [OPPOSITE[dir]] : [];
}

function ghostTarget(def: GhostDef, ghost: GhostState, state: GameState): Point {
  const pac = state.pacman;
  const pacVec = DIR_VEC[pac.dir];
  switch (def.personality) {
    case 'chaser':
      return { x: pac.x, y: pac.y };
    case 'ambusher':
      return { x: pac.x + pacVec.x * 4, y: pac.y + pacVec.y * 4 };
    case 'flanker': {
      const anchor = { x: pac.x + pacVec.x * 2, y: pac.y + pacVec.y * 2 };
      const ref = state.ghosts[0];
      return { x: anchor.x + (anchor.x - ref.x), y: anchor.y + (anchor.y - ref.y) };
    }
    case 'shy': {
      const dx = ghost.x - pac.x;
      const dy = ghost.y - pac.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) return { x: pac.x, y: pac.y };
      return { x: ghost.homeX, y: ghost.homeY };
    }
    default:
      return { x: pac.x, y: pac.y };
  }
}

function chooseGhostDir(
  maze: MazeData,
  ghost: GhostState,
  target: Point,
  mode: GhostMode,
  rand: () => number,
): Dir {
  const options = validGhostDirs(maze, ghost, ghost.dir);
  if (options.length === 0) return ghost.dir;
  if (options.length === 1) return options[0];

  if (mode === 'frightened' && rand() < 0.5) {
    return options[Math.floor(rand() * options.length)];
  }

  let best = options[0];
  let bestScore = mode === 'frightened' ? -Infinity : Infinity;
  for (const d of options) {
    const v = DIR_VEC[d];
    const nx = ghost.x + v.x;
    const ny = ghost.y + v.y;
    const dx = nx - target.x;
    const dy = ny - target.y;
    const distSq = dx * dx + dy * dy;
    if (mode === 'frightened') {
      if (distSq > bestScore) {
        bestScore = distSq;
        best = d;
      }
    } else if (distSq < bestScore) {
      bestScore = distSq;
      best = d;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function makeInitialState(level: number, score: number, highScore: number, lives: number): GameState {
  const { maze, dots, pellets, pacmanStart, ghostStart } = buildLevel(level);
  const ghosts: GhostState[] = GHOST_DEFS.map((def, i) => ({
    x: ghostStart.x + (i % 2 === 0 ? -1 : 1) * Math.ceil(i / 2),
    y: ghostStart.y,
    dir: 'up',
    mode: 'chase',
    frightBlink: false,
    homeX: 1 + (i % 2) * (maze.width - 3),
    homeY: 1 + (i < 2 ? 0 : maze.height - 3),
    startX: ghostStart.x + (i % 2 === 0 ? -1 : 1) * Math.ceil(i / 2),
    startY: ghostStart.y,
    eatenStreak: 0,
  }));

  return {
    maze,
    dots,
    pellets,
    totalDots: dots.size + pellets.size,
    pacman: { x: pacmanStart.x, y: pacmanStart.y, dir: 'left', nextDir: 'left', mouthOpen: true },
    ghosts,
    score,
    highScore,
    lives,
    level,
    status: 'ready',
    powerTimer: 0,
    powerDuration: POWER_TICKS,
    tick: 0,
    message: null,
  };
}

function resetPositions(state: GameState): GameState {
  const { maze } = state;
  const pacmanStart = farthestFloorFrom(maze, { x: maze.houseX, y: maze.houseY });
  return {
    ...state,
    pacman: { x: pacmanStart.x, y: pacmanStart.y, dir: 'left', nextDir: 'left', mouthOpen: true },
    ghosts: state.ghosts.map((g) => ({ ...g, x: g.startX, y: g.startY, mode: 'chase', dir: 'up' })),
    powerTimer: 0,
  };
}

const rngForTick = mulberry32(42);

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_DIRECTION':
      if (state.status !== 'playing' && state.status !== 'ready') return state;
      return { ...state, pacman: { ...state.pacman, nextDir: action.dir }, status: 'playing' };

    case 'START':
      return state.status === 'ready' ? { ...state, status: 'playing' } : state;

    case 'TOGGLE_PAUSE':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      return state;

    case 'RESTART':
      return makeInitialState(1, 0, state.highScore, 3);

    case 'TICK': {
      if (state.status !== 'playing') return state;
      const { maze } = state;
      let { x, y, dir, nextDir, mouthOpen } = state.pacman;

      const tryMove = (d: Dir, px: number, py: number): Point | null => {
        const v = DIR_VEC[d];
        let nx = px + v.x;
        const ny = py + v.y;
        nx = ((nx % maze.width) + maze.width) % maze.width;
        return isFloor(maze, nx, ny) ? { x: nx, y: ny } : null;
      };

      let moved = tryMove(nextDir, x, y);
      if (moved) {
        dir = nextDir;
      } else {
        moved = tryMove(dir, x, y);
      }
      if (moved) {
        x = moved.x;
        y = moved.y;
      }
      mouthOpen = !mouthOpen;

      let score = state.score;
      const dots = new Set(state.dots);
      const pellets = new Set(state.pellets);
      let powerTimer = state.powerTimer;
      let ghosts = state.ghosts;
      const key = `${x},${y}`;

      if (dots.has(key)) {
        dots.delete(key);
        score += 10;
      }
      if (pellets.has(key)) {
        pellets.delete(key);
        score += 50;
        powerTimer = state.powerDuration;
        ghosts = ghosts.map((g) =>
          g.mode === 'eaten' ? g : { ...g, mode: 'frightened', dir: OPPOSITE[g.dir] },
        );
      }

      // Move ghosts
      const nextGhosts: GhostState[] = ghosts.map((g, i) => {
        const def = GHOST_DEFS[i];
        // Frightened ghosts move at half speed for a readable powerup effect
        if (g.mode === 'frightened' && state.tick % 2 === 0) return g;

        if (g.mode === 'eaten') {
          const target = { x: maze.houseX, y: maze.houseY };
          const d = chooseGhostDir(maze, g, target, 'eaten', rngForTick);
          const v = DIR_VEC[d];
          let nx = g.x + v.x;
          const ny = g.y + v.y;
          nx = ((nx % maze.width) + maze.width) % maze.width;
          const arrived = Math.abs(nx - target.x) <= 1 && Math.abs(ny - target.y) <= 1;
          return { ...g, x: nx, y: ny, dir: d, mode: arrived ? 'chase' : 'eaten' };
        }

        const target = ghostTarget(def, g, { ...state, pacman: { x, y, dir, nextDir, mouthOpen } });
        const mode: GhostMode = g.mode === 'frightened' ? 'frightened' : 'chase';
        const d = chooseGhostDir(maze, g, target, mode, rngForTick);
        const v = DIR_VEC[d];
        let nx = g.x + v.x;
        const ny = g.y + v.y;
        nx = ((nx % maze.width) + maze.width) % maze.width;
        return { ...g, x: nx, y: ny, dir: d };
      });

      // Collisions
      let lives = state.lives;
      let status: Status = state.status;
      let ghostsAfterCollision = nextGhosts;
      let message: string | null = null;

      for (let i = 0; i < ghostsAfterCollision.length; i++) {
        const g = ghostsAfterCollision[i];
        const collided = g.x === x && g.y === y;
        if (!collided) continue;
        if (g.mode === 'frightened') {
          score += 200;
          ghostsAfterCollision = ghostsAfterCollision.map((gg, idx) =>
            idx === i ? { ...gg, mode: 'eaten' as GhostMode } : gg,
          );
        } else if (g.mode === 'chase') {
          lives -= 1;
          if (lives <= 0) {
            status = 'gameover';
          } else {
            const reset = resetPositions({ ...state, lives });
            return {
              ...reset,
              score,
              lives,
              status: 'playing',
              message: 'CAUGHT!',
            };
          }
        }
      }

      if (powerTimer > 0) {
        powerTimer -= 1;
        if (powerTimer === 0) {
          ghostsAfterCollision = ghostsAfterCollision.map((g) =>
            g.mode === 'frightened' ? { ...g, mode: 'chase' as GhostMode } : g,
          );
        }
      }

      const dotsLeft = dots.size + pellets.size;
      let level = state.level;
      let dotsFinal = dots;
      let pelletsFinal = pellets;
      let totalDots = state.totalDots;
      if (dotsLeft === 0 && status !== 'gameover') {
        level += 1;
        const next = buildLevel(level);
        return {
          ...state,
          maze: next.maze,
          dots: next.dots,
          pellets: next.pellets,
          totalDots: next.dots.size + next.pellets.size,
          pacman: { x: next.pacmanStart.x, y: next.pacmanStart.y, dir: 'left', nextDir: 'left', mouthOpen: true },
          ghosts: state.ghosts.map((g, i) => ({
            ...g,
            x: next.ghostStart.x,
            y: next.ghostStart.y,
            mode: 'chase',
          })),
          score,
          level,
          status: 'playing',
          powerTimer: 0,
          tick: state.tick + 1,
          message: 'LEVEL UP!',
        };
      }

      const highScore = Math.max(state.highScore, score);

      return {
        ...state,
        pacman: { x, y, dir, nextDir, mouthOpen },
        ghosts: ghostsAfterCollision,
        dots: dotsFinal,
        pellets: pelletsFinal,
        totalDots,
        score,
        highScore,
        lives,
        level,
        status,
        powerTimer,
        tick: state.tick + 1,
        message,
      };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DIR_ROTATION: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 };

export default function PacmanGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () =>
    makeInitialState(1, 0, 0, 3),
  );
  const [cellPx, setCellPx] = useState(20);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Game loop
  useEffect(() => {
    if (state.status !== 'playing') return;
    const speed = Math.max(90, BASE_TICK_MS - (state.level - 1) * 8);
    const id = setInterval(() => dispatch({ type: 'TICK' }), speed);
    return () => clearInterval(id);
  }, [state.status, state.level]);

  // Keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        W: 'up',
        S: 'down',
        A: 'left',
        D: 'right',
      };
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_PAUSE' });
        return;
      }
      if (e.key === 'Enter') {
        if (state.status === 'ready') dispatch({ type: 'START' });
        if (state.status === 'gameover' || state.status === 'won') dispatch({ type: 'RESTART' });
        return;
      }
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        dispatch({ type: 'SET_DIRECTION', dir });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.status]);

  // Responsive cell sizing — recompute on resize so the board fills the
  // available space without ever compacting past a legible minimum.
  useEffect(() => {
    const recompute = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const availW = el.clientWidth - 24;
      const availH = window.innerHeight * 0.62;
      const byWidth = Math.floor(availW / state.maze.width);
      const byHeight = Math.floor(availH / state.maze.height);
      const size = Math.max(11, Math.min(30, byWidth, byHeight));
      setCellPx(size);
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [state.maze.width, state.maze.height]);

  const move = useCallback((dir: Dir) => {
    dispatch({ type: 'SET_DIRECTION', dir });
  }, []);

  const cells = useMemo(() => {
    const out: React.ReactNode[] = [];
    const { maze, dots, pellets, pacman, ghosts } = state;
    const ghostAt = new Map<string, GhostState[]>();
    ghosts.forEach((g) => {
      const key = `${g.x},${g.y}`;
      const arr = ghostAt.get(key) ?? [];
      arr.push(g);
      ghostAt.set(key, arr);
    });

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const key = `${x},${y}`;
        const isWall = maze.grid[y][x] === 'wall';
        const isPacman = pacman.x === x && pacman.y === y;
        const ghostsHere = ghostAt.get(key);

        let content: React.ReactNode = null;
        let title = '';

        if (isPacman) {
          content = (
            <span
              className="pmglyph pac"
              style={{ transform: `rotate(${DIR_ROTATION[pacman.dir]}deg)` }}
            >
              {pacman.mouthOpen ? 'C' : 'O'}
            </span>
          );
          title = 'Pac-Man';
        } else if (ghostsHere && ghostsHere.length > 0) {
          const g = ghostsHere[0];
          const idx = state.ghosts.indexOf(g);
          const def = GHOST_DEFS[idx] ?? GHOST_DEFS[0];
          const frightened = g.mode === 'frightened';
          const eaten = g.mode === 'eaten';
          const flashing = frightened && state.powerTimer < 10 && state.powerTimer % 4 < 2;
          content = (
            <span
              className={`pmglyph ghost${eaten ? ' eaten' : ''}`}
              style={{
                color: eaten ? '#4a4a4a' : flashing ? '#ffffff' : frightened ? def.frightColor : def.color,
              }}
            >
              {eaten ? 'g' : 'G'}
            </span>
          );
          title = `${def.name}${frightened ? ' (vulnerable)' : eaten ? ' (returning)' : ''}`;
        } else if (isWall) {
          content = <span className="pmwall-block" />;
        } else if (pellets.has(key)) {
          content = <span className="pmglyph pellet">●</span>;
        } else if (dots.has(key)) {
          content = <span className="pmglyph pmdot">·</span>;
        }

        out.push(
          <div className={`pmcell${isWall ? ' pmwall' : ''}`} key={key} title={title}>
            {content}
          </div>,
        );
      }
    }
    return out;
  }, [state]);

  const dotsLeft = state.dots.size + state.pellets.size;

  return (
    <div className="pacman-arcade" ref={wrapperRef}>
      <div className="pmterm-window">
        <div className="pmterm-titlebar">
          <span className="pmdot red" />
          <span className="pmdot amber" />
          <span className="pmdot green" />
          <span className="pmterm-title">ghostcart://arcade/pacman</span>
        </div>

        <div className="pmhud">
          <div className="pmhud-item">
            <span className="pmhud-label">SCORE</span>
            <span className="pmhud-value">{String(state.score).padStart(5, '0')}</span>
          </div>
          <div className="pmhud-item">
            <span className="pmhud-label">HIGH</span>
            <span className="pmhud-value">{String(state.highScore).padStart(5, '0')}</span>
          </div>
          <div className="pmhud-item">
            <span className="pmhud-label">LEVEL</span>
            <span className="pmhud-value">{String(state.level).padStart(2, '0')}</span>
          </div>
          <div className="pmhud-item">
            <span className="pmhud-label">LIVES</span>
            <span className="pmhud-value">{'C '.repeat(Math.max(0, state.lives)).trim()}</span>
          </div>
          <div className="pmhud-item">
            <span className="pmhud-label">DOTS</span>
            <span className="pmhud-value">{dotsLeft}</span>
          </div>
        </div>

        <div className="pmboard-outer">
          <div
            className="pmboard"
            style={{
              gridTemplateColumns: `repeat(${state.maze.width}, ${cellPx}px)`,
              gridTemplateRows: `repeat(${state.maze.height}, ${cellPx}px)`,
              fontSize: `${Math.max(9, cellPx - 6)}px`,
            }}
          >
            {cells}
          </div>

          {state.powerTimer > 0 && (
            <div className="pmpower-banner">POWERUP ACTIVE — {Math.ceil(state.powerTimer / 6)}s</div>
          )}

          {state.status === 'ready' && (
            <div className="pmoverlay">
              <p className="pmoverlay-title">PAC-MAN.SH</p>
              <p>Arrow keys or WASD to move. Space to pause.</p>
              <button className="pmbtn" onClick={() => dispatch({ type: 'START' })}>
                PRESS ENTER TO START
              </button>
            </div>
          )}

          {state.status === 'paused' && (
            <div className="pmoverlay">
              <p className="pmoverlay-title">PAUSED</p>
              <button className="pmbtn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>
                RESUME
              </button>
            </div>
          )}

          {state.status === 'gameover' && (
            <div className="pmoverlay">
              <p className="pmoverlay-title">GAME OVER</p>
              <p>Final score: {state.score}</p>
              <button className="pmbtn" onClick={() => dispatch({ type: 'RESTART' })}>
                RESTART
              </button>
            </div>
          )}

          {state.status === 'won' && (
            <div className="pmoverlay">
              <p className="pmoverlay-title">MAZE CLEARED</p>
              <button className="pmbtn" onClick={() => dispatch({ type: 'RESTART' })}>
                PLAY AGAIN
              </button>
            </div>
          )}
        </div>

        <div className="pmcontrols">
          <div className="pmdpad" role="group" aria-label="Directional controls">
            <button aria-label="Up" className="pmdpad-btn up" onClick={() => move('up')}>
              ▲
            </button>
            <button aria-label="Left" className="pmdpad-btn left" onClick={() => move('left')}>
              ◀
            </button>
            <button aria-label="Down" className="pmdpad-btn down" onClick={() => move('down')}>
              ▼
            </button>
            <button aria-label="Right" className="pmdpad-btn right" onClick={() => move('right')}>
              ▶
            </button>
          </div>
          <button className="pmbtn pmghost-btn" onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}>
            {state.status === 'paused' ? 'RESUME' : 'PAUSE'}
          </button>
        </div>
      </div>

      <style>{`
        .pacman-arcade {
          width: 100%;
          display: flex;
          justify-content: center;
          padding: 12px;
          box-sizing: border-box;
        }
        .pmterm-window {
          width: 100%;
          max-width: 900px;
          background: #05070a;
          border: 1px solid #1b2a1f;
          border-radius: 10px;
          box-shadow: 0 0 0 1px rgba(70, 255, 150, 0.06), 0 24px 60px -20px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .pmterm-titlebar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          background: #0b0f0d;
          border-bottom: 1px solid #16221a;
        }
        .pmdot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
        }
        .pmdot.red {
          background: #ff5f57;
        }
        .pmdot.amber {
          background: #febc2e;
        }
        .pmdot.green {
          background: #28c840;
        }
        .pmterm-title {
          margin-left: 8px;
          color: #4f7a5b;
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        .pmhud {
          display: flex;
          flex-wrap: wrap;
          gap: 18px;
          padding: 12px 16px 4px;
          color: #7dffa0;
        }
        .pmhud-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 56px;
        }
        .pmhud-label {
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #3f6b4a;
        }
        .pmhud-value {
          font-size: 15px;
          font-weight: 700;
          color: #baffce;
          text-shadow: 0 0 8px rgba(120, 255, 160, 0.35);
        }
        .pmboard-outer {
          position: relative;
          display: flex;
          justify-content: center;
          padding: 14px;
        }
        .pmboard {
          display: grid;
          background: #000000;
          border: 2px solid #16321f;
          border-radius: 4px;
          box-shadow: inset 0 0 40px rgba(0, 255, 120, 0.05);
          line-height: 1;
        }
        .pmcell {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .pmcell.pmwall {
          background: repeating-linear-gradient(
            135deg,
            #0d2418,
            #0d2418 4px,
            #0a1c12 4px,
            #0a1c12 8px
          );
          border: 1px solid #163420;
        }
        .pmwall-block {
          width: 100%;
          height: 100%;
        }
        .pmglyph {
          font-weight: 800;
          user-select: none;
        }
        .pmglyph.pac {
          color: #ffe14d;
          text-shadow: 0 0 6px rgba(255, 225, 77, 0.6);
          display: inline-block;
        }
        .pmglyph.ghost {
          text-shadow: 0 0 6px currentColor;
        }
        .pmglyph.ghost.eaten {
          text-shadow: none;
          opacity: 0.6;
        }
        .pmglyph.pmdot {
          color: #3a5f42;
        }
        .pmglyph.pellet {
          color: #ffe14d;
          animation: pulse 0.9s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
        .pmpower-banner {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(59, 107, 255, 0.15);
          color: #9fc4ff;
          border: 1px solid rgba(159, 196, 255, 0.4);
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 11px;
          letter-spacing: 0.06em;
        }
        .pmoverlay {
          position: absolute;
          inset: 14px;
          background: rgba(2, 4, 3, 0.88);
          border: 1px solid #1f3a26;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #baffce;
          text-align: center;
          padding: 16px;
        }
        .pmoverlay-title {
          font-size: 20px;
          letter-spacing: 0.08em;
          color: #ffe14d;
          text-shadow: 0 0 10px rgba(255, 225, 77, 0.5);
          margin: 0;
        }
        .pmoverlay p {
          margin: 0;
          font-size: 12px;
          color: #7dffa0;
        }
        .pmbtn {
          background: #0c1f13;
          border: 1px solid #2a5c39;
          color: #baffce;
          padding: 8px 14px;
          border-radius: 4px;
          font-family: inherit;
          font-size: 12px;
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
        }
        .pmbtn:hover {
          background: #143a20;
        }
        .pmbtn:active {
          transform: scale(0.97);
        }
        .pmbtn:focus-visible {
          outline: 2px solid #7dffa0;
          outline-offset: 2px;
        }
        .pmcontrols {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px 16px;
          gap: 12px;
        }
        .pmdpad {
          display: grid;
          grid-template-columns: repeat(3, 34px);
          grid-template-rows: repeat(2, 34px);
          gap: 4px;
        }
        .pmdpad-btn {
          background: #0c1f13;
          border: 1px solid #2a5c39;
          color: #baffce;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
        }
        .pmdpad-btn:active {
          background: #143a20;
        }
        .pmdpad-btn.up {
          grid-column: 2;
          grid-row: 1;
        }
        .pmdpad-btn.left {
          grid-column: 1;
          grid-row: 2;
        }
        .pmdpad-btn.down {
          grid-column: 2;
          grid-row: 2;
        }
        .pmdpad-btn.right {
          grid-column: 3;
          grid-row: 2;
        }
        @media (max-width: 480px) {
          .pmhud {
            gap: 10px;
          }
          .pmhud-item {
            min-width: 44px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pmglyph.pellet {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
