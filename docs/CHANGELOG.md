# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] / v0.1.0

### Added
- Initial project structure with Tauri v2, React, TypeScript, and Tailwind CSS.
- Real `scan_directory` Rust command utilizing `std::fs::read_dir`.
- Documentation structure (`ARCHITECTURE.md`, `ROADMAP.md`, `CHANGELOG.md`).
- Developer-focused smart address bar with Ctrl+L shortcut to focus path input.
- Sidebar with quick access to standard paths (Home, Documents, Downloads, C: Drive).
- Modular frontend architecture separating UI into `Navbar.tsx`, `Sidebar.tsx`, and `FileList.tsx`.
- Centralized navigation state and history management via custom `useNavigation` hook.
- Interactive table sorting by clicking column headers (Name, Modified Date, Type, Size) with indicator arrows.
- Double-click folder navigation and single-click row selection highlighting.
- Right-click Context Menu for files/directories with "Copiar ruta", "Abrir en terminal", and "Eliminar" actions.
- Keyboard shortcuts: `Backspace` to navigate back, `F5` to refresh directory, and `Ctrl+L` to focus address bar.
- Fixed footer displaying total items, folders, files count, and currently selected item details.
- Lucide React icons representing folders, drives, and file types based on extension.
- Added `open_in_terminal` and `delete_item` Rust commands in backend.

### Removed
- Removed native OS file picker (`@tauri-apps/plugin-dialog`) for a completely fully-internal and seamless navigation experience.
