import client from './client';

export const notificationsAPI = {
  // Get all notifications
  getNotifications: async (params = {}) => {
    const response = await client.get('/v1/notifications', { params });
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await client.get('/v1/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notification_id) => {
    const response = await client.patch(`/v1/notifications/${notification_id}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await client.patch('/v1/notifications/read-all');
    return response.data;
  },
};
