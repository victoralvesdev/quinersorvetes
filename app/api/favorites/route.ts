import { NextRequest, NextResponse } from 'next/server';
import { getUserFavorites, addFavorite, removeFavorite } from '@/lib/supabase/favorites';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  }
  try {
    const favorites = await getUserFavorites(userId);
    return NextResponse.json(favorites);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar favoritos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();
    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId e productId obrigatórios' }, { status: 400 });
    }
    const ok = await addFavorite(userId, productId);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao adicionar favorito' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, productId } = await request.json();
    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId e productId obrigatórios' }, { status: 400 });
    }
    const ok = await removeFavorite(userId, productId);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao remover favorito' }, { status: 500 });
  }
}
