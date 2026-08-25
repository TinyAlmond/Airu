import { SpriteDefs, FRAME_WIDTH, FRAME_HEIGHT } from "./sprites";

export class SpriteRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private sprites: SpriteDefs;
  private currentState = "idle";
  private frameIndex = 0;
  private lastFrameTime = 0;
  private animId = 0;

  updateSprites(sprites: SpriteDefs) {
    this.sprites = sprites;
  }

  constructor(canvas: HTMLCanvasElement, sprites: SpriteDefs, scale = 3) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.sprites = sprites;

    this.canvas.width = FRAME_WIDTH * scale;
    this.canvas.height = FRAME_HEIGHT * scale;
    this.ctx.imageSmoothingEnabled = false;
  }

  play(state: string) {
    if (state === this.currentState) return;
    this.currentState = state;
    this.frameIndex = 0;
    this.lastFrameTime = 0;
  }

  start() {
    const loop = (time: number) => {
      this.animId = requestAnimationFrame(loop);
      const sprite = this.sprites[this.currentState];
      if (!sprite) return;

      const interval = 1000 / sprite.fps;
      if (time - this.lastFrameTime >= interval) {
        this.lastFrameTime = time;
        this.frameIndex = (this.frameIndex + 1) % sprite.frames.length;
        this.render(sprite.frames[this.frameIndex]);
      }
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    cancelAnimationFrame(this.animId);
  }

  private render(frame: ImageData) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // Draw ImageData to a temp canvas, then scale up
    const tmp = new OffscreenCanvas(FRAME_WIDTH, FRAME_HEIGHT);
    const tmpCtx = tmp.getContext("2d")!;
    tmpCtx.putImageData(frame, 0, 0);
    this.ctx.drawImage(tmp, 0, 0, this.canvas.width, this.canvas.height);
  }
}
