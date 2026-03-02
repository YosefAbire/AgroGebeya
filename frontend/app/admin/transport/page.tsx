'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { TransportApprovalList } from '@/components/transport/TransportApprovalList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package } from 'lucide-react';

export default function AdminTransportPage() {
  const { token } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  if (!token) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Please log in to access this page</p>
      </div>
    );
  }

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Package className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Transport Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage transport requests and approvals
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          <TransportApprovalList
            key={refreshKey}
            token={token}
            onApprove={handleRefresh}
            onReject={handleRefresh}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
