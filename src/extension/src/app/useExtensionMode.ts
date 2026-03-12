export type ExtensionMode = "sidepanel" | "tab";

export function useExtensionMode(): ExtensionMode {
  return ((window as any).__EXTENSION_MODE as ExtensionMode) || "tab";
}
