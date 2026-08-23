import { sendChat } from "./deepseek-client";
import { showBubble, showThinking, hideBubble } from "./chat-bubble";
import { PetStateMachine } from "../pet/state-machine";

const container = document.getElementById("chat-input-container")!;
const input = document.getElementById("chat-input") as HTMLInputElement;

let apiKey = "";
let fsm: PetStateMachine;

export function initChatInput(stateMachine: PetStateMachine, key: string) {
  fsm = stateMachine;
  apiKey = key;

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      const msg = input.value.trim();
      input.value = "";
      hideInput();
      fsm.transition("chatStart");
      showThinking();
      try {
        const reply = await sendChat(apiKey, msg);
        showBubble(reply);
      } catch (err) {
        showBubble("API 出错了，老大检查一下 key 喵...");
        console.error(err);
      }
      // Auto-end chat after bubble hides
      setTimeout(() => fsm.transition("chatEnd"), 9000);
    } else if (e.key === "Escape") {
      hideInput();
      hideBubble();
      fsm.transition("chatEnd");
    }
  });
}

export function updateApiKey(key: string) {
  apiKey = key;
}

export function showInput() {
  container.classList.remove("hidden");
  input.focus();
}

export function hideInput() {
  container.classList.add("hidden");
  input.value = "";
}
