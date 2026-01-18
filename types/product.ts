export interface ProductVariationItem {
  id?: string;
  name: string;
  price: number;
  display_order: number;
}

export interface ProductVariation {
  id?: string;
  name: string;
  required: boolean;
  has_price: boolean;
  display_order: number;
  items: ProductVariationItem[];
}

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
  hasVariations?: boolean; // Indica se o produto tem variações (para listagem)
  variations?: ProductVariation[]; // Subcategorias e seus itens
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
  selectedVariations?: Record<string, string>; // variationId -> itemId
  additionalPrice?: number; // Preço adicional das variações selecionadas
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

