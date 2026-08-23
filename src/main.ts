import { loadPlaceholderSprites, loadSprites } from "./pet/sprites";
import { SpriteRenderer } from "./pet/sprite-renderer";
import { PetStateMachine } from "./pet/state-machine";
import { setupDrag } from "./drag";
import { initChatInput, showInput } from "./chat/chat-input";
import { initSettings, showSettings, getApiKey } from "./settings/settings-ui";

const canvas = document.getElementById("pet-canvas") as HTMLCanvasElement;

// Start with placeholder, then load real sprites async
const renderer = new SpriteRenderer(canvas, loadPlaceholderSprites());
const fsm = new PetStateMachine();

fsm.onStateChange((_from, to) => {
  renderer.play(to);
});

renderer.start();
setupDrag(canvas, fsm);

// Load real sprite sheet
loadSprites().then((sprites) => {
  renderer.updateSprites(sprites);
});

// Handle click → show chat input
canvas.addEventListener("click", () => {
  if (fsm.state === "idle" || fsm.state === "walk" || fsm.state === "sleep") {
    fsm.transition("click");
    showInput();
  }
});

// Initialize settings and chat
async function init() {
  const apiKey = await getApiKey();

  initSettings(() => {
    getApiKey().then((key) => {
      if (key) initChatInput(fsm, key);
    });
  });

  if (apiKey) {
    initChatInput(fsm, apiKey);
  } else {
    showSettings();
  }
}

init();
