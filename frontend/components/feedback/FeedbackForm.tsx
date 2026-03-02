'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { feedbackService } from '@/lib/services/feedback-service';
import { FeedbackCreate, FeedbackType } from '@/lib/types-extended';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackFormProps {
  token: string;
  onSuccess?: () => void;
}

const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 2000;

export function FeedbackForm({ token, onSuccess }: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>(FeedbackType.GENERAL_FEEDBACK);
  const [description, setDescription] = useState('');
  const [contactPreference, setContactPreference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (description.length < MIN_DESCRIPTION_LENGTH) {
      setError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`);
      return;
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const feedbackData: FeedbackCreate = {
        type,
        description: description.trim(),
        contact_preference: contactPreference.trim() || undefined,
      };

      await feedbackService.submit(feedbackData, token);
      setSuccess(true);
      toast.success('Feedback submitted successfully');
      
      // Reset form
      setDescription('');
      setContactPreference('');
      setType(FeedbackType.GENERAL_FEEDBACK);
      
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to submit feedback';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const remainingChars = MAX_DESCRIPTION_LENGTH - description.length;
  const isNearLimit = remainingChars < 100;

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thank You!</h3>
            <p className="text-muted-foreground mb-4">
              Your feedback has been submitted successfully. We appreciate your input!
            </p>
            <Button onClick={() => setSuccess(false)}>Submit Another</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Submit Feedback
        </CardTitle>
        <CardDescription>
          Help us improve by sharing your thoughts, reporting bugs, or suggesting features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="type">Feedback Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FeedbackType.BUG_REPORT}>🐛 Bug Report</SelectItem>
                <SelectItem value={FeedbackType.FEATURE_REQUEST}>💡 Feature Request</SelectItem>
                <SelectItem value={FeedbackType.GENERAL_FEEDBACK}>💬 General Feedback</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please describe your feedback in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              disabled={submitting}
              className="resize-none"
            />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                Minimum {MIN_DESCRIPTION_LENGTH} characters
              </span>
              <span className={isNearLimit ? 'text-destructive' : 'text-muted-foreground'}>
                {remainingChars} characters remaining
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Contact Preference (Optional)</Label>
            <Textarea
              id="contact"
              placeholder="How would you like us to follow up? (e.g., email, phone)"
              value={contactPreference}
              onChange={(e) => setContactPreference(e.target.value)}
              rows={2}
              disabled={submitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Leave your preferred contact method if you'd like us to follow up
            </p>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> You can submit up to 5 feedback items per day. Your feedback
              helps us improve the platform for everyone.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={submitting || description.length < MIN_DESCRIPTION_LENGTH} className="w-full">
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
