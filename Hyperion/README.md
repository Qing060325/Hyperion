# Hyperion

<p align="center">
  <img src="public/icons/favicon.svg" alt="Hyperion" width="64" height="64" />
</p>

<h3 align="center">Hyperion — Clash Kernel Frontend</h3>

<p align="center">
  A modern, high-performance desktop frontend for Clash Meta kernel.
</p>

<p align="center">
  Built with <strong>SolidJS</strong> + <strong>Tauri 2.0</strong> + <strong>TypeScript</strong>
</p>

---

## Features

- **Proxy Management** — Node switching, batch latency testing, sorting, filtering
- **Connection Monitoring** — Real-time connection list with filtering and management
- **Traffic Visualization** — Canvas-based real-time traffic charts
- **Rule Management** — Rule list view, search, rule provider management
- **Real-time Logs** — WebSocket-powered log stream with level filtering
- **Configuration** — Config management, proxy providers, GeoIP updates
- **DNS Tools** — DNS query, Fake-IP cache management
- **Subscription** — Subscription management with traffic display
- **System Integration** — TUN mode, system proxy, service mode (via Tauri)
- **i18n** — Chinese and English support
- **Themes** — Dark/Light/System theme switching

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Tauri 2.0 (Rust) |
| Frontend | SolidJS + TypeScript |
| Styling | Tailwind CSS 4.0 |
| Build | Vite 6 |
| Charts | Canvas API |
| Icons | Custom SVG |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 8
- [Rust](https://rustup.rs/) >= 1.70
- Tauri system dependencies (see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/))

### Install

```bash
pnpm install
```

### Development

```bash
pnpm tauri:dev
```

### Build

```bash
pnpm tauri:build
```

## Design

Hyperion features a **dark cyberpunk aesthetic** with:
- Deep blue-black background (`#0a0e1a`)
- Cyan (`#06b6d4`) and purple (`#8b5cf6`) neon accents
- Glassmorphism effects
- Glow-on-hover interactions
- Custom window decorations

## License

MIT
