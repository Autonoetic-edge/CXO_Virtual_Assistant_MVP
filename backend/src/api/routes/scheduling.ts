import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Placeholder routes
router.post('/optimize', (req, res) => {
  res.json({ message: 'Scheduling routes' });
});

export default router;
