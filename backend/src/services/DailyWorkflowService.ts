import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { TaskModel } from '../models/Task';
import { ReminderModel } from '../models/Reminder';
import { MemoryModel } from '../models/Memory';
import { OnboardingModel } from '../models/Onboarding';
import logger from '../utils/logger';

export interface WorkflowContent {
  greeting: string;
  summary: string;
  tasks: Array<{
    id: string;
    title: string;
    priority: string;
    due_date?: string;
    status: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    remind_at: Date;
    priority: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    start_time: Date;
    end_time: Date;
    location?: string;
  }>;
  upcomingMemories: Array<{
    id: string;
    title: string;
    type: string;
    reminder_date?: string;
  }>;
  motivationalMessage?: string;
  actionItems: string[];
}

export interface DailyWorkflow {
  id: string;
  user_id: string;
  workflow_date: string;
  workflow_type: string;
  content: WorkflowContent;
  delivered_at?: Date;
  delivery_channel?: string;
  viewed_at?: Date;
  interaction_data: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class DailyWorkflowService {
  static async generateMorningBriefing(userId: string): Promise<DailyWorkflow> {
    const today = new Date().toISOString().split('T')[0];
    const onboarding = await OnboardingModel.findByUserId(userId);

    // Get user data
    const [todayTasks, overdueTasks, upcomingReminders, upcomingMemories, todayEvents] = await Promise.all([
      TaskModel.getDueToday(userId),
      TaskModel.getOverdue(userId),
      ReminderModel.getUpcoming(userId, 24),
      MemoryModel.getUpcomingReminders(userId, 7),
      this.getTodayEvents(userId),
    ]);

    // Generate personalized greeting based on user preferences
    const greeting = this.getGreeting(onboarding, 'morning');

    // Create summary
    const taskCount = todayTasks.length;
    const overdueCount = overdueTasks.length;
    const eventCount = todayEvents.length;
    const reminderCount = upcomingReminders.length;

    let summary = `Good morning! `;
    if (taskCount > 0) {
      summary += `You have ${taskCount} task${taskCount > 1 ? 's' : ''} for today. `;
    }
    if (overdueCount > 0) {
      summary += `There ${overdueCount > 1 ? 'are' : 'is'} ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} that need attention. `;
    }
    if (eventCount > 0) {
      summary += `You have ${eventCount} event${eventCount > 1 ? 's' : ''} scheduled. `;
    }
    if (reminderCount > 0) {
      summary += `${reminderCount} reminder${reminderCount > 1 ? 's' : ''} coming up. `;
    }

    // Generate action items
    const actionItems: string[] = [];
    if (overdueCount > 0) {
      actionItems.push(`Review and update ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`);
    }
    const highPriorityTasks = todayTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    if (highPriorityTasks.length > 0) {
      actionItems.push(`Focus on ${highPriorityTasks.length} high-priority task${highPriorityTasks.length > 1 ? 's' : ''}`);
    }
    if (upcomingMemories.length > 0) {
      const birthdays = upcomingMemories.filter(m => m.memory_type === 'birthday');
      if (birthdays.length > 0) {
        actionItems.push(`Don't forget: ${birthdays.map(b => b.title).join(', ')}`);
      }
    }

    const content: WorkflowContent = {
      greeting,
      summary,
      tasks: [...overdueTasks, ...todayTasks].slice(0, 10).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
        status: t.status,
      })),
      reminders: upcomingReminders.slice(0, 5).map(r => ({
        id: r.id,
        title: r.title,
        remind_at: r.remind_at,
        priority: r.priority,
      })),
      events: todayEvents.slice(0, 5),
      upcomingMemories: upcomingMemories.slice(0, 5).map(m => ({
        id: m.id,
        title: m.title,
        type: m.memory_type,
        reminder_date: m.reminder_date,
      })),
      motivationalMessage: this.getMotivationalMessage(onboarding),
      actionItems,
    };

    return this.saveWorkflow(userId, today, 'morning', content);
  }

  static async generateMiddayUpdate(userId: string): Promise<DailyWorkflow> {
    const today = new Date().toISOString().split('T')[0];
    const onboarding = await OnboardingModel.findByUserId(userId);

    const [todayTasks, dueReminders, upcomingEvents] = await Promise.all([
      TaskModel.getDueToday(userId),
      ReminderModel.getDue(userId),
      this.getUpcomingEvents(userId, 6), // Next 6 hours
    ]);

    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const pendingTasks = todayTasks.filter(t => t.status !== 'completed');

    const greeting = this.getGreeting(onboarding, 'midday');

    let summary = `Midday check-in: `;
    if (completedTasks.length > 0) {
      summary += `Great job! You've completed ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} today. `;
    }
    if (pendingTasks.length > 0) {
      summary += `${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} still pending. `;
    }
    if (dueReminders.length > 0) {
      summary += `You have ${dueReminders.length} reminder${dueReminders.length > 1 ? 's' : ''} that need attention. `;
    }

    const actionItems: string[] = [];
    const urgentTasks = pendingTasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
    if (urgentTasks.length > 0) {
      actionItems.push(`Prioritize: ${urgentTasks.slice(0, 3).map(t => t.title).join(', ')}`);
    }
    if (upcomingEvents.length > 0) {
      actionItems.push(`Prepare for upcoming: ${upcomingEvents[0].title}`);
    }

    const content: WorkflowContent = {
      greeting,
      summary,
      tasks: pendingTasks.slice(0, 10).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
        status: t.status,
      })),
      reminders: dueReminders.slice(0, 5).map(r => ({
        id: r.id,
        title: r.title,
        remind_at: r.remind_at,
        priority: r.priority,
      })),
      events: upcomingEvents.slice(0, 5),
      upcomingMemories: [],
      motivationalMessage: this.getMidDayMotivation(completedTasks.length, pendingTasks.length),
      actionItems,
    };

    return this.saveWorkflow(userId, today, 'midday', content);
  }

  static async generateEveningReflection(userId: string): Promise<DailyWorkflow> {
    const today = new Date().toISOString().split('T')[0];
    const onboarding = await OnboardingModel.findByUserId(userId);

    const [todayTasks, completedReminders, tomorrowTasks, upcomingMemories] = await Promise.all([
      TaskModel.getDueToday(userId),
      this.getCompletedRemindersToday(userId),
      this.getTomorrowTasks(userId),
      MemoryModel.getUpcomingReminders(userId, 3),
    ]);

    const completedTasks = todayTasks.filter(t => t.status === 'completed');
    const pendingTasks = todayTasks.filter(t => t.status !== 'completed');

    const greeting = this.getGreeting(onboarding, 'evening');

    let summary = `Evening summary: `;
    summary += `Today you completed ${completedTasks.length} task${completedTasks.length !== 1 ? 's' : ''}`;
    if (completedReminders.length > 0) {
      summary += ` and ${completedReminders.length} reminder${completedReminders.length !== 1 ? 's' : ''}`;
    }
    summary += `. `;

    if (pendingTasks.length > 0) {
      summary += `${pendingTasks.length} task${pendingTasks.length !== 1 ? 's' : ''} moved to tomorrow. `;
    }
    if (tomorrowTasks.length > 0) {
      summary += `Tomorrow has ${tomorrowTasks.length} task${tomorrowTasks.length !== 1 ? 's' : ''} scheduled. `;
    }

    const actionItems: string[] = [];
    if (pendingTasks.length > 0) {
      actionItems.push(`Review pending: ${pendingTasks.slice(0, 2).map(t => t.title).join(', ')}`);
    }
    if (tomorrowTasks.length > 0) {
      actionItems.push(`Tomorrow's priority: ${tomorrowTasks[0]?.title || 'Plan your day'}`);
    }
    actionItems.push('Take a moment to reflect on your accomplishments');

    const content: WorkflowContent = {
      greeting,
      summary,
      tasks: [...completedTasks, ...pendingTasks].slice(0, 10).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        due_date: t.due_date,
        status: t.status,
      })),
      reminders: [],
      events: [],
      upcomingMemories: upcomingMemories.slice(0, 3).map(m => ({
        id: m.id,
        title: m.title,
        type: m.memory_type,
        reminder_date: m.reminder_date,
      })),
      motivationalMessage: this.getEveningMessage(completedTasks.length),
      actionItems,
    };

    return this.saveWorkflow(userId, today, 'evening', content);
  }

  static async getWorkflow(userId: string, date: string, type: string): Promise<DailyWorkflow | null> {
    try {
      const workflow = await db.one(
        'SELECT * FROM daily_workflows WHERE user_id = $1 AND workflow_date = $2 AND workflow_type = $3',
        [userId, date, type]
      );
      return workflow;
    } catch (error) {
      return null;
    }
  }

  static async markAsViewed(workflowId: string): Promise<void> {
    await db.none(
      'UPDATE daily_workflows SET viewed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [workflowId]
    );
  }

  private static async saveWorkflow(
    userId: string,
    date: string,
    type: string,
    content: WorkflowContent
  ): Promise<DailyWorkflow> {
    const id = uuidv4();

    try {
      // Try to update existing
      const existing = await this.getWorkflow(userId, date, type);
      if (existing) {
        const updated = await db.one(
          `UPDATE daily_workflows SET content = $1::jsonb WHERE id = $2 RETURNING *`,
          [JSON.stringify(content), existing.id]
        );
        return updated;
      }

      // Create new
      const workflow = await db.one(
        `INSERT INTO daily_workflows (id, user_id, workflow_date, workflow_type, content)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING *`,
        [id, userId, date, type, JSON.stringify(content)]
      );
      return workflow;
    } catch (error) {
      logger.error('Failed to save daily workflow:', error);
      throw error;
    }
  }

  private static getGreeting(onboarding: any, timeOfDay: string): string {
    const tone = onboarding?.communication_tone || 'professional';
    const motivationStyle = onboarding?.motivation_style || 'encouraging';

    const greetings: Record<string, Record<string, string[]>> = {
      morning: {
        professional: ['Good morning.', 'Hello, good morning.', 'Good morning, ready for the day?'],
        casual: ['Hey there! Morning!', 'Good morning!', 'Rise and shine!'],
        friendly: ['Good morning! Hope you slept well!', 'Hey! Great to see you this morning!'],
        formal: ['Good morning. I trust you are well.', 'A very good morning to you.'],
      },
      midday: {
        professional: ['Midday update.', 'Here\'s your midday check-in.'],
        casual: ['Hey! Quick midday check-in.', 'How\'s it going?'],
        friendly: ['Hope your day is going great! Quick update:'],
        formal: ['Your midday briefing is ready.'],
      },
      evening: {
        professional: ['Evening summary.', 'End of day review.'],
        casual: ['Hey! Here\'s how today went.', 'Wrapping up the day!'],
        friendly: ['Great work today! Here\'s your evening summary.'],
        formal: ['Your daily summary is ready for review.'],
      },
    };

    const options = greetings[timeOfDay]?.[tone] || greetings[timeOfDay]?.professional || ['Hello.'];
    return options[Math.floor(Math.random() * options.length)];
  }

  private static getMotivationalMessage(onboarding: any): string {
    const style = onboarding?.motivation_style || 'encouraging';

    const messages: Record<string, string[]> = {
      direct: [
        'Focus on what matters most.',
        'Tackle your high-priority items first.',
        'Stay productive.',
      ],
      encouraging: [
        'You\'ve got this! Make today count.',
        'Every task completed is progress forward.',
        'Believe in yourself - you can handle whatever today brings.',
      ],
      'data-driven': [
        'Data shows morning focus leads to higher productivity.',
        'Starting with high-priority tasks improves daily completion rates.',
        'Consistent daily reviews improve task management by 40%.',
      ],
    };

    const options = messages[style] || messages.encouraging;
    return options[Math.floor(Math.random() * options.length)];
  }

  private static getMidDayMotivation(completed: number, pending: number): string {
    if (completed > pending) {
      return 'Great progress! You\'re ahead of schedule. Keep the momentum going!';
    } else if (completed === 0 && pending > 0) {
      return 'Time to get started! Pick one task and focus on completing it.';
    } else if (completed > 0) {
      return 'Good work so far! Stay focused for the rest of the day.';
    }
    return 'You\'re doing well. Take a moment to recharge if needed.';
  }

  private static getEveningMessage(completedCount: number): string {
    if (completedCount >= 5) {
      return 'Outstanding day! You accomplished a lot. Rest well tonight.';
    } else if (completedCount >= 3) {
      return 'Solid day of work! You made good progress.';
    } else if (completedCount >= 1) {
      return 'Every completed task counts. Tomorrow is another opportunity.';
    }
    return 'Tomorrow is a fresh start. Rest up and come back stronger.';
  }

  private static async getTodayEvents(userId: string): Promise<any[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const events = await db.manyOrNone(
        `SELECT id, title, start_time, end_time, location
         FROM events
         WHERE user_id = $1
         AND start_time >= $2
         AND start_time <= $3
         AND is_deleted = false
         ORDER BY start_time ASC`,
        [userId, startOfDay.toISOString(), endOfDay.toISOString()]
      );
      return events || [];
    } catch (error) {
      return [];
    }
  }

  private static async getUpcomingEvents(userId: string, hoursAhead: number): Promise<any[]> {
    try {
      const now = new Date();
      const later = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

      const events = await db.manyOrNone(
        `SELECT id, title, start_time, end_time, location
         FROM events
         WHERE user_id = $1
         AND start_time >= $2
         AND start_time <= $3
         AND is_deleted = false
         ORDER BY start_time ASC`,
        [userId, now.toISOString(), later.toISOString()]
      );
      return events || [];
    } catch (error) {
      return [];
    }
  }

  private static async getCompletedRemindersToday(userId: string): Promise<any[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reminders = await db.manyOrNone(
        `SELECT * FROM reminders
         WHERE user_id = $1
         AND status = 'completed'
         AND DATE(completed_at) = $2`,
        [userId, today]
      );
      return reminders || [];
    } catch (error) {
      return [];
    }
  }

  private static async getTomorrowTasks(userId: string): Promise<any[]> {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = tomorrow.toISOString().split('T')[0];

      const tasks = await db.manyOrNone(
        `SELECT * FROM tasks
         WHERE user_id = $1
         AND due_date = $2
         AND status NOT IN ('completed', 'cancelled')
         ORDER BY priority DESC, due_time ASC NULLS LAST`,
        [userId, tomorrowDate]
      );
      return tasks || [];
    } catch (error) {
      return [];
    }
  }
}
