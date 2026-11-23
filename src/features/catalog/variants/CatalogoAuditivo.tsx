import { FilterBar, ProductCard, StatusBanner } from '../CatalogParts';
import type { CatalogController } from '../useCatalogController';

export function CatalogoAuditivo({ controller }: { controller: CatalogController }) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>Catálogo auditivo</h1>
          <p>Toda la información importante aparece por escrito. No necesitas escuchar sonidos para comprar.</p>
        </div>
        <span className="mode-badge"><span aria-hidden="true">✍️</span> Sin sonido</span>
      </div>
      <div className="visual-notice" role="note">
        <p><strong>Avisos visuales activados.</strong> Cada acción muestra un mensaje en pantalla. Las descripciones de productos incluyen transcripción.</p>
      </div>
      <StatusBanner status={controller.status} />
      <FilterBar controller={controller} />
      <section aria-labelledby="auditivo-products-title">
        <h2 id="auditivo-products-title">Productos disponibles</h2>
        <ol className="instructions-list">
          <li>Busca o elige una categoría.</li>
          <li>Lee el precio y la disponibilidad en cada tarjeta.</li>
          <li>Pulsa «Agregar al carrito». Verás una confirmación escrita.</li>
        </ol>
        {controller.products.length === 0 ? (
          <p className="empty-state" role="status">No hay resultados. Cambia la búsqueda o la categoría.</p>
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
