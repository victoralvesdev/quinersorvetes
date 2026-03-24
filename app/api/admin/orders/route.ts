import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getAllOrders } from '@/lib/supabase/orders';

export async function GET() {
  noStore();
  try {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}
