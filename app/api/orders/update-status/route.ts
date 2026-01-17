import { NextRequest, NextResponse } from 'next/server';
import {
  updateOrderStatus,
  generateDeliveryCode,
  setOrderDeliveryCode,
  getOrderWithUser
} from '@/lib/supabase/orders';
import { sendTextMessage } from '@/lib/evolution-api';

/**
 * API Route para atualizar status do pedido com notificações
 * Quando o status muda para "saiu_entrega", gera código e notifica o cliente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    console.log('[update-status] Atualizando pedido:', orderId, 'para:', status);

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

    // Se está mudando para saiu_entrega, precisa gerar código e notificar cliente
    if (status === 'saiu_entrega') {
      console.log('[update-status] Gerando código de entrega...');

      // Gera código de entrega de 4 dígitos
      const deliveryCode = await generateDeliveryCode();
      console.log('[update-status] Código gerado:', deliveryCode);

      // Salva o código no pedido
      const orderWithCode = await setOrderDeliveryCode(orderId, deliveryCode);
      if (!orderWithCode) {
        return NextResponse.json(
          { success: false, error: 'Erro ao salvar código de entrega' },
          { status: 500 }
        );
      }

      // Atualiza o status
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
        const { userPhone } = orderData;

        // Formata telefone para WhatsApp
        const formatPhoneForWhatsApp = (phone: string): string => {
          const cleaned = phone.replace(/\D/g, '');
          return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
        };

        const formattedPhone = formatPhoneForWhatsApp(userPhone);
        const orderCode = orderId.slice(0, 8).toUpperCase();

        // Mensagem para o cliente
        const message = `🚀 *Seu pedido #${orderCode} saiu para entrega!*

🔑 *Código de Confirmação: ${deliveryCode}*

Quando o entregador chegar, informe este código para confirmar o recebimento.

🏍️ _Em breve você receberá seu pedido!_`;

        console.log('[update-status] Enviando WhatsApp para:', formattedPhone);

        try {
          const sent = await sendTextMessage(formattedPhone, message);
          if (sent) {
            console.log('[update-status] WhatsApp enviado com sucesso!');
          } else {
            console.error('[update-status] Falha ao enviar WhatsApp');
          }
        } catch (whatsappError) {
          console.error('[update-status] Erro ao enviar WhatsApp:', whatsappError);
          // Não falha a requisição por causa do WhatsApp
        }
      } else {
        console.log('[update-status] Telefone do cliente não encontrado');
      }

      return NextResponse.json({
        success: true,
        order: updatedOrder,
        deliveryCode
      });
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
