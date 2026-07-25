export function matchesShortcut(
  event: KeyboardEvent,
  shortcutStr: string | null
): boolean {
  if (!shortcutStr || !shortcutStr.trim()) return false;

  const parts = shortcutStr.split("+").map((p) => p.trim());
  const keyPart = parts[parts.length - 1];
  const modifiers = parts.slice(0, parts.length - 1).map((m) => m.toLowerCase());

  const requiresCtrl = modifiers.includes("ctrl") || modifiers.includes("cmd");
  const requiresShift = modifiers.includes("shift");
  const requiresAlt = modifiers.includes("alt");

  const actualCtrl = event.ctrlKey || event.metaKey;
  const actualShift = event.shiftKey;
  const actualAlt = event.altKey;

  if (requiresCtrl !== actualCtrl) return false;
  if (requiresShift !== actualShift) return false;
  if (requiresAlt !== actualAlt) return false;

  const targetKey = keyPart.toLowerCase();
  const eventKey = event.key.toLowerCase();
  const eventCode = event.code.toLowerCase();

  if (targetKey === "\\") {
    return eventKey === "\\" || eventCode === "backslash";
  }

  if (targetKey === ",") {
    return eventKey === "," || eventCode === "comma";
  }

  if (targetKey === "tab") {
    return eventKey === "tab";
  }

  if (targetKey === "space") {
    return eventKey === " " || eventKey === "space";
  }

  return eventKey === targetKey || eventCode === `key${targetKey}`;
}

export function formatShortcutDisplay(shortcutStr: string | null): string {
  if (!shortcutStr) return "Desactivado";
  return shortcutStr;
}
