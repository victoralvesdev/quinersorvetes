import { supabase } from './client';
import { Product } from '@/types/product';
import { getProductVariations } from './variations';

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
    .order('created_at', { ascending: false });

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
    category: product.category_id, // Usa o category_id para filtragem
    categoryName: product.categories?.name || '', // Nome da categoria para exibição
    available: product.available,
    featured: product.featured,
    hasVariations: productsWithVariations.has(product.id),
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
  };
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
