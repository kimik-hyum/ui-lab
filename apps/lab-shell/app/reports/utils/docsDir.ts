import { promises as fs } from "fs";
import path from "path";

export async function resolveDocsDir() {
  const candidates = [
    path.join(process.cwd(), "docs"),
    path.resolve(process.cwd(), "../../docs"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next candidate path.
    }
  }

  return null;
}
