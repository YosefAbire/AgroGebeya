'use client';

import { useAuth } from '@/hooks/use-auth';
import { AuditLogViewer } from '@/components/admin/AuditLogViewer';

export default function AdminAuditPage() {
  const { token } = useAuth();
  if (!token) return <p className="p-8 text-center text-muted-foreground">Please log in</p>;
  return (
    <div className="container mx-auto py-8">
      <AuditLogViewer token={token} />
    </div>
  );
}
