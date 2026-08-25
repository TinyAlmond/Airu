# Airu

Pixel-art Felyne (Monster Hunter) desktop pet with AI chat, available as a standalone Tauri app or a DeepSeek Harness plugin.

## DSH Plugin

A floating pixel-art Felyne pet for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web UI. The pet idles on your page, reacts to AI conversations, and can be dragged around.

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) installed:
  ```bash
  npm i -g @deepseek-ai/dsh
  ```

### Install

**From GitHub:**

```bash
dsh plugin --profile web add github:TinyAlmond/Airu/dsh-plugin-airu
```

**From source (local development):**

```bash
git clone https://github.com/TinyAlmond/Airu.git
cd Airu/dsh-plugin-airu
pnpm install
pnpm build
cd ..
dsh plugin --profile web add "link:./dsh-plugin-airu"
```

### Usage

```bash
dsh --profile web
```

Open http://127.0.0.1:3080 in your browser. The Felyne pet will appear in the bottom-left corner, draggable to any position. It automatically switches to a wave animation when the AI is responding.

### Uninstall

```bash
dsh plugin --profile web remove dsh-plugin-airu
```

## Tauri Desktop App

A standalone transparent borderless desktop pet for macOS and Windows.

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) >= 1.77.2
- [pnpm](https://pnpm.io/)

### Development

```bash
git clone https://github.com/TinyAlmond/Airu.git
cd Airu
pnpm install
pnpm tauri dev
```

### Features

- Transparent always-on-top window
- Pixel-art Felyne with idle/walk/sleep/talk/blink animations
- Drag to move anywhere on screen
- AI chat via DeepSeek API (click pet to open input)
- System tray menu

### Build

```bash
pnpm tauri build
```

Produces `.dmg` (macOS) or `.msi` (Windows) in `src-tauri/target/release/bundle/`.

## License

MIT
