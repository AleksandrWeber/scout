import { Request, Response } from 'express';
import { retrieveKnowledgeContext } from '../services/rag/knowledge-retrieval.service';
import { isRagEnabled } from '../services/rag/knowledge-store.service';

export const searchKnowledgeController = async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!query) {
    return res.status(400).json({ error: 'q query parameter is required' });
  }

  if (!isRagEnabled()) {
    return res.status(403).json({
      error: 'Knowledge retrieval is disabled',
      hint: 'Set SCOUT_RAG_ENABLED=true to enable RAG.'
    });
  }

  try {
    const result = await retrieveKnowledgeContext(query);
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to search knowledge base' });
  }
};
