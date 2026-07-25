export function isDimmedItem(name: string): boolean {
  return name.startsWith(".") || name.toLowerCase() === "node_modules";
}

export function isHiddenItem(name: string): boolean {
  return name.startsWith(".");
}
