import { invoke } from "@tauri-apps/api/core";
import { updateApiKey } from "../chat/chat-input";

interface AppSettings {
  api_key: string | null;
}

const overlay = document.getElementById("settings-overlay")!;
const apiKeyInput = document.getElementById("api-key-input") as HTMLInputElement;
const saveBtn = document.getElementById("save-settings-btn")!;
const closeBtn = document.getElementById("close-settings-btn")!;

let onFirstSetup: (() => void) | null = null;

export function initSettings(onFirstKey?: () => void) {
  if (onFirstKey) onFirstSetup = onFirstKey;

  saveBtn.addEventListener("click", saveSettings);
  closeBtn.addEventListener("click", () => overlay.classList.add("hidden"));
}

export function showSettings() {
  loadCurrentKey();
  overlay.classList.remove("hidden");
}

async function loadCurrentKey() {
  const settings = await invoke<AppSettings>("load_settings");
  if (settings.api_key) {
    apiKeyInput.value = settings.api_key;
  }
}

async function saveSettings() {
  const key = apiKeyInput.value.trim();
  if (!key) return;

  await invoke("save_settings", {
    settings: { api_key: key },
  });
  updateApiKey(key);
  overlay.classList.add("hidden");

  if (onFirstSetup) {
    onFirstSetup();
    onFirstSetup = null;
  }
}

export async function getApiKey(): Promise<string | null> {
  const settings = await invoke<AppSettings>("load_settings");
  return settings.api_key ?? null;
}
