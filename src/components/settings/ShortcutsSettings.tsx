import { useSettings } from "../../context/SettingsContext";
import { ShortcutInput } from "./ui/ShortcutInput";
import { DEFAULT_SETTINGS, ShortcutsSettings as ShortcutsType } from "../../types/settings";

const SHORTCUT_LABELS: Record<keyof ShortcutsType, string> = {
  newTab: "Nueva pestaña",
  closeTab: "Cerrar pestaña activa",
  nextTab: "Siguiente pestaña",
  previousTab: "Pestaña anterior",
  toggleSplitView: "Alternar vista dividida (Split View)",
  toggleHiddenFiles: "Alternar visibilidad de archivos ocultos",
  focusAddressBar: "Enfocar barra de ruta",
  toggleTerminal: "Alternar terminal inferior",
  copy: "Copiar elementos",
  cut: "Cortar elementos",
  paste: "Pegar elementos",
  rename: "Renombrar elemento (inline)",
  openSettings: "Abrir ventana de configuración",
};

export function ShortcutsSettings() {
  const { settings, updateSection } = useSettings();
  const { shortcuts } = settings;

  const handleShortcutChange = (key: keyof ShortcutsType, newValue: string | null) => {
    updateSection("shortcuts", { [key]: newValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-100">Atajos de teclado</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Personalizá las combinaciones de teclas globales de navegación y edición. Hacé clic en la tecla para grabar una nueva combinación o `X` para desactivarla.
        </p>
      </div>

      <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5 divide-y divide-gray-800/60">
        {(Object.keys(SHORTCUT_LABELS) as (keyof ShortcutsType)[]).map((key) => (
          <ShortcutInput
            key={key}
            label={SHORTCUT_LABELS[key]}
            value={shortcuts[key]}
            defaultValue={DEFAULT_SETTINGS.shortcuts[key]}
            onChange={(val) => handleShortcutChange(key, val)}
          />
        ))}
      </div>
    </div>
  );
}
