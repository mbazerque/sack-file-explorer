import { useState, useRef } from "react";
import { X, RotateCcw } from "lucide-react";

interface ShortcutInputProps {
  value: string | null;
  onChange: (newValue: string | null) => void;
  defaultValue: string | null;
  label: string;
}

export function ShortcutInput({
  value,
  onChange,
  defaultValue,
  label,
}: ShortcutInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    if (e.key === "Escape") {
      setIsRecording(false);
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");

    let keyName = e.key;

    if (keyName === " ") keyName = "Space";
    else if (keyName.length === 1) keyName = keyName.toUpperCase();
    else if (keyName === "Control" || keyName === "Shift" || keyName === "Alt" || keyName === "Meta") {
      return; // wait for main key
    }

    parts.push(keyName);
    const result = parts.join("+");
    onChange(result);
    setIsRecording(false);
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/60 last:border-0">
      <span className="text-xs text-gray-300 font-medium">{label}</span>

      <div className="flex items-center gap-1.5">
        <button
          ref={inputRef}
          type="button"
          onKeyDown={handleKeyDown}
          onClick={() => setIsRecording(true)}
          onBlur={() => setIsRecording(false)}
          className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all ${
            isRecording
              ? "bg-blue-600/30 text-blue-300 border-blue-500 ring-2 ring-blue-500/40 animate-pulse"
              : value
              ? "bg-gray-800 text-gray-200 border-gray-700 hover:border-gray-600"
              : "bg-gray-900 text-gray-500 border-gray-800 hover:border-gray-700 italic"
          }`}
        >
          {isRecording ? "Presioná teclas..." : value || "Desactivado"}
        </button>

        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Desactivar atajo"
            className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {value !== defaultValue && (
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            title="Restablecer valor por defecto"
            className="p-1 text-gray-500 hover:text-blue-400 hover:bg-gray-800 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
