import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileInfo } from "../types/file";
import { useTabContext } from "../context/TabContext";

export function useSearch() {
  const { activeTab, updateActiveTab } = useTabContext();

  const searchQuery = activeTab.searchQuery;
  const useFuzzy = activeTab.isFuzzy;
  const currentPath = activeTab.currentPath;

  const [searchResults, setSearchResults] = useState<FileInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const setSearchQuery = useCallback(
    (query: string) => {
      updateActiveTab({ searchQuery: query });
    },
    [updateActiveTab]
  );

  const setUseFuzzy = useCallback(
    (useFuzzyVal: boolean | ((prev: boolean) => boolean)) => {
      const nextVal = typeof useFuzzyVal === "function" ? useFuzzyVal(useFuzzy) : useFuzzyVal;
      updateActiveTab({ isFuzzy: nextVal });
    },
    [useFuzzy, updateActiveTab]
  );

  const clearSearch = useCallback(() => {
    updateActiveTab({ searchQuery: "" });
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(null);
  }, [updateActiveTab]);

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
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      } else if (e.key === "Escape") {
        if (searchQuery) {
          e.preventDefault();
          clearSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery, clearSearch]);

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
