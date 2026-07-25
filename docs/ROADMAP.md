# Roadmap

This document outlines the planned features and milestones for the Sack project.

## Phase 1: Core UI Base & Navigation [COMPLETED]
- [x] Real file system traversal in Rust (`scan_directory` returning `FileItem` objects).
- [x] Complete file metadata (size, file type, modification date) in an interactive table view.
- [x] Navigation controls: Back (`<`), Forward (`>`), Up (`⬆`), address bar (`Ctrl+L`), and history stack.
- [x] Column header sorting (Name, Date, Type, Size).
- [x] Quick access sidebar for core drives and system directories with Lucide React icons.
- [x] Context menu (Copy path, Open in terminal, Delete item).
- [x] Keyboard shortcuts (`Backspace` to go back, `F5` to refresh).
- [x] Status footer displaying total item counters and selected item details.

## Phase 2: Multi-Tabs & Accelerated Search [COMPLETED]
- [x] **Multi-Tab System**: Support multiple directory tabs with isolated tab state, `TabBar.tsx` UI, horizontal wheel scroll, dynamic tab widths, and keyboard shortcuts (`Ctrl+T`, `Ctrl+W`, `Ctrl+Tab`).
- [x] **Async Rust Search**: Real-time asynchronous directory search powered by Rust thread pools (`ignore` crate + fuzzy matching + UI debounce + `Ctrl+F`).
- [x] **Dual-Pane Split View**: Split view layout with isolated navigation, panel focus, tab integration, and cross-panel copy/move context actions (`Ctrl+\`).

## Phase 3: Integrated ConPTY Terminal & Advanced Sidebar [COMPLETED]
- [x] **ConPTY Terminal Release (v0.4.0)**: Integrated Windows PTY terminal using `portable-pty` and `@xterm/xterm`, terminal tabs (`Ctrl+Shift+T`), bottom drawer (`Ctrl+J`), and dimension synchronization.
- [x] **Interactive Breadcrumb PathBar**: Clickable folder path segments, inline path edit mode (`Ctrl+L`), and intelligent `...` dropdown for deep paths.
- [x] **Advanced Sidebar & Subfolder Tree View**: Collapsible custom groups, drag & drop folder pinning, system drives section with disk space progress bars, and VS Code-style lazy-loaded subfolder tree view.
- [x] **Context Menu & Group Assignment**: Pin items to Quick Access, assign to existing groups, and on-the-fly group creation modal.

## Phase 4: Core File Operations & Sleek Dark Theme [COMPLETED]
- [x] **Multi-Selection**: Support `Ctrl+Click` for individual selection and `Shift+Click` for continuous range selection.
- [x] **Internal Clipboard**: Context-based `Ctrl+C` (copy) and `Ctrl+X` (cut with `opacity-50` visual attenuation), and fast `Ctrl+V` pasting.
- [x] **Inline Renaming (`F2`)**: Inline cell editing with automatic base-name selection excluding extensions.
- [x] **OS Recycle Bin Deletion (`Delete`)**: Native Windows `$Recycle.Bin` deletion via `SHFileOperationW`.
- [x] **Sleek Linear/Vercel Neutral Dark Theme**: Zinc 950/900/800 dark palette definition.

## Phase 5: Advanced Indexing & Extensions [FUTURE]
- [ ] Global file indexing service built in Rust for instant system-wide search.
- [ ] Git status indicators (modified, untracked, ignored) on files and folders.
- [ ] Plugin extension API for custom file previews and context actions.
