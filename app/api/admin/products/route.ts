import { NextRequest, NextResponse } from 'next/server';
import { createProduct, updateProduct, deleteProduct, duplicateProduct } from '@/lib/supabase/products';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...data } = body;

    if (action === 'duplicate') {
      const product = await duplicateProduct(id);
      return NextResponse.json(product);
    }

    const product = await createProduct(data);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Erro ao criar produto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const product = await updateProduct(id, data);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const ok = await deleteProduct(id);
    return NextResponse.json({ ok });
  } catch {
    return NextResponse.json({ error: 'Erro ao deletar produto' }, { status: 500 });
  }
}
