import { retrieveKnowledgeChunks, type KnowledgeRetrievalResult } from '../../../../shared/rag';
import { getRagTopK, isRagEnabled, loadKnowledgeChunks } from './knowledge-store.service';

export const buildFindingRetrievalQuery = (
  finding: Record<string, unknown>,
  extraText = ''
): string => {
  const owasp = finding.owasp as { id?: string; name?: string } | undefined;
  const parts = [
    typeof finding.category === 'string' ? finding.category : '',
    typeof finding.description === 'string' ? finding.description : '',
    typeof finding.risk === 'string' ? finding.risk : '',
    owasp?.id,
    owasp?.name,
    extraText
  ];

  return parts.filter(Boolean).join(' ').trim();
};

export const buildFindingsRetrievalQuery = (
  findings: Array<{ category?: string; description?: string; severity?: string }>
): string =>
  findings
    .slice(0, 8)
    .map((finding) => [finding.severity, finding.category, finding.description].filter(Boolean).join(' '))
    .join(' ');

export const retrieveKnowledgeContext = async (
  query: string
): Promise<KnowledgeRetrievalResult> => {
  if (!isRagEnabled() || !query.trim()) {
    return { query, sources: [], contextText: '' };
  }

  const chunks = await loadKnowledgeChunks();
  if (chunks.length === 0) {
    return { query, sources: [], contextText: '' };
  }

  return retrieveKnowledgeChunks(query, chunks, { limit: getRagTopK(), minScore: 1 });
};

export const retrieveKnowledgeForFinding = async (
  finding: Record<string, unknown>,
  message = ''
) => retrieveKnowledgeContext(buildFindingRetrievalQuery(finding, message));
