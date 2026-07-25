import { Terminal as TerminalIcon, Folder } from "lucide-react";
import { TerminalComponent } from "./TerminalComponent";

interface TabTerminalProps {
  sessionId: string;
  cwd: string;
}

export function TabTerminal({ sessionId, cwd }: TabTerminalProps) {
  return (
    <div className="flex-1 flex flex-col h-full bg-gray-950 overflow-hidden">
      {/* Header bar inside full tab */}
      <div className="h-8 bg-gray-900/90 border-b border-gray-800 px-3 flex items-center justify-between text-xs text-gray-300 select-none shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px] text-gray-300 truncate">
          <TerminalIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-emerald-400">Consola Interactiva</span>
          <span className="text-gray-600">|</span>
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
          <span className="truncate text-gray-300">{cwd}</span>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 min-h-0 relative">
        <TerminalComponent sessionId={sessionId} cwd={cwd} />
      </div>
    </div>
  );
}
