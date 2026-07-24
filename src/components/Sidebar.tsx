import { Home, FileText, Download, HardDrive } from "lucide-react";

interface SidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

const LOCATIONS = [
  { name: "Home", path: "C:/Users", icon: Home },
  { name: "Documentos", path: "C:/Users/Public/Documents", icon: FileText },
  { name: "Descargas", path: "C:/Users/Public/Downloads", icon: Download },
  { name: "Disco Local (C:)", path: "C:/", icon: HardDrive },
];

export function Sidebar({ onNavigate, currentPath }: SidebarProps) {
  const normCurrent = currentPath.replace(/\\/g, "/").toLowerCase();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-4 overflow-y-auto shrink-0 select-none">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">
        Acceso Rápido
      </h2>
      <ul className="space-y-1">
        {LOCATIONS.map((loc) => {
          const Icon = loc.icon;
          const normLoc = loc.path.replace(/\\/g, "/").toLowerCase();
          const isActive = normCurrent === normLoc || normCurrent.startsWith(normLoc + "/");

          return (
            <li key={loc.name}>
              <button
                type="button"
                onClick={() => onNavigate(loc.path)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-sm ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 font-medium border border-blue-500/20"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-gray-400"}`} />
                <span className="truncate">{loc.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
