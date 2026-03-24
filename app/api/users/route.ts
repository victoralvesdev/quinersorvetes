import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, findOrCreateUser } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');
  if (!phone) {
    return NextResponse.json({ error: 'phone obrigatório' }, { status: 400 });
  }
  try {
    const user = await getUserByPhone(phone);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await findOrCreateUser(body);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}
