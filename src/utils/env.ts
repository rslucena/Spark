export function isTauri(): boolean {
  return !!(window as any).__TAURI_INTERNALS__;
}

export const MOCK_FILES = [
  { name: "[Local] Browser Welcome", path: "local/welcome.md", isDirectory: false },
  { name: "[Remote] GitHub Sample", path: "remote/github.md", isDirectory: false },
];

export const MOCK_CONTENT = {
  "local/welcome.md": "# Welcome (Browser Mode)\nYou are running Spark in a browser. File system access and Git sync are simulated.",
  "remote/github.md": "# GitHub Note (Browser Mode)\nThis file would be synced with your repository in native mode.",
};
