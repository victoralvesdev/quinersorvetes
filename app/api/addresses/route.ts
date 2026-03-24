import { NextRequest, NextResponse } from 'next/server';
import {
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/lib/supabase/addresses';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 });
  }
  try {
    const addresses = await getUserAddresses(userId);
    return NextResponse.json(addresses);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar endereços' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, addressId, ...data } = body;

    if (action === 'setDefault') {
      await setDefaultAddress(addressId, userId);
      return NextResponse.json({ ok: true });
    }

    const address = await createAddress(userId, data);
    return NextResponse.json(address);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar endereço' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { addressId, userId, ...data } = await request.json();
    const address = await updateAddress(addressId, userId, data);
    return NextResponse.json(address);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar endereço' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { addressId, userId } = await request.json();
    await deleteAddress(addressId, userId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar endereço' }, { status: 500 });
  }
}
