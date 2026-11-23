import { useMemo, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import { useShop } from '../../app/ShopContext';
import { useAccessibility } from '../../app/AccessibilityContext';
import { SkipLink } from '../../shared/SkipLink';
import { PRODUCTS } from './products';
import type { ProductCategory } from '../../types/catalog';

export type CatalogKind = 'visual' | 'auditivo' | 'motriz' | 'cognitivo' | 'combinado' | 'general';

export function catalogKindForUser(disabilities: string[] = []) {
  const needs = disabilities.filter((item) => !['ninguna', 'no_indica'].includes(item));
  if (needs.length > 1) return 'combinado';
  if (needs.length === 1) {
    if (needs[0] === 'auditiva') return 'auditivo';
    if (needs[0] === 'motriz') return 'motriz';
    if (needs[0] === 'cognitiva') return 'cognitivo';
    return 'visual';
  }
  return 'general';
}

const TITLES: Record<CatalogKind, string> = {
  visual: 'Catálogo visual',
  auditivo: 'Catálogo auditivo',
  motriz: 'Catálogo motriz',
  cognitivo: 'Catálogo cognitivo',
  combinado: 'Catálogo combinado',
  general: 'Catálogo general',
};

export function CatalogPage() {
  const { kind } = useParams();
  const { user } = useAuth();
  const { addToCart } = useShop();
  const { announce: announceA11y, prefs } = useAccessibility();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProductCategory | ''>('');
  const [sort, setSort] = useState('default');

  if (!kind && user) return <Navigate to={`/catalog/${catalogKindForUser(user.disabilities)}`} replace />;
  const activeKind = (kind ?? 'general') as CatalogKind;
  if (!Object.prototype.hasOwnProperty.call(TITLES, activeKind)) return <Navigate to="/catalog" replace />;

  const products = useMemo(() => {
    const filtered = PRODUCTS.filter((product) =>
      (!category || product.category === category)
      && `${product.name} ${product.description} ${product.category}`
        .toLowerCase().includes(search.toLowerCase())
    );
    if (sort === 'low') return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === 'high') return [...filtered].sort((a, b) => b.price - a.price);
    return filtered;
  }, [search, category, sort]);

  const categories = [...new Set(PRODUCTS.map((product) => product.category))] as ProductCategory[];

  const add = (productId: string, name: string) => {
    addToCart(productId);
    announceA11y(`${name} agregado al carrito.`);
  };

  return (
    <>
      <SkipLink />
      <main id="main-content" className={`page catalog-page catalog-${activeKind}`}>
        <h1>{TITLES[activeKind]}</h1>
        <p className="catalog-note">
          {activeKind === 'combinado'
            ? 'Este catálogo combina todas las adaptaciones de tu perfil.'
            : 'Todos los productos tienen el mismo precio y disponibilidad.'}
        </p>
        <div className="catalog-tools" aria-label="Herramientas de búsqueda">
          <div className="field">
            <label htmlFor="catalog-search">Buscar productos</label>
            <input id="catalog-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="catalog-category">Categoría</label>
            <select id="catalog-category" value={category} onChange={(event) => setCategory(event.target.value as ProductCategory | '')}>
              <option value="">Todas</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="catalog-sort">Ordenar por precio</label>
            <select id="catalog-sort" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="default">Recomendados</option>
              <option value="low">Menor a mayor</option>
              <option value="high">Mayor a menor</option>
            </select>
          </div>
        </div>
        {activeKind === 'visual' && (
          <button className="btn btn-secondary" onClick={() => {
            const text = products.map((p) => `${p.name}, ${p.price.toLocaleString('es-CO')} pesos`).join('. ');
            announceA11y(text);
          }}>
            Leer resultados
          </button>
        )}
        <div className="product-grid" aria-label="Productos disponibles">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image" role="img" aria-label={product.imageAlt}>
                <span aria-hidden="true">🛒</span>
              </div>
              <div>
                <p className="product-category">{product.category}</p>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <p className="product-price">${product.price.toLocaleString('es-CO')}</p>
                <p>{product.available ? `Disponible: ${product.stock}` : 'Agotado'}</p>
                <button
                  className="btn btn-primary"
                  disabled={!product.available}
                  onClick={() => add(product.id, product.name)}
                  aria-label={`Agregar ${product.name} al carrito`}
                >
                  Agregar al carrito
                </button>
              </div>
            </article>
          ))}
        </div>
        {prefs.readContent && <button className="btn btn-ghost" onClick={() => announceA11y(document.body.innerText)}>Leer toda la página</button>}
      </main>
    </>
  );
}
