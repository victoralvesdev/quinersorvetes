import { NextRequest, NextResponse } from 'next/server';
import { getOrdersInDelivery } from '@/lib/supabase/orders';
import { sendTextMessage } from '@/lib/evolution-api';

const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_NUMBER?.replace(/\D/g, '') || '';

/**
 * API para enviar lembretes de pedidos sem confirmação de entrega
 * Deve ser chamada periodicamente (a cada 5-10 minutos) por um cron job
 *
 * Exemplo de cron job no Vercel (vercel.json):
 * "crons": [{ "path": "/api/whatsapp/delivery-reminder", "schedule": "every 10 minutes" }]
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica se há um token de autorização (opcional, para segurança)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Se CRON_SECRET estiver configurado, verifica autorização
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[DeliveryReminder] Verificando pedidos aguardando confirmação...');

    // Busca pedidos que estão em saiu_entrega há mais de 30 minutos
    const ordersAwaiting = await getOrdersInDelivery(30);

    console.log(`[DeliveryReminder] Encontrados ${ordersAwaiting.length} pedidos aguardando confirmação`);

    if (ordersAwaiting.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum pedido aguardando confirmação',
        orders: []
      });
    }

    const remindersSent: string[] = [];

    // Notifica o admin sobre pedidos sem confirmação
    if (ADMIN_PHONE) {
      let mensagemAdmin = `⚠️ *Pedidos aguardando confirmação de entrega:*\n\n`;

      for (const { order } of ordersAwaiting) {
        const orderCode = order.id.slice(0, 8);
        const updatedAt = new Date(order.updated_at);
        const minutesAgo = Math.round((Date.now() - updatedAt.getTime()) / (1000 * 60));

        mensagemAdmin += `📦 Pedido #${orderCode}\n`;
        mensagemAdmin += `⏱️ Saiu há ${minutesAgo} minutos\n\n`;

        remindersSent.push(orderCode);
      }

      mensagemAdmin += `_Confirme a entrega pelo painel admin ou pelo app do cliente._`;

      try {
        await sendTextMessage(ADMIN_PHONE, mensagemAdmin);
        console.log(`[DeliveryReminder] Lembrete enviado ao admin`);
      } catch (error) {
        console.error(`[DeliveryReminder] Erro ao enviar lembrete:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${remindersSent.length} pedidos pendentes notificados`,
      orders: remindersSent
    });

  } catch (error) {
    console.error('[DeliveryReminder] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar lembretes' },
      { status: 500 }
    );
  }
}

// POST também aceito para flexibilidade
export async function POST(request: NextRequest) {
  return GET(request);
}
