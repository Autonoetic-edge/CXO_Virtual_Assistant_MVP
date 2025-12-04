import api from './api';

export const taskService = {
  // Get all tasks
  getTasks: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },

  // Get task by ID
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create a new task
  createTask: async (task) => {
    const response = await api.post('/tasks', task);
    return response.data;
  },

  // Update a task
  updateTask: async (id, updates) => {
    const response = await api.put(`/tasks/${id}`, updates);
    return response.data;
  },

  // Complete a task
  completeTask: async (id) => {
    const response = await api.post(`/tasks/${id}/complete`);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get task lists
  getLists: async () => {
    const response = await api.get('/tasks/lists');
    return response.data;
  },

  // Get overdue tasks
  getOverdue: async () => {
    const response = await api.get('/tasks/overdue');
    return response.data;
  },

  // Get today's tasks
  getToday: async () => {
    const response = await api.get('/tasks/today');
    return response.data;
  },

  // Reorder tasks
  reorderTasks: async (listName, taskIds) => {
    const response = await api.post('/tasks/reorder', { list_name: listName, task_ids: taskIds });
    return response.data;
  },
};
