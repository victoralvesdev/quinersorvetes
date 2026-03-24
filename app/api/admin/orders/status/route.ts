import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus } from '@/lib/supabase/orders';

export async function POST(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();
    const ok = await updateOrderStatus(orderId, status);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 });
  }
}
