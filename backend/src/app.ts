import dotenv from 'dotenv';
import express from 'express';
import analyzeRouter from './routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api', analyzeRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', service: 'scout-backend' });
});

export default app;
