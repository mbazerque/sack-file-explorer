import { useEffect, useState } from "react";
import { useNavigation } from "./hooks/useNavigation";
import { useSearch } from "./hooks/useSearch";
import { useTabContext } from "./context/TabContext";
import { useClipboard } from "./context/ClipboardContext";
import { invoke } from "@tauri-apps/api/core";
import { FileInfo } from "./types/file";
import { TabBar } from "./components/TabBar";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { FileList } from "./components/FileList";
import { FileGrid } from "./components/FileGrid";
import { Footer } from "./components/Footer";
import { BottomTerminal } from "./components/BottomTerminal";
import { TabTerminal } from "./components/TabTerminal";
import "./App.css";

function App() {
  const { tabs, activeTab, createTerminalTab, setActivePanel, toggleSplitView } = useTabContext();
  const { clipboard, copySelected, cutSelected, clearClipboard } = useClipboard();

  const [isBottomTerminalOpen, setIsBottomTerminalOpen] = useState(false);
  const [bottomSessionId] = useState(() => `session-bottom-${Date.now()}`);

  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    try {
      const saved = localStorage.getItem("sack-view-mode");
      return saved === "grid" ? "grid" : "table";
    } catch {
      return "table";
    }
  });

  const handleViewModeChange = (mode: "table" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem("sack-view-mode", mode);
    } catch (err) {
      console.error("Failed to save view mode:", err);
    }
  };

  const leftNav = useNavigation("left");
  const rightNav = useNavigation("right");

  const leftSearch = useSearch("left");
  const rightSearch = useSearch("right");

  const isSplitViewOpen = activeTab.isSplitViewOpen;
  const activeSide = activeTab.activePanel;

  const activeNav = activeSide === "left" ? leftNav : rightNav;
  const activeSearch = activeSide === "left" ? leftSearch : rightSearch;

  // Global Navigation & Core Operations Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable ||
        (document.activeElement as HTMLElement)?.closest(".xterm") !== null;

      // 1. Ctrl + L: Focus address bar in edit mode
      if ((e.ctrlKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("focus-address-bar"));
        return;
      }

      // 2. Ctrl + J or Ctrl + ~ / Ctrl + ` to toggle bottom terminal
      const isTerminalShortcut =
        (e.ctrlKey || e.metaKey) &&
        (e.key === "j" || e.key === "J" || e.code === "KeyJ" || e.code === "Backquote" || e.key === "~" || e.key === "`");

      if (isTerminalShortcut) {
        e.preventDefault();
        setIsBottomTerminalOpen((prev) => !prev);
        return;
      }

      // Skip remaining navigation/file operation hotkeys if user is typing in an input/textarea/terminal
      if (isInputFocused) return;

      // 3. Ctrl + C: Copy selected items to clipboard
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        if (activeNav.selectedItems.length > 0) {
          e.preventDefault();
          copySelected(activeNav.selectedItems, activeNav.currentPath);
        }
      }
      // 4. Ctrl + X: Cut selected items to clipboard
      else if ((e.ctrlKey || e.metaKey) && (e.key === "x" || e.key === "X")) {
        if (activeNav.selectedItems.length > 0) {
          e.preventDefault();
          cutSelected(activeNav.selectedItems, activeNav.currentPath);
        }
      }
      // 5. Ctrl + V: Paste clipboard contents
      else if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
        if (clipboard && clipboard.items.length > 0) {
          e.preventDefault();
          try {
            for (const item of clipboard.items) {
              const fileInfo = item as Partial<FileInfo>;
              const srcPath =
                fileInfo.path ||
                (clipboard.sourcePath.endsWith("/") || clipboard.sourcePath.endsWith("\\")
                  ? `${clipboard.sourcePath}${item.name}`
                  : `${clipboard.sourcePath}/${item.name}`);

              if (clipboard.action === "copy") {
                await invoke("copy_item", { src: srcPath, dstDir: activeNav.currentPath });
              } else if (clipboard.action === "cut") {
                await invoke("move_item", { src: srcPath, dstDir: activeNav.currentPath });
              }
            }
            if (clipboard.action === "cut") {
              clearClipboard();
            }
            await activeNav.refresh();
          } catch (err) {
            alert(`Error al pegar elementos: ${String(err)}`);
          }
        }
      }
      // 6. F2: Trigger inline rename
      else if (e.key === "F2") {
        if (activeNav.selectedItems.length > 0 || activeNav.selectedItem) {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("trigger-inline-rename"));
        }
      }
      // 7. Delete: Trash selected items to Recycle Bin
      else if (e.key === "Delete" || e.code === "Delete") {
        if (activeNav.selectedItems.length > 0) {
          e.preventDefault();
          const confirmDelete = window.confirm(
            activeNav.selectedItems.length === 1
              ? `¿Mover "${activeNav.selectedItems[0].name}" a la Papelera de Reciclaje?`
              : `¿Mover ${activeNav.selectedItems.length} elementos a la Papelera de Reciclaje?`
          );
          if (confirmDelete) {
            try {
              for (const item of activeNav.selectedItems) {
                const fileInfo = item as Partial<FileInfo>;
                const itemPath =
                  fileInfo.path ||
                  (activeNav.currentPath.endsWith("/") || activeNav.currentPath.endsWith("\\")
                    ? `${activeNav.currentPath}${item.name}`
                    : `${activeNav.currentPath}/${item.name}`);
                await invoke("trash_item", { path: itemPath });
              }
              activeNav.clearSelection();
              await activeNav.refresh();
            } catch (err) {
              alert(`Error al mover a la Papelera de Reciclaje: ${String(err)}`);
            }
          }
        }
      }
      // 8. Alt + Left Arrow or Backspace: Go Back
      else if ((e.altKey && (e.key === "ArrowLeft" || e.code === "ArrowLeft")) || e.key === "Backspace") {
        if (activeNav.canGoBack) {
          e.preventDefault();
          activeNav.goBack();
        }
      }
      // 9. Alt + Right Arrow: Go Forward
      else if (e.altKey && (e.key === "ArrowRight" || e.code === "ArrowRight")) {
        if (activeNav.canGoForward) {
          e.preventDefault();
          activeNav.goForward();
        }
      }
      // 10. Alt + Up Arrow: Go Up (Parent Directory)
      else if (e.altKey && (e.key === "ArrowUp" || e.code === "ArrowUp")) {
        if (activeNav.canGoUp) {
          e.preventDefault();
          activeNav.goUp();
        }
      }
      // 11. Ctrl + R or F5: Refresh
      else if (((e.ctrlKey || e.metaKey) && (e.key === "r" || e.key === "R")) || e.key === "F5") {
        e.preventDefault();
        activeNav.refresh();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNav, clipboard, copySelected, cutSelected, clearClipboard]);

  const handlePromoteToTab = () => {
    setIsBottomTerminalOpen(false);
    createTerminalTab(activeNav.currentPath);
  };

  const activeFiles = activeSearch.isSearchActive ? activeSearch.searchResults : activeNav.files;
  const activeScanning = activeSearch.isSearchActive ? activeSearch.isSearching : activeNav.isScanning;

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden font-sans">
      {/* 1. Top Custom Titlebar with Tabs (100% width) */}
      <TabBar />

      {/* 2. Top Navigation & Search Header (100% width edge to edge) */}
      <div className="px-3 py-1.5 border-b border-gray-800 bg-gray-900 z-10 shadow-sm shrink-0 w-full">
        <Navbar
          currentPath={activeNav.currentPath}
          isScanning={activeNav.isScanning}
          canGoBack={activeNav.canGoBack}
          canGoForward={activeNav.canGoForward}
          canGoUp={activeNav.canGoUp}
          onNavigate={(path) => {
            activeSearch.clearSearch();
            activeNav.scanPath(path);
          }}
          onGoBack={() => {
            activeSearch.clearSearch();
            activeNav.goBack();
          }}
          onGoForward={() => {
            activeSearch.clearSearch();
            activeNav.goForward();
          }}
          onGoUp={() => {
            activeSearch.clearSearch();
            activeNav.goUp();
          }}
          searchQuery={activeSearch.searchQuery}
          onSearchChange={activeSearch.setSearchQuery}
          useFuzzy={activeSearch.useFuzzy}
          onToggleFuzzy={() => activeSearch.setUseFuzzy((prev) => !prev)}
          isSearching={activeSearch.isSearching}
          onClearSearch={activeSearch.clearSearch}
          searchInputRef={activeSearch.inputRef}
          isSplitViewOpen={isSplitViewOpen}
          onToggleSplitView={toggleSplitView}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
        />
      </div>

      {/* 3. Central Content Area: Sidebar on left + Main Content on right */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
          <Sidebar
            onNavigate={(p) => {
              activeSearch.clearSearch();
              activeNav.scanPath(p);
            }}
            currentPath={activeNav.currentPath}
          />

          <main
            onClick={() => activeNav.clearSelection()}
            className="flex-1 overflow-y-auto bg-gray-950 relative min-w-0 flex flex-col"
          >
            {/* ── Terminal tabs: always mounted, shown/hidden via CSS to preserve PTY processes ── */}
            {tabs
              .filter((t) => t.type === "terminal")
              .map((t) => (
                <div
                  key={t.id}
                  style={{ display: activeTab.id === t.id ? "flex" : "none" }}
                  className="flex-1 min-h-0 flex-col"
                >
                  <TabTerminal
                    sessionId={t.terminalId || `session-${t.id}`}
                    cwd={t.terminalPath || activeNav.currentPath}
                  />
                </div>
              ))}

            {/* ── File explorer view: only shown when the active tab is not a terminal ── */}
            {activeTab.type !== "terminal" && (
              !isSplitViewOpen ? (
                // Single Panel View
                viewMode === "grid" ? (
                  <FileGrid
                    files={activeFiles}
                    isScanning={activeScanning}
                    errorMsg={activeSearch.isSearchActive ? activeSearch.searchError : activeNav.errorMsg}
                    selectedItem={activeNav.selectedItem}
                    selectedItems={activeNav.selectedItems}
                    onSelectItem={activeNav.selectSingle}
                    onSelectSingle={activeNav.selectSingle}
                    onToggleSelect={activeNav.toggleSelect}
                    onRangeSelect={activeNav.rangeSelect}
                    onClearSelection={activeNav.clearSelection}
                    onNavigate={(path) => {
                      activeSearch.clearSearch();
                      activeNav.scanPath(path);
                    }}
                    onRefresh={activeNav.refresh}
                    currentPath={activeNav.currentPath}
                    isSearchMode={activeSearch.isSearchActive}
                    searchQuery={activeSearch.searchQuery}
                    useFuzzy={activeSearch.useFuzzy}
                    isSplitViewOpen={false}
                  />
                ) : (
                  <FileList
                    files={activeFiles}
                    isScanning={activeScanning}
                    errorMsg={activeSearch.isSearchActive ? activeSearch.searchError : activeNav.errorMsg}
                    selectedItem={activeNav.selectedItem}
                    selectedItems={activeNav.selectedItems}
                    onSelectItem={activeNav.selectSingle}
                    onSelectSingle={activeNav.selectSingle}
                    onToggleSelect={activeNav.toggleSelect}
                    onRangeSelect={activeNav.rangeSelect}
                    onClearSelection={activeNav.clearSelection}
                    onNavigate={(path) => {
                      activeSearch.clearSearch();
                      activeNav.scanPath(path);
                    }}
                    onRefresh={activeNav.refresh}
                    currentPath={activeNav.currentPath}
                    isSearchMode={activeSearch.isSearchActive}
                    searchQuery={activeSearch.searchQuery}
                    useFuzzy={activeSearch.useFuzzy}
                    isSplitViewOpen={false}
                  />
                )
              ) : (
                // Dual Panel Split View
                <div className="grid grid-cols-2 gap-3 p-3 h-full overflow-y-auto">
                  {/* Left Panel */}
                  {viewMode === "grid" ? (
                    <FileGrid
                      files={leftSearch.isSearchActive ? leftSearch.searchResults : leftNav.files}
                      isScanning={leftSearch.isSearchActive ? leftSearch.isSearching : leftNav.isScanning}
                      errorMsg={leftSearch.isSearchActive ? leftSearch.searchError : leftNav.errorMsg}
                      selectedItem={leftNav.selectedItem}
                      selectedItems={leftNav.selectedItems}
                      onSelectItem={leftNav.selectSingle}
                      onSelectSingle={leftNav.selectSingle}
                      onToggleSelect={leftNav.toggleSelect}
                      onRangeSelect={leftNav.rangeSelect}
                      onClearSelection={leftNav.clearSelection}
                      onNavigate={(path) => {
                        leftSearch.clearSearch();
                        leftNav.scanPath(path);
                      }}
                      onRefresh={leftNav.refresh}
                      currentPath={leftNav.currentPath}
                      isSearchMode={leftSearch.isSearchActive}
                      searchQuery={leftSearch.searchQuery}
                      useFuzzy={leftSearch.useFuzzy}
                      isSplitViewOpen={true}
                      targetPanelPath={rightNav.currentPath}
                      onOtherPanelRefresh={rightNav.refresh}
                      isActivePanel={activeSide === "left"}
                      onPanelFocus={() => setActivePanel("left")}
                    />
                  ) : (
                    <FileList
                      files={leftSearch.isSearchActive ? leftSearch.searchResults : leftNav.files}
                      isScanning={leftSearch.isSearchActive ? leftSearch.isSearching : leftNav.isScanning}
                      errorMsg={leftSearch.isSearchActive ? leftSearch.searchError : leftNav.errorMsg}
                      selectedItem={leftNav.selectedItem}
                      selectedItems={leftNav.selectedItems}
                      onSelectItem={leftNav.selectSingle}
                      onSelectSingle={leftNav.selectSingle}
                      onToggleSelect={leftNav.toggleSelect}
                      onRangeSelect={leftNav.rangeSelect}
                      onClearSelection={leftNav.clearSelection}
                      onNavigate={(path) => {
                        leftSearch.clearSearch();
                        leftNav.scanPath(path);
                      }}
                      onRefresh={leftNav.refresh}
                      currentPath={leftNav.currentPath}
                      isSearchMode={leftSearch.isSearchActive}
                      searchQuery={leftSearch.searchQuery}
                      useFuzzy={leftSearch.useFuzzy}
                      isSplitViewOpen={true}
                      targetPanelPath={rightNav.currentPath}
                      onOtherPanelRefresh={rightNav.refresh}
                      isActivePanel={activeSide === "left"}
                      onPanelFocus={() => setActivePanel("left")}
                    />
                  )}

                  {/* Right Panel */}
                  {viewMode === "grid" ? (
                    <FileGrid
                      files={rightSearch.isSearchActive ? rightSearch.searchResults : rightNav.files}
                      isScanning={rightSearch.isSearchActive ? rightSearch.isSearching : rightNav.isScanning}
                      errorMsg={rightSearch.isSearchActive ? rightSearch.searchError : rightNav.errorMsg}
                      selectedItem={rightNav.selectedItem}
                      selectedItems={rightNav.selectedItems}
                      onSelectItem={rightNav.selectSingle}
                      onSelectSingle={rightNav.selectSingle}
                      onToggleSelect={rightNav.toggleSelect}
                      onRangeSelect={rightNav.rangeSelect}
                      onClearSelection={rightNav.clearSelection}
                      onNavigate={(path) => {
                        rightSearch.clearSearch();
                        rightNav.scanPath(path);
                      }}
                      onRefresh={rightNav.refresh}
                      currentPath={rightNav.currentPath}
                      isSearchMode={rightSearch.isSearchActive}
                      searchQuery={rightSearch.searchQuery}
                      useFuzzy={rightSearch.useFuzzy}
                      isSplitViewOpen={true}
                      targetPanelPath={leftNav.currentPath}
                      onOtherPanelRefresh={leftNav.refresh}
                      isActivePanel={activeSide === "right"}
                      onPanelFocus={() => setActivePanel("right")}
                    />
                  ) : (
                    <FileList
                      files={rightSearch.isSearchActive ? rightSearch.searchResults : rightNav.files}
                      isScanning={rightSearch.isSearchActive ? rightSearch.isSearching : rightNav.isScanning}
                      errorMsg={rightSearch.isSearchActive ? rightSearch.searchError : rightNav.errorMsg}
                      selectedItem={rightNav.selectedItem}
                      selectedItems={rightNav.selectedItems}
                      onSelectItem={rightNav.selectSingle}
                      onSelectSingle={rightNav.selectSingle}
                      onToggleSelect={rightNav.toggleSelect}
                      onRangeSelect={rightNav.rangeSelect}
                      onClearSelection={rightNav.clearSelection}
                      onNavigate={(path) => {
                        rightSearch.clearSearch();
                        rightNav.scanPath(path);
                      }}
                      onRefresh={rightNav.refresh}
                      currentPath={rightNav.currentPath}
                      isSearchMode={rightSearch.isSearchActive}
                      searchQuery={rightSearch.searchQuery}
                      useFuzzy={rightSearch.useFuzzy}
                      isSplitViewOpen={true}
                      targetPanelPath={leftNav.currentPath}
                      onOtherPanelRefresh={leftNav.refresh}
                      isActivePanel={activeSide === "right"}
                      onPanelFocus={() => setActivePanel("right")}
                    />
                  )}
                </div>
              )
            )}
          </main>
        </div>

        {/* Collapsible Bottom Terminal Panel */}
        <BottomTerminal
          isOpen={isBottomTerminalOpen}
          onClose={() => setIsBottomTerminalOpen(false)}
          onPromoteToTab={handlePromoteToTab}
          currentPath={activeNav.currentPath}
          sessionId={bottomSessionId}
        />
      </div>

      {/* 4. Footer (100% width edge to edge) */}
      <Footer
        files={activeFiles}
        selectedItem={activeNav.selectedItem}
        selectedItems={activeNav.selectedItems}
        isScanning={activeScanning}
      />
    </div>
  );
}

export default App;
