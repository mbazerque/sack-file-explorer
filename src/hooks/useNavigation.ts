import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export function useNavigation(initialPath: string = "") {
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [files, setFiles] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scanPath = useCallback(async (targetPath: string) => {
    if (!targetPath.trim()) return;
    setIsScanning(true);
    setErrorMsg(null);
    setCurrentPath(targetPath);
    try {
      const result = await invoke<string[]>("scan_directory", { path: targetPath });
      setFiles(result);
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err));
      setFiles([]);
    } finally {
      setIsScanning(false);
    }
  }, []);

  return {
    currentPath,
    files,
    isScanning,
    errorMsg,
    scanPath,
  };
}
