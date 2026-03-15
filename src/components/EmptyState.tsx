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
