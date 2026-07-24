import { useEffect, useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import {
  X,
  File,
  Folder,
  FileCode,
  Image as ImageIcon,
  FileText,
  Archive,
  Music,
  Video,
  Terminal,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FileItem, FileInfo } from "../types/file";

export type ListItem = FileItem | FileInfo;

interface QuickPreviewModalProps {
  item: ListItem | null;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function getItemFullPath(item: ListItem, currentPath: string): string {
  const fileInfo = item as Partial<FileInfo>;
  if (fileInfo.path) return fileInfo.path;
  const base = currentPath.replace(/\\/g, "/").replace(/\/+$/, "");
  return `${base}/${item.name}`;
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

function renderFileIcon(item: ListItem) {
  if (item.is_dir) {
    return <Folder className="w-5 h-5 text-amber-400 shrink-0" />;
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
    case "scss":
    case "rs":
    case "py":
    case "c":
    case "cpp":
    case "go":
    case "sh":
    case "toml":
    case "yaml":
    case "yml":
    case "sql":
      return <FileCode className="w-5 h-5 text-cyan-400 shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
    case "ico":
      return <ImageIcon className="w-5 h-5 text-purple-400 shrink-0" />;
    case "pdf":
    case "txt":
    case "md":
    case "doc":
    case "docx":
    case "env":
    case "log":
      return <FileText className="w-5 h-5 text-emerald-400 shrink-0" />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <Archive className="w-5 h-5 text-orange-400 shrink-0" />;
    case "mp3":
    case "wav":
    case "ogg":
    case "flac":
      return <Music className="w-5 h-5 text-green-400 shrink-0" />;
    case "mp4":
    case "mkv":
    case "avi":
    case "webm":
      return <Video className="w-5 h-5 text-rose-400 shrink-0" />;
    case "exe":
    case "msi":
    case "bat":
    case "cmd":
    case "ps1":
      return <Terminal className="w-5 h-5 text-yellow-400 shrink-0" />;
    default:
      return <File className="w-5 h-5 text-gray-400 shrink-0" />;
  }
}

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "json",
  "js",
  "jsx",
  "ts",
  "tsx",
  "rs",
  "css",
  "scss",
  "html",
  "xml",
  "env",
  "py",
  "c",
  "cpp",
  "h",
  "hpp",
  "go",
  "sh",
  "bat",
  "cmd",
  "ps1",
  "toml",
  "yaml",
  "yml",
  "ini",
  "conf",
  "gitignore",
  "sql",
  "log",
  "lock",
  "svg",
]);

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "ico",
  "bmp",
  "avif",
]);

export function QuickPreviewModal({
  item,
  currentPath,
  isOpen,
  onClose,
}: QuickPreviewModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fullPath = item ? getItemFullPath(item, currentPath) : "";
  const ext = item ? getFileExtension(item.name) : "";

  const isText = !item?.is_dir && (TEXT_EXTENSIONS.has(ext) || ext === "");
  const isImage = !item?.is_dir && IMAGE_EXTENSIONS.has(ext);

  useEffect(() => {
    if (!isOpen || !item || item.is_dir || !isText) {
      setTextContent(null);
      setIsLoading(false);
      setErrorMsg(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);
    setTextContent(null);

    invoke<string>("read_file_content", { path: fullPath })
      .then((res) => {
        if (isMounted) {
          setTextContent(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("read_file_content error:", err);
          setErrorMsg(String(err));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, item, fullPath, isText]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[85vh] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            {renderFileIcon(item)}
            <span className="font-semibold text-sm text-gray-100 truncate max-w-[380px]" title={item.name}>
              {item.name}
            </span>
            <span className="text-xs text-gray-400 font-mono bg-gray-800/90 px-2 py-0.5 rounded border border-gray-700/60 shrink-0">
              {formatFileSize(item.size, item.is_dir)}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar vista previa (Esc / Espacio)"
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto bg-gray-950/60 min-h-[300px] flex flex-col">
          {isImage ? (
            <div className="flex-1 p-6 flex items-center justify-center min-h-[300px]">
              <img
                src={convertFileSrc(fullPath)}
                alt={item.name}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg border border-gray-800/80"
              />
            </div>
          ) : isText ? (
            <div className="flex-1 flex flex-col min-h-[300px]">
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center gap-2 text-sm text-blue-400 p-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Cargando contenido del archivo...</span>
                </div>
              ) : errorMsg ? (
                <div className="flex-1 p-6 flex items-center justify-center">
                  <div className="p-4 bg-red-950/50 border border-red-800/70 text-red-200 rounded-xl flex items-start gap-3 max-w-md shadow-lg">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-300">No se pudo leer el archivo</h4>
                      <p className="text-xs text-red-300/80 mt-1">{errorMsg}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-4 overflow-auto font-mono text-xs text-gray-200 leading-relaxed max-h-[65vh] select-text scrollbar-thin">
                  <pre className="whitespace-pre-wrap break-words font-mono">
                    <code>{textContent}</code>
                  </pre>
                </div>
              )}
            </div>
          ) : (
            /* Non-previewable / Binary file or directory fallback */
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center mb-4 text-gray-400 shadow-inner">
                {item.is_dir ? <Folder className="w-8 h-8 text-amber-400" /> : <File className="w-8 h-8 text-gray-400" />}
              </div>
              <h4 className="text-base font-semibold text-gray-200">
                {item.is_dir ? "Vista previa no disponible para carpetas" : "Vista previa no disponible para este tipo de archivo"}
              </h4>
              <p className="text-xs text-gray-400 mt-1 max-w-md">
                {item.is_dir
                  ? "Podés ingresar a la carpeta haciendo doble clic sobre ella."
                  : "Este tipo de archivo binario o no soportado no se puede visualizar directamente."}
              </p>

              {/* Metadata card */}
              <div className="mt-6 w-full max-w-md bg-gray-900/90 border border-gray-800 rounded-xl p-3.5 text-left space-y-2 text-xs text-gray-300 shadow-md">
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500 font-medium">Nombre:</span>
                  <span className="font-mono text-gray-200 truncate max-w-[240px]">{item.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500 font-medium">Ruta:</span>
                  <span className="font-mono text-gray-200 truncate max-w-[240px]" title={fullPath}>{fullPath}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-800/60">
                  <span className="text-gray-500 font-medium">Tamaño:</span>
                  <span className="font-mono text-gray-200">{formatFileSize(item.size, item.is_dir)}</span>
                </div>
                {item.modified_at && (
                  <div className="flex justify-between py-1">
                    <span className="text-gray-500 font-medium">Modificado:</span>
                    <span className="font-mono text-gray-200">{formatDate(item.modified_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-900 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300">Espacio</kbd>
              <span>o</span>
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300">Esc</kbd>
              <span className="ml-0.5">Cerrar</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-700 rounded text-[10px] text-gray-300">⬆ ⬇</kbd>
              <span className="ml-0.5">Navegar</span>
            </span>
          </div>
          <span className="truncate max-w-[240px] text-gray-500" title={fullPath}>{fullPath}</span>
        </div>
      </div>
    </div>
  );
}
