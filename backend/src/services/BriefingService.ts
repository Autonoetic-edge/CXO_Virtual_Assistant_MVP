import { EventModel } from '../models/Event';
import { MeetingModel } from '../models/Meeting';
import logger from '../utils/logger';

export interface BriefingContent {
  date: string;
  priorities: string[];
  schedule: {
    total_meetings: number;
    meetings: any[];
  };
  alerts: any[];
  stats: {
    revenue_mtd?: string;
    burn_rate?: string;
    open_approvals?: number;
  };
}

export class BriefingService {
  // Generate morning briefing
  static async generateMorningBriefing(userId: string): Promise<BriefingContent> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's events
      const events = await EventModel.findByUserIdAndDateRange(userId, today, tomorrow);

      // Get today's meetings
      const meetings = await MeetingModel.findByUserIdAndDateRange(userId, today, tomorrow);

      // Get unprepared meetings
      const unpreparedMeetings = meetings.filter(m => m.preparation_status === 'not_prepared');

      // Build priorities
      const priorities: string[] = [];
      if (unpreparedMeetings.length > 0) {
        priorities.push(`Prepare for ${unpreparedMeetings.length} upcoming meeting(s)`);
      }
      if (events.length > 5) {
        priorities.push('Busy day ahead - consider rescheduling non-critical meetings');
      }
      priorities.push('Review morning briefing and plan your day');

      // Build alerts
      const alerts: any[] = [];
      if (unpreparedMeetings.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${unpreparedMeetings.length} meeting(s) need preparation`,
        });
      }

      // Build schedule
      const schedule = {
        total_meetings: meetings.length,
        meetings: meetings.map(m => ({
          id: m.id,
          title: m.meeting_title,
          start_time: m.start_time,
          end_time: m.end_time,
          preparation_status: m.preparation_status,
          location: m.location,
        })),
      };

      const briefing: BriefingContent = {
        date: today.toISOString().split('T')[0],
        priorities: priorities.slice(0, 3),
        schedule,
        alerts,
        stats: {
          open_approvals: 0, // Placeholder
        },
      };

      logger.info(`Generated morning briefing for user ${userId}`);

      return briefing;
    } catch (error) {
      logger.error('Error generating morning briefing:', error);
      throw error;
    }
  }

  // Generate end-of-day summary
  static async generateEndOfDaySummary(userId: string): Promise<any> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // Get today's completed meetings
      const todayMeetings = await MeetingModel.findByUserIdAndDateRange(userId, today, tomorrow);
      const completedMeetings = todayMeetings.filter(m => m.status === 'completed');

      // Get tomorrow's meetings
      const tomorrowMeetings = await MeetingModel.findByUserIdAndDateRange(userId, tomorrow, dayAfterTomorrow);

      const summary = {
        date: today.toISOString().split('T')[0],
        completed_today: {
          meetings_attended: completedMeetings.length,
          decisions_made: completedMeetings.reduce((sum, m) => sum + (m.decisions_made?.length || 0), 0),
          action_items: completedMeetings.reduce((sum, m) => sum + (m.action_items?.length || 0), 0),
        },
        tomorrow_preview: {
          total_meetings: tomorrowMeetings.length,
          meetings: tomorrowMeetings.slice(0, 5).map(m => ({
            title: m.meeting_title,
            start_time: m.start_time,
            preparation_status: m.preparation_status,
          })),
        },
        insights: [
          `You attended ${completedMeetings.length} meetings today`,
          tomorrowMeetings.length > 5
            ? 'Tomorrow is busy - consider blocking focus time'
            : 'Tomorrow has a lighter schedule',
        ],
      };

      return summary;
    } catch (error) {
      logger.error('Error generating end-of-day summary:', error);
      throw error;
    }
  }
}
