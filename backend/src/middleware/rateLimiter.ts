import rateLimit from 'express-rate-limit';
import config from '../config';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Calendar sync rate limiter
export const calendarSyncLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 syncs per hour
  message: 'Too many calendar sync requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Query rate limiter
export const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 queries per minute
  message: 'Too many query requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
