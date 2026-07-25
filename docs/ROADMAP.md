# Roadmap

This document outlines the planned features and milestones for the Sack project.

## Phase 1: Core UI Base & Navigation [COMPLETED]
- [x] Implement real file system traversal in Rust (`scan_directory` returning `FileItem` objects).
- [x] Display complete file metadata (size, file type, modification date) in an interactive table view.
- [x] Navigation controls: Back (`<`), Forward (`>`), Up (`⬆`), address bar (`Ctrl+L`), and history stack.
- [x] Column header sorting (Name, Date, Type, Size).
- [x] Sidebar quick access to user directories and drives with Lucide React icons.
- [x] Right-click context menu (Copy path, Open in terminal, Delete item).
- [x] Keyboard shortcuts (`Backspace` to go back, `F5` to refresh).
- [x] Fixed status footer with total item counters and selected item state.

## Phase 2: Multi-Tabs & Accelerated Search [COMPLETED]
- [x] **Multi-Tab System**: Support multiple directory tabs in the top bar with isolated tab state, `TabBar.tsx` UI, horizontal wheel scroll, dynamic tab widths, and keyboard shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`).
- [x] **Async Rust Search**: Real-time asynchronous directory search powered by Rust thread pools (`ignore` crate + fuzzy matching + UI debounce + `Ctrl+F` / `Ctrl+P`).
- [x] **Dual-Pane Split View**: Split view layout with isolated navigation, panel focus, tab integration, and cross-panel copy/move context actions (`Ctrl+\`).

## Phase 3: Quick Preview & Custom Titlebar [COMPLETED]
- [x] **Quick Preview**: Pressing Spacebar opens a fast preview panel for text, images, and code files with metadata fallback (`Space` / `Esc`).
- [x] **Custom Window Frame & Titlebar**: Frameless window (`decorations: false`), native window controls (Minimize, Maximize, Close), and full-width drag region.
- [x] **Full-Width Edge-to-Edge Layout**: Refactored layout where Header and Footer span 100% of window width above and below the central Sidebar.
- [ ] **Git Status Integration**: Visual indicators showing Git status (modified, untracked, ignored) on files and folders.
- [ ] **Drag and Drop**: Reordering, moving, and copying files via native drag-and-drop.

## Phase 4: Customization & Indexing
- [ ] Global file indexing service built in Rust for instant system-wide file search.
- [ ] Customizable theme system (Light/Dark themes, accent color selection).
- [ ] User configurable pinned favorites in the sidebar.
