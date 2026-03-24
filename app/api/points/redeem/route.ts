import { NextRequest, NextResponse } from 'next/server';
import { redeemPoints } from '@/lib/supabase/points';

export async function POST(request: NextRequest) {
  try {
    const { userPhone, cost, description } = await request.json();

    if (!userPhone || !cost || !description) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const success = await redeemPoints(userPhone, cost, description);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('[points/redeem]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
