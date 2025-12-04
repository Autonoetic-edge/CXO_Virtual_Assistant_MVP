import api from './api';

export const workflowService = {
  // Get today's workflow
  getTodayWorkflow: async () => {
    const response = await api.get('/workflows/today');
    return response.data;
  },

  // Get morning briefing
  getMorningBriefing: async () => {
    const response = await api.get('/workflows/morning');
    return response.data;
  },

  // Get midday update
  getMiddayUpdate: async () => {
    const response = await api.get('/workflows/midday');
    return response.data;
  },

  // Get evening reflection
  getEveningReflection: async () => {
    const response = await api.get('/workflows/evening');
    return response.data;
  },

  // Get workflow for a specific date
  getWorkflow: async (date, type) => {
    const response = await api.get(`/workflows/${date}/${type}`);
    return response.data;
  },

  // Mark workflow as viewed
  markAsViewed: async (id) => {
    const response = await api.post(`/workflows/${id}/viewed`);
    return response.data;
  },
};
