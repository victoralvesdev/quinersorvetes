import { NextRequest, NextResponse } from 'next/server';
import {
  updateOrderStatus,
  getOrderWithUser
} from '@/lib/supabase/orders';
import { sendTextMessage } from '@/lib/evolution-api';
import { awardPointsForOrder } from '@/lib/supabase/points';
import { getPublicSettings } from '@/lib/supabase/settings';

/**
 * API Route para atualizar status do pedido com notificações
 * Quando o status muda para "saiu_entrega", gera código e notifica o cliente
 */
export async function POST(request: NextRequest) {
  // Apenas admins autenticados podem alterar status de pedidos
  const adminSession = request.cookies.get('quiner_admin_session')?.value;
  if (adminSession !== '1') {
    return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'orderId e status são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar status
    const validStatuses = ['novo', 'preparando', 'saiu_entrega', 'entregue', 'cancelado'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Se está mudando para saiu_entrega, notifica o cliente
    if (status === 'saiu_entrega') {
      const updatedOrder = await updateOrderStatus(orderId, status);
      if (!updatedOrder) {
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar status' },
          { status: 500 }
        );
      }

      // Busca dados do usuário para enviar WhatsApp
      const orderData = await getOrderWithUser(orderId);
      if (orderData && orderData.userPhone) {
        const formatPhoneForWhatsApp = (phone: string): string => {
          const cleaned = phone.replace(/\D/g, '');
          return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
        };

        const formattedPhone = formatPhoneForWhatsApp(orderData.userPhone);
        const orderCode = orderId.slice(0, 8).toUpperCase();

        const message = `🚀 *Seu pedido #${orderCode} saiu para entrega!*

🏍️ _Em breve você receberá seu pedido!_`;

        try {
          await sendTextMessage(formattedPhone, message);
        } catch (whatsappError) {
          console.error('[update-status] Erro ao enviar WhatsApp:', whatsappError);
        }
      }

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // Para outros status, apenas atualiza normalmente
    const updatedOrder = await updateOrderStatus(orderId, status);

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar status' },
        { status: 500 }
      );
    }

    // Se foi aceito (preparando), notifica o cliente
    if (status === 'preparando') {
      const orderData = await getOrderWithUser(orderId);
      if (orderData && orderData.userPhone) {
        const formatPhoneForWhatsApp = (phone: string): string => {
          const cleaned = phone.replace(/\D/g, '');
          return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
        };

        const formattedPhone = formatPhoneForWhatsApp(orderData.userPhone);
        const orderCode = orderId.slice(0, 8).toUpperCase();

        const message = `✅ *Pedido #${orderCode} Confirmado!*

Seu pedido foi aceito e está sendo preparado! 🍨

Em breve você receberá uma notificação quando o entregador sair.

Obrigado por pedir na Quiner! 💜`;

        try {
          await sendTextMessage(formattedPhone, message);
          console.log('[update-status] Notificação de aceite enviada');
        } catch (error) {
          console.error('[update-status] Erro ao enviar notificação de aceite:', error);
        }
      }
    }

    // Se foi cancelado, notifica o cliente
    if (status === 'cancelado') {
      const orderData = await getOrderWithUser(orderId);
      if (orderData && orderData.userPhone) {
        const formatPhoneForWhatsApp = (phone: string): string => {
          const cleaned = phone.replace(/\D/g, '');
          return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
        };

        const formattedPhone = formatPhoneForWhatsApp(orderData.userPhone);
        const orderCode = orderId.slice(0, 8).toUpperCase();

        const message = `❌ *Pedido #${orderCode} Cancelado*

Infelizmente seu pedido foi cancelado.

Se você tiver dúvidas, entre em contato conosco.`;

        try {
          await sendTextMessage(formattedPhone, message);
          console.log('[update-status] Notificação de cancelamento enviada');
        } catch (error) {
          console.error('[update-status] Erro ao enviar notificação de cancelamento:', error);
        }
      }
    }

    // Se foi entregue, notifica o cliente
    if (status === 'entregue') {
      const orderData = await getOrderWithUser(orderId);
      if (orderData && orderData.userPhone) {
        const formatPhoneForWhatsApp = (phone: string): string => {
          const cleaned = phone.replace(/\D/g, '');
          return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
        };

        const formattedPhone = formatPhoneForWhatsApp(orderData.userPhone);
        const orderCode = orderId.slice(0, 8).toUpperCase();

        const message = `✅ *Pedido #${orderCode} Entregue!*

Obrigado por pedir na Quiner! 🍨

Esperamos que você aproveite seu pedido. Até a próxima! 💜`;

        try {
          await sendTextMessage(formattedPhone, message);
          console.log('[update-status] Notificação de entrega enviada');
        } catch (error) {
          console.error('[update-status] Erro ao enviar notificação de entrega:', error);
        }

        // Award loyalty points
        try {
          const settings = await getPublicSettings();
          if (settings.points_enabled) {
            const orderTotal = orderData.order?.total || 0;
            await awardPointsForOrder(
              orderData.userPhone,
              orderId,
              orderTotal,
              settings.points_ratio
            );
            console.log('[update-status] Pontos concedidos para:', orderData.userPhone);
          }
        } catch (error) {
          console.error('[update-status] Erro ao conceder pontos:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    console.error('[update-status] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
