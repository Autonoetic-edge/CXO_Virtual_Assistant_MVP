import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import config from './config';
import { testConnection } from './config/database';
import redis from './config/redis';
import logger from './utils/logger';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './api/routes/auth';
import userRoutes from './api/routes/user';
import calendarRoutes from './api/routes/calendar';
import eventRoutes from './api/routes/event';
import meetingRoutes from './api/routes/meeting';
import queryRoutes from './api/routes/query';
import briefingRoutes from './api/routes/briefing';
import schedulingRoutes from './api/routes/scheduling';
import onboardingRoutes from './api/routes/onboarding';
import memoryRoutes from './api/routes/memory';
import reminderRoutes from './api/routes/reminder';
import taskRoutes from './api/routes/task';
import integrationRoutes from './api/routes/integration';
import workflowRoutes from './api/routes/workflow';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.frontend.webAppUrl,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/calendars', calendarRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/queries', queryRoutes);
app.use('/api/v1/briefings', briefingRoutes);
app.use('/api/v1/scheduling', schedulingRoutes);
app.use('/api/v1/onboarding', onboardingRoutes);
app.use('/api/v1/memories', memoryRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/workflows', workflowRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Test Redis connection
    await redis.ping();

    // Start listening
    app.listen(config.app.port, () => {
      logger.info(`🚀 Server running on port ${config.app.port}`);
      logger.info(`📝 Environment: ${config.app.env}`);
      logger.info(`🌍 API Base URL: ${config.app.apiBaseUrl}`);
      logger.info(`🎯 Frontend URL: ${config.frontend.webAppUrl}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
