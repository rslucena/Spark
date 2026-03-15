#!/bin/bash
# 1. Dark Mode Default
sed -i 's/<html lang="en">/<html lang="en" class="dark">/g' index.html
cat << 'HOOK' > src/hooks/useTheme.ts
import { useState, useEffect } from "react";

export type Theme = "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    localStorage.setItem("spark_theme", "dark");
  }, [theme]);

  return { theme, setTheme };
}
HOOK
sed -i '401,406d' src/components/Sidebar.tsx
sed -i '421,427d' src/components/Sidebar.tsx

# 2. Sidebar Restyling
sed -i 's/className="w-full h-full bg-\[#fafafa\] dark:bg-\[#141414\] flex flex-col overflow-hidden transition-colors border-r border-neutral-200\/60 dark:border-\[#222\]"/className="w-full h-full bg-[#111111] flex flex-col overflow-hidden transition-colors border-r border-[#222222]"/g' src/components/Sidebar.tsx
sed -i 's/className="flex items-center gap-2.5"/className="flex items-center gap-2"/g' src/components/Sidebar.tsx
sed -i 's/className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-md text-white shadow-sm"/className="text-neutral-400"/g' src/components/Sidebar.tsx
sed -i 's/strokeWidth={2.5}/strokeWidth={2}/g' src/components/Sidebar.tsx
sed -i 's/className="text-\[13px\] font-extrabold uppercase tracking-widest text-neutral-800 dark:text-neutral-200"/className="text-[13px] font-bold text-neutral-200 tracking-wide"/g' src/components/Sidebar.tsx
sed -i 's/className="w-full bg-white dark:bg-\[#1a1a1a\] border border-neutral-200 dark:border-neutral-800 rounded-lg py-1.5 pl-8 pr-8 text-\[13px\] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500\/50 focus:ring-2 focus:ring-blue-500\/10 transition-all outline-none shadow-sm"/className="w-full bg-[#1A1A1A] border border-[#222222] rounded-md py-1.5 pl-8 pr-8 text-[13px] text-neutral-200 placeholder:text-neutral-500 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-all outline-none"/g' src/components/Sidebar.tsx
sed -i 's/className="px-3 py-1 text-\[11px\] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500"/className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500"/g' src/components/Sidebar.tsx
sed -i 's/className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg text-\[13px\] transition-all ${/className={`w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] transition-all ${/g' src/components/Sidebar.tsx
sed -i 's/isSelected ? "bg-blue-50 dark:bg-blue-500\/10 text-blue-600 dark:text-blue-400 font-semibold" : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800\/60 hover:text-neutral-900 dark:hover:text-neutral-200"/isSelected ? "bg-[#2A2A2A] text-white font-medium" : "text-neutral-400 hover:bg-[#1A1A1A] hover:text-neutral-200"/g' src/components/Sidebar.tsx
sed -i 's/className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-\[0_0_8px_rgba(59,130,246,0.5)\]"/className="w-1.5 h-1.5 rounded-full bg-neutral-300"/g' src/components/Sidebar.tsx

# 3. MainLayout
sed -i 's/className="flex h-screen w-full bg-white dark:bg-\[#111111\] text-neutral-800 dark:text-neutral-200 font-sans overflow-hidden select-none"/className="flex h-screen w-full bg-[#111111] text-neutral-200 font-sans overflow-hidden select-none"/g' src/layouts/MainLayout.tsx
sed -i 's/className="flex-1 flex flex-col bg-white dark:bg-\[#111111\] overflow-hidden relative min-w-0 shadow-\[-10px_0_30px_rgba(0,0,0,0.02)\] dark:shadow-\[-10px_0_30px_rgba(0,0,0,0.2)\]"/className="flex-1 flex flex-col bg-[#111111] overflow-hidden relative min-w-0"/g' src/layouts/MainLayout.tsx
sed -i 's/className="flex shrink-0 bg-\[#fafafa\] dark:bg-\[#141414\] transition-\[width\] duration-75 ease-out"/className="flex shrink-0 bg-[#111111] transition-[width] duration-75 ease-out border-l border-[#222222]"/g' src/layouts/MainLayout.tsx

# 4. EmptyState
cat << 'EMPTY' > src/components/EmptyState.tsx
import { motion } from "framer-motion";
import { Plus, Github, Command } from "lucide-react";

export function EmptyState({
  onNewNote,
  onImportGithub,
  onCommandPalette
}: {
  onNewNote: () => void,
  onImportGithub: () => void,
  onCommandPalette: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="max-w-2xl w-full"
      >
        <h1 className="text-4xl font-extrabold text-neutral-100 mb-4 tracking-tight" style={{ fontFamily: "var(--font-outfit)" }}>
          Welcome to Spark
        </h1>
        <p className="text-neutral-400 mb-12 text-lg">
          Start your next big idea or search your existing knowledge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            icon={<Plus size={20} />}
            title="Create New Note"
            description="Start writing from scratch"
            onClick={onNewNote}
          />
          <ActionCard
            icon={<Github size={20} />}
            title="Import from GitHub"
            description="Sync your remote vault"
            onClick={onImportGithub}
          />
          <ActionCard
            icon={<Command size={20} />}
            title="Open Command Palette"
            description="Press Ctrl+K to search"
            onClick={onCommandPalette}
          />
        </div>
      </motion.div>
    </div>
  );
}

function ActionCard({ icon, title, description, onClick }: any) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center p-6 bg-[#1A1A1A] border border-[#222222] hover:border-neutral-500 rounded-xl transition-colors text-left w-full group"
    >
      <div className="text-neutral-400 group-hover:text-white mb-4 transition-colors">
        {icon}
      </div>
      <h3 className="text-neutral-200 font-semibold mb-1 text-[15px]">{title}</h3>
      <p className="text-neutral-500 text-[13px]">{description}</p>
    </motion.button>
  );
}
EMPTY

# 5. Editor modifications
sed -i 's/class:\n          "prose dark:prose-invert prose-p:my-2 prose-headings:my-4 prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl focus:outline-none max-w-none min-h-\[500px\]"/class:\n          "prose dark:prose-invert prose-neutral prose-p:my-2 prose-headings:my-4 prose-h1:text-4xl prose-h1:font-extrabold prose-h1:text-neutral-100 prose-h2:text-2xl prose-h2:font-bold prose-h2:text-neutral-200 prose-h3:text-xl prose-p:text-neutral-300 prose-p:leading-7 focus:outline-none max-w-none min-h-[500px] font-[var(--font-inter)]"/g' src/components/Editor/Editor.tsx

sed -i 's/import { SearchResultsView } from ".\/components\/SearchResultsView";/import { SearchResultsView } from ".\/components\/SearchResultsView";\nimport { EmptyState } from ".\/components\/EmptyState";/' src/App.tsx
line_num=$(grep -n "<motion.div" src/App.tsx | cut -d: -f1)
sed -i "$line_num,\$ s/<motion.div/{!activeFile ? (<EmptyState onNewNote={() => setContent(\"\")} onImportGithub={() => document.querySelector(\`[title=\"Settings\"]\`)?.click()} onCommandPalette={() => setSearchQuery(\" \")} \/>) : (<div className=\"flex-1 h-full overflow-y-auto custom-scrollbar pb-32 pt-8\"><motion.div/" src/App.tsx
sed -i 's/<\/motion.div>/<\/motion.div><\/div>)}/g' src/App.tsx
sed -i 's/transition={{ duration: 0.3 }}/transition={{ duration: 0.4, ease: "easeOut" }}/g' src/App.tsx

# 6. Metadata modifications
sed -i 's/className="h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 flex flex-col shadow-2xl overflow-hidden transition-colors"/className="w-full h-full bg-[#111111] flex flex-col overflow-hidden transition-colors border-l border-[#222222]"/g' src/components/MetadataPanel.tsx
sed -i 's/className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900\/50"/className="p-6 border-b border-[#222222] bg-[#111111]"/g' src/components/MetadataPanel.tsx
sed -i 's/className="text-xs font-black uppercase tracking-\[0.2em\] text-neutral-400 dark:text-neutral-500"/className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500"/g' src/components/MetadataPanel.tsx
sed -i 's/className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors font-medium"/className="w-full bg-[#1A1A1A] border border-[#222222] rounded-md px-3 py-2.5 text-sm text-neutral-200 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors outline-none"/g' src/components/MetadataPanel.tsx
sed -i 's/className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"/className="w-full bg-[#1A1A1A] border border-[#222222] rounded-md px-3 py-2.5 text-sm text-neutral-200 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors resize-none outline-none leading-relaxed"/g' src/components/MetadataPanel.tsx
sed -i 's/className="pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-4"/className="pt-6 border-t border-[#222222] space-y-4"/g' src/components/MetadataPanel.tsx
sed -i 's/className="p-6 bg-neutral-50\/50 dark:bg-neutral-950\/30 border-t border-neutral-200 dark:border-neutral-800 transition-colors"/className="p-6 bg-[#111111] border-t border-[#222222] transition-colors"/g' src/components/MetadataPanel.tsx
