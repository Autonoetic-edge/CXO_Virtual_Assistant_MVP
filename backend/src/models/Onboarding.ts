import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface OnboardingData {
  id: string;
  user_id: string;
  wake_up_time: string;
  sleep_time: string;
  work_start_time: string;
  work_end_time: string;
  break_schedule: {
    morning?: string;
    lunch?: string;
    evening?: string;
  };
  habits_to_track: string[];
  habit_reminder_frequency: string;
  important_dates: Array<{
    type: string;
    name: string;
    date: string;
  }>;
  communication_tone: string;
  productivity_style: string;
  preferred_briefing_detail: string;
  motivation_style: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  onboarding_completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateOnboardingInput {
  wake_up_time?: string;
  sleep_time?: string;
  work_start_time?: string;
  work_end_time?: string;
  break_schedule?: object;
  habits_to_track?: string[];
  habit_reminder_frequency?: string;
  important_dates?: Array<{ type: string; name: string; date: string }>;
  communication_tone?: string;
  productivity_style?: string;
  preferred_briefing_detail?: string;
  motivation_style?: string;
  onboarding_step?: number;
  onboarding_completed?: boolean;
}

export class OnboardingModel {
  static async findByUserId(userId: string): Promise<OnboardingData | null> {
    try {
      const onboarding = await db.one(
        'SELECT * FROM user_onboarding WHERE user_id = $1',
        [userId]
      );
      return onboarding;
    } catch (error) {
      return null;
    }
  }

  static async create(userId: string): Promise<OnboardingData> {
    const id = uuidv4();
    const onboarding = await db.one(
      `INSERT INTO user_onboarding (id, user_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, userId]
    );
    return onboarding;
  }

  static async update(userId: string, input: UpdateOnboardingInput): Promise<OnboardingData | null> {
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
      return this.findByUserId(userId);
    }

    values.push(userId);
    const query = `UPDATE user_onboarding SET ${fields.join(', ')} WHERE user_id = $${paramIndex} RETURNING *`;

    try {
      const onboarding = await db.one(query, values);
      return onboarding;
    } catch (error) {
      return null;
    }
  }

  static async completeOnboarding(userId: string): Promise<OnboardingData | null> {
    try {
      const onboarding = await db.one(
        `UPDATE user_onboarding
         SET onboarding_completed = true, onboarding_completed_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING *`,
        [userId]
      );
      return onboarding;
    } catch (error) {
      return null;
    }
  }

  static async getOrCreate(userId: string): Promise<OnboardingData> {
    let onboarding = await this.findByUserId(userId);
    if (!onboarding) {
      onboarding = await this.create(userId);
    }
    return onboarding;
  }
}
