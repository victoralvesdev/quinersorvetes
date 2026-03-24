import { supabaseAdmin as supabase } from './server';
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
          stock_quantity: item.stock_quantity ?? null,
          low_stock_threshold: item.low_stock_threshold ?? null,
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
      stock_quantity: number | null;
      low_stock_threshold: number | null;
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
            stock_quantity: item.stock_quantity ?? null,
            low_stock_threshold: item.low_stock_threshold ?? null,
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
 * Busca variações de múltiplos produtos de uma vez.
 * Retorna um mapa { productId -> variations[] }
 */
export async function getVariationsMapForProducts(
  productIds: string[]
): Promise<Record<string, ProductVariation[]>> {
  if (productIds.length === 0) return {};

  const { data: variations, error } = await supabase
    .from('product_variations')
    .select('*')
    .in('product_id', productIds)
    .order('display_order', { ascending: true });

  if (error || !variations || variations.length === 0) return {};

  const variationIds = variations.map((v) => v.id);

  const { data: items } = await supabase
    .from('product_variation_items')
    .select('*')
    .in('variation_id', variationIds)
    .order('display_order', { ascending: true });

  const itemsByVariation: Record<string, ProductVariationItem[]> = {};
  for (const item of items || []) {
    if (!itemsByVariation[item.variation_id]) itemsByVariation[item.variation_id] = [];
    itemsByVariation[item.variation_id].push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      display_order: item.display_order,
      stock_quantity: item.stock_quantity ?? null,
      low_stock_threshold: item.low_stock_threshold ?? null,
    });
  }

  const map: Record<string, ProductVariation[]> = {};
  for (const v of variations) {
    if (!map[v.product_id]) map[v.product_id] = [];
    map[v.product_id].push({
      id: v.id,
      name: v.name,
      required: v.required,
      has_price: v.has_price,
      display_order: v.display_order,
      items: itemsByVariation[v.id] || [],
    });
  }

  return map;
}

export interface LowStockVariationItem {
  itemId: string;
  itemName: string;
  variationId: string;
  variationName: string;
  productId: string;
  productName: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

/**
 * Busca itens de variação com estoque abaixo do limite configurado
 */
export async function getLowStockVariationItems(): Promise<LowStockVariationItem[]> {
  const { data: items, error } = await supabase
    .from('product_variation_items')
    .select(`
      id,
      name,
      stock_quantity,
      low_stock_threshold,
      variation_id,
      product_variations (
        id,
        name,
        product_id,
        products (
          id,
          name
        )
      )
    `)
    .not('stock_quantity', 'is', null)
    .not('low_stock_threshold', 'is', null);

  if (error || !items) return [];

  return items
    .filter((item) => item.stock_quantity <= item.low_stock_threshold)
    .map((item) => {
      const variation = item.product_variations as any;
      const product = variation?.products as any;
      return {
        itemId: item.id,
        itemName: item.name,
        variationId: variation?.id || '',
        variationName: variation?.name || '',
        productId: product?.id || '',
        productName: product?.name || '',
        stock_quantity: item.stock_quantity,
        low_stock_threshold: item.low_stock_threshold,
      };
    });
}

/**
 * Atualiza o estoque de um item de variação
 */
export async function updateVariationItemStock(
  itemId: string,
  stock_quantity: number | null,
  low_stock_threshold: number | null
): Promise<boolean> {
  const { error } = await supabase
    .from('product_variation_items')
    .update({ stock_quantity, low_stock_threshold })
    .eq('id', itemId);

  if (error) {
    console.error('Erro ao atualizar estoque da variação:', error);
    return false;
  }
  return true;
}

/**
 * Decrementa atomicamente o estoque de um item de variação.
 * Retorna { newStock, threshold } para checagem de alerta, ou null se sem controle.
 */
export async function decrementVariationItemStock(
  itemId: string,
  qty: number
): Promise<{ newStock: number; threshold: number | null } | null> {
  const { data, error } = await supabase.rpc('decrement_variation_item_stock', {
    p_item_id: itemId,
    p_qty: qty,
  });

  if (error || !data || data.length === 0) return null;
  const row = data[0];
  if (row.new_stock === null) return null;
  return { newStock: row.new_stock, threshold: row.threshold ?? null };
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

