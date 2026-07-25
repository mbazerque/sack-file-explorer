interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SelectDropdownProps<T extends string | number> {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function SelectDropdown<T extends string | number>({
  value,
  onChange,
  options,
  label,
  description,
  disabled = false,
}: SelectDropdownProps<T>) {
  return (
    <div className="flex items-center justify-between py-2">
      {(label || description) && (
        <div className="pr-4">
          {label && <div className="text-xs font-medium text-gray-200">{label}</div>}
          {description && <div className="text-[11px] text-gray-400 mt-0.5">{description}</div>}
        </div>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-gray-800 border border-gray-700 text-gray-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-sans cursor-pointer disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value} className="bg-gray-900 text-gray-200">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
