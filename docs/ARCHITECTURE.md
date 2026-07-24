> **Note**: Every new feature, architecture change, or significant technical decision must be documented in this folder to maintain project clarity and onboarding ease.

# Architecture & Design

This document details the architecture of the File Explorer, explaining folder structures, data flow, and key technical design decisions.

## Folder Structure

- `/src`: Contains the React/TypeScript frontend.
  - `App.tsx`: Main UI component, handles the layout and search inputs.
  - `App.css`: Main stylesheet containing Tailwind CSS directives.
- `/src-tauri`: Contains the Rust backend for the Tauri application.
  - `src/lib.rs`: The core Tauri backend logic, including all exposed Rust commands (e.g., `scan_directory`).
  - `tauri.conf.json`: Tauri configuration (app identifiers, window settings, build scripts).
- `/docs`: Project documentation, including roadmap and changelog.

## Data Flow (Rust & React)

1. **User Interaction**: The user enters a directory path in the React frontend.
2. **IPC Invocation**: React calls `invoke('scan_directory', { path })`.
3. **Native Execution**: The Rust backend receives the IPC call, accesses the native file system, processes the data, and returns a response.
4. **UI Update**: React receives the payload (`Vec<String>` from Rust) and updates the component state, rendering the new data.

## Technical Design Decisions

- **Indexing**: To be implemented natively in Rust to offload heavy file traversal from the main thread, keeping the UI completely responsive.
- **RAM Management**: Rust handles file metadata structures. Only the necessary data to display the current view (or the active virtual scroll window) is sent over IPC to the frontend to minimize memory bloat.
