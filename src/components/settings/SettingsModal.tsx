import { useEffect } from "react";
import { X, RotateCcw, Settings } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { SettingsSidebar } from "./SettingsSidebar";
import { GeneralSettings } from "./GeneralSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { TerminalSettings } from "./TerminalSettings";
import { ShortcutsSettings } from "./ShortcutsSettings";

export function SettingsModal() {
  const {
    isSettingsOpen,
    closeSettings,
    activeSection,
    setActiveSection,
    resetToDefaults,
  } = useSettings();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        closeSettings();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none font-sans animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-gray-900 border border-gray-700/80 shadow-2xl rounded-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden text-gray-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-100">Configuración</h2>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Area: Sidebar + Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <SettingsSidebar activeSection={activeSection} onSelectSection={setActiveSection} />

          <div className="flex-1 p-6 overflow-y-auto font-sans">
            {activeSection === "general" && <GeneralSettings />}
            {activeSection === "appearance" && <AppearanceSettings />}
            {activeSection === "terminal" && <TerminalSettings />}
            {activeSection === "shortcuts" && <ShortcutsSettings />}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800 bg-gray-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (window.confirm("¿Restablecer todas las configuraciones a sus valores predeterminados?")) {
                resetToDefaults();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer por defecto</span>
          </button>

          <button
            type="button"
            onClick={closeSettings}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-xs shadow transition-colors"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
