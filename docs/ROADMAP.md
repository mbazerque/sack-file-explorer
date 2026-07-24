# Roadmap

This document outlines the planned features and milestones for the File Explorer project.

## Phase 1: Core Navigation
- [ ] Implement real file system traversal in Rust (`scan_directory` implementation).
- [ ] Display file metadata (size, extension, modification date) in the UI.
- [ ] Add basic folder navigation (double-click to enter directory, back button).

## Phase 2: Performance & Indexing
- [ ] **Virtual Scroll**: Implement virtualized lists in React to handle thousands of items without UI lag.
- [ ] **Instant Search**: Create a Rust-based indexing service to allow instantaneous file searching.
- [ ] Implement asynchronous loading of directory contents to keep UI unblocked.

## Phase 3: Advanced UI & UX
- [ ] **Tab System**: Support multiple open tabs for concurrent directory viewing.
- [ ] **Themes**: Support light/dark mode and customizable color palettes.
- [ ] Context menus (Right-click) for file operations (Copy, Cut, Paste, Delete).

## Phase 4: Extended Features
- [ ] File previews (images, text files) within the application.
- [ ] Favorites and pinned folders in a sidebar.
- [ ] Custom keyboard shortcuts for power users.
