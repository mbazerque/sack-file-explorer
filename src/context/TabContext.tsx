import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Tab } from "../types/tab";

export function getTabTitle(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized || normalized === "/") return "Raíz";
  if (normalized.endsWith(":")) return `Disco ${normalized.toUpperCase()}`;
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  activeTab: Tab;
  createTab: (initialPath?: string) => void;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  updateActiveTab: (updates: Partial<Tab>) => void;
  nextTab: () => void;
  previousTab: () => void;
}

const DEFAULT_INITIAL_PATH = "C:/";

const initialTab: Tab = {
  id: "tab-1",
  title: getTabTitle(DEFAULT_INITIAL_PATH),
  currentPath: DEFAULT_INITIAL_PATH,
  history: [DEFAULT_INITIAL_PATH],
  historyIndex: 0,
  searchQuery: "",
  isFuzzy: true,
};

const TabContext = createContext<TabContextType | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([initialTab]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const createTab = useCallback((initialPath: string = DEFAULT_INITIAL_PATH) => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: getTabTitle(initialPath),
      currentPath: initialPath,
      history: [initialPath],
      historyIndex: 0,
      searchQuery: "",
      isFuzzy: true,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev; // Keep at least one tab

        const targetIndex = prev.findIndex((t) => t.id === id);
        if (targetIndex === -1) return prev;

        const newTabs = prev.filter((t) => t.id !== id);

        if (activeTabId === id) {
          const nextIndex = Math.max(0, targetIndex - 1);
          setActiveTabId(newTabs[nextIndex].id);
        }

        return newTabs;
      });
    },
    [activeTabId]
  );

  const selectTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const updateActiveTab = useCallback(
    (updates: Partial<Tab>) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;

          const updatedPath = updates.currentPath ?? tab.currentPath;
          const updatedTitle = updates.currentPath ? getTabTitle(updatedPath) : (updates.title ?? tab.title);

          return {
            ...tab,
            ...updates,
            title: updatedTitle,
          };
        })
      );
    },
    [activeTabId]
  );

  const nextTab = useCallback(() => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const currentIndex = prev.findIndex((t) => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % prev.length;
      setActiveTabId(prev[nextIndex].id);
      return prev;
    });
  }, [activeTabId]);

  const previousTab = useCallback(() => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;
      const currentIndex = prev.findIndex((t) => t.id === activeTabId);
      const prevIndex = (currentIndex - 1 + prev.length) % prev.length;
      setActiveTabId(prev[prevIndex].id);
      return prev;
    });
  }, [activeTabId]);

  // Global Keyboard Shortcuts: Ctrl+T (New tab), Ctrl+W (Close tab), Ctrl+Tab (Next tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+T: New tab
      if ((e.ctrlKey || e.metaKey) && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        createTab();
      }
      // Ctrl+W: Close active tab
      else if ((e.ctrlKey || e.metaKey) && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        if (tabs.length > 1) {
          closeTab(activeTabId);
        }
      }
      // Ctrl+Tab / Ctrl+Shift+Tab: Next / Previous tab
      else if ((e.ctrlKey || e.metaKey) && e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          previousTab();
        } else {
          nextTab();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createTab, closeTab, activeTabId, tabs.length, nextTab, previousTab]);

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        activeTab,
        createTab,
        closeTab,
        selectTab,
        updateActiveTab,
        nextTab,
        previousTab,
      }}
    >
      {children}
    </TabContext.Provider>
  );
}

export function useTabContext() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabContext must be used within a TabProvider");
  }
  return context;
}
