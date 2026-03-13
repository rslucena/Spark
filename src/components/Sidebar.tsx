import { useState, useEffect, useRef, useMemo } from "react";
import { readDir, exists, mkdir, readTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import {
  FileText,
  Folder,
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Brain,
  Search,
  X,
  Command,
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import * as tauriCore from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsModal, getSyncSettings } from "./SettingsModal";
import { MOCK_FILES } from "../utils/mockData";

const invoke = tauriCore && (tauriCore as any).invoke ? (tauriCore as any).invoke : null;

function isTauri() {
  return !!(window as any).__TAURI_INTERNALS__;
}

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
}

interface FileNode extends FileEntry {
  children: FileNode[];
  level: number;
}

interface SidebarItemProps {
  node: FileNode;
  onFileSelect?: (path: string) => void;
  activeFilePath?: string | null;
  forceOpenPaths?: Set<string>;
}

function SidebarItem({ node, onFileSelect, activeFilePath, forceOpenPaths }: SidebarItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = activeFilePath === node.path;

  // Auto-expand if the path is in forceOpenPaths
  useEffect(() => {
    if (forceOpenPaths?.has(node.path)) {
      setIsOpen(true);
    }
  }, [forceOpenPaths, node.path]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.isDirectory) {
      setIsOpen(!isOpen);
    } else if (onFileSelect) {
      onFileSelect(node.path);
    }
  };

  const itemRef = useRef<HTMLDivElement>(null);

  // Scroll into view if selected
  useEffect(() => {
    if (isSelected && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isSelected]);

  return (
    <div className="select-none" ref={itemRef}>
      <button
        onClick={handleToggle}
        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-left group ${
          isSelected 
            ? "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold shadow-sm" 
            : "text-neutral-700 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white"
        }`}
        style={{ paddingLeft: `${node.level * 10}px` }}
      >
        <div className="capitalize flex items-center gap-2 flex-1 min-w-0">
          <div className={`shrink-0 p-0.5 rounded ${isSelected ? "text-blue-500" : "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-300"}`}>
            {node.isDirectory ? (
              isOpen ? <ChevronDown size={14} className="text-blue-500" /> : <ChevronRight size={14} />
            ) : (
              <FileText size={14}  />
            )}
          </div>
          <span className="truncate text-[13px]">{node.name.replace(".md", "")}</span>
        </div>
        
        {!node.isDirectory && isSelected && (
           <motion.div 
             layoutId="active-indicator"
             className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
           />
        )}
      </button>

      {node.isDirectory && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-0.5">
                {node.children.map((child) => (
                  <SidebarItem 
                    key={child.path} 
                    node={child} 
                    onFileSelect={onFileSelect} 
                    activeFilePath={activeFilePath} 
                    forceOpenPaths={forceOpenPaths}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

interface SidebarProps {
  onFileSelect?: (path: string) => void;
  activeFilePath?: string | null;
  performSync?: (options: { vaultPath: string, showOverlay?: boolean, onSuccess?: () => void }) => Promise<void>;
  syncStatus?: "idle" | "syncing" | "success" | "error";
  syncMessage?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onFilesLoaded?: (files: FileEntry[]) => void;
}

export function Sidebar({ 
  onFileSelect, 
  activeFilePath,
  performSync,
  syncStatus = "idle",
  syncMessage = "" ,
  searchQuery = "",
  onSearchChange,
  onFilesLoaded
}: SidebarProps) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [vaultPath, setVaultPath] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const hasAutoSynced = useRef(false);

  // Calculate parent paths for auto-expansion
  const forceOpenPaths = useMemo(() => {
    if (!activeFilePath) return new Set<string>();
    const paths = new Set<string>();
    const parts = activeFilePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      paths.add(parts.slice(0, i).join("/"));
    }
    return paths;
  }, [activeFilePath]);

  // Notify parent when files change
  useEffect(() => {
    async function notifyParent() {
      if (!onFilesLoaded || files.length === 0) return;
      
      const searchableFiles = files.filter(f => !f.isDirectory && f.name.endsWith(".md"));
      const indexed = await Promise.all(
        searchableFiles.map(async (file) => {
          try {
            const fullPath = await join(vaultPath, file.path);
            const content = await readTextFile(fullPath);
            return { ...file, content };
          } catch (e) {
            return file;
          }
        })
      );
      onFilesLoaded(indexed);
    }
    notifyParent();
  }, [files, vaultPath, onFilesLoaded]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "f")) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        onSearchChange?.("");
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fileTree = useMemo(() => {
    const rootNodes: FileNode[] = [];
    
    // Split into Local and Remote sections
    const localFiles = files.filter(f => f.path.startsWith("local/"));
    const remoteFiles = files.filter(f => f.path.startsWith("remote/"));

    const buildTree = (entries: FileEntry[], prefix: string, label: string): FileNode => {
      const root: FileNode = { 
        name: label, 
        path: prefix, 
        isDirectory: true, 
        children: [], 
        level: 0 
      };

      entries.forEach(file => {
        const relPath = file.path.replace(`${prefix}/`, "");
        const pathParts = relPath.split("/");
        let currentNode = root;

        pathParts.forEach((part, index) => {
          const isDir = index < pathParts.length - 1;
          const currentPath = `${prefix}/${pathParts.slice(0, index + 1).join("/")}`;
          
          let existingNode = currentNode.children.find(n => n.name === part);
          
          if (!existingNode) {
            existingNode = {
              name: part,
              path: currentPath,
              isDirectory: isDir,
              children: [],
              level: index + 1
            };
            currentNode.children.push(existingNode);
          }
          currentNode = existingNode;
        });
      });

      return root;
    };

    if (localFiles.length > 0) rootNodes.push(buildTree(localFiles, "local", "Arquivos Locais"));
    if (remoteFiles.length > 0) rootNodes.push(buildTree(remoteFiles, "remote", "Repositório GitHub"));

    return rootNodes;
  }, [files]);

  useEffect(() => {
    async function initVault() {
      try {
        if (!isTauri()) {
          setVaultPath("browser-vault");
          setFiles(MOCK_FILES);
          return;
        }

        const vault = "/home/lucena/Área de trabalho/Codes/Spark/src/brain";
        setVaultPath(vault);

        const localFolder = await join(vault, "local");
        const remoteFolder = await join(vault, "remote");

        for (const folder of [localFolder, remoteFolder]) {
          const folderExists = await exists(folder);
          if (!folderExists) {
            await mkdir(folder, { recursive: true });
          }
        }

        await loadFiles(vault);
        
        if (invoke) {
          try {
             await invoke("git_init", { repoPath: remoteFolder });
          } catch (gitErr) {
             console.error("Git init error in remote folder:", gitErr);
          }
        }

        // Auto-sync on start if configured
        const config = getSyncSettings();
        if (config.remoteUrl && config.pat && !hasAutoSynced.current && performSync) {
          hasAutoSynced.current = true;
          await performSync({ 
            vaultPath: vault, 
            onSuccess: () => loadFiles(vault) 
          });
        }

      } catch (err: any) {
        console.error("Failed to initialize vault:", err);
        setError(`Failed to load files: ${err.message || err.toString()}`);
      }
    }

    initVault();
  }, [performSync]);

  const handleManualSync = async () => {
    if (!vaultPath || !performSync) return;
    await performSync({ 
      vaultPath, 
      showOverlay: true, 
      onSuccess: () => loadFiles(vaultPath)
    });
  };

  async function loadFiles(dir: string) {
    if (!isTauri()) return;

    try {
      const allFiles: FileEntry[] = [];
      
      async function scanRecursive(currentPath: string, relativePrefix: string = ""): Promise<FileEntry[]> {
        const results: FileEntry[] = [];
        try {
          const entries = await readDir(currentPath);
          for (const entry of entries) {
             const relPath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
             if (entry.isDirectory) {
               if (entry.name === ".git") continue;
               const fullPath = await join(currentPath, entry.name);
               const subResults = await scanRecursive(fullPath, relPath);
               results.push(...subResults);
             } else if (entry.name.endsWith(".md")) {
               results.push({
                 name: entry.name,
                 path: relPath,
                 isDirectory: false
               });
             }
          }
        } catch (e) {
          console.error(`Error scanning ${currentPath}:`, e);
        }
        return results;
      }

      const localFolder = await join(dir, "local");
      const remoteFolder = await join(dir, "remote");
      
      if (await exists(localFolder)) {
        const localResults = await scanRecursive(localFolder);
        allFiles.push(...localResults.map(f => ({
          ...f,
          path: `local/${f.path}`
        })));
      }

      if (await exists(remoteFolder)) {
        try {
          const config = getSyncSettings();
          const subfolder = config.subfolder.startsWith("/") 
            ? config.subfolder.substring(1) 
            : config.subfolder;
            
          const targetRemotePath = subfolder ? await join(remoteFolder, subfolder) : remoteFolder;
          
          if (await exists(targetRemotePath)) {
            const remoteResults = await scanRecursive(targetRemotePath);
            allFiles.push(...remoteResults.map(f => {
              const finalRelPath = subfolder ? `${subfolder}/${f.path}` : f.path;
              return {
                ...f,
                path: `remote/${finalRelPath}`
              };
            }));
          }
        } catch (remoteErr) {
          console.warn("Failed to read remote folder:", remoteErr);
        }
      }

      setFiles(allFiles);
    } catch (err) {
      console.error("Failed to read directory:", err);
      setError("Failed to read files.");
    }
  }

  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    const nextTheme: Record<string, "light" | "dark" | "system"> = {
      light: "dark",
      dark: "system",
      system: "light",
    };
    setTheme(nextTheme[theme]);
  };

  const ThemeIcon = () => {
    if (theme === "light") return <Sun size={14} />;
    if (theme === "dark") return <Moon size={14} />;
    return <Monitor size={14} />;
  };

  return (
    <aside className="h-full border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col shrink-0 overflow-hidden transition-colors">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 dark:bg-blue-500 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/20">
            <Brain size={16} />
          </div>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-900 dark:text-neutral-200">Spark</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
            title={`Tema: ${theme === "system" ? "Sistema" : theme === "dark" ? "Escuro" : "Claro"}`}
          >
            <ThemeIcon />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
            title="Settings"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={handleManualSync}
            disabled={syncStatus === "syncing" || !vaultPath}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all disabled:opacity-50"
            title="Sync Vault"
          >
            <RefreshCw size={14} className={syncStatus === "syncing" ? "animate-spin text-blue-400" : ""} />
          </button>
        </div>
      </div>

      <div className="mt-[15px] px-4">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={14} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar arquivos ou conteúdo..."
            className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl py-2 pl-9 pr-12 text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button 
                onClick={() => onSearchChange?.("")}
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-neutral-400 transition-colors"
              >
                <X size={12} />
              </button>
            ) : (
              <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-200/50 dark:bg-neutral-800/50 rounded text-[10px] font-medium text-neutral-500 border border-neutral-300/50 dark:border-neutral-700/50">
                <Command size={10} />
                <span>K</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar scrollbar-thin">
        {error ? (
          <p className="text-xs text-red-500 p-2">{error}</p>
        ) : fileTree.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-2 opacity-40">
            <Folder size={32} className="text-neutral-500" />
            <p className="text-xs text-neutral-500">Nenhum arquivo encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fileTree.map((rootNode) => (
              <div key={rootNode.path} className="space-y-1">
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-500 dark:text-neutral-600 mb-1">
                  {rootNode.name}
                </div>
                {rootNode.children.map((child) => (
                  <SidebarItem 
                    key={child.path} 
                    node={child} 
                    onFileSelect={onFileSelect} 
                    activeFilePath={activeFilePath} 
                    forceOpenPaths={forceOpenPaths}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 transition-colors">
         <div className={`flex items-center gap-2 text-[12px] font-bold transition-colors ${
           syncStatus === "error" ? "text-red-400" :
           syncStatus === "success" ? "text-green-500" :
           syncStatus === "syncing" ? "text-blue-500" : "text-neutral-400 dark:text-neutral-600"
         }`}>
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${
              syncStatus === "syncing" ? "bg-blue-500 animate-pulse" : 
              syncStatus === "success" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)]" :
              syncStatus === "error" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" :
              "bg-green-500/50"
            }`} />
            
            <span className="truncate">
              {syncStatus === "syncing" ? "Sincronizando..." : 
               syncStatus === "success" ? "Tudo Atualizado" : 
               syncStatus === "error" ? (syncMessage || "Erro no Sync") : 
               "Conectado"}
            </span>
         </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleManualSync}
      />
    </aside>
  );
}
