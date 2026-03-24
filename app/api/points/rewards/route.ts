import { NextResponse } from 'next/server';
import { getProductPointsRewards } from '@/lib/supabase/points';

export async function GET() {
  try {
    const rewards = await getProductPointsRewards();
    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('[api/points/rewards]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
