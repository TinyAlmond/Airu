export type PetState = "idle" | "walk" | "sleep" | "talk" | "clicked" | "dragged";
export type PetEvent = "tick" | "click" | "dragStart" | "dragEnd" | "chatStart" | "chatEnd";

type StateChangeCallback = (from: PetState, to: PetState) => void;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class PetStateMachine {
  state: PetState = "idle";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: StateChangeCallback[] = [];

  constructor() {
    this.scheduleAutoTransition();
  }

  onStateChange(cb: StateChangeCallback) {
    this.callbacks.push(cb);
  }

  transition(event: PetEvent) {
    const prev = this.state;
    switch (this.state) {
      case "idle":
        if (event === "click") this.setState("clicked");
        else if (event === "dragStart") this.setState("dragged");
        else if (event === "tick") {
          // Random auto-transition
          const r = Math.random();
          if (r < 0.5) this.setState("walk");
          else this.setState("sleep");
        }
        break;
      case "walk":
        if (event === "click") this.setState("clicked");
        else if (event === "dragStart") this.setState("dragged");
        else if (event === "tick") this.setState("idle");
        break;
      case "sleep":
        if (event === "click") this.setState("clicked");
        else if (event === "dragStart") this.setState("dragged");
        else if (event === "tick") this.setState("idle");
        break;
      case "clicked":
        if (event === "chatStart") this.setState("talk");
        else if (event === "tick") this.setState("idle");
        else if (event === "dragStart") this.setState("dragged");
        break;
      case "talk":
        if (event === "chatEnd") this.setState("idle");
        else if (event === "dragStart") this.setState("dragged");
        break;
      case "dragged":
        if (event === "dragEnd") this.setState("idle");
        break;
    }
    if (this.state !== prev) {
      this.callbacks.forEach((cb) => cb(prev, this.state));
    }
  }

  private setState(state: PetState) {
    this.state = state;
    this.clearTimer();
    this.scheduleAutoTransition();
  }

  private scheduleAutoTransition() {
    this.clearTimer();
    let delay: number;
    switch (this.state) {
      case "idle":
        delay = randomBetween(5000, 15000);
        break;
      case "walk":
        delay = randomBetween(3000, 8000);
        break;
      case "sleep":
        delay = randomBetween(10000, 20000);
        break;
      case "clicked":
        delay = 1500;
        break;
      default:
        return; // No auto-transition for talk/dragged
    }
    this.timer = setTimeout(() => this.transition("tick"), delay);
  }

  private clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy() {
    this.clearTimer();
    this.callbacks = [];
  }
}
