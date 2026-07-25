import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Tab, PanelState } from "../types/tab";
import { useSettings } from "./SettingsContext";
import { matchesShortcut } from "../utils/shortcut";

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
  type: "folder",
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
  showHiddenFiles: boolean;
  toggleShowHiddenFiles: () => void;
  createTab: (initialPath?: string) => void;
  createTerminalTab: (initialPath?: string) => void;
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
  const { settings, updateSection, openSettings } = useSettings();
  const [tabs, setTabs] = useState<Tab[]>([initialTab]);
  const [activeTabIdState, setActiveTabIdState] = useState<string>(initialTab.id);
  const [isSplitViewOpen, setIsSplitViewOpen] = useState<boolean>(false);
  const [leftTabId, setLeftTabId] = useState<string>(initialTab.id);
  const [rightTabId, setRightTabId] = useState<string>(initialTab.id);
  const [activePanel, setActivePanelState] = useState<"left" | "right">("left");

  const showHiddenFiles = settings.general.showHiddenFiles;

  const toggleShowHiddenFiles = useCallback(() => {
    updateSection("general", { showHiddenFiles: !showHiddenFiles });
  }, [showHiddenFiles, updateSection]);

  const activeTabId = isSplitViewOpen
    ? (activePanel === "left" ? leftTabId : rightTabId)
    : activeTabIdState;

  const currentActiveTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const exposedActiveTab: Tab = {
    ...currentActiveTab,
    isSplitViewOpen,
    activePanel: isSplitViewOpen ? activePanel : currentActiveTab.activePanel,
    leftPanel: isSplitViewOpen
      ? (tabs.find((t) => t.id === leftTabId)?.leftPanel || currentActiveTab.leftPanel)
      : currentActiveTab.leftPanel,
    rightPanel: isSplitViewOpen
      ? (tabs.find((t) => t.id === rightTabId)?.leftPanel || currentActiveTab.rightPanel)
      : currentActiveTab.rightPanel,
  };

  const activePanelState = exposedActiveTab.activePanel === "left" ? exposedActiveTab.leftPanel : exposedActiveTab.rightPanel;
  const otherPanelState = exposedActiveTab.activePanel === "left" ? exposedActiveTab.rightPanel : exposedActiveTab.leftPanel;

  const exposedTabs = tabs.map((t) => ({
    ...t,
    isSplitViewOpen: t.id === activeTabId ? isSplitViewOpen : t.isSplitViewOpen,
    rightPanel: t.leftPanel,
  }));

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
      type: "folder",
      title: getTabTitle(initialPath),
      isSplitViewOpen: false,
      activePanel: "left",
      leftPanel: { ...newPanel },
      rightPanel: { ...newPanel },
    };

    setTabs((prev) => [...prev, newTab]);
    if (isSplitViewOpen) {
      if (activePanel === "left") {
        setLeftTabId(newId);
      } else {
        setRightTabId(newId);
      }
    } else {
      setActiveTabIdState(newId);
    }
  }, [isSplitViewOpen, activePanel]);

  const createTerminalTab = useCallback(
    (initialPath: string = DEFAULT_INITIAL_PATH) => {
      const newId = `tab-term-${Date.now()}`;
      const titlePath = getTabTitle(initialPath);
      const newTab: Tab = {
        id: newId,
        type: "terminal",
        title: `Terminal: ${titlePath}`,
        terminalId: `session-${newId}`,
        terminalPath: initialPath,
        isSplitViewOpen: false,
        activePanel: "left",
        leftPanel: { ...defaultPanelState, currentPath: initialPath },
        rightPanel: { ...defaultPanelState, currentPath: initialPath },
      };

      setTabs((prev) => [...prev, newTab]);
      if (isSplitViewOpen) {
        if (activePanel === "left") {
          setLeftTabId(newId);
        } else {
          setRightTabId(newId);
        }
      } else {
        setActiveTabIdState(newId);
      }
    },
    [isSplitViewOpen, activePanel]
  );

  const closeTab = useCallback(
    (id: string) => {
      setTabs((prev) => {
        if (prev.length <= 1) return prev;

        const targetIndex = prev.findIndex((t) => t.id === id);
        if (targetIndex === -1) return prev;

        const newTabs = prev.filter((t) => t.id !== id);

        if (isSplitViewOpen) {
          if (newTabs.length === 1) {
            setIsSplitViewOpen(false);
            const remainingTabId = newTabs[0].id;
            setActiveTabIdState(remainingTabId);
          } else {
            if (leftTabId === id) {
              const nextLeft = newTabs.find((t) => t.id !== rightTabId) || newTabs[0];
              setLeftTabId(nextLeft.id);
            }
            if (rightTabId === id) {
              const nextRight = newTabs.find((t) => t.id !== leftTabId) || newTabs[0];
              setRightTabId(nextRight.id);
            }
          }
        } else {
          if (activeTabIdState === id) {
            const nextIndex = Math.max(0, targetIndex - 1);
            setActiveTabIdState(newTabs[nextIndex].id);
          }
        }

        return newTabs;
      });
    },
    [isSplitViewOpen, leftTabId, rightTabId, activeTabIdState]
  );

  const selectTab = useCallback((id: string) => {
    if (isSplitViewOpen) {
      if (activePanel === "left") {
        setLeftTabId(id);
      } else {
        setRightTabId(id);
      }
    } else {
      setActiveTabIdState(id);
    }
  }, [isSplitViewOpen, activePanel]);

  const toggleSplitView = useCallback(() => {
    if (!isSplitViewOpen) {
      const currentActive = activeTabIdState;
      setLeftTabId(currentActive);

      const currentIndex = tabs.findIndex((t) => t.id === currentActive);
      if (tabs.length > 1) {
        const nextIndex = (currentIndex + 1) % tabs.length;
        setRightTabId(tabs[nextIndex].id);
        setIsSplitViewOpen(true);
        setActivePanelState("left");
      } else {
        const activeTabObj = tabs[0] || initialTab;
        const newId = `tab-${Date.now()}`;
        const clonedTab: Tab = {
          ...activeTabObj,
          id: newId,
          leftPanel: { ...activeTabObj.leftPanel, history: [...activeTabObj.leftPanel.history] },
          rightPanel: { ...activeTabObj.rightPanel, history: [...activeTabObj.rightPanel.history] },
          title: activeTabObj.type === "terminal" ? `${activeTabObj.title} (Copia)` : `${activeTabObj.title} (Copia)`,
          isSplitViewOpen: false,
        };
        setTabs((prevTabs) => [...prevTabs, clonedTab]);
        setRightTabId(newId);
        setIsSplitViewOpen(true);
        setActivePanelState("left");
      }
    } else {
      const finalActiveTabId = activePanel === "left" ? leftTabId : rightTabId;
      setActiveTabIdState(finalActiveTabId);
      setIsSplitViewOpen(false);
    }
  }, [isSplitViewOpen, activeTabIdState, tabs, activePanel, leftTabId, rightTabId]);

  const setActivePanel = useCallback(
    (panel: "left" | "right") => {
      if (isSplitViewOpen) {
        setActivePanelState(panel);
      } else {
        setTabs((prev) =>
          prev.map((t) => (t.id === activeTabId ? { ...t, activePanel: panel } : t))
        );
      }
    },
    [isSplitViewOpen, activeTabId]
  );

  const updatePanel = useCallback(
    (panel: "left" | "right", updates: Partial<PanelState>) => {
      let targetTabId = activeTabId;
      if (isSplitViewOpen) {
        targetTabId = panel === "left" ? leftTabId : rightTabId;
      }

      setTabs((prev) =>
        prev.map((tab) => {
          if (tab.id !== targetTabId) return tab;

          const targetPanelState = tab.leftPanel;
          const updatedPanelState: PanelState = { ...targetPanelState, ...updates };

          return {
            ...tab,
            title: tab.type === "terminal" ? tab.title : getTabTitle(updatedPanelState.currentPath),
            leftPanel: updatedPanelState,
            rightPanel: updatedPanelState,
          };
        })
      );
    },
    [isSplitViewOpen, activeTabId, leftTabId, rightTabId]
  );

  const updateActivePanel = useCallback(
    (updates: Partial<PanelState>) => {
      updatePanel(exposedActiveTab.activePanel, updates);
    },
    [exposedActiveTab.activePanel, updatePanel]
  );

  const nextTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentActive = isSplitViewOpen ? (activePanel === "left" ? leftTabId : rightTabId) : activeTabIdState;
    const currentIndex = tabs.findIndex((t) => t.id === currentActive);
    const nextIndex = (currentIndex + 1) % tabs.length;
    const nextId = tabs[nextIndex].id;

    if (isSplitViewOpen) {
      if (activePanel === "left") {
        setLeftTabId(nextId);
      } else {
        setRightTabId(nextId);
      }
    } else {
      setActiveTabIdState(nextId);
    }
  }, [tabs, isSplitViewOpen, activePanel, leftTabId, rightTabId, activeTabIdState]);

  const previousTab = useCallback(() => {
    if (tabs.length <= 1) return;
    const currentActive = isSplitViewOpen ? (activePanel === "left" ? leftTabId : rightTabId) : activeTabIdState;
    const currentIndex = tabs.findIndex((t) => t.id === currentActive);
    const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    const prevId = tabs[prevIndex].id;

    if (isSplitViewOpen) {
      if (activePanel === "left") {
        setLeftTabId(prevId);
      } else {
        setRightTabId(prevId);
      }
    } else {
      setActiveTabIdState(prevId);
    }
  }, [tabs, isSplitViewOpen, activePanel, leftTabId, rightTabId, activeTabIdState]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { shortcuts } = settings;

      if (matchesShortcut(e, shortcuts.toggleSplitView)) {
        e.preventDefault();
        toggleSplitView();
      } else if (matchesShortcut(e, shortcuts.toggleHiddenFiles)) {
        e.preventDefault();
        toggleShowHiddenFiles();
      } else if (matchesShortcut(e, shortcuts.newTab)) {
        e.preventDefault();
        createTab();
      } else if (matchesShortcut(e, shortcuts.closeTab)) {
        e.preventDefault();
        if (tabs.length > 1) {
          closeTab(activeTabId);
        }
      } else if (matchesShortcut(e, shortcuts.previousTab)) {
        e.preventDefault();
        previousTab();
      } else if (matchesShortcut(e, shortcuts.nextTab)) {
        e.preventDefault();
        nextTab();
      } else if (matchesShortcut(e, shortcuts.openSettings)) {
        e.preventDefault();
        openSettings();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    createTab,
    closeTab,
    activeTabId,
    tabs.length,
    nextTab,
    previousTab,
    toggleSplitView,
    toggleShowHiddenFiles,
    openSettings,
    settings,
  ]);

  return (
    <TabContext.Provider
      value={{
        tabs: exposedTabs,
        activeTabId,
        activeTab: exposedActiveTab,
        activePanelState,
        otherPanelState,
        showHiddenFiles,
        toggleShowHiddenFiles,
        createTab,
        createTerminalTab,
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
