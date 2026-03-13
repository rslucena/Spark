import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface SyncSettings {
  remoteUrl: string;
  pat: string;
  authorName: string;
  authorEmail: string;
}

export function getSyncSettings(): SyncSettings {
  return {
    remoteUrl: localStorage.getItem("spark_remoteUrl") || "",
    pat: localStorage.getItem("spark_pat") || "",
    authorName: localStorage.getItem("spark_authorName") || "Spark User",
    authorEmail: localStorage.getItem("spark_authorEmail") || "user@spark.local",
  };
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<SyncSettings>(getSyncSettings());
  const [saved, setSaved] = useState(false);

  // Load settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(getSyncSettings());
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("spark_remoteUrl", settings.remoteUrl);
    localStorage.setItem("spark_pat", settings.pat);
    localStorage.setItem("spark_authorName", settings.authorName);
    localStorage.setItem("spark_authorEmail", settings.authorEmail);
    setSaved(true);
    setTimeout(() => onClose(), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-100">Sync Settings</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Author Name
            </label>
            <input
              type="text"
              name="authorName"
              value={settings.authorName}
              onChange={handleChange}
              placeholder="e.g. Jane Doe"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Author Email
            </label>
            <input
              type="email"
              name="authorEmail"
              value={settings.authorEmail}
              onChange={handleChange}
              placeholder="e.g. jane@example.com"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Git Remote URL
            </label>
            <input
              type="text"
              name="remoteUrl"
              value={settings.remoteUrl}
              onChange={handleChange}
              placeholder="https://github.com/user/repo.git"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              Personal Access Token (PAT)
            </label>
            <input
              type="password"
              name="pat"
              value={settings.pat}
              onChange={handleChange}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Used for HTTPS authentication when pushing/pulling.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end items-center gap-3">
          {saved && <span className="text-sm text-green-500">Settings saved!</span>}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
