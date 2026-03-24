import { NextResponse } from 'next/server';
import { getLowStockProducts } from '@/lib/supabase/products';
import { getLowStockVariationItems } from '@/lib/supabase/variations';

export async function GET() {
  try {
    const [products, variationItems] = await Promise.all([
      getLowStockProducts(),
      getLowStockVariationItems(),
    ]);
    return NextResponse.json({ products, variationItems });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 });
  }
}
