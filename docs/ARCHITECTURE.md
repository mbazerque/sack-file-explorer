> **Note**: Every new feature, architecture change, or significant technical decision must be documented in this folder to maintain project clarity and onboarding ease.

# Architecture & Technical Design

This document details the software architecture of **Sack**, explaining the folder structure, component modularity, state management, and native Rust IPC integration.

## Project Structure

```text
sack/
├── docs/                      # Architectural documentation, Roadmap, and Changelog
├── src/                       # React 19 + TypeScript Frontend
│   ├── components/            # Modularized UI Components
│   │   ├── Navbar.tsx         # Address bar, navigation buttons (<, >, ⬆), keyboard shortcuts
│   │   ├── Sidebar.tsx        # Quick access locations (Home, Documents, Downloads, Drives)
│   │   ├── FileList.tsx       # Interactive metadata table view, sorting, selection
│   │   ├── ContextMenu.tsx    # Floating right-click menu (Copy path, Terminal, Delete)
│   │   └── Footer.tsx         # Status bar displaying file counts and selection details
│   ├── hooks/                 # Custom React Hooks
│   │   └── useNavigation.ts   # Centralized navigation state, history stack, selection & scan handlers
│   ├── types/                 # TypeScript type declarations
│   │   └── file.ts            # FileItem interface definition
│   ├── App.tsx                # Main layout composition and global keyboard shortcuts
│   └── App.css                # Tailwind CSS directives
└── src-tauri/                 # Rust Backend (Tauri v2)
    ├── capabilities/          # ACL security permissions (default.json)
    ├── src/
    │   └── lib.rs             # Core Rust backend & exposed IPC commands
    └── Cargo.toml             # Cargo package manifest & Rust dependencies
```

## Data Flow & Tauri IPC

```
┌───────────────────────────────────────────────────────────┐
│                    React Frontend (TSX)                   │
│                                                           │
│  [Navbar] ──> useNavigation Hook ──> [FileList]          │
│       │               │                   │               │
│  Navigation       `invoke()`         Row Select           │
│  Back / Forward       │               & Sorting           │
└───────────────────────┼───────────────────────────────────┘
                        │ IPC Communication
┌───────────────────────▼───────────────────────────────────┐
│                    Rust Backend (lib.rs)                  │
│                                                           │
│  - scan_directory(path)  -> Vec<FileItem>                 │
│  - open_in_terminal(path) -> Result<(), String>           │
│  - delete_item(path)     -> Result<(), String>           │
└───────────────────────────────────────────────────────────┘
```

1. **User Interaction**: The user clicks a folder, types a path, or uses keyboard shortcuts (<kbd>Backspace</kbd>, <kbd>F5</kbd>, <kbd>Ctrl+L</kbd>).
2. **IPC Invocation**: React calls `invoke('scan_directory', { path })`.
3. **Native Execution**: The Rust backend accesses `std::fs::read_dir`, collects metadata (`is_dir`, `size`, `modified_at`), sorts folders first, and returns a `Vec<FileItem>`.
4. **UI Rendering**: React receives the typed JSON array and updates the component state inside `FileList.tsx`.

## Key Technical Decisions

- **Typed Contract (`FileItem`)**: Frontend and backend share an identical data shape (`name`, `is_dir`, `size`, `modified_at`), avoiding raw string parsing or unhandled properties.
- **Client-Side Sorting**: Directory entries are sorted in memory for instant feedback when toggling column headers without extra IPC roundtrips.
- **Contextual Actions**: Right-click context actions (`open_in_terminal`, `delete_item`) directly invoke native Rust system commands for maximum compatibility and performance.
