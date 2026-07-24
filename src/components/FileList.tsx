interface FileListProps {
  files: string[];
  errorMsg: string | null;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export function FileList({ files, errorMsg, onNavigate, currentPath }: FileListProps) {
  const handleItemClick = (file: string) => {
    // Basic navigation: assume it's a folder. In a real app we'd check if it's a file or folder.
    const newPath = currentPath.endsWith("/") || currentPath.endsWith("\\")
      ? `${currentPath}${file}`
      : `${currentPath}/${file}`;
    onNavigate(newPath);
  };

  if (errorMsg) {
    return (
      <div className="mt-4 p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg">
        <h3 className="font-semibold mb-1">Error accessing directory</h3>
        <p className="text-sm opacity-90">{errorMsg}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p className="text-lg">No files to display. Enter a path and scan.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-4">
      {files.map((file, index) => (
        <li key={index}>
          <button
            onClick={() => handleItemClick(file)}
            className="w-full text-left px-3 py-2 bg-gray-700/50 rounded hover:bg-gray-600 transition-colors text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {file}
          </button>
        </li>
      ))}
    </ul>
  );
}
