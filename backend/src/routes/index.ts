import { Router } from 'express';
import { analyzeController, analyzeLocalController, analyzePullRequestController } from '../controllers/analyze.controller';
import { chatController } from '../controllers/chat.controller';
import { searchKnowledgeController } from '../controllers/knowledge.controller';
import { executiveReportController, getSharedReportController, shareReportController } from '../controllers/report.controller';

const router = Router();

router.post('/analyze', analyzeController);
router.post('/analyze/local', analyzeLocalController);
router.post('/analyze/pr', analyzePullRequestController);
router.post('/chat', chatController);
router.get('/knowledge/search', searchKnowledgeController);
router.post('/reports/executive', executiveReportController);
router.post('/reports/share', shareReportController);
router.get('/reports/shared/:token', getSharedReportController);

export default router;
