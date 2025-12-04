import { db } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Simple encryption for API keys (in production, use a proper secrets manager)
const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || 'cxo-default-encryption-key-32ch';
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export interface IntegrationKey {
  id: string;
  user_id: string;
  integration_type: string;
  api_key_encrypted?: string;
  api_secret_encrypted?: string;
  access_token_encrypted?: string;
  refresh_token_encrypted?: string;
  oauth_provider?: string;
  oauth_account_id?: string;
  oauth_account_email?: string;
  token_expires_at?: Date;
  config: Record<string, any>;
  workspace_id?: string;
  workspace_name?: string;
  is_active: boolean;
  last_validated_at?: Date;
  validation_status: string;
  last_sync_at?: Date;
  sync_status: string;
  sync_error?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIntegrationKeyInput {
  user_id: string;
  integration_type: string;
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  oauth_provider?: string;
  oauth_account_id?: string;
  oauth_account_email?: string;
  token_expires_at?: Date | string;
  config?: Record<string, any>;
  workspace_id?: string;
  workspace_name?: string;
}

export interface UpdateIntegrationKeyInput {
  api_key?: string;
  api_secret?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date | string;
  config?: Record<string, any>;
  workspace_id?: string;
  workspace_name?: string;
  is_active?: boolean;
  validation_status?: string;
  sync_status?: string;
  sync_error?: string;
}

export class IntegrationKeyModel {
  static async create(input: CreateIntegrationKeyInput): Promise<IntegrationKey> {
    const id = uuidv4();
    const integration = await db.one(
      `INSERT INTO user_integration_keys
       (id, user_id, integration_type, api_key_encrypted, api_secret_encrypted, access_token_encrypted, refresh_token_encrypted, oauth_provider, oauth_account_id, oauth_account_email, token_expires_at, config, workspace_id, workspace_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $14)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.integration_type,
        input.api_key ? encrypt(input.api_key) : null,
        input.api_secret ? encrypt(input.api_secret) : null,
        input.access_token ? encrypt(input.access_token) : null,
        input.refresh_token ? encrypt(input.refresh_token) : null,
        input.oauth_provider || null,
        input.oauth_account_id || null,
        input.oauth_account_email || null,
        input.token_expires_at || null,
        JSON.stringify(input.config || {}),
        input.workspace_id || null,
        input.workspace_name || null,
      ]
    );
    return integration;
  }

  static async findByUserAndType(userId: string, integrationType: string): Promise<IntegrationKey | null> {
    try {
      const integration = await db.one(
        'SELECT * FROM user_integration_keys WHERE user_id = $1 AND integration_type = $2',
        [userId, integrationType]
      );
      return integration;
    } catch (error) {
      return null;
    }
  }

  static async findByUserId(userId: string): Promise<IntegrationKey[]> {
    const integrations = await db.manyOrNone(
      'SELECT * FROM user_integration_keys WHERE user_id = $1 ORDER BY integration_type',
      [userId]
    );
    return integrations || [];
  }

  static async update(userId: string, integrationType: string, input: UpdateIntegrationKeyInput): Promise<IntegrationKey | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Handle encrypted fields
    if (input.api_key !== undefined) {
      fields.push(`api_key_encrypted = $${paramIndex}`);
      values.push(input.api_key ? encrypt(input.api_key) : null);
      paramIndex++;
    }
    if (input.api_secret !== undefined) {
      fields.push(`api_secret_encrypted = $${paramIndex}`);
      values.push(input.api_secret ? encrypt(input.api_secret) : null);
      paramIndex++;
    }
    if (input.access_token !== undefined) {
      fields.push(`access_token_encrypted = $${paramIndex}`);
      values.push(input.access_token ? encrypt(input.access_token) : null);
      paramIndex++;
    }
    if (input.refresh_token !== undefined) {
      fields.push(`refresh_token_encrypted = $${paramIndex}`);
      values.push(input.refresh_token ? encrypt(input.refresh_token) : null);
      paramIndex++;
    }

    // Handle other fields
    const otherFields = ['token_expires_at', 'workspace_id', 'workspace_name', 'is_active', 'validation_status', 'sync_status', 'sync_error'];
    otherFields.forEach((key) => {
      const value = (input as any)[key];
      if (value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (input.config !== undefined) {
      fields.push(`config = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(input.config));
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findByUserAndType(userId, integrationType);
    }

    values.push(userId, integrationType);
    const query = `UPDATE user_integration_keys SET ${fields.join(', ')} WHERE user_id = $${paramIndex} AND integration_type = $${paramIndex + 1} RETURNING *`;

    try {
      const integration = await db.one(query, values);
      return integration;
    } catch (error) {
      return null;
    }
  }

  static async upsert(input: CreateIntegrationKeyInput): Promise<IntegrationKey> {
    const existing = await this.findByUserAndType(input.user_id, input.integration_type);
    if (existing) {
      const updated = await this.update(input.user_id, input.integration_type, {
        api_key: input.api_key,
        api_secret: input.api_secret,
        access_token: input.access_token,
        refresh_token: input.refresh_token,
        config: input.config,
        workspace_id: input.workspace_id,
        workspace_name: input.workspace_name,
      });
      return updated || existing;
    }
    return this.create(input);
  }

  static async delete(userId: string, integrationType: string): Promise<boolean> {
    try {
      await db.none('DELETE FROM user_integration_keys WHERE user_id = $1 AND integration_type = $2', [userId, integrationType]);
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getDecryptedApiKey(userId: string, integrationType: string): Promise<string | null> {
    const integration = await this.findByUserAndType(userId, integrationType);
    if (integration?.api_key_encrypted) {
      return decrypt(integration.api_key_encrypted);
    }
    return null;
  }

  static async getDecryptedAccessToken(userId: string, integrationType: string): Promise<string | null> {
    const integration = await this.findByUserAndType(userId, integrationType);
    if (integration?.access_token_encrypted) {
      return decrypt(integration.access_token_encrypted);
    }
    return null;
  }

  static async updateSyncStatus(userId: string, integrationType: string, status: string, error?: string): Promise<void> {
    await db.none(
      `UPDATE user_integration_keys SET sync_status = $1, sync_error = $2, last_sync_at = CURRENT_TIMESTAMP WHERE user_id = $3 AND integration_type = $4`,
      [status, error || null, userId, integrationType]
    );
  }

  static async updateValidationStatus(userId: string, integrationType: string, status: string): Promise<void> {
    await db.none(
      `UPDATE user_integration_keys SET validation_status = $1, last_validated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND integration_type = $3`,
      [status, userId, integrationType]
    );
  }
}
