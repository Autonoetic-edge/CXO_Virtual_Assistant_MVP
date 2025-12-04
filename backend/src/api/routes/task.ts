import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { TaskModel } from '../../models/Task';

const router = Router();

// Create a new task
router.post(
  '/',
  authenticate,
  validate([
    body('title').notEmpty().isString().trim(),
    body('description').optional().isString(),
    body('list_name').optional().isString(),
    body('parent_task_id').optional().isUUID(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('due_date').optional().isISO8601(),
    body('due_time').optional().matches(/^\d{2}:\d{2}$/),
    body('estimated_duration_minutes').optional().isInt({ min: 1 }),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('is_recurring').optional().isBoolean(),
    body('recurrence_rule').optional().isString(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const task = await TaskModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({ data: task, message: 'Task created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

// Get all tasks for user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { list_name, status, priority, due_before, due_after, category, limit, offset } = req.query;

    const tasks = await TaskModel.findByUserId(userId, {
      list_name: list_name as string,
      status: status as string,
      priority: priority as string,
      due_before: due_before as string,
      due_after: due_after as string,
      category: category as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({ data: tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get task lists
router.get('/lists', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const lists = await TaskModel.getLists(userId);
    res.json({ data: lists });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task lists' });
  }
});

// Get overdue tasks
router.get('/overdue', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tasks = await TaskModel.getOverdue(userId);
    res.json({ data: tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue tasks' });
  }
});

// Get today's tasks
router.get('/today', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tasks = await TaskModel.getDueToday(userId);
    res.json({ data: tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today\'s tasks' });
  }
});

// Get a specific task
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const task = await TaskModel.findById(req.params.id, userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ data: task });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Update a task
router.put(
  '/:id',
  authenticate,
  validate([
    body('title').optional().isString().trim(),
    body('description').optional().isString(),
    body('list_name').optional().isString(),
    body('parent_task_id').optional().isUUID(),
    body('position').optional().isInt({ min: 0 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('due_date').optional().isISO8601(),
    body('due_time').optional().matches(/^\d{2}:\d{2}$/),
    body('estimated_duration_minutes').optional().isInt({ min: 1 }),
    body('category').optional().isString(),
    body('tags').optional().isArray(),
    body('status').optional().isIn(['pending', 'in_progress', 'completed', 'cancelled']),
    body('progress_percentage').optional().isInt({ min: 0, max: 100 }),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const task = await TaskModel.update(req.params.id, userId, req.body);

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json({ data: task, message: 'Task updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
);

// Complete a task
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const task = await TaskModel.complete(req.params.id, userId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ data: task, message: 'Task completed!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// Reorder tasks in a list
router.post(
  '/reorder',
  authenticate,
  validate([
    body('list_name').notEmpty().isString(),
    body('task_ids').notEmpty().isArray(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { list_name, task_ids } = req.body;

      const success = await TaskModel.reorder(userId, list_name, task_ids);

      if (!success) {
        return res.status(400).json({ error: 'Failed to reorder tasks' });
      }

      res.json({ message: 'Tasks reordered successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reorder tasks' });
    }
  }
);

// Delete a task
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deleted = await TaskModel.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
