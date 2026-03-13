import { useState } from "react";
import { X, GitCommit, AlertCircle, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SyncCommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, description: string) => void;
  isLoading: boolean;
}

export function SyncCommitModal({ isOpen, onClose, onConfirm, isLoading }: SyncCommitModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-colors"
        >
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-200 flex items-center gap-2">
              <GitCommit size={18} className="text-blue-500" />
              Confirmar Alterações
            </h3>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-lg flex gap-3 text-xs text-blue-700 dark:text-blue-200">
              <AlertCircle size={16} className="text-blue-500 flex-shrink-0" />
              <p>Você fez alterações locais. Descreva o que mudou para salvar o histórico.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-500 tracking-wider">Título do Commit</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Atualizando docs de API"
                  autoFocus
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-500 tracking-wider">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Explique melhor as mudanças..."
                  rows={3}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-50 dark:bg-neutral-950/50 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 transition-colors">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(title || "Update note", description)}
              disabled={isLoading || !title.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 dark:shadow-blue-900/40"
            >
              {isLoading ? "Enviando..." : "Confirmar e Enviar"}
              {!isLoading && <Check size={14} />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
