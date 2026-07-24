import { useEffect } from "react";
import { useNavigation } from "./hooks/useNavigation";
import { useSearch } from "./hooks/useSearch";
import { useTabContext } from "./context/TabContext";
import { TabBar } from "./components/TabBar";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { FileList } from "./components/FileList";
import { Footer } from "./components/Footer";
import "./App.css";

function App() {
  const { activeTab, setActivePanel, toggleSplitView } = useTabContext();

  const leftNav = useNavigation("left");
  const rightNav = useNavigation("right");

  const leftSearch = useSearch("left");
  const rightSearch = useSearch("right");

  const isSplitViewOpen = activeTab.isSplitViewOpen;
  const activeSide = activeTab.activePanel;

  const activeNav = activeSide === "left" ? leftNav : rightNav;
  const activeSearch = activeSide === "left" ? leftSearch : rightSearch;

  // Keyboard shortcuts: Backspace (go back) and F5 (refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "F5") {
        e.preventDefault();
        activeNav.refresh();
      } else if (e.key === "Backspace" && !isInputFocused) {
        if (activeNav.canGoBack) {
          e.preventDefault();
          activeNav.goBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNav]);

  const activeFiles = activeSearch.isSearchActive ? activeSearch.searchResults : activeNav.files;
  const activeScanning = activeSearch.isSearchActive ? activeSearch.isSearching : activeNav.isScanning;

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex flex-col overflow-hidden font-sans">
      <TabBar />

      <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
        <Sidebar
          onNavigate={(p) => {
            activeSearch.clearSearch();
            activeNav.scanPath(p);
          }}
          currentPath={activeNav.currentPath}
        />

        <div className="flex-1 flex flex-col min-w-0">

        <div className="p-4 border-b border-gray-800 bg-gray-900 z-10 shadow-sm">
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
          />
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-950 relative">
          {!isSplitViewOpen ? (
            // Single Panel View
            <FileList
              files={activeFiles}
              isScanning={activeScanning}
              errorMsg={activeSearch.isSearchActive ? activeSearch.searchError : activeNav.errorMsg}
              selectedItem={activeNav.selectedItem}
              onSelectItem={activeNav.setSelectedItem}
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
            // Dual Panel Split View
            <div className="grid grid-cols-2 gap-3 p-3 h-full overflow-y-auto">
              {/* Left Panel */}
              <FileList
                files={leftSearch.isSearchActive ? leftSearch.searchResults : leftNav.files}
                isScanning={leftSearch.isSearchActive ? leftSearch.isSearching : leftNav.isScanning}
                errorMsg={leftSearch.isSearchActive ? leftSearch.searchError : leftNav.errorMsg}
                selectedItem={leftNav.selectedItem}
                onSelectItem={leftNav.setSelectedItem}
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
                panelSide="left"
                isActivePanel={activeSide === "left"}
                onPanelFocus={() => setActivePanel("left")}
              />

              {/* Right Panel */}
              <FileList
                files={rightSearch.isSearchActive ? rightSearch.searchResults : rightNav.files}
                isScanning={rightSearch.isSearchActive ? rightSearch.isSearching : rightNav.isScanning}
                errorMsg={rightSearch.isSearchActive ? rightSearch.searchError : rightNav.errorMsg}
                selectedItem={rightNav.selectedItem}
                onSelectItem={rightNav.setSelectedItem}
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
                panelSide="right"
                isActivePanel={activeSide === "right"}
                onPanelFocus={() => setActivePanel("right")}
              />
            </div>
          )}
        </main>

        <Footer files={activeFiles} selectedItem={activeNav.selectedItem} isScanning={activeScanning} />
      </div>
    </div>
  </div>
);
}

export default App;
