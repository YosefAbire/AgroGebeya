import { api } from '../api';
import { Message, MessageCreate, Conversation } from '../types-extended';

export const messageService = {
  // Send message
  send: async (data: MessageCreate, token: string): Promise<Message> => {
    return api.post<Message>('/api/v1/messages', data, token);
  },

  // Get conversations list
  getConversations: async (token: string): Promise<Conversation[]> => {
    return api.get<Conversation[]>('/api/v1/messages/conversations', token);
  },

  // Get conversation with specific user
  getConversation: async (userId: number, token: string): Promise<Message[]> => {
    return api.get<Message[]>(`/api/v1/messages/conversation/${userId}`, token);
  },

  // Mark message as read
  markAsRead: async (messageId: number, token: string): Promise<Message> => {
    return api.put<Message>(`/api/v1/messages/${messageId}/read`, {}, token);
  },

  // Get unread count
  getUnreadCount: async (token: string): Promise<{ unread_count: number }> => {
    return api.get<{ unread_count: number }>('/api/v1/messages/unread-count', token);
  },
};
