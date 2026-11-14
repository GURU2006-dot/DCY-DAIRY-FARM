import type { BusinessSettings, Category, DashboardData, Enquiry, Order, Product } from '../types';

export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const demoCategories: Category[] = [
  { id: 'sample-milk', name: 'Milk' },
  { id: 'sample-curd', name: 'Curd' },
  { id: 'sample-ghee', name: 'Ghee' },
  { id: 'sample-paneer', name: 'Paneer' },
];

// Preview-only placeholders. No prices or unverified product claims are presented as live information.
export const demoProducts: Product[] = [
  {
    id: 'sample-milk-1', name: 'Milk', description: 'Product details to be confirmed by DCY Dairy Farm.',
    price: null, unit: 'Pack size to be confirmed', category_id: 'sample-milk', category_name: 'Milk', image_url: null, available: false, is_sample: true,
  },
  {
    id: 'sample-curd-1', name: 'Curd', description: 'Product details to be confirmed by DCY Dairy Farm.',
    price: null, unit: 'Pack size to be confirmed', category_id: 'sample-curd', category_name: 'Curd', image_url: null, available: false, is_sample: true,
  },
  {
    id: 'sample-ghee-1', name: 'Ghee', description: 'Product details to be confirmed by DCY Dairy Farm.',
    price: null, unit: 'Pack size to be confirmed', category_id: 'sample-ghee', category_name: 'Ghee', image_url: null, available: false, is_sample: true,
  },
  {
    id: 'sample-paneer-1', name: 'Paneer', description: 'Product details to be confirmed by DCY Dairy Farm.',
    price: null, unit: 'Pack size to be confirmed', category_id: 'sample-paneer', category_name: 'Paneer', image_url: null, available: false, is_sample: true,
  },
];

export const placeholderSettings: BusinessSettings = {
  business_name: 'DCY DAIRY FARM',
  tagline: 'Freshness You Can Trust',
  whatsapp_number: '+91 9876543210',
  contact_number: '',
  email: '',
  address: 'Madanapalli, Andhra Pradesh',
  opening_hours: '',
  social_links: {},
};

function compareProductPrice(a: Product, b: Product, descending = false): number {
  if (a.price == null) return b.price == null ? 0 : 1;
  if (b.price == null) return -1;
  return descending ? b.price - a.price : a.price - b.price;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `Request failed (${response.status})`);
  return body as T;
}

export async function getProducts(params: { search?: string; category?: string; sort?: string } = {}): Promise<Product[]> {
  if (isDemoMode) {
    const search = (params.search || '').trim().toLowerCase();
    let items = demoProducts.filter((p) => (!params.category || params.category === 'all' || p.category_id === params.category)
      && (!search || `${p.name} ${p.description} ${p.category_name}`.toLowerCase().includes(search)));
    if (params.sort === 'price-low') items = [...items].sort((a, b) => compareProductPrice(a, b));
    if (params.sort === 'price-high') items = [...items].sort((a, b) => compareProductPrice(a, b, true));
    if (params.sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    return items;
  }
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.category && params.category !== 'all') query.set('category', params.category);
  if (params.sort) query.set('sort', params.sort);
  return request<Product[]>(`/products${query.size ? `?${query.toString()}` : ''}`);
}

export async function getProduct(id: string): Promise<Product> {
  if (isDemoMode) {
    const product = demoProducts.find((item) => item.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  }
  return request<Product>(`/products/${encodeURIComponent(id)}`);
}

export async function getCategories(): Promise<Category[]> {
  return isDemoMode ? demoCategories : request<Category[]>('/categories');
}

export async function getSettings(): Promise<BusinessSettings> {
  if (isDemoMode) return placeholderSettings;
  return request<BusinessSettings>('/settings');
}

export async function createOrder(payload: {
  customer_name: string; phone: string; address: string; instructions?: string;
  items: { product_id: string; quantity: number }[];
}): Promise<{ order: Order; whatsappUrl: string }> {
  if (isDemoMode) throw new Error('Demo preview only: configure PostgreSQL, the API and a real WhatsApp number before accepting orders. No order was saved.');
  return request('/orders', { method: 'POST', body: JSON.stringify(payload) });
}

export async function createEnquiry(payload: {
  name: string; email: string; phone?: string; subject: string; message: string; website?: string;
}): Promise<{ message: string }> {
  if (isDemoMode) throw new Error('Demo preview only: connect the API and PostgreSQL before accepting enquiries. No enquiry was saved.');
  return request('/enquiries', { method: 'POST', body: JSON.stringify(payload) });
}

export async function login(email: string, password: string): Promise<{ user: { id: string; email: string } }> {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}
export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
}
export async function getCurrentAdmin(): Promise<{ id: string; email: string }> {
  const result = await request<{ user: { id: string; email: string } }>('/auth/me');
  return result.user;
}
export async function getDashboard(): Promise<DashboardData> { return request('/admin/dashboard'); }
export async function getAdminProducts(): Promise<Product[]> { return request('/products'); }
export async function saveProduct(payload: Partial<Product> & { name: string; description: string; price: number | null; unit: string }): Promise<Product> {
  if (payload.id) return request(`/products/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return request('/products', { method: 'POST', body: JSON.stringify(payload) });
}
export async function deleteProduct(id: string): Promise<void> {
  await request(`/products/${id}`, { method: 'DELETE' });
}
export async function uploadProductImage(file: File): Promise<{ url: string }> {
  const form = new FormData(); form.append('image', file);
  return request('/uploads/product-image', { method: 'POST', body: form });
}
export async function getOrders(): Promise<Order[]> { return request('/orders'); }
export async function updateOrderStatus(id: string, status: Order['status']): Promise<Order> {
  return request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
export async function getEnquiries(): Promise<Enquiry[]> { return request('/enquiries'); }
export async function updateEnquiry(id: string, payload: Partial<Pick<Enquiry, 'is_read' | 'is_resolved'>>): Promise<Enquiry> {
  return request(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}
export async function deleteEnquiry(id: string): Promise<void> { await request(`/enquiries/${id}`, { method: 'DELETE' }); }
export async function saveSettings(settings: BusinessSettings): Promise<BusinessSettings> {
  return request('/settings', { method: 'PUT', body: JSON.stringify(settings) });
}
export async function saveCategory(name: string): Promise<Category> {
  return request('/categories', { method: 'POST', body: JSON.stringify({ name }) });
}
export async function deleteCategory(id: string): Promise<void> { await request(`/categories/${id}`, { method: 'DELETE' }); }
