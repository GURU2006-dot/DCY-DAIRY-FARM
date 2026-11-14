import './env.js';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import express, { type ErrorRequestHandler, type NextFunction, type Request, type RequestHandler, type Response } from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { z, ZodError } from 'zod';
import { pool, query } from './db.js';
import { requireAdmin } from './auth.js';
import { HttpError } from './errors.js';
import { buildOrderMessage, buildWhatsAppUrl, calculateLineTotals } from './order-utils.js';
import { categorySchema, enquiryPatchSchema, enquirySchema, idParamSchema, loginSchema, orderSchema, orderStatusSchema, productSchema, sanitizeText, settingsSchema } from './validation.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET;
if (isProduction && (!SESSION_SECRET || SESSION_SECRET.length < 32 || SESSION_SECRET.includes('REPLACE_WITH'))) {
  throw new Error('Set a strong SESSION_SECRET (at least 32 characters) in production.');
}
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-site' },
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
  pool,
  tableName: 'user_sessions',
  createTableIfMissing: true,
  pruneSessionInterval: 60 * 15,
});
app.use(session({
  name: 'dcy_admin_session',
  secret: SESSION_SECRET || randomUUID() + randomUUID(),
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8,
    path: '/',
  },
}));

const publicRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' },
});
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many sign-in attempts. Please wait and try again.' },
});

const asyncRoute = (handler: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res)).catch(next);
};
const parseOrThrow = <T,>(schema: z.ZodType<T>, value: unknown): T => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw parsed.error;
  return parsed.data;
};
const recordId = (value: unknown) => parseOrThrow(idParamSchema, value);
const numeric = (value: unknown) => Number(value);
const nullableNumeric = (value: unknown): number | null => value == null ? null : numeric(value);
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || './uploads');
const uploadMaxBytes = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 5)) * 1024 * 1024;
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: uploadMaxBytes, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(new HttpError(415, 'Only JPEG, PNG or WebP images are accepted.'));
    callback(null, true);
  },
});

const productSelect = `SELECT p.id, p.name, p.description, p.price, p.unit, p.category_id,
  c.name AS category_name, p.image_url, p.available, p.is_sample, p.created_at, p.updated_at
  FROM products p LEFT JOIN categories c ON c.id = p.category_id`;

app.get('/api/health', asyncRoute(async (_req, res) => {
  await query('SELECT 1');
  res.json({ status: 'ok', database: 'connected' });
}));

// Public catalogue. Search/sort values are parameterized; sort columns are selected from a fixed allow-list.
app.get('/api/categories', asyncRoute(async (_req, res) => {
  const result = await query('SELECT id, name, slug FROM categories ORDER BY name ASC');
  res.json(result.rows);
}));
app.post('/api/categories', requireAdmin, asyncRoute(async (req, res) => {
  const { name } = parseOrThrow(categorySchema, req.body);
  const slug = name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `category-${randomUUID().slice(0, 8)}`;
  try {
    const result = await query('INSERT INTO categories (name, slug) VALUES ($1, $2) RETURNING id, name, slug', [sanitizeText(name), `${slug}-${randomUUID().slice(0, 6)}`]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (isPgUniqueViolation(error)) throw new HttpError(409, 'A category with this name already exists.');
    throw error;
  }
}));
app.put('/api/categories/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const { name } = parseOrThrow(categorySchema, req.body);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || `category-${randomUUID().slice(0, 8)}`;
  try {
    const result = await query('UPDATE categories SET name=$1, slug=$2 WHERE id=$3 RETURNING id,name,slug', [sanitizeText(name), `${slug}-${randomUUID().slice(0, 6)}`, id]);
    if (!result.rowCount) throw new HttpError(404, 'Category not found.');
    res.json(result.rows[0]);
  } catch (error) {
    if (isPgUniqueViolation(error)) throw new HttpError(409, 'A category with this name already exists.');
    throw error;
  }
}));
app.delete('/api/categories/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const result = await query('DELETE FROM categories WHERE id=$1 RETURNING id', [id]);
  if (!result.rowCount) throw new HttpError(404, 'Category not found.');
  res.status(204).end();
}));

app.get('/api/products', asyncRoute(async (req, res) => {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length} OR c.name ILIKE $${values.length})`);
  }
  if (category) {
    values.push(recordId(category));
    conditions.push(`p.category_id = $${values.length}`);
  }
  const sortKey = typeof req.query.sort === 'string' ? req.query.sort : 'featured';
  const sortClause: Record<string, string> = {
    featured: 'p.available DESC, p.created_at DESC',
    'price-low': 'p.price ASC NULLS LAST, p.name ASC',
    'price-high': 'p.price DESC NULLS LAST, p.name ASC',
    name: 'p.name ASC',
  };
  const orderBy = sortClause[sortKey] || sortClause.featured;
  const sql = `${productSelect} ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY ${orderBy} LIMIT 500`;
  const result = await query(sql, values);
  res.json(result.rows.map((row) => ({ ...row, price: nullableNumeric(row.price) })));
}));
app.get('/api/products/:id', asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const result = await query(`${productSelect} WHERE p.id = $1`, [id]);
  if (!result.rowCount) throw new HttpError(404, 'Product not found.');
  res.json({ ...result.rows[0], price: nullableNumeric(result.rows[0].price) });
}));
app.post('/api/products', requireAdmin, asyncRoute(async (req, res) => {
  const data = parseOrThrow(productSchema, req.body);
  if (data.category_id) await assertCategoryExists(data.category_id);
  const result = await query(`INSERT INTO products (name,description,price,unit,category_id,image_url,available)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [sanitizeText(data.name), sanitizeText(data.description), data.price, sanitizeText(data.unit), data.category_id || null, data.image_url || null, data.available]);
  const product = await query(`${productSelect} WHERE p.id=$1`, [result.rows[0].id]);
  res.status(201).json({ ...product.rows[0], price: nullableNumeric(product.rows[0].price) });
}));
app.put('/api/products/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const currentResult = await query(`${productSelect} WHERE p.id=$1`, [id]);
  if (!currentResult.rowCount) throw new HttpError(404, 'Product not found.');
  const current = currentResult.rows[0];
  const data = parseOrThrow(productSchema, {
    name: req.body?.name ?? current.name,
    description: req.body?.description ?? current.description,
    price: req.body?.price === undefined ? nullableNumeric(current.price) : req.body.price,
    unit: req.body?.unit ?? current.unit,
    category_id: req.body?.category_id === undefined ? current.category_id : req.body.category_id,
    image_url: req.body?.image_url === undefined ? current.image_url : req.body.image_url,
    available: req.body?.available ?? current.available,
  });
  if (data.category_id) await assertCategoryExists(data.category_id);
  await query(`UPDATE products SET name=$1,description=$2,price=$3,unit=$4,category_id=$5,image_url=$6,available=$7,updated_at=NOW() WHERE id=$8`,
    [sanitizeText(data.name), sanitizeText(data.description), data.price, sanitizeText(data.unit), data.category_id || null, data.image_url || null, data.available, id]);
  const updated = await query(`${productSelect} WHERE p.id=$1`, [id]);
  res.json({ ...updated.rows[0], price: nullableNumeric(updated.rows[0].price) });
}));
app.delete('/api/products/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const result = await query('DELETE FROM products WHERE id=$1 RETURNING id', [id]);
  if (!result.rowCount) throw new HttpError(404, 'Product not found.');
  res.status(204).end();
}));

app.post('/api/uploads/product-image', requireAdmin, (req, res, next) => {
  imageUpload.single('image')(req, res, (error) => {
    if (error) return next(error);
    Promise.resolve().then(async () => {
      const file = req.file;
      if (!file) throw new HttpError(400, 'Choose an image to upload.');
      const buffer = file.buffer;
      let extension: string;
      if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff && file.mimetype === 'image/jpeg') extension = 'jpg';
      else if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && file.mimetype === 'image/png') extension = 'png';
      else if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' && file.mimetype === 'image/webp') extension = 'webp';
      else throw new HttpError(415, 'The image content did not match an accepted JPEG, PNG or WebP file.');
      await mkdir(uploadRoot, { recursive: true });
      const fileName = `${randomUUID()}.${extension}`;
      await writeFile(path.join(uploadRoot, fileName), buffer, { flag: 'wx' });
      res.status(201).json({ url: `/uploads/${fileName}` });
    }).catch(next);
  });
});
app.use('/uploads', express.static(uploadRoot, { dotfiles: 'deny', index: false, maxAge: isProduction ? '7d' : 0, immutable: isProduction }));

// Checkout values are taken only from the database. Client-submitted prices are ignored.
app.post('/api/orders', publicRateLimit, asyncRoute(async (req, res) => {
  const data = parseOrThrow(orderSchema, req.body);
  const customer = {
    customer_name: sanitizeText(data.customer_name), phone: sanitizeText(data.phone), address: sanitizeText(data.address), instructions: sanitizeText(data.instructions || ''),
  };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const settingsResult = await client.query<{ business_name: string; whatsapp_number: string }>('SELECT business_name, whatsapp_number FROM business_settings WHERE id=1');
    const waDigits = (settingsResult.rows[0]?.whatsapp_number || '').replace(/\D/g, '');
    if (waDigits.length < 8 || waDigits.length > 15) throw new HttpError(409, 'The business WhatsApp number is not configured. The order was not saved.');
    const ids = data.items.map((item) => item.product_id);
    const result = await client.query(`SELECT id,name,unit,price,available,is_sample FROM products WHERE id=ANY($1::uuid[]) FOR UPDATE`, [ids]);
    if (result.rowCount !== ids.length) throw new HttpError(400, 'One or more products could not be found. Please refresh the catalogue.');
    const products = new Map(result.rows.map((row) => [row.id as string, row]));
    let subtotalCents = 0;
    const lines = data.items.map((item) => {
      const product = products.get(item.product_id)!;
      if (!product.available) throw new HttpError(409, `${product.name} is currently unavailable. Please update your cart.`);
      if (product.price == null) throw new HttpError(409, `${product.name} does not have a confirmed price yet.`);
      if (product.is_sample) throw new HttpError(409, 'Sample products cannot be ordered. Replace sample data before accepting orders.');
      const { unit_cents, line_cents } = calculateLineTotals(product.price as string, item.quantity);
      subtotalCents += line_cents;
      return { product_id: product.id as string, product_name: sanitizeText(product.name as string), unit: sanitizeText(product.unit as string), quantity: item.quantity, unit_cents, line_cents };
    });
    const subtotal = (subtotalCents / 100).toFixed(2);
    const orderResult = await client.query(`INSERT INTO orders (customer_name,phone,address,instructions,subtotal,total,status)
      VALUES ($1,$2,$3,$4,$5,$5,'PENDING') RETURNING id,customer_name,phone,address,instructions,subtotal,total,status,created_at`,
      [customer.customer_name, customer.phone, customer.address, customer.instructions || null, subtotal]);
    const order = orderResult.rows[0];
    for (const line of lines) {
      await client.query(`INSERT INTO order_items (order_id,product_id,product_name,unit,quantity,unit_price,line_total)
        VALUES ($1,$2,$3,$4,$5,$6,$7)`, [order.id, line.product_id, line.product_name, line.unit, line.quantity, (line.unit_cents / 100).toFixed(2), (line.line_cents / 100).toFixed(2)]);
    }
    const message = buildOrderMessage({ name: customer.customer_name, phone: customer.phone, address: customer.address, instructions: customer.instructions }, lines, subtotalCents);
    const whatsappUrl = buildWhatsAppUrl(waDigits, message);
    if (!whatsappUrl) throw new HttpError(409, 'The business WhatsApp number is not configured.');
    await client.query('COMMIT');
    const responseOrder = { ...order, subtotal: numeric(order.subtotal), total: numeric(order.total), items: lines.map((line) => ({ product_id: line.product_id, product_name: line.product_name, unit: line.unit, quantity: line.quantity, unit_price: line.unit_cents / 100, line_total: line.line_cents / 100 })) };
    res.status(201).json({ order: responseOrder, whatsappUrl });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally { client.release(); }
}));

// Administrator order views and status changes.
app.get('/api/orders', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await query(`${orderListSql} GROUP BY o.id ORDER BY o.created_at DESC LIMIT 500`);
  res.json(result.rows.map(normalizeOrder));
}));
app.get('/api/orders/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const result = await query(`${orderListSql} WHERE o.id=$1 GROUP BY o.id`, [id]);
  if (!result.rowCount) throw new HttpError(404, 'Order not found.');
  res.json(normalizeOrder(result.rows[0]));
}));
app.patch('/api/orders/:id/status', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const { status } = parseOrThrow(orderStatusSchema, req.body);
  const result = await query(`UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,customer_name,phone,address,instructions,subtotal,total,status,created_at`, [status, id]);
  if (!result.rowCount) throw new HttpError(404, 'Order not found.');
  const items = await query(`SELECT id,product_id,product_name,quantity,unit,unit_price,line_total FROM order_items WHERE order_id=$1 ORDER BY created_at`, [id]);
  res.json({ ...normalizeOrder({ ...result.rows[0], items }), items: items.rows.map(normalizeOrderItem) });
}));

// Customer enquiries; public submissions are validated and rate-limited.
app.post('/api/enquiries', publicRateLimit, asyncRoute(async (req, res) => {
  const data = parseOrThrow(enquirySchema, req.body);
  // Honeypot submission receives a generic success without creating a database row.
  if ((data.website || '').trim()) return res.status(201).json({ message: 'Your enquiry has been received.' });
  const result = await query(`INSERT INTO enquiries (name,email,phone,subject,message) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
    [sanitizeText(data.name), data.email, sanitizeText(data.phone || ''), sanitizeText(data.subject), sanitizeText(data.message)]);
  res.status(201).json({ message: 'Your enquiry has been received.', id: result.rows[0].id });
}));
app.get('/api/enquiries', requireAdmin, asyncRoute(async (_req, res) => {
  const result = await query('SELECT id,name,email,phone,subject,message,is_read,is_resolved,created_at FROM enquiries ORDER BY created_at DESC LIMIT 1000');
  res.json(result.rows);
}));
app.patch('/api/enquiries/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const data = parseOrThrow(enquiryPatchSchema, req.body);
  const current = await query('SELECT id,is_read,is_resolved FROM enquiries WHERE id=$1', [id]);
  if (!current.rowCount) throw new HttpError(404, 'Enquiry not found.');
  const updated = await query(`UPDATE enquiries SET is_read=$1,is_resolved=$2,updated_at=NOW() WHERE id=$3
    RETURNING id,name,email,phone,subject,message,is_read,is_resolved,created_at`,
    [data.is_read ?? current.rows[0].is_read, data.is_resolved ?? current.rows[0].is_resolved, id]);
  res.json(updated.rows[0]);
}));
app.delete('/api/enquiries/:id', requireAdmin, asyncRoute(async (req, res) => {
  const id = recordId(req.params.id);
  const result = await query('DELETE FROM enquiries WHERE id=$1 RETURNING id', [id]);
  if (!result.rowCount) throw new HttpError(404, 'Enquiry not found.');
  res.status(204).end();
}));

// One-row public business profile (contact/WhatsApp details are intentionally public).
app.get('/api/settings', asyncRoute(async (_req, res) => {
  const result = await query(`SELECT business_name,tagline,whatsapp_number,contact_number,email,address,opening_hours,social_links FROM business_settings WHERE id=1`);
  if (!result.rowCount) throw new HttpError(503, 'Business settings have not been initialized.');
  res.json(result.rows[0]);
}));
app.put('/api/settings', requireAdmin, asyncRoute(async (req, res) => {
  const data = parseOrThrow(settingsSchema, req.body);
  const result = await query(`INSERT INTO business_settings (id,business_name,tagline,whatsapp_number,contact_number,email,address,opening_hours,social_links,updated_at)
    VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,NOW())
    ON CONFLICT (id) DO UPDATE SET business_name=EXCLUDED.business_name,tagline=EXCLUDED.tagline,whatsapp_number=EXCLUDED.whatsapp_number,
      contact_number=EXCLUDED.contact_number,email=EXCLUDED.email,address=EXCLUDED.address,opening_hours=EXCLUDED.opening_hours,social_links=EXCLUDED.social_links,updated_at=NOW()
    RETURNING business_name,tagline,whatsapp_number,contact_number,email,address,opening_hours,social_links`,
    [sanitizeText(data.business_name), sanitizeText(data.tagline), sanitizeText(data.whatsapp_number || ''), sanitizeText(data.contact_number || ''), data.email || '', sanitizeText(data.address || ''), sanitizeText(data.opening_hours || ''), JSON.stringify(data.social_links || {})]);
  res.json(result.rows[0]);
}));

// Secure administrator session endpoints.
app.post('/api/auth/login', authRateLimit, asyncRoute(async (req, res) => {
  const data = parseOrThrow(loginSchema, req.body);
  const result = await query<{ id: string; email: string; password_hash: string; is_active: boolean }>(
    'SELECT id,email,password_hash,is_active FROM admin_users WHERE email=$1 LIMIT 1', [data.email]);
  const admin = result.rows[0];
  const passwordValid = admin ? await bcrypt.compare(data.password, admin.password_hash) : (await bcrypt.hash(data.password, 12), false);
  if (!admin || !admin.is_active || !passwordValid) throw new HttpError(401, 'Email or password is incorrect.');
  await new Promise<void>((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.adminId = admin.id;
  req.session.adminEmail = admin.email;
  await new Promise<void>((resolve, reject) => req.session.save((error) => error ? reject(error) : resolve()));
  res.json({ user: { id: admin.id, email: admin.email } });
}));
app.post('/api/auth/logout', asyncRoute(async (req, res) => {
  if (!req.session) return res.status(204).end();
  await new Promise<void>((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
  res.clearCookie('dcy_admin_session', { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/' });
  res.status(204).end();
}));
app.get('/api/auth/me', requireAdmin, (req, res) => res.json({ user: { id: req.session.adminId, email: req.session.adminEmail } }));
app.get('/api/admin/dashboard', requireAdmin, asyncRoute(async (_req, res) => {
  const [products, orders, pending, confirmed, enquiries, recent, daily] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM products'),
    query('SELECT COUNT(*)::int AS count FROM orders'),
    query("SELECT COUNT(*)::int AS count FROM orders WHERE status='PENDING'"),
    query("SELECT COUNT(*)::int AS count FROM orders WHERE status='CONFIRMED'"),
    query('SELECT COUNT(*)::int AS count FROM enquiries'),
    query(`${orderListSql} GROUP BY o.id ORDER BY o.created_at DESC LIMIT 6`),
    query(`SELECT d.day::date AS day, COUNT(o.id)::int AS count
      FROM generate_series((CURRENT_DATE - INTERVAL '6 days')::date, CURRENT_DATE, INTERVAL '1 day') AS d(day)
      LEFT JOIN orders o ON o.created_at::date = d.day::date
      GROUP BY d.day ORDER BY d.day`),
  ]);
  res.json({
    totalProducts: products.rows[0].count,
    totalOrders: orders.rows[0].count,
    pendingOrders: pending.rows[0].count,
    confirmedOrders: confirmed.rows[0].count,
    totalEnquiries: enquiries.rows[0].count,
    recentOrders: recent.rows.map(normalizeOrder),
    ordersByDay: daily.rows.map((row) => ({ day: new Date(row.day).toISOString(), count: Number(row.count) })),
  });
}));

const orderListSql = `SELECT o.id,o.customer_name,o.phone,o.address,o.instructions,o.subtotal,o.total,o.status,o.created_at,
  COALESCE(json_agg(json_build_object('id',oi.id,'product_id',oi.product_id,'product_name',oi.product_name,'quantity',oi.quantity,'unit',oi.unit,'unit_price',oi.unit_price,'line_total',oi.line_total) ORDER BY oi.created_at) FILTER (WHERE oi.id IS NOT NULL),'[]'::json) AS items
  FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id`;
function normalizeOrder(row: Record<string, unknown>) {
  const items = Array.isArray(row.items) ? row.items.map((item) => normalizeOrderItem(item as Record<string, unknown>)) : [];
  return { ...row, subtotal: numeric(row.subtotal), total: numeric(row.total), items };
}
function normalizeOrderItem(item: Record<string, unknown>) {
  return { ...item, quantity: Number(item.quantity), unit_price: numeric(item.unit_price), line_total: numeric(item.line_total) };
}
async function assertCategoryExists(id: string) {
  const result = await query('SELECT id FROM categories WHERE id=$1', [id]);
  if (!result.rowCount) throw new HttpError(400, 'Selected category does not exist.');
}
function isPgUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '23505';
}

app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));
const frontendDistPath = path.resolve(process.env.FRONTEND_DIST_DIR || '../frontend/dist');
if (existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath, { index: false }));
  app.get('*', (_req, res, next) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'), (error) => { if (error) next(error); });
  });
}
const errorHandler: ErrorRequestHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: error.issues.map((issue) => issue.message).join(' ') || 'Invalid request.' });
  }
  if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE' ? `Image exceeds the ${process.env.MAX_UPLOAD_MB || 5} MB limit.` : 'Image upload could not be processed.';
    return res.status(400).json({ message });
  }
  console.error('Unhandled request error:', error);
  return res.status(500).json({ message: 'A server error occurred. Please try again later.' });
};
app.use(errorHandler);

export default app;
