import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Order } from '../types/catalog';
import { useAuth } from './AuthContext';

interface ShopContextValue {
  cart: Record<string, number>;
  orders: Order[];
  addToCart: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createOrder: (order: Omit<Order, 'id' | 'date' | 'status' | 'userId'>) => Order | null;
  getOrder: (id: string) => Order | null;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user, updateUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => {
    try { return JSON.parse(localStorage.getItem('shop-orders') || '[]') as Order[]; } catch { return []; }
  });
  const cart = user?.cart ?? {};

  const persistUserCart = useCallback((next: Record<string, number>) => {
    if (user) updateUser({ ...user, cart: next });
  }, [user, updateUser]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    persistUserCart({ ...cart, [productId]: (cart[productId] ?? 0) + quantity });
  }, [cart, persistUserCart]);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    const next = { ...cart };
    if (quantity <= 0) delete next[productId];
    else next[productId] = quantity;
    persistUserCart(next);
  }, [cart, persistUserCart]);

  const removeFromCart = useCallback((productId: string) => {
    const next = { ...cart };
    delete next[productId];
    persistUserCart(next);
  }, [cart, persistUserCart]);

  const clearCart = useCallback(() => persistUserCart({}), [persistUserCart]);

  const createOrder = useCallback((data: Omit<Order, 'id' | 'date' | 'status' | 'userId'>) => {
    if (!user) return null;
    const order: Order = {
      ...data,
      id: `CF-${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      status: 'Confirmado',
      userId: user.id,
    };
    setOrders((prev) => {
      const next = [...prev, order];
      localStorage.setItem('shop-orders', JSON.stringify(next));
      return next;
    });
    updateUser({ ...user, cart: {}, orders: [...(user.orders ?? []), order.id] });
    return order;
  }, [user, updateUser]);

  const getOrder = useCallback((id: string) =>
    user ? orders.find((order) => order.id === id && order.userId === user.id) ?? null : null,
  [orders, user]);

  const value = useMemo(() => ({
    cart,
    orders: user ? orders.filter((order) => order.userId === user.id) : [],
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    getOrder,
  }), [cart, orders, user, addToCart, setQuantity, removeFromCart, clearCart, createOrder, getOrder]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}
