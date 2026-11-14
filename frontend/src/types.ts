export interface Product {
  id: string;
  name: string;
  description: string;
  price: number | null;
  unit: string;
  category_id: string | null;
  category_name?: string | null;
  image_url: string | null;
  available: boolean;
  is_sample?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id?: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  instructions?: string | null;
  subtotal: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItem[];
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

export interface BusinessSettings {
  business_name: string;
  tagline: string;
  whatsapp_number: string;
  contact_number: string;
  email: string;
  address: string;
  opening_hours: string;
  social_links: Record<string, string>;
}

export interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalEnquiries: number;
  recentOrders: Order[];
  ordersByDay: { day: string; count: number }[];
}
