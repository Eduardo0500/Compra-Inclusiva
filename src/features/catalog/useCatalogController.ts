import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccessibility } from '../../app/AccessibilityContext';
import { useAuth } from '../../app/AuthContext';
import { useShop } from '../../app/ShopContext';
import { formatPrice, getCategories, queryProducts } from '../../services/catalog';
import { needsForUser, type CatalogKind } from '../../services/identity';
import type { Product, ProductCategory } from '../../types/catalog';

type Sort = 'default' | 'low' | 'high' | 'name';

export function useCatalogController(kind: CatalogKind) {
  const { user } = useAuth();
  const { addToCart } = useShop();
  const { prefs, announce } = useAccessibility();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState<ProductCategory | ''>(
    (params.get('category') as ProductCategory | null) ?? ''
  );
  const [sort, setSort] = useState<Sort>('default');
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    const nextCategory = params.get('category') as ProductCategory | null;
    setSearch(params.get('q') ?? '');
    setCategory(nextCategory && getCategories().includes(nextCategory) ? nextCategory : '');
  }, [params]);

  const products = useMemo(
    () => queryProducts({ search, category, sort, availableOnly: true }),
    [search, category, sort]
  );

  const needs = needsForUser(user);
  const features = useMemo(() => ({
    visual: kind === 'visual' || kind === 'combinado',
    auditiva: kind === 'auditivo' || kind === 'combinado',
    motriz: kind === 'motriz' || kind === 'combinado',
    cognitiva: kind === 'cognitivo' || kind === 'combinado',
  }), [kind]);

  const speak = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-CO';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
    announce(text);
  }, [announce]);

  const add = useCallback((product: Product, quantity = 1) => {
    const ok = addToCart(product.id, quantity);
    const text = ok
      ? `${quantity} ${product.name} agregado al carrito. Precio ${formatPrice(product.price)} cada uno.`
      : `No se pudo agregar ${product.name}. Revisa la disponibilidad.`;
    setStatus({ text, ok });
    announce(text);
    if (ok && features.visual && prefs.readContent) {
      speak(`${product.name}. ${formatPrice(product.price)}. ${product.simpleDescription}. Agregado al carrito.`);
    }
    return ok;
  }, [addToCart, announce, features.visual, prefs.readContent, speak]);

  const readProduct = useCallback((product: Product) => {
    speak(`${product.name}. ${formatPrice(product.price)}. ${product.description} ${product.details.join(' ')}`);
  }, [speak]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setCategory('');
    setSort('default');
    announce('Filtros eliminados. Se muestran todos los productos.');
  }, [announce]);

  return {
    kind, needs, prefs, features, products, search, setSearch, category, setCategory,
    sort, setSort, status, setStatus, add, readProduct, speak, resetFilters,
  };
}

export type CatalogController = ReturnType<typeof useCatalogController>;
