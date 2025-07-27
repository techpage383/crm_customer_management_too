import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getThreads,
  getThreadById,
  updateThreadStatus,
  getPendingReplies,
} from '../controllers/threadController';

const router = Router();

router.use(authenticateToken);

router.get('/', getThreads);
router.get('/pending', getPendingReplies);
router.get('/:threadId', getThreadById);
router.put('/:threadId', updateThreadStatus);

export default router;