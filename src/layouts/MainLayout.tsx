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
  syncMessage,
  searchQuery,
  onSearchChange,
  onFilesLoaded
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
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onFilesLoaded?: (files: any[]) => void;
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
    <div className="flex h-screen w-full bg-[#111111] text-neutral-200 font-sans overflow-hidden select-none">
      {/* Left Sidebar */}
      <div
        style={{ width: sidebarWidth }}
        className="flex shrink-0 transition-[width] duration-75 ease-out"
      >
        <Sidebar 
          onFileSelect={onFileSelect} 
          activeFilePath={activeFilePath} 
          performSync={onSync}
          syncStatus={syncStatus}
          syncMessage={syncMessage}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onFilesLoaded={onFilesLoaded}
        />
      </div>

      {/* Sidebar Resizer */}
      <div
        onMouseDown={startResizingSidebar}
        className={`relative w-1 -ml-[0.5px] cursor-col-resize z-20 group flex items-center justify-center transition-colors`}
      >
        <div className={`h-full w-px transition-colors duration-200 ${isResizingSidebar ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-800 group-hover:bg-blue-400 dark:group-hover:bg-blue-500/50'}`} />
      </div>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-[#111111] overflow-hidden relative min-w-0">
        <div className="flex-1 overflow-y-hidden select-text">{children}</div>
      </main>

      {/* Metadata Panel + Resizer */}
      {showMetadata && (
        <>
          {/* Metadata Resizer */}
          <div
            onMouseDown={startResizingMetadata}
            className={`relative w-1 -mr-[0.5px] cursor-col-resize z-20 group flex items-center justify-center transition-colors`}
          >
             <div className={`h-full w-px transition-colors duration-200 ${isResizingMetadata ? 'bg-blue-500' : 'bg-neutral-200 dark:bg-neutral-800 group-hover:bg-blue-400 dark:group-hover:bg-blue-500/50'}`} />
          </div>
          <div style={{ width: metadataWidth }} className="flex shrink-0 bg-[#111111] transition-[width] duration-75 ease-out border-l border-[#222222]">
            {rightSidePanel}
          </div>
        </>
      )}
    </div>
  );
}
