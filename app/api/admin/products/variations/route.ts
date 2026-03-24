import { NextRequest, NextResponse } from 'next/server';
import { getProductVariations, saveProductVariations, getVariationsMapForProducts } from '@/lib/supabase/variations';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');
  const productIds = request.nextUrl.searchParams.get('productIds');

  try {
    if (productIds) {
      const ids = JSON.parse(productIds) as string[];
      const map = await getVariationsMapForProducts(ids);
      return NextResponse.json(map);
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 });
    }

    const variations = await getProductVariations(productId);
    return NextResponse.json(variations);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar variações' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, variations } = await request.json();
    const ok = await saveProductVariations(productId, variations);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar variações' }, { status: 500 });
  }
}
