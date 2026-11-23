import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Order } from '../types/catalog';
import { cartLines, getProduct } from '../services/catalog';
import { safeStorage, STORAGE_KEYS } from '../services/storage';
import { useAuth } from './AuthContext';

interface ShopContextValue {
  cart: Record<string, number>;
  orders: Order[];
  cartCount: number;
  subtotal: number;
  addToCart: (productId: string, quantity?: number) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (order: Omit<Order, 'id' | 'date' | 'status' | 'userId'>) => Order | null;
  getOrder: (id: string) => Order | null;
}

const ShopContext = createContext<ShopContextValue | null>(null);
const ORDERS_BY_USER = 'orders-by-user';

function readOrders(): Record<string, Order[]> {
  const legacy = safeStorage.get<Order[]>(STORAGE_KEYS.orders, []);
  const grouped = safeStorage.get<Record<string, Order[]>>(ORDERS_BY_USER, {});
  if (legacy.length) {
    legacy.forEach((order) => {
      const key = order.userId ?? 'sin-usuario';
      grouped[key] = [...(grouped[key] ?? []), order];
    });
    safeStorage.set(ORDERS_BY_USER, grouped);
    safeStorage.remove(STORAGE_KEYS.orders);
  }
  return grouped;
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [allOrders, setAllOrders] = useState<Record<string, Order[]>>(readOrders);
  const cart = user?.cart ?? {};
  const orders = user ? (allOrders[user.id] ?? []) : [];

  const saveCart = useCallback((next: Record<string, number>) => {
    if (user) updateUser({ ...user, cart: next });
  }, [user, updateUser]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    const product = getProduct(productId);
    if (!product || !product.available || product.stock <= 0 || quantity <= 0) return false;
    const current = cart[productId] ?? 0;
    const nextQuantity = Math.min(product.stock, current + quantity);
    if (nextQuantity === current) return false;
    saveCart({ ...cart, [productId]: nextQuantity });
    return true;
  }, [cart, saveCart]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const product = getProduct(productId);
    const max = product?.stock ?? 0;
    const next = { ...cart };
    if (quantity <= 0 || max <= 0) delete next[productId];
    else next[productId] = Math.min(quantity, max);
    saveCart(next);
  }, [cart, saveCart]);

  const removeFromCart = useCallback((productId: string) => {
    const next = { ...cart };
    delete next[productId];
    saveCart(next);
  }, [cart, saveCart]);

  const clearCart = useCallback(() => saveCart({}), [saveCart]);

  const createOrder = useCallback((data: Omit<Order, 'id' | 'date' | 'status' | 'userId'>) => {
    if (!user) return null;
    const lines = cartLines(cart);
    if (!lines.length) return null;
    const unavailable = lines.some(({ product, quantity }) => {
      const current = getProduct(product.id);
      return !current || !current.available || current.stock < quantity;
    });
    if (unavailable) return null;
    const order: Order = {
      ...data,
      id: `CF-${Date.now().toString(36).toUpperCase().slice(-8)}`,
      date: new Date().toISOString(),
      status: 'Confirmado',
      userId: user.id,
    };
    saveCart({});
    const next = { ...allOrders, [user.id]: [order, ...(allOrders[user.id] ?? [])] };
    safeStorage.set(ORDERS_BY_USER, next);
    setAllOrders(next);
    updateUser({ ...user, cart: {}, orders: [order.id, ...(user.orders ?? [])] });
    return order;
  }, [user, cart, allOrders, updateUser, saveCart]);

  const getOrder = useCallback((id: string) =>
    user ? orders.find((order) => order.id === id && order.userId === user.id) ?? null : null,
  [orders, user]);

  const totals = useMemo(() => cartLines(cart).reduce(
    (result, line) => ({ count: result.count + line.quantity, subtotal: result.subtotal + line.subtotal }),
    { count: 0, subtotal: 0 }
  ), [cart]);

  const value = useMemo(() => ({
    cart, orders, cartCount: totals.count, subtotal: totals.subtotal,
    addToCart, setQuantity, removeFromCart, clearCart, createOrder, getOrder,
  }), [cart, orders, totals, addToCart, setQuantity, removeFromCart, clearCart, createOrder, getOrder]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}
