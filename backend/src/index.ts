import dotenv from 'dotenv';
import express from 'express';
import analyzeRouter from './routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());
app.use('/api', analyzeRouter);

app.get('/', (_req, res) => {
  res.send({ status: 'ok', service: 'scout-backend' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
