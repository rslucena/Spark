import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "./layouts/MainLayout";
import { MarkdownEditor } from "./components/Editor/Editor";
import { motion } from "framer-motion";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { documentDir, join } from "@tauri-apps/api/path";

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
  const [vaultPath, setVaultPath] = useState<string>("");

  useEffect(() => {
    async function initVaultPath() {
      try {
        const docs = await documentDir();
        setVaultPath(await join(docs, "SparkVault"));
      } catch (err) {
        console.error("Failed to get document directory:", err);
      }
    }
    initVaultPath();
  }, []);

  const handleFileSelect = async (fileName: string) => {
    try {
      if (!vaultPath) return;
      const fullPath = await join(vaultPath, fileName);
      const fileContent = await readTextFile(fullPath);
      setActiveFile(fileName);
      setContent(fileContent);
    } catch (err) {
      console.error("Failed to read file:", err);
    }
  };

  const saveFile = async (markdown: string, fileName: string | null) => {
    if (!fileName || !vaultPath) return;
    try {
      const fullPath = await join(vaultPath, fileName);
      await writeTextFile(fullPath, markdown);
      console.log(`Saved ${fileName}`);
    } catch (err) {
      console.error("Failed to save file:", err);
    }
  };

  const debouncedSave = useDebounce(saveFile, 1000);

  const handleEditorChange = (markdown: string) => {
    setContent(markdown);
    if (activeFile) {
      debouncedSave(markdown, activeFile);
    }
  };

  return (
    <MainLayout onFileSelect={handleFileSelect} activeFilePath={activeFile}>
      <motion.div
        key={activeFile || "welcome"}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full max-w-4xl mx-auto mt-4"
      >
        <div className="mb-4 text-sm text-neutral-500">
          {activeFile ? `Editing: ${activeFile}` : "Welcome Document (Not Saved)"}
        </div>
        <MarkdownEditor
          initialContent={content}
          onChange={handleEditorChange}
        />
      </motion.div>
    </MainLayout>
  );
}

export default App;
