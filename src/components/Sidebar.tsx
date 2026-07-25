import { useState, useEffect, useRef } from "react";
import {
  Home,
  FileText,
  Download,
  HardDrive,
  Folder,
  FolderOpen,
  Monitor,
  RotateCw,
  Trash2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Loader2,
  FolderPlus,
  Edit2,
  MoveRight,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useTabContext } from "../context/TabContext";
import { FileItem } from "../types/file";
import {
  getStoredGroups,
  saveStoredGroups,
  moveItemToGroup,
  SidebarGroup,
  FavoriteItem,
  COLLAPSED_STORAGE_KEY,
} from "../utils/sidebarStorage";

export type { FavoriteItem, SidebarGroup };

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

function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFavoriteIcon(iconType?: string, isExpanded?: boolean) {
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
      return isExpanded ? FolderOpen : Folder;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Tree Node Component for Nested Subfolder Cascade (VS Code style)
 * ──────────────────────────────────────────────────────────── */
interface SidebarTreeNodeProps {
  name: string;
  path: string;
  iconType?: string;
  depth: number;
  currentPath: string;
  onNavigate: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  expandedFolders: Record<string, boolean>;
  subfoldersMap: Record<string, FileItem[]>;
  loadingFolders: Record<string, boolean>;
  onToggleExpand: (path: string) => void;
}

function SidebarTreeNode({
  name,
  path,
  iconType,
  depth,
  currentPath,
  onNavigate,
  onContextMenu,
  expandedFolders,
  subfoldersMap,
  loadingFolders,
  onToggleExpand,
}: SidebarTreeNodeProps) {
  const normPath = normalizePath(path);
  const normCurrent = normalizePath(currentPath);

  const isExpanded = !!expandedFolders[normPath];
  const isLoading = !!loadingFolders[normPath];
  const subfolders = subfoldersMap[normPath] || [];
  const isActive = normCurrent === normPath;

  const Icon = getFavoriteIcon(iconType, isExpanded);

  return (
    <div className="flex flex-col select-none">
      <div
        className={`group flex items-center gap-1.5 py-1 px-1.5 rounded-lg transition-all text-xs border ${
          isActive
            ? "bg-blue-600/20 text-blue-300 font-semibold border-blue-500/30 ring-1 ring-blue-500/20"
            : "text-gray-300 hover:bg-gray-800 hover:text-white border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 12 + 6}px` }}
      >
        {/* Chevron Expand Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(path);
          }}
          title={isExpanded ? "Colapsar subcarpetas" : "Expandir subcarpetas"}
          className="p-0.5 text-gray-400 hover:text-white rounded hover:bg-gray-700/60 shrink-0 transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
          ) : isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>

        {/* Location Icon & Name */}
        <button
          type="button"
          onClick={() => onNavigate(path)}
          onContextMenu={onContextMenu}
          title={path}
          className="flex-1 flex items-center gap-2 min-w-0 text-left"
        >
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : isExpanded ? "text-amber-300" : "text-amber-400"}`} />
          <span className="truncate flex-1">{name}</span>
        </button>
      </div>

      {/* Nested Subfolders Tree */}
      {isExpanded && subfolders.length > 0 && (
        <div className="flex flex-col border-l border-gray-800/80 ml-3.5 my-0.5">
          {subfolders.map((sub) => {
            const subPath = `${path.endsWith("/") ? path : path + "/"}${sub.name}`;
            return (
              <SidebarTreeNode
                key={subPath}
                name={sub.name}
                path={subPath}
                depth={depth + 1}
                currentPath={currentPath}
                onNavigate={onNavigate}
                expandedFolders={expandedFolders}
                subfoldersMap={subfoldersMap}
                loadingFolders={loadingFolders}
                onToggleExpand={onToggleExpand}
              />
            );
          })}
        </div>
      )}

      {/* Empty State when expanded with no subfolders */}
      {isExpanded && !isLoading && subfolders.length === 0 && (
        <div
          className="text-[11px] text-gray-500 italic py-1 border-l border-gray-800/60 ml-3.5"
          style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
        >
          Sin subcarpetas
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Main Sidebar Component
 * ──────────────────────────────────────────────────────────── */
export function Sidebar({ onNavigate, currentPath }: SidebarProps) {
  const { createTab } = useTabContext();

  // 1. Sidebar Groups State
  const [groups, setGroups] = useState<SidebarGroup[]>(() => getStoredGroups());

  // 2. Section Collapse States
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // 3. System Drives State
  const [drives, setDrives] = useState<DriveItem[]>([]);
  const [isLoadingDrives, setIsLoadingDrives] = useState(false);

  // 4. Lazy-loaded subfolder map & expand state
  const [subfoldersMap, setSubfoldersMap] = useState<Record<string, FileItem[]>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [loadingFolders, setLoadingFolders] = useState<Record<string, boolean>>({});

  // 5. Drag Over Group ID state
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);

  // 6. Custom Group Creation State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // 7. Rename Group State
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");

  // 8. Context Menu & Submenu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "item" | "group";
    item?: FavoriteItem;
    groupId?: string;
  } | null>(null);
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Listen to global sidebar update events to stay reactively in sync
  useEffect(() => {
    const handleSidebarUpdated = () => {
      setGroups(getStoredGroups());
    };
    window.addEventListener("sack-sidebar-updated", handleSidebarUpdated);
    return () => window.removeEventListener("sack-sidebar-updated", handleSidebarUpdated);
  }, []);

  // Fetch drives on mount
  const fetchDrives = async () => {
    setIsLoadingDrives(true);
    try {
      const result = await invoke<DriveItem[]>("get_system_drives");
      setDrives(result);
    } catch (err) {
      console.error("Failed to fetch drives:", err);
      setDrives([{ name: "Disco Local (C:)", path: "C:/", total_bytes: 0, available_bytes: 0 }]);
    } finally {
      setIsLoadingDrives(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  // Save collapsed states
  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const updated = { ...prev, [sectionId]: !prev[sectionId] };
      try {
        localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
        setShowMoveSubmenu(false);
      }
    };
    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  // Lazy load subfolders for tree expansion
  const toggleExpandFolder = async (folderPath: string) => {
    const normPath = normalizePath(folderPath);
    const isCurrentlyExpanded = !!expandedFolders[normPath];

    if (isCurrentlyExpanded) {
      setExpandedFolders((prev) => ({ ...prev, [normPath]: false }));
      return;
    }

    setExpandedFolders((prev) => ({ ...prev, [normPath]: true }));

    if (!subfoldersMap[normPath]) {
      setLoadingFolders((prev) => ({ ...prev, [normPath]: true }));
      try {
        const items = await invoke<FileItem[]>("scan_directory", { path: folderPath });
        const dirsOnly = items.filter((it) => it.is_dir);
        setSubfoldersMap((prev) => ({ ...prev, [normPath]: dirsOnly }));
      } catch (err) {
        console.error("Failed to fetch subfolders:", err);
        setSubfoldersMap((prev) => ({ ...prev, [normPath]: [] }));
      } finally {
        setLoadingFolders((prev) => ({ ...prev, [normPath]: false }));
      }
    }
  };

  // Drag & drop folder to group
  const handleDragOver = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (dragOverGroupId !== groupId) setDragOverGroupId(groupId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverGroupId(null);
  };

  const handleDropToGroup = (e: React.DragEvent, groupId: string) => {
    e.preventDefault();
    setDragOverGroupId(null);

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
        const updatedGroups = groups.map((g) => {
          if (g.id !== groupId) return g;
          if (g.items.some((it) => normalizePath(it.path) === normDropped)) return g;

          const newFav: FavoriteItem = {
            id: `fav-${Date.now()}`,
            name: droppedName || "Carpeta",
            path: droppedPath,
            iconType: "folder",
          };
          return { ...g, items: [...g.items, newFav] };
        });
        saveStoredGroups(updatedGroups);
      }
    } catch (err) {
      console.error("Error dropping folder to sidebar group:", err);
    }
  };

  // Group creation
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGroup: SidebarGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      isCustom: true,
      items: [],
    };

    saveStoredGroups([...groups, newGroup]);
    setNewGroupName("");
    setIsCreatingGroup(false);
  };

  // Group renaming
  const handleRenameGroup = (groupId: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = groups.map((g) => (g.id === groupId ? { ...g, name: newName.trim() } : g));
    saveStoredGroups(updated);
    setEditingGroupId(null);
    setContextMenu(null);
  };

  // Group removal
  const handleDeleteGroup = (groupId: string) => {
    const updated = groups.filter((g) => g.id !== groupId);
    saveStoredGroups(updated);
    setContextMenu(null);
  };

  // Remove item from group
  const handleRemoveItem = (groupId: string, itemId: string) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      return { ...g, items: g.items.filter((it) => it.id !== itemId) };
    });
    saveStoredGroups(updated);
    setContextMenu(null);
  };

  // Move item to target group
  const handleMoveToGroup = (fromGroupId: string, toGroupId: string, itemId: string) => {
    moveItemToGroup(fromGroupId, toGroupId, itemId);
    setContextMenu(null);
    setShowMoveSubmenu(false);
  };

  // Context menu handlers
  const handleItemContextMenu = (item: FavoriteItem, groupId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMoveSubmenu(false);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "item",
      item,
      groupId,
    });
  };

  const handleGroupContextMenu = (groupId: string, e: React.MouseEvent) => {
    const g = groups.find((gr) => gr.id === groupId);
    if (!g || !g.isCustom) return;
    e.preventDefault();
    e.stopPropagation();
    setShowMoveSubmenu(false);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type: "group",
      groupId,
    });
  };

  const normCurrent = normalizePath(currentPath);

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col p-3 overflow-y-auto shrink-0 select-none font-sans text-xs">
      {/* ── 1. CUSTOM & DEFAULT SIDEBAR GROUPS ── */}
      <div className="space-y-3">
        {groups.map((group) => {
          const isCollapsed = !!collapsedSections[group.id];
          const isDragOver = dragOverGroupId === group.id;

          return (
            <div
              key={group.id}
              onDragOver={(e) => handleDragOver(e, group.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDropToGroup(e, group.id)}
              className={`rounded-xl p-1.5 transition-all border ${
                isDragOver
                  ? "bg-blue-500/10 border-dashed border-2 border-blue-500/50 shadow-inner"
                  : "border-transparent"
              }`}
            >
              {/* Group Collapsible Header */}
              <div
                onContextMenu={(e) => handleGroupContextMenu(group.id, e)}
                className="flex items-center justify-between py-1 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider group/hdr hover:text-gray-200 transition-colors"
              >
                {editingGroupId === group.id ? (
                  <input
                    type="text"
                    autoFocus
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameGroup(group.id, editingGroupName);
                      if (e.key === "Escape") setEditingGroupId(null);
                    }}
                    onBlur={() => handleRenameGroup(group.id, editingGroupName)}
                    className="bg-gray-800 text-gray-100 border border-blue-500 rounded px-1.5 py-0.5 text-xs focus:outline-none w-full font-sans"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(group.id)}
                    className="flex items-center gap-1.5 flex-1 text-left min-w-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    )}
                    <span className="truncate">{group.name}</span>
                  </button>
                )}
              </div>

              {/* Group Items (Tree View) */}
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {group.items.map((item) => (
                    <SidebarTreeNode
                      key={item.id}
                      name={item.name}
                      path={item.path}
                      iconType={item.iconType}
                      depth={0}
                      currentPath={currentPath}
                      onNavigate={onNavigate}
                      onContextMenu={(e) => handleItemContextMenu(item, group.id, e)}
                      expandedFolders={expandedFolders}
                      subfoldersMap={subfoldersMap}
                      loadingFolders={loadingFolders}
                      onToggleExpand={toggleExpandFolder}
                    />
                  ))}

                  {group.items.length === 0 && (
                    <div className="px-2 py-1.5 text-[11px] text-gray-500 italic">
                      Arrastrá carpetas aquí
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Button to Create New Custom Group */}
      {isCreatingGroup ? (
        <form onSubmit={handleCreateGroup} className="mt-3 p-2 bg-gray-800/80 border border-gray-700 rounded-xl space-y-2">
          <input
            type="text"
            autoFocus
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nombre del grupo..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsCreatingGroup(false)}
              className="px-2 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-[11px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors text-[11px]"
            >
              Agregar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreatingGroup(true)}
          className="mt-3 w-full py-1.5 px-2.5 rounded-xl border border-dashed border-gray-800 hover:border-gray-700 text-gray-400 hover:text-gray-200 transition-colors flex items-center justify-center gap-1.5 text-xs group"
        >
          <FolderPlus className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400" />
          <span>Nuevo Grupo</span>
        </button>
      )}

      <div className="my-3 border-t border-gray-800/80" />

      {/* ── 2. DISPOSITIVOS Y UNIDADES (System Drives with Tree View) ── */}
      <div className="px-1">
        {/* Drives Header */}
        <div className="flex items-center justify-between py-1 px-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <button
            type="button"
            onClick={() => toggleSectionCollapse("section-drives")}
            className="flex items-center gap-1.5 flex-1 text-left"
          >
            {collapsedSections["section-drives"] ? (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            )}
            <span>Dispositivos y Unidades</span>
          </button>

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

        {/* Drives List */}
        {!collapsedSections["section-drives"] && (
          <ul className="mt-1 space-y-1">
            {drives.map((drive) => {
              const normDrive = normalizePath(drive.path);
              const isActive = normCurrent === normDrive || normCurrent.startsWith(normDrive + "/");
              const isExpanded = !!expandedFolders[normDrive];
              const isLoading = !!loadingFolders[normDrive];
              const subfolders = subfoldersMap[normDrive] || [];

              const hasSize = drive.total_bytes > 0;
              const usedBytes = drive.total_bytes - drive.available_bytes;
              const percentage = hasSize ? Math.min(100, Math.round((usedBytes / drive.total_bytes) * 100)) : 0;

              return (
                <li key={drive.path} className="flex flex-col">
                  <div
                    className={`w-full px-2 py-1.5 rounded-lg transition-all flex flex-col gap-1 text-xs border ${
                      isActive
                        ? "bg-blue-600/20 text-blue-300 font-semibold border-blue-500/30 ring-1 ring-blue-500/20"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full">
                      {/* Chevron expand button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandFolder(drive.path);
                        }}
                        title={isExpanded ? "Colapsar unidad" : "Expandir unidad"}
                        className="p-0.5 text-gray-400 hover:text-white rounded hover:bg-gray-700/60 shrink-0 transition-colors"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                        ) : isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onNavigate(drive.path)}
                        title={drive.path}
                        className="flex-1 flex items-center gap-2 text-left min-w-0"
                      >
                        <HardDrive className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-400" : "text-blue-500"}`} />
                        <span className="truncate font-medium flex-1">{drive.name}</span>
                      </button>
                    </div>

                    {hasSize && (
                      <div className="w-full pl-6 pr-1 space-y-0.5">
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
                  </div>

                  {/* Drive Subfolders Tree */}
                  {isExpanded && subfolders.length > 0 && (
                    <div className="flex flex-col border-l border-gray-800/80 ml-3.5 my-0.5">
                      {subfolders.map((sub) => {
                        const subPath = `${drive.path.endsWith("/") ? drive.path : drive.path + "/"}${sub.name}`;
                        return (
                          <SidebarTreeNode
                            key={subPath}
                            name={sub.name}
                            path={subPath}
                            depth={1}
                            currentPath={currentPath}
                            onNavigate={onNavigate}
                            expandedFolders={expandedFolders}
                            subfoldersMap={subfoldersMap}
                            loadingFolders={loadingFolders}
                            onToggleExpand={toggleExpandFolder}
                          />
                        );
                      })}
                    </div>
                  )}

                  {isExpanded && !isLoading && subfolders.length === 0 && (
                    <div className="text-[11px] text-gray-500 italic py-1 border-l border-gray-800/60 ml-5">
                      Sin subcarpetas
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Floating Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl py-1.5 w-52 text-xs select-none font-sans text-gray-200"
        >
          {contextMenu.type === "item" && contextMenu.item && contextMenu.groupId && (
            <>
              {/* Abrir en nueva pestaña */}
              <button
                type="button"
                onClick={() => {
                  createTab(contextMenu.item!.path);
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-gray-800 hover:text-white flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Abrir en nueva pestaña</span>
              </button>

              {/* Mover a Grupo Submenu */}
              <div
                className="relative"
                onMouseEnter={() => setShowMoveSubmenu(true)}
                onMouseLeave={() => setShowMoveSubmenu(false)}
              >
                <button
                  type="button"
                  onClick={() => setShowMoveSubmenu((prev) => !prev)}
                  className="w-full px-3 py-1.5 text-left hover:bg-gray-800 hover:text-white flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MoveRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Mover a grupo...</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </button>

                {showMoveSubmenu && (
                  <div className="absolute top-0 left-full -ml-1 w-48 bg-gray-900 border border-gray-700 shadow-2xl rounded-xl py-1 z-50 font-sans text-xs">
                    <div className="px-3 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800 mb-1">
                      Seleccionar grupo
                    </div>
                    {groups
                      .filter((g) => g.id !== contextMenu.groupId)
                      .map((targetGroup) => (
                        <button
                          key={targetGroup.id}
                          type="button"
                          onClick={() =>
                            handleMoveToGroup(
                              contextMenu.groupId!,
                              targetGroup.id,
                              contextMenu.item!.id
                            )
                          }
                          className="w-full px-3 py-1.5 text-left hover:bg-gray-800 hover:text-white flex items-center gap-2 transition-colors truncate"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                          <span className="truncate">{targetGroup.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div className="my-1 border-t border-gray-800" />

              {/* Quitar de Favoritos / Acceso Rápido */}
              <button
                type="button"
                onClick={() => handleRemoveItem(contextMenu.groupId!, contextMenu.item!.id)}
                className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 hover:text-red-300 text-red-400 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Quitar de Favoritos</span>
              </button>
            </>
          )}

          {contextMenu.type === "group" && contextMenu.groupId && (
            <>
              <button
                type="button"
                onClick={() => {
                  const g = groups.find((gr) => gr.id === contextMenu.groupId);
                  if (g) {
                    setEditingGroupId(g.id);
                    setEditingGroupName(g.name);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left hover:bg-gray-800 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Renombrar Grupo</span>
              </button>

              <div className="my-1 border-t border-gray-800" />

              <button
                type="button"
                onClick={() => handleDeleteGroup(contextMenu.groupId!)}
                className="w-full px-3 py-1.5 text-left hover:bg-red-950/60 hover:text-red-300 text-red-400 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Eliminar Grupo</span>
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
}
