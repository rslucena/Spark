import { useState, useEffect } from "react";
import { FileText, Info, Calendar, User, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { FileMetadata } from "../utils/markdown";

interface MetadataPanelProps {
  metadata: FileMetadata;
  onChange: (metadata: FileMetadata) => void;
  onSync: () => void;
  syncStatus: "idle" | "syncing" | "success" | "error";
  activeFile: string | null;
}

export function MetadataPanel({ 
  metadata, 
  onChange, 
  onSync, 
  syncStatus,
  activeFile 
}: MetadataPanelProps) {
  const [localMeta, setLocalMeta] = useState(metadata);

  useEffect(() => {
    setLocalMeta(metadata);
  }, [metadata]);

  const handleUpdate = (field: keyof FileMetadata, value: string) => {
    const updated = { ...localMeta, [field]: value };
    setLocalMeta(updated);
    onChange(updated);
  };

  if (!activeFile) return null; // Logic moved to MainLayout conditional rendering

  const isRemote = activeFile.startsWith("remote/");

  return (
    <div className="w-full h-full bg-[#111111] flex flex-col overflow-hidden transition-colors border-l border-[#222222]">
      {/* Header with Sync Button */}
      <div className="p-6 border-b border-[#222222] bg-[#111111]">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">Metadados</h2>
           {isRemote && (
             <button
               onClick={onSync}
               disabled={syncStatus === "syncing"}
               className={`p-2 rounded-xl transition-all ${
                 syncStatus === "syncing" 
                 ? "bg-blue-600/20 text-blue-500 dark:text-blue-400" 
                 : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 shadow-sm"
               }`}
               title="Sincronizar Arquivo"
             >
               <RefreshCw size={18} className={syncStatus === "syncing" ? "animate-spin" : ""} />
             </button>
           )}
        </div>

        {isRemote && (
          <button
            onClick={onSync}
            disabled={syncStatus === "syncing"}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 dark:shadow-blue-900/20 flex items-center justify-center gap-2 group"
          >
            {syncStatus === "syncing" ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : syncStatus === "success" ? (
              <CheckCircle2 size={14} className="text-blue-100" />
            ) : (
              <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            )}
            {syncStatus === "syncing" ? "Sincronizando..." : "Sincronizar Agora"}
          </button>
        )}
      </div>

      {/* Form Fields */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              <FileText size={12} /> Título do Arquivo
            </label>
            <input
              type="text"
              value={localMeta.title}
              onChange={(e) => handleUpdate("title", e.target.value)}
              placeholder="Ex: Guia de Autenticação"
              className="w-full bg-[#1A1A1A] border border-[#222222] rounded-md px-3 py-2.5 text-sm text-neutral-200 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold text-neutral-500 dark:text-neutral-500 uppercase tracking-wider">
              <Info size={12} /> Descrição
            </label>
            <textarea
              value={localMeta.description}
              onChange={(e) => handleUpdate("description", e.target.value)}
              placeholder="Breve descrição do conteúdo..."
              rows={4}
              className="w-full bg-[#1A1A1A] border border-[#222222] rounded-md px-3 py-2.5 text-sm text-neutral-200 focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 transition-colors resize-none outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="pt-6 border-t border-[#222222] space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-400 dark:text-neutral-600 border border-neutral-100 dark:border-neutral-800">
                <Calendar size={14} />
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-600 tracking-wider">Última Modificação</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 font-mono">{localMeta.lastModified || "--/--/----"}</p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="p-2 bg-neutral-50 dark:bg-neutral-950 rounded-lg text-neutral-400 dark:text-neutral-600 border border-neutral-100 dark:border-neutral-800">
                <User size={14} />
             </div>
             <div>
                <p className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-600 tracking-wider">Autor</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{localMeta.author || "Não identificado"}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-[#111111] border-t border-[#222222] transition-colors">
        <div className={`text-[12px] flex items-center gap-2 ${isRemote ? "text-blue-600 dark:text-blue-500/70" : "text-neutral-500"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isRemote ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" : "bg-neutral-300 dark:bg-neutral-700"}`} />
          {isRemote ? "Armazenado no GitHub" : "Arquivo Local (Draft)"}
        </div>
      </div>
    </div>
  );
}
