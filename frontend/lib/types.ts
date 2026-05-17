export enum UserRole {
  FARMER = 'farmer',
  RETAILER = 'retailer',
  ADMIN = 'admin',
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  full_name?: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  unit: string;
  available_quantity: number;
  location: string;
  farmer_id: number;
  image_url?: string;
  images?: ProductImage[];
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: number;
  product_id: number;
  farmer_id: number;
  retailer_id: number;
  quantity: number;
  total_price: number;
  status: 'pending' | 'approved' | 'pending_payment' | 'paid' | 'completed' | 'cancelled' | 'rejected' | 'delivered';
  delivery_date?: string;
  payment_status?: string;
  paid_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  payment_deadline?: string;
  created_at: string;
  updated_at?: string;
  // Enriched fields
  product_name?: string;
  product_unit?: string;
  retailer_name?: string;
  farmer_name?: string;
}
