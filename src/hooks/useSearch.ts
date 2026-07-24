import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { FileInfo } from "../types/file";

export function useSearch(currentPath: string) {
  const [searchQuery, setSearchQuery] = useState("");
  const [useFuzzy, setUseFuzzy] = useState(true);
  const [searchResults, setSearchResults] = useState<FileInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setSearchError(null);
  }, []);

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
  }, [searchQuery, useFuzzy, currentPath]);

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
