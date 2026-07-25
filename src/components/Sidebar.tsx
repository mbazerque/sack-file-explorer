import { useState, useEffect, useRef } from "react";
import {
  Home,
  FileText,
  Download,
  HardDrive,
  Folder,
  Monitor,
  RotateCw,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useTabContext } from "../context/TabContext";

export interface FavoriteItem {
  id: string;
  name: string;
  path: string;
  iconType?: "home" | "documents" | "downloads" | "desktop" | "folder";
}

export interface DriveItem {
  name: string;
  path: string;
  total_bytes: number;
  available_bytes: number;
}

interface SidebarProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

const STORAGE_KEY = "sack_quick_access_favorites";

const DEFAULT_FAVORITES: FavoriteItem[] = [
  { id: "fav-home", name: "Inicio", path: "C:/Users", iconType: "home" },
  { id: "fav-docs", name: "Documentos", path: "C:/Users/Public/Documents", iconType: "documents" },
  { id: "fav-downloads", name: "Descargas", path: "C:/Users/Public/Downloads", iconType: "downloads" },
  { id: "fav-desktop", name: "Escritorio", path: "C:/Users/Public/Desktop", iconType: "desktop" },
];

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

export function Sidebar({ onNavigate, currentPath }: SidebarProps) {
  const { createTab } = useTabContext();

  const [favorites, setFavorites] = useState<FavoriteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_FAVORITES;
  });

  const [drives, setDrives] = useState<DriveItem[]>([]);
  const [isLoadingDrives, setIsLoadingDrives] = useState(false);

  const [isDragOver, setIsDragOver] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: FavoriteItem;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Fetch system drives via Tauri IPC
  const fetchDrives = async () => {
    setIsLoadingDrives(true);
    try {
      const result = await invoke<DriveItem[]>("get_system_drives");
      setDrives(result);
    } catch (err) {
      console.error("Failed to fetch system drives:", err);
      // Fallback drive
      setDrives([{ name: "Disco Local (C:)", path: "C:/", total_bytes: 0, available_bytes: 0 }]);
    } finally {
      setIsLoadingDrives(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavs: FavoriteItem[]) => {
    setFavorites(newFavs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavs));
    } catch {}
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  // Drag and Drop handlers for Quick Access section
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const jsonStr = e.dataTransfer.getData("application/json");
      const textPath = e.dataTransfer.getData("text/plain");

      let droppedPath = "";
      let droppedName = "";

      if (jsonStr) {
        const data = JSON.parse(jsonStr);
        if (data.is_dir) {
          droppedPath = data.path;
          droppedName = data.name;
        }
      } else if (textPath) {
        droppedPath = textPath;
        const parts = droppedPath.replace(/\\/g, "/").split("/").filter(Boolean);
        droppedName = parts[parts.length - 1] || droppedPath;
      }

      if (droppedPath) {
        const normDropped = normalizePath(droppedPath);
        if (!favorites.some((f) => normalizePath(f.path) === normDropped)) {
          const newFav: FavoriteItem = {
            id: `fav-${Date.now()}`,
            name: droppedName || "Carpeta",
            path: droppedPath,
            iconType: "folder",
          };
          saveFavorites([...favorites, newFav]);
        }
      }
    } catch (err) {
      console.error("Error dropping folder to favorites:", err);
    }
  };

  const handleRemoveFavorite = (id: string) => {
    const updated = favorites.filter((f) => f.id !== id);
    saveFavorites(updated);
    setContextMenu(null);
  };

  const handleOpenInNewTab = (path: string) => {
    createTab(path);
    setContextMenu(null);
  };

  const handleContextMenu = (item: FavoriteItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  };

  const getFavoriteIcon = (iconType?: string) => {
    switch (iconType) {
      case "home":
        return Home;
      case "documents":
        return FileText;
      case "downloads":
        return Download;
      case "desktop":
        return Monitor;
      default:
        return Folder;
    }
  };

  const normCurrent = normalizePath(currentPath);

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-3 overflow-y-auto shrink-0 select-none font-sans text-xs">
      {/* 1. ACCESO RÁPIDO (Quick Access Favorites) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-xl p-2 transition-all border ${
          isDragOver
            ? "bg-blue-500/10 border-dashed border-2 border-blue-500/50 shadow-inner"
            : "border-transparent"
        }`}
      >
        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
          <span>Acceso Rápido</span>
          <span className="text-[10px] text-gray-400 font-normal lowercase hidden group-hover:inline">
            arrastrá carpetas
          </span>
        </div>

        <ul className="space-y-0.5">
          {favorites.map((fav) => {
            const Icon = getFavoriteIcon(fav.iconType);
            const normFav = normalizePath(fav.path);
            const isActive = normCurrent === normFav;

            return (
              <li key={fav.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(fav.path)}
                  onContextMenu={(e) => handleContextMenu(fav, e)}
                  title={fav.path}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-2.5 text-xs ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30 ring-1 ring-blue-500/20"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-amber-400"}`} />
                  <span className="truncate flex-1">{fav.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {isDragOver && (
          <div className="mt-2 p-2 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-300 text-center text-[11px] font-medium flex items-center justify-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Soltar carpeta para agregar</span>
          </div>
        )}
      </div>

      <div className="my-3 border-t border-gray-800/80" />

      {/* 2. DISPOSITIVOS Y UNIDADES (System Drives) */}
      <div className="px-1">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          <span>Dispositivos y Unidades</span>
          <button
            type="button"
            onClick={fetchDrives}
            disabled={isLoadingDrives}
            title="Actualizar discos"
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          >
            <RotateCw className={`w-3 h-3 ${isLoadingDrives ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>

        <ul className="space-y-1.5">
          {drives.map((drive) => {
            const normDrive = normalizePath(drive.path);
            const isActive = normCurrent === normDrive || normCurrent.startsWith(normDrive + "/");

            const hasSize = drive.total_bytes > 0;
            const usedBytes = drive.total_bytes - drive.available_bytes;
            const percentage = hasSize ? Math.min(100, Math.round((usedBytes / drive.total_bytes) * 100)) : 0;

            return (
              <li key={drive.path}>
                <button
                  type="button"
                  onClick={() => onNavigate(drive.path)}
                  title={drive.path}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex flex-col gap-1.5 text-xs ${
                    isActive
                      ? "bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30 ring-1 ring-blue-500/20"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5 w-full">
                    <HardDrive className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-blue-500"}`} />
                    <span className="truncate flex-1 font-medium">{drive.name}</span>
                  </div>

                  {hasSize && (
                    <div className="w-full pl-6 pr-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-gray-400">
                        <span>{formatFileSize(drive.available_bytes)} libres</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-950 rounded-full h-1.5 overflow-hidden border border-gray-700/50">
                        <div
                          className={`h-full transition-all rounded-full ${
                            percentage > 90
                              ? "bg-red-500"
                              : percentage > 75
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Floating Context Menu for Favorites */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl py-1.5 w-48 text-xs select-none font-sans text-gray-200"
        >
          <button
            type="button"
            onClick={() => handleOpenInNewTab(contextMenu.item.path)}
            className="w-full px-3 py-1.5 text-left hover:bg-gray-800 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            <span>Abrir en nueva pestaña</span>
          </button>

          <div className="my-1 border-t border-gray-800" />

          <button
            type="button"
            onClick={() => handleRemoveFavorite(contextMenu.item.id)}
            className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 hover:text-red-300 text-red-400 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar de Favoritos</span>
          </button>
        </div>
      )}
    </aside>
  );
}
