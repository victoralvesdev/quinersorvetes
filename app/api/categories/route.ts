import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/supabase/categories';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}
