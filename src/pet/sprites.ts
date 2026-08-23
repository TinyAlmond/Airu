export interface SpriteDefinition {
  frames: ImageData[];
  fps: number;
}

export interface SpriteDefs {
  [state: string]: SpriteDefinition;
}

export const FRAME_WIDTH = 64;
export const FRAME_HEIGHT = 64;

// ─── animation row mapping (ginger cat sprite sheet) ──────
// Each entry: [row, startCol, frameCount]
const ANIMS = {
  idle:    { row: 14, cols: 3, fps: 3 },   // sit, tail wag
  walk:    { row:  4, cols: 6, fps: 8 },   // walk side
  sleep:   { row: 27, cols: 3, fps: 2 },   // lying rest
  talk:    { row: 12, cols: 8, fps: 6 },   // sit groom/gesture
  clicked: { row:  0, cols: 4, fps: 4 },   // sit 4 directions
  dragged: { row: 14, cols: 1, fps: 3 },   // sit static
} as const;

// ─── load sprite sheet & extract frames ───────────────────
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function extractFrame(
  sheet: HTMLImageElement,
  col: number,
  row: number,
): ImageData {
  const canvas = new OffscreenCanvas(FRAME_WIDTH, FRAME_HEIGHT);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    sheet,
    col * FRAME_WIDTH, row * FRAME_HEIGHT,
    FRAME_WIDTH, FRAME_HEIGHT,
    0, 0,
    FRAME_WIDTH, FRAME_HEIGHT,
  );
  return ctx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
}

function extractRow(
  sheet: HTMLImageElement,
  row: number,
  count: number,
): ImageData[] {
  const frames: ImageData[] = [];
  for (let c = 0; c < count; c++) {
    frames.push(extractFrame(sheet, c, row));
  }
  return frames;
}

export async function loadSprites(): Promise<SpriteDefs> {
  const sheet = await loadImage("/sprites/cat.png");
  const defs: SpriteDefs = {};
  for (const [state, cfg] of Object.entries(ANIMS)) {
    defs[state] = {
      frames: extractRow(sheet, cfg.row, cfg.cols),
      fps: cfg.fps,
    };
  }
  return defs;
}

// ─── fallback synchronous loader (placeholder) ───────────
export function loadPlaceholderSprites(): SpriteDefs {
  // Minimal 1-frame transparent placeholder while async loads
  const empty = new ImageData(FRAME_WIDTH, FRAME_HEIGHT);
  const single = { frames: [empty], fps: 1 };
  return {
    idle: single, walk: single, sleep: single,
    talk: single, clicked: single, dragged: single,
  };
}
