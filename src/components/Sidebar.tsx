interface SidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

const LOCATIONS = [
  { name: "Home", path: "C:/Users" },
  { name: "Documents", path: "C:/Users/Public/Documents" },
  { name: "Downloads", path: "C:/Users/Public/Downloads" },
  { name: "C: Drive", path: "C:/" },
];

export function Sidebar({ onNavigate, currentPath }: SidebarProps) {
  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-4 overflow-y-auto">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Quick Access</h2>
      <ul className="space-y-1">
        {LOCATIONS.map((loc) => (
          <li key={loc.name}>
            <button
              onClick={() => onNavigate(loc.path)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                currentPath.startsWith(loc.path)
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {loc.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
