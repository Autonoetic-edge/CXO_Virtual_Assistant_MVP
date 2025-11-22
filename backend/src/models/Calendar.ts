import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Calendar {
  id: string;
  user_id: string;
  provider: 'google' | 'outlook' | 'apple';
  provider_calendar_id: string;
  provider_access_token?: string;
  provider_refresh_token?: string;
  calendar_name: string;
  is_primary: boolean;
  sync_enabled: boolean;
  last_sync_time?: Date;
  sync_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCalendarInput {
  user_id: string;
  provider: 'google' | 'outlook' | 'apple';
  provider_calendar_id: string;
  provider_access_token: string;
  provider_refresh_token?: string;
  calendar_name: string;
  is_primary?: boolean;
}

export interface UpdateCalendarInput {
  provider_access_token?: string;
  provider_refresh_token?: string;
  calendar_name?: string;
  is_primary?: boolean;
  sync_enabled?: boolean;
  last_sync_time?: Date;
  sync_status?: string;
}

export class CalendarModel {
  static async create(input: CreateCalendarInput): Promise<Calendar> {
    const id = uuidv4();
    const calendar = await db.one(
      `INSERT INTO calendars (id, user_id, provider, provider_calendar_id, provider_access_token,
       provider_refresh_token, calendar_name, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.provider,
        input.provider_calendar_id,
        input.provider_access_token,
        input.provider_refresh_token || null,
        input.calendar_name,
        input.is_primary || false,
      ]
    );
    return calendar;
  }

  static async findById(id: string): Promise<Calendar | null> {
    try {
      const calendar = await db.one('SELECT * FROM calendars WHERE id = $1', [id]);
      return calendar;
    } catch (error) {
      return null;
    }
  }

  static async findByUserId(userId: string): Promise<Calendar[]> {
    const calendars = await db.manyOrNone('SELECT * FROM calendars WHERE user_id = $1 ORDER BY is_primary DESC', [
      userId,
    ]);
    return calendars || [];
  }

  static async findPrimaryByUserId(userId: string): Promise<Calendar | null> {
    try {
      const calendar = await db.one('SELECT * FROM calendars WHERE user_id = $1 AND is_primary = true', [userId]);
      return calendar;
    } catch (error) {
      return null;
    }
  }

  static async update(id: string, input: UpdateCalendarInput): Promise<Calendar | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `UPDATE calendars SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    try {
      const calendar = await db.one(query, values);
      return calendar;
    } catch (error) {
      return null;
    }
  }

  static async updateSyncStatus(id: string, status: string): Promise<void> {
    await db.none('UPDATE calendars SET sync_status = $1, last_sync_time = CURRENT_TIMESTAMP WHERE id = $2', [
      status,
      id,
    ]);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM calendars WHERE id = $1', [id]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async setSyncEnabled(id: string, enabled: boolean): Promise<void> {
    await db.none('UPDATE calendars SET sync_enabled = $1 WHERE id = $2', [enabled, id]);
  }
}
