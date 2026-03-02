'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { MessageList } from '@/components/messaging/MessageList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { MessageComposer } from '@/components/messaging/MessageComposer';
import { MessageCircle } from 'lucide-react';

export default function MessagesPage() {
  const { user, token } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [showThread, setShowThread] = useState(false);

  if (!token || !user) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Please log in to access messages</p>
      </div>
    );
  }

  const handleSelectConversation = (userId: number, userName: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
    setShowThread(true);
  };

  const handleMessageSent = () => {
    // Refresh the thread and conversation list
    setRefreshKey((prev) => prev + 1);
  };

  const handleBack = () => {
    setShowThread(false);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
        <p className="text-muted-foreground">
          Communicate with farmers and retailers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Message List - Hidden on mobile when thread is shown */}
        <div className={`${showThread ? 'hidden md:block' : 'block'} md:col-span-1`}>
          <MessageList
            key={`list-${refreshKey}`}
            token={token}
            selectedUserId={selectedUserId || undefined}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Message Thread and Composer - Hidden on mobile when no conversation selected */}
        <div className={`${!showThread ? 'hidden md:flex' : 'flex'} md:col-span-2 flex-col gap-4`}>
          {selectedUserId ? (
            <>
              <div className="flex-1 min-h-0">
                <MessageThread
                  key={`thread-${selectedUserId}-${refreshKey}`}
                  userId={selectedUserId}
                  userName={selectedUserName}
                  currentUserId={user.id}
                  token={token}
                  onBack={handleBack}
                />
              </div>
              <MessageComposer
                recipientId={selectedUserId}
                token={token}
                onMessageSent={handleMessageSent}
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full border rounded-lg bg-muted/20">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
