export function isDimmedItem(name: string): boolean {
  return name.startsWith(".") || name.toLowerCase() === "node_modules";
}

export function isHiddenItem(name: string): boolean {
  return name.startsWith(".");
}

import { openPath } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";

export async function openFileWithDefaultApp(fullPath: string): Promise<void> {
  const normalizedPath = fullPath.replace(/\//g, "\\");
  try {
    await invoke("open_file_default", { path: normalizedPath });
  } catch (err) {
    console.warn("open_file_default Rust command failed, trying openPath plugin:", err);
    await openPath(normalizedPath);
  }
}

