import { Folder, HardDrive, Plus, X } from "lucide-react";
import { useTabContext } from "../context/TabContext";

function getTabIcon(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized || normalized === "/" || normalized.endsWith(":")) {
    return <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  return <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
}

export function TabBar() {
  const { tabs, activeTabId, selectTab, closeTab, createTab } = useTabContext();

  return (
    <div className="flex items-center bg-gray-950 border-b border-gray-800/80 px-2 pt-1.5 gap-1 select-none overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1 min-w-0 max-w-full">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;

          return (
            <div
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition-all max-w-[180px] shrink-0 ${
                isActive
                  ? "bg-gray-900 border-gray-700/80 text-gray-100 shadow-sm border-t-2 border-t-blue-500 z-10"
                  : "bg-gray-950/60 border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/40"
              }`}
            >
              {getTabIcon(tab.currentPath)}
              <span className="truncate flex-1 font-sans">{tab.title}</span>

              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  title="Cerrar pestaña (Ctrl+W)"
                  className={`p-0.5 rounded-md transition-all ${
                    isActive
                      ? "text-gray-400 hover:text-white hover:bg-gray-800"
                      : "opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* New Tab Button */}
      <button
        type="button"
        onClick={() => createTab()}
        title="Nueva pestaña (Ctrl+T)"
        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors shrink-0 ml-0.5 mb-0.5"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
