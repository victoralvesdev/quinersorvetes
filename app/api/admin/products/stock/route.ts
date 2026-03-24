import { NextRequest, NextResponse } from 'next/server';
import { updateProduct } from '@/lib/supabase/products';
import { updateVariationItemStock } from '@/lib/supabase/variations';

export async function PUT(request: NextRequest) {
  try {
    const { type, id, stockQuantity, lowStockThreshold } = await request.json();

    if (type === 'product') {
      const product = await updateProduct(id, {
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
      });
      return NextResponse.json(product);
    }

    if (type === 'variation') {
      const ok = await updateVariationItemStock(id, stockQuantity, lowStockThreshold);
      return NextResponse.json({ ok });
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar estoque' }, { status: 500 });
  }
}
