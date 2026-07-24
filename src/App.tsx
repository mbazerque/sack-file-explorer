import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [path, setPath] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!path.trim()) return;

    setIsScanning(true);
    try {
      const result = await invoke<string[]>("scan_directory", { path });
      setFiles(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-4 text-blue-400">File Explorer</h1>
        <form onSubmit={handleScan} className="flex gap-2">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.currentTarget.value)}
            placeholder="Enter directory path (e.g., C:/)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
          <button
            type="submit"
            disabled={isScanning}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-6 py-2 transition-colors"
          >
            {isScanning ? "Scanning..." : "Scan"}
          </button>
        </form>
      </header>

      <main className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-y-auto">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-lg">No files to display. Enter a path and scan.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors cursor-pointer">
                {file}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

export default App;
