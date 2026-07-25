export interface GeneralSettings {
  defaultPath: string;
  showHiddenFiles: boolean;
  confirmBeforeDelete: boolean;
  singleClickOpen: boolean;
}

export interface AppearanceSettings {
  theme: "dark" | "light" | "system";
  viewMode: "table" | "grid";
  fontSize: "small" | "medium" | "large";
  density: "compact" | "comfortable";
  accentColor: string;
  showFileIcons: boolean;
}

export interface TerminalSettings {
  shell: "default" | "powershell" | "cmd" | "bash" | "custom";
  shellPath: string;
  terminalFontSize: number;
  fontFamily: string;
  scrollbackLines: number;
}

export interface ShortcutsSettings {
  newTab: string | null;
  closeTab: string | null;
  nextTab: string | null;
  previousTab: string | null;
  toggleSplitView: string | null;
  toggleHiddenFiles: string | null;
  focusAddressBar: string | null;
  toggleTerminal: string | null;
  copy: string | null;
  cut: string | null;
  paste: string | null;
  rename: string | null;
  openSettings: string | null;
}

export interface SettingsConfig {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  terminal: TerminalSettings;
  shortcuts: ShortcutsSettings;
}

export type SettingsSection = keyof SettingsConfig;

export const DEFAULT_SETTINGS: SettingsConfig = {
  general: {
    defaultPath: "C:/",
    showHiddenFiles: true,
    confirmBeforeDelete: true,
    singleClickOpen: false,
  },
  appearance: {
    theme: "dark",
    viewMode: "table",
    fontSize: "medium",
    density: "comfortable",
    accentColor: "blue",
    showFileIcons: true,
  },
  terminal: {
    shell: "default",
    shellPath: "",
    terminalFontSize: 14,
    fontFamily: "'Fira Code', monospace",
    scrollbackLines: 1000,
  },
  shortcuts: {
    newTab: "Ctrl+T",
    closeTab: "Ctrl+W",
    nextTab: "Ctrl+Tab",
    previousTab: "Ctrl+Shift+Tab",
    toggleSplitView: "Ctrl+\\",
    toggleHiddenFiles: "Ctrl+H",
    focusAddressBar: "Ctrl+L",
    toggleTerminal: "Ctrl+J",
    copy: "Ctrl+C",
    cut: "Ctrl+X",
    paste: "Ctrl+V",
    rename: "F2",
    openSettings: "Ctrl+,",
  },
};
