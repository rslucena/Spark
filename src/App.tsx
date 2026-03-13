import { useState, useEffect, useCallback, useMemo } from "react";
import { MainLayout } from "./layouts/MainLayout";
import { MarkdownEditor } from "./components/Editor/Editor";
import { motion } from "framer-motion";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { isTauri, MOCK_CONTENT } from "./utils/env";
import { MetadataPanel } from "./components/MetadataPanel";
import { SyncCommitModal } from "./components/SyncCommitModal";
import { parseFrontmatter, stringifyWithFrontmatter, FileMetadata } from "./utils/markdown";
import { useSync } from "./hooks/useSync";
import { invoke } from "@tauri-apps/api/core";
import { SyncOverlay } from "./components/SyncOverlay";
import { resolveInternalLink } from "./utils/linkResolver";
import { getSyncSettings } from "./components/SettingsModal";
import Fuse from "fuse.js";
import { SearchResultsView } from "./components/SearchResultsView";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
}

const INITIAL_CONTENT = `# Welcome to Spark
A local-first knowledge management application.

## Features
- **Local-First**: Your data lives on your machine.
- **Git Sync**: Automatically synchronize with your git repositories.
- **Markdown**: Use standard Markdown syntax.

> "Knowledge is power."

### Getting Started
Select a file from the sidebar or start typing here to create a new document.
`;

// Simple debounce utility
function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newTimeoutId = setTimeout(() => {
        callback(...args);
      }, delay);
      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  );
}

function App() {
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState(INITIAL_CONTENT);
  const [metadata, setMetadata] = useState<FileMetadata>({ title: "", description: "" });
  const [vaultPath, setVaultPath] = useState<string>("");
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<FileEntry[]>([]);

  const { performSync, syncStatus, syncMessage, isSyncingOverlay } = useSync();

  useEffect(() => {
    async function initVaultPath() {
      try {
        if (!isTauri()) {
          setVaultPath("browser-vault");
          return;
        }
        const vault = "/home/lucena/Área de trabalho/Codes/Spark/src/brain";
        setVaultPath(vault);
      } catch (err) {
        console.error("Failed to get document directory:", err);
      }
    }
    initVaultPath();
  }, [vaultPath]);

  const fuse = useMemo(() => {
    return new Fuse(searchIndex, {
      keys: [
        { name: "name", weight: 0.7 },
        { name: "content", weight: 0.3 },
        { name: "path", weight: 0.1 }
      ],
      threshold: 0.4,
      ignoreLocation: true,
      includeMatches: true
    });
  }, [searchIndex]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, fuse]);

  const handleFileSelect = async (fileName: string) => {
    console.log("File selected:", fileName);
    try {
      if (!vaultPath) return;

      if (!isTauri()) {
        const fileContent = (MOCK_CONTENT as any)[fileName] || INITIAL_CONTENT;
        const { metadata: parsedMeta, body } = parseFrontmatter(fileContent);
        setActiveFile(fileName);
        setMetadata(parsedMeta);
        setContent(body);
        return;
      }

      const fullPath = await join(vaultPath, fileName);
      console.log("Reading file at path:", fullPath);
      const rawContent = await readTextFile(fullPath);
      
      const { metadata: parsedMeta, body } = parseFrontmatter(rawContent);
      setActiveFile(fileName);
      setMetadata(parsedMeta);
      setContent(body);
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  };

  const saveFile = async (body: string, meta: FileMetadata, fileName: string | null) => {
    if (!fileName || !vaultPath) return;
    if (!isTauri()) return;

    try {
      const fullPath = await join(vaultPath, fileName);
      const fullContent = stringifyWithFrontmatter(meta, body);
      await writeTextFile(fullPath, fullContent);
      console.log(`Saved ${fileName}`);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  };

  const debouncedSave = useDebounce(saveFile, 1000);

  const handleEditorChange = (body: string) => {
    setContent(body);
    if (activeFile) {
      debouncedSave(body, metadata, activeFile);
    }
  };

  const handleMetadataChange = (newMeta: FileMetadata) => {
    setMetadata(newMeta);
    if (activeFile) {
      debouncedSave(content, newMeta, activeFile);
    }
  };

  const handleStartSync = async () => {
    if (!activeFile || !vaultPath) return;
    
    // Check if it's a remote file
    if (!activeFile.startsWith("remote/")) return;

    try {
      const remoteFolder = await join(vaultPath, "remote");
      const status: string = await invoke("git_status", { repoPath: remoteFolder });
      
      if (status !== "Working tree clean") {
        setIsCommitModalOpen(true);
      } else {
        // No local changes, just pull
        await performSync({ vaultPath, showOverlay: true });
      }
    } catch (err) {
      console.error("Sync pre-check failed:", err);
    }
  };

  const handleConfirmSync = async (commitTitle: string, commitDesc: string) => {
    setIsCommitModalOpen(false);
    await performSync({
      vaultPath,
      showOverlay: true,
      commitMessage: commitTitle,
      commitDescription: commitDesc
    });
  };

  const handleLinkClick = async (url: string) => {
    const settings = getSyncSettings();
    const resolvedPath = resolveInternalLink(url, activeFile, settings);

    if (resolvedPath) {
      await handleFileSelect(resolvedPath);
    } else if (url.startsWith("http")) {
      // External link - open in browser
      if (isTauri()) {
        try {
          const { openUrl } = await import("@tauri-apps/plugin-opener");
          await openUrl(url);
        } catch (err) {
          console.error("Failed to open external link:", err);
        }
      } else {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <MainLayout 
      onFileSelect={handleFileSelect} 
      activeFilePath={activeFile}
      onSync={performSync}
      syncStatus={syncStatus}
      syncMessage={syncMessage}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onFilesLoaded={setSearchIndex}
      rightSidePanel={
        <MetadataPanel 
          metadata={metadata} 
          onChange={handleMetadataChange}
          onSync={handleStartSync}
          syncStatus={syncStatus}
          activeFile={activeFile}
        />
      }
    >
      {searchQuery ? (
        <SearchResultsView 
          query={searchQuery}
          results={searchResults}
          onFileSelect={(path: string) => {
            handleFileSelect(path);
            setSearchQuery("");
          }}
        />
      ) : (
        <motion.div
          key={activeFile || "welcome"}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full max-w-4xl mx-auto mt-4 px-8"
        >
          {!isTauri() && (
            <div className="bg-blue-900/40 border border-blue-500/50 text-blue-200 px-4 py-2 rounded-md mb-4 text-xs font-medium flex items-center justify-between">
              <span>Running in Browser Mode (Simulation)</span>
              <span className="opacity-70">Changes won't be saved to disk</span>
            </div>
          )}
          <div className="mb-4 text-sm text-neutral-500 flex items-center gap-2">
            <FileMetadataIcon activeFile={activeFile} />
            {activeFile ? activeFile : "Welcome Document (Not Saved)"}
          </div>
          <MarkdownEditor
            initialContent={content}
            onChange={handleEditorChange}
            onLinkClick={handleLinkClick}
          />
        </motion.div>
      )}

      <SyncCommitModal 
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onConfirm={handleConfirmSync}
        isLoading={syncStatus === "syncing"}
      />

      <SyncOverlay 
        isVisible={isSyncingOverlay} 
        message="Sincronizando Arquivos..." 
      />
    </MainLayout>
  );
}

function FileMetadataIcon({ activeFile }: { activeFile: string | null }) {
  if (!activeFile) return null;
  const isRemote = activeFile.startsWith("remote/");
  return (
    <div className={`w-2 h-2 rounded-full ${isRemote ? "bg-blue-500" : "bg-neutral-600"}`} />
  );
}

export default App;
