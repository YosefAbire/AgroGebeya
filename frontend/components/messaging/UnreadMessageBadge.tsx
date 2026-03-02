'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { messageService } from '@/lib/services/message-service';

interface UnreadMessageBadgeProps {
  token: string;
}

export function UnreadMessageBadge({ token }: UnreadMessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { unread_count } = await messageService.getUnreadCount(token);
      setUnreadCount(unread_count);
    } catch (error) {
      console.error('Failed to load unread message count:', error);
    }
  };

  if (unreadCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="ml-2">
      {unreadCount > 9 ? '9+' : unreadCount}
    </Badge>
  );
}
