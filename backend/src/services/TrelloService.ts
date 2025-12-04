import axios from 'axios';
import { TaskModel } from '../models/Task';
import logger from '../utils/logger';

const TRELLO_API_URL = 'https://api.trello.com/1';

export class TrelloService {
  private apiKey: string;
  private apiToken: string;

  constructor(apiKey: string, apiToken: string) {
    this.apiKey = apiKey;
    this.apiToken = apiToken;
  }

  private getAuthParams(): string {
    return `key=${this.apiKey}&token=${this.apiToken}`;
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${TRELLO_API_URL}/members/me?${this.getAuthParams()}`
      );
      return response.status === 200;
    } catch (error) {
      logger.error('Trello connection validation failed:', error);
      return false;
    }
  }

  async getUserInfo(): Promise<{ id: string; fullName: string; username: string } | null> {
    try {
      const response = await axios.get(
        `${TRELLO_API_URL}/members/me?${this.getAuthParams()}`
      );
      return {
        id: response.data.id,
        fullName: response.data.fullName,
        username: response.data.username,
      };
    } catch (error) {
      logger.error('Failed to get Trello user info:', error);
      return null;
    }
  }

  async getBoards(): Promise<any[]> {
    try {
      const response = await axios.get(
        `${TRELLO_API_URL}/members/me/boards?${this.getAuthParams()}&fields=id,name,closed,url`
      );
      return response.data.filter((board: any) => !board.closed);
    } catch (error) {
      logger.error('Failed to get Trello boards:', error);
      return [];
    }
  }

  async getBoardLists(boardId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${TRELLO_API_URL}/boards/${boardId}/lists?${this.getAuthParams()}&fields=id,name,closed`
      );
      return response.data.filter((list: any) => !list.closed);
    } catch (error) {
      logger.error(`Failed to get lists for board ${boardId}:`, error);
      return [];
    }
  }

  async getListCards(listId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${TRELLO_API_URL}/lists/${listId}/cards?${this.getAuthParams()}&fields=id,name,desc,due,closed,url,labels`
      );
      return response.data.filter((card: any) => !card.closed);
    } catch (error) {
      logger.error(`Failed to get cards for list ${listId}:`, error);
      return [];
    }
  }

  async getBoardCards(boardId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${TRELLO_API_URL}/boards/${boardId}/cards?${this.getAuthParams()}&fields=id,name,desc,due,closed,url,labels,idList`
      );
      return response.data.filter((card: any) => !card.closed);
    } catch (error) {
      logger.error(`Failed to get cards for board ${boardId}:`, error);
      return [];
    }
  }

  async syncTasks(userId: string): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      const boards = await this.getBoards();

      for (const board of boards) {
        try {
          const lists = await this.getBoardLists(board.id);
          const cards = await this.getBoardCards(board.id);

          // Create a map of list IDs to names
          const listMap: Record<string, string> = {};
          lists.forEach((list) => {
            listMap[list.id] = list.name;
          });

          for (const card of cards) {
            try {
              const listName = listMap[card.idList] || 'Trello';

              // Determine priority from labels
              let priority = 'medium';
              if (card.labels?.length > 0) {
                const labelNames = card.labels.map((l: any) => l.name?.toLowerCase() || l.color);
                if (labelNames.some((n: string) => n.includes('urgent') || n.includes('red'))) {
                  priority = 'urgent';
                } else if (labelNames.some((n: string) => n.includes('high') || n.includes('orange'))) {
                  priority = 'high';
                } else if (labelNames.some((n: string) => n.includes('low') || n.includes('green'))) {
                  priority = 'low';
                }
              }

              // Determine status based on list name
              let status = 'pending';
              const listNameLower = listName.toLowerCase();
              if (listNameLower.includes('done') || listNameLower.includes('complete')) {
                status = 'completed';
              } else if (listNameLower.includes('progress') || listNameLower.includes('doing')) {
                status = 'in_progress';
              }

              await TaskModel.upsertFromExternal({
                user_id: userId,
                title: card.name,
                description: card.desc || undefined,
                due_date: card.due ? card.due.split('T')[0] : undefined,
                priority,
                external_source: 'trello',
                external_id: card.id,
                external_url: card.url,
                category: board.name,
                list_name: listName,
              });
              synced++;
            } catch (cardError) {
              logger.error(`Failed to sync Trello card ${card.id}:`, cardError);
              errors++;
            }
          }
        } catch (boardError) {
          logger.error(`Failed to sync Trello board ${board.id}:`, boardError);
          errors++;
        }
      }
    } catch (error) {
      logger.error('Failed to sync Trello tasks:', error);
      throw error;
    }

    return { synced, errors };
  }

  async createCard(listId: string, card: { name: string; desc?: string; due?: string }): Promise<any> {
    try {
      const response = await axios.post(
        `${TRELLO_API_URL}/cards?${this.getAuthParams()}`,
        {
          idList: listId,
          name: card.name,
          desc: card.desc,
          due: card.due,
        }
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to create Trello card:', error);
      throw error;
    }
  }

  async updateCard(cardId: string, updates: { name?: string; desc?: string; due?: string; closed?: boolean }): Promise<any> {
    try {
      const response = await axios.put(
        `${TRELLO_API_URL}/cards/${cardId}?${this.getAuthParams()}`,
        updates
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to update Trello card ${cardId}:`, error);
      throw error;
    }
  }

  async moveCard(cardId: string, listId: string): Promise<any> {
    try {
      const response = await axios.put(
        `${TRELLO_API_URL}/cards/${cardId}?${this.getAuthParams()}`,
        { idList: listId }
      );
      return response.data;
    } catch (error) {
      logger.error(`Failed to move Trello card ${cardId}:`, error);
      throw error;
    }
  }

  async archiveCard(cardId: string): Promise<any> {
    return this.updateCard(cardId, { closed: true });
  }
}
