import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SettingsConfig, DEFAULT_SETTINGS } from "../types/settings";

export function useSettingsPersistence() {
  const [settings, setSettings] = useState<SettingsConfig>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load settings on startup
  useEffect(() => {
    async function load() {
      try {
        const rawJson = await invoke<string>("load_settings");
        let parsed: Partial<SettingsConfig> = {};
        if (rawJson && rawJson !== "{}") {
          try {
            parsed = JSON.parse(rawJson);
          } catch (e) {
            console.error("Failed to parse settings.json, fallback to defaults", e);
          }
        }

        // Migrate legacy localStorage keys if not present in settings.json
        let legacyShowHidden: boolean | undefined = undefined;
        let legacyViewMode: ("table" | "grid") | undefined = undefined;

        try {
          const lHidden = localStorage.getItem("sack-show-hidden");
          if (lHidden !== null) legacyShowHidden = lHidden === "true";

          const lView = localStorage.getItem("sack-view-mode");
          if (lView === "grid" || lView === "table") legacyViewMode = lView;
        } catch {
          // ignore LS errors
        }

        const merged: SettingsConfig = {
          general: {
            ...DEFAULT_SETTINGS.general,

            ...(legacyShowHidden !== undefined ? { showHiddenFiles: legacyShowHidden } : {}),
            ...parsed.general,
          },
          appearance: {
            ...DEFAULT_SETTINGS.appearance,
            ...(legacyViewMode !== undefined ? { viewMode: legacyViewMode } : {}),
            ...parsed.appearance,
          },
          terminal: {
            ...DEFAULT_SETTINGS.terminal,
            ...parsed.terminal,
          },
          shortcuts: {
            ...DEFAULT_SETTINGS.shortcuts,
            ...parsed.shortcuts,
          },
        };

        setSettings(merged);

        // Sync legacy localStorage
        try {
          localStorage.setItem("sack-show-hidden", String(merged.general.showHiddenFiles));
          localStorage.setItem("sack-view-mode", merged.appearance.viewMode);
        } catch {
          // ignore
        }
      } catch (err) {
        console.error("Error reading settings.json via Tauri IPC:", err);
      } finally {
        setIsLoaded(true);
      }
    }

    load();
  }, []);

  const saveSettings = useCallback(async (newSettings: SettingsConfig) => {
    setSettings(newSettings);

    // Sync legacy LS
    try {
      localStorage.setItem("sack-show-hidden", String(newSettings.general.showHiddenFiles));
      localStorage.setItem("sack-view-mode", newSettings.appearance.viewMode);
    } catch {
      // ignore
    }

    // Persist to %APPDATA%\com.bazer.sack\settings.json
    try {
      await invoke("save_settings", {
        jsonContent: JSON.stringify(newSettings, null, 2),
      });
    } catch (err) {
      console.error("Error saving settings.json via Tauri IPC:", err);
    }
  }, []);

  return { settings, saveSettings, isLoaded };
}
