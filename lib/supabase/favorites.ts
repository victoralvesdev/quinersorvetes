import { supabase } from './client';
import { Product } from '@/types/product';

export async function getUserFavorites(userId: string): Promise<Product[]> {
  const { data: favRows, error: favError } = await supabase
    .from('user_favorites')
    .select('product_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (favError) {
    console.error('Erro ao buscar favoritos:', favError);
    return [];
  }

  const ids = (favRows || []).map((r: any) => r.product_id);
  if (ids.length === 0) return [];

  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);

  if (prodError) {
    console.error('Erro ao buscar produtos favoritos:', prodError);
    return [];
  }

  // Preserve order from favorites
  const productMap = new Map((products || []).map((p: any) => [p.id, p]));
  return ids.map((id: string) => productMap.get(id)).filter(Boolean) as Product[];
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
