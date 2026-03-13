import { SyncSettings } from "../components/SettingsModal";

/**
 * Resolves a URL or relative path into an internal Spark path (starts with local/ or remote/).
 * Returns null if the link is external.
 */
export function resolveInternalLink(
  url: string,
  activeFilePath: string | null,
  settings: SyncSettings
): string | null {
  if (!url) return null;

  const normalizedUrl = url.trim();

  // 1. Check if it's a full GitHub Pages URL matching the project
  if (normalizedUrl.startsWith("http")) {
    let owner = settings.repoOwner;
    let repo = settings.repoName;

    // Fallback if owner/repo not explicitly in settings but in remoteUrl
    if (!owner || !repo) {
      const remoteUrl = settings.remoteUrl || "";
      if (remoteUrl.includes("github.com")) {
        const pathPart = remoteUrl.split("github.com/")[1] || remoteUrl.split("github.com:")[1];
        if (pathPart) {
          const parts = pathPart.replace(".git", "").split("/");
          owner = owner || parts[0];
          repo = repo || parts[1];
        }
      }
    }

    if (owner && repo) {
      const ghPagesBase = `https://${owner.toLowerCase()}.github.io/${repo.toLowerCase()}`;
      const checkUrl = normalizedUrl.toLowerCase();
      
      if (checkUrl.startsWith(ghPagesBase)) {
        let relPath = normalizedUrl.substring(ghPagesBase.length);
        if (relPath.startsWith("/")) relPath = relPath.substring(1);
        
        if (!relPath || relPath === "/") relPath = "readme.md";
        if (relPath.endsWith("/")) relPath = relPath.slice(0, -1);
        if (relPath.endsWith(".html")) relPath = relPath.replace(".html", ".md");
        if (!relPath.endsWith(".md") && !relPath.includes(".")) relPath += ".md";

        // Handle subfolder if project is synced from a subfolder
        const subfolder = settings.subfolder || "";
        const cleanSubfolder = subfolder.startsWith("/") ? subfolder.substring(1) : subfolder;
        
        let finalPath = relPath;
        if (cleanSubfolder && !relPath.startsWith(cleanSubfolder)) {
          finalPath = `${cleanSubfolder}/${relPath}`;
        }

        return `remote/${finalPath}`;
      }
    }
    
    return null;
  }

  // 2. Handle project-relative paths (starting with /)
  if (normalizedUrl.startsWith("/")) {
    let relPath = normalizedUrl.substring(1);
    if (!relPath) relPath = "readme.md";
    if (relPath.endsWith(".html")) relPath = relPath.replace(".html", ".md");
    if (!relPath.endsWith(".md") && !relPath.includes(".")) relPath += ".md";

    const subfolder = settings.subfolder || "";
    const cleanSubfolder = subfolder.startsWith("/") ? subfolder.substring(1) : subfolder;
    
    let finalPath = relPath;
    if (cleanSubfolder && !relPath.startsWith(cleanSubfolder)) {
      finalPath = `${cleanSubfolder}/${relPath}`;
    }

    return `remote/${finalPath}`;
  }

  // 3. Handle relative paths (./ or ../ or direct filename)
  if (!activeFilePath) return null;

  const isRemote = activeFilePath.startsWith("remote/");
  const basePrefix = isRemote ? "remote/" : "local/";
  
  const pathParts = activeFilePath.replace(basePrefix, "").split("/");
  pathParts.pop(); // remove current filename

  let targetParts = [...pathParts];
  const linkParts = normalizedUrl.split("/");

  for (const part of linkParts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      targetParts.pop();
    } else {
      targetParts.push(part);
    }
  }

  let resolvedPath = targetParts.join("/");
  
  if (resolvedPath.endsWith(".html")) resolvedPath = resolvedPath.replace(".html", ".md");
  if (!resolvedPath.endsWith(".md") && !resolvedPath.includes(".")) {
    resolvedPath += ".md";
  }

  return `${basePrefix}${resolvedPath}`;
}
