import { FilterBar, ProductCard, StatusBanner } from '../CatalogParts';
import type { CatalogController } from '../useCatalogController';

export function CatalogoMotriz({ controller }: { controller: CatalogController }) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>Catálogo motriz</h1>
          <p>Botones grandes, más espacio y compra rápida: elige la cantidad y agrega en un solo paso.</p>
        </div>
        <span className="mode-badge"><span aria-hidden="true">👆</span> Compra rápida</span>
      </div>
      <a className="btn btn-primary skip-to-products" href="#productos">Ir directo a los productos</a>
      <FilterBar controller={controller} compact />
      <StatusBanner status={controller.status} />
      <section id="productos" aria-labelledby="motriz-products-title" tabIndex={-1}>
        <h2 id="motriz-products-title">Elige y agrega</h2>
        {controller.products.length === 0 ? (
          <p className="empty-state" role="status">No hay productos con estos filtros.</p>
        ) : (
          <div className="product-grid spacious-grid">
            {controller.products.map((product) => (
              <ProductCard key={product.id} controller={controller} product={product} mode="spacious" />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
