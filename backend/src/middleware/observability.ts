import { NextFunction, Request, Response } from 'express';

export const metrics = {
  requestsTotal: 0,
  analyzeRequestsTotal: 0,
  analyzeErrorsTotal: 0
};

export const resetMetricsForTests = () => {
  metrics.requestsTotal = 0;
  metrics.analyzeRequestsTotal = 0;
  metrics.analyzeErrorsTotal = 0;
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  metrics.requestsTotal += 1;
  if (req.method === 'POST' && req.originalUrl.startsWith('/api/analyze')) {
    metrics.analyzeRequestsTotal += 1;
  }

  res.on('finish', () => {
    if (req.method === 'POST' && req.originalUrl.startsWith('/api/analyze') && res.statusCode >= 500) {
      metrics.analyzeErrorsTotal += 1;
    }

    const durationMs = Date.now() - startedAt;
    console.log(
      `[scout] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
};
