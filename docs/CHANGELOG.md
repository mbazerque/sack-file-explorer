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

### Removed
- Removed native OS file picker (`@tauri-apps/plugin-dialog`) for a completely fully-internal and seamless navigation experience.
