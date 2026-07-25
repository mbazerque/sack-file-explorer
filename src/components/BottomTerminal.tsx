import { ExternalLink, X, Terminal as TerminalIcon, Folder } from "lucide-react";
import { TerminalComponent } from "./TerminalComponent";

interface BottomTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromoteToTab: () => void;
  currentPath: string;
  sessionId: string;
}

export function BottomTerminal({
  isOpen,
  onClose,
  onPromoteToTab,
  currentPath,
  sessionId,
}: BottomTerminalProps) {
  if (!isOpen) return null;

  return (
    <div className="h-64 border-t border-gray-800 bg-gray-950 flex flex-col shrink-0 z-20 shadow-lg w-full">
      {/* Header */}
      <div className="h-8 bg-gray-900 border-b border-gray-800 px-3 flex items-center justify-between text-xs text-gray-300 select-none shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-300 truncate">
          <TerminalIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="font-semibold text-blue-400">Terminal</span>
          <span className="text-gray-600">|</span>
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
          <span className="truncate text-gray-300">{currentPath}</span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPromoteToTab}
            title="Convertir en Pestaña"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-[11px] font-sans border border-gray-700/60"
          >
            <ExternalLink className="w-3 h-3 text-blue-400" />
            <span>Convertir en Pestaña</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Cerrar terminal (Ctrl+J)"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Area */}
      <div className="flex-1 min-h-0 relative">
        <TerminalComponent sessionId={sessionId} cwd={currentPath} />
      </div>
    </div>
  );
}
