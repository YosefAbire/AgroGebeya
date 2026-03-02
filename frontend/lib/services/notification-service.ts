import { api } from '../api';
import { Notification, NotificationPreferences } from '../types-extended';

export const notificationService = {
  // Get notifications
  list: async (token: string, skip: number = 0, limit: number = 50): Promise<Notification[]> => {
    const params = new URLSearchParams({
      offset: skip.toString(),
      limit: limit.toString(),
    });
    return api.get<Notification[]>(`/api/notifications?${params}`, token);
  },

  // Get unread count
  getUnreadCount: async (token: string): Promise<{ unread_count: number }> => {
    return api.get<{ unread_count: number }>('/api/notifications/unread-count', token);
  },

  // Mark as read
  markAsRead: async (notificationId: number, token: string): Promise<Notification> => {
    return api.put<Notification>(`/api/notifications/${notificationId}/read`, {}, token);
  },

  // Mark all as read
  markAllAsRead: async (token: string): Promise<{ message: string }> => {
    return api.put<{ message: string }>('/api/notifications/read-all', {}, token);
  },

  // Get preferences
  getPreferences: async (token: string): Promise<NotificationPreferences> => {
    return api.get<NotificationPreferences>('/api/notifications/preferences', token);
  },

  // Update preferences
  updatePreferences: async (
    data: Partial<NotificationPreferences>,
    token: string
  ): Promise<NotificationPreferences> => {
    return api.put<NotificationPreferences>('/api/notifications/preferences', data, token);
  },
};
