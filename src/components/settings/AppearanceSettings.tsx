import { useSettings } from "../../context/SettingsContext";
import { SelectDropdown } from "./ui/SelectDropdown";
import { ToggleSwitch } from "./ui/ToggleSwitch";

export function AppearanceSettings() {
  const { settings, updateSection } = useSettings();
  const { appearance } = settings;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-100">Apariencia</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Personalizá los aspectos visuales, modo de vista, densidad e íconos.
        </p>
      </div>

      <div className="space-y-3 bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5">
        {/* Theme */}
        <SelectDropdown
          value={appearance.theme}
          onChange={(val) => updateSection("appearance", { theme: val })}
          label="Tema visual"
          description="Seleccioná el tema para la interfaz gráfica."
          options={[
            { value: "dark", label: "Oscuro (Dark Zinc)" },
            { value: "light", label: "Claro (Light)" },
            { value: "system", label: "Sistema" },
          ]}
        />

        <div className="border-t border-gray-800/60" />

        {/* View Mode */}
        <SelectDropdown
          value={appearance.viewMode}
          onChange={(val) => updateSection("appearance", { viewMode: val })}
          label="Vista por defecto"
          description="Modo inicial de presentación de archivos."
          options={[
            { value: "table", label: "Tabla / Detalles" },
            { value: "grid", label: "Cuadrícula / Grid" },
          ]}
        />

        <div className="border-t border-gray-800/60" />

        {/* Font Size */}
        <SelectDropdown
          value={appearance.fontSize}
          onChange={(val) => updateSection("appearance", { fontSize: val })}
          label="Tamaño de fuente de interfaz"
          description="Escala de texto para la lista de archivos y menús."
          options={[
            { value: "small", label: "Pequeño" },
            { value: "medium", label: "Mediano (Predeterminado)" },
            { value: "large", label: "Grande" },
          ]}
        />

        <div className="border-t border-gray-800/60" />

        {/* Density */}
        <SelectDropdown
          value={appearance.density}
          onChange={(val) => updateSection("appearance", { density: val })}
          label="Densidad del diseño"
          description="Espaciado interno entre filas y tarjetas de archivos."
          options={[
            { value: "compact", label: "Compacto" },
            { value: "comfortable", label: "Confortable" },
          ]}
        />

        <div className="border-t border-gray-800/60" />

        {/* Accent Color */}
        <SelectDropdown
          value={appearance.accentColor}
          onChange={(val) => updateSection("appearance", { accentColor: val })}
          label="Color de acento"
          description="Tono para elementos seleccionados y botones activos."
          options={[
            { value: "blue", label: "Azul (Standard)" },
            { value: "purple", label: "Púrpura" },
            { value: "emerald", label: "Esmeralda" },
            { value: "amber", label: "Ámbar" },
            { value: "rose", label: "Rosa" },
          ]}
        />

        <div className="border-t border-gray-800/60" />

        {/* Show File Icons */}
        <ToggleSwitch
          checked={appearance.showFileIcons}
          onChange={(val) => updateSection("appearance", { showFileIcons: val })}
          label="Mostrar íconos de tipo de archivo"
          description="Renderiza íconos temáticos para imágenes, código, videos y carpetas."
        />
      </div>
    </div>
  );
}
