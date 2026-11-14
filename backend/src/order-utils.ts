export interface MessageCustomer {
  name: string;
  phone: string;
  address: string;
  instructions?: string;
}
export interface MessageLine {
  product_name: string;
  unit: string;
  quantity: number;
  unit_cents: number;
  line_cents: number;
}

export function calculateLineTotals(price: number | string, quantity: number): { unit_cents: number; line_cents: number } {
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice < 0 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError('Price or quantity is invalid.');
  }
  const unit_cents = Math.round(numericPrice * 100);
  return { unit_cents, line_cents: unit_cents * quantity };
}

export function buildOrderMessage(customer: MessageCustomer, lines: MessageLine[], subtotalCents: number): string {
  const sections = [
    'DCY DAIRY FARM – NEW ORDER',
    '',
    'Customer details:',
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Address: ${customer.address}`,
    ...(customer.instructions ? [`Instructions: ${customer.instructions}`] : []),
    '',
    'Order items:',
    ...lines.flatMap((line) => [
      line.product_name,
      `Quantity: ${line.quantity} × ${line.unit}`,
      `Unit price: ₹${(line.unit_cents / 100).toFixed(2)}`,
      `Line total: ₹${(line.line_cents / 100).toFixed(2)}`,
      '',
    ]),
    `Subtotal: ₹${(subtotalCents / 100).toFixed(2)}`,
    `Total: ₹${(subtotalCents / 100).toFixed(2)}`,
  ];
  return sections.join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string | null {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
