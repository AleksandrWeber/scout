import { Router } from 'express';
import { analyzeController } from '../controllers/analyze.controller';
import { chatController } from '../controllers/chat.controller';
import { executiveReportController } from '../controllers/report.controller';

const router = Router();

router.post('/analyze', analyzeController);
router.post('/chat', chatController);
router.post('/reports/executive', executiveReportController);

export default router;
