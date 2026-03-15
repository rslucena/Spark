import { useState, useEffect } from "react";
import { X, Check, Loader2, GitCommit, Settings2, Github, ChevronRight, ChevronLeft, Folder, GitBranch } from "lucide-react";
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

// Mock sync history entries for the log panel
const MOCK_HISTORY = [
  { id: 1, type: "push", message: "Pushed 3 notes to main", time: "2m ago", success: true },
  { id: 2, type: "pull", message: "Pulled 1 note from remote", time: "1h ago", success: true },
  { id: 3, type: "error", message: "Merge conflict in index.md", time: "2d ago", success: false },
  { id: 4, type: "push", message: "Initial commit", time: "1w ago", success: true },
];

export function SettingsModal({ isOpen, onClose, onSave }: SettingsModalProps) {
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<SyncSettings>(getSyncSettings());
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [folders, setFolders] = useState<GithubContent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showLog, setShowLog] = useState(false);

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
    setLoading(true);
    localStorage.setItem("spark_remoteUrl", settings.remoteUrl);
    localStorage.setItem("spark_pat", settings.pat);
    localStorage.setItem("spark_authorName", settings.authorName);
    localStorage.setItem("spark_authorEmail", settings.authorEmail);
    localStorage.setItem("spark_branch", settings.branch);
    localStorage.setItem("spark_subfolder", settings.subfolder);
    localStorage.setItem("spark_repoName", settings.repoName || "");
    localStorage.setItem("spark_repoOwner", settings.repoOwner || "");

    setSaved(true);
    setLoading(false);

    setTimeout(() => {
      onSave?.();
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative flex w-full max-w-5xl max-h-[85vh] h-[600px] bg-[#111111] border border-[#222222] rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-white transition-colors z-20 bg-[#111111] rounded-full hover:bg-[#222222]"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {/* Left Column: Ultra-Minimalist Configuration */}
          <div className="flex-1 flex flex-col items-center justify-center px-12 relative overflow-hidden">
            <div className="w-full max-w-md flex flex-col items-center max-h-full py-8 custom-scrollbar">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center shrink-0"
              >
                <div className="w-12 h-12 bg-[#1A1A1A] border border-[#222222] rounded-full flex items-center justify-center mx-auto mb-6">
                   <Github size={24} className="text-white" strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-light text-white font-[Outfit] tracking-tight">GitHub Sync</h2>
              </motion.div>

              <div className="w-full space-y-8 flex-1 overflow-y-auto px-2">
                {error && (
                  <div className="text-red-400 text-sm font-sans text-center mb-4">{error}</div>
                )}

                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                    <div className="relative">
                      <input
                        type="text"
                        value={settings.authorName}
                        onChange={(e) => setSettings({ ...settings, authorName: e.target.value })}
                        placeholder="Git Author Name"
                        className="w-full bg-transparent border-b border-[#222222] px-0 py-4 text-center text-lg text-white focus:outline-none focus:border-neutral-500 transition-colors font-sans placeholder:text-neutral-700 placeholder:font-light tracking-widest"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        value={settings.authorEmail}
                        onChange={(e) => setSettings({ ...settings, authorEmail: e.target.value })}
                        placeholder="Git Author Email"
                        className="w-full bg-transparent border-b border-[#222222] px-0 py-4 text-center text-lg text-white focus:outline-none focus:border-neutral-500 transition-colors font-sans placeholder:text-neutral-700 placeholder:font-light tracking-widest"
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.pat}
                        onChange={(e) => setSettings({ ...settings, pat: e.target.value })}
                        placeholder="Personal Access Token"
                        className="w-full bg-transparent border-b border-[#222222] px-0 py-4 text-center text-lg text-white focus:outline-none focus:border-neutral-500 transition-colors font-sans placeholder:text-neutral-700 placeholder:font-light tracking-widest"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                    <p className="text-neutral-500 text-sm text-center mb-6">Select Repository</p>
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                      {repos.map((repo) => (
                        <button
                          key={repo.id}
                          onClick={() => handleSelectRepo(repo)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            settings.repoName === repo.name
                            ? "border-neutral-500 bg-[#1A1A1A]"
                            : "border-[#222222] hover:border-neutral-700 bg-transparent hover:bg-[#141414]"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div>
                                <p className={`text-sm font-light ${settings.repoName === repo.name ? "text-white" : "text-neutral-300"}`}>{repo.name}</p>
                                <p className="text-xs text-neutral-600">{repo.owner.login}</p>
                            </div>
                          </div>
                          {settings.repoName === repo.name && <Check size={18} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                     <div className="space-y-4">
                      <p className="text-neutral-500 text-sm text-center mb-4">Target Folder & Branch</p>

                      <button
                        onClick={() => setSettings({ ...settings, subfolder: "" })}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4 ${
                          settings.subfolder === "" 
                          ? "border-neutral-500 bg-[#1A1A1A]"
                          : "border-[#222222] hover:border-neutral-700 bg-transparent hover:bg-[#141414]"
                        }`}
                      >
                        <Folder size={18} className={settings.subfolder === "" ? "text-white" : "text-neutral-600"} />
                        <div>
                          <span className={`text-sm font-light block ${settings.subfolder === "" ? "text-white" : "text-neutral-300"}`}>Repository Root</span>
                        </div>
                        {settings.subfolder === "" && <Check size={18} className="ml-auto text-white" />}
                      </button>
                      
                      {folders.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-[10px] uppercase text-neutral-600 tracking-widest ml-1">Subfolders</p>
                          <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                            {folders.map(folder => (
                              <button
                                key={folder.path}
                                onClick={() => setSettings({ ...settings, subfolder: folder.path })}
                                className={`w-full text-left p-3 px-4 rounded-xl border transition-all flex items-center gap-4 ${
                                  settings.subfolder === folder.path 
                                  ? "border-neutral-500 bg-[#1A1A1A]"
                                  : "border-[#222222] hover:border-neutral-700 bg-transparent hover:bg-[#141414]"
                                }`}
                              >
                                <Folder size={16} className={settings.subfolder === folder.path ? "text-white" : "text-neutral-600"} />
                                <span className={`text-sm font-light ${settings.subfolder === folder.path ? "text-white" : "text-neutral-400"}`}>{folder.name}</span>
                                {settings.subfolder === folder.path && <Check size={16} className="ml-auto text-white" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#222222]">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <GitBranch size={14} className="text-neutral-600"/>
                        <span className="text-xs text-neutral-500">Target Branch</span>
                      </div>
                      <input
                        type="text"
                        value={settings.branch}
                        onChange={(e) => setSettings({ ...settings, branch: e.target.value })}
                        placeholder="main"
                        className="w-full bg-transparent border-b border-[#222222] px-0 py-3 text-center text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors font-sans placeholder:text-neutral-700"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-8 w-full shrink-0 flex items-center justify-between"
              >
                 {step > 1 && (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="p-3 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-[#1A1A1A]"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="flex-1 px-4">
                    {step < 3 ? (
                        <button
                            onClick={handleFetchRepos}
                            disabled={loading || (step === 1 && !settings.pat)}
                            className="w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300 bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:hover:bg-white"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Next <ChevronRight size={16} /></>}
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            disabled={loading || saved}
                            className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 text-sm font-medium transition-all duration-300 ${
                            saved
                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                : "bg-white text-black hover:bg-neutral-200"
                            }`}
                        >
                            {loading ? (
                            <Loader2 size={18} className="animate-spin" />
                            ) : saved ? (
                            <>
                                <Check size={18} strokeWidth={2} /> Configured
                            </>
                            ) : (
                            "Sync Knowledge Base"
                            )}
                        </button>
                    )}
                </div>
                 {step > 1 && <div className="w-11" /> /* Spacer to keep button centered */}
              </motion.div>

              <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="mt-8 shrink-0 flex items-center justify-center gap-2 text-xs text-neutral-600 font-sans"
              >
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500/50"></span>
                 Last synced 5 hours ago
              </motion.div>
            </div>

            {/* Toggle Log Button - positioned bottom right of the left column */}
            <button
                onClick={() => setShowLog(!showLog)}
                className={`absolute bottom-6 right-6 p-2 rounded-lg text-neutral-500 hover:text-white transition-all ${showLog ? 'bg-[#222222] text-white' : 'hover:bg-[#1A1A1A]'}`}
                title="Toggle Sync History"
            >
                <GitCommit size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Right Column: Split-View Log (Collapsible) */}
          <AnimatePresence>
            {showLog && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-l border-[#222222] bg-[#141414] flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-[#222222] flex items-center gap-3">
                  <Settings2 size={16} className="text-neutral-500" />
                  <h3 className="text-sm font-medium text-white font-[Outfit]">Sync History</h3>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {MOCK_HISTORY.map((entry, idx) => (
                    <div key={entry.id} className="relative pl-6">
                      {/* Timeline line */}
                      {idx !== MOCK_HISTORY.length - 1 && (
                        <div className="absolute left-1.5 top-5 bottom-[-24px] w-px bg-[#222222]" />
                      )}

                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-[#141414] flex items-center justify-center ${
                         entry.success ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                         <div className={`w-1 h-1 rounded-full ${entry.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className={`text-sm font-sans ${entry.success ? 'text-neutral-300' : 'text-red-400'}`}>
                          {entry.message}
                        </span>
                        <span className="text-xs text-neutral-600 font-sans">
                          {entry.time} · {entry.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
