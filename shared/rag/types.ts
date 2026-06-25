export type KnowledgeChunk = {
  id: string;
  title: string;
  content: string;
  sourceFile: string;
  tokens: string[];
};

export type KnowledgeSourceRef = {
  id: string;
  title: string;
  sourceFile: string;
  score: number;
};

export type KnowledgeRetrievalResult = {
  query: string;
  sources: KnowledgeSourceRef[];
  contextText: string;
};
