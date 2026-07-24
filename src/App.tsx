import { useEffect } from "react";
import { useNavigation } from "./hooks/useNavigation";
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
    fetchDirectory,
  } = useNavigation("C:/");

  useEffect(() => {
    fetchDirectory(currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-100 flex overflow-hidden font-sans">
      <Sidebar onNavigate={scanPath} currentPath={currentPath} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-800 bg-gray-900 z-10 shadow-sm">
          <Navbar
            currentPath={currentPath}
            isScanning={isScanning}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            canGoUp={canGoUp}
            onNavigate={scanPath}
            onGoBack={goBack}
            onGoForward={goForward}
            onGoUp={goUp}
          />
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-950 relative">
          <FileList
            files={files}
            isScanning={isScanning}
            errorMsg={errorMsg}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onNavigate={scanPath}
            onRefresh={refresh}
            currentPath={currentPath}
          />
        </main>

        <Footer files={files} selectedItem={selectedItem} isScanning={isScanning} />
      </div>
    </div>
  );
}

export default App;
