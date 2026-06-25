import type { KnowledgeChunk, KnowledgeRetrievalResult, KnowledgeSourceRef } from './types';
import { scoreChunkTokens, tokenizeText } from './scoring';

export const formatKnowledgeContext = (
  chunks: Array<KnowledgeChunk & { score: number }>
): string => {
  if (chunks.length === 0) {
    return '';
  }

  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.title} (${chunk.sourceFile})\n${chunk.content.trim()}`
    )
    .join('\n\n');
};

export const retrieveKnowledgeChunks = (
  query: string,
  chunks: KnowledgeChunk[],
  options: { limit?: number; minScore?: number } = {}
): KnowledgeRetrievalResult => {
  const limit = options.limit ?? 3;
  const minScore = options.minScore ?? 1;
  const queryTokens = tokenizeText(query);

  const ranked = chunks
    .map((chunk) => ({
      chunk,
      score: scoreChunkTokens(queryTokens, chunk.tokens)
    }))
    .filter((entry) => entry.score >= minScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  const sources: KnowledgeSourceRef[] = ranked.map(({ chunk, score }) => ({
    id: chunk.id,
    title: chunk.title,
    sourceFile: chunk.sourceFile,
    score
  }));

  return {
    query,
    sources,
    contextText: formatKnowledgeContext(
      ranked.map(({ chunk, score }) => ({
        ...chunk,
        score
      }))
    )
  };
};
