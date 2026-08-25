# dsh-plugin-airu

Floating pixel-art Felyne (Monster Hunter) pet for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web UI.

## Install

```bash
dsh plugin --profile web add github:TinyAlmond/Airu/dsh-plugin-airu
```

## Features

- Pixel-art Felyne rendered on canvas, floating over the DSH web UI
- Idle breathing animation
- Wave animation when AI is responding
- Drag to reposition (position persists across sessions)

## Local Development

```bash
git clone https://github.com/TinyAlmond/Airu.git
cd Airu/dsh-plugin-airu
pnpm install
pnpm build
dsh plugin --profile web add "link:$(pwd)"
dsh --profile web
```

## Uninstall

```bash
dsh plugin --profile web remove dsh-plugin-airu
```

## License

MIT
