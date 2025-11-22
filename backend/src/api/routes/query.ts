import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { queryLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(queryLimiter);

// Placeholder routes
router.post('/ask', (req, res) => {
  res.json({ message: 'Query routes' });
});

export default router;
