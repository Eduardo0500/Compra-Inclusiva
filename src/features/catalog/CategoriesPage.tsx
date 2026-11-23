import { Link } from 'react-router-dom';
import { SkipLink } from '../../shared/SkipLink';
import { useAuth } from '../../app/AuthContext';
import { getAllProducts, getCategories } from '../../services/catalog';
import { catalogKindForUser } from '../../services/identity';

export function CategoriesPage() {
  const { user } = useAuth();
  const kind = catalogKindForUser(user);
  const categories = getCategories();

  return (
    <>
      <SkipLink />
      <main id="main-content" className="page wide-page" tabIndex={-1}>
        <h1>Categorías</h1>
        <p className="muted">Elige una categoría para ver solo esos productos. Todos están disponibles en tu catálogo.</p>
        <div className="category-grid">
          {categories.map((category) => {
            const products = getAllProducts().filter((product) => product.category === category);
            return (
              <article className="card category-card" key={category}>
                <h2>{category}</h2>
                <p>{products.length} producto{products.length === 1 ? '' : 's'}</p>
                <ul>
                  {products.map((product) => <li key={product.id}>{product.name}</li>)}
                </ul>
                <Link className="btn btn-primary"
                  to={`/catalog/${kind}?category=${encodeURIComponent(category)}`}>
                  Ver {category} <span className="sr-only">en mi catálogo</span>
                </Link>
              </article>
            );
          })}
        </div>
        <Link className="btn btn-ghost" to={`/catalog/${kind}`}>Volver a todos los productos</Link>
      </main>
    </>
  );
}
