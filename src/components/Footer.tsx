import { FileItem, FileInfo } from "../types/file";

export type ListItem = FileItem | FileInfo;

interface FooterProps {
  files: ListItem[];
  selectedItem: ListItem | null;
  selectedItems?: ListItem[];
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

export function Footer({ files, selectedItem, selectedItems, isScanning }: FooterProps) {
  const totalItems = files.length;
  const totalFolders = files.filter((f) => f.is_dir).length;
  const totalFiles = files.filter((f) => !f.is_dir).length;

  const currentSelectedItems = selectedItems && selectedItems.length > 0 ? selectedItems : selectedItem ? [selectedItem] : [];
  const selectedCount = currentSelectedItems.length;

  const totalSelectedSize = currentSelectedItems.reduce(
    (acc, f) => acc + (f.is_dir ? 0 : f.size || 0),
    0
  );

  return (
    <footer className="h-9 bg-gray-900 border-t border-gray-800 px-4 flex items-center justify-between text-xs text-gray-400 select-none shrink-0 z-10 font-sans">
      <div className="flex items-center gap-4">
        {isScanning ? (
          <span className="flex items-center gap-2 text-blue-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            Escaneando archivos...
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

            {selectedCount > 1 ? (
              <>
                <span className="w-[1px] h-3 bg-gray-700" />
                <span className="text-blue-400 font-semibold">
                  <strong className="text-gray-200">{selectedCount}</strong> elementos seleccionados{" "}
                  {totalSelectedSize > 0 && (
                    <span className="text-gray-400 font-mono text-[11px] font-normal">
                      ({formatFileSize(totalSelectedSize, false)})
                    </span>
                  )}
                </span>
              </>
            ) : selectedItem ? (
              <>
                <span className="w-[1px] h-3 bg-gray-700" />
                <span className="text-blue-400 font-medium truncate max-w-xs">
                  Seleccionado: <span className="text-gray-200">"{selectedItem.name}"</span>{" "}
                  <span className="text-gray-500 font-mono text-[11px]">
                    ({selectedItem.is_dir ? "Carpeta" : formatFileSize(selectedItem.size, false)})
                  </span>
                </span>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="text-gray-500 font-mono text-[11px]">
        Sack v0.4.0
      </div>
    </footer>
  );
}
