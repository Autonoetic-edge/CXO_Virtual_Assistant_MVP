import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { ReminderModel } from '../../models/Reminder';

const router = Router();

// Create a new reminder
router.post(
  '/',
  authenticate,
  validate([
    body('title').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('remind_at').notEmpty().isISO8601(),
    body('remind_before_minutes').optional().isInt({ min: 0 }),
    body('is_recurring').optional().isBoolean(),
    body('recurrence_rule').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('category').optional().isString(),
    body('notification_channels').optional().isArray(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const reminder = await ReminderModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({ data: reminder, message: 'Reminder created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create reminder' });
    }
  }
);

// Get all reminders for user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status, limit, offset } = req.query;

    const reminders = await ReminderModel.findByUserId(userId, {
      status: status as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({ data: reminders, count: reminders.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Get upcoming reminders
router.get('/upcoming', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;

    const reminders = await ReminderModel.getUpcoming(userId, hours);
    res.json({ data: reminders, count: reminders.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming reminders' });
  }
});

// Get due reminders
router.get('/due', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminders = await ReminderModel.getDue(userId);
    res.json({ data: reminders, count: reminders.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch due reminders' });
  }
});

// Get a specific reminder
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = await ReminderModel.findById(req.params.id, userId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ data: reminder });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminder' });
  }
});

// Update a reminder
router.put(
  '/:id',
  authenticate,
  validate([
    body('title').optional().isString().trim(),
    body('description').optional().isString(),
    body('remind_at').optional().isISO8601(),
    body('remind_before_minutes').optional().isInt({ min: 0 }),
    body('is_recurring').optional().isBoolean(),
    body('recurrence_rule').optional().isString(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('category').optional().isString(),
    body('notification_channels').optional().isArray(),
    body('status').optional().isIn(['active', 'snoozed', 'completed', 'cancelled']),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const reminder = await ReminderModel.update(req.params.id, userId, req.body);

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json({ data: reminder, message: 'Reminder updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update reminder' });
    }
  }
);

// Complete a reminder
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = await ReminderModel.complete(req.params.id, userId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ data: reminder, message: 'Reminder completed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete reminder' });
  }
});

// Snooze a reminder
router.post(
  '/:id/snooze',
  authenticate,
  validate([body('snooze_until').notEmpty().isISO8601()]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const reminder = await ReminderModel.snooze(req.params.id, userId, req.body.snooze_until);

      if (!reminder) {
        return res.status(404).json({ error: 'Reminder not found' });
      }

      res.json({ data: reminder, message: 'Reminder snoozed' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to snooze reminder' });
    }
  }
);

// Cancel a reminder
router.post('/:id/cancel', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = await ReminderModel.cancel(req.params.id, userId);

    if (!reminder) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ data: reminder, message: 'Reminder cancelled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel reminder' });
  }
});

// Delete a reminder
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deleted = await ReminderModel.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    res.json({ message: 'Reminder deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;
