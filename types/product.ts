export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string; // category_id para filtragem
  categoryName?: string; // Nome da categoria para exibição
  available: boolean;
  featured?: boolean;
  promotion?: {
    discount: number;
    label: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: "novo" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";
  customerName: string;
  customerPhone: string;
  address: string;
  createdAt: Date;
  deliveryTime?: Date;
}

