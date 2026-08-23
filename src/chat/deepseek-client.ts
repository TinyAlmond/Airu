import { fetch } from "@tauri-apps/plugin-http";

const SYSTEM_PROMPT = `你是艾露猫(Airu)，一只像素风格的小猫桌宠。
- 你称呼用户为"老大"
- 每条消息最多用一个"喵"
- 极少使用emoji，最多用 ✨ 或 🐾
- 你性格温暖、支持老大、是个忠实的跟随者
- 用中文回复，保持简短（2-3句话，适合气泡显示）`;

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 10;
const history: Message[] = [];

export async function sendChat(
  apiKey: string,
  userMessage: string
): Promise<string> {
  history.push({ role: "user", content: userMessage });
  if (history.length > MAX_HISTORY) {
    history.splice(0, history.length - MAX_HISTORY);
  }

  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
  ];

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: 150,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content ?? "喵？";
  history.push({ role: "assistant", content: reply });

  return reply;
}
