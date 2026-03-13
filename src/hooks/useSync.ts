import { useState, useCallback } from "react";
import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { join } from "@tauri-apps/api/path";
import { getSyncSettings } from "../components/SettingsModal";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export function useSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const [isSyncingOverlay, setIsSyncingOverlay] = useState(false);

  const performSync = useCallback(async (options: { 
    showOverlay?: boolean, 
    vaultPath: string,
    commitMessage?: string,
    commitDescription?: string,
    onSuccess?: () => void
  }) => {
    const { showOverlay, vaultPath, commitMessage, commitDescription, onSuccess } = options;
    
    if (!vaultPath) return;

    const remoteFolder = await join(vaultPath, "remote");
    const config = getSyncSettings();
    const branch = config.branch || "main";
    
    if (showOverlay) setIsSyncingOverlay(true);
    setSyncStatus("syncing");
    setSyncMessage("Iniciando...");
    
    const startTime = Date.now();

    try {
      const syncParams = {
        repoPath: remoteFolder,
        remoteUrl: config.remoteUrl,
        pat: config.pat,
        branch: branch,
        subfolder: config.subfolder || ""
      };

      // 1. Pull changes
      if (config.remoteUrl && config.pat) {
        setSyncMessage("Buscando atualizações...");
        try {
          await tauriInvoke("git_pull", syncParams);
        } catch (pullErr: any) {
          const errMsg = pullErr.message || pullErr.toString();
          if (errMsg.includes("Conflicts detected")) {
            setSyncMessage("Resolvendo conflitos...");
            await tauriInvoke("git_hard_reset", syncParams);
          } else {
            throw new Error(`Pull falhou: ${errMsg}`);
          }
        }
      }

      // 2. Commit if message provided OR if we check status and it's dirty
      if (commitMessage) {
        setSyncMessage("Salvando mudanças...");
        const fullMessage = commitDescription 
          ? `${commitMessage}\n\n${commitDescription}` 
          : commitMessage;

        await tauriInvoke("git_commit", {
          repoPath: remoteFolder,
          message: fullMessage,
          authorName: config.authorName || "Spark User",
          authorEmail: config.authorEmail || "user@spark.local",
          branch: branch
        });
      }

      // 3. Push
      if (config.remoteUrl && config.pat) {
        setSyncMessage("Enviando para o GitHub...");
        await tauriInvoke("git_push", syncParams);
        setSyncStatus("success");
        setSyncMessage("Sincronizado!");
      } else {
        setSyncStatus("success");
        setSyncMessage("Salvo localmente");
      }

      if (onSuccess) onSuccess();

    } catch (err: any) {
      console.error("Sync error:", err);
      setSyncStatus("error");
      setSyncMessage(err.message || err.toString());
    } finally {
      if (showOverlay) {
        const duration = Date.now() - startTime;
        if (duration < 2000) {
          await new Promise(r => setTimeout(r, 2000 - duration));
        }
        setIsSyncingOverlay(false);
      }

      setTimeout(() => {
        setSyncStatus("idle");
        setSyncMessage("");
      }, 4000);
    }
  }, []);

  return { performSync, syncStatus, syncMessage, isSyncingOverlay };
}
