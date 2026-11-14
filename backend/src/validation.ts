import { z } from 'zod';

export const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
export const idParamSchema = z.string().uuid();
const phoneSchema = z.string().trim().min(8).max(20).refine((value) => value.replace(/\D/g, '').length >= 8 && value.replace(/\D/g, '').length <= 15, 'Enter a valid phone number.');
const imageUrlSchema = z.string().trim().max(1000).nullable().optional().refine((value) => {
  if (!value) return true;
  if (value.startsWith('/uploads/')) return !value.includes('..');
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:'; } catch { return false; }
}, 'Image must be an HTTP(S) URL or an uploaded image path.');

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });
export const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  price: z.union([z.coerce.number().finite().positive().max(99999999.99), z.null()]),
  unit: z.string().trim().min(1).max(50),
  category_id: z.string().uuid().nullable().optional(),
  image_url: imageUrlSchema,
  available: z.boolean().default(false),
}).superRefine((product, context) => {
  if (product.available && product.price === null) {
    context.addIssue({ code: 'custom', path: ['price'], message: 'Set a real positive price before marking this product available.' });
  }
});
export const categorySchema = z.object({ name: z.string().trim().min(1).max(80) });
export const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  phone: phoneSchema,
  address: z.string().trim().min(8).max(500),
  instructions: z.string().trim().max(500).optional().default(''),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(50)
    .refine((items) => new Set(items.map((item) => item.product_id)).size === items.length, 'Each product may appear only once.'),
});
export const enquirySchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: emailSchema,
  phone: z.string().trim().max(20).optional().default(''),
  subject: z.string().trim().min(2).max(160),
  message: z.string().trim().min(10).max(3000),
  website: z.string().max(200).optional().default(''),
});
export const orderStatusSchema = z.object({ status: z.enum(['PENDING','CONFIRMED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED']) });
export const enquiryPatchSchema = z.object({ is_read: z.boolean().optional(), is_resolved: z.boolean().optional() }).refine((value) => Object.keys(value).length > 0, 'At least one enquiry field is required.');
export const settingsSchema = z.object({
  business_name: z.string().trim().min(1).max(120),
  tagline: z.string().trim().min(1).max(180),
  whatsapp_number: z.string().trim().max(20).default(''),
  contact_number: z.string().trim().max(20).default(''),
  email: z.string().trim().max(254).default('').refine((value) => !value || z.string().email().safeParse(value).success, 'Enter a valid email.'),
  address: z.string().trim().max(500).default(''),
  opening_hours: z.string().trim().max(250).default(''),
  social_links: z.record(z.string().max(30), z.string().trim().url().max(500).refine((value) => /^https?:\/\//i.test(value), 'Social links must use HTTP or HTTPS.')).default({}),
});

export function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}
