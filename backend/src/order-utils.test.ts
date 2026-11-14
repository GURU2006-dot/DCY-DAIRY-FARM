import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderMessage, buildWhatsAppUrl, calculateLineTotals } from './order-utils.js';

test('line totals are calculated in integer paise to avoid floating-point drift', () => {
  const line = calculateLineTotals('79.90', 3);
  assert.deepEqual(line, { unit_cents: 7990, line_cents: 23970 });
  assert.throws(() => calculateLineTotals(-1, 1), RangeError);
  assert.throws(() => calculateLineTotals(10, 0), RangeError);
});

test('order message contains customer, item, quantities and server-calculated totals', () => {
  const message = buildOrderMessage(
    { name: 'Anita Rao', phone: '+91 98765 43210', address: '12 Farm Road, Hyderabad', instructions: 'Call on arrival' },
    [{ product_name: 'Fresh Milk', unit: '1 litre', quantity: 2, unit_cents: 7990, line_cents: 15980 }],
    15980,
  );
  assert.match(message, /DCY DAIRY FARM – NEW ORDER/);
  assert.match(message, /Name: Anita Rao/);
  assert.match(message, /Quantity: 2 × 1 litre/);
  assert.match(message, /Unit price: ₹79\.90/);
  assert.match(message, /Line total: ₹159\.80/);
  assert.match(message, /Subtotal: ₹159\.80/);
  assert.match(message, /Total: ₹159\.80/);
});

test('WhatsApp link normalizes the destination and URL-encodes message content', () => {
  const url = buildWhatsAppUrl('+91 (98765) 43210', 'Order & quantity × 2');
  assert.ok(url);
  assert.equal(url, `https://wa.me/919876543210?text=${encodeURIComponent('Order & quantity × 2')}`);
  assert.equal(buildWhatsAppUrl('not configured', 'message'), null);
});
