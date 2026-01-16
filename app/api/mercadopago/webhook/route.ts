import { NextRequest, NextResponse } from 'next/server';
import { updateOrderPaymentStatus } from '@/lib/supabase/orders';

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export const runtime = 'nodejs';

/**
 * Webhook para receber notificações do Mercado Pago
 * Configure no painel do Mercado Pago: https://www.quiner.com.br/api/mercadopago/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[MP Webhook] Recebido:', JSON.stringify(body, null, 2));

    // Mercado Pago envia diferentes tipos de notificação
    // Tipo "payment" é o que nos interessa
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id;

      // Busca detalhes do pagamento na API do Mercado Pago
      const paymentDetails = await getPaymentDetails(paymentId);

      if (!paymentDetails) {
        console.error('[MP Webhook] Não foi possível obter detalhes do pagamento');
        return NextResponse.json({ received: true });
      }

      console.log('[MP Webhook] Detalhes do pagamento:', {
        id: paymentDetails.id,
        status: paymentDetails.status,
        external_reference: paymentDetails.external_reference,
      });

      // Se o pagamento foi aprovado e tem referência do pedido
      if (paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        const orderId = paymentDetails.external_reference;

        console.log('[MP Webhook] Pagamento aprovado para pedido:', orderId);

        // Atualiza o status de pagamento do pedido
        const updated = await updateOrderPaymentStatus(orderId, true, paymentId.toString());

        if (updated) {
          console.log('[MP Webhook] Pedido atualizado com sucesso');
        } else {
          console.error('[MP Webhook] Erro ao atualizar pedido');
        }
      }
    }

    // Sempre retorna 200 para o Mercado Pago saber que recebemos
    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[MP Webhook] Erro:', error);
    // Retorna 200 mesmo com erro para evitar retentativas
    return NextResponse.json({ received: true, error: error.message });
  }
}

/**
 * Busca detalhes do pagamento na API do Mercado Pago
 */
async function getPaymentDetails(paymentId: string | number) {
  if (!ACCESS_TOKEN) {
    console.error('[MP Webhook] ACCESS_TOKEN não configurado');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.error('[MP Webhook] Erro ao buscar pagamento:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[MP Webhook] Erro na requisição:', error);
    return null;
  }
}

// GET para verificação do Mercado Pago (health check)
export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'mercadopago' });
}
