import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, Product } from '../types';
import { isDemoMode } from '../lib/api';

const STORAGE_KEY = 'dcy-dairy-cart-v1';
interface CartValue {
  lines: CartLine[];
  itemCount: number;
  subtotal: number | null;
  add: (product: Product) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}
const CartContext = createContext<CartValue | null>(null);

function readSavedCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const decoded = JSON.parse(raw) as CartLine[];
    return Array.isArray(decoded) ? decoded.filter((line) => line?.product?.id && Number.isInteger(line.quantity) && line.quantity > 0
      && typeof line.product.price === 'number' && Number.isFinite(line.product.price) && line.product.price > 0) : [];
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readSavedCart);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* Sandboxed previews may block persistent storage; cart remains usable for this visit. */ } }, [lines]);

  const add = (product: Product) => {
    if (!product.available || product.price === null || !Number.isFinite(product.price) || product.price <= 0 || (product.is_sample && !isDemoMode)) return false;
    setLines((current) => {
      const found = current.find((line) => line.product.id === product.id);
      if (found) return current.map((line) => line.product.id === product.id ? { ...line, product, quantity: Math.min(line.quantity + 1, 99) } : line);
      return [...current, { product, quantity: 1 }];
    });
    return true;
  };
  const setQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) { setLines((current) => current.filter((line) => line.product.id !== productId)); return; }
    setLines((current) => current.map((line) => line.product.id === productId ? { ...line, quantity: Math.min(99, Math.floor(quantity)) } : line));
  };
  const remove = (productId: string) => setLines((current) => current.filter((line) => line.product.id !== productId));
  const clear = () => setLines([]);
  const value = useMemo(() => ({
    lines, itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: lines.some((line) => line.product.price === null || !Number.isFinite(line.product.price) || line.product.price <= 0)
      ? null
      : lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0),
    add, setQuantity, remove, clear,
  }), [lines]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
