import { NextRequest, NextResponse } from 'next/server';
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon } from '@/lib/supabase/coupons';

export async function GET() {
  try {
    const coupons = await getAllCoupons();
    return NextResponse.json(coupons);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const coupon = await createCoupon(data);
    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar cupom' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const coupon = await updateCoupon(id, data);
    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar cupom' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await deleteCoupon(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar cupom' }, { status: 500 });
  }
}
