import { useState, useEffect } from "react";
import { X, Check, ChevronRight, ChevronLeft, Loader2, Folder, Github, GitBranch, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchUserRepos, fetchRepoFolders, GithubRepo, GithubContent } from "../utils/github";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export interface SyncSettings {
  remoteUrl: string;
  pat: string;
  authorName: string;
  authorEmail: string;
  branch: string;
  subfolder: string;
  repoName?: string;
  repoOwner?: string;
}

export function getSyncSettings(): SyncSettings {
  return {
    remoteUrl: localStorage.getItem("spark_remoteUrl") || "",
    pat: localStorage.getItem("spark_pat") || "",
    authorName: localStorage.getItem("spark_authorName") || "Spark User",
    authorEmail: localStorage.getItem("spark_authorEmail") || "user@spark.local",
    branch: localStorage.getItem("spark_branch") || "main",
    subfolder: localStorage.getItem("spark_subfolder") || "",
    repoName: localStorage.getItem("spark_repoName") || "",
    repoOwner: localStorage.getItem("spark_repoOwner") || "",
  };
}

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<SyncSettings>(getSyncSettings());
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [folders, setFolders] = useState<GithubContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getSyncSettings());
      setStep(1);
      setError(null);
      setSaved(false);
    }
  }, [isOpen]);

  const handleFetchRepos = async () => {
    if (!settings.pat) {
      setError("Please enter a GitHub Personal Access Token");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserRepos(settings.pat);
      setRepos(data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRepo = (repo: GithubRepo) => {
    setSettings(prev => ({
      ...prev,
      repoOwner: repo.owner.login,
      repoName: repo.name,
      remoteUrl: `https://github.com/${repo.full_name}.git`,
      branch: repo.default_branch
    }));
    handleFetchFolders(repo.owner.login, repo.name, repo.default_branch);
  };

  const handleFetchFolders = async (owner: string, repo: string, branch: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRepoFolders(settings.pat, owner, repo, "", branch);
      setFolders(data);
      setStep(3);
    } catch (err: any) {
      setFolders([]);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("spark_remoteUrl", settings.remoteUrl);
    localStorage.setItem("spark_pat", settings.pat);
    localStorage.setItem("spark_authorName", settings.authorName);
    localStorage.setItem("spark_authorEmail", settings.authorEmail);
    localStorage.setItem("spark_branch", settings.branch);
    localStorage.setItem("spark_subfolder", settings.subfolder);
    localStorage.setItem("spark_repoName", settings.repoName || "");
    localStorage.setItem("spark_repoOwner", settings.repoOwner || "");
    setSaved(true);
    if (onSave) onSave();
    setTimeout(() => onClose(), 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] relative z-10 transition-colors"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Github size={24} className="text-blue-500" />
                  Configuração de Sync
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1 uppercase tracking-widest font-semibold">
                  Passo {step} de 3: {step === 1 ? "Autenticação" : step === 2 ? "Selecionar Repositório" : "Configuração"}
                </p>
              </div>
              <button onClick={onClose} className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-neutral-900">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm flex items-start gap-3"
                >
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Personal Access Token</label>
                    <input
                      type="password"
                      value={settings.pat}
                      onChange={(e) => setSettings({ ...settings, pat: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:focus:border-blue-500 transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-700"
                    />
                    <p className="text-[11px] text-neutral-500 leading-relaxed">
                      Gere um <a href="https://github.com/settings/tokens" target="_blank" className="text-blue-500 dark:text-blue-400 hover:underline">Classic Token</a> com acesso <code>repo</code> para habilitar a sincronização.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Nome do Autor Git</label>
                        <input
                          type="text"
                          value={settings.authorName}
                          onChange={(e) => setSettings({ ...settings, authorName: e.target.value })}
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Email do Autor</label>
                        <input
                          type="text"
                          value={settings.authorEmail}
                          onChange={(e) => setSettings({ ...settings, authorEmail: e.target.value })}
                          className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Escolha o Repositório</label>
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-600 font-mono">{repos.length} encontrados</span>
                  </div>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {repos.map((repo) => (
                      <button
                        key={repo.id}
                        onClick={() => handleSelectRepo(repo)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                          settings.repoName === repo.name 
                          ? "bg-blue-500/10 border-blue-500 dark:border-blue-500/50 ring-1 ring-blue-500/50" 
                          : "bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${settings.repoName === repo.name ? "bg-blue-500/20" : "bg-white dark:bg-neutral-900 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-neutral-800"}`}>
                              <Github size={18} className={settings.repoName === repo.name ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"} />
                          </div>
                          <div>
                              <p className={`text-sm font-semibold ${settings.repoName === repo.name ? "text-blue-600 dark:text-blue-400" : "text-neutral-900 dark:text-neutral-200"}`}>{repo.name}</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-600">{repo.owner.login}</p>
                          </div>
                        </div>
                        {settings.repoName === repo.name && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest ml-1">Pasta das Notas</label>
                    <div className="space-y-2">
                      <button
                        onClick={() => setSettings({ ...settings, subfolder: "" })}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                          settings.subfolder === "" 
                          ? "bg-blue-500/10 border-blue-500 dark:border-blue-500/50 ring-1 ring-blue-500/50" 
                          : "bg-neutral-50 dark:bg-neutral-950/50 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800/30"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${settings.subfolder === "" ? "bg-blue-500/20" : "bg-white dark:bg-neutral-900 shadow-sm border border-neutral-200 dark:border-neutral-800"}`}>
                          <Folder size={18} className={settings.subfolder === "" ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"} />
                        </div>
                        <div>
                          <span className={`text-sm font-semibold block ${settings.subfolder === "" ? "text-blue-600 dark:text-blue-400" : "text-neutral-900 dark:text-neutral-200"}`}>Raiz do Repositório</span>
                          <span className="text-[10px] text-neutral-500 dark:text-neutral-600 italic font-medium">Sincroniza todos os arquivos .md</span>
                        </div>
                        {settings.subfolder === "" && <Check size={18} className="ml-auto text-blue-600 dark:text-blue-400" />}
                      </button>
                      
                      {folders.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <p className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-600 tracking-tighter ml-1 font-bold">Subdiretórios</p>
                          <div className="grid grid-cols-1 gap-2">
                            {folders.map(folder => (
                              <button
                                key={folder.path}
                                onClick={() => setSettings({ ...settings, subfolder: folder.path })}
                                className={`w-full text-left p-3 px-4 rounded-xl border transition-all flex items-center gap-4 ${
                                  settings.subfolder === folder.path 
                                  ? "bg-blue-500/10 border-blue-500 dark:border-blue-500/50 ring-1 ring-blue-500/50" 
                                  : "bg-neutral-50 dark:bg-neutral-950/30 border-neutral-200/60 dark:border-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/20 hover:border-neutral-300 dark:hover:border-neutral-700"
                                }`}
                              >
                                <Folder size={16} className={settings.subfolder === folder.path ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"} />
                                <span className={`text-sm ${settings.subfolder === folder.path ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-neutral-700 dark:text-neutral-300"}`}>{folder.name}</span>
                                {settings.subfolder === folder.path && <Check size={16} className="ml-auto text-blue-600 dark:text-blue-400" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800/50">
                    <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500 mb-3 ml-1 font-bold">
                        <GitBranch size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Branch Alvo</span>
                    </div>
                    <input
                      type="text"
                      value={settings.branch}
                      onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                      placeholder="main"
                      className="w-full bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-blue-500 transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex items-center justify-between transition-colors">
              <div>
                {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="px-5 py-2.5 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-2 transition-all hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl"
                  >
                    <ChevronLeft size={18} /> Voltar
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-bold text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-300 transition-all"
                >
                  Cancelar
                </button>
                
                {step < 3 ? (
                  <button
                    onClick={handleFetchRepos}
                    disabled={loading || (step === 1 && !settings.pat)}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20 dark:shadow-blue-900/40"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <>Próximo <ChevronRight size={18} /></>}
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 shadow-xl ${
                      saved ? "bg-green-600 text-white shadow-green-500/20 dark:shadow-green-900/40" : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 dark:shadow-blue-900/40"
                    }`}
                  >
                    {saved ? <><Check size={18} /> Pronto</> : "Finalizar Setup"}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
