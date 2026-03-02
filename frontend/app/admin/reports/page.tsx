'use client';

import { useAuth } from '@/hooks/use-auth';
import { ReportGenerator } from '@/components/admin/ReportGenerator';
import { FileText } from 'lucide-react';

export default function AdminReportsPage() {
  const { token } = useAuth();

  if (!token) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Please log in to access this page</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Generate and export platform reports
        </p>
      </div>

      <ReportGenerator token={token} />
    </div>
  );
}
