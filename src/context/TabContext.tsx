import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Tab, PanelState } from "../types/tab";

export function getTabTitle(path: string): string {
  const normalized = path.replace(/\\/g, "/").replace(/\/+$/, "");
  if (!normalized || normalized === "/") return "Raíz";
  if (normalized.endsWith(":")) return `Disco ${normalized.toUpperCase()}`;
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

const DEFAULT_INITIAL_PATH = "C:/";

const defaultPanelState: PanelState = {
  currentPath: DEFAULT_INITIAL_PATH,
  history: [DEFAULT_INITIAL_PATH],
  historyIndex: 0,
  searchQuery: "",
  isFuzzy: true,
};

const initialTab: Tab = {
  id: "tab-1",
  title: getTabTitle(DEFAULT_INITIAL_PATH),
  isSplitViewOpen: false,
  activePanel: "left",
  leftPanel: { ...defaultPanelState },
  rightPanel: { ...defaultPanelState },
};

interface TabContextType {
  tabs: Tab[];
  activeTabId: string;
  activeTab: Tab;
  activePanelState: PanelState;
  otherPanelState: PanelState;
  createTab: (initialPath?: string) => void;
  closeTab: (id: string) => void;
  selectTab: (id: string) => void;
  toggleSplitView: () => void;
  setActivePanel: (panel: "left" | "right") => void;
  updateActivePanel: (updates: Partial<PanelState>) => void;
  updatePanel: (panel: "left" | "right", updates: Partial<PanelState>) => void;
  nextTab: () => void;
  previousTab: () => void;
}

const TabContext = createContext<TabContextType | null>(null);

export function TabProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([initialTab]);
  const [activeTabId, setActiveTabId] = useState<string>(initialTab.id);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const activePanelState = activeTab.activePanel === "left" ? activeTab.leftPanel : activeTab.rightPanel;
  const otherPanelState = activeTab.activePanel === "left" ? activeTab.rightPanel : activeTab.leftPanel;

  const createTab = useCallback((initialPath: string = DEFAULT_INITIAL_PATH) => {
    const newId = `tab-${Date.now()}`;
    const newPanel: PanelState = {
      currentPath: initialPath,
      history: [initialPath],
      historyIndex: 0,
      searchQuery: "",
      isFuzzy: true,
    };
    const newTab: Tab = {
      id: newId,
      title: getTabTitle(initialPath),
      isSplitViewOpen: false,
      activePanel: "left",
      leftPanel: { ...newPanel },
      rightPanel: { ...newPanel },
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
  }, []);

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;

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

  const toggleSplitView = useCallback(() => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;

        const nextSplitState = !t.isSplitViewOpen;
        // If turning on split view, sync right panel path with left panel if right is unchanged
        const updatedRight = {
          ...t.rightPanel,
          currentPath: nextSplitState && t.rightPanel.currentPath === DEFAULT_INITIAL_PATH ? t.leftPanel.currentPath : t.rightPanel.currentPath,
          history: nextSplitState && t.rightPanel.currentPath === DEFAULT_INITIAL_PATH ? [...t.leftPanel.history] : t.rightPanel.history,
        };

        return {
          ...t,
          isSplitViewOpen: nextSplitState,
          rightPanel: updatedRight,
        };
      })
    );
  }, [activeTabId]);

  const setActivePanel = useCallback(
    (panel: "left" | "right") => {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, activePanel: panel } : t))
      );
    },
    [activeTabId]
  );

  const updatePanel = useCallback(
    (panel: "left" | "right", updates: Partial<PanelState>) => {
      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== activeTabId) return tab;

          const targetPanel = panel === "left" ? tab.leftPanel : tab.rightPanel;
          const updatedPanelState: PanelState = { ...targetPanel, ...updates };

          const isLeftActive = tab.activePanel === "left";
          const mainPath = isLeftActive
            ? panel === "left"
              ? updatedPanelState.currentPath
              : tab.leftPanel.currentPath
            : panel === "right"
            ? updatedPanelState.currentPath
            : tab.leftPanel.currentPath;

          return {
            ...tab,
            title: getTabTitle(mainPath),
            [panel === "left" ? "leftPanel" : "rightPanel"]: updatedPanelState,
          };
        })
      );
    },
    [activeTabId]
  );

  const updateActivePanel = useCallback(
    (updates: Partial<PanelState>) => {
      updatePanel(activeTab.activePanel, updates);
    },
    [activeTab.activePanel, updatePanel]
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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+\: Toggle Split View
      if ((e.ctrlKey || e.metaKey) && (e.key === "\\" || e.code === "Backslash")) {
        e.preventDefault();
        toggleSplitView();
      }
      // Ctrl+T: New tab
      else if ((e.ctrlKey || e.metaKey) && (e.key === "t" || e.key === "T")) {
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
  }, [createTab, closeTab, activeTabId, tabs.length, nextTab, previousTab, toggleSplitView]);

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTabId,
        activeTab,
        activePanelState,
        otherPanelState,
        createTab,
        closeTab,
        selectTab,
        toggleSplitView,
        setActivePanel,
        updateActivePanel,
        updatePanel,
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
