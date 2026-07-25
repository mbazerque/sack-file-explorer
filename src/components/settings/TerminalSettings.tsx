import { useSettings } from "../../context/SettingsContext";
import { SelectDropdown } from "./ui/SelectDropdown";

export function TerminalSettings() {
  const { settings, updateSection } = useSettings();
  const { terminal } = settings;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-100">Terminal integrada</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Configuración de la consola PTY, intérprete de comandos y tipografía.
        </p>
      </div>

      <div className="space-y-3 bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5">
        {/* Shell Choice */}
        <SelectDropdown
          value={terminal.shell}
          onChange={(val) => updateSection("terminal", { shell: val })}
          label="Intérprete de comandos (Shell)"
          description="Consola por defecto utilizada para la terminal integrada."
          options={[
            { value: "default", label: "Predeterminado del sistema" },
            { value: "powershell", label: "PowerShell" },
            { value: "cmd", label: "Command Prompt (cmd.exe)" },
            { value: "bash", label: "Git Bash / Bash" },
            { value: "custom", label: "Ruta personalizada..." },
          ]}
        />

        {terminal.shell === "custom" && (
          <div className="py-2">
            <label className="block text-xs font-medium text-gray-200 mb-1">
              Ruta del ejecutable de la shell
            </label>
            <input
              type="text"
              value={terminal.shellPath}
              onChange={(e) => updateSection("terminal", { shellPath: e.target.value })}
              placeholder="C:\Program Files\Git\bin\bash.exe"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        <div className="border-t border-gray-800/60" />

        {/* Terminal Font Size */}
        <div className="py-2">
          <label className="block text-xs font-medium text-gray-200 mb-1">
            Tamaño de fuente de la terminal (px)
          </label>
          <input
            type="number"
            min={10}
            max={32}
            value={terminal.terminalFontSize}
            onChange={(e) =>
              updateSection("terminal", { terminalFontSize: Number(e.target.value) || 14 })
            }
            className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="border-t border-gray-800/60" />

        {/* Font Family */}
        <div className="py-2">
          <label className="block text-xs font-medium text-gray-200 mb-1">
            Familia de fuente (Font Family)
          </label>
          <input
            type="text"
            value={terminal.fontFamily}
            onChange={(e) => updateSection("terminal", { fontFamily: e.target.value })}
            placeholder="'Fira Code', 'Cascadia Code', monospace"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        <div className="border-t border-gray-800/60" />

        {/* Scrollback Lines */}
        <div className="py-2">
          <label className="block text-xs font-medium text-gray-200 mb-1">
            Líneas de historial (Scrollback)
          </label>
          <input
            type="number"
            min={100}
            max={10000}
            step={500}
            value={terminal.scrollbackLines}
            onChange={(e) =>
              updateSection("terminal", { scrollbackLines: Number(e.target.value) || 1000 })
            }
            className="w-32 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
