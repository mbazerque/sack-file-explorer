export interface PanelState {
  currentPath: string;
  history: string[];
  historyIndex: number;
  searchQuery: string;
  isFuzzy: boolean;
}

export interface Tab {
  id: string;
  title: string;
  isSplitViewOpen: boolean;
  activePanel: "left" | "right";
  leftPanel: PanelState;
  rightPanel: PanelState;
}
