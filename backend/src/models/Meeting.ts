import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Meeting {
  id: string;
  user_id: string;
  event_id: string;
  meeting_title: string;
  meeting_description?: string;
  start_time: Date;
  end_time: Date;
  meeting_type?: string;
  is_recurring: boolean;
  attendee_count?: number;
  attendees?: any[];
  location?: string;
  meeting_notes?: string;
  preparation_notes?: string;
  post_meeting_summary?: string;
  action_items?: any[];
  decisions_made?: any[];
  status: 'scheduled' | 'completed' | 'cancelled';
  preparation_status: 'not_prepared' | 'in_progress' | 'prepared';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface CreateMeetingInput {
  user_id: string;
  event_id: string;
  meeting_title: string;
  meeting_description?: string;
  start_time: Date;
  end_time: Date;
  meeting_type?: string;
  is_recurring?: boolean;
  attendees?: any[];
  location?: string;
}

export interface UpdateMeetingInput {
  meeting_title?: string;
  meeting_description?: string;
  start_time?: Date;
  end_time?: Date;
  meeting_notes?: string;
  preparation_notes?: string;
  post_meeting_summary?: string;
  action_items?: any[];
  decisions_made?: any[];
  status?: 'scheduled' | 'completed' | 'cancelled';
  preparation_status?: 'not_prepared' | 'in_progress' | 'prepared';
  completed_at?: Date;
}

export class MeetingModel {
  static async create(input: CreateMeetingInput): Promise<Meeting> {
    const id = uuidv4();
    const meeting = await db.one(
      `INSERT INTO meetings (id, user_id, event_id, meeting_title, meeting_description,
       start_time, end_time, meeting_type, is_recurring, attendee_count, attendees, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.event_id,
        input.meeting_title,
        input.meeting_description || null,
        input.start_time,
        input.end_time,
        input.meeting_type || null,
        input.is_recurring || false,
        input.attendees ? input.attendees.length : 0,
        JSON.stringify(input.attendees || []),
        input.location || null,
      ]
    );
    return meeting;
  }

  static async findById(id: string): Promise<Meeting | null> {
    try {
      const meeting = await db.one('SELECT * FROM meetings WHERE id = $1', [id]);
      return meeting;
    } catch (error) {
      return null;
    }
  }

  static async findByEventId(eventId: string): Promise<Meeting | null> {
    try {
      const meeting = await db.one('SELECT * FROM meetings WHERE event_id = $1', [eventId]);
      return meeting;
    } catch (error) {
      return null;
    }
  }

  static async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Meeting[]> {
    const meetings = await db.manyOrNone(
      `SELECT * FROM meetings
       WHERE user_id = $1
       AND start_time >= $2
       AND end_time <= $3
       ORDER BY start_time ASC`,
      [userId, startDate, endDate]
    );
    return meetings || [];
  }

  static async findUpcomingByUserId(userId: string, limit: number = 10): Promise<Meeting[]> {
    const meetings = await db.manyOrNone(
      `SELECT * FROM meetings
       WHERE user_id = $1
       AND start_time > CURRENT_TIMESTAMP
       AND status = 'scheduled'
       ORDER BY start_time ASC
       LIMIT $2`,
      [userId, limit]
    );
    return meetings || [];
  }

  static async update(id: string, input: UpdateMeetingInput): Promise<Meeting | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'action_items' || key === 'decisions_made' || key === 'attendees') {
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
    const query = `UPDATE meetings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    try {
      const meeting = await db.one(query, values);
      return meeting;
    } catch (error) {
      return null;
    }
  }

  static async updatePreparationStatus(
    id: string,
    status: 'not_prepared' | 'in_progress' | 'prepared'
  ): Promise<void> {
    await db.none('UPDATE meetings SET preparation_status = $1 WHERE id = $2', [status, id]);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM meetings WHERE id = $1', [id]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async findUnpreparedMeetings(userId: string, hoursAhead: number = 24): Promise<Meeting[]> {
    const meetings = await db.manyOrNone(
      `SELECT * FROM meetings
       WHERE user_id = $1
       AND preparation_status = 'not_prepared'
       AND start_time > CURRENT_TIMESTAMP
       AND start_time <= CURRENT_TIMESTAMP + INTERVAL '${hoursAhead} hours'
       AND status = 'scheduled'
       ORDER BY start_time ASC`,
      [userId]
    );
    return meetings || [];
  }
}
