import { useState, useEffect, useRef } from "react";

interface NavbarProps {
  currentPath: string;
  isScanning: boolean;
  onNavigate: (path: string) => void;
}

export function Navbar({ currentPath, isScanning, onNavigate }: NavbarProps) {
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
    <header className="mb-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-blue-400">File Explorer</h1>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.currentTarget.value)}
            placeholder="Enter directory path (e.g., C:/) or press Ctrl+L to focus"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow text-gray-100"
          />
        </div>
        <button
          type="submit"
          disabled={isScanning}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 transition-colors"
        >
          {isScanning ? "Scanning..." : "Go"}
        </button>
      </form>
    </header>
  );
}
