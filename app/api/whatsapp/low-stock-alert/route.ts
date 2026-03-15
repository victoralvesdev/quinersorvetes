import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage } from '@/lib/evolution-api';

const ADMIN_PHONES = (process.env.ADMIN_WHATSAPP_NUMBER || '')
  .split(',')
  .map((n) => n.trim().replace(/\D/g, ''))
  .filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const { productName, stockQuantity, threshold } = await request.json();

    if (!productName || stockQuantity === undefined || threshold === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (ADMIN_PHONES.length === 0) {
      return NextResponse.json({ error: 'Nenhum número de admin configurado' }, { status: 500 });
    }

    const stockEmoji = stockQuantity === 0 ? '🚨' : '⚠️';
    const statusText = stockQuantity === 0 ? 'ESGOTADO' : 'BAIXO';

    const message =
      `${stockEmoji} *ALERTA DE ESTOQUE ${statusText}*\n\n` +
      `📦 *Produto:* ${productName}\n` +
      `📊 *Estoque atual:* ${stockQuantity} unidade${stockQuantity !== 1 ? 's' : ''}\n` +
      `🔔 *Limite configurado:* ${threshold} unidade${threshold !== 1 ? 's' : ''}\n\n` +
      `Acesse o painel admin para atualizar o estoque.`;

    const results = await Promise.all(
      ADMIN_PHONES.map((phone) => sendTextMessage(phone, message))
    );

    const allSent = results.every(Boolean);

    return NextResponse.json({ success: allSent });
  } catch (error) {
    console.error('Erro ao enviar alerta de estoque:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
