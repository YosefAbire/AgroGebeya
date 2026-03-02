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

  const connect = useCallback(() => {
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}/api/v1/ws/notifications?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        onConnect?.();

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 25000); // Ping every 25 seconds
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

      ws.onerror = (error) => {
        // Silently handle WebSocket errors - they're expected when backend is not running
        console.log('WebSocket connection unavailable');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onDisconnect?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        // Attempt to reconnect only if explicitly enabled
        if (autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 5000); // Reconnect after 5 seconds
        }
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
