export interface FavoriteItem {
  id: string;
  name: string;
  path: string;
  iconType?: "home" | "documents" | "downloads" | "desktop" | "folder";
}

export interface SidebarGroup {
  id: string;
  name: string;
  isCustom?: boolean;
  items: FavoriteItem[];
}

export const GROUPS_STORAGE_KEY = "sack_sidebar_groups";
export const COLLAPSED_STORAGE_KEY = "sack_sidebar_collapsed_sections";

export const DEFAULT_GROUPS: SidebarGroup[] = [
  {
    id: "group-quick-access",
    name: "Acceso Rápido",
    isCustom: false,
    items: [
      { id: "fav-home", name: "Inicio", path: "C:/Users", iconType: "home" },
      { id: "fav-docs", name: "Documentos", path: "C:/Users/Public/Documents", iconType: "documents" },
      { id: "fav-downloads", name: "Descargas", path: "C:/Users/Public/Downloads", iconType: "downloads" },
      { id: "fav-desktop", name: "Escritorio", path: "C:/Users/Public/Desktop", iconType: "desktop" },
    ],
  },
];

export function getStoredGroups(): SidebarGroup[] {
  try {
    const saved = localStorage.getItem(GROUPS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_GROUPS;
}

export function saveStoredGroups(groups: SidebarGroup[]) {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    window.dispatchEvent(new CustomEvent("sack-sidebar-updated"));
  } catch {}
}

export function addItemToQuickAccess(name: string, path: string, isDir: boolean = true) {
  const groups = getStoredGroups();
  let targetGroup = groups.find((g) => g.id === "group-quick-access");
  if (!targetGroup && groups.length > 0) {
    targetGroup = groups[0];
  }
  if (!targetGroup) return;

  const normPath = path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  if (targetGroup.items.some((it) => it.path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase() === normPath)) {
    return;
  }

  const newItem: FavoriteItem = {
    id: `fav-${Date.now()}`,
    name,
    path,
    iconType: isDir ? "folder" : "documents",
  };

  targetGroup.items.push(newItem);
  saveStoredGroups(groups);
}

export function addItemToGroup(groupId: string, name: string, path: string, isDir: boolean = true) {
  const groups = getStoredGroups();
  const targetGroup = groups.find((g) => g.id === groupId);
  if (!targetGroup) return;

  const normPath = path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
  if (targetGroup.items.some((it) => it.path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase() === normPath)) {
    return;
  }

  const newItem: FavoriteItem = {
    id: `fav-${Date.now()}`,
    name,
    path,
    iconType: isDir ? "folder" : "documents",
  };

  targetGroup.items.push(newItem);
  saveStoredGroups(groups);
}

export function createGroupAndAddItem(groupName: string, name: string, path: string, isDir: boolean = true) {
  const groups = getStoredGroups();
  const newGroup: SidebarGroup = {
    id: `group-${Date.now()}`,
    name: groupName,
    isCustom: true,
    items: [
      {
        id: `fav-${Date.now()}`,
        name,
        path,
        iconType: isDir ? "folder" : "documents",
      },
    ],
  };

  groups.push(newGroup);
  saveStoredGroups(groups);
}

export function moveItemToGroup(fromGroupId: string, toGroupId: string, itemId: string) {
  const groups = getStoredGroups();
  const fromGroup = groups.find((g) => g.id === fromGroupId);
  const toGroup = groups.find((g) => g.id === toGroupId);
  if (!fromGroup || !toGroup) return;

  const itemIndex = fromGroup.items.findIndex((it) => it.id === itemId);
  if (itemIndex === -1) return;

  const [item] = fromGroup.items.splice(itemIndex, 1);
  toGroup.items.push(item);
  saveStoredGroups(groups);
}
