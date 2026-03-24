import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/supabase/orders';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    const order = await createOrder(orderData);
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar pedido' }, { status: 500 });
  }
}
