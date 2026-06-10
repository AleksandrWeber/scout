export type RetryOptions = {
  maxAttempts?: number;
  delayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const defaultShouldRetry = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const axiosError = error as {
    code?: string;
    response?: { status?: number };
  };

  if (axiosError.code === 'ECONNRESET' || axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ENOTFOUND') {
    return true;
  }

  const status = axiosError.response?.status;
  return status === 429 || status === 502 || status === 503 || status === 504;
};

export const retryAsync = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? 500;
  const shouldRetry = options.shouldRetry ?? defaultShouldRetry;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !shouldRetry(error, attempt)) {
        throw error;
      }

      const backoff = delayMs * attempt;
      await sleep(backoff);
    }
  }

  throw lastError;
};
