import { FilterBar, ProductCard, StatusBanner } from '../CatalogParts';
import { getCategories } from '../../../services/catalog';
import type { ProductCategory } from '../../../types/catalog';
import type { CatalogController } from '../useCatalogController';

export function CatalogoCognitivo({ controller }: { controller: CatalogController }) {
  return (
    <>
      <div className="catalog-heading">
        <div>
          <h1>Compra fácil, paso a paso</h1>
          <p>Frases cortas y precios claros. Te preguntamos antes de agregar cada producto.</p>
        </div>
        <span className="mode-badge"><span aria-hidden="true">✅</span> Guía incluida</span>
      </div>
      <ol className="guide-steps" aria-label="Pasos para comprar">
        <li><strong>1. Busca</strong> o elige una categoría.</li>
        <li><strong>2. Mira</strong> el precio y la imagen.</li>
        <li><strong>3. Agrega</strong> el producto a tu carrito.</li>
      </ol>
      <section className="category-chips" aria-label="Categorías sencillas">
        <h2>Categorías</h2>
        <div className="chips">
          <button className={controller.category === '' ? 'chip selected' : 'chip'}
            aria-pressed={controller.category === ''}
            onClick={() => controller.setCategory('')}>Todas</button>
          {getCategories().map((category: ProductCategory) => (
            <button key={category}
              className={controller.category === category ? 'chip selected' : 'chip'}
              aria-pressed={controller.category === category}
              onClick={() => controller.setCategory(category)}>
              {category}
            </button>
          ))}
        </div>
      </section>
      <FilterBar controller={controller} simple />
      <StatusBanner status={controller.status} />
      <section aria-labelledby="cognitivo-products-title">
        <h2 id="cognitivo-products-title">Productos</h2>
        {controller.products.length === 0 ? (
          <p className="empty-state" role="status">No hay productos. Prueba otra categoría.</p>
        ) : (
          <div className="product-grid simple-grid">
            {controller.products.map((product, index) => (
              <ProductCard key={product.id} controller={controller} product={product}
                index={index} mode="simple" askConfirmation />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
