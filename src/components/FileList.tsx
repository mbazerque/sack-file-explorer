import { useState, useMemo } from "react";
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
  ArrowUp,
  ArrowDown,
  Search,
  Zap,
} from "lucide-react";
import { FileItem, FileInfo } from "../types/file";
import { ContextMenu } from "./ContextMenu";

export type ListItem = FileItem | FileInfo;

interface FileListProps {
  files: ListItem[];
  isScanning: boolean;
  errorMsg: string | null;
  selectedItem: ListItem | null;
  onSelectItem: (item: ListItem | null) => void;
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
  panelSide?: "left" | "right";
  isActivePanel?: boolean;
  onPanelFocus?: () => void;
}

type SortColumn = "name" | "modified_at" | "type" | "size" | "relative_path" | "score";
type SortDirection = "asc" | "desc";

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getFileTypeLabel(item: ListItem): string {
  if (item.is_dir) return "Carpeta de archivos";
  const ext = getFileExtension(item.name);
  if (!ext) return "Archivo";
  return `Archivo ${ext.toUpperCase()}`;
}

function formatFileSize(bytes: number, isDir: boolean): string {
  if (isDir) return "--";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatBreadcrumbs(path: string): string {
  const parts = path.split(/[/\\]+/).filter(Boolean);
  if (parts.length === 0) return path;

  // For Windows paths like C:
  if (parts[0].endsWith(":")) {
    parts[0] = parts[0].toUpperCase();
  }
  return parts.join(" › ");
}

function formatDate(timestamp: number | null, compact: boolean = false): string {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  if (compact) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2); // YY format
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderFileIcon(item: ListItem) {
  if (item.is_dir) {
    return <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
  }

  const ext = getFileExtension(item.name);

  switch (ext) {
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
    case "go":
    case "sh":
      return <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
      return <Image className="w-4 h-4 text-purple-400 shrink-0" />;
    case "pdf":
    case "txt":
    case "md":
    case "doc":
    case "docx":
      return <FileText className="w-4 h-4 text-emerald-400 shrink-0" />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <Archive className="w-4 h-4 text-orange-400 shrink-0" />;
    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
      return <Music className="w-4 h-4 text-green-400 shrink-0" />;
    case "mp4":
    case "mkv":
    case "avi":
    case "webm":
      return <Video className="w-4 h-4 text-rose-400 shrink-0" />;
    case "exe":
    case "msi":
    case "bat":
    case "cmd":
    case "ps1":
      return <Terminal className="w-4 h-4 text-yellow-400 shrink-0" />;
    default:
      return <File className="w-4 h-4 text-gray-400 shrink-0" />;
  }
}

export function FileList({
  files,
  isScanning,
  errorMsg,
  selectedItem,
  onSelectItem,
  onNavigate,
  onRefresh,
  currentPath,
  isSearchMode = false,
  searchQuery = "",
  useFuzzy = true,
  isSplitViewOpen = false,
  targetPanelPath,
  onOtherPanelRefresh,
  isActivePanel = true,
  onPanelFocus,
}: FileListProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(
    isSearchMode && useFuzzy ? "score" : "name"
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    isSearchMode && useFuzzy ? "desc" : "asc"
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: ListItem;
  } | null>(null);

  const handleHeaderClick = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection(column === "score" ? "desc" : "asc");
    }
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (!isSearchMode && a.is_dir !== b.is_dir) {
        return a.is_dir ? -1 : 1;
      }

      const fileInfoA = a as Partial<FileInfo>;
      const fileInfoB = b as Partial<FileInfo>;

      let cmp = 0;
      if (sortColumn === "score") {
        const scoreA = fileInfoA.score ?? 0;
        const scoreB = fileInfoB.score ?? 0;
        cmp = scoreA - scoreB;
      } else if (sortColumn === "relative_path") {
        const pathA = fileInfoA.relative_path || a.name;
        const pathB = fileInfoB.relative_path || b.name;
        cmp = pathA.localeCompare(pathB, undefined, { numeric: true, sensitivity: "base" });
      } else if (sortColumn === "name") {
        cmp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" });
      } else if (sortColumn === "modified_at") {
        const timeA = a.modified_at || 0;
        const timeB = b.modified_at || 0;
        cmp = timeA - timeB;
      } else if (sortColumn === "type") {
        const typeA = getFileTypeLabel(a);
        const typeB = getFileTypeLabel(b);
        cmp = typeA.localeCompare(typeB);
      } else if (sortColumn === "size") {
        cmp = a.size - b.size;
      }

      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [files, sortColumn, sortDirection, isSearchMode]);

  const handleContainerClick = () => {
    if (onPanelFocus) onPanelFocus();
    onSelectItem(null);
  };

  const handleRowClick = (item: ListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPanelFocus) onPanelFocus();
    onSelectItem(item);
  };

  const handleRowDoubleClick = (item: ListItem) => {
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

  const handleContextMenu = (item: ListItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onPanelFocus) onPanelFocus();
    onSelectItem(item);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    );
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

        <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-inner">
          <div className="border-b border-gray-800 bg-gray-900/80 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span className="col-span-5">Nombre</span>
            <span className="col-span-3">Ruta Relativa</span>
            <span className="col-span-2">Última modificación</span>
            <span className="col-span-2 text-right">Tamaño</span>
          </div>

          <div className="divide-y divide-gray-800/60">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="px-4 py-3 grid grid-cols-12 gap-4 items-center animate-pulse"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-700/80 rounded" />
                  <div className="h-4 bg-gray-700/80 rounded w-1/2" />
                </div>
                <div className="col-span-3 h-4 bg-gray-800/80 rounded w-3/4" />
                <div className="col-span-2 h-4 bg-gray-800/80 rounded w-2/3" />
                <div className="col-span-2 h-4 bg-gray-800/80 rounded w-full ml-auto" />
              </div>
            ))}
          </div>
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

  return (
    <div className={`p-4 ${panelContainerStyles}`} onClick={handleContainerClick}>
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

      <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm border-collapse select-none">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/90 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <th
                onClick={() => handleHeaderClick("name")}
                className={`py-3 px-4 ${isSearchMode ? "w-[30%]" : "w-[45%]"} cursor-pointer hover:text-white transition-colors`}
              >
                <div className="flex items-center">
                  <span>Nombre</span>
                  {renderSortIndicator("name")}
                </div>
              </th>

              {isSearchMode && (
                <th
                  onClick={() => handleHeaderClick("relative_path")}
                  className="py-3 px-4 w-[30%] cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <span>Ruta Relativa</span>
                    {renderSortIndicator("relative_path")}
                  </div>
                </th>
              )}

              {isSearchMode && useFuzzy && (
                <th
                  onClick={() => handleHeaderClick("score")}
                  className="py-3 px-4 w-[10%] cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center">
                    <span>Relevancia</span>
                    {renderSortIndicator("score")}
                  </div>
                </th>
              )}

              <th
                onClick={() => handleHeaderClick("modified_at")}
                className={`py-3 px-4 ${isSearchMode ? (useFuzzy ? "w-[15%]" : "w-[20%]") : "w-[25%]"} cursor-pointer hover:text-white transition-colors`}
              >
                <div className="flex items-center">
                  <span>Última modificación</span>
                  {renderSortIndicator("modified_at")}
                </div>
              </th>

              {!isSplitViewOpen && (
                <th
                  onClick={() => handleHeaderClick("type")}
                  className={`py-3 px-4 ${isSearchMode ? "w-[15%]" : "w-[18%]"} cursor-pointer hover:text-white transition-colors`}
                >
                  <div className="flex items-center">
                    <span>Tipo</span>
                    {renderSortIndicator("type")}
                  </div>
                </th>
              )}

              <th
                onClick={() => handleHeaderClick("size")}
                className="py-3 px-4 w-[12%] text-right cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center justify-end">
                  <span>Tamaño</span>
                  {renderSortIndicator("size")}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-sans">
            {sortedFiles.map((item, index) => {
              const fileInfo = item as Partial<FileInfo>;
              const isSelected = selectedItem?.name === item.name;

              return (
                <tr
                  key={`${item.name}-${index}`}
                  onClick={(e) => handleRowClick(item, e)}
                  onDoubleClick={() => handleRowDoubleClick(item)}
                  onContextMenu={(e) => handleContextMenu(item, e)}
                  className={`transition-colors text-gray-200 cursor-pointer ${
                    isSelected
                      ? "bg-blue-600/30 text-white font-medium ring-1 ring-blue-500/50"
                      : "hover:bg-gray-800/60"
                  }`}
                >
                  {/* Name column */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      {renderFileIcon(item)}
                      <span
                        className={`truncate ${
                          isSelected
                            ? "text-blue-200"
                            : item.is_dir
                            ? "text-gray-100 font-medium"
                            : "text-gray-300"
                        }`}
                        title={fileInfo.path || item.name}
                      >
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Relative Path column (Search mode) */}
                  {isSearchMode && (
                    <td className="py-2.5 px-4 text-gray-400 text-xs font-mono truncate max-w-[200px]" title={fileInfo.relative_path}>
                      {fileInfo.relative_path || "."}
                    </td>
                  )}

                  {/* Relevance score column (Fuzzy search mode) */}
                  {isSearchMode && useFuzzy && (
                    <td className="py-2.5 px-4 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                        {fileInfo.score ?? 0}
                      </span>
                    </td>
                  )}

                  {/* Modified date column */}
                  <td className="py-2.5 px-4 text-gray-400 text-xs font-mono whitespace-nowrap">
                    {formatDate(item.modified_at, isSplitViewOpen)}
                  </td>

                  {/* Type column */}
                  {!isSplitViewOpen && (
                    <td className="py-2.5 px-4 text-gray-400 text-xs">
                      {getFileTypeLabel(item)}
                    </td>
                  )}

                  {/* Size column */}
                  <td className="py-2.5 px-4 text-gray-400 text-xs font-mono text-right whitespace-nowrap">
                    {formatFileSize(item.size, item.is_dir)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
    </div>
  );
}
