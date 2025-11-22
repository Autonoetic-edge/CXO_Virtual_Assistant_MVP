import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// Signup
router.post(
  '/signup',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('first_name').notEmpty().trim(),
    body('last_name').notEmpty().trim(),
    body('timezone').optional().isString(),
    body('language').optional().isString(),
  ]),
  (req, res, next) => AuthController.signup(req, res).catch(next)
);

// Login
router.post(
  '/login',
  validate([body('email').isEmail().normalizeEmail()]),
  (req, res, next) => AuthController.login(req, res).catch(next)
);

// Refresh token
router.post(
  '/refresh',
  validate([body('refreshToken').notEmpty()]),
  (req, res, next) => AuthController.refreshToken(req, res).catch(next)
);

// Get current user
router.get('/me', authenticate, (req, res, next) => AuthController.getCurrentUser(req, res).catch(next));

export default router;
