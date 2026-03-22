import { supabase } from './client';
import { Product } from '@/types/product';

export async function getUserFavorites(userId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      product_id,
      products(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar favoritos:', error);
    return [];
  }

  return (data || [])
    .map((row: any) => row.products)
    .filter(Boolean) as Product[];
}

export async function addFavorite(userId: string, productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, product_id: productId });

  if (error) {
    console.error('Erro ao adicionar favorito:', error);
    return false;
  }
  return true;
}

export async function removeFavorite(userId: string, productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    console.error('Erro ao remover favorito:', error);
    return false;
  }
  return true;
}
