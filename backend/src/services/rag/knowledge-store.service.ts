import fs from 'fs/promises';
import path from 'path';
import { chunkMarkdownDocument, type KnowledgeChunk } from '../../../../shared/rag';

let cachedChunks: KnowledgeChunk[] | null = null;
let cachedDir: string | null = null;

export const isRagEnabled = () => process.env.SCOUT_RAG_ENABLED !== 'false';

export const getRagTopK = () => {
  const value = Number(process.env.SCOUT_RAG_TOP_K || 3);
  return Number.isFinite(value) && value > 0 ? value : 3;
};

export const resolveKnowledgeDirectory = async (): Promise<string | null> => {
  const candidates = [
    process.env.SCOUT_KNOWLEDGE_DIR,
    path.resolve(process.cwd(), 'docs/knowledge'),
    path.resolve(process.cwd(), '../docs/knowledge'),
    path.resolve(__dirname, '../../../../docs/knowledge')
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isDirectory()) {
        return candidate;
      }
    } catch {
      // try next candidate
    }
  }

  return null;
};

const loadMarkdownFiles = async (directory: string): Promise<KnowledgeChunk[]> => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const chunks: KnowledgeChunk[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }

    const filePath = path.join(directory, entry.name);
    const markdown = await fs.readFile(filePath, 'utf8');
    chunks.push(...chunkMarkdownDocument(entry.name, markdown));
  }

  return chunks;
};

export const loadKnowledgeChunks = async (): Promise<KnowledgeChunk[]> => {
  const directory = await resolveKnowledgeDirectory();

  if (!directory) {
    return [];
  }

  if (cachedChunks && cachedDir === directory) {
    return cachedChunks;
  }

  cachedChunks = await loadMarkdownFiles(directory);
  cachedDir = directory;
  return cachedChunks;
};

export const clearKnowledgeCache = () => {
  cachedChunks = null;
  cachedDir = null;
};

export const __test__ = {
  clearKnowledgeCache,
  resolveKnowledgeDirectory
};
