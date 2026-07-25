import { useEffect, useRef } from "react";
import { Folder, HardDrive, Plus, X } from "lucide-react";
import { useTabContext } from "../context/TabContext";
import { WindowControls } from "./WindowControls";

function getTabIcon(path: string) {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized || normalized === "/" || normalized.endsWith(":")) {
    return <HardDrive className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  }
  return <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
}

export function TabBar() {
  const { tabs, activeTabId, selectTab, closeTab, createTab } = useTabContext();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between bg-gray-950 border-b border-gray-800/80 pl-2 pr-0 select-none w-full shrink-0 h-9"
    >
      <div
        ref={scrollRef}
        data-tauri-drag-region
        className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto scrollbar-none h-full pt-1"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const currentPath = tab.activePanel === "left" ? tab.leftPanel.currentPath : tab.rightPanel.currentPath;

          return (
            <div
              key={tab.id}
              data-tauri-drag-region="false"
              onClick={(e) => {
                e.stopPropagation();
                selectTab(tab.id);
              }}
              className={`group relative flex items-center gap-2 px-3 py-1 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition-all max-w-[200px] min-w-[120px] shrink-0 h-full ${
                isActive
                  ? "bg-gray-900 border-gray-700/80 text-gray-100 shadow-sm border-t-2 border-t-blue-500 z-10"
                  : "bg-gray-950/60 border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-900/40"
              }`}
            >
              {getTabIcon(currentPath)}
              <span className="truncate flex-1 font-sans pointer-events-none">{tab.title}</span>

              {tabs.length > 1 && (
                <button
                  type="button"
                  data-tauri-drag-region="false"
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

        {/* New Tab Button */}
        <button
          type="button"
          data-tauri-drag-region="false"
          onClick={(e) => {
            e.stopPropagation();
            createTab();
          }}
          title="Nueva pestaña (Ctrl+T)"
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors shrink-0 ml-0.5 mb-1"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Window control buttons (minimize, maximize, close) */}
      <WindowControls />
    </div>
  );
}
