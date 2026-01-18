import { supabase } from './client';
import { ProductVariation, ProductVariationItem } from '@/types/product';

/**
 * Busca todas as variações de um produto
 */
export async function getProductVariations(productId: string): Promise<ProductVariation[]> {
  const { data: variations, error: variationsError } = await supabase
    .from('product_variations')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true });

  if (variationsError) {
    console.error('Erro ao buscar variações:', variationsError);
    return [];
  }

  if (!variations || variations.length === 0) {
    return [];
  }

  // Buscar itens de cada variação
  const variationsWithItems = await Promise.all(
    variations.map(async (variation) => {
      const { data: items, error: itemsError } = await supabase
        .from('product_variation_items')
        .select('*')
        .eq('variation_id', variation.id)
        .order('display_order', { ascending: true });

      if (itemsError) {
        console.error('Erro ao buscar itens da variação:', itemsError);
        return {
          id: variation.id,
          name: variation.name,
          required: variation.required,
          has_price: variation.has_price,
          display_order: variation.display_order,
          items: [],
        };
      }

      return {
        id: variation.id,
        name: variation.name,
        required: variation.required,
        has_price: variation.has_price,
        display_order: variation.display_order,
        items: (items || []).map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          display_order: item.display_order,
        })),
      };
    })
  );

  return variationsWithItems;
}

/**
 * Salva ou atualiza variações de um produto
 */
export async function saveProductVariations(
  productId: string,
  variations: Omit<ProductVariation, 'id'>[]
): Promise<boolean> {
  try {
    // Primeiro, deletar todas as variações existentes (e seus itens via CASCADE)
    const { error: deleteError } = await supabase
      .from('product_variations')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      console.error('Erro ao deletar variações antigas:', deleteError);
      return false;
    }

    // Se não há variações para salvar, retornar sucesso
    if (!variations || variations.length === 0) {
      return true;
    }

    // Inserir novas variações
    const variationsToInsert = variations.map((variation, index) => ({
      product_id: productId,
      name: variation.name,
      required: variation.required,
      has_price: variation.has_price,
      display_order: variation.display_order ?? index,
    }));

    const { data: insertedVariations, error: insertVariationsError } = await supabase
      .from('product_variations')
      .insert(variationsToInsert)
      .select();

    if (insertVariationsError || !insertedVariations) {
      console.error('Erro ao inserir variações:', insertVariationsError);
      return false;
    }

    // Inserir itens de cada variação
    const itemsToInsert: Array<{
      variation_id: string;
      name: string;
      price: number;
      display_order: number;
    }> = [];

    variations.forEach((variation, variationIndex) => {
      const insertedVariation = insertedVariations[variationIndex];
      if (variation.items && variation.items.length > 0) {
        variation.items.forEach((item, itemIndex) => {
          itemsToInsert.push({
            variation_id: insertedVariation.id,
            name: item.name,
            price: item.price,
            display_order: item.display_order ?? itemIndex,
          });
        });
      }
    });

    if (itemsToInsert.length > 0) {
      const { error: insertItemsError } = await supabase
        .from('product_variation_items')
        .insert(itemsToInsert);

      if (insertItemsError) {
        console.error('Erro ao inserir itens das variações:', insertItemsError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar variações:', error);
    return false;
  }
}

/**
 * Deleta todas as variações de um produto
 */
export async function deleteProductVariations(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('product_variations')
    .delete()
    .eq('product_id', productId);

  if (error) {
    console.error('Erro ao deletar variações:', error);
    return false;
  }

  return true;
}

