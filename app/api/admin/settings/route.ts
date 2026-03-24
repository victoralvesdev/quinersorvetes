import { NextRequest, NextResponse } from 'next/server';
import { updateSettings } from '@/lib/supabase/settings';

export async function PUT(request: NextRequest) {
  try {
    const { updates } = await request.json();
    const ok = await updateSettings(updates);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
