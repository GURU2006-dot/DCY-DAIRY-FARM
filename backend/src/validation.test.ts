import test from 'node:test';
import assert from 'node:assert/strict';
import { emailSchema, enquirySchema, orderSchema, productSchema, sanitizeText, settingsSchema } from './validation.js';

const uuid1 = '0c792e21-66ad-4e1b-8aa7-fdc31ce0b18f';
const uuid2 = '8c235b3e-ffda-4c2d-b7e2-ea12f77567fd';

test('email is normalized to lowercase', () => {
  assert.equal(emailSchema.parse('  FARM@Example.in  '), 'farm@example.in');
});

test('product validation rejects zero/negative prices', () => {
  const valid = { name: 'Milk', description: 'Sample description', price: 72.5, unit: '1 litre', category_id: null, image_url: null, available: true };
  assert.equal(productSchema.parse(valid).price, 72.5);
  assert.equal(productSchema.safeParse({ ...valid, price: 0 }).success, false);
  const unpricedDraft = { ...valid, price: null, available: false };
  assert.equal(productSchema.safeParse(unpricedDraft).success, true);
  assert.equal(productSchema.safeParse({ ...unpricedDraft, available: true }).success, false);
  assert.equal(productSchema.safeParse({ ...valid, image_url: 'javascript:alert(1)' }).success, false);
});

test('order validation requires distinct product lines and bounded quantities', () => {
  const valid = { customer_name: 'Anita Rao', phone: '+91 98765 43210', address: '12 Farm Road, Hyderabad 500001', items: [{ product_id: uuid1, quantity: 2 }] };
  assert.equal(orderSchema.safeParse(valid).success, true);
  assert.equal(orderSchema.safeParse({ ...valid, items: [...valid.items, ...valid.items] }).success, false);
  assert.equal(orderSchema.safeParse({ ...valid, items: [{ product_id: uuid1, quantity: 100 }] }).success, false);
});

test('enquiry fields are validated and spam honeypot is optional', () => {
  const valid = { name: 'Anita Rao', email: 'anita@example.in', subject: 'Product question', message: 'Could you please share the available pack sizes?' };
  assert.equal(enquirySchema.safeParse(valid).success, true);
  assert.equal(enquirySchema.safeParse({ ...valid, message: 'Short' }).success, false);
  assert.equal(enquirySchema.safeParse({ ...valid, website: 'spam bot' }).success, true);
});

test('settings reject malformed social URLs', () => {
  const valid = { business_name: 'DCY DAIRY FARM', tagline: 'Freshness You Can Trust', social_links: { instagram: 'https://example.com/dcy' } };
  assert.equal(settingsSchema.safeParse(valid).success, true);
  assert.equal(settingsSchema.safeParse({ ...valid, social_links: { instagram: 'javascript:bad' } }).success, false);
});

test('sanitizer strips control characters without altering user punctuation', () => {
  assert.equal(sanitizeText('Milk\u0000 & cream'), 'Milk & cream');
  assert.notEqual(uuid1, uuid2);
});
