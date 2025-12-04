import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  remind_at: Date;
  remind_before_minutes: number;
  is_recurring: boolean;
  recurrence_rule?: string;
  next_occurrence?: Date;
  priority: string;
  category?: string;
  notification_channels: string[];
  related_event_id?: string;
  related_memory_id?: string;
  status: string;
  snoozed_until?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReminderInput {
  user_id: string;
  title: string;
  description?: string;
  remind_at: Date | string;
  remind_before_minutes?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  priority?: string;
  category?: string;
  notification_channels?: string[];
  related_event_id?: string;
  related_memory_id?: string;
}

export interface UpdateReminderInput {
  title?: string;
  description?: string;
  remind_at?: Date | string;
  remind_before_minutes?: number;
  is_recurring?: boolean;
  recurrence_rule?: string;
  next_occurrence?: Date | string;
  priority?: string;
  category?: string;
  notification_channels?: string[];
  status?: string;
  snoozed_until?: Date | string;
}

export class ReminderModel {
  static async create(input: CreateReminderInput): Promise<Reminder> {
    const id = uuidv4();
    const reminder = await db.one(
      `INSERT INTO reminders
       (id, user_id, title, description, remind_at, remind_before_minutes, is_recurring, recurrence_rule, priority, category, notification_channels, related_event_id, related_memory_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.title,
        input.description || null,
        input.remind_at,
        input.remind_before_minutes || 0,
        input.is_recurring || false,
        input.recurrence_rule || null,
        input.priority || 'medium',
        input.category || null,
        JSON.stringify(input.notification_channels || ['in_app']),
        input.related_event_id || null,
        input.related_memory_id || null,
      ]
    );
    return reminder;
  }

  static async findById(id: string, userId: string): Promise<Reminder | null> {
    try {
      const reminder = await db.one(
        'SELECT * FROM reminders WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return reminder;
    } catch (error) {
      return null;
    }
  }

  static async findByUserId(
    userId: string,
    options: { status?: string; limit?: number; offset?: number } = {}
  ): Promise<Reminder[]> {
    let query = 'SELECT * FROM reminders WHERE user_id = $1';
    const values: any[] = [userId];
    let paramIndex = 2;

    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(options.status);
      paramIndex++;
    }

    query += ' ORDER BY remind_at ASC';

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(options.offset);
    }

    const reminders = await db.manyOrNone(query, values);
    return reminders || [];
  }

  static async getUpcoming(userId: string, hoursAhead: number = 24): Promise<Reminder[]> {
    const reminders = await db.manyOrNone(
      `SELECT * FROM reminders
       WHERE user_id = $1
       AND status = 'active'
       AND remind_at <= NOW() + INTERVAL '${hoursAhead} hours'
       AND remind_at >= NOW()
       ORDER BY remind_at ASC`,
      [userId]
    );
    return reminders || [];
  }

  static async getDue(userId: string): Promise<Reminder[]> {
    const reminders = await db.manyOrNone(
      `SELECT * FROM reminders
       WHERE user_id = $1
       AND status = 'active'
       AND remind_at <= NOW()
       ORDER BY remind_at ASC`,
      [userId]
    );
    return reminders || [];
  }

  static async update(id: string, userId: string, input: UpdateReminderInput): Promise<Reminder | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'notification_channels') {
          fields.push(`${key} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id, userId);
    }

    values.push(id, userId);
    const query = `UPDATE reminders SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;

    try {
      const reminder = await db.one(query, values);
      return reminder;
    } catch (error) {
      return null;
    }
  }

  static async complete(id: string, userId: string): Promise<Reminder | null> {
    try {
      const reminder = await db.one(
        `UPDATE reminders SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId]
      );
      return reminder;
    } catch (error) {
      return null;
    }
  }

  static async snooze(id: string, userId: string, snoozeUntil: Date | string): Promise<Reminder | null> {
    try {
      const reminder = await db.one(
        `UPDATE reminders SET status = 'snoozed', snoozed_until = $3 WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId, snoozeUntil]
      );
      return reminder;
    } catch (error) {
      return null;
    }
  }

  static async cancel(id: string, userId: string): Promise<Reminder | null> {
    try {
      const reminder = await db.one(
        `UPDATE reminders SET status = 'cancelled' WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId]
      );
      return reminder;
    } catch (error) {
      return null;
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    } catch (error) {
      return false;
    }
  }
}
