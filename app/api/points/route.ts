import { NextRequest, NextResponse } from 'next/server';
import { getPointsBalance, getPointsHistory } from '@/lib/supabase/points';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');

  if (!phone) {
    return NextResponse.json({ error: 'phone é obrigatório' }, { status: 400 });
  }

  try {
    const [balance, history] = await Promise.all([
      getPointsBalance(phone),
      getPointsHistory(phone),
    ]);
    return NextResponse.json({ balance, history });
  } catch (error) {
    console.error('[api/points]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
