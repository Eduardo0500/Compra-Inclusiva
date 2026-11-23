import { FilterBar, ProductCard, StatusBanner } from '../CatalogParts';
import type { CatalogController } from '../useCatalogController';

export function CatalogoGeneral({ controller }: { controller: CatalogController }) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>Catálogo general</h1>
          <p>Productos de primera necesidad con navegación accesible para todas las personas.</p>
        </div>
        <span className="mode-badge"><span aria-hidden="true">🛒</span> Todos los productos</span>
      </div>
      <FilterBar controller={controller} />
      <StatusBanner status={controller.status} />
      <section aria-labelledby="general-products-title">
        <h2 id="general-products-title">Productos disponibles</h2>
        {controller.products.length === 0 ? (
          <p className="empty-state" role="status">No encontramos productos. Prueba otra búsqueda.</p>
        ) : (
          <div className="product-grid">
            {controller.products.map((product) => (
              <ProductCard key={product.id} controller={controller} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
