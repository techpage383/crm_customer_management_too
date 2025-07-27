import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAuthUrl,
  handleCallback,
  syncMessages,
  getCustomerMessages,
} from '../controllers/gmailController';

const router = Router();

router.use(authenticateToken);

router.get('/auth', getAuthUrl);
router.get('/callback', handleCallback);
router.post('/sync', syncMessages);
router.get('/customers/:customerId/messages', getCustomerMessages);

export default router;