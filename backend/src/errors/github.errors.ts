export class GitHubRepositoryError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
    public readonly hint?: string
  ) {
    super(message);
    this.name = 'GitHubRepositoryError';
  }
}
