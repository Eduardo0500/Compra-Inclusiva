import { FilterBar, ProductCard, StatusBanner } from '../CatalogParts';
import { formatPrice } from '../../../services/catalog';
import type { CatalogController } from '../useCatalogController';

export function CatalogoVisual({ controller }: { controller: CatalogController }) {
  const readResults = () => {
    const text = controller.products.length
      ? `Productos disponibles. ${controller.products.map((product, index) =>
        `${index + 1}. ${product.name}. ${formatPrice(product.price)}. ${product.simpleDescription}`).join(' ')}`
      : 'No hay productos para estos filtros.';
    controller.speak(text);
  };

  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>Catálogo visual</h1>
          <p>Productos con nombres, precios y descripciones listos para leerse con tecnología de asistencia.</p>
        </div>
        <span className="mode-badge"><span aria-hidden="true">🔊</span> Modo lectura</span>
      </div>
      <div className="a11y-toolbar" aria-label="Herramientas de lectura">
        <button className="btn btn-secondary" onClick={readResults}>
          <span aria-hidden="true">▶</span> Leer nombres y precios
        </button>
        <a className="btn btn-ghost" href="#productos">Saltar a los productos</a>
        <details className="keyboard-help">
          <summary>Atajos y navegación</summary>
          <p>Usa Tab para recorrer los productos, Mayús + Tab para retroceder y Enter para abrir cada tarjeta. El foco siempre es visible.</p>
        </details>
      </div>
      <FilterBar controller={controller} />
      <StatusBanner status={controller.status} />
      <section id="productos" aria-labelledby="visual-products-title" tabIndex={-1}>
        <h2 id="visual-products-title">Lista de productos</h2>
        {controller.products.length === 0 ? (
          <p className="empty-state" role="status">No encontramos productos con esos filtros. Prueba otra búsqueda.</p>
        ) : (
          <ol className="product-list">
            {controller.products.map((product, index) => (
              <li key={product.id}>
                <ProductCard controller={controller} product={product} index={index} mode="list" />
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
