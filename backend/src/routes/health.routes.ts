import { Router } from 'express';
import { healthController, metricsController, readyController } from '../controllers/health.controller';

const router = Router();

router.get('/', healthController);
router.get('/ready', readyController);
router.get('/metrics', metricsController);

export default router;
