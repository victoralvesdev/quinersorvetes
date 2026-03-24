import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, updateSetting, upsertSetting } from '@/lib/supabase/settings';

export async function GET() {
  try {
    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { key, value, category, is_public, upsert } = await request.json();
    if (!key) return NextResponse.json({ error: 'key obrigatório' }, { status: 400 });

    let ok: boolean;
    if (upsert) {
      ok = await upsertSetting(key, value, category, is_public);
    } else {
      ok = await updateSetting(key, value);
    }
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar configuração' }, { status: 500 });
  }
}
