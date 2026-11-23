import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SimpleText } from '../../shared/SimpleText';
import { formatPrice, getCategories } from '../../services/catalog';
import type { CatalogController } from './useCatalogController';
import type { Product } from '../../types/catalog';

interface FilterBarProps {
  controller: CatalogController;
  simple?: boolean;
  compact?: boolean;
}

export function FilterBar({ controller, simple = false, compact = false }: FilterBarProps) {
  return (
    <form
      className={`filter-bar${compact ? ' compact' : ''}`}
      onSubmit={(event) => event.preventDefault()}
      aria-label="Buscar y filtrar productos"
      role="search"
    >
      <div className="field">
        <label htmlFor="catalog-search">{simple ? 'Buscar' : 'Buscar producto'}</label>
        <input id="catalog-search" type="search" value={controller.search}
          placeholder="Nombre, categoría o necesidad"
          onChange={(event) => controller.setSearch(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="catalog-category">{simple ? 'Categoría' : 'Filtrar por categoría'}</label>
        <select id="catalog-category" value={controller.category}
          onChange={(event) => controller.setCategory(event.target.value as Product['category'] | '')}>
          <option value="">Todas las categorías</option>
          {getCategories().map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="catalog-sort">{simple ? 'Ordenar' : 'Ordenar por precio'}</label>
        <select id="catalog-sort" value={controller.sort}
          onChange={(event) => controller.setSort(event.target.value as CatalogController['sort'])}>
          <option value="default">Recomendados</option>
          <option value="low">Menor precio</option>
          <option value="high">Mayor precio</option>
          <option value="name">Nombre A-Z</option>
        </select>
      </div>
      <button className="btn btn-ghost" type="button" onClick={controller.resetFilters}>Limpiar filtros</button>
      <p className="filter-count" role="status">
        {controller.products.length} producto{controller.products.length === 1 ? '' : 's'} disponible{controller.products.length === 1 ? '' : 's'}
      </p>
    </form>
  );
}

export function StatusBanner({ status }: { status: { text: string; ok: boolean } | null }) {
  if (!status) return null;
  return (
    <p className={`feedback ${status.ok ? 'feedback-ok' : 'feedback-error'}`} role="status" aria-live="polite">
      <span aria-hidden="true">{status.ok ? '✓' : '⚠'}</span> {status.text}
    </p>
  );
}

interface ProductCardProps {
  controller: CatalogController;
  product: Product;
  index?: number;
  mode?: 'standard' | 'spacious' | 'simple' | 'list';
  askConfirmation?: boolean;
}

export function ProductCard({ controller, product, index, mode = 'standard', askConfirmation = false }: ProductCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const available = product.available && product.stock > 0;
  const { features, prefs } = controller;

  const doAdd = (amount = 1) => {
    controller.add(product, amount);
    setConfirming(false);
    setQuantity(1);
  };

  return (
    <article className={`product-card product-card-${mode}`} aria-labelledby={`product-title-${product.id}`}>
      <img className="product-image" src={product.image} alt={product.imageAlt} />
      <div className="product-body">
        {typeof index === 'number' && <p className="product-index">Producto {index + 1}</p>}
        <p className="product-category">{product.category}</p>
        <h2 id={`product-title-${product.id}`}>
          <Link to={`/producto/${product.id}`}>{product.name}</Link>
        </h2>
        <p className="product-description">
          <SimpleText full={product.description} simple={product.simpleDescription} />
        </p>
        <p className="product-price" aria-label={`Precio: ${formatPrice(product.price)}`}>
          <span aria-hidden="true">💲</span> {formatPrice(product.price)}
        </p>
        <p className={available ? 'stock-ok' : 'stock-error'}>
          <span aria-hidden="true">{available ? '●' : '✕'}</span>{' '}
          {available ? `Disponible · ${product.stock} unidades` : 'Agotado'}
        </p>
        <div className="card-actions">
          <Link className="btn btn-secondary" to={`/producto/${product.id}`}>
            Ver detalles <span className="sr-only">de {product.name}</span>
          </Link>
          {features.visual && (
            <button type="button" className="btn btn-ghost"
              onClick={() => controller.readProduct(product)}
              aria-label={`Escuchar información de ${product.name}`}>
              <span aria-hidden="true">🔊</span> Escuchar
            </button>
          )}
        </div>
        {features.motriz && available && (
          <div className="quick-add">
            <button type="button" className="btn btn-secondary"
              aria-label={`Quitar una unidad de ${product.name}`}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
            <output aria-live="polite" aria-label={`Cantidad seleccionada: ${quantity}`}>{quantity}</output>
            <button type="button" className="btn btn-secondary"
              aria-label={`Agregar una unidad de ${product.name}`}
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}>+</button>
          </div>
        )}
        {askConfirmation && confirming ? (
          <div className="confirm-box" role="group" aria-label={`Confirmar agregar ${product.name}`}>
            <p>¿Agregar {product.name} al carrito?</p>
            <div className="actions">
              <button type="button" className="btn btn-primary" onClick={() => doAdd()}>Sí, agregar</button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>No</button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-primary add-button"
            disabled={!available}
            aria-label={`Agregar ${product.name} al carrito por ${formatPrice(product.price)}`}
            onClick={() => askConfirmation ? setConfirming(true) : doAdd(features.motriz ? quantity : 1)}>
            <span aria-hidden="true">＋</span> Agregar al carrito
          </button>
        )}
        {features.auditiva && (
          <details className="transcript">
            <summary>Leer información importante</summary>
            <p>{product.transcript}</p>
          </details>
        )}
        {prefs.simpleLanguage && <p className="simple-hint">Pulsa «Ver detalles» para saber más.</p>}
      </div>
    </article>
  );
}
