const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'your',
  'are',
  'was',
  'were',
  'have',
  'has',
  'had',
  'not',
  'but',
  'you',
  'can',
  'use',
  'using',
  'into',
  'about',
  'when',
  'what',
  'how',
  'why',
  'will',
  'should',
  'also',
  'than',
  'then',
  'they',
  'them',
  'its',
  'our',
  'all',
  'any',
  'one',
  'two'
]);

export const tokenizeText = (text: string): string[] => {
  const matches = text.toLowerCase().match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
  return matches.filter((token) => token.length > 2 && !STOPWORDS.has(token));
};

export const buildTermFrequency = (tokens: string[]): Map<string, number> => {
  const counts = new Map<string, number>();

  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return counts;
};

export const scoreChunkTokens = (queryTokens: string[], chunkTokens: string[]): number => {
  if (queryTokens.length === 0 || chunkTokens.length === 0) {
    return 0;
  }

  const chunkFrequency = buildTermFrequency(chunkTokens);
  let score = 0;

  for (const token of queryTokens) {
    const frequency = chunkFrequency.get(token);
    if (frequency) {
      score += frequency;
    }
  }

  return score;
};
