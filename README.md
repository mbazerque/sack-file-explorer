# Sack

Fast, modern desktop file explorer built with Tauri v2, Rust, and React.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue.svg?style=flat&logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange.svg?style=flat&logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## Key Features

- **Integrated PTY Terminal & CLI Tabs (v0.4.0 Release)**: Full Windows ConPTY terminal powered by `portable-pty` and `@xterm/xterm`. Supports terminal tabs (`Ctrl+Shift+T`), collapsible bottom terminal drawer (`Ctrl+J`), resize synchronization, and persistent shell sessions on tab switching.
- **Interactive Breadcrumb PathBar**: Interactive folder path segments, quick navigation to parent folders, edit mode input (`Ctrl+L`), and intelligent `...` dropdown for deep paths.
- **Advanced Sidebar & Subfolder Tree View**: Collapsible custom organizer groups, drag & drop folder pinning, system drives section with disk space progress bars, and VS Code-style lazy-loaded subfolder tree view via Rust IPC.
- **Advanced Context Menu & Group Management**: Contextual menu options to pin items to Quick Access, assign to existing custom groups, or create new groups on the fly.
- **Core File Operations**:
  - Multi-selection (`Ctrl+Click` for individual, `Shift+Click` for continuous ranges).
  - Internal Clipboard Context with `Ctrl+C` (copy) and `Ctrl+X` (cut with `opacity-50` visual attenuation).
  - Fast paste (`Ctrl+V`) via native Rust copy/move commands.
  - Inline renaming (`F2`) with automatic base-name selection excluding file extensions.
  - OS Recycle Bin deletion (`Delete` key) using native Windows `SHFileOperationW`.
- **Multi-Tab & Dual-Pane Split View**: Isolated tab browsing (`Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`) and side-by-side dual panel view (`Ctrl+\`) with cross-panel file transfer.
- **Async Rust Fast Search**: Real-time directory search powered by Rust threads, fuzzy matching score ranking, and debounced input (`Ctrl+F`).
- **Quick Preview Modal**: Instant file content preview (`Space`) for code, images, text, and metadata fallback.
- **Sleek Linear/Vercel Neutral Dark Theme**: Refined Zinc low-contrast palette (`#09090b` background, `#121215` panels, `#27272a` borders, `#f4f4f5` text).

---

## Tech Stack

| Layer             | Technology                          |
| ----------------- | ----------------------------------- |
| Frontend          | React 19 + TypeScript + Tailwind CSS|
| Desktop Framework | Tauri v2                            |
| Core Backend      | Rust (`portable-pty`, `ignore`)     |
| Terminal Engine   | xterm.js + ConPTY                   |
| Icons             | Lucide React                        |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust / Cargo](https://rustup.rs/) (latest stable)
- [Tauri system prerequisites](https://tauri.app/start/prerequisites/) for your OS

### Installation

```bash
git clone https://github.com/mbazerque/sack-file-explorer.git
cd sack-file-explorer
npm install
npm run tauri dev
```

### Production Build

```bash
npm run tauri build
```

---

## Architecture & Documentation

Detailed project documentation is available in the `docs/` directory:

- [Architecture](docs/ARCHITECTURE.md)
- [Changelog](docs/CHANGELOG.md)
- [Roadmap](docs/ROADMAP.md)

---

## Contributing

Contributions are welcome. Fork the repository, create a feature branch, and submit a pull request. Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## License

This project is licensed under the [MIT License](LICENSE).
