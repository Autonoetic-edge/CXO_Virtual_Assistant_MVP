import axios from 'axios';
import { TaskModel } from '../models/Task';
import logger from '../utils/logger';

const NOTION_API_URL = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export class NotionService {
  private apiKey: string;
  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': NOTION_VERSION,
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${NOTION_API_URL}/users/me`, {
        headers: this.headers,
      });
      return response.status === 200;
    } catch (error) {
      logger.error('Notion connection validation failed:', error);
      return false;
    }
  }

  async getWorkspaceInfo(): Promise<{ id: string; name: string; databases: any[] } | null> {
    try {
      // Get user info
      const userResponse = await axios.get(`${NOTION_API_URL}/users/me`, {
        headers: this.headers,
      });

      // Search for databases
      const searchResponse = await axios.post(
        `${NOTION_API_URL}/search`,
        {
          filter: { property: 'object', value: 'database' },
          page_size: 100,
        },
        { headers: this.headers }
      );

      const databases = searchResponse.data.results.map((db: any) => ({
        id: db.id,
        title: db.title?.[0]?.plain_text || 'Untitled',
        url: db.url,
      }));

      return {
        id: userResponse.data.bot?.workspace_name || 'workspace',
        name: userResponse.data.bot?.workspace_name || userResponse.data.name || 'Notion Workspace',
        databases,
      };
    } catch (error) {
      logger.error('Failed to get Notion workspace info:', error);
      return null;
    }
  }

  async getDatabases(): Promise<any[]> {
    try {
      const response = await axios.post(
        `${NOTION_API_URL}/search`,
        {
          filter: { property: 'object', value: 'database' },
          page_size: 100,
        },
        { headers: this.headers }
      );

      return response.data.results;
    } catch (error) {
      logger.error('Failed to get Notion databases:', error);
      return [];
    }
  }

  async queryDatabase(databaseId: string, filter?: any): Promise<any[]> {
    try {
      const response = await axios.post(
        `${NOTION_API_URL}/databases/${databaseId}/query`,
        { filter, page_size: 100 },
        { headers: this.headers }
      );

      return response.data.results;
    } catch (error) {
      logger.error(`Failed to query Notion database ${databaseId}:`, error);
      return [];
    }
  }

  async syncTasks(userId: string): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const databases = await this.getDatabases();

      for (const db of databases) {
        // Look for task-like databases (ones with status, title, and due date properties)
        const props = db.properties;
        const hasTitle = Object.values(props).some((p: any) => p.type === 'title');
        const hasStatus = Object.values(props).some(
          (p: any) => p.type === 'status' || p.type === 'select' || p.type === 'checkbox'
        );

        if (!hasTitle) continue;

        try {
          const pages = await this.queryDatabase(db.id);

          for (const page of pages) {
            try {
              const taskData = this.parseNotionPageAsTask(page, db);
              if (taskData) {
                await TaskModel.upsertFromExternal({
                  user_id: userId,
                  title: taskData.title,
                  description: taskData.description,
                  due_date: taskData.dueDate,
                  priority: taskData.priority,
                  external_source: 'notion',
                  external_id: page.id,
                  external_url: page.url,
                  category: db.title?.[0]?.plain_text || 'Notion',
                });
                synced++;
              }
            } catch (pageError) {
              logger.error(`Failed to sync Notion page ${page.id}:`, pageError);
              errors++;
            }
          }
        } catch (dbError) {
          logger.error(`Failed to sync Notion database ${db.id}:`, dbError);
          errors++;
        }
      }
    } catch (error) {
      logger.error('Failed to sync Notion tasks:', error);
      throw error;
    }

    return { synced, errors };
  }

  private parseNotionPageAsTask(page: any, database: any): {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    status?: string;
  } | null {
    try {
      const props = page.properties;

      // Find title property
      let title = '';
      for (const [key, value] of Object.entries(props)) {
        const prop = value as any;
        if (prop.type === 'title' && prop.title?.length > 0) {
          title = prop.title.map((t: any) => t.plain_text).join('');
          break;
        }
      }

      if (!title) return null;

      // Find due date
      let dueDate: string | undefined;
      for (const [key, value] of Object.entries(props)) {
        const prop = value as any;
        if (prop.type === 'date' && prop.date?.start) {
          dueDate = prop.date.start.split('T')[0];
          break;
        }
      }

      // Find priority (look for select/multi_select with priority-like values)
      let priority = 'medium';
      for (const [key, value] of Object.entries(props)) {
        const prop = value as any;
        const keyLower = key.toLowerCase();
        if (
          (keyLower.includes('priority') || keyLower.includes('importance')) &&
          (prop.type === 'select' || prop.type === 'multi_select')
        ) {
          const val = prop.select?.name?.toLowerCase() || prop.multi_select?.[0]?.name?.toLowerCase();
          if (val?.includes('high') || val?.includes('urgent')) priority = 'high';
          else if (val?.includes('low')) priority = 'low';
          break;
        }
      }

      // Find description (rich text properties)
      let description: string | undefined;
      for (const [key, value] of Object.entries(props)) {
        const prop = value as any;
        const keyLower = key.toLowerCase();
        if (
          (keyLower.includes('description') || keyLower.includes('notes')) &&
          prop.type === 'rich_text'
        ) {
          description = prop.rich_text?.map((t: any) => t.plain_text).join('');
          break;
        }
      }

      return { title, description, dueDate, priority };
    } catch (error) {
      logger.error('Failed to parse Notion page:', error);
      return null;
    }
  }

  async createPage(databaseId: string, properties: any): Promise<any> {
    try {
      const response = await axios.post(
        `${NOTION_API_URL}/pages`,
        {
          parent: { database_id: databaseId },
          properties,
        },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to create Notion page:', error);
      throw error;
    }
  }

  async updatePage(pageId: string, properties: any): Promise<any> {
    try {
      const response = await axios.patch(
        `${NOTION_API_URL}/pages/${pageId}`,
        { properties },
        { headers: this.headers }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to update Notion page ${pageId}:`, error);
      throw error;
    }
  }
}
