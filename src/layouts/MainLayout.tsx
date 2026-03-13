export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-neutral-900 text-neutral-100 font-sans overflow-hidden">
      {/* Sidebar / File Explorer Placeholder */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col">
        <div className="p-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">Spark</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-neutral-500">No files open.</p>
        </div>
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col bg-neutral-900 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
