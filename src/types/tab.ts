export type TabType = "folder" | "terminal";

export interface PanelState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  searchQuery: string;
  isFuzzy: boolean;
}

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  terminalId?: string;
  terminalPath?: string;
  isSplitViewOpen: boolean;
  activePanel: "left" | "right";
  leftPanel: PanelState;
  rightPanel: PanelState;
}
