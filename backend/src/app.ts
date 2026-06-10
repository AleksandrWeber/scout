import dotenv from 'dotenv';
import express from 'express';
import { requestLogger } from './middleware/observability';
import analyzeRouter from './routes';
import healthRouter from './routes/health.routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(requestLogger);
app.use('/health', healthRouter);
app.use('/api', analyzeRouter);

app.get('/', (_req, res) => {
  res.redirect(307, '/health');
});

export default app;
