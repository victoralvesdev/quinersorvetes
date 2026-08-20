import { NextRequest, NextResponse } from 'next/server';
import { getUserByPhone, getUserByEmail, registerUserByEmail, updateUser } from '@/lib/supabase/users';

export async function GET(request: NextRequest) {
  const phone = request.nextUrl.searchParams.get('phone');
  const email = request.nextUrl.searchParams.get('email');

  if (!phone && !email) {
    return NextResponse.json({ error: 'phone ou email obrigatório' }, { status: 400 });
  }

  try {
    const user = email
      ? await getUserByEmail(email.trim().toLowerCase())
      : await getUserByPhone(phone!);
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 });
    }

    const result = await registerUserByEmail({
      ...body,
      email: String(body.email).trim().toLowerCase(),
    });

    if (result.status === 'phone_conflict') {
      return NextResponse.json(
        {
          error:
            "Esse telefone já está cadastrado. Use 'Já sou cliente, localizar por telefone' para vincular seu email.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(result.user);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId, cpf } = await request.json();

    if (!userId || !cpf) {
      return NextResponse.json(
        { error: 'userId e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await updateUser(userId, { cpf });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}
