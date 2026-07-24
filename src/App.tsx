import { useEffect } from "react";
import { useNavigation } from "./hooks/useNavigation";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { FileList } from "./components/FileList";
import "./App.css";

function App() {
  const { currentPath, files, isScanning, errorMsg, scanPath } = useNavigation("C:/");

  useEffect(() => {
    scanPath(currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-screen w-screen bg-gray-900 text-gray-100 flex overflow-hidden font-sans">
      <Sidebar onNavigate={scanPath} currentPath={currentPath} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 pb-2 border-b border-gray-800 bg-gray-900 z-10">
          <Navbar 
            currentPath={currentPath} 
            isScanning={isScanning} 
            onNavigate={scanPath} 
          />
        </div>
        
        <main className="flex-1 overflow-y-auto bg-gray-800 relative">
          <FileList 
            files={files} 
            errorMsg={errorMsg} 
            onNavigate={scanPath}
            currentPath={currentPath}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
