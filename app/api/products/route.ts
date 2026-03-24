import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/supabase/products';

export async function GET() {
  try {
    const products = await getProducts();
    return NextResponse.json(products);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
  }
}
