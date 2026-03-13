/**
 * GitHub API utilities for the Spark setup wizard.
 */

export interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  default_branch: string;
}

export interface GithubContent {
  name: string;
  path: string;
  type: "dir" | "file";
}

/**
 * Fetch repositories for the authenticated user.
 */
export async function fetchUserRepos(pat: string): Promise<GithubRepo[]> {
  const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch folders in a repository.
 */
export async function fetchRepoFolders(
  pat: string,
  owner: string,
  repo: string,
  path: string = "",
  branch: string = "main"
): Promise<GithubContent[]> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch folders: ${response.statusText}`);
  }

  const contents: GithubContent[] = await response.json();
  return contents.filter((item) => item.type === "dir");
}
