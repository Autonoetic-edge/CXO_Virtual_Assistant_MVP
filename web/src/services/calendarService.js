import api from './api';

export const calendarService = {
  getCalendars: async () => {
    const response = await api.get('/calendars');
    return response.data;
  },

  syncCalendar: async (calendarId) => {
    const response = await api.get(`/calendars/${calendarId}/sync`);
    return response.data;
  },

  connectCalendar: async (provider) => {
    const response = await api.post(`/calendars/${provider}/connect`);
    return response.data;
  },
};

export const eventService = {
  getEvents: async (startDate, endDate) => {
    const response = await api.get('/events', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (eventId, eventData) => {
    const response = await api.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId) => {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },
};
