import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  content?: string;
}

interface SearchResultsViewProps {
  query: string;
  results: FileEntry[];
  onFileSelect: (path: string) => void;
}

export function SearchResultsView({ query, results, onFileSelect }: SearchResultsViewProps) {
  const getContentPreview = (content?: string) => {
    if (!content) return "";
    // Strip frontmatter
    const body = content.replace(/^---[\s\S]*?---/, "").trim();
    // Get first line or first 120 chars
    const lines = body.split("\n").filter(l => l.trim().length > 0);
    const preview = lines[0] || body.substring(0, 120);
    return preview.length > 120 ? preview.substring(0, 117) + "..." : preview;
  };

  return (
    <div className="w-full h-full max-w-5xl mx-auto px-8 py-12 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
            <Search size={28} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-neutral-900 dark:text-white tracking-tight">Busca</h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-lg">
              Estes foram os resultados encontrados para o termo: <span className="text-blue-600 dark:text-blue-400 font-semibold">"{query}"</span>
            </p>
          </div>
        </div>

        <div className="h-px bg-neutral-200 dark:bg-neutral-800 w-full my-8" />

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
            <Search size={64} className="mb-4 text-neutral-400" />
            <p className="text-xl font-medium text-neutral-500">Nenhum resultado encontrado</p>
            <p className="text-sm text-neutral-400 max-w-xs mt-2">
              Tente usar termos mais genéricos ou verifique se o arquivo existe.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {results.map((file, index) => (
              <motion.button
                key={file.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => onFileSelect(file.path)}
                className="group relative w-full flex flex-col p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500/50 hover:bg-white dark:hover:bg-neutral-800 transition-all text-left overflow-hidden shadow-sm hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 p-3 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-400 group-hover:text-blue-500 group-hover:border-blue-500/30 transition-colors shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1 truncate font-outfit capitalize">
                      {file.name.replace(".md", "").replace(/-/g, " ")}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                        {file.path.split("/")[0]}
                      </span>
                      <span className="text-[12px] text-neutral-500 dark:text-neutral-500 truncate">
                        {file.path}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {getContentPreview(file.content)}
                    </p>
                  </div>
                  <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all">
                    <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/20 uppercase tracking-widest">
                       Abrir
                    </div>
                  </div>
                </div>
                
                {/* Visual Accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 scale-y-0 group-hover:scale-y-100 transition-transform origin-center" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
