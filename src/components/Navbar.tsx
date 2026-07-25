import { useState, useEffect, useRef, RefObject } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  Search,
  X,
  Sparkles,
  Filter,
  Loader2,
  Columns2,
  HardDrive,
  Folder,
  MoreHorizontal,
  ChevronDown,
  LayoutList,
  LayoutGrid,
} from "lucide-react";

export interface BreadcrumbSegment {
  name: string;
  path: string;
}

export function parseBreadcrumbs(pathStr: string): BreadcrumbSegment[] {
  if (!pathStr) return [];
  const normalized = pathStr.replace(/\\/g, "/");
  const segments: BreadcrumbSegment[] = [];

  const isWindowsDrive = /^[a-zA-Z]:/.test(normalized);

  if (isWindowsDrive) {
    const driveLetter = normalized.substring(0, 2).toUpperCase();
    const rest = normalized.substring(2).replace(/^\/+/, "");

    segments.push({
      name: driveLetter,
      path: `${driveLetter}/`,
    });

    if (rest) {
      const parts = rest.split("/").filter(Boolean);
      let currentAcc = `${driveLetter}/`;
      parts.forEach((part) => {
        currentAcc += (currentAcc.endsWith("/") ? "" : "/") + part;
        segments.push({
          name: part,
          path: currentAcc,
        });
      });
    }
  } else if (normalized.startsWith("/")) {
    segments.push({
      name: "Raíz",
      path: "/",
    });
    const parts = normalized.split("/").filter(Boolean);
    let currentAcc = "";
    parts.forEach((part) => {
      currentAcc += "/" + part;
      segments.push({
        name: part,
        path: currentAcc,
      });
    });
  } else {
    const parts = normalized.split("/").filter(Boolean);
    let currentAcc = "";
    parts.forEach((part) => {
      currentAcc += (currentAcc ? "/" : "") + part;
      segments.push({
        name: part,
        path: currentAcc,
      });
    });
  }

  return segments;
}

interface NavbarProps {
  currentPath: string;
  isScanning: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  canGoUp: boolean;
  onNavigate: (path: string) => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onGoUp: () => void;
  // Fast Search Props
  searchQuery: string;
  onSearchChange: (query: string) => void;
  useFuzzy: boolean;
  onToggleFuzzy: () => void;
  isSearching: boolean;
  onClearSearch: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  // Split View Props
  isSplitViewOpen: boolean;
  onToggleSplitView: () => void;
  // View Switcher Props
  viewMode: "table" | "grid";
  onViewModeChange: (mode: "table" | "grid") => void;
}

export function Navbar({
  currentPath,
  isScanning,
  canGoBack,
  canGoForward,
  canGoUp,
  onNavigate,
  onGoBack,
  onGoForward,
  onGoUp,
  searchQuery,
  onSearchChange,
  useFuzzy,
  onToggleFuzzy,
  isSearching,
  onClearSearch,
  searchInputRef,
  isSplitViewOpen,
  onToggleSplitView,
  viewMode,
  onViewModeChange,
}: NavbarProps) {
  const [inputValue, setInputValue] = useState(currentPath);
  const [isEditingPath, setIsEditingPath] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(currentPath);
    setIsEditingPath(false);
  }, [currentPath]);

  // Global event listener for Ctrl+L address bar focus
  useEffect(() => {
    const handleFocusAddressBar = () => {
      setIsEditingPath(true);
      setTimeout(() => {
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }, 0);
    };

    window.addEventListener("focus-address-bar", handleFocusAddressBar);
    return () => window.removeEventListener("focus-address-bar", handleFocusAddressBar);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const handleStartEditPath = () => {
    setIsEditingPath(true);
    setTimeout(() => {
      addressInputRef.current?.focus();
      addressInputRef.current?.select();
    }, 0);
  };

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onNavigate(inputValue.trim());
    }
    setIsEditingPath(false);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setIsEditingPath(false);
      setInputValue(currentPath);
    }
  };

  const segments = parseBreadcrumbs(currentPath);
  const maxVisibleSegments = 4;
  const showTruncation = segments.length > maxVisibleSegments;

  const firstSegment = showTruncation ? segments[0] : null;
  const middleSegments = showTruncation ? segments.slice(1, segments.length - 2) : [];
  const lastSegments = showTruncation ? segments.slice(segments.length - 2) : segments;

  return (
    <header className="flex items-center gap-2.5 w-full select-none text-xs h-9 font-sans">
      {/* 1. Navigation Controls Group (<, >, ↑) */}
      <div className="flex items-center bg-gray-800 border border-gray-700/80 rounded-lg p-0.5 gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onGoBack}
          disabled={!canGoBack || isScanning}
          title="Atrás (Alt+Left / Backspace)"
          className="p-1 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onGoForward}
          disabled={!canGoForward || isScanning}
          title="Adelante (Alt+Right)"
          className="p-1 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-gray-700 mx-0.5" />

        <button
          type="button"
          onClick={onGoUp}
          disabled={!canGoUp || isScanning}
          title="Subir Nivel / Carpeta Padre (Alt+Up)"
          className="p-1 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 transition-colors"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Interactive Breadcrumb / PathBar (flex-1 expands to take remaining central space) */}
      {isEditingPath ? (
        <form onSubmit={handleSubmitAddress} className="flex-1 flex gap-1.5 min-w-0">
          <input
            ref={addressInputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            onKeyDown={handleAddressKeyDown}
            placeholder="Ej: C:/Users o /home"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-xs text-gray-100 placeholder-gray-500 font-mono"
          />
          <button
            type="submit"
            disabled={isScanning}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg px-3 py-1 transition-colors flex items-center gap-1 shrink-0"
          >
            {isScanning ? "Cargando..." : "Ir"}
          </button>
        </form>
      ) : (
        <div
          onClick={handleStartEditPath}
          title="Haz clic para editar la ruta o presiona Ctrl+L"
          className="flex-1 bg-gray-800/90 border border-gray-700/80 hover:border-gray-600 rounded-lg px-2.5 py-1 flex items-center min-h-[32px] text-xs text-gray-200 cursor-text overflow-hidden transition-all group min-w-0"
        >
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full">
            {/* Truncated path first segment + dropdown */}
            {showTruncation && firstSegment && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(firstSegment.path);
                  }}
                  className="flex items-center gap-1 px-1 py-0.5 rounded hover:bg-gray-700/80 text-gray-300 hover:text-white transition-colors shrink-0 font-mono text-xs"
                >
                  <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>{firstSegment.name}</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />

                {/* Truncation Dropdown Button */}
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen((prev) => !prev);
                    }}
                    title="Mostrar carpetas intermedias"
                    className="flex items-center gap-0.5 px-1 py-0.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors font-mono text-xs border border-gray-700/60"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-1.5 left-0 bg-gray-900 border border-gray-700 shadow-2xl rounded-lg py-1 z-50 min-w-[200px] max-h-60 overflow-y-auto">
                      <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 mb-1">
                        Carpetas intermedias
                      </div>
                      {middleSegments.map((seg) => (
                        <button
                          key={seg.path}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                            onNavigate(seg.path);
                          }}
                          className="w-full px-2.5 py-1 text-left text-xs text-gray-300 hover:text-white hover:bg-gray-800 transition-colors flex items-center gap-2 truncate font-sans"
                        >
                          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{seg.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              </>
            )}

            {/* Visible segments */}
            {lastSegments.map((seg, idx) => {
              const isLast = idx === lastSegments.length - 1;
              const isFirst = !showTruncation && idx === 0;

              return (
                <div key={seg.path} className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(seg.path);
                    }}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors text-xs font-sans ${
                      isLast
                        ? "font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20"
                        : "text-gray-300 hover:text-white hover:bg-gray-700/80"
                    }`}
                  >
                    {isFirst ? (
                      <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    ) : (
                      <Folder className={`w-3.5 h-3.5 shrink-0 ${isLast ? "text-blue-400" : "text-amber-400"}`} />
                    )}
                    <span>{seg.name}</span>
                  </button>

                  {!isLast && <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
                </div>
              );
            })}

            {/* Ctrl+L hint */}
            <div className="ml-auto pl-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1 text-[10px] font-mono">
              <span>Ctrl+L</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Search Input, Fuzzy Connector, Split View Button, & View Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Search Input */}
        <div className="relative flex items-center min-w-[170px] max-w-[220px]">
          <div className="absolute left-2.5 text-gray-400 pointer-events-none flex items-center">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-gray-400" />
            )}
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar archivos..."
            className="w-full bg-gray-800/90 border border-gray-700/80 rounded-lg pl-8 pr-14 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-xs text-gray-100 placeholder-gray-400 font-sans"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={onClearSearch}
                title="Limpiar búsqueda (Esc)"
                className="p-0.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] text-gray-400 bg-gray-900/80 border border-gray-700 px-1 rounded font-mono hidden md:inline">
                Ctrl+F
              </span>
            )}
          </div>
        </div>

        {/* Fuzzy Search Connector */}
        <button
          type="button"
          onClick={onToggleFuzzy}
          title={
            useFuzzy
              ? "Búsqueda Fuzzy activa. Haz clic para cambiar a exacta."
              : "Búsqueda Exacta activa. Haz clic para activar Fuzzy."
          }
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-all shrink-0 ${
            useFuzzy
              ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30"
              : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750 hover:text-gray-200"
          }`}
        >
          {useFuzzy ? (
            <>
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
              <span className="hidden sm:inline">Fuzzy</span>
            </>
          ) : (
            <>
              <Filter className="w-3 h-3 text-gray-400" />
              <span className="hidden sm:inline">Exacta</span>
            </>
          )}
        </button>

        {/* Split View Toggle Button */}
        <button
          type="button"
          onClick={onToggleSplitView}
          title="Vista Dividida / Panel Doble (Ctrl+\)"
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border transition-all shrink-0 ${
            isSplitViewOpen
              ? "bg-blue-600/25 text-blue-300 border-blue-500/50 hover:bg-blue-600/35 ring-1 ring-blue-500/30"
              : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750 hover:text-gray-200"
          }`}
        >
          <Columns2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden lg:inline">Split View</span>
        </button>

        {/* View Switcher Segmented Control (Table vs Grid) */}
        <div className="flex items-center bg-gray-800 border border-gray-700/80 rounded-lg p-0.5 gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            title="Vista de Tabla / Detalles (☰)"
            className={`p-1 rounded transition-all ${
              viewMode === "table"
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            title="Vista de Cuadrícula / Grid (⠿)"
            className={`p-1 rounded transition-all ${
              viewMode === "grid"
                ? "bg-zinc-700 text-zinc-100 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
