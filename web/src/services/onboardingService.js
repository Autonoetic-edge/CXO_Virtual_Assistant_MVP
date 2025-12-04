import api from './api';

export const onboardingService = {
  // Get current onboarding status
  getOnboarding: async () => {
    const response = await api.get('/onboarding');
    return response.data;
  },

  // Update a specific step
  updateStep: async (step, data) => {
    const response = await api.put(`/onboarding/step/${step}`, data);
    return response.data;
  },

  // Complete onboarding
  completeOnboarding: async () => {
    const response = await api.post('/onboarding/complete');
    return response.data;
  },

  // General update
  updateOnboarding: async (data) => {
    const response = await api.put('/onboarding', data);
    return response.data;
  },
};
