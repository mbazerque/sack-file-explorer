import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, Copy, X } from "lucide-react";

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    const appWindow = getCurrentWindow();

    // Check initial maximized state
    appWindow
      .isMaximized()
      .then(setIsMaximized)
      .catch(() => {});

    // Listen to resize events to update maximize/restore icon
    appWindow
      .onResized(async () => {
        try {
          const max = await appWindow.isMaximized();
          setIsMaximized(max);
        } catch {
          // Ignore error outside Tauri env
        }
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await getCurrentWindow().minimize();
    } catch (err) {
      console.warn("Window minimize error:", err);
    }
  };

  const handleToggleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const max = await appWindow.isMaximized();
      setIsMaximized(max);
    } catch (err) {
      console.warn("Window maximize error:", err);
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await getCurrentWindow().close();
    } catch (err) {
      console.warn("Window close error:", err);
    }
  };

  return (
    <div
      data-tauri-drag-region="false"
      className="flex items-center ml-auto shrink-0 select-none h-full"
    >
      <button
        type="button"
        data-tauri-drag-region="false"
        onClick={handleMinimize}
        title="Minimizar"
        className="h-9 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        data-tauri-drag-region="false"
        onClick={handleToggleMaximize}
        title={isMaximized ? "Restaurar" : "Maximizar"}
        className="h-9 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        {isMaximized ? (
          <Copy className="w-3.5 h-3.5 rotate-180" />
        ) : (
          <Square className="w-3.5 h-3.5" />
        )}
      </button>

      <button
        type="button"
        data-tauri-drag-region="false"
        onClick={handleClose}
        title="Cerrar"
        className="h-9 w-11 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
