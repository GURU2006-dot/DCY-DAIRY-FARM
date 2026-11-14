import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2, ChevronDown, ChevronRight, CircleHelp, ClipboardList, Clock3, ExternalLink, Eye, ImagePlus, LayoutDashboard, Leaf, LogOut, Mail, Menu, Package, Pencil, Plus, Search, Settings, ShieldCheck, ShoppingBag, Trash2, UserRound, X } from 'lucide-react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, EmptyState, Field, Loading, PageHeading } from '../components/Primitives';
import { BrandMark } from '../components/SiteLayout';
import { isDemoMode, getCurrentAdmin, login, logout, getDashboard, getAdminProducts, saveProduct, deleteProduct, uploadProductImage, getCategories, saveCategory, deleteCategory, getOrders, updateOrderStatus, getEnquiries, updateEnquiry, deleteEnquiry, getSettings, saveSettings } from '../lib/api';
import { formatDate, formatINR, formatProductPrice, formatShortDate, titleCaseStatus } from '../lib/format';
import type { BusinessSettings, Category, DashboardData, Enquiry, Order, OrderStatus, Product } from '../types';

export function AdminGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'allowed' | 'denied'>('checking');
  useEffect(() => {
    let active = true;
    if (isDemoMode) { setState('denied'); return; }
    getCurrentAdmin().then(() => { if (active) setState('allowed'); }).catch(() => { if (active) setState('denied'); });
    return () => { active = false; };
  }, []);
  if (state === 'checking') return <div className="admin-auth-loading"><Loading label="Checking administrator session" /></div>;
  if (state === 'denied') return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const returnTo = (location.state as { from?: string } | null)?.from || '/admin';
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await login(email.trim(), password); navigate(returnTo, { replace: true }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not sign in.'); }
    finally { setBusy(false); }
  };
  return <div className="admin-login-page"><div className="login-top"><BrandMark /><Link to="/" className="back-to-store"><ArrowLeft size={15} /> Storefront</Link></div><div className="login-card"><span className="login-emblem"><ShieldCheck size={24} /></span><span className="eyebrow">DCY DAIRY FARM · ADMIN</span><h1>Welcome back.</h1><p>Sign in to manage your products, orders and enquiries.</p>{isDemoMode && <Alert tone="info">Demo preview is active. Administrator sign-in is disabled until the backend and PostgreSQL are configured. No demo credentials are provided.</Alert>}{error && <Alert>{error}</Alert>}<form onSubmit={submit}><Field label="Administrator email"><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@business.com" /></Field><Field label="Password"><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your secure password" /></Field><Button type="submit" disabled={busy || isDemoMode} className="login-button">{busy ? 'Signing in…' : <>Sign in <ArrowRight size={17} /></>}</Button></form><small className="login-help">Administrator access is created securely using the server-side setup procedure. There is no public default account.</small></div><div className="login-bottom">DCY DAIRY FARM <span>·</span> PRIVATE ADMINISTRATION</div></div>;
}

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/enquiries', label: 'Enquiries', icon: Mail },
  { to: '/admin/settings', label: 'Business settings', icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const signOut = async () => { try { await logout(); } finally { navigate('/admin/login', { replace: true }); } };
  return <div className="admin-shell"><aside className={`admin-sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="admin-brand-row"><BrandMark /><button className="admin-mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20} /></button></div><div className="sidebar-label">WORKSPACE</div><nav className="admin-nav">{adminLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span>{label === 'Orders' && <ChevronRight className="admin-nav-arrow" size={15} />}</NavLink>)}</nav><div className="sidebar-bottom"><div className="sidebar-support"><span><CircleHelp size={17} /></span><div><strong>Need a hand?</strong><small>Visit the storefront</small></div><Link to="/contact" aria-label="Contact page"><ArrowUpRight size={15} /></Link></div><button className="sidebar-logout" onClick={signOut}><LogOut size={17} /> Sign out</button><div className="sidebar-copyright">DCY DAIRY FARM<br /><span>ADMIN CONSOLE</span></div></div></aside>{mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    <div className="admin-main"><header className="admin-topbar"><button className="admin-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="admin-breadcrumb">Workspace <ChevronRight size={14} /> <span>{adminLinks.find((item) => item.to === location.pathname)?.label || 'Admin'}</span></div><div className="admin-top-right"><span className="admin-status-dot" /> <span>Secure admin session</span><span className="admin-user-avatar"><UserRound size={16} /></span></div></header><main className="admin-content">{children}</main></div></div>;
}

function MetricCard({ label, value, detail, icon: Icon, tone = '' }: { label: string; value: number | string; detail: string; icon: typeof Package; tone?: string }) {
  return <article className={`metric-card ${tone}`}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} /></span></div><strong className="metric-value">{value}</strong><small>{detail}</small></article>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status === 'PENDING' && <i />}{titleCaseStatus(status)}</span>;
}

export function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { getDashboard().then(setData).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, []);
  return <div className="admin-page"><PageHeading eyebrow="YOUR BUSINESS AT A GLANCE" title="Good morning." description="Here’s the latest from your DCY Dairy Farm storefront." action={<span className="live-data-chip"><span /> Live database</span>} />
    {error && <Alert>{error}</Alert>}{loading ? <Loading label="Loading dashboard data" /> : data && <>
      <div className="metric-grid"><MetricCard label="Total products" value={data.totalProducts} detail="In your catalogue" icon={Package} /><MetricCard label="Total orders" value={data.totalOrders} detail="All recorded orders" icon={ShoppingBag} tone="metric-gold" /><MetricCard label="Pending orders" value={data.pendingOrders} detail="Awaiting your review" icon={Clock3} tone="metric-pending" /><MetricCard label="Confirmed orders" value={data.confirmedOrders} detail="Ready to fulfil" icon={CheckCircle2} /><MetricCard label="Customer enquiries" value={data.totalEnquiries} detail="Received to date" icon={Mail} tone="metric-enquiries" /></div>
      <div className="dashboard-grid"><section className="admin-panel chart-panel"><div className="panel-heading"><div><h2>Order activity</h2><p>Orders received over the past 7 days</p></div><span className="panel-icon"><BarChart3 size={18} /></span></div>{data.ordersByDay.every((item) => item.count === 0) ? <div className="chart-empty"><div className="chart-empty-mark"><BarChart3 size={22} /></div><strong>No orders in this period</strong><span>New orders will appear here when they’re recorded.</span></div> : <div className="chart-container"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.ordersByDay} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="orderFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#245b39" stopOpacity={0.2} /><stop offset="100%" stopColor="#245b39" stopOpacity={0.01} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9e9df" strokeDasharray="4 4" /><XAxis dataKey="day" tickFormatter={formatShortDate} tickLine={false} axisLine={false} tick={{ fill: '#858b83', fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#858b83', fontSize: 11 }} /><Tooltip contentStyle={{ border: '1px solid #e9e9df', borderRadius: 10, boxShadow: '0 8px 24px #173c2915' }} labelFormatter={(label) => formatDate(String(label))} /><Area type="monotone" dataKey="count" name="Orders" stroke="#245b39" strokeWidth={2.5} fill="url(#orderFill)" activeDot={{ r: 5 }} /></AreaChart></ResponsiveContainer></div>}</section>
        <section className="admin-panel quick-panel"><div className="panel-heading"><div><h2>Quick links</h2><p>Common tasks</p></div></div><Link to="/admin/products" className="quick-link"><span className="quick-icon"><Plus size={18} /></span><span><strong>Add a product</strong><small>Update your catalogue</small></span><ArrowRight size={16} /></Link><Link to="/admin/orders" className="quick-link"><span className="quick-icon quick-icon-gold"><ClipboardList size={18} /></span><span><strong>Review new orders</strong><small>{data.pendingOrders} pending</small></span><ArrowRight size={16} /></Link><Link to="/admin/settings" className="quick-link"><span className="quick-icon quick-icon-muted"><Settings size={18} /></span><span><strong>Business details</strong><small>Keep information current</small></span><ArrowRight size={16} /></Link><div className="quick-tip"><Leaf size={17} /><span>Keep product availability up to date so customers see the latest catalogue.</span></div></section></div>
      <section className="admin-panel recent-panel"><div className="panel-heading"><div><h2>Recent orders</h2><p>The latest customer requests</p></div><Link to="/admin/orders" className="panel-link">All orders <ArrowRight size={15} /></Link></div>{data.recentOrders.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{data.recentOrders.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td>{order.customer_name}</td><td>{formatDate(order.created_at)}</td><td>{formatINR(order.total)}</td><td><StatusBadge status={order.status} /></td><td><Link to="/admin/orders" className="table-action" aria-label="View orders"><ArrowUpRight size={16} /></Link></td></tr>)}</tbody></table></div> : <EmptyState title="No orders yet">Order requests will show up here after a customer checks out.</EmptyState>}</section>
    </>}
  </div>;
}

interface ProductEditorProps { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => void }
function ProductEditor({ product, categories, onClose, onSaved }: ProductEditorProps) {
  const [form, setForm] = useState({ name: product?.name || '', description: product?.description || '', price: product?.price == null ? '' : String(product.price), unit: product?.unit || '', category_id: product?.category_id || '', image_url: product?.image_url || '', available: product?.available ?? false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [imageBusy, setImageBusy] = useState(false);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof typeof form, value: string | number | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const upload = async (file?: File) => {
    if (!file) return;
    setImageBusy(true); setError('');
    try { const result = await uploadProductImage(file); set('image_url', result.url); }
    catch (err) { setError(err instanceof Error ? err.message : 'Image upload failed.'); }
    finally { setImageBusy(false); }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const price = form.price.trim() ? Number(form.price) : null;
      await saveProduct({ ...(product ? { id: product.id } : {}), name: form.name.trim(), description: form.description.trim(), price, unit: form.unit.trim(), category_id: form.category_id || null, image_url: form.image_url.trim() || null, available: price !== null && form.available });
      onSaved(); onClose();
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save product.'); }
    finally { setBusy(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="admin-modal product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title"><div className="modal-heading"><div><span className="eyebrow">PRODUCT CATALOGUE</span><h2 id="product-modal-title">{product ? 'Edit product' : 'Add a product'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={20} /></button></div>{error && <Alert>{error}</Alert>}<form onSubmit={submit}><div className="form-grid"><Field label="Product name"><input required value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={120} placeholder="e.g. Fresh milk" /></Field><Field label="Category"><select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Price (INR) · optional until confirmed"><input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => { set('price', e.target.value); if (!e.target.value) set('available', false); }} placeholder="Enter confirmed price" /></Field><Field label="Unit or pack size"><input required value={form.unit} onChange={(e) => set('unit', e.target.value)} maxLength={50} placeholder="e.g. 1 litre" /></Field><Field label="Product description" className="field-full"><textarea required rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={2000} placeholder="Verified product information" /></Field><div className="field field-full"><label htmlFor="product-image-url" className="field-label">Image URL</label><div className="upload-row"><input id="product-image-url" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} placeholder="/uploads/… or an https:// image URL" /><button type="button" className="upload-button" onClick={() => imageFileRef.current?.click()} disabled={imageBusy}><ImagePlus size={16} />{imageBusy ? 'Uploading…' : 'Upload'}</button><input ref={imageFileRef} className="hidden-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (file) void upload(file); }} disabled={imageBusy} /></div><small className="field-hint">JPEG, PNG or WebP · maximum 5 MB</small></div></div><label className="availability-toggle"><input type="checkbox" checked={form.available} disabled={!form.price.trim() || Number(form.price) <= 0} onChange={(e) => set('available', e.target.checked)} /><span><strong>Available to customers</strong><small>{form.price.trim() && Number(form.price) > 0 ? 'Unavailable products remain visible but cannot be ordered.' : 'Enter a confirmed price before listing this product as available.'}</small></span></label><div className="modal-actions"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy || imageBusy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}</Button></div></form></section></div>;
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const refresh = () => { setLoading(true); Promise.all([getAdminProducts(), getCategories()]).then(([items, cats]) => { setProducts(items); setCategories(cats); }).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); };
  useEffect(() => { refresh(); }, []);
  const filtered = useMemo(() => products.filter((product) => `${product.name} ${product.category_name || ''}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const startCreate = () => { setEditing(null); setEditorOpen(true); };
  const editProduct = (product: Product) => { setEditing(product); setEditorOpen(true); };
  const remove = async (product: Product) => { if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return; try { await deleteProduct(product.id); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete product.'); } };
  const toggleAvailability = async (product: Product) => { try { await saveProduct({ ...product, available: !product.available }); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update availability.'); } };
  const addCategory = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setCategoryError(''); try { await saveCategory(newCategory.trim()); setNewCategory(''); refresh(); } catch (err) { setCategoryError(err instanceof Error ? err.message : 'Could not add category.'); } };
  const removeCategory = async (category: Category) => { if (!window.confirm(`Delete category “${category.name}”? Products in this category will become uncategorized.`)) return; try { await deleteCategory(category.id); refresh(); } catch (err) { setCategoryError(err instanceof Error ? err.message : 'Could not delete category.'); } };
  return <div className="admin-page"><PageHeading eyebrow="YOUR CATALOGUE" title="Products" description="Keep product information, pricing and availability current." action={<Button onClick={startCreate}><Plus size={17} /> Add product</Button>} />{error && <Alert>{error}</Alert>}
    <section className="admin-panel category-admin-panel"><div className="panel-heading"><div><h2>Product categories</h2><p>Categories shown as filters in the customer catalogue.</p></div></div>{categoryError && <Alert>{categoryError}</Alert>}<div className="category-admin-content"><div className="category-admin-list">{categories.map((category) => <span className="category-admin-chip" key={category.id}>{category.name}<button onClick={() => removeCategory(category)} aria-label={`Delete ${category.name} category`}><X size={13} /></button></span>)}{!categories.length && <span className="category-none">No categories yet.</span>}</div><form className="category-add-form" onSubmit={addCategory}><input aria-label="New category name" required value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" maxLength={80} /><Button type="submit" variant="secondary"><Plus size={15} /> Add</Button></form></div></section>
    <section className="admin-panel products-admin-panel"><div className="panel-heading"><div><h2>All products <span className="count-pill">{products.length}</span></h2><p>Product information visible on your storefront.</p></div><label className="admin-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" /></label></div>{loading ? <Loading label="Loading products" /> : filtered.length ? <div className="table-scroll"><table className="admin-table product-admin-table"><thead><tr><th>Product</th><th>Category</th><th>Price / unit</th><th>Availability</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><img src={product.image_url || '/images/dairy-selection.jpg'} alt="" /><div><strong>{product.name}</strong><small>{product.unit}</small></div></div></td><td>{product.category_name || '—'}</td><td>{product.price == null ? <strong>{formatProductPrice(product.price)}</strong> : <><strong>{formatINR(product.price)}</strong><span className="unit-note"> / {product.unit}</span></>}</td><td><button disabled={product.price == null} onClick={() => toggleAvailability(product)} className={`availability-switch ${product.available ? 'switch-on' : ''}`} aria-label={product.price == null ? `Set a confirmed price before listing ${product.name}` : `Set ${product.name} ${product.available ? 'unavailable' : 'available'}`} title={product.price == null ? 'Set a confirmed price before making this product available.' : undefined}><i />{product.available ? 'Available' : product.price == null ? 'Price required' : 'Unavailable'}</button></td><td>{product.updated_at ? formatDate(product.updated_at) : '—'}</td><td><div className="table-actions"><button className="table-action" onClick={() => editProduct(product)} aria-label={`Edit ${product.name}`}><Pencil size={16} /></button><button className="table-action danger" onClick={() => remove(product)} aria-label={`Delete ${product.name}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No products found">{query ? 'Try a different search term.' : 'Add your first product to build the catalogue.'}</EmptyState>}</section>
    {editorOpen && <ProductEditor product={editing} categories={categories} onClose={() => setEditorOpen(false)} onSaved={refresh} />}
  </div>;
}

const orderStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const refresh = () => { setLoading(true); getOrders().then(setOrders).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); };
  useEffect(() => { refresh(); }, []);
  const filtered = useMemo(() => orders.filter((order) => (filter === 'all' || order.status === filter) && `${order.customer_name} ${order.phone} ${order.id}`.toLowerCase().includes(query.toLowerCase())), [orders, filter, query]);
  const changeStatus = async (order: Order, status: OrderStatus) => { if (status === 'CANCELLED' && !window.confirm('Cancel this order? The customer may need a separate follow-up.')) return; try { await updateOrderStatus(order.id, status); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update order status.'); } };
  return <div className="admin-page"><PageHeading eyebrow="CUSTOMER REQUESTS" title="Orders" description="Review the order details and keep each customer updated." action={<span className="count-pill count-pill-large">{orders.length} total</span>} />{error && <Alert>{error}</Alert>}<section className="admin-panel"><div className="panel-heading orders-toolbar"><div><h2>All orders</h2><p>Expand an order for delivery details and line items.</p></div><div className="table-tools"><label className="admin-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer or ID" /></label><label className="admin-select"><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option>{orderStatuses.map((status) => <option key={status} value={status}>{titleCaseStatus(status)}</option>)}</select><ChevronDown size={15} /></label></div></div>{loading ? <Loading label="Loading orders" /> : filtered.length ? <div className="table-scroll"><table className="admin-table orders-table"><thead><tr><th></th><th>Order ID</th><th>Customer</th><th>Phone</th><th>Products</th><th>Total</th><th>Order date</th><th>Status</th></tr></thead><tbody>{filtered.map((order) => <><tr key={order.id}><td><button className="expand-order" onClick={() => setExpanded(expanded === order.id ? null : order.id)} aria-label="Toggle order details">{expanded === order.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></td><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td>{order.customer_name}</td><td><a href={`tel:${order.phone}`}>{order.phone}</a></td><td>{order.items?.length || 0} item types</td><td><strong>{formatINR(order.total)}</strong></td><td>{formatDate(order.created_at)}</td><td><select className="status-select" value={order.status} onChange={(e) => changeStatus(order, e.target.value as OrderStatus)} aria-label={`Update order ${order.id} status`}>{orderStatuses.map((status) => <option key={status} value={status}>{titleCaseStatus(status)}</option>)}</select></td></tr>{expanded === order.id && <tr className="order-expanded-row" key={`${order.id}-expanded`}><td colSpan={8}><div className="order-expanded"><div><span className="expanded-label">DELIVERY ADDRESS</span><p>{order.address}</p>{order.instructions && <><span className="expanded-label">CUSTOMER INSTRUCTIONS</span><p>{order.instructions}</p></>}</div><div><span className="expanded-label">ITEMS</span>{order.items?.map((item, index) => <p className="expanded-item" key={item.id || index}><span>{item.quantity} × {item.product_name} <small>({item.unit})</small></span><strong>{formatINR(item.line_total)}</strong></p>)}<p className="expanded-subtotal"><span>Subtotal</span><strong>{formatINR(order.subtotal)}</strong></p></div></div></td></tr>}</>)}</tbody></table></div> : <EmptyState title="No orders found">Orders will appear here when requests are saved from checkout.</EmptyState>}</section></div>;
}

export function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<Enquiry | null>(null);
  const refresh = () => { setLoading(true); getEnquiries().then(setEnquiries).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); };
  useEffect(() => { refresh(); }, []);
  const filtered = useMemo(() => enquiries.filter((item) => `${item.name} ${item.email} ${item.subject}`.toLowerCase().includes(query.toLowerCase())), [enquiries, query]);
  const openEnquiry = async (item: Enquiry) => { setActive(item); if (!item.is_read) { try { const updated = await updateEnquiry(item.id, { is_read: true }); setActive(updated); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update enquiry.'); } } };
  const resolve = async (item: Enquiry) => { try { const updated = await updateEnquiry(item.id, { is_resolved: !item.is_resolved }); setActive(updated); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not update enquiry.'); } };
  const remove = async (item: Enquiry) => { if (!window.confirm('Permanently delete this enquiry?')) return; try { await deleteEnquiry(item.id); setActive(null); refresh(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete enquiry.'); } };
  return <div className="admin-page"><PageHeading eyebrow="CUSTOMER MESSAGES" title="Enquiries" description="Read customer questions, follow up and mark them resolved." action={<span className="count-pill count-pill-large">{enquiries.filter((e) => !e.is_read).length} unread</span>} />{error && <Alert>{error}</Alert>}<section className="admin-panel"><div className="panel-heading"><div><h2>All enquiries</h2><p>Customer messages received from the contact form.</p></div><label className="admin-search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages" /></label></div>{loading ? <Loading label="Loading enquiries" /> : filtered.length ? <div className="table-scroll"><table className="admin-table"><thead><tr><th>Customer</th><th>Subject</th><th>Received</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id} className={!item.is_read ? 'unread-row' : ''}><td><div className="enquiry-customer"><span className="customer-avatar">{item.name.slice(0, 1).toUpperCase()}</span><span><strong>{item.name}</strong><small>{item.email}</small></span></div></td><td>{item.subject}</td><td>{formatDate(item.created_at)}</td><td><span className={`enquiry-status ${item.is_resolved ? 'resolved' : item.is_read ? '' : 'unread'}`}>{item.is_resolved ? 'Resolved' : item.is_read ? 'Read' : 'Unread'}</span></td><td><button className="table-action" onClick={() => openEnquiry(item)} aria-label="View enquiry"><Eye size={16} /></button></td></tr>)}</tbody></table></div> : <EmptyState title="No enquiries found">Customer enquiries will appear here when submitted through the contact page.</EmptyState>}</section>
    {active && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setActive(null)}><section className="admin-modal enquiry-modal" role="dialog" aria-modal="true" aria-labelledby="enquiry-title"><div className="modal-heading"><div><span className="eyebrow">CUSTOMER ENQUIRY · {formatDate(active.created_at)}</span><h2 id="enquiry-title">{active.subject}</h2></div><button className="icon-button" onClick={() => setActive(null)} aria-label="Close"><X size={20} /></button></div><div className="enquiry-details"><span className="customer-avatar customer-avatar-large">{active.name.slice(0, 1).toUpperCase()}</span><div><strong>{active.name}</strong><a href={`mailto:${active.email}`}>{active.email}</a>{active.phone && <a href={`tel:${active.phone}`}>{active.phone}</a>}</div></div><div className="enquiry-message">{active.message}</div><div className="modal-actions"><Button variant="danger" onClick={() => remove(active)}><Trash2 size={15} /> Delete</Button><Button variant="secondary" onClick={() => resolve(active)}>{active.is_resolved ? <><ArrowDownRight size={15} /> Reopen</> : <><Check size={15} /> Mark resolved</>}</Button><Button onClick={() => setActive(null)}>Done</Button></div></section></div>}
  </div>;
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [socialText, setSocialText] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { getSettings().then((value) => { setSettings(value); setSocialText(Object.entries(value.social_links || {}).map(([key, url]) => `${key}=${url}`).join('\n')); }).catch((err: Error) => setError(err.message)).finally(() => setLoading(false)); }, []);
  const update = (key: keyof BusinessSettings, value: string) => setSettings((current) => current ? { ...current, [key]: value } : current);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!settings) return;
    setBusy(true); setSaved(false); setError('');
    const social_links: Record<string, string> = {};
    socialText.split('\n').map((line) => line.trim()).filter(Boolean).forEach((line) => { const separator = line.indexOf('='); if (separator > 0) social_links[line.slice(0, separator).trim()] = line.slice(separator + 1).trim(); });
    try { const savedSettings = await saveSettings({ ...settings, social_links }); setSettings(savedSettings); setSaved(true); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not save settings.'); }
    finally { setBusy(false); }
  };
  if (loading) return <div className="admin-page"><Loading label="Loading business settings" /></div>;
  if (!settings) return <div className="admin-page"><Alert>{error || 'Business settings are unavailable.'}</Alert></div>;
  return <div className="admin-page"><PageHeading eyebrow="YOUR BUSINESS PROFILE" title="Business settings" description="These details appear across your customer-facing storefront." action={<span className="settings-lock"><ShieldCheck size={15} /> Admin only</span>} />{error && <Alert>{error}</Alert>}{saved && <Alert tone="success">Business information saved successfully.</Alert>}
    <form className="settings-form" onSubmit={submit}><section className="admin-panel settings-panel"><div className="settings-panel-heading"><span className="settings-panel-icon"><Leaf size={19} /></span><div><h2>Brand details</h2><p>Your name and tagline across the storefront.</p></div></div><div className="form-grid"><Field label="Business name"><input required value={settings.business_name} onChange={(e) => update('business_name', e.target.value)} maxLength={120} /></Field><Field label="Tagline"><input required value={settings.tagline} onChange={(e) => update('tagline', e.target.value)} maxLength={180} /></Field></div></section>
      <section className="admin-panel settings-panel"><div className="settings-panel-heading"><span className="settings-panel-icon settings-icon-gold"><Mail size={18} /></span><div><h2>Contact information</h2><p>Used for customers to reach your team.</p></div></div><div className="form-grid"><Field label="WhatsApp number" hint="International format recommended; digits are used for the click-to-chat link."><input type="tel" value={settings.whatsapp_number} onChange={(e) => update('whatsapp_number', e.target.value)} placeholder="[Add WhatsApp number incl. country code]" maxLength={20} /></Field><Field label="Contact number"><input type="tel" value={settings.contact_number} onChange={(e) => update('contact_number', e.target.value)} placeholder="[Add business phone]" maxLength={20} /></Field><Field label="Business email"><input type="email" value={settings.email} onChange={(e) => update('email', e.target.value)} placeholder="[Add business email]" maxLength={254} /></Field><Field label="Business address"><textarea value={settings.address} onChange={(e) => update('address', e.target.value)} rows={2} placeholder="[Add verified business address]" maxLength={500} /></Field><Field label="Opening hours" className="field-full"><input value={settings.opening_hours} onChange={(e) => update('opening_hours', e.target.value)} placeholder="[Add confirmed opening hours]" maxLength={250} /></Field></div></section>
      <section className="admin-panel settings-panel"><div className="settings-panel-heading"><span className="settings-panel-icon settings-icon-muted"><ExternalLink size={18} /></span><div><h2>Social media</h2><p>One link per line, in the format <code>platform=https://…</code></p></div></div><Field label="Social links"><textarea rows={4} value={socialText} onChange={(e) => setSocialText(e.target.value)} placeholder={'instagram=https://…\nfacebook=https://…'} /></Field></section>
      <div className="settings-submit-row"><p><ShieldCheck size={15} /> Changes are saved securely to the business database.</p><Button type="submit" disabled={busy}>{busy ? 'Saving…' : <>Save business details <Check size={16} /></>}</Button></div>
    </form>
  </div>;
}
