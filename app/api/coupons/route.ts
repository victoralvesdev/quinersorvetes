import { NextRequest, NextResponse } from 'next/server';
import { getUserCoupons } from '@/lib/supabase/coupons';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  }
  try {
    const coupons = await getUserCoupons(userId);
    return NextResponse.json(coupons);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar cupons' }, { status: 500 });
  }
}
