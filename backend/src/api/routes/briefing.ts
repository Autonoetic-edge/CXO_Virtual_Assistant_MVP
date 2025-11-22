import { Router } from 'express';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Placeholder routes
router.get('/', (req, res) => {
  res.json({ message: 'Briefing routes' });
});

export default router;
