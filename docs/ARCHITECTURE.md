> **Note**: Every new feature, architecture change, or significant technical decision must be documented in this folder to maintain project clarity and onboarding ease.

# Architecture & Technical Design

This document details the software architecture of **Sack**, explaining the folder structure, component modularity, state management, reactive event synchronization, and native Rust IPC integration.

## Project Structure

```text
sack/
├── docs/                      # Architectural documentation, Roadmap, and Changelog
├── src/                       # React 19 + TypeScript Frontend
│   ├── components/            # Modularized UI Components
│   │   ├── TabBar.tsx         # Titlebar with tab management (<, >, refresh, split view toggle, new tab/terminal)
│   │   ├── Navbar.tsx         # Interactive breadcrumb pathbar, edit mode (Ctrl+L), fast search input
│   │   ├── Sidebar.tsx        # Collapsible groups, custom folders, drag & drop dropzones, lazy subfolder tree view & drives
│   │   ├── FileGrid.tsx       # Grid/Card view for files with icon-based visual layout, multi-selection & rename
│   │   ├── FileList.tsx       # Interactive metadata table view, multi-selection, inline rename (F2), sorting
│   │   ├── ContextMenu.tsx    # Right-click contextual menu (Pin to Quick Access, Add to Group, Rename, Delete)
│   │   ├── QuickPreviewModal.tsx # Fast file preview panel (Spacebar trigger) for code, images, text & metadata
│   │   ├── BottomTerminal.tsx # Collapsible bottom drawer terminal panel (Ctrl+J)
│   │   ├── TabTerminal.tsx    # Full tab terminal view with fit addon dimension synchronization
│   │   └── Footer.tsx         # Status bar displaying item counts, selected count & total size metadata
│   ├── context/               # React State Contexts
│   │   ├── TabContext.tsx     # Centralized multi-tab, panel focus, and split view state
│   │   └── ClipboardContext.tsx # Global clipboard state (Copy/Cut/Paste & visual opacity-50 cut attenuation)
│   ├── hooks/                 # Custom React Hooks
│   │   ├── useNavigation.ts   # Navigation state, history stack, multi-selection handlers (Ctrl/Shift+Click) & scan
│   │   └── useSearch.ts       # Asynchronous debounced Rust search integration & fuzzy matching scores
│   ├── utils/                 # Utility helpers & LocalStorage sync
│   │   └── sidebarStorage.ts  # Sidebar groups storage, item movement & `sack-sidebar-updated` event dispatch
│   ├── types/                 # TypeScript type declarations
│   │   └── file.ts            # FileItem, FileInfo, and SearchResult interface definitions
│   ├── App.tsx                # Main layout composition, global keyboard shortcuts (Ctrl+C/X/V/L/J, F2, Delete)
│   └── App.css                # Tailwind CSS directives & Linear/Vercel neutral dark theme variables
└── src-tauri/                 # Rust Backend (Tauri v2)
    ├── capabilities/          # ACL security permissions (default.json)
    ├── src/
    │   ├── search.rs          # Multi-threaded async file search implementation
    │   └── lib.rs             # Core Rust backend, ConPTY terminal master/slave lifecycle & IPC commands
    └── Cargo.toml             # Cargo package manifest, `portable-pty` & Rust dependencies
```

## Data Flow & Tauri IPC

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 React Frontend (TSX)                                   │
│                                                                                        │
│  [Navbar] ──> useNavigation / useSearch ──> [FileList / FileGrid] ──> [ContextMenu]        │
│       │                    │                     │    │              │                    │
│  Breadcrumb            `invoke()`           Multi-Select          Pin / Group              │
│  & Search              IPC Call             & Inline Rename      Management               │
└────────────────────────────┬──────────────────────────────────────┬────────────────────┘
                             │ IPC Communication                    │ Event Sync
┌────────────────────────────▼──────────────────────────────────────▼────────────────────┐
│                                 Rust Backend (lib.rs)                                  │
│                                                                                        │
│  - scan_directory(path)               -> Vec<FileItem>                                 │
│  - open_in_terminal(path)             -> Result<(), String>                            │
│  - delete_item(path)                  -> Result<(), String>                            │
│  - copy_item(src, dst_dir)            -> Result<(), String>                            │
│  - move_item(src, dst_dir)            -> Result<(), String>                            │
│  - rename_item(old_path, new_path)    -> Result<(), String>                            │
│  - trash_item(path)                   -> Result<(), String> (Windows Recycle Bin)      │
│  - search_files(path, query, fuzzy)   -> Vec<FileInfo>                                 │
│  - read_file_content(path)            -> Result<String, String>                        │
│  - get_system_drives()                -> Result<Vec<DriveItem>, String>                │
│  - create_terminal_session(id, cwd)   -> Result<(), String> (ConPTY session)           │
│  - write_terminal_data(id, data)      -> Result<(), String>                            │
│  - resize_terminal(id, cols, rows)    -> Result<(), String>                            │
│  - close_terminal_session(id)         -> Result<(), String>                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## Key Technical Decisions

- **ConPTY Terminal Session Management (`portable-pty`)**: Rust creates native PTY master/slave pairs, streaming raw input/output between `xterm.js` and PowerShell without manual character filtering, maintaining cursor position and enter/backspace escape codes cleanly.
- **DOM Event-Driven Sidebar Sync (`sack-sidebar-updated`)**: Changes to favorites or custom groups emit a global CustomEvent to reactively re-render `Sidebar.tsx` and `ContextMenu.tsx` without needing heavy prop drilling.
- **Typed Contract (`FileItem` & `DriveItem`)**: Frontend and backend share exact data schemas, avoiding raw string parsing or unhandled properties.
- **Native OS Recycle Bin (`SHFileOperationW`)**: Deleting items via <kbd>Delete</kbd> invokes Windows Shell API (`FOF_ALLOWUNDO`) to safely move items to `$Recycle.Bin`.
- **Client-Side & Async Server Search**: Directory entries are sorted in memory for instant header column clicks, while deep directory searches run off-thread in Rust.
