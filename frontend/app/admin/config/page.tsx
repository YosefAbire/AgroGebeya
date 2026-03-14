'use client';

import { useAuth } from '@/hooks/use-auth';
import { ConfigurationPanel } from '@/components/admin/ConfigurationPanel';

export default function AdminConfigPage() {
  const { token } = useAuth();
  if (!token) return <p className="p-8 text-center text-muted-foreground">Please log in</p>;
  return (
    <div className="container mx-auto py-8">
      <ConfigurationPanel token={token} />
    </div>
  );
}
