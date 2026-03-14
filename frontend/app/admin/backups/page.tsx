'use client';

import { useAuth } from '@/hooks/use-auth';
import { BackupManagement } from '@/components/admin/BackupManagement';

export default function AdminBackupsPage() {
  const { token } = useAuth();
  if (!token) return <p className="p-8 text-center text-muted-foreground">Please log in</p>;
  return (
    <div className="container mx-auto py-8">
      <BackupManagement token={token} />
    </div>
  );
}
