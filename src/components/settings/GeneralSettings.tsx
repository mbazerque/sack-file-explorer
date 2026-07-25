import { useSettings } from "../../context/SettingsContext";
import { ToggleSwitch } from "./ui/ToggleSwitch";

export function GeneralSettings() {
  const { settings, updateSection } = useSettings();
  const { general } = settings;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-100">General</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Opciones generales de comportamiento y navegación en la aplicación.
        </p>
      </div>

      <div className="space-y-3 bg-gray-900/60 border border-gray-800/80 rounded-xl p-3.5">
        {/* Default Path */}
        <div className="py-2">
          <label className="block text-xs font-medium text-gray-200 mb-1">
            Ruta inicial por defecto
          </label>
          <input
            type="text"
            value={general.defaultPath}
            onChange={(e) => updateSection("general", { defaultPath: e.target.value })}
            placeholder="C:/"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Ruta del sistema de archivos que se abrirá al crear una nueva pestaña.
          </p>
        </div>

        <div className="border-t border-gray-800/60" />

        {/* Show Hidden Files */}
        <ToggleSwitch
          checked={general.showHiddenFiles}
          onChange={(val) => updateSection("general", { showHiddenFiles: val })}
          label="Mostrar archivos y carpetas ocultos"
          description="Muestra elementos que comiencen con punto (.git, .env) o archivos ocultos del sistema."
        />

        <div className="border-t border-gray-800/60" />

        {/* Confirm before delete */}
        <ToggleSwitch
          checked={general.confirmBeforeDelete}
          onChange={(val) => updateSection("general", { confirmBeforeDelete: val })}
          label="Confirmar antes de eliminar"
          description="Muestra un diálogo de confirmación antes de mover elementos a la Papelera de Reciclaje."
        />

        <div className="border-t border-gray-800/60" />

        {/* Single click open */}
        <ToggleSwitch
          checked={general.singleClickOpen}
          onChange={(val) => updateSection("general", { singleClickOpen: val })}
          label="Abrir carpetas con un solo clic"
          description="Abre carpetas al hacer clic simple en lugar de requerir doble clic."
        />
      </div>
    </div>
  );
}
