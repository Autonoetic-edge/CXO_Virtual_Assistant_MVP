import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  list_name: string;
  parent_task_id?: string;
  position: number;
  priority: string;
  due_date?: string;
  due_time?: string;
  estimated_duration_minutes?: number;
  category?: string;
  tags: string[];
  status: string;
  progress_percentage: number;
  completed_at?: Date;
  external_source?: string;
  external_id?: string;
  external_url?: string;
  last_synced_at?: Date;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTaskInput {
  user_id: string;
  title: string;
  description?: string;
  list_name?: string;
  parent_task_id?: string;
  priority?: string;
  due_date?: string;
  due_time?: string;
  estimated_duration_minutes?: number;
  category?: string;
  tags?: string[];
  external_source?: string;
  external_id?: string;
  external_url?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  list_name?: string;
  parent_task_id?: string;
  position?: number;
  priority?: string;
  due_date?: string;
  due_time?: string;
  estimated_duration_minutes?: number;
  category?: string;
  tags?: string[];
  status?: string;
  progress_percentage?: number;
  external_url?: string;
  is_recurring?: boolean;
  recurrence_rule?: string;
}

export interface TaskQueryOptions {
  list_name?: string;
  status?: string;
  priority?: string;
  due_before?: string;
  due_after?: string;
  category?: string;
  external_source?: string;
  limit?: number;
  offset?: number;
}

export class TaskModel {
  static async create(input: CreateTaskInput): Promise<Task> {
    const id = uuidv4();

    // Get the next position for the list
    const maxPosition = await db.oneOrNone(
      `SELECT COALESCE(MAX(position), 0) as max_pos FROM tasks WHERE user_id = $1 AND list_name = $2`,
      [input.user_id, input.list_name || 'default']
    );

    const task = await db.one(
      `INSERT INTO tasks
       (id, user_id, title, description, list_name, parent_task_id, position, priority, due_date, due_time, estimated_duration_minutes, category, tags, external_source, external_id, external_url, is_recurring, recurrence_rule)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.title,
        input.description || null,
        input.list_name || 'default',
        input.parent_task_id || null,
        (maxPosition?.max_pos || 0) + 1,
        input.priority || 'medium',
        input.due_date || null,
        input.due_time || null,
        input.estimated_duration_minutes || null,
        input.category || null,
        JSON.stringify(input.tags || []),
        input.external_source || null,
        input.external_id || null,
        input.external_url || null,
        input.is_recurring || false,
        input.recurrence_rule || null,
      ]
    );
    return task;
  }

  static async findById(id: string, userId: string): Promise<Task | null> {
    try {
      const task = await db.one(
        'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return task;
    } catch (error) {
      return null;
    }
  }

  static async findByUserId(userId: string, options: TaskQueryOptions = {}): Promise<Task[]> {
    let query = 'SELECT * FROM tasks WHERE user_id = $1';
    const values: any[] = [userId];
    let paramIndex = 2;

    if (options.list_name) {
      query += ` AND list_name = $${paramIndex}`;
      values.push(options.list_name);
      paramIndex++;
    }

    if (options.status) {
      query += ` AND status = $${paramIndex}`;
      values.push(options.status);
      paramIndex++;
    }

    if (options.priority) {
      query += ` AND priority = $${paramIndex}`;
      values.push(options.priority);
      paramIndex++;
    }

    if (options.due_before) {
      query += ` AND due_date <= $${paramIndex}`;
      values.push(options.due_before);
      paramIndex++;
    }

    if (options.due_after) {
      query += ` AND due_date >= $${paramIndex}`;
      values.push(options.due_after);
      paramIndex++;
    }

    if (options.category) {
      query += ` AND category = $${paramIndex}`;
      values.push(options.category);
      paramIndex++;
    }

    if (options.external_source) {
      query += ` AND external_source = $${paramIndex}`;
      values.push(options.external_source);
      paramIndex++;
    }

    query += ' ORDER BY position ASC, due_date ASC NULLS LAST';

    if (options.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(options.offset);
    }

    const tasks = await db.manyOrNone(query, values);
    return tasks || [];
  }

  static async update(id: string, userId: string, input: UpdateTaskInput): Promise<Task | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'tags') {
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
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;

    try {
      const task = await db.one(query, values);
      return task;
    } catch (error) {
      return null;
    }
  }

  static async complete(id: string, userId: string): Promise<Task | null> {
    try {
      const task = await db.one(
        `UPDATE tasks SET status = 'completed', progress_percentage = 100, completed_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId]
      );
      return task;
    } catch (error) {
      return null;
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getLists(userId: string): Promise<string[]> {
    const result = await db.manyOrNone(
      'SELECT DISTINCT list_name FROM tasks WHERE user_id = $1 ORDER BY list_name',
      [userId]
    );
    return result?.map((r) => r.list_name) || ['default'];
  }

  static async getOverdue(userId: string): Promise<Task[]> {
    const tasks = await db.manyOrNone(
      `SELECT * FROM tasks
       WHERE user_id = $1
       AND status NOT IN ('completed', 'cancelled')
       AND due_date < CURRENT_DATE
       ORDER BY due_date ASC`,
      [userId]
    );
    return tasks || [];
  }

  static async getDueToday(userId: string): Promise<Task[]> {
    const tasks = await db.manyOrNone(
      `SELECT * FROM tasks
       WHERE user_id = $1
       AND status NOT IN ('completed', 'cancelled')
       AND due_date = CURRENT_DATE
       ORDER BY due_time ASC NULLS LAST, priority DESC`,
      [userId]
    );
    return tasks || [];
  }

  static async getByExternalId(userId: string, source: string, externalId: string): Promise<Task | null> {
    try {
      const task = await db.one(
        'SELECT * FROM tasks WHERE user_id = $1 AND external_source = $2 AND external_id = $3',
        [userId, source, externalId]
      );
      return task;
    } catch (error) {
      return null;
    }
  }

  static async upsertFromExternal(input: CreateTaskInput): Promise<Task> {
    if (input.external_source && input.external_id) {
      const existing = await this.getByExternalId(input.user_id, input.external_source, input.external_id);
      if (existing) {
        const updated = await this.update(existing.id, input.user_id, {
          title: input.title,
          description: input.description,
          due_date: input.due_date,
          external_url: input.external_url,
        });
        return updated || existing;
      }
    }
    return this.create(input);
  }

  static async reorder(userId: string, listName: string, taskIds: string[]): Promise<boolean> {
    try {
      for (let i = 0; i < taskIds.length; i++) {
        await db.none(
          'UPDATE tasks SET position = $1 WHERE id = $2 AND user_id = $3 AND list_name = $4',
          [i + 1, taskIds[i], userId, listName]
        );
      }
      return true;
    } catch (error) {
      return false;
    }
  }
}
