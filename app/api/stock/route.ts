import { NextRequest, NextResponse } from 'next/server';
import { decrementProductStock } from '@/lib/supabase/products';
import { decrementVariationItemStock } from '@/lib/supabase/variations';

export async function POST(request: NextRequest) {
  try {
    const { type, id, quantity } = await request.json();

    if (type === 'product') {
      const result = await decrementProductStock(id, quantity);
      return NextResponse.json(result);
    } else if (type === 'variation') {
      const result = await decrementVariationItemStock(id, quantity);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar estoque' }, { status: 500 });
  }
}
