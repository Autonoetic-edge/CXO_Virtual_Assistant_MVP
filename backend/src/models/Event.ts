import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Event {
  id: string;
  user_id: string;
  calendar_id: string;
  provider_event_id: string;
  provider: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  location?: string;
  event_type?: string;
  meeting_type?: string;
  is_recurring: boolean;
  recurring_rule?: string;
  attendees?: any[];
  attachments?: any[];
  preparation_required: boolean;
  is_focus_block: boolean;
  is_buffer_block: boolean;
  created_at: Date;
  updated_at: Date;
  synced_at?: Date;
  is_deleted: boolean;
}

export interface CreateEventInput {
  user_id: string;
  calendar_id: string;
  provider_event_id: string;
  provider: string;
  title: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  location?: string;
  event_type?: string;
  meeting_type?: string;
  is_recurring?: boolean;
  recurring_rule?: string;
  attendees?: any[];
  attachments?: any[];
  preparation_required?: boolean;
  is_focus_block?: boolean;
  is_buffer_block?: boolean;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  start_time?: Date;
  end_time?: Date;
  location?: string;
  event_type?: string;
  meeting_type?: string;
  attendees?: any[];
  attachments?: any[];
  preparation_required?: boolean;
  synced_at?: Date;
}

export class EventModel {
  static async create(input: CreateEventInput): Promise<Event> {
    const id = uuidv4();
    const event = await db.one(
      `INSERT INTO events (id, user_id, calendar_id, provider_event_id, provider, title, description,
       start_time, end_time, location, event_type, meeting_type, is_recurring, recurring_rule,
       attendees, attachments, preparation_required, is_focus_block, is_buffer_block)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.calendar_id,
        input.provider_event_id,
        input.provider,
        input.title,
        input.description || null,
        input.start_time,
        input.end_time,
        input.location || null,
        input.event_type || null,
        input.meeting_type || null,
        input.is_recurring || false,
        input.recurring_rule || null,
        JSON.stringify(input.attendees || []),
        JSON.stringify(input.attachments || []),
        input.preparation_required || false,
        input.is_focus_block || false,
        input.is_buffer_block || false,
      ]
    );
    return event;
  }

  static async findById(id: string): Promise<Event | null> {
    try {
      const event = await db.one('SELECT * FROM events WHERE id = $1 AND is_deleted = false', [id]);
      return event;
    } catch (error) {
      return null;
    }
  }

  static async findByProviderEventId(providerEventId: string): Promise<Event | null> {
    try {
      const event = await db.one('SELECT * FROM events WHERE provider_event_id = $1 AND is_deleted = false', [
        providerEventId,
      ]);
      return event;
    } catch (error) {
      return null;
    }
  }

  static async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Event[]> {
    const events = await db.manyOrNone(
      `SELECT * FROM events
       WHERE user_id = $1
       AND start_time >= $2
       AND end_time <= $3
       AND is_deleted = false
       ORDER BY start_time ASC`,
      [userId, startDate, endDate]
    );
    return events || [];
  }

  static async findUpcomingByUserId(userId: string, limit: number = 10): Promise<Event[]> {
    const events = await db.manyOrNone(
      `SELECT * FROM events
       WHERE user_id = $1
       AND start_time > CURRENT_TIMESTAMP
       AND is_deleted = false
       ORDER BY start_time ASC
       LIMIT $2`,
      [userId, limit]
    );
    return events || [];
  }

  static async update(id: string, input: UpdateEventInput): Promise<Event | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'attendees' || key === 'attachments') {
          fields.push(`${key} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    try {
      const event = await db.one(query, values);
      return event;
    } catch (error) {
      return null;
    }
  }

  static async softDelete(id: string): Promise<boolean> {
    try {
      await db.none('UPDATE events SET is_deleted = true WHERE id = $1', [id]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM events WHERE id = $1', [id]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async findConflicts(userId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Event[]> {
    let query = `
      SELECT * FROM events
      WHERE user_id = $1
      AND is_deleted = false
      AND (
        (start_time >= $2 AND start_time < $3)
        OR (end_time > $2 AND end_time <= $3)
        OR (start_time <= $2 AND end_time >= $3)
      )
    `;
    const params: any[] = [userId, startTime, endTime];

    if (excludeId) {
      query += ' AND id != $4';
      params.push(excludeId);
    }

    query += ' ORDER BY start_time ASC';

    const events = await db.manyOrNone(query, params);
    return events || [];
  }
}
