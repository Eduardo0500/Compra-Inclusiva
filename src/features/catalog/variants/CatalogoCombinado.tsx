import { FilterBar, ProductCard, StatusBanner } from '../CatalogParts';
import { formatPrice } from '../../../services/catalog';
import type { CatalogController } from '../useCatalogController';

export function CatalogoCombinado({ controller }: { controller: CatalogController }) {
  const readResults = () => {
    const text = controller.products.length
      ? controller.products.map((product) => `${product.name}, ${formatPrice(product.price)}. ${product.simpleDescription}`).join(' ')
      : 'No hay productos disponibles con estos filtros.';
    controller.speak(text);
  };

  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>Catálogo con todas tus adaptaciones</h1>
          <p>Reúne lectura, avisos visuales, botones grandes, instrucciones claras y confirmaciones.</p>
        </div>
        <span className="mode-badge"><span aria-hidden="true">♿</span> Perfil combinado</span>
      </div>
      <section className="combined-toolbar" aria-label="Herramientas combinadas">
        <button className="btn btn-secondary" onClick={readResults}>
          <span aria-hidden="true">🔊</span> Leer productos
        </button>
        <a className="btn btn-ghost" href="#productos">Saltar a los productos</a>
        <p className="visual-notice" role="note">
          <span aria-hidden="true">✍️</span> Todas las acciones se confirman por escrito y con avisos visibles.
        </p>
      </section>
      <ol className="guide-steps" aria-label="Pasos para comprar">
        <li><strong>1. Busca</strong> el producto.</li>
        <li><strong>2. Escucha o lee</strong> su información.</li>
        <li><strong>3. Confirma</strong> antes de agregarlo.</li>
      </ol>
      <FilterBar controller={controller} />
      <StatusBanner status={controller.status} />
      <section id="productos" aria-labelledby="combinado-products-title" tabIndex={-1}>
        <h2 id="combinado-products-title">Productos con adaptaciones completas</h2>
        {controller.products.length === 0 ? (
          <p className="empty-state" role="status">No hay resultados con los filtros actuales.</p>
        ) : (
          <div className="product-grid spacious-grid">
            {controller.products.map((product, index) => (
              <ProductCard key={product.id} controller={controller} product={product}
                index={index} mode="spacious" askConfirmation />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
