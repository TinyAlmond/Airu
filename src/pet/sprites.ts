export interface SpriteDefinition {
  frames: ImageData[];
  fps: number;
}

export interface SpriteDefs {
  [state: string]: SpriteDefinition;
}

export const FRAME_WIDTH = 48;
export const FRAME_HEIGHT = 48;

// ─── palette ──────────────────────────────────────────────
const C: Record<string, [number, number, number, number]> = {
  ".": [0, 0, 0, 0],
  K: [30, 30, 30, 255],
  B: [85, 85, 155, 255],
  D: [65, 65, 125, 255],
  L: [110, 110, 185, 255],
  F: [240, 220, 185, 255],
  S: [215, 195, 160, 255],
  W: [255, 255, 255, 255],
  N: [40, 38, 35, 255],
  T: [70, 70, 135, 255],
  R: [180, 130, 80, 255],
};

const W_ = FRAME_WIDTH, H_ = FRAME_HEIGHT;
type Grid = string[][];

function empty(): Grid { return Array.from({ length: H_ }, () => Array(W_).fill(".")); }
function px(g: Grid, x: number, y: number, c: string) {
  if (x >= 0 && x < W_ && y >= 0 && y < H_) g[y][x] = c;
}
function hl(g: Grid, x: number, y: number, n: number, c: string) {
  for (let i = 0; i < n; i++) px(g, x + i, y, c);
}
function rect(g: Grid, x: number, y: number, w: number, h: number, c: string) {
  for (let j = 0; j < h; j++) hl(g, x, y + j, w, c);
}
function circle(g: Grid, cx: number, cy: number, r: number, c: string) {
  for (let y = cy - r; y <= cy + r; y++)
    for (let x = cx - r; x <= cx + r; x++)
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) px(g, x, y, c);
}
function ellipse(g: Grid, cx: number, cy: number, rx: number, ry: number, c: string) {
  for (let y = cy - ry; y <= cy + ry; y++)
    for (let x = cx - rx; x <= cx + rx; x++) {
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) px(g, x, y, c);
    }
}
function outline(g: Grid) {
  const marks: [number, number][] = [];
  for (let y = 0; y < H_; y++) for (let x = 0; x < W_; x++) {
    if (g[y][x] === ".") continue;
    if ([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax, ay]) =>
      ax < 0 || ax >= W_ || ay < 0 || ay >= H_ || g[ay][ax] === "."))
      marks.push([x, y]);
  }
  for (const [x, y] of marks) g[y][x] = "K";
}

function shiftY(g: Grid, dy: number): Grid {
  const e: string[] = Array(W_).fill(".");
  return Array.from({ length: H_ }, (_, y) => {
    const s = y - dy;
    return s >= 0 && s < H_ ? [...g[s]] : [...e];
  });
}

// ─── build Felyne ─────────────────────────────────────────
function buildBase(): Grid {
  const g = empty();
  const cx = 24;

  // Ears — narrow triangles, no side overhang
  for (let y = 1; y <= 11; y++) {
    const spread = Math.floor((y - 1) * 0.7);
    hl(g, 13 - spread, y, 1 + spread * 2, "B");
    hl(g, 34 - spread, y, 1 + spread * 2, "B");
  }
  for (let y = 4; y <= 9; y++) {
    const spread = Math.max(0, Math.floor((y - 3) * 0.5));
    hl(g, 13 - spread + 1, y, Math.max(1, spread * 2 - 1), "L");
    hl(g, 34 - spread + 1, y, Math.max(1, spread * 2 - 1), "L");
  }

  // Hood dome
  ellipse(g, cx, 18, 15, 13, "B");

  // Clip ear pixels that protrude beyond hood silhouette (smooth ears into dome)
  for (let y = 16; y >= 0; y--) {
    let curL = W_, curR = -1, belowL = W_, belowR = -1;
    for (let x = 0; x < W_; x++) {
      if (g[y][x] !== '.') { if (x < curL) curL = x; if (x > curR) curR = x; }
      if (g[y+1][x] !== '.') { if (x < belowL) belowL = x; if (x > belowR) belowR = x; }
    }
    if (belowL >= W_) continue;
    for (let x = curL; x < Math.min(belowL, curR + 1); x++) g[y][x] = '.';
    for (let x = Math.max(belowR + 1, curL); x <= curR; x++) g[y][x] = '.';
  }

  for (let y = 6; y <= 28; y++) for (let x = 0; x < W_; x++) {
    if (g[y][x] === "B" && x >= cx + 4) g[y][x] = "D";
    if (g[y][x] === "B" && y <= 13 && x <= cx - 4) g[y][x] = "L";
  }

  // Face
  ellipse(g, cx, 20, 9, 9, "F");
  for (let y = 11; y <= 29; y++) for (let x = 15; x <= 33; x++) {
    if (g[y][x] !== "F") continue;
    if ([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax, ay]) => {
      if (ay < 0 || ay >= H_ || ax < 0 || ax >= W_) return false;
      return "BDL".includes(g[ay][ax]);
    })) px(g, x, y, "S");
  }

  // Brown snout circle (under eyes and mouth)
  circle(g, 24, 22, 4, "R");

  // Eyes — black with crescent whites
  circle(g, 20, 19, 3, "K");
  px(g, 17, 19, "W"); px(g, 18, 20, "W"); px(g, 19, 20, "W");
  px(g, 18, 21, "W"); px(g, 19, 21, "W");

  circle(g, 28, 19, 3, "K");
  px(g, 31, 19, "W"); px(g, 29, 20, "W"); px(g, 30, 20, "W");
  px(g, 29, 21, "W"); px(g, 30, 21, "W");

  // Mouth (ω)
  px(g, 21, 23, "K"); px(g, 22, 24, "K"); px(g, 23, 24, "K");
  px(g, 24, 23, "K"); px(g, 25, 24, "K"); px(g, 26, 24, "K");
  px(g, 27, 23, "K");

  // Body
  ellipse(g, cx, 37, 10, 8, "B");
  for (let y = 30; y <= 45; y++) for (let x = cx + 3; x <= 35; x++) {
    if (g[y][x] === "B") g[y][x] = "D";
  }

  // (no belly — covered by suit)

  // Hands
  circle(g, 12, 34, 3, "F");
  circle(g, 36, 34, 3, "F");
  for (let y = 35; y <= 37; y++) {
    if (g[y]?.[10] === "F") px(g, 10, y, "S");
    if (g[y]?.[11] === "F") px(g, 11, y, "S");
    if (g[y]?.[37] === "F") px(g, 37, y, "S");
    if (g[y]?.[38] === "F") px(g, 38, y, "S");
  }

  // Feet
  ellipse(g, 20, 44, 3, 2, "F");
  ellipse(g, 28, 44, 3, 2, "F");

  outline(g);
  return g;
}

function buildBlink(): Grid {
  const g = buildBase();
  circle(g, 20, 19, 3, "F");
  circle(g, 28, 19, 3, "F");
  hl(g, 18, 19, 5, "K"); hl(g, 18, 20, 5, "K");
  hl(g, 26, 19, 5, "K"); hl(g, 26, 20, 5, "K");
  return g;
}

function buildWave(): Grid {
  const g = buildBase();
  circle(g, 12, 34, 3, "B");
  outline(g);
  circle(g, 13, 28, 3, "F");
  for (let y = 25; y <= 31; y++) for (let x = 10; x <= 16; x++) {
    if (g[y][x] === ".") continue;
    if ([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax, ay]) =>
      ax < 0 || ax >= W_ || ay < 0 || ay >= H_ || g[ay][ax] === "."))
      px(g, x, y, "K");
  }
  return g;
}

function toImageData(g: Grid): ImageData {
  const d = new Uint8ClampedArray(W_ * H_ * 4);
  for (let y = 0; y < H_; y++) for (let x = 0; x < W_; x++) {
    const c = C[g[y][x]] ?? C["."];
    const i = (y * W_ + x) * 4;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = c[3];
  }
  return new ImageData(d, W_, H_);
}

// ─── public API ───────────────────────────────────────────
export function loadPlaceholderSprites(): SpriteDefs {
  const base = buildBase();
  const idle1 = shiftY(base, 1);
  const idle2 = shiftY(base, -1);
  const blink = buildBlink();
  const wave = buildWave();

  return {
    idle: {
      frames: [base, idle1, base, idle2].map(toImageData),
      fps: 3,
    },
    walk: {
      frames: [base, idle1, base, idle2, base, idle1].map(toImageData),
      fps: 6,
    },
    sleep: {
      frames: [blink, shiftY(blink, 1), blink, shiftY(blink, -1)].map(toImageData),
      fps: 2,
    },
    talk: {
      frames: [wave, base].map(toImageData),
      fps: 4,
    },
    clicked: {
      frames: [base, blink].map(toImageData),
      fps: 4,
    },
    dragged: {
      frames: [base, base].map(toImageData),
      fps: 3,
    },
  };
}

// No longer needed but keep for compatibility
export async function loadSprites(): Promise<SpriteDefs> {
  return loadPlaceholderSprites();
}
