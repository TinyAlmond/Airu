const bubble = document.getElementById("chat-bubble")!;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

export function showBubble(text: string, duration = 8000) {
  if (hideTimer) clearTimeout(hideTimer);
  bubble.textContent = text;
  bubble.classList.remove("hidden");
  hideTimer = setTimeout(hideBubble, duration);
}

export function showThinking() {
  if (hideTimer) clearTimeout(hideTimer);
  bubble.textContent = "...";
  bubble.classList.remove("hidden");
}

export function hideBubble() {
  bubble.classList.add("hidden");
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}
