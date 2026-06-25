import path from 'path';
import { chunkMarkdownDocument, retrieveKnowledgeChunks, tokenizeText, type KnowledgeSourceRef } from '../../shared/rag';
import { retrieveKnowledgeContext } from '../src/services/rag/knowledge-retrieval.service';
import { clearKnowledgeCache } from '../src/services/rag/knowledge-store.service';

describe('RAG scoring and chunking', () => {
  it('tokenizes and ranks XSS-related chunks higher for XSS queries', () => {
    const xssChunk = {
      id: 'injection-xss.md#1',
      title: 'Injection and XSS',
      content: 'Cross-site scripting XSS dangerouslySetInnerHTML prevention',
      sourceFile: 'injection-xss.md',
      tokens: tokenizeText('Cross-site scripting XSS dangerouslySetInnerHTML prevention')
    };
    const secretsChunk = {
      id: 'secrets-management.md#1',
      title: 'Secrets',
      content: 'Rotate API keys and avoid committing tokens',
      sourceFile: 'secrets-management.md',
      tokens: tokenizeText('Rotate API keys and avoid committing tokens')
    };

    const result = retrieveKnowledgeChunks('XSS dangerouslySetInnerHTML fix', [xssChunk, secretsChunk], {
      limit: 2
    });

    expect(result.sources[0]?.sourceFile).toBe('injection-xss.md');
  });

  it('chunks markdown by section headings', () => {
    const chunks = chunkMarkdownDocument(
      'sample.md',
      '# Root\n\n## First\n\nBody one.\n\n## Second\n\nBody two.'
    );

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks.map((chunk) => chunk.title)).toEqual(expect.arrayContaining([expect.stringContaining('First')]));
  });
});

describe('knowledge retrieval service', () => {
  beforeEach(() => {
    clearKnowledgeCache();
    process.env.SCOUT_KNOWLEDGE_DIR = path.resolve(__dirname, '../../docs/knowledge');
    process.env.SCOUT_RAG_ENABLED = 'true';
  });

  afterEach(() => {
    clearKnowledgeCache();
    delete process.env.SCOUT_KNOWLEDGE_DIR;
    delete process.env.SCOUT_RAG_ENABLED;
  });

  it('loads bundled knowledge docs and returns relevant sources', async () => {
    const result = await retrieveKnowledgeContext('hardcoded API key secret rotation');

    expect(result.sources.length).toBeGreaterThan(0);
    expect(result.sources.some((source: KnowledgeSourceRef) => source.sourceFile.includes('secrets'))).toBe(true);
    expect(result.contextText).toContain('secrets');
  });
});
