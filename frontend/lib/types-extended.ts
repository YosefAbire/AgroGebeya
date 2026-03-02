// Extended types for all functional requirements

export * from './types';

// Verification Types
export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface VerificationRequest {
  id: number;
  user_id: number;
  national_id_encrypted: string;
  status: VerificationStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string;
}

export interface VerificationSubmit {
  national_id: string;
}

// Transaction Types
export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export interface Transaction {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  currency: string;
  status: TransactionStatus;
  chapa_transaction_ref?: string;
  chapa_checkout_url?: string;
  refund_transaction_id?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface PaymentInitializeRequest {
  order_id: number;
  return_url: string;
}

export interface PaymentInitializeResponse {
  transaction_id: number;
  checkout_url: string;
  transaction_ref: string;
}

// Transport Types
export enum TransportStatus {
  PENDING = 'pending',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ASSIGNED = 'assigned',
  REJECTED = 'rejected',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum VehicleType {
  MOTORCYCLE = 'motorcycle',
  CAR = 'car',
  VAN = 'van',
  TRUCK = 'truck',
}

export interface TransportRequest {
  id: number;
  order_id: number;
  requester_id: number;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_location: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  preferred_date: string;
  weight_kg: number;
  vehicle_type: string;
  special_instructions?: string;
  status: TransportStatus;
  tracking_number?: string;
  driver_name?: string;
  driver_phone?: string;
  estimated_delivery?: string;
  rejection_reason?: string;
  created_at: string;
  approved_at?: string;
}

export interface TransportRequestCreate {
  order_id: number;
  pickup_location: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  delivery_location: string;
  delivery_latitude?: number;
  delivery_longitude?: number;
  preferred_date: string;
  weight_kg: number;
  vehicle_type: string;
  special_instructions?: string;
}

// Message Types
export interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  order_id?: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageCreate {
  recipient_id: number;
  order_id?: number;
  content: string;
}

export interface Conversation {
  user_id: number;
  username: string;
  full_name?: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// Notification Types
export enum NotificationType {
  ORDER_STATUS_CHANGED = 'order_status_changed',
  PAYMENT_COMPLETED = 'payment_completed',
  TRANSPORT_STATUS_CHANGED = 'transport_status_changed',
  NEW_MESSAGE = 'new_message',
  VERIFICATION_STATUS_CHANGED = 'verification_status_changed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  order_updates: boolean;
  payment_updates: boolean;
  transport_updates: boolean;
  message_notifications: boolean;
}

// Feedback Types
export enum FeedbackType {
  BUG_REPORT = 'bug_report',
  FEATURE_REQUEST = 'feature_request',
  GENERAL_FEEDBACK = 'general_feedback',
}

export enum FeedbackStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
}

export interface Feedback {
  id: number;
  user_id: number;
  type: FeedbackType;
  description: string;
  contact_preference?: string;
  status: FeedbackStatus;
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  resolved_at?: string;
}

export interface FeedbackCreate {
  type: FeedbackType;
  description: string;
  contact_preference?: string;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource_type: string;
  resource_id?: number;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SecurityAlert {
  id: number;
  user_id?: number;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address?: string;
  created_at: string;
}

// Admin Types
export interface UserManagement {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  phone?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  verification_status: VerificationStatus;
  created_at: string;
  last_login?: string;
}

export interface UserActivity {
  login_count: number;
  last_login?: string;
  order_count: number;
  product_count: number;
  total_spent?: number;
  total_earned?: number;
}

// Report Types
export interface OrdersReport {
  total_orders: number;
  pending_orders: number;
  approved_orders: number;
  rejected_orders: number;
  delivered_orders: number;
  total_value: number;
  average_order_value: number;
  orders_by_date: Array<{ date: string; count: number; value: number }>;
}

export interface RevenueReport {
  total_revenue: number;
  revenue_by_date: Array<{ date: string; revenue: number }>;
  revenue_by_category: Array<{ category: string; revenue: number }>;
  top_products: Array<{ product_name: string; revenue: number; quantity: number }>;
}

export interface UsersReport {
  total_users: number;
  farmers_count: number;
  retailers_count: number;
  verified_users: number;
  active_users: number;
  registrations_by_date: Array<{ date: string; count: number }>;
}

export interface PaymentsReport {
  total_transactions: number;
  successful_payments: number;
  failed_payments: number;
  pending_payments: number;
  success_rate: number;
  total_amount: number;
  payments_by_date: Array<{ date: string; count: number; amount: number }>;
}

export interface TransportReport {
  total_requests: number;
  pending_approvals: number;
  in_transit: number;
  delivered: number;
  completion_rate: number;
  average_delivery_time: number;
  requests_by_date: Array<{ date: string; count: number }>;
}

export interface DashboardMetrics {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  pending_verifications: number;
  pending_transports: number;
  active_users_today: number;
  orders_today: number;
  revenue_today: number;
}

// Configuration Types
export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  updated_at: string;
  updated_by?: number;
}

export interface ConfigHistory {
  id: number;
  config_key: string;
  old_value: string;
  new_value: string;
  changed_by: number;
  changed_at: string;
}

// Backup Types
export enum BackupStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface Backup {
  id: number;
  filename: string;
  size_bytes: number;
  status: BackupStatus;
  backup_type: 'manual' | 'scheduled';
  created_by?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

// WebSocket Types
export interface WebSocketMessage {
  type: 'connected' | 'notification' | 'unread_notifications' | 'pong' | 'marked_read' | 'ping';
  message?: string;
  user_id?: number;
  timestamp?: string;
  count?: number;
  notifications?: Notification[];
  data?: Notification;
  notification_id?: number;
}

// Internationalization Types
export interface Translation {
  [key: string]: string;
}

export interface Locale {
  code: string;
  name: string;
  translations: Translation;
}
