'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { notificationService } from '@/lib/services/notification-service';
import { Notification } from '@/lib/types-extended';
import { formatDistanceToNow } from 'date-fns';
import { useWebSocket } from '@/hooks/use-websocket';
import { toast } from 'sonner';

interface NotificationBellProps {
  token: string;
}

export function NotificationBell({ token }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [localUnreadCount, setLocalUnreadCount] = useState(0);

  // Enable WebSocket for real-time notifications
  const { unreadCount: wsUnreadCount, markAsRead: wsMarkAsRead, isConnected } = useWebSocket({
    token,
    onNotification: (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      toast(notification.title, {
        description: notification.message,
      });
    },
    autoReconnect: true,
  });

  // Use WebSocket count if connected, otherwise use local count
  const unreadCount = isConnected ? wsUnreadCount : localUnreadCount;

  useEffect(() => {
    // Only load if we have a valid token
    if (!token) {
      setLoading(false);
      return;
    }
    
    loadNotifications();
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds as fallback
    const interval = setInterval(() => {
      if (!isConnected && token) {
        loadNotifications();
        loadUnreadCount();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isConnected, token]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.list(token, 0, 10);
      setNotifications(data);
    } catch (error: any) {
      // Silently handle authentication errors (expected when not logged in)
      if (!error.message?.includes('Could not validate credentials')) {
        console.error('Failed to load notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { unread_count } = await notificationService.getUnreadCount(token);
      setLocalUnreadCount(unread_count);
    } catch (error: any) {
      // Silently handle authentication errors (expected when not logged in)
      if (!error.message?.includes('Could not validate credentials')) {
        console.error('Failed to load unread count:', error);
      }
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId, token);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setLocalUnreadCount((prev) => Math.max(0, prev - 1));
      
      // Also mark via WebSocket if connected
      if (isConnected) {
        wsMarkAsRead(notificationId);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setLocalUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''}`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm">{notification.title}</p>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
