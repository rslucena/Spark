import { useState, useEffect } from "react";
import { readDir, BaseDirectory, exists, mkdir } from "@tauri-apps/plugin-fs";
import { documentDir, join } from "@tauri-apps/api/path";
import { FileText, Folder } from "lucide-react";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
}

interface SidebarProps {
  onFileSelect?: (path: string) => void;
  activeFilePath?: string | null;
}

export function Sidebar({ onFileSelect, activeFilePath }: SidebarProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [vaultPath, setVaultPath] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initVault() {
      try {
        // Find the documents directory
        const docs = await documentDir();
        const vault = await join(docs, "SparkVault");
        setVaultPath(vault);

        // Check if vault exists, if not create it
        const vaultExists = await exists(vault);
        if (!vaultExists) {
          await mkdir(vault, { recursive: true });
        }

        // Read the directory
        await loadFiles(vault);
      } catch (err) {
        console.error("Failed to initialize vault:", err);
        setError("Failed to load local files.");
      }
    }

    initVault();
  }, []);

  async function loadFiles(dir: string) {
    try {
      const entries = await readDir(dir);

      // Filter for markdown files and sort (directories first, then alphabetically)
      const formattedEntries: FileEntry[] = entries
        .filter((entry) => entry.isDirectory || entry.name.endsWith(".md"))
        .map((entry) => ({
          name: entry.name,
          path: entry.name, // Keep it simple for now, assuming flat directory
          isDirectory: entry.isDirectory,
        }))
        .sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

      setFiles(formattedEntries);
    } catch (err) {
      console.error("Failed to read directory:", err);
      setError("Failed to read files.");
    }
  }

  return (
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col">
      <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">Spark Vault</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {error ? (
          <p className="text-sm text-red-500 p-2">{error}</p>
        ) : files.length === 0 ? (
          <p className="text-sm text-neutral-500 p-2 text-center mt-4">No files found.</p>
        ) : (
          <ul className="space-y-1">
            {files.map((file) => (
              <li key={file.path}>
                <button
                  onClick={() => !file.isDirectory && onFileSelect?.(file.path)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                    activeFilePath === file.path
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100"
                  }`}
                >
                  {file.isDirectory ? (
                    <Folder size={16} className="text-neutral-500" />
                  ) : (
                    <FileText size={16} className="text-neutral-500" />
                  )}
                  <span className="truncate">{file.name.replace(".md", "")}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
