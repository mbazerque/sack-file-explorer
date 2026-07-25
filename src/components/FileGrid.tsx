import { useState, useMemo, useEffect, useRef } from "react";
import {
  Folder,
  File,
  FileCode,
  Image,
  FileText,
  Archive,
  Music,
  Video,
  Terminal,
  AlertCircle,
  FolderOpen,
  Search,
  Zap,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { FileItem, FileInfo } from "../types/file";
import { ContextMenu } from "./ContextMenu";
import { QuickPreviewModal } from "./QuickPreviewModal";
import { useClipboard } from "../context/ClipboardContext";

export type ListItem = FileItem | FileInfo;

interface FileGridProps {
  files: ListItem[];
  isScanning: boolean;
  errorMsg: string | null;
  selectedItem: ListItem | null;
  selectedItems?: ListItem[];
  onSelectItem: (item: ListItem | null) => void;
  onSelectSingle?: (item: ListItem | null, index?: number) => void;
  onToggleSelect?: (item: ListItem, index: number) => void;
  onRangeSelect?: (index: number, allFiles: ListItem[]) => void;
  onClearSelection?: () => void;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  currentPath: string;
  // Fast Search Props
  isSearchMode?: boolean;
  searchQuery?: string;
  useFuzzy?: boolean;
  // Split View Props
  isSplitViewOpen?: boolean;
  targetPanelPath?: string;
  onOtherPanelRefresh?: () => void;
  isActivePanel?: boolean;
  onPanelFocus?: () => void;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function formatBreadcrumbs(path: string): string {
  const parts = path.split(/[/\\]+/).filter(Boolean);
  if (parts.length === 0) return path;

  if (parts[0].endsWith(":")) {
    parts[0] = parts[0].toUpperCase();
  }
  return parts.join(" › ");
}

function renderGridIcon(item: ListItem) {
  if (item.is_dir) {
    return <Folder className="w-10 h-10 text-amber-400 fill-amber-400/10 shrink-0" />;
  }

  const ext = getFileExtension(item.name);

  switch (ext) {
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
      return <Image className="w-10 h-10 text-emerald-400 shrink-0" />;

    case "txt":
    case "md":
    case "pdf":
    case "doc":
    case "docx":
      return <FileText className="w-10 h-10 text-blue-400 shrink-0" />;

    case "js":
    case "ts":
    case "tsx":
    case "jsx":
    case "json":
    case "html":
    case "css":
    case "rs":
    case "py":
    case "c":
    case "cpp":
      return <FileCode className="w-10 h-10 text-purple-400 shrink-0" />;

    case "zip":
    case "tar":
    case "gz":
    case "rar":
    case "7z":
      return <Archive className="w-10 h-10 text-amber-500 shrink-0" />;

    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
      return <Music className="w-10 h-10 text-pink-400 shrink-0" />;

    case "mp4":
    case "mkv":
    case "avi":
    case "mov":
    case "webm":
      return <Video className="w-10 h-10 text-red-400 shrink-0" />;

    case "exe":
    case "bat":
    case "cmd":
    case "ps1":
    case "sh":
      return <Terminal className="w-10 h-10 text-cyan-400 shrink-0" />;

    default:
      return <File className="w-10 h-10 text-gray-400 shrink-0" />;
  }
}

export function FileGrid({
  files,
  isScanning,
  errorMsg,
  selectedItem,
  selectedItems = [],
  onSelectItem,
  onSelectSingle,
  onToggleSelect,
  onRangeSelect,
  onClearSelection,
  onNavigate,
  onRefresh,
  currentPath,
  isSearchMode = false,
  searchQuery = "",
  isSplitViewOpen = false,
  targetPanelPath,
  onOtherPanelRefresh,
  isActivePanel = true,
  onPanelFocus,
}: FileGridProps) {
  const { clipboard } = useClipboard();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: ListItem;
  } | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Inline Rename State
  const [editingItemName, setEditingItemName] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Listen to trigger-inline-rename
  useEffect(() => {
    const handleTriggerRename = () => {
      const activeItem = (selectedItems && selectedItems[0]) || selectedItem;
      if (activeItem) {
        setEditingItemName(activeItem.name);
        setEditingText(activeItem.name);
      }
    };
    window.addEventListener("trigger-inline-rename", handleTriggerRename);
    return () => window.removeEventListener("trigger-inline-rename", handleTriggerRename);
  }, [selectedItem, selectedItems]);

  // Focus and select base name on editing start
  useEffect(() => {
    if (editingItemName && renameInputRef.current) {
      renameInputRef.current.focus();
      const dotIndex = editingItemName.lastIndexOf(".");
      if (dotIndex > 0) {
        renameInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [editingItemName]);

  const handleConfirmRename = async (item: ListItem) => {
    if (!editingItemName) return;
    const trimmed = editingText.trim();
    if (!trimmed || trimmed === item.name) {
      setEditingItemName(null);
      return;
    }

    const fileInfo = item as Partial<FileInfo>;
    const oldPath =
      fileInfo.path ||
      (currentPath.endsWith("/") || currentPath.endsWith("\\")
        ? `${currentPath}${item.name}`
        : `${currentPath}/${item.name}`);

    const normOld = oldPath.replace(/\\/g, "/");
    const lastSlash = normOld.lastIndexOf("/");
    const parentDir = lastSlash > 0 ? normOld.substring(0, lastSlash) : currentPath;

    const newPath =
      parentDir.endsWith("/") || parentDir.endsWith("\\")
        ? `${parentDir}${trimmed}`
        : `${parentDir}/${trimmed}`;

    try {
      await invoke("rename_item", { oldPath, newPath });
      setEditingItemName(null);
      onRefresh();
    } catch (err) {
      alert(`Error al renombrar: ${String(err)}`);
      setEditingItemName(null);
    }
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (a.is_dir !== b.is_dir) {
        return b.is_dir ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
    });
  }, [files]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActivePanel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable ||
        (document.activeElement as HTMLElement)?.closest(".xterm") !== null;

      if (isInputFocused) return;

      if (e.code === "Space" || e.key === " ") {
        if (selectedItem || selectedItems.length > 0) {
          e.preventDefault();
          setIsPreviewOpen((prev) => !prev);
        }
      } else if (e.key === "Escape") {
        if (isPreviewOpen) {
          e.preventDefault();
          setIsPreviewOpen(false);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (sortedFiles.length === 0) return;
        e.preventDefault();
        const activeItem = selectedItems[0] || selectedItem;
        const currentIndex = activeItem ? sortedFiles.findIndex((f) => f.name === activeItem.name) : -1;
        const nextIndex = currentIndex < sortedFiles.length - 1 ? currentIndex + 1 : 0;
        if (onSelectSingle) onSelectSingle(sortedFiles[nextIndex], nextIndex);
        else onSelectItem(sortedFiles[nextIndex]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (sortedFiles.length === 0) return;
        e.preventDefault();
        const activeItem = selectedItems[0] || selectedItem;
        const currentIndex = activeItem ? sortedFiles.findIndex((f) => f.name === activeItem.name) : -1;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedFiles.length - 1;
        if (onSelectSingle) onSelectSingle(sortedFiles[prevIndex], prevIndex);
        else onSelectItem(sortedFiles[prevIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActivePanel, selectedItem, selectedItems, isPreviewOpen, sortedFiles, onSelectItem, onSelectSingle]);

  const handleContainerClick = () => {
    if (onPanelFocus) onPanelFocus();
    if (onClearSelection) onClearSelection();
    else onSelectItem(null);
  };

  const handleCardClick = (item: ListItem, index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPanelFocus) onPanelFocus();

    if (e.ctrlKey || e.metaKey) {
      if (onToggleSelect) onToggleSelect(item, index);
      else onSelectItem(item);
    } else if (e.shiftKey) {
      if (onRangeSelect) onRangeSelect(index, sortedFiles);
      else onSelectItem(item);
    } else {
      if (onSelectSingle) onSelectSingle(item, index);
      else onSelectItem(item);
    }
  };

  const handleCardDoubleClick = (item: ListItem) => {
    if (onPanelFocus) onPanelFocus();
    const fileInfo = item as Partial<FileInfo>;
    if (fileInfo.path) {
      if (item.is_dir) {
        onNavigate(fileInfo.path);
      }
    } else if (item.is_dir) {
      const base = currentPath.endsWith("/") || currentPath.endsWith("\\")
        ? currentPath
        : `${currentPath}/`;
      onNavigate(`${base}${item.name}`);
    }
  };

  const handleContextMenu = (item: ListItem, index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPanelFocus) onPanelFocus();

    const isAlreadySelected = selectedItems.some((it) => it.name === item.name);
    if (!isAlreadySelected) {
      if (onSelectSingle) onSelectSingle(item, index);
      else onSelectItem(item);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const panelContainerStyles = isSplitViewOpen
    ? isActivePanel
      ? "ring-1 ring-blue-500/50 border border-blue-500/30 rounded-xl"
      : "opacity-85 border border-gray-800 rounded-xl hover:opacity-100"
    : "";

  if (errorMsg) {
    return (
      <div className={`p-6 ${panelContainerStyles}`} onClick={handleContainerClick}>
        <div className="p-4 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-300">Error al acceder al directorio</h3>
            <p className="text-sm text-red-300/80 mt-1">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isScanning) {
    return (
      <div className={`p-4 space-y-3 ${panelContainerStyles}`} onClick={handleContainerClick}>
        <div className="flex items-center gap-2 text-sm text-blue-400 animate-pulse mb-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>{isSearchMode ? "Buscando archivos con motor de Rust..." : "Obteniendo archivos del sistema..."}</span>
        </div>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="p-3 bg-gray-900/60 border border-gray-800/80 rounded-xl flex flex-col items-center justify-center animate-pulse aspect-square">
              <div className="w-10 h-10 bg-gray-800/80 rounded-lg mb-2" />
              <div className="h-3 bg-gray-800/80 rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        className={`h-full flex flex-col items-center justify-center text-gray-400 p-8 select-none ${panelContainerStyles}`}
        onClick={handleContainerClick}
      >
        <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-4 text-gray-500 shadow-inner">
          {isSearchMode ? <Search className="w-8 h-8 text-blue-400" /> : <FolderOpen className="w-8 h-8" />}
        </div>
        <h3 className="text-base font-medium text-gray-300">
          {isSearchMode ? `Sin coincidencias para "${searchQuery}"` : "Carpeta vacía"}
        </h3>
        <p className="text-sm text-gray-500 mt-1 max-w-md text-center">
          {isSearchMode
            ? `No se encontraron archivos en "${currentPath}" que coincidan con la búsqueda.`
            : "No hay archivos ni subcarpetas para mostrar en esta ubicación."}
        </p>
      </div>
    );
  }

  const normCurrentPath = currentPath.replace(/\\/g, "/").toLowerCase();

  return (
    <div
      className={`p-4 min-h-full flex-1 flex flex-col ${panelContainerStyles}`}
      onClick={handleContainerClick}
    >
      {isSplitViewOpen && (
        <div className="mb-2 flex items-center text-xs px-1 py-0.5 border-b border-gray-800/40 pb-1.5">
          <span className="font-semibold flex items-center gap-1.5 min-w-0 max-w-full">
            <span className={`w-2 h-2 rounded-full shrink-0 ${isActivePanel ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`} />
            <span className={`truncate font-mono text-[11px] ${isActivePanel ? "text-blue-300 font-medium" : "text-gray-500"}`} title={currentPath}>
              {formatBreadcrumbs(currentPath)}
            </span>
          </span>
        </div>
      )}

      {isSearchMode && (
        <div className="mb-3 flex items-center justify-between text-xs text-gray-400 px-1">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-blue-400" />
            Mostrando <strong className="text-blue-300">{files.length}</strong> resultados para{" "}
            <span className="font-mono text-gray-200 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
              "{searchQuery}"
            </span>
          </span>
        </div>
      )}

      {/* Grid container */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
        {sortedFiles.map((item, index) => {
          const fileInfo = item as Partial<FileInfo>;

          const isSelected = selectedItems && selectedItems.length > 0
            ? selectedItems.some((it) => it.name === item.name)
            : selectedItem?.name === item.name;

          const isCut =
            clipboard?.action === "cut" &&
            clipboard.sourcePath.replace(/\\/g, "/").toLowerCase() === normCurrentPath &&
            clipboard.items.some((it) => it.name === item.name);

          return (
            <div
              key={`${item.name}-${index}`}
              draggable={item.is_dir}
              onDragStart={(e) => {
                if (item.is_dir) {
                  const itemPath =
                    fileInfo.path ||
                    `${currentPath.replace(/\\/g, "/").replace(/\/+$/, "")}/${item.name}`;
                  e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      name: item.name,
                      path: itemPath,
                      is_dir: true,
                    })
                  );
                  e.dataTransfer.setData("text/plain", itemPath);
                  e.dataTransfer.effectAllowed = "copy";
                }
              }}
              onClick={(e) => handleCardClick(item, index, e)}
              onDoubleClick={() => handleCardDoubleClick(item)}
              onContextMenu={(e) => handleContextMenu(item, index, e)}
              className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none aspect-square text-center font-sans ${
                isCut ? "opacity-50" : ""
              } ${
                isSelected
                  ? "bg-zinc-800 border-zinc-700/90 ring-1 ring-zinc-700/60 shadow-lg text-zinc-100"
                  : "bg-gray-900/60 border-gray-800/80 hover:bg-gray-850 hover:border-gray-700 text-gray-300"
              }`}
            >
              {/* Icon Container */}
              <div className="flex-1 flex items-center justify-center p-1">
                {renderGridIcon(item)}
              </div>

              {/* Name & Inline Rename */}
              <div className="w-full mt-1.5 px-0.5">
                {editingItemName === item.name ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleConfirmRename(item);
                      if (e.key === "Escape") setEditingItemName(null);
                    }}
                    onBlur={() => handleConfirmRename(item)}
                    className="bg-gray-800 text-gray-100 border border-blue-500 rounded px-1 py-0.5 text-xs text-center focus:outline-none w-full font-sans"
                  />
                ) : (
                  <span
                    className={`block truncate text-xs ${
                      isSelected
                        ? "font-medium text-zinc-100"
                        : "font-normal text-gray-300 group-hover:text-gray-100"
                    }`}
                    title={fileInfo.path || item.name}
                  >
                    {item.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          item={contextMenu.item}
          currentPath={currentPath}
          onClose={() => setContextMenu(null)}
          onDeleteSuccess={onRefresh}
          isSplitViewOpen={isSplitViewOpen}
          targetPanelPath={targetPanelPath}
          onActionSuccess={() => {
            onRefresh();
            if (onOtherPanelRefresh) onOtherPanelRefresh();
          }}
        />
      )}

      {isPreviewOpen && (selectedItem || selectedItems[0]) && (
        <QuickPreviewModal
          item={selectedItems[0] || selectedItem!}
          currentPath={currentPath}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </div>
  );
}
