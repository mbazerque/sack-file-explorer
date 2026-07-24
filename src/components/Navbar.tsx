import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowUp, Search } from "lucide-react";

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
}: NavbarProps) {
  const [inputValue, setInputValue] = useState(currentPath);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(currentPath);
  }, [currentPath]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate(inputValue);
  };

  return (
    <header className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 border border-blue-500/30">
            <Search className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            File Explorer
          </h1>
        </div>
        <span className="text-xs text-gray-500 font-mono hidden sm:inline">
          Presioná <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-gray-400">Ctrl+L</kbd> para ir a la ruta
        </span>
      </div>

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
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
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
