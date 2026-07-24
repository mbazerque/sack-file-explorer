import { useState, useEffect, useRef, RefObject } from "react";
import { ChevronLeft, ChevronRight, ArrowUp, Search, X, Sparkles, Filter, Loader2 } from "lucide-react";

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
}: NavbarProps) {
  const [inputValue, setInputValue] = useState(currentPath);
  const addressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(currentPath);
  }, [currentPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmitAddress = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(inputValue);
  };

  return (
    <header className="flex flex-col gap-3 select-none">
      {/* Top Bar: Title & Fast Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 border border-blue-500/30">
            <Search className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            File Explorer
          </h1>
        </div>

        {/* Search Bar Container */}
        <div className="flex-1 max-w-xl flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-3 text-gray-400 pointer-events-none flex items-center">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>

            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar archivos (Ctrl+F)..."
              className="w-full bg-gray-800/90 border border-gray-700/80 rounded-lg pl-9 pr-20 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-100 placeholder-gray-400 font-sans"
            />

            {/* Clear Button or Ctrl+F Hint */}
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={onClearSearch}
                  title="Limpiar búsqueda (Esc)"
                  className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-[11px] text-gray-400 bg-gray-900/80 border border-gray-700 px-1.5 py-0.5 rounded font-mono hidden md:inline">
                  Ctrl+F
                </span>
              )}
            </div>
          </div>

          {/* Fuzzy Search Toggle Button */}
          <button
            type="button"
            onClick={onToggleFuzzy}
            title={
              useFuzzy
                ? "Búsqueda Fuzzy activa (coincidencias aproximadas/fragmentadas). Haz clic para cambiar a exacta."
                : "Búsqueda Substring exacta activa. Haz clic para activar Fuzzy."
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all shrink-0 ${
              useFuzzy
                ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-600/30"
                : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-750 hover:text-gray-200"
            }`}
          >
            {useFuzzy ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Fuzzy</span>
              </>
            ) : (
              <>
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span>Exacta</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Bar: Nav Controls & Address Bar */}
      <div className="flex items-center gap-2">
        {/* Nav Controls: Back, Forward, Up */}
        <div className="flex items-center bg-gray-800 border border-gray-700/80 rounded-lg p-1 gap-0.5">
          <button
            type="button"
            onClick={onGoBack}
            disabled={!canGoBack || isScanning}
            title="Atrás"
            className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onGoForward}
            disabled={!canGoForward || isScanning}
            title="Adelante"
            className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-gray-700 mx-0.5" />

          <button
            type="button"
            onClick={onGoUp}
            disabled={!canGoUp || isScanning}
            title="Subir Nivel (Carpeta Padre)"
            className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent text-gray-300 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleSubmitAddress} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={addressInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.currentTarget.value)}
              placeholder="Ej: C:/Users o /home"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm text-gray-100 placeholder-gray-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isScanning}
            className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-1.5 transition-colors flex items-center gap-1.5"
          >
            {isScanning ? "Cargando..." : "Ir"}
          </button>
        </form>
      </div>
    </header>
  );
}
