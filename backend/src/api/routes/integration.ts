import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validator';
import { IntegrationKeyModel } from '../../models/IntegrationKey';
import { NotionService } from '../../services/NotionService';
import { TrelloService } from '../../services/TrelloService';

const router = Router();

// Get all integrations for user
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const integrations = await IntegrationKeyModel.findByUserId(userId);

    // Remove sensitive data from response
    const sanitized = integrations.map((int) => ({
      id: int.id,
      integration_type: int.integration_type,
      workspace_name: int.workspace_name,
      is_active: int.is_active,
      validation_status: int.validation_status,
      sync_status: int.sync_status,
      last_sync_at: int.last_sync_at,
      created_at: int.created_at,
    }));

    res.json({ data: sanitized });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
});

// Get a specific integration
router.get('/:type', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const integration = await IntegrationKeyModel.findByUserAndType(userId, req.params.type);

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Remove sensitive data
    const sanitized = {
      id: integration.id,
      integration_type: integration.integration_type,
      workspace_name: integration.workspace_name,
      workspace_id: integration.workspace_id,
      is_active: integration.is_active,
      validation_status: integration.validation_status,
      sync_status: integration.sync_status,
      sync_error: integration.sync_error,
      last_sync_at: integration.last_sync_at,
      config: integration.config,
      created_at: integration.created_at,
    };

    res.json({ data: sanitized });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch integration' });
  }
});

// Create or update a Notion integration
router.post(
  '/notion',
  authenticate,
  validate([
    body('api_key').notEmpty().isString(),
    body('workspace_name').optional().isString(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { api_key, workspace_name } = req.body;

      // Validate the API key by testing connection
      const notionService = new NotionService(api_key);
      const isValid = await notionService.validateConnection();

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Notion API key' });
      }

      // Get workspace info
      const workspaceInfo = await notionService.getWorkspaceInfo();

      const integration = await IntegrationKeyModel.upsert({
        user_id: userId,
        integration_type: 'notion',
        api_key,
        workspace_name: workspace_name || workspaceInfo?.name || 'Notion Workspace',
        workspace_id: workspaceInfo?.id,
        config: { databases: workspaceInfo?.databases || [] },
      });

      await IntegrationKeyModel.updateValidationStatus(userId, 'notion', 'valid');

      res.json({
        message: 'Notion integration connected successfully',
        data: {
          integration_type: 'notion',
          workspace_name: integration.workspace_name,
          is_active: true,
          validation_status: 'valid',
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect Notion integration' });
    }
  }
);

// Create or update a Trello integration
router.post(
  '/trello',
  authenticate,
  validate([
    body('api_key').notEmpty().isString(),
    body('api_token').notEmpty().isString(),
  ]),
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { api_key, api_token } = req.body;

      // Validate the credentials by testing connection
      const trelloService = new TrelloService(api_key, api_token);
      const isValid = await trelloService.validateConnection();

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Trello credentials' });
      }

      // Get user info and boards
      const userInfo = await trelloService.getUserInfo();
      const boards = await trelloService.getBoards();

      const integration = await IntegrationKeyModel.upsert({
        user_id: userId,
        integration_type: 'trello',
        api_key,
        api_secret: api_token,
        workspace_name: userInfo?.fullName || 'Trello',
        workspace_id: userInfo?.id,
        config: { boards: boards || [] },
      });

      await IntegrationKeyModel.updateValidationStatus(userId, 'trello', 'valid');

      res.json({
        message: 'Trello integration connected successfully',
        data: {
          integration_type: 'trello',
          workspace_name: integration.workspace_name,
          is_active: true,
          validation_status: 'valid',
          boards: boards?.map((b: any) => ({ id: b.id, name: b.name })) || [],
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect Trello integration' });
    }
  }
);

// Sync Notion tasks
router.post('/notion/sync', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const apiKey = await IntegrationKeyModel.getDecryptedApiKey(userId, 'notion');
    if (!apiKey) {
      return res.status(400).json({ error: 'Notion integration not configured' });
    }

    await IntegrationKeyModel.updateSyncStatus(userId, 'notion', 'syncing');

    const notionService = new NotionService(apiKey);
    const result = await notionService.syncTasks(userId);

    await IntegrationKeyModel.updateSyncStatus(userId, 'notion', 'success');

    res.json({
      message: 'Notion sync completed',
      data: result,
    });
  } catch (error: any) {
    const userId = (req as any).user.id;
    await IntegrationKeyModel.updateSyncStatus(userId, 'notion', 'failed', error.message);
    res.status(500).json({ error: 'Failed to sync Notion tasks' });
  }
});

// Sync Trello tasks
router.post('/trello/sync', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const integration = await IntegrationKeyModel.findByUserAndType(userId, 'trello');
    if (!integration) {
      return res.status(400).json({ error: 'Trello integration not configured' });
    }

    const apiKey = await IntegrationKeyModel.getDecryptedApiKey(userId, 'trello');
    const apiToken = await IntegrationKeyModel.getDecryptedAccessToken(userId, 'trello');

    if (!apiKey || !apiToken) {
      return res.status(400).json({ error: 'Trello credentials not found' });
    }

    await IntegrationKeyModel.updateSyncStatus(userId, 'trello', 'syncing');

    const trelloService = new TrelloService(apiKey, apiToken);
    const result = await trelloService.syncTasks(userId);

    await IntegrationKeyModel.updateSyncStatus(userId, 'trello', 'success');

    res.json({
      message: 'Trello sync completed',
      data: result,
    });
  } catch (error: any) {
    const userId = (req as any).user.id;
    await IntegrationKeyModel.updateSyncStatus(userId, 'trello', 'failed', error.message);
    res.status(500).json({ error: 'Failed to sync Trello tasks' });
  }
});

// Toggle integration active status
router.patch(
  '/:type/toggle',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const integration = await IntegrationKeyModel.findByUserAndType(userId, req.params.type);

      if (!integration) {
        return res.status(404).json({ error: 'Integration not found' });
      }

      const updated = await IntegrationKeyModel.update(userId, req.params.type, {
        is_active: !integration.is_active,
      });

      res.json({
        message: `Integration ${updated?.is_active ? 'enabled' : 'disabled'}`,
        data: { is_active: updated?.is_active },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle integration' });
    }
  }
);

// Delete an integration
router.delete('/:type', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const deleted = await IntegrationKeyModel.delete(userId, req.params.type);

    if (!deleted) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    res.json({ message: 'Integration removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove integration' });
  }
});

export default router;
