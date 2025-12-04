import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { DailyWorkflowService } from '../../services/DailyWorkflowService';

const router = Router();

// Generate morning briefing
router.get('/morning', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const workflow = await DailyWorkflowService.generateMorningBriefing(userId);

    res.json({
      data: workflow,
      message: 'Morning briefing generated',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate morning briefing' });
  }
});

// Generate midday update
router.get('/midday', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const workflow = await DailyWorkflowService.generateMiddayUpdate(userId);

    res.json({
      data: workflow,
      message: 'Midday update generated',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate midday update' });
  }
});

// Generate evening reflection
router.get('/evening', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const workflow = await DailyWorkflowService.generateEveningReflection(userId);

    res.json({
      data: workflow,
      message: 'Evening reflection generated',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate evening reflection' });
  }
});

// Get workflow for a specific date and type
router.get('/:date/:type', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { date, type } = req.params;

    if (!['morning', 'midday', 'evening', 'weekly'].includes(type)) {
      return res.status(400).json({ error: 'Invalid workflow type' });
    }

    const workflow = await DailyWorkflowService.getWorkflow(userId, date, type);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found for this date' });
    }

    res.json({ data: workflow });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workflow' });
  }
});

// Mark workflow as viewed
router.post('/:id/viewed', authenticate, async (req: Request, res: Response) => {
  try {
    await DailyWorkflowService.markAsViewed(req.params.id);
    res.json({ message: 'Workflow marked as viewed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark workflow as viewed' });
  }
});

// Get today's workflow based on current time
router.get('/today', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const hour = new Date().getHours();

    let workflow;
    if (hour < 12) {
      workflow = await DailyWorkflowService.generateMorningBriefing(userId);
    } else if (hour < 17) {
      workflow = await DailyWorkflowService.generateMiddayUpdate(userId);
    } else {
      workflow = await DailyWorkflowService.generateEveningReflection(userId);
    }

    res.json({
      data: workflow,
      type: hour < 12 ? 'morning' : hour < 17 ? 'midday' : 'evening',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate today\'s workflow' });
  }
});

export default router;
