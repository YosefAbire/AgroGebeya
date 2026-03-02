import { api } from '../api';
import {
  AuditLog,
  SecurityAlert,
  UserManagement,
  UserActivity,
  OrdersReport,
  RevenueReport,
  UsersReport,
  PaymentsReport,
  TransportReport,
  DashboardMetrics,
  SystemConfig,
  ConfigHistory,
  Backup,
} from '../types-extended';

// Audit Service
export const auditService = {
  // Get audit logs
  getLogs: async (
    token: string,
    skip: number = 0,
    limit: number = 50,
    action?: string,
    resourceType?: string,
    startDate?: string,
    endDate?: string
  ): Promise<AuditLog[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...(action && { action }),
      ...(resourceType && { resource_type: resourceType }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });
    return api.get<AuditLog[]>(`/api/v1/admin/audit-logs?${params}`, token);
  },

  // Get user's audit logs
  getUserLogs: async (userId: number, token: string): Promise<AuditLog[]> => {
    return api.get<AuditLog[]>(`/api/v1/admin/audit-logs/user/${userId}`, token);
  },

  // Get security alerts
  getAlerts: async (token: string): Promise<SecurityAlert[]> => {
    return api.get<SecurityAlert[]>('/api/v1/admin/audit-logs/alerts', token);
  },
};

// User Management Service
export const userManagementService = {
  // List/search users
  list: async (
    token: string,
    skip: number = 0,
    limit: number = 50,
    search?: string,
    role?: string,
    isActive?: boolean
  ): Promise<UserManagement[]> => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(role && { role }),
      ...(isActive !== undefined && { is_active: isActive.toString() }),
    });
    return api.get<UserManagement[]>(`/api/v1/admin/users?${params}`, token);
  },

  // Get user details
  get: async (userId: number, token: string): Promise<UserManagement> => {
    return api.get<UserManagement>(`/api/v1/admin/users/${userId}`, token);
  },

  // Activate user
  activate: async (userId: number, token: string): Promise<UserManagement> => {
    return api.put<UserManagement>(`/api/v1/admin/users/${userId}/activate`, {}, token);
  },

  // Deactivate user
  deactivate: async (userId: number, token: string): Promise<UserManagement> => {
    return api.put<UserManagement>(`/api/v1/admin/users/${userId}/deactivate`, {}, token);
  },

  // Reset password
  resetPassword: async (userId: number, token: string): Promise<{ new_password: string }> => {
    return api.post<{ new_password: string }>(
      `/api/v1/admin/users/${userId}/reset-password`,
      {},
      token
    );
  },

  // Change role
  changeRole: async (userId: number, role: string, token: string): Promise<UserManagement> => {
    return api.put<UserManagement>(`/api/v1/admin/users/${userId}/role`, { role }, token);
  },

  // Get user activity
  getActivity: async (userId: number, token: string): Promise<UserActivity> => {
    return api.get<UserActivity>(`/api/v1/admin/users/${userId}/activity`, token);
  },
};

// Reports Service
export const reportsService = {
  // Orders report
  getOrdersReport: async (
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<OrdersReport> => {
    const params = new URLSearchParams({
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });
    return api.get<OrdersReport>(`/api/v1/admin/reports/orders?${params}`, token);
  },

  // Revenue report
  getRevenueReport: async (
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<RevenueReport> => {
    const params = new URLSearchParams({
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });
    return api.get<RevenueReport>(`/api/v1/admin/reports/revenue?${params}`, token);
  },

  // Users report
  getUsersReport: async (
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<UsersReport> => {
    const params = new URLSearchParams({
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });
    return api.get<UsersReport>(`/api/v1/admin/reports/users?${params}`, token);
  },

  // Payments report
  getPaymentsReport: async (
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaymentsReport> => {
    const params = new URLSearchParams({
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });
    return api.get<PaymentsReport>(`/api/v1/admin/reports/payments?${params}`, token);
  },

  // Transport report
  getTransportReport: async (
    token: string,
    startDate?: string,
    endDate?: string
  ): Promise<TransportReport> => {
    const params = new URLSearchParams({
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    });
    return api.get<TransportReport>(`/api/v1/admin/reports/transport?${params}`, token);
  },

  // Dashboard metrics
  getDashboardMetrics: async (token: string): Promise<DashboardMetrics> => {
    return api.get<DashboardMetrics>('/api/v1/admin/reports/dashboard-metrics', token);
  },

  // Export data
  exportData: async (type: string, token: string, format: string = 'csv'): Promise<Blob> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/export/${type}?format=${format}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },
};

// Configuration Service
export const configService = {
  // Get all configurations
  getAll: async (token: string): Promise<SystemConfig[]> => {
    return api.get<SystemConfig[]>('/api/v1/admin/config', token);
  },

  // Get specific config
  get: async (key: string, token: string): Promise<SystemConfig> => {
    return api.get<SystemConfig>(`/api/v1/admin/config/${key}`, token);
  },

  // Update config
  update: async (key: string, value: string, token: string): Promise<SystemConfig> => {
    return api.put<SystemConfig>(`/api/v1/admin/config/${key}`, { value }, token);
  },

  // Export config
  exportConfig: async (token: string): Promise<Blob> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/config/export`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  },

  // Import config
  importConfig: async (file: File, token: string): Promise<{ imported_count: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/config/import`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
    if (!response.ok) throw new Error('Import failed');
    return response.json();
  },

  // Get history
  getHistory: async (token: string, key?: string): Promise<ConfigHistory[]> => {
    const params = key ? `?key=${key}` : '';
    return api.get<ConfigHistory[]>(`/api/v1/admin/config/history${params}`, token);
  },

  // Rollback
  rollback: async (versionId: number, token: string): Promise<SystemConfig> => {
    return api.post<SystemConfig>(`/api/v1/admin/config/rollback/${versionId}`, {}, token);
  },
};

// Backup Service
export const backupService = {
  // Create backup
  create: async (token: string): Promise<Backup> => {
    return api.post<Backup>('/api/v1/admin/backups/create', {}, token);
  },

  // List backups
  list: async (token: string): Promise<Backup[]> => {
    return api.get<Backup[]>('/api/v1/admin/backups', token);
  },

  // Download backup
  download: async (backupId: number, token: string): Promise<Blob> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/admin/backups/${backupId}/download`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  },

  // Restore backup
  restore: async (backupId: number, token: string): Promise<{ message: string }> => {
    return api.post<{ message: string }>(
      `/api/v1/admin/backups/${backupId}/restore`,
      {},
      token
    );
  },

  // Verify backup
  verify: async (backupId: number, token: string): Promise<{ is_valid: boolean }> => {
    return api.get<{ is_valid: boolean }>(
      `/api/v1/admin/backups/${backupId}/verify`,
      token
    );
  },
};
