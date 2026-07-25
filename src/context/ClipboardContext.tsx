import { createContext, useContext, useState, ReactNode } from "react";
import { FileItem, FileInfo } from "../types/file";

export type ListItem = FileItem | FileInfo;

export interface ClipboardData {
  items: ListItem[];
  action: "copy" | "cut";
  sourcePath: string;
}

interface ClipboardContextType {
  clipboard: ClipboardData | null;
  setClipboard: (data: ClipboardData | null) => void;
  copySelected: (items: ListItem[], sourcePath: string) => void;
  cutSelected: (items: ListItem[], sourcePath: string) => void;
  clearClipboard: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | null>(null);

export function ClipboardProvider({ children }: { children: ReactNode }) {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const copySelected = (items: ListItem[], sourcePath: string) => {
    if (items.length === 0) return;
    setClipboard({ items, action: "copy", sourcePath });
  };

  const cutSelected = (items: ListItem[], sourcePath: string) => {
    if (items.length === 0) return;
    setClipboard({ items, action: "cut", sourcePath });
  };

  const clearClipboard = () => {
    setClipboard(null);
  };

  return (
    <ClipboardContext.Provider
      value={{
        clipboard,
        setClipboard,
        copySelected,
        cutSelected,
        clearClipboard,
      }}
    >
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error("useClipboard must be used within a ClipboardProvider");
  }
  return context;
}
