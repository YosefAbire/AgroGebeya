'use client';

import { useAuth } from '@/hooks/use-auth';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminFeedbackPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, router]);

  if (!user || !token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please log in to access this page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Feedback Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and manage user feedback, bug reports, and feature requests
        </p>
      </div>

      <FeedbackList token={token} isAdmin={true} />
    </div>
  );
}
