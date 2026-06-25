export const getProjectNameFromRepoUrl = (repoUrl: string): string => {
  try {
    const url = new URL(repoUrl);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }

    if (parts.length === 1) {
      return parts[0];
    }

    return repoUrl;
  } catch {
    return repoUrl;
  }
};
