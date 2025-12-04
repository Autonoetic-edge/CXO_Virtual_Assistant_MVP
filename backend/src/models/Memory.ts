import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Memory {
  id: string;
  user_id: string;
  memory_type: string;
  title: string;
  content?: string;
  metadata: Record<string, any>;
  related_entities: Array<{
    entity_type: string;
    entity_id: string;
    relation: string;
  }>;
  tags: string[];
  source: string;
  confidence_score: number;
  reminder_enabled: boolean;
  reminder_date?: string;
  reminder_recurrence?: string;
  is_active: boolean;
  last_accessed_at?: Date;
  access_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateMemoryInput {
  user_id: string;
  memory_type: string;
  title: string;
  content?: string;
  metadata?: Record<string, any>;
  related_entities?: Array<{ entity_type: string; entity_id: string; relation: string }>;
  tags?: string[];
  source?: string;
  reminder_enabled?: boolean;
  reminder_date?: string;
  reminder_recurrence?: string;
}

export interface UpdateMemoryInput {
  memory_type?: string;
  title?: string;
  content?: string;
  metadata?: Record<string, any>;
  related_entities?: Array<{ entity_type: string; entity_id: string; relation: string }>;
  tags?: string[];
  reminder_enabled?: boolean;
  reminder_date?: string;
  reminder_recurrence?: string;
  is_active?: boolean;
}

export interface MemorySearchParams {
  user_id: string;
  memory_type?: string;
  tags?: string[];
  search_query?: string;
  include_inactive?: boolean;
  limit?: number;
  offset?: number;
}

export class MemoryModel {
  static async create(input: CreateMemoryInput): Promise<Memory> {
    const id = uuidv4();
    const memory = await db.one(
      `INSERT INTO personal_memories
       (id, user_id, memory_type, title, content, metadata, related_entities, tags, source, reminder_enabled, reminder_date, reminder_recurrence)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.memory_type,
        input.title,
        input.content || null,
        JSON.stringify(input.metadata || {}),
        JSON.stringify(input.related_entities || []),
        JSON.stringify(input.tags || []),
        input.source || 'user',
        input.reminder_enabled || false,
        input.reminder_date || null,
        input.reminder_recurrence || null,
      ]
    );
    return memory;
  }

  static async findById(id: string, userId: string): Promise<Memory | null> {
    try {
      const memory = await db.one(
        'SELECT * FROM personal_memories WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      // Increment access count
      await db.none(
        'UPDATE personal_memories SET access_count = access_count + 1, last_accessed_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      );
      return memory;
    } catch (error) {
      return null;
    }
  }

  static async search(params: MemorySearchParams): Promise<Memory[]> {
    let query = 'SELECT * FROM personal_memories WHERE user_id = $1';
    const values: any[] = [params.user_id];
    let paramIndex = 2;

    if (!params.include_inactive) {
      query += ' AND is_active = true';
    }

    if (params.memory_type) {
      query += ` AND memory_type = $${paramIndex}`;
      values.push(params.memory_type);
      paramIndex++;
    }

    if (params.tags && params.tags.length > 0) {
      query += ` AND tags ?| $${paramIndex}`;
      values.push(params.tags);
      paramIndex++;
    }

    if (params.search_query) {
      query += ` AND (title ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`;
      values.push(`%${params.search_query}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (params.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(params.limit);
      paramIndex++;
    }

    if (params.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(params.offset);
      paramIndex++;
    }

    const memories = await db.manyOrNone(query, values);
    return memories || [];
  }

  static async update(id: string, userId: string, input: UpdateMemoryInput): Promise<Memory | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined) {
        if (typeof value === 'object') {
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
    const query = `UPDATE personal_memories SET ${fields.join(', ')} WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1} RETURNING *`;

    try {
      const memory = await db.one(query, values);
      return memory;
    } catch (error) {
      return null;
    }
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM personal_memories WHERE id = $1 AND user_id = $2', [id, userId]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async softDelete(id: string, userId: string): Promise<boolean> {
    try {
      await db.none(
        'UPDATE personal_memories SET is_active = false WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getUpcomingReminders(userId: string, daysAhead: number = 7): Promise<Memory[]> {
    const memories = await db.manyOrNone(
      `SELECT * FROM personal_memories
       WHERE user_id = $1
       AND reminder_enabled = true
       AND is_active = true
       AND reminder_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
       AND reminder_date >= CURRENT_DATE
       ORDER BY reminder_date ASC`,
      [userId]
    );
    return memories || [];
  }

  static async getByType(userId: string, memoryType: string): Promise<Memory[]> {
    const memories = await db.manyOrNone(
      'SELECT * FROM personal_memories WHERE user_id = $1 AND memory_type = $2 AND is_active = true ORDER BY created_at DESC',
      [userId, memoryType]
    );
    return memories || [];
  }

  // RAG-friendly method: Get memories relevant to a query
  static async getRelevantMemories(userId: string, query: string, limit: number = 10): Promise<Memory[]> {
    // Simple keyword-based search; in production, would use vector embeddings
    const memories = await db.manyOrNone(
      `SELECT *,
        ts_rank(to_tsvector('english', title || ' ' || COALESCE(content, '')), plainto_tsquery('english', $2)) as relevance
       FROM personal_memories
       WHERE user_id = $1
       AND is_active = true
       AND (title ILIKE $3 OR content ILIKE $3 OR metadata::text ILIKE $3)
       ORDER BY relevance DESC, access_count DESC
       LIMIT $4`,
      [userId, query, `%${query}%`, limit]
    );
    return memories || [];
  }
}
