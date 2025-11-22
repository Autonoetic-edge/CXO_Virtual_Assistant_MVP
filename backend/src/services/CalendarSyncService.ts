import { google } from 'googleapis';
import { CalendarModel, Calendar } from '../models/Calendar';
import { EventModel } from '../models/Event';
import config from '../config';
import logger from '../utils/logger';

export class CalendarSyncService {
  // Initialize Google Calendar client
  static getGoogleCalendar(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(
      config.oauth.google.clientId,
      config.oauth.google.clientSecret,
      config.oauth.google.redirectUri
    );

    oauth2Client.setCredentials({ access_token: accessToken });
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  // Sync Google Calendar events
  static async syncGoogleCalendar(calendarId: string): Promise<{success: boolean; eventsSynced: number}> {
    try {
      const calendar = await CalendarModel.findById(calendarId);
      if (!calendar) {
        throw new Error('Calendar not found');
      }

      const googleCalendar = this.getGoogleCalendar(calendar.provider_access_token!);

      // Get events from last 30 days to next 90 days
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);

      const response = await googleCalendar.events.list({
        calendarId: calendar.provider_calendar_id,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500,
      });

      const events = response.data.items || [];
      let syncedCount = 0;

      for (const gEvent of events) {
        if (!gEvent.start || !gEvent.end) continue;

        const startTime = new Date(gEvent.start.dateTime || gEvent.start.date!);
        const endTime = new Date(gEvent.end.dateTime || gEvent.end.date!);

        // Check if event already exists
        const existingEvent = await EventModel.findByProviderEventId(gEvent.id!);

        const eventData = {
          user_id: calendar.user_id,
          calendar_id: calendar.id,
          provider_event_id: gEvent.id!,
          provider: 'google',
          title: gEvent.summary || 'Untitled Event',
          description: gEvent.description || undefined,
          start_time: startTime,
          end_time: endTime,
          location: gEvent.location || undefined,
          attendees: gEvent.attendees || [],
          is_recurring: !!gEvent.recurringEventId,
          recurring_rule: gEvent.recurrence ? gEvent.recurrence[0] : undefined,
        };

        if (existingEvent) {
          // Update existing event
          await EventModel.update(existingEvent.id, {
            title: eventData.title,
            description: eventData.description,
            start_time: eventData.start_time,
            end_time: eventData.end_time,
            location: eventData.location,
            attendees: eventData.attendees,
            synced_at: new Date(),
          });
        } else {
          // Create new event
          await EventModel.create(eventData);
        }

        syncedCount++;
      }

      // Update calendar sync status
      await CalendarModel.updateSyncStatus(calendar.id, 'active');

      logger.info(`Synced ${syncedCount} events for calendar ${calendar.id}`);

      return { success: true, eventsSynced: syncedCount };
    } catch (error: any) {
      logger.error('Calendar sync error:', error);
      throw error;
    }
  }

  // Create event in Google Calendar
  static async createGoogleEvent(calendarId: string, eventData: any): Promise<any> {
    const calendar = await CalendarModel.findById(calendarId);
    if (!calendar) {
      throw new Error('Calendar not found');
    }

    const googleCalendar = this.getGoogleCalendar(calendar.provider_access_token!);

    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.start_time.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: eventData.end_time.toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: eventData.attendees || [],
    };

    const response = await googleCalendar.events.insert({
      calendarId: calendar.provider_calendar_id,
      requestBody: event,
    });

    return response.data;
  }
}
