import { useEffect } from "react";
import { useNavigation } from "./hooks/useNavigation";
import { useSearch } from "./hooks/useSearch";
import { TabBar } from "./components/TabBar";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { FileList } from "./components/FileList";
import { Footer } from "./components/Footer";
import "./App.css";

function App() {
  const {
    currentPath,
    files,
    selectedItem,
    setSelectedItem,
    isScanning,
    errorMsg,
    canGoBack,
    canGoForward,
    canGoUp,
    scanPath,
    goBack,
    goForward,
    goUp,
    refresh,
  } = useNavigation();

  const search = useSearch();

  // Keyboard shortcuts: Backspace (go back) and F5 (refresh)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (e.key === "F5") {
        e.preventDefault();
        refresh();
      } else if (e.key === "Backspace" && !isInputFocused) {
        if (canGoBack) {
          e.preventDefault();
          goBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoBack, goBack, refresh]);

  const activeFiles = search.isSearchActive ? search.searchResults : files;
  const activeScanning = search.isSearchActive ? search.isSearching : isScanning;

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex overflow-hidden font-sans">
      <Sidebar onNavigate={(p) => { search.clearSearch(); scanPath(p); }} currentPath={currentPath} />

      <div className="flex-1 flex flex-col min-w-0">
        <TabBar />

        <div className="p-4 border-b border-gray-800 bg-gray-900 z-10 shadow-sm">
          <Navbar
            currentPath={currentPath}
            isScanning={isScanning}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            canGoUp={canGoUp}
            onNavigate={(path) => {
              search.clearSearch();
              scanPath(path);
            }}
            onGoBack={() => {
              search.clearSearch();
              goBack();
            }}
            onGoForward={() => {
              search.clearSearch();
              goForward();
            }}
            onGoUp={() => {
              search.clearSearch();
              goUp();
            }}
            searchQuery={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            useFuzzy={search.useFuzzy}
            onToggleFuzzy={() => search.setUseFuzzy((prev) => !prev)}
            isSearching={search.isSearching}
            onClearSearch={search.clearSearch}
            searchInputRef={search.inputRef}
          />
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-950 relative">
          <FileList
            files={activeFiles}
            isScanning={activeScanning}
            errorMsg={search.isSearchActive ? search.searchError : errorMsg}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onNavigate={(path) => {
              search.clearSearch();
              scanPath(path);
            }}
            onRefresh={refresh}
            currentPath={currentPath}
            isSearchMode={search.isSearchActive}
            searchQuery={search.searchQuery}
            useFuzzy={search.useFuzzy}
          />
        </main>

        <Footer files={activeFiles} selectedItem={selectedItem} isScanning={activeScanning} />
      </div>
    </div>
  );
}

export default App;
