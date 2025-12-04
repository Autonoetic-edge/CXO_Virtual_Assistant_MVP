import api from './api';

export const reminderService = {
  // Get all reminders
  getReminders: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/reminders?${params.toString()}`);
    return response.data;
  },

  // Get reminder by ID
  getReminder: async (id) => {
    const response = await api.get(`/reminders/${id}`);
    return response.data;
  },

  // Create a new reminder
  createReminder: async (reminder) => {
    const response = await api.post('/reminders', reminder);
    return response.data;
  },

  // Update a reminder
  updateReminder: async (id, updates) => {
    const response = await api.put(`/reminders/${id}`, updates);
    return response.data;
  },

  // Complete a reminder
  completeReminder: async (id) => {
    const response = await api.post(`/reminders/${id}/complete`);
    return response.data;
  },

  // Snooze a reminder
  snoozeReminder: async (id, snoozeUntil) => {
    const response = await api.post(`/reminders/${id}/snooze`, { snooze_until: snoozeUntil });
    return response.data;
  },

  // Cancel a reminder
  cancelReminder: async (id) => {
    const response = await api.post(`/reminders/${id}/cancel`);
    return response.data;
  },

  // Delete a reminder
  deleteReminder: async (id) => {
    const response = await api.delete(`/reminders/${id}`);
    return response.data;
  },

  // Get upcoming reminders
  getUpcoming: async (hours = 24) => {
    const response = await api.get(`/reminders/upcoming?hours=${hours}`);
    return response.data;
  },

  // Get due reminders
  getDue: async () => {
    const response = await api.get('/reminders/due');
    return response.data;
  },
};
