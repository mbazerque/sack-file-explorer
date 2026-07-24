# File Explorer

A high-performance desktop file explorer built with Tauri v2, Rust, React, TypeScript, and Tailwind CSS.

## Overview

This project aims to provide a fast, modern, and native-feeling file explorer experience.
- **Frontend**: React + TypeScript + Tailwind CSS for a highly responsive, modern UI.
- **Backend**: Rust via Tauri for blazing fast file system operations and low memory footprint.
- **Communication**: Tauri IPC (Inter-Process Communication) enables seamless messaging between the web frontend and the native backend.

## Prerequisites

Make sure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [Rust & Cargo](https://www.rust-lang.org/tools/install)
- [Tauri OS Prerequisites](https://tauri.app/start/prerequisites/)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run in development mode:**
   ```bash
   npm run tauri dev
   ```

3. **Build the application for production:**
   ```bash
   npm run tauri build
   ```
