import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { OnboardingModel } from '../../models/Onboarding';
import { MemoryModel } from '../../models/Memory';

const router = Router();

// Get current onboarding status
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const onboarding = await OnboardingModel.getOrCreate(userId);
    res.json({ data: onboarding });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch onboarding data' });
  }
});

// Update onboarding step
router.put(
  '/step/:step',
  authenticate,
  validate([
    body('wake_up_time').optional().matches(/^\d{2}:\d{2}$/),
    body('sleep_time').optional().matches(/^\d{2}:\d{2}$/),
    body('work_start_time').optional().matches(/^\d{2}:\d{2}$/),
    body('work_end_time').optional().matches(/^\d{2}:\d{2}$/),
    body('break_schedule').optional().isObject(),
    body('habits_to_track').optional().isArray(),
    body('habit_reminder_frequency').optional().isString(),
    body('important_dates').optional().isArray(),
    body('communication_tone').optional().isIn(['casual', 'professional', 'friendly', 'formal']),
    body('productivity_style').optional().isIn(['focused', 'balanced', 'flexible']),
    body('preferred_briefing_detail').optional().isIn(['brief', 'detailed', 'comprehensive']),
    body('motivation_style').optional().isIn(['direct', 'encouraging', 'data-driven']),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const step = parseInt(req.params.step, 10);

      const updateData = {
        ...req.body,
        onboarding_step: step,
      };

      const onboarding = await OnboardingModel.update(userId, updateData);

      if (!onboarding) {
        return res.status(404).json({ error: 'Onboarding record not found' });
      }

      res.json({ data: onboarding, message: `Step ${step} saved successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update onboarding data' });
    }
  }
);

// Complete onboarding
router.post('/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Get the onboarding data
    const onboarding = await OnboardingModel.findByUserId(userId);
    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    // Create personal memories from important dates
    if (onboarding.important_dates && Array.isArray(onboarding.important_dates)) {
      for (const date of onboarding.important_dates) {
        await MemoryModel.create({
          user_id: userId,
          memory_type: date.type || 'important_date',
          title: `${date.name}'s ${date.type || 'special day'}`,
          content: `Remember: ${date.name} - ${date.date}`,
          metadata: { originalDate: date },
          reminder_enabled: true,
          reminder_date: date.date,
          reminder_recurrence: 'yearly',
          source: 'onboarding',
        });
      }
    }

    // Mark onboarding as complete
    const completed = await OnboardingModel.completeOnboarding(userId);

    res.json({
      data: completed,
      message: 'Onboarding completed successfully! Your assistant is now personalized.',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Update onboarding data (general update)
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const onboarding = await OnboardingModel.update(userId, req.body);

    if (!onboarding) {
      return res.status(404).json({ error: 'Onboarding record not found' });
    }

    res.json({ data: onboarding });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update onboarding data' });
  }
});

export default router;
