'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { reportsService } from '@/lib/services/admin-service';
import {
  OrdersReport,
  RevenueReport,
  UsersReport,
  PaymentsReport,
  TransportReport,
} from '@/lib/types-extended';
import { FileText, Download, TrendingUp, Users, DollarSign, Package, Truck } from 'lucide-react';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  token: string;
}

type ReportType = 'orders' | 'revenue' | 'users' | 'payments' | 'transport';

export function ReportGenerator({ token }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState<ReportType>('orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let data;
      switch (reportType) {
        case 'orders':
          data = await reportsService.getOrdersReport(token, startDate, endDate);
          break;
        case 'revenue':
          data = await reportsService.getRevenueReport(token, startDate, endDate);
          break;
        case 'users':
          data = await reportsService.getUsersReport(token, startDate, endDate);
          break;
        case 'payments':
          data = await reportsService.getPaymentsReport(token, startDate, endDate);
          break;
        case 'transport':
          data = await reportsService.getTransportReport(token, startDate, endDate);
          break;
      }
      setReportData(data);
      toast.success('Report generated successfully');
    } catch (err: any) {
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
      setError(msg);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await reportsService.exportData(reportType, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Report exported successfully');
    } catch (err: any) {
      toast.error('Failed to export report');
    }
  };

  const getReportIcon = () => {
    switch (reportType) {
      case 'orders':
        return <Package className="h-5 w-5" />;
      case 'revenue':
        return <DollarSign className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      case 'payments':
        return <TrendingUp className="h-5 w-5" />;
      case 'transport':
        return <Truck className="h-5 w-5" />;
    }
  };

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Report Results</h3>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(reportData).map(([key, value]) => {
            if (typeof value === 'object' || Array.isArray(value)) return null;
            return (
              <Card key={key}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-2xl font-bold mt-2">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="report_type">Report Type</Label>
            <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
              <SelectTrigger id="report_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orders">Orders Report</SelectItem>
                <SelectItem value="revenue">Revenue Report</SelectItem>
                <SelectItem value="users">Users Report</SelectItem>
                <SelectItem value="payments">Payments Report</SelectItem>
                <SelectItem value="transport">Transport Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date (Optional)</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
          {getReportIcon()}
          <span className="ml-2">{loading ? 'Generating...' : 'Generate Report'}</span>
        </Button>

        {renderReportData()}
      </CardContent>
    </Card>
  );
}
