import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileItem } from "../types/file";

export function getParentPath(pathStr: string): string | null {
  const normalized = pathStr.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized || normalized.endsWith(":") || normalized === "/") return null;
  const lastSlashIndex = normalized.lastIndexOf("/");
  if (lastSlashIndex === -1) return null;
  if (lastSlashIndex === 0) return "/";
  const parent = normalized.slice(0, lastSlashIndex);
  if (parent.endsWith(":")) return parent + "/";
  return parent;
}

export function useNavigation(initialPath: string = "C:/") {
  const [history, setHistory] = useState<string[]>([initialPath]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPath = history[historyIndex] || initialPath;

  const fetchDirectory = useCallback(async (targetPath: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setSelectedItem(null);
    try {
      const result = await invoke<FileItem[]>("scan_directory", { path: targetPath });
      setFiles(result);
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err));
      setFiles([]);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchDirectory(currentPath);
  }, [currentPath, fetchDirectory]);

  const scanPath = useCallback(
    async (targetPath: string) => {
      if (!targetPath.trim()) return;
      const normalizedPath = targetPath.replace(/\\/g, "/");

      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        newHistory.push(normalizedPath);
        return newHistory;
      });
      setHistoryIndex((prevIndex) => prevIndex + 1);
      await fetchDirectory(normalizedPath);
    },
    [historyIndex, fetchDirectory]
  );

  const goBack = useCallback(async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const targetPath = history[newIndex];
      await fetchDirectory(targetPath);
    }
  }, [historyIndex, history, fetchDirectory]);

  const goForward = useCallback(async () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const targetPath = history[newIndex];
      await fetchDirectory(targetPath);
    }
  }, [historyIndex, history, fetchDirectory]);

  const goUp = useCallback(async () => {
    const parentPath = getParentPath(currentPath);
    if (parentPath) {
      await scanPath(parentPath);
    }
  }, [currentPath, scanPath]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoUp = getParentPath(currentPath) !== null;

  return {
    currentPath,
    files,
    selectedItem,
    setSelectedItem,
    isScanning,
    errorMsg,
    canGoBack,
    canGoForward,
    canGoUp,
    scanPath,
    goBack,
    goForward,
    goUp,
    refresh,
    fetchDirectory,
  };
}
