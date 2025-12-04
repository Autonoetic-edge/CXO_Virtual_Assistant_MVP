import { Router, Request, Response } from 'express';
import { body, query } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { MemoryModel } from '../../models/Memory';

const router = Router();

// Create a new memory
router.post(
  '/',
  authenticate,
  validate([
    body('memory_type').notEmpty().isString(),
    body('title').notEmpty().isString().trim(),
    body('content').optional().isString(),
    body('metadata').optional().isObject(),
    body('related_entities').optional().isArray(),
    body('tags').optional().isArray(),
    body('reminder_enabled').optional().isBoolean(),
    body('reminder_date').optional().isISO8601(),
    body('reminder_recurrence').optional().isIn(['once', 'yearly', 'monthly', 'weekly']),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const memory = await MemoryModel.create({
        user_id: userId,
        ...req.body,
      });

      res.status(201).json({ data: memory, message: 'Memory created successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create memory' });
    }
  }
);

// Natural language "remember" endpoint
router.post(
  '/remember',
  authenticate,
  validate([body('text').notEmpty().isString().trim()]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { text } = req.body;

      // Parse the text to determine memory type and extract information
      // This is a simple implementation; could be enhanced with NLP/AI
      let memoryType = 'note';
      let title = text;
      let metadata: Record<string, any> = {};

      // Simple pattern matching for common memory types
      const lowerText = text.toLowerCase();

      if (lowerText.includes('birthday') || lowerText.includes('born')) {
        memoryType = 'birthday';
        metadata.category = 'important_date';
      } else if (lowerText.includes('anniversary')) {
        memoryType = 'anniversary';
        metadata.category = 'important_date';
      } else if (lowerText.includes('prefer') || lowerText.includes('like') || lowerText.includes('favorite')) {
        memoryType = 'preference';
      } else if (lowerText.includes('meeting') || lowerText.includes('appointment')) {
        memoryType = 'event';
      } else if (lowerText.match(/\b[A-Z][a-z]+\b/) && (lowerText.includes('is') || lowerText.includes('are'))) {
        memoryType = 'fact';
      }

      // Extract date if present (simple regex)
      const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
      let reminderDate: string | undefined;
      if (dateMatch) {
        const parts = dateMatch[1].split(/[\/\-]/);
        if (parts.length === 3) {
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          reminderDate = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
        }
      }

      const memory = await MemoryModel.create({
        user_id: userId,
        memory_type: memoryType,
        title: title.length > 100 ? title.substring(0, 100) + '...' : title,
        content: text,
        metadata,
        reminder_enabled: !!reminderDate,
        reminder_date: reminderDate,
        reminder_recurrence: memoryType === 'birthday' || memoryType === 'anniversary' ? 'yearly' : undefined,
        source: 'user',
      });

      res.status(201).json({
        data: memory,
        message: `Got it! I'll remember that.`,
        parsed: { type: memoryType, hasReminder: !!reminderDate },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save memory' });
    }
  }
);

// Search memories
router.get(
  '/search',
  authenticate,
  validate([
    query('q').optional().isString(),
    query('type').optional().isString(),
    query('tags').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { q, type, tags, limit, offset } = req.query;

      const memories = await MemoryModel.search({
        user_id: userId,
        search_query: q as string,
        memory_type: type as string,
        tags: tags ? (tags as string).split(',') : undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.json({ data: memories, count: memories.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to search memories' });
    }
  }
);

// Get relevant memories for a query (RAG-friendly)
router.get(
  '/relevant',
  authenticate,
  validate([query('q').notEmpty().isString()]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { q, limit } = req.query;

      const memories = await MemoryModel.getRelevantMemories(
        userId,
        q as string,
        limit ? parseInt(limit as string, 10) : 10
      );

      res.json({ data: memories, count: memories.length });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch relevant memories' });
    }
  }
);

// Get upcoming reminders from memories
router.get('/upcoming-reminders', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;

    const memories = await MemoryModel.getUpcomingReminders(userId, days);
    res.json({ data: memories, count: memories.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming reminders' });
  }
});

// Get memories by type
router.get('/type/:type', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memories = await MemoryModel.getByType(userId, req.params.type);
    res.json({ data: memories, count: memories.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Get all memories
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { limit, offset } = req.query;

    const memories = await MemoryModel.search({
      user_id: userId,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({ data: memories, count: memories.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Get a specific memory
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const memory = await MemoryModel.findById(req.params.id, userId);

    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ data: memory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch memory' });
  }
});

// Update a memory
router.put(
  '/:id',
  authenticate,
  validate([
    body('memory_type').optional().isString(),
    body('title').optional().isString().trim(),
    body('content').optional().isString(),
    body('metadata').optional().isObject(),
    body('related_entities').optional().isArray(),
    body('tags').optional().isArray(),
    body('reminder_enabled').optional().isBoolean(),
    body('reminder_date').optional().isISO8601(),
    body('reminder_recurrence').optional().isIn(['once', 'yearly', 'monthly', 'weekly']),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const memory = await MemoryModel.update(req.params.id, userId, req.body);

      if (!memory) {
        return res.status(404).json({ error: 'Memory not found' });
      }

      res.json({ data: memory, message: 'Memory updated successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update memory' });
    }
  }
);

// Delete a memory
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deleted = await MemoryModel.delete(req.params.id, userId);

    if (!deleted) {
      return res.status(404).json({ error: 'Memory not found' });
    }

    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

export default router;
