import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileInfo } from "../types/file";
import { useTabContext } from "../context/TabContext";

export function useSearch(panelSide?: "left" | "right") {
  const { activeTab, updatePanel } = useTabContext();
  const side = panelSide || activeTab.activePanel;

  const panel = side === "left" ? activeTab.leftPanel : activeTab.rightPanel;

  const searchQuery = panel.searchQuery;
  const useFuzzy = panel.isFuzzy;
  const currentPath = panel.currentPath;

  const [searchResults, setSearchResults] = useState<FileInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const setSearchQuery = useCallback(
    (query: string) => {
      updatePanel(side, { searchQuery: query });
    },
    [side, updatePanel]
  );

  const setUseFuzzy = useCallback(
    (useFuzzyVal: boolean | ((prev: boolean) => boolean)) => {
      const nextVal = typeof useFuzzyVal === "function" ? useFuzzyVal(useFuzzy) : useFuzzyVal;
      updatePanel(side, { isFuzzy: nextVal });
    },
    [useFuzzy, side, updatePanel]
  );

  const clearSearch = useCallback(() => {
    updatePanel(side, { searchQuery: "" });
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(null);
  }, [side, updatePanel]);

  // Debounced search effect (~250ms)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const results = await invoke<FileInfo[]>("search_files", {
          query: trimmedQuery,
          rootPath: currentPath,
          useFuzzy,
        });
        setSearchResults(results);
      } catch (err) {
        console.error("Search error:", err);
        setSearchError(String(err));
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, useFuzzy, currentPath, activeTab.id]);

  // Global keyboard shortcuts: Ctrl+F, Ctrl+P to focus search input, Esc to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F" || e.key === "p" || e.key === "P")) {
        if (side === activeTab.activePanel) {
          e.preventDefault();
          inputRef.current?.focus();
          inputRef.current?.select();
        }
      } else if (e.key === "Escape") {
        if (searchQuery && side === activeTab.activePanel) {
          e.preventDefault();
          clearSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, clearSearch, side, activeTab.activePanel]);

  return {
    searchQuery,
    setSearchQuery,
    useFuzzy,
    setUseFuzzy,
    searchResults,
    isSearching,
    searchError,
    clearSearch,
    inputRef,
    isSearchActive: searchQuery.trim().length > 0,
  };
}
