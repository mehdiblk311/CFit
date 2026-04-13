import client from './client';

export const chatAPI = {
  // Send message to AI coach
  sendMessage: async (messages) => {
    const response = await client.post('/v1/chat', { messages });
    return response.data;
  },

  // Get chat history (if available)
  getHistory: async (params = {}) => {
    const response = await client.get('/v1/chat/history', { params });
    return response.data;
  },

  // Clear chat history
  clearHistory: async () => {
    const response = await client.delete('/v1/chat/history');
    return response.data;
  },
};
