import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { SettingsConfig, SettingsSection, DEFAULT_SETTINGS } from "../types/settings";
import { useSettingsPersistence } from "../hooks/useSettingsPersistence";

interface SettingsContextType {
  settings: SettingsConfig;
  isLoaded: boolean;
  isSettingsOpen: boolean;
  activeSection: SettingsSection;
  updateSettings: (newSettings: Partial<SettingsConfig>) => void;
  updateSection: <K extends keyof SettingsConfig>(
    section: K,
    updates: Partial<SettingsConfig[K]>
  ) => void;
  resetToDefaults: () => void;
  openSettings: (section?: SettingsSection) => void;
  closeSettings: () => void;
  toggleSettings: (section?: SettingsSection) => void;
  setActiveSection: (section: SettingsSection) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, saveSettings, isLoaded } = useSettingsPersistence();
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  const updateSettings = useCallback(
    (updates: Partial<SettingsConfig>) => {
      const next: SettingsConfig = {
        ...settings,
        ...updates,
      };
      saveSettings(next);
    },
    [settings, saveSettings]
  );

  const updateSection = useCallback(
    <K extends keyof SettingsConfig>(section: K, updates: Partial<SettingsConfig[K]>) => {
      const next: SettingsConfig = {
        ...settings,
        [section]: {
          ...settings[section],
          ...updates,
        },
      };
      saveSettings(next);
    },
    [settings, saveSettings]
  );

  const resetToDefaults = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const openSettings = useCallback((section?: SettingsSection) => {
    if (section) setActiveSection(section);
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const toggleSettings = useCallback((section?: SettingsSection) => {
    if (section) setActiveSection(section);
    setIsSettingsOpen((prev) => !prev);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoaded,
        isSettingsOpen,
        activeSection,
        updateSettings,
        updateSection,
        resetToDefaults,
        openSettings,
        closeSettings,
        toggleSettings,
        setActiveSection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
