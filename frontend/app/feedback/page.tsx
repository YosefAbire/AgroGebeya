'use client';

import { useAuth } from '@/hooks/use-auth';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare } from 'lucide-react';

export default function FeedbackPage() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to submit feedback
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8" />
          Feedback
        </h1>
        <p className="text-muted-foreground mt-2">
          Share your thoughts, report bugs, or suggest new features
        </p>
      </div>

      <Tabs defaultValue="submit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
          <TabsTrigger value="history">My Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <FeedbackForm token={token} />
        </TabsContent>

        <TabsContent value="history">
          <FeedbackList token={token} isAdmin={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
