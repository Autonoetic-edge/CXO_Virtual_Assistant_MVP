import api from './api';

export const memoryService = {
  // Get all memories
  getMemories: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/memories?${params.toString()}`);
    return response.data;
  },

  // Get memory by ID
  getMemory: async (id) => {
    const response = await api.get(`/memories/${id}`);
    return response.data;
  },

  // Create a new memory
  createMemory: async (memory) => {
    const response = await api.post('/memories', memory);
    return response.data;
  },

  // Quick "remember" command
  remember: async (text) => {
    const response = await api.post('/memories/remember', { text });
    return response.data;
  },

  // Search memories
  searchMemories: async (query, filters = {}) => {
    const params = new URLSearchParams({ q: query });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/memories/search?${params.toString()}`);
    return response.data;
  },

  // Get relevant memories (RAG)
  getRelevantMemories: async (query, limit = 10) => {
    const response = await api.get(`/memories/relevant?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Get memories by type
  getByType: async (type) => {
    const response = await api.get(`/memories/type/${type}`);
    return response.data;
  },

  // Get upcoming reminders
  getUpcomingReminders: async (days = 7) => {
    const response = await api.get(`/memories/upcoming-reminders?days=${days}`);
    return response.data;
  },

  // Update a memory
  updateMemory: async (id, updates) => {
    const response = await api.put(`/memories/${id}`, updates);
    return response.data;
  },

  // Delete a memory
  deleteMemory: async (id) => {
    const response = await api.delete(`/memories/${id}`);
    return response.data;
  },
};
