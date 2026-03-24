import { NextRequest, NextResponse } from 'next/server';
import { uploadImageFromBase64 } from '@/lib/supabase/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    }

    // Convert File to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    const url = await uploadImageFromBase64(base64, file.name);
    if (!url) {
      return NextResponse.json({ error: 'Erro no upload' }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: 'Erro no upload da imagem' }, { status: 500 });
  }
}
