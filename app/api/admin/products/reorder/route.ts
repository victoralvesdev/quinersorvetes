import { NextRequest, NextResponse } from 'next/server';
import { reorderProducts } from '@/lib/supabase/products';

export async function PUT(request: NextRequest) {
  try {
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds inválido' }, { status: 400 });
    }

    const ok = await reorderProducts(orderedIds);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao reordenar produtos' }, { status: 500 });
  }
}
