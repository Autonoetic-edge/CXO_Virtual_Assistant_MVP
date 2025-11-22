import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  timezone: string;
  work_hours_start: string;
  work_hours_end: string;
  primary_calendar_id?: string;
  language: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserInput {
  email: string;
  first_name: string;
  last_name: string;
  timezone?: string;
  language?: string;
}

export interface UpdateUserInput {
  first_name?: string;
  last_name?: string;
  timezone?: string;
  work_hours_start?: string;
  work_hours_end?: string;
  primary_calendar_id?: string;
  language?: string;
}

export class UserModel {
  static async create(input: CreateUserInput): Promise<User> {
    const id = uuidv4();
    const user = await db.one(
      `INSERT INTO users (id, email, first_name, last_name, timezone, language)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, input.email, input.first_name, input.last_name, input.timezone || 'Asia/Kolkata', input.language || 'en']
    );
    return user;
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const user = await db.one('SELECT * FROM users WHERE id = $1', [id]);
      return user;
    } catch (error) {
      return null;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.one('SELECT * FROM users WHERE email = $1', [email]);
      return user;
    } catch (error) {
      return null;
    }
  }

  static async update(id: string, input: UpdateUserInput): Promise<User | null> {
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
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    try {
      const user = await db.one(query, values);
      return user;
    } catch (error) {
      return null;
    }
  }

  static async updateLastLogin(id: string): Promise<void> {
    await db.none('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [id]);
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM users WHERE id = $1', [id]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async list(limit: number = 100, offset: number = 0): Promise<User[]> {
    const users = await db.manyOrNone('SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [
      limit,
      offset,
    ]);
    return users || [];
  }
}
