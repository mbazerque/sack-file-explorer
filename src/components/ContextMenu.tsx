import { useState, useEffect, useRef } from "react";
import {
  Copy,
  Terminal,
  Trash2,
  ArrowRight,
  MoveRight,
  Pin,
  FolderPlus,
  ChevronRight,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Code2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { FileItem, FileInfo } from "../types/file";
import { useTabContext } from "../context/TabContext";
import {
  getStoredGroups,
  addItemToQuickAccess,
  addItemToGroup,
  createGroupAndAddItem,
  SidebarGroup,
} from "../utils/sidebarStorage";

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
  const { showHiddenFiles, toggleShowHiddenFiles } = useTabContext();
  const menuRef = useRef<HTMLDivElement>(null);
  const [groups, setGroups] = useState<SidebarGroup[]>([]);
  const [showGroupSubmenu, setShowGroupSubmenu] = useState(false);
  const [isCreatingGroupModalOpen, setIsCreatingGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const fileInfo = item as Partial<FileInfo>;
  const fullPath = fileInfo.path
    ? fileInfo.path
    : currentPath.endsWith("/") || currentPath.endsWith("\\")
    ? `${currentPath}${item.name}`
    : `${currentPath}/${item.name}`;

  useEffect(() => {
    setGroups(getStoredGroups());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !isCreatingGroupModalOpen
      ) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isCreatingGroupModalOpen) {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, isCreatingGroupModalOpen]);

  const handlePinToQuickAccess = () => {
    addItemToQuickAccess(item.name, fullPath, item.is_dir);
    onClose();
  };

  const handleAddToGroup = (groupId: string) => {
    addItemToGroup(groupId, item.name, fullPath, item.is_dir);
    onClose();
  };

  const handleConfirmNewGroup = () => {
    if (!newGroupName.trim()) return;
    createGroupAndAddItem(newGroupName.trim(), item.name, fullPath, item.is_dir);
    setIsCreatingGroupModalOpen(false);
    onClose();
  };

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
  const menuWidth = 240;
  const menuHeight = isSplitViewOpen ? 320 : 250;

  const adjustedX = x + menuWidth > windowWidth ? windowWidth - menuWidth - 10 : x;
  const adjustedY = y + menuHeight > windowHeight ? windowHeight - menuHeight - 10 : y;

  return (
    <>
      <div
        ref={menuRef}
        style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
        className="fixed z-50 w-60 bg-gray-900 border border-gray-700/80 rounded-xl shadow-2xl py-1.5 text-sm text-gray-200 select-none font-sans animate-in fade-in zoom-in-95 duration-100"
      >
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 border-b border-gray-800 truncate">
          {item.name}
        </div>

        <div className="py-1">
          {/* Pin to Quick Access */}
          <button
            type="button"
            onClick={handlePinToQuickAccess}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
          >
            <Pin className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Anclar a Acceso Rápido</span>
          </button>

          {/* Add to Group Submenu */}
          <div
            className="relative"
            onMouseEnter={() => setShowGroupSubmenu(true)}
            onMouseLeave={() => setShowGroupSubmenu(false)}
          >
            <button
              type="button"
              onClick={() => setShowGroupSubmenu((prev) => !prev)}
              className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Agregar a Grupo...</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            </button>

            {/* Submenu List */}
            {showGroupSubmenu && (
              <div className="absolute top-0 left-full -ml-1 w-52 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl py-1 z-50 font-sans text-xs">
                <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 mb-1">
                  Grupos disponibles
                </div>

                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleAddToGroup(g.id)}
                    className="w-full px-3 py-1.5 text-left hover:bg-gray-800 hover:text-white flex items-center gap-2 transition-colors truncate"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="truncate">{g.name}</span>
                  </button>
                ))}

                <div className="my-1 border-t border-gray-800" />

                <button
                  type="button"
                  onClick={() => {
                    setShowGroupSubmenu(false);
                    setIsCreatingGroupModalOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 text-blue-400 font-medium flex items-center gap-2 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Grupo...</span>
                </button>
              </div>
            )}
          </div>

          <div className="my-1 border-t border-gray-800" />

          {/* Copy Path */}
          <button
            type="button"
            onClick={handleCopyPath}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
          >
            <Copy className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Copiar ruta</span>
          </button>

          {/* Rename item */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent("trigger-inline-rename"));
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Renombrar (F2)</span>
          </button>

          {/* Open in Terminal */}
          <button
            type="button"
            onClick={handleOpenInTerminal}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
          >
            <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Abrir en terminal</span>
          </button>

          {/* Open in VS Code */}
          <button
            type="button"
            onClick={async () => {
              try {
                await invoke("open_in_vscode", { path: fullPath });
              } catch (err) {
                console.error("Failed to open VS Code:", err);
                alert(`Error al abrir en VS Code: ${String(err)}`);
              }
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-blue-600/20 hover:text-blue-300 flex items-center gap-2.5 transition-colors"
          >
            <Code2 className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Abrir en VS Code</span>
          </button>

          {/* Toggle Hidden Files */}
          <button
            type="button"
            onClick={() => {
              toggleShowHiddenFiles();
              onClose();
            }}
            className="w-full px-3 py-1.5 text-left hover:bg-purple-600/20 hover:text-purple-300 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {showHiddenFiles ? (
                <EyeOff className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <Eye className="w-4 h-4 text-purple-400 shrink-0" />
              )}
              <span>{showHiddenFiles ? "Ocultar elementos ocultos" : "Mostrar elementos ocultos"}</span>
            </div>
            <span className="text-[10px] text-gray-500 font-mono">Ctrl+H</span>
          </button>

          {/* Split view actions */}
          {isSplitViewOpen && targetPanelPath && (
            <>
              <div className="my-1 border-t border-gray-800" />
              <button
                type="button"
                onClick={handleCopyToOtherPanel}
                className="w-full px-3 py-1.5 text-left hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2.5 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Copiar al otro panel</span>
              </button>

              <button
                type="button"
                onClick={handleMoveToOtherPanel}
                className="w-full px-3 py-1.5 text-left hover:bg-amber-600/20 hover:text-amber-300 flex items-center gap-2.5 transition-colors"
              >
                <MoveRight className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Mover al otro panel</span>
              </button>
            </>
          )}

          <div className="my-1 border-t border-gray-800" />

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            className="w-full px-3 py-1.5 text-left hover:bg-red-600/20 text-red-400 hover:text-red-300 flex items-center gap-2.5 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* On-the-fly Create Group Modal */}
      {isCreatingGroupModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 shadow-2xl rounded-2xl p-5 w-80 font-sans text-gray-100 animate-in fade-in zoom-in-95 duration-150 select-none">
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-2 text-blue-400">
              <FolderPlus className="w-4 h-4 text-amber-400" />
              <span>Crear Nuevo Grupo</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Creá una nueva sección en la barra lateral para anclar{" "}
              <strong className="text-gray-200">"{item.name}"</strong>.
            </p>
            <input
              type="text"
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmNewGroup();
                if (e.key === "Escape") setIsCreatingGroupModalOpen(false);
              }}
              placeholder="Ej: Proyectos 2026"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 font-sans"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingGroupModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmNewGroup}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs transition-colors"
              >
                Crear y Anclar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
