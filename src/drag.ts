import { getCurrentWindow } from "@tauri-apps/api/window";
import { PetStateMachine } from "./pet/state-machine";

export function setupDrag(canvas: HTMLCanvasElement, fsm: PetStateMachine) {
  const appWindow = getCurrentWindow();

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    fsm.transition("dragStart");
    appWindow.startDragging();
  });

  canvas.addEventListener("mouseup", () => {
    if (fsm.state === "dragged") {
      fsm.transition("dragEnd");
    }
  });
}
