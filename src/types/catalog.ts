export type ProductCategory =
  | 'Alimentos'
  | 'Bebidas'
  | 'Limpieza'
  | 'Higiene personal'
  | 'Productos para el hogar'
  | 'Cuidado personal';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  available: boolean;
  stock: number;
  image: string;
  imageAlt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'Confirmado' | 'Preparando' | 'Entregado';
  delivery: {
    fullName: string;
    address: string;
    city: string;
    phone: string;
    paymentMethod: 'efectivo' | 'tarjeta-demostracion';
  };
}
