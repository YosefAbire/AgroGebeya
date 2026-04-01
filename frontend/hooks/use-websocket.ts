import { useEffect, useRef, useState, useCallback } from 'react';
import { Notification, WebSocketMessage } from '@/lib/types-extended';

interface UseWebSocketOptions {
  token: string | null;
  onNotification?: (notification: Notification) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
}

export function useWebSocket({
  token,
  onNotification,
  onConnect,
  onDisconnect,
  autoReconnect = true,
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const pingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
      const ws = new WebSocket(`${wsUrl}/api/v1/ws/notifications?token=${token}`);

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        setIsConnected(true);
        onConnect?.();

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'connected':
              console.log('WebSocket connection confirmed');
              break;

            case 'notification':
              if (message.data) {
                onNotification?.(message.data);
                setUnreadCount((prev) => prev + 1);
              }
              break;

            case 'unread_notifications':
              if (message.count !== undefined) {
                setUnreadCount(message.count);
              }
              if (message.notifications) {
                message.notifications.forEach((notif) => onNotification?.(notif));
              }
              break;

            case 'pong':
              // Keep-alive response
              break;

            case 'marked_read':
              setUnreadCount((prev) => Math.max(0, prev - 1));
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = () => {
        // Silently handle - expected when backend is unavailable
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        onDisconnect?.();

        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Don't reconnect on auth failure (4001) or if disabled
        if (!autoReconnect || event.code === 4001) return;

        reconnectAttemptsRef.current += 1;
        if (reconnectAttemptsRef.current > MAX_RECONNECT_ATTEMPTS) return;

        // Exponential backoff: 5s, 10s, 20s, 40s, 80s
        const delay = Math.min(5000 * Math.pow(2, reconnectAttemptsRef.current - 1), 60000);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      };

      wsRef.current = ws;
    } catch (error) {
      console.log('WebSocket not available:', error);
      // Don't throw error, just log it
    }
  }, [token, onNotification, onConnect, onDisconnect, autoReconnect]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
  }, []);

  const markAsRead = useCallback((notificationId: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(`mark_read:${notificationId}`);
    }
  }, []);

  useEffect(() => {
    if (token) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    isConnected,
    unreadCount,
    markAsRead,
    reconnect: connect,
    disconnect,
  };
}
