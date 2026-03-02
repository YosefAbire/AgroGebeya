'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { messageService } from '@/lib/services/message-service';
import { MessageCreate } from '@/lib/types-extended';
import { Send } from 'lucide-react';
import { toast } from 'sonner';

interface MessageComposerProps {
  recipientId: number;
  token: string;
  onMessageSent?: () => void;
}

const MAX_MESSAGE_LENGTH = 2000;

export function MessageComposer({ recipientId, token, onMessageSent }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    setSending(true);
    setError(null);

    try {
      const messageData: MessageCreate = {
        recipient_id: recipientId,
        content: content.trim(),
      };

      await messageService.send(messageData, token);
      setContent('');
      toast.success('Message sent');
      onMessageSent?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const remainingChars = MAX_MESSAGE_LENGTH - content.length;
  const isNearLimit = remainingChars < 100;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message... (Ctrl+Enter to send)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={sending}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p
              className={`text-xs ${
                isNearLimit ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              {remainingChars} characters remaining
            </p>
            <Button onClick={handleSend} disabled={sending || !content.trim()} size="sm">
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
