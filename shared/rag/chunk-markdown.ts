import { tokenizeText } from './scoring';
import type { KnowledgeChunk } from './types';

const normalizeTitle = (line: string) => line.replace(/^#+\s*/, '').trim();

export const chunkMarkdownDocument = (sourceFile: string, markdown: string): KnowledgeChunk[] => {
  const sections = markdown
    .split(/\n(?=##\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);

  if (sections.length === 0) {
    return [];
  }

  return sections.map((section, index) => {
    const lines = section.split('\n');
    const titleLine = lines[0].startsWith('#') ? lines[0] : `Section ${index + 1}`;
    const title = normalizeTitle(titleLine);
    const content = section.replace(/^#+\s+.*\n?/, '').trim();
    const body = `${title}\n${content}`;

    return {
      id: `${sourceFile}#${index + 1}`,
      title,
      content: body,
      sourceFile,
      tokens: tokenizeText(body)
    };
  });
};
