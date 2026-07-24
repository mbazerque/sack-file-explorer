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
} from "lucide-react";
import { FileItem } from "../types/file";
import { ContextMenu } from "./ContextMenu";

interface FileListProps {
  files: FileItem[];
  isScanning: boolean;
  errorMsg: string | null;
  selectedItem: FileItem | null;
  onSelectItem: (item: FileItem | null) => void;
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  currentPath: string;
}

type SortColumn = "name" | "modified_at" | "type" | "size";
type SortDirection = "asc" | "desc";

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getFileTypeLabel(item: FileItem): string {
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

function formatDate(timestamp: number | null): string {
  if (!timestamp) return "--";
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderFileIcon(item: FileItem) {
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
}: FileListProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FileItem;
  } | null>(null);

  const handleHeaderClick = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      // Folders always on top
      if (a.is_dir !== b.is_dir) {
        return a.is_dir ? -1 : 1;
      }

      let cmp = 0;
      if (sortColumn === "name") {
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
  }, [files, sortColumn, sortDirection]);

  const handleRowClick = (item: FileItem, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectItem(item);
  };

  const handleRowDoubleClick = (item: FileItem) => {
    if (item.is_dir) {
      const base = currentPath.endsWith("/") || currentPath.endsWith("\\")
        ? currentPath
        : `${currentPath}/`;
      onNavigate(`${base}${item.name}`);
    }
  };

  const handleContextMenu = (item: FileItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (errorMsg) {
    return (
      <div className="p-6">
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
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm text-blue-400 animate-pulse mb-4">
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Obteniendo archivos del sistema...</span>
        </div>

        <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-inner">
          <div className="border-b border-gray-800 bg-gray-900/80 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span className="col-span-6">Nombre</span>
            <span className="col-span-3">Última modificación</span>
            <span className="col-span-2">Tipo</span>
            <span className="col-span-1 text-right">Tamaño</span>
          </div>

          <div className="divide-y divide-gray-800/60">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="px-4 py-3 grid grid-cols-12 gap-4 items-center animate-pulse"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-700/80 rounded" />
                  <div className="h-4 bg-gray-700/80 rounded w-1/2" />
                </div>
                <div className="col-span-3 h-4 bg-gray-800/80 rounded w-2/3" />
                <div className="col-span-2 h-4 bg-gray-800/80 rounded w-3/4" />
                <div className="col-span-1 h-4 bg-gray-800/80 rounded w-full ml-auto" />
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
        className="h-full flex flex-col items-center justify-center text-gray-400 p-8 select-none"
        onClick={() => onSelectItem(null)}
      >
        <div className="w-16 h-16 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center mb-4 text-gray-500 shadow-inner">
          <FolderOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-medium text-gray-300">Carpeta vacía</h3>
        <p className="text-sm text-gray-500 mt-1">No hay archivos ni subcarpetas para mostrar en esta ubicación.</p>
      </div>
    );
  }

  return (
    <div className="p-4" onClick={() => onSelectItem(null)}>
      <div className="w-full bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-sm border-collapse select-none">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/90 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <th
                onClick={() => handleHeaderClick("name")}
                className="py-3 px-4 w-[45%] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  <span>Nombre</span>
                  {renderSortIndicator("name")}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick("modified_at")}
                className="py-3 px-4 w-[25%] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  <span>Última modificación</span>
                  {renderSortIndicator("modified_at")}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick("type")}
                className="py-3 px-4 w-[18%] cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center">
                  <span>Tipo</span>
                  {renderSortIndicator("type")}
                </div>
              </th>
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
                        title={item.name}
                      >
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-gray-400 text-xs font-mono">
                    {formatDate(item.modified_at)}
                  </td>
                  <td className="py-2.5 px-4 text-gray-400 text-xs">
                    {getFileTypeLabel(item)}
                  </td>
                  <td className="py-2.5 px-4 text-gray-400 text-xs font-mono text-right">
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
        />
      )}
    </div>
  );
}
