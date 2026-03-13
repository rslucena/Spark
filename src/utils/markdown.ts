export interface FileMetadata {
  title: string;
  description: string;
  lastModified?: string;
  author?: string;
}

export function parseFrontmatter(content: string): { metadata: FileMetadata; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return {
      metadata: { title: "", description: "" },
      body: content,
    };
  }

  const rawYaml = match[1];
  const metadata: FileMetadata = { title: "", description: "" };
  
  const lines = rawYaml.split("\n");
  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      const value = valueParts.join(":").trim();
      if (key.trim() === "title") metadata.title = value;
      if (key.trim() === "description") metadata.description = value;
    }
  }

  const body = content.replace(frontmatterRegex, "");
  return { metadata, body };
}

export function stringifyWithFrontmatter(metadata: FileMetadata, body: string): string {
  if (!metadata.title && !metadata.description) return body;

  let frontmatter = "---\n";
  if (metadata.title) frontmatter += `title: ${metadata.title}\n`;
  if (metadata.description) frontmatter += `description: ${metadata.description}\n`;
  frontmatter += "---\n";

  return frontmatter + body;
}
