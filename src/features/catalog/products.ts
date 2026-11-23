import type { Product } from '../../types/catalog';

export const PRODUCTS: Product[] = [
  { id: 'arroz', name: 'Arroz integral', description: 'Bolsa de arroz integral de un kilogramo.', price: 8500, category: 'Alimentos', available: true, stock: 24, image: '', imageAlt: 'Bolsa de arroz integral' },
  { id: 'pan', name: 'Pan integral', description: 'Pan fresco, corteza suave y alto contenido de fibra.', price: 6200, category: 'Alimentos', available: true, stock: 18, image: '', imageAlt: 'Pan integral en rebanadas' },
  { id: 'agua', name: 'Agua mineral', description: 'Botella de agua mineral de un litro y medio.', price: 3200, category: 'Bebidas', available: true, stock: 40, image: '', imageAlt: 'Botella de agua mineral' },
  { id: 'jugo', name: 'Jugo natural', description: 'Jugo de frutas sin azúcar añadida, botella de un litro.', price: 7800, category: 'Bebidas', available: true, stock: 20, image: '', imageAlt: 'Botella de jugo natural' },
  { id: 'detergente', name: 'Detergente líquido', description: 'Detergente concentrado para ropa, botella de dos litros.', price: 18500, category: 'Limpieza', available: true, stock: 15, image: '', imageAlt: 'Botella de detergente líquido' },
  { id: 'jabón', name: 'Jabón de manos', description: 'Jabón líquido suave con dispensador de 500 mililitros.', price: 9500, category: 'Higiene personal', available: true, stock: 30, image: '', imageAlt: 'Dispensador de jabón de manos' },
  { id: 'bombillo', name: 'Bombillo LED', description: 'Bombillo LED de bajo consumo y luz cálida.', price: 12400, category: 'Productos para el hogar', available: true, stock: 12, image: '', imageAlt: 'Bombillo LED blanco' },
  { id: 'crema', name: 'Crema hidratante', description: 'Crema hidratante suave para uso diario, 250 mililitros.', price: 16800, category: 'Cuidado personal', available: true, stock: 16, image: '', imageAlt: 'Tubo de crema hidratante' },
];
