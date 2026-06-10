import { Request, Response } from 'express';
import { metrics } from '../middleware/observability';
import { getHealthStatus, getReadyStatus } from '../services/health.service';

export const healthController = (_req: Request, res: Response) => {
  res.json(getHealthStatus());
};

export const readyController = async (_req: Request, res: Response) => {
  const ready = await getReadyStatus();
  res.status(ready.status === 'ready' ? 200 : 503).json(ready);
};

export const metricsController = (_req: Request, res: Response) => {
  res.json({
    uptimeSeconds: Math.floor(process.uptime()),
    requestsTotal: metrics.requestsTotal,
    analyzeRequestsTotal: metrics.analyzeRequestsTotal,
    analyzeErrorsTotal: metrics.analyzeErrorsTotal,
    timestamp: new Date().toISOString()
  });
};
