'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { messageService } from '@/lib/services/message-service';
import { Conversation } from '@/lib/types-extended';
import { MessageCircle, Search, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  token: string;
  selectedUserId?: number;
  onSelectConversation: (userId: number, userName: string) => void;
}

export function MessageList({ token, selectedUserId, onSelectConversation }: MessageListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConversations();
    // Refresh every 30 seconds
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter conversations based on search query
    if (searchQuery.trim()) {
      const filtered = conversations.filter((conv) =>
        conv.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      const data = await messageService.getConversations(token);
      setConversations(data);
      setFilteredConversations(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Messages
        </CardTitle>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No messages yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {!searchQuery && 'Start a conversation with farmers or retailers you have orders with'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.user_id}
                onClick={() => onSelectConversation(conversation.user_id, conversation.user_name)}
                className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                  selectedUserId === conversation.user_id ? 'bg-muted' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold truncate">{conversation.user_name}</p>
                      {conversation.unread_count > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {conversation.last_message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.last_message_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
