import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileItem } from "../types/file";
import { useTabContext } from "../context/TabContext";

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

export function useNavigation(panelSide?: "left" | "right") {
  const { activeTab, updatePanel } = useTabContext();
  const side = panelSide || activeTab.activePanel;

  const panel = side === "left" ? activeTab.leftPanel : activeTab.rightPanel;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentPath = panel.currentPath;
  const history = panel.history;
  const historyIndex = panel.historyIndex;

  const fetchDirectory = useCallback(async (targetPath: string) => {
    setIsScanning(true);
    setErrorMsg(null);
    setSelectedItem(null);
    try {
      const result = await invoke<FileItem[]>("scan_directory", { path: targetPath });
      setFiles(result);
    } catch (err) {
      console.error("scan_directory error:", err);
      setErrorMsg(String(err));
      setFiles([]);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Fetch directory whenever panel's currentPath or activeTab changes
  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath, activeTab.id, fetchDirectory]);

  const refresh = useCallback(async () => {
    await fetchDirectory(currentPath);
  }, [currentPath, fetchDirectory]);

  const scanPath = useCallback(
    async (targetPath: string) => {
      if (!targetPath.trim()) return;
      const normalizedPath = targetPath.replace(/\\/g, "/");

      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(normalizedPath);
      const newIndex = historyIndex + 1;

      updatePanel(side, {
        currentPath: normalizedPath,
        history: newHistory,
        historyIndex: newIndex,
        searchQuery: "",
      });
    },
    [history, historyIndex, side, updatePanel]
  );

  const goBack = useCallback(async () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const targetPath = history[newIndex];
      updatePanel(side, {
        currentPath: targetPath,
        historyIndex: newIndex,
        searchQuery: "",
      });
    }
  }, [historyIndex, history, side, updatePanel]);

  const goForward = useCallback(async () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const targetPath = history[newIndex];
      updatePanel(side, {
        currentPath: targetPath,
        historyIndex: newIndex,
        searchQuery: "",
      });
    }
  }, [historyIndex, history, side, updatePanel]);

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
