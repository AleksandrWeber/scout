export class LocalProjectError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code = 'LOCAL_PROJECT_ERROR', statusCode = 400) {
    super(message);
    this.name = 'LocalProjectError';
    this.code = code;
    this.statusCode = statusCode;
  }
}
