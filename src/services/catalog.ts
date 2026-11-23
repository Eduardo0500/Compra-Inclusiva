import { CATEGORIES, PRODUCTS } from '../features/catalog/products';
import type { Product, ProductCategory } from '../types/catalog';

export interface CatalogQuery {
  search?: string;
  category?: ProductCategory | '';
  sort?: 'default' | 'low' | 'high' | 'name';
  availableOnly?: boolean;
}

export const formatPrice = (value: number): string =>
  `$${value.toLocaleString('es-CO')}`;

const normalize = (value: string): string =>
  value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

export const priceInWords = (value: number): string => {
  const units = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const teens = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  if (value < 10) return units[value] ?? String(value);
  if (value < 20) return teens[value - 10] ?? String(value);
  if (value < 100) return `${value}`;
  return value.toLocaleString('es-CO');
};

export function getAllProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(id: string): Product | null {
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

export function getCategories(): ProductCategory[] {
  return CATEGORIES;
}

export function queryProducts(query: CatalogQuery = {}): Product[] {
  const term = normalize(query.search ?? '');
  const filtered = PRODUCTS.filter((product) => {
    const categoryMatch = !query.category || product.category === query.category;
    const haystack = normalize([
      product.name,
      product.description,
      product.simpleDescription,
      product.category,
      ...product.tags,
    ].join(' '));
    const searchMatch = !term || haystack.includes(term);
    const availabilityMatch = query.availableOnly !== true || (product.available && product.stock > 0);
    return categoryMatch && searchMatch && availabilityMatch;
  });
  if (query.sort === 'low') return filtered.sort((a, b) => a.price - b.price);
  if (query.sort === 'high') return filtered.sort((a, b) => b.price - a.price);
  if (query.sort === 'name') return filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return filtered;
}

export function relatedProducts(product: Product, limit = 3): Product[] {
  return PRODUCTS.filter((item) => item.category === product.category && item.id !== product.id).slice(0, limit);
}

export function cartLines(cart: Record<string, number>): { product: Product; quantity: number; subtotal: number }[] {
  return PRODUCTS.flatMap((product) => {
    const quantity = cart[product.id] ?? 0;
    return quantity > 0
      ? [{ product, quantity: Math.min(quantity, product.stock), subtotal: product.price * Math.min(quantity, product.stock) }]
      : [];
  });
}

export function cartTotals(cart: Record<string, number>): { count: number; subtotal: number } {
  return cartLines(cart).reduce(
    (totals, line) => ({ count: totals.count + line.quantity, subtotal: totals.subtotal + line.subtotal }),
    { count: 0, subtotal: 0 }
  );
}
