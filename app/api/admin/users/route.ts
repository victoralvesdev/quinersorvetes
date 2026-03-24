import { NextResponse } from 'next/server';
import { getAllUsers } from '@/lib/supabase/users';

export async function GET() {
  try {
    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuários' }, { status: 500 });
  }
}
