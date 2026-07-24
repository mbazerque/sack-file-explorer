import { FileItem } from "../types/file";

interface FooterProps {
  files: FileItem[];
  selectedItem: FileItem | null;
  isScanning: boolean;
}

function formatFileSize(bytes: number, isDir: boolean): string {
  if (isDir) return "--";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function Footer({ files, selectedItem, isScanning }: FooterProps) {
  const totalItems = files.length;
  const totalFolders = files.filter((f) => f.is_dir).length;
  const totalFiles = files.filter((f) => !f.is_dir).length;

  return (
    <footer className="h-9 bg-gray-900 border-t border-gray-800 px-4 flex items-center justify-between text-xs text-gray-400 select-none shrink-0 z-10">
      <div className="flex items-center gap-4">
        {isScanning ? (
          <span className="flex items-center gap-2 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Cargando contenido...
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-gray-200">{totalItems}</strong> {totalItems === 1 ? "elemento" : "elementos"}
              {totalItems > 0 && (
                <span className="text-gray-500 ml-1.5">
                  ({totalFolders} {totalFolders === 1 ? "carpeta" : "carpetas"}, {totalFiles} {totalFiles === 1 ? "archivo" : "archivos"})
                </span>
              )}
            </span>

            {selectedItem && (
              <>
                <span className="w-[1px] h-3 bg-gray-700" />
                <span className="text-blue-400 font-medium truncate max-w-xs">
                  Seleccionado: <span className="text-gray-200">"{selectedItem.name}"</span>{" "}
                  <span className="text-gray-500 font-mono text-[11px]">
                    ({selectedItem.is_dir ? "Carpeta" : formatFileSize(selectedItem.size, false)})
                  </span>
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="text-gray-500 font-mono text-[11px]">
        File Explorer v0.1.0
      </div>
    </footer>
  );
}
