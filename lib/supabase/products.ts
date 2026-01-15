import { supabase } from './client';
import { Product } from '@/types/product';

/**
 * Busca todos os produtos com nome da categoria
 */
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }

  // Mapeia os dados para o formato esperado pelo frontend
  return (data || []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    image: product.image || '',
    category: product.category_id, // Usa o category_id para filtragem
    categoryName: product.categories?.name || '', // Nome da categoria para exibição
    available: product.available,
    featured: product.featured,
  }));
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
 * Busca um produto pelo ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar produto:', error);
    return null;
  }

  return data;
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
  }
): Promise<Product | null> {
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
