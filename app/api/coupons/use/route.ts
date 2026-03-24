import { NextRequest, NextResponse } from 'next/server';
import { markUserCouponAsUsed, incrementCouponUsage } from '@/lib/supabase/coupons';

export async function POST(request: NextRequest) {
  try {
    const { userCouponId, couponId } = await request.json();

    if (!couponId) {
      return NextResponse.json({ error: 'couponId é obrigatório' }, { status: 400 });
    }

    if (userCouponId && !userCouponId.startsWith('global_')) {
      await markUserCouponAsUsed(userCouponId);
    }

    await incrementCouponUsage(couponId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[coupons/use]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
