import { Sidebar } from "../components/Sidebar";

export function MainLayout({
  children,
  onFileSelect,
  activeFilePath,
}: {
  children: React.ReactNode;
  onFileSelect?: (path: string) => void;
  activeFilePath?: string | null;
}) {
  return (
    <div className="flex h-screen w-full bg-neutral-900 text-neutral-100 font-sans overflow-hidden">
      <Sidebar onFileSelect={onFileSelect} activeFilePath={activeFilePath} />

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-neutral-900 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8">{children}</div>
      </main>
    </div>
  );
}
