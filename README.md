# Sack File Explorer

Fast, modern desktop file explorer built with Tauri v2, Rust, and React.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)](https://opensource.org/licenses/MIT)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue.svg?style=flat&logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange.svg?style=flat&logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## Key Features

- Navigation system with back, forward, and parent directory buttons
- Breadcrumb-style address bar with direct path editing (`Ctrl+L`)
- Quick-access sidebar for core drives and system directories
- Interactive file table with column sorting (name, date, type, size)
- Developer context menu: copy path, open in terminal, delete with confirmation
- Keyboard shortcuts for common navigation and control actions
- Fixed status bar showing item count and selection metadata

---

## Tech Stack

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | React 19 + TypeScript + Tailwind CSS |
| Desktop Framework | Tauri v2                           |
| Core Backend     | Rust                                |
| Icons            | Lucide React                        |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust / Cargo](https://rustup.rs/) (latest stable)
- [Tauri system prerequisites](https://tauri.app/start/prerequisites/) for your OS

### Installation

```bash
git clone https://github.com/tu-usuario/file-explorer.git
cd file-explorer
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
