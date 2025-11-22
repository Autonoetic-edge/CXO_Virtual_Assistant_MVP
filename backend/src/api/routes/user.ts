import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Placeholder routes (will implement controllers later)
router.get('/', (req, res) => {
  res.json({ message: 'User routes' });
});

export default router;
