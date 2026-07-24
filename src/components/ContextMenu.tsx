import { useEffect, useRef } from "react";
import { Copy, Terminal, Trash2, ArrowRight, MoveRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { FileItem, FileInfo } from "../types/file";

export type ListItem = FileItem | FileInfo;

interface ContextMenuProps {
  x: number;
  y: number;
  item: ListItem;
  currentPath: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
  // Dual-pane / Split view props
  isSplitViewOpen?: boolean;
  targetPanelPath?: string;
  onActionSuccess?: () => void;
}

export function ContextMenu({
  x,
  y,
  item,
  currentPath,
  onClose,
  onDeleteSuccess,
  isSplitViewOpen = false,
  targetPanelPath,
  onActionSuccess,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const fileInfo = item as Partial<FileInfo>;
  const fullPath = fileInfo.path
    ? fileInfo.path
    : currentPath.endsWith("/") || currentPath.endsWith("\\")
    ? `${currentPath}${item.name}`
    : `${currentPath}/${item.name}`;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(fullPath);
    } catch (err) {
      console.error("Failed to copy path:", err);
    }
    onClose();
  };

  const handleOpenInTerminal = async () => {
    const targetPath = item.is_dir ? fullPath : currentPath;
    try {
      await invoke("open_in_terminal", { path: targetPath });
    } catch (err) {
      console.error("Failed to open in terminal:", err);
    }
    onClose();
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar "${item.name}"?`);
    if (!confirmDelete) {
      onClose();
      return;
    }
    try {
      await invoke("delete_item", { path: fullPath });
      onDeleteSuccess();
    } catch (err) {
      alert(`Error al eliminar: ${String(err)}`);
    }
    onClose();
  };

  const handleCopyToOtherPanel = async () => {
    if (!targetPanelPath) return;
    try {
      await invoke("copy_item", { src: fullPath, dstDir: targetPanelPath });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(`Error al copiar al otro panel: ${String(err)}`);
    }
    onClose();
  };

  const handleMoveToOtherPanel = async () => {
    if (!targetPanelPath) return;
    try {
      await invoke("move_item", { src: fullPath, dstDir: targetPanelPath });
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(`Error al mover al otro panel: ${String(err)}`);
    }
    onClose();
  };

  // Adjust coordinates if menu overflows window
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const menuWidth = 220;
  const menuHeight = isSplitViewOpen ? 210 : 130;

  const adjustedX = x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : y;

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-56 bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl py-1.5 text-sm text-gray-200 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-800 truncate">
        {item.name}
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={handleCopyPath}
          className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
        >
          <Copy className="w-4 h-4 text-blue-400" />
          <span>Copiar ruta</span>
        </button>

        <button
          type="button"
          onClick={handleOpenInTerminal}
          className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
        >
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Abrir en terminal</span>
        </button>

        {isSplitViewOpen && targetPanelPath && (
          <>
            <div className="my-1 border-t border-gray-800" />
            <button
              type="button"
              onClick={handleCopyToOtherPanel}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2.5 transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-indigo-400" />
              <span>Copiar al otro panel</span>
            </button>

            <button
              type="button"
              onClick={handleMoveToOtherPanel}
              className="w-full px-3 py-1.5 text-left hover:bg-amber-600/20 hover:text-amber-300 flex items-center gap-2.5 transition-colors"
            >
              <MoveRight className="w-4 h-4 text-amber-400" />
              <span>Mover al otro panel</span>
            </button>
          </>
        )}

        <div className="my-1 border-t border-gray-800" />

        <button
          type="button"
          onClick={handleDelete}
          className="w-full px-3 py-1.5 text-left hover:bg-red-600/20 text-red-400 hover:text-red-300 flex items-center gap-2.5 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
}
