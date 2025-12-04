import api from './api';

export const integrationService = {
  // Get all integrations
  getIntegrations: async () => {
    const response = await api.get('/integrations');
    return response.data;
  },

  // Get a specific integration
  getIntegration: async (type) => {
    const response = await api.get(`/integrations/${type}`);
    return response.data;
  },

  // Connect Notion
  connectNotion: async (apiKey, workspaceName) => {
    const response = await api.post('/integrations/notion', {
      api_key: apiKey,
      workspace_name: workspaceName,
    });
    return response.data;
  },

  // Connect Trello
  connectTrello: async (apiKey, apiToken) => {
    const response = await api.post('/integrations/trello', {
      api_key: apiKey,
      api_token: apiToken,
    });
    return response.data;
  },

  // Sync Notion tasks
  syncNotion: async () => {
    const response = await api.post('/integrations/notion/sync');
    return response.data;
  },

  // Sync Trello tasks
  syncTrello: async () => {
    const response = await api.post('/integrations/trello/sync');
    return response.data;
  },

  // Toggle integration
  toggleIntegration: async (type) => {
    const response = await api.patch(`/integrations/${type}/toggle`);
    return response.data;
  },

  // Delete integration
  deleteIntegration: async (type) => {
    const response = await api.delete(`/integrations/${type}`);
    return response.data;
  },
};
