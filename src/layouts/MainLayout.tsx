import { useState, useCallback, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { SyncStatus } from "../hooks/useSync";

export function MainLayout({
  children,
  onFileSelect,
  activeFilePath,
  rightSidePanel,
  onSync,
  syncStatus,
  syncMessage
}: {
  children: React.ReactNode;
  onFileSelect?: (path: string) => void;
  activeFilePath?: string | null;
  rightSidePanel?: React.ReactNode;
  onSync?: (options: { 
    showOverlay?: boolean, 
    vaultPath: string,
    onSuccess?: () => void
  }) => Promise<void>;
  syncStatus?: SyncStatus;
  syncMessage?: string;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [metadataWidth, setMetadataWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingMetadata, setIsResizingMetadata] = useState(false);

  const startResizingSidebar = useCallback(() => {
    setIsResizingSidebar(true);
  }, []);

  const startResizingMetadata = useCallback(() => {
    setIsResizingMetadata(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizingSidebar(false);
    setIsResizingMetadata(false);
  }, []);

  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = e.clientX;
        if (newWidth > 150 && newWidth < 600) {
          setSidebarWidth(newWidth);
        }
      } else if (isResizingMetadata) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 200 && newWidth < 600) {
          setMetadataWidth(newWidth);
        }
      }
    },
    [isResizingSidebar, isResizingMetadata]
  );

  useEffect(() => {
    if (isResizingSidebar || isResizingMetadata) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "default";
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizingSidebar, isResizingMetadata, resize, stopResizing]);

  const showMetadata = !!activeFilePath;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden select-none">
      {/* Left Sidebar */}
      <div style={{ width: sidebarWidth }}>
        <Sidebar 
          onFileSelect={onFileSelect} 
          activeFilePath={activeFilePath} 
          performSync={onSync}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
        />
      </div>

      {/* Sidebar Resizer */}
      <div
        onMouseDown={startResizingSidebar}
        className={`w-px cursor-col-resize hover:bg-blue-500 transition-colors z-10 border-l border-neutral-200 dark:border-neutral-800 ${
          isResizingSidebar ? "bg-blue-500" : "bg-transparent"
        }`}
      />

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-white dark:bg-neutral-900 overflow-hidden relative min-w-0">
        <div className="flex-1 overflow-y-hidden select-text">{children}</div>
      </main>

      {/* Metadata Panel + Resizer */}
      {showMetadata && (
        <>
          {/* Metadata Resizer */}
          <div
            onMouseDown={startResizingMetadata}
            className={`w-px cursor-col-resize hover:bg-blue-500 transition-colors z-10 border-r border-neutral-200 dark:border-neutral-800 ${
              isResizingMetadata ? "bg-blue-500" : "bg-transparent"
            }`}
          />
          <div style={{ width: metadataWidth }}>
            {rightSidePanel}
          </div>
        </>
      )}
    </div>
  );
}
