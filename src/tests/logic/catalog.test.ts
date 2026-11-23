import { describe, expect, it } from 'vitest';
import { PRODUCTS } from '../../features/catalog/products';
import { cartLines, cartTotals, getCategories, queryProducts } from '../../services/catalog';

describe('catálogo único y carrito', () => {
  it('tiene productos suficientes y categoríasReales', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(12);
    expect(getCategories().length).toBeGreaterThanOrEqual(4);
  });

  it('busca sin distinguir tildes ni mayúsculas', () => {
    expect(queryProducts({ search: 'AGUA' }).length).toBeGreaterThan(0);
    expect(queryProducts({ search: 'jabon' }).length).toBeGreaterThan(0);
  });

  it('calcula líneas, cantidad y totales desde el mismo inventario', () => {
    const first = PRODUCTS[0];
    const second = PRODUCTS[1];
    const lines = cartLines({ [first.id]: 2, [second.id]: 1 });
    expect(lines).toHaveLength(2);
    const totals = cartTotals({ [first.id]: 2, [second.id]: 1 });
    expect(totals.count).toBe(3);
    expect(totals.subtotal).toBe(first.price * 2 + second.price);
  });
});
