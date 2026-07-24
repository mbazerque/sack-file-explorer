export interface Tab {
  id: string;
  title: string;
  currentPath: string;
  history: string[];
  historyIndex: number;
  searchQuery: string;
  isFuzzy: boolean;
}
