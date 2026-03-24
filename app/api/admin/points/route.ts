import { NextRequest, NextResponse } from 'next/server';
import {
  getAllUsersPointsSummary,
  getPointsHistory,
  adminAdjustPoints,
  getProductPointsRewards,
  bulkUpsertProductPointsRewards,
  deleteProductPointsReward,
} from '@/lib/supabase/points';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const phone = request.nextUrl.searchParams.get('phone');

  try {
    if (type === 'summaries') {
      const summaries = await getAllUsersPointsSummary();
      return NextResponse.json(summaries);
    }

    if (type === 'history' && phone) {
      const history = await getPointsHistory(phone);
      return NextResponse.json(history);
    }

    if (type === 'rewards') {
      const rewards = await getProductPointsRewards();
      return NextResponse.json(rewards);
    }

    return NextResponse.json({ error: 'Parâmetro type inválido' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar pontos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'adjust') {
      const { phone, amount, description } = body;
      const ok = await adminAdjustPoints(phone, amount, description);
      return NextResponse.json({ ok });
    }

    if (action === 'bulkUpsertRewards') {
      const { productIds, pointsRequired } = body;
      const ok = await bulkUpsertProductPointsRewards(productIds, pointsRequired);
      return NextResponse.json({ ok });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erro ao processar pontos' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { productId } = await request.json();
    const ok = await deleteProductPointsReward(productId);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar recompensa' }, { status: 500 });
  }
}
