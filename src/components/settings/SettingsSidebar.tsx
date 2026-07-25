import { Sliders, Palette, Terminal, Keyboard } from "lucide-react";
import { SettingsSection } from "../../types/settings";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSelectSection: (section: SettingsSection) => void;
}

const SECTIONS: { id: SettingsSection; label: string; icon: typeof Sliders }[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "appearance", label: "Apariencia", icon: Palette },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "shortcuts", label: "Atajos de teclado", icon: Keyboard },
];

export function SettingsSidebar({ activeSection, onSelectSection }: SettingsSidebarProps) {
  return (
    <nav className="w-48 bg-gray-950/60 border-r border-gray-800/80 p-2 flex flex-col gap-1 shrink-0 select-none">
      <div className="px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
        Configuración
      </div>
      {SECTIONS.map((sec) => {
        const Icon = sec.icon;
        const isActive = activeSection === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onSelectSection(sec.id)}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-all text-left ${
              isActive
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm"
                : "text-gray-400 hover:text-gray-200 hover:bg-gray-850/60"
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-gray-500"}`} />
            <span>{sec.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
