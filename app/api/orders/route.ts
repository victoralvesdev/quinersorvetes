import { NextRequest, NextResponse } from 'next/server';
import { getUserOrders } from '@/lib/supabase/orders';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  }
  try {
    const orders = await getUserOrders(userId);
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}
