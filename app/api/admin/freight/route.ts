import { NextRequest, NextResponse } from 'next/server';
import { getFreightZones, createFreightZone, updateFreightZone, deleteFreightZone } from '@/lib/supabase/freight';

export async function GET() {
  try {
    const zones = await getFreightZones();
    return NextResponse.json(zones);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar zonas de frete' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const zone = await createFreightZone(data);
    return NextResponse.json(zone);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar zona de frete' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const zone = await updateFreightZone(id, data);
    return NextResponse.json(zone);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar zona de frete' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const ok = await deleteFreightZone(id);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar zona de frete' }, { status: 500 });
  }
}
