import { NextResponse } from 'next/server';
import { getAllOrders } from '@/lib/supabase/orders';

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}
