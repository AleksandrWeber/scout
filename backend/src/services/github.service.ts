import axios from 'axios';

const getArchiveUrls = (repoUrl: string) => {
  const base = repoUrl.replace(/\.git$/, '').replace(/\/+$/, '');
  return [
    `${base}/archive/refs/heads/main.zip`,
    `${base}/archive/refs/heads/master.zip`
  ];
};

export const fetchRepositoryArchive = async (repoUrl: string): Promise<Buffer> => {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const urls = getArchiveUrls(repoUrl);

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        headers
      });
      return Buffer.from(response.data);
    } catch (error) {
      // Try the next branch if the archive is not available.
    }
  }

  throw new Error('Could not download repository archive from GitHub. Check the repo URL and default branch.');
};
