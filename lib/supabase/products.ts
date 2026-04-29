import { supabaseAdmin as supabase } from './server';
import { Product } from '@/types/product';
import { getProductVariations, saveProductVariations } from './variations';

/**
 * Busca todos os produtos com nome da categoria e flag de variações
 */
export async function getProducts(): Promise<Product[]> {
  // Buscar produtos com categorias
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }

  // Buscar IDs de produtos que têm variações
  const { data: variationsData } = await supabase
    .from('product_variations')
    .select('product_id');

  // Criar um Set com IDs de produtos que têm variações
  const productsWithVariations = new Set(
    (variationsData || []).map((v) => v.product_id)
  );

  // Mapeia os dados para o formato esperado pelo frontend
  const products = (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: product.image || '',
    category: product.category_id,
    categoryName: product.categories?.name || '',
    available: product.available,
    featured: product.featured,
    hasVariations: productsWithVariations.has(product.id),
    stock_quantity: product.stock_quantity ?? null,
    low_stock_threshold: product.low_stock_threshold ?? null,
    price_from: product.price_from ?? false,
    display_order: product.display_order ?? 0,
  }));

  return products;
}

/**
 * Busca produtos por categoria
 */
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar produtos por categoria:', error);
    return [];
  }

  return data || [];
}

/**
 * Busca um produto pelo ID com suas variações
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar produto:', error);
    return null;
  }

  const variations = await getProductVariations(id);

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    price: Number(data.price),
    image: data.image || '',
    category: data.category_id,
    categoryName: data.categories?.name || '',
    available: data.available,
    featured: data.featured,
    variations: variations.length > 0 ? variations : undefined,
    stock_quantity: data.stock_quantity ?? null,
    low_stock_threshold: data.low_stock_threshold ?? null,
    price_from: data.price_from ?? false,
  };
}

/**
 * Busca produtos com estoque abaixo do limite configurado
 */
export async function getLowStockProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`*, categories(id, name)`)
    .not('stock_quantity', 'is', null)
    .not('low_stock_threshold', 'is', null);

  if (error || !data) return [];

  return data
    .filter((p) => p.stock_quantity <= p.low_stock_threshold)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      image: p.image || '',
      category: p.category_id,
      categoryName: p.categories?.name || '',
      available: p.available,
      featured: p.featured,
      stock_quantity: p.stock_quantity,
      low_stock_threshold: p.low_stock_threshold,
    }));
}

/**
 * Cria um novo produto
 */
export async function createProduct(
  product: {
    name: string;
    description: string;
    price: number;
    image?: string;
    category_id: string;
    available?: boolean;
    featured?: boolean;
    stock_quantity?: number | null;
    low_stock_threshold?: number | null;
    price_from?: boolean;
  }
): Promise<Product | null> {
  // Empurra todos os produtos 1 posição para baixo
  await supabase.rpc('increment_display_order_all_products');

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image || null,
        category_id: product.category_id,
        available: product.available ?? true,
        featured: product.featured ?? false,
        stock_quantity: product.stock_quantity ?? null,
        low_stock_threshold: product.low_stock_threshold ?? null,
        price_from: product.price_from ?? false,
        display_order: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar produto:', error);
    return null;
  }

  return data;
}

/**
 * Atualiza um produto existente
 */
export async function updateProduct(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    price: number;
    image: string;
    category_id: string;
    available: boolean;
    featured: boolean;
    stock_quantity: number | null;
    low_stock_threshold: number | null;
    price_from: boolean;
  }>
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar produto:', error);
    return null;
  }

  return data;
}

/**
 * Deleta um produto
 */
/**
 * Decrementa atomicamente o estoque de um produto.
 * Retorna { newStock, threshold } para checagem de alerta, ou null se sem controle.
 */
export async function decrementProductStock(
  productId: string,
  qty: number
): Promise<{ newStock: number; threshold: number | null } | null> {
  const { data, error } = await supabase.rpc('decrement_product_stock', {
    p_product_id: productId,
    p_qty: qty,
  });

  if (error || !data || data.length === 0) return null;
  const row = data[0];
  if (row.new_stock === null) return null;
  return { newStock: row.new_stock, threshold: row.threshold ?? null };
}

/**
 * Duplica um produto existente com todas as suas variações
 */
export async function duplicateProduct(id: string): Promise<Product | null> {
  const original = await getProductById(id);
  if (!original) return null;

  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        name: `Cópia de ${original.name}`,
        description: original.description,
        price: original.price,
        image: original.image || null,
        category_id: original.category,
        available: false,
        featured: original.featured ?? false,
        stock_quantity: original.stock_quantity ?? null,
        low_stock_threshold: original.low_stock_threshold ?? null,
        price_from: original.price_from ?? false,
      },
    ])
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao duplicar produto:', error);
    return null;
  }

  // Duplicar variações
  const variations = await getProductVariations(id);
  if (variations.length > 0) {
    await saveProductVariations(
      data.id,
      variations.map((v) => ({
        name: v.name,
        required: v.required,
        has_price: v.has_price,
        display_order: v.display_order,
        items: v.items.map((item) => ({
          name: item.name,
          price: item.price,
          display_order: item.display_order,
          stock_quantity: item.stock_quantity ?? null,
          low_stock_threshold: item.low_stock_threshold ?? null,
        })),
      }))
    );
  }

  return data;
}

/**
 * Reordena produtos atualizando display_order de cada um
 */
export async function reorderProducts(
  orderedIds: string[]
): Promise<boolean> {
  const updates = orderedIds.map((id, index) =>
    supabase.from('products').update({ display_order: index }).eq('id', id)
  );

  const results = await Promise.all(updates);
  return results.every((r) => !r.error);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao deletar produto:', error);
    return false;
  }

  return true;
}
