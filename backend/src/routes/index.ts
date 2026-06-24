import { Router } from 'express';
import { analyzeController } from '../controllers/analyze.controller';
import { chatController } from '../controllers/chat.controller';

const router = Router();

router.post('/analyze', analyzeController);
router.post('/chat', chatController);

export default router;
