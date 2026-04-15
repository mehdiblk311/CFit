import client from './client';

export const chatAPI = {
  // Send message to AI coach
  sendMessage: async ({ message, conversation_id }) => {
    const response = await client.post('/v1/chat', { message, conversation_id });
    return response.data;
  },

  // Get chat history (if available)
  getHistory: async (params = {}) => {
    const response = await client.get('/v1/chat/history', { params });
    return response.data;
  },

};
