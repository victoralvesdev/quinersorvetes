import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/supabase/products';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 });
  }
}
