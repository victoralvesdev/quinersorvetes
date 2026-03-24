import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { updateOrderPaymentStatus } from '@/lib/supabase/orders';

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;

export const runtime = 'nodejs';

/**
 * Verifica a assinatura do webhook do Mercado Pago
 * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  if (!WEBHOOK_SECRET) {
    console.error('[MP Webhook] MERCADOPAGO_WEBHOOK_SECRET não configurado — webhook rejeitado');
    return false;
  }

  if (!xSignature || !xRequestId) {
    console.error('[MP Webhook] Headers de assinatura ausentes');
    return false;
  }

  try {
    // Parse do header x-signature (formato: ts=xxx,v1=xxx)
    const signatureParts: Record<string, string> = {};
    xSignature.split(',').forEach(part => {
      const [key, value] = part.split('=');
      if (key && value) {
        signatureParts[key.trim()] = value.trim();
      }
    });

    const ts = signatureParts['ts'];
    const v1 = signatureParts['v1'];

    if (!ts || !v1) {
      console.error('[MP Webhook] Formato de assinatura inválido');
      return false;
    }

    // Monta o template para validação
    // Formato: id:[data.id];request-id:[x-request-id];ts:[ts];
    const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // Calcula HMAC-SHA256
    const hmac = createHmac('sha256', WEBHOOK_SECRET);
    hmac.update(template);
    const calculatedSignature = hmac.digest('hex');

    // Compara usando timingSafeEqual para evitar timing attacks
    const isValid = timingSafeEqual(
      Buffer.from(calculatedSignature, 'hex'),
      Buffer.from(v1, 'hex')
    );

    if (!isValid) {
      console.error('[MP Webhook] Assinatura inválida');
    }

    return isValid;
  } catch (error) {
    console.error('[MP Webhook] Erro ao verificar assinatura:', error);
    return false;
  }
}

/**
 * Webhook para receber notificações do Mercado Pago
 * Configure no painel do Mercado Pago: https://www.quiner.com.br/api/mercadopago/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Obtém headers de assinatura
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    const body = await request.json();

    // Verificação de assinatura sempre obrigatória
    const dataId = body.data?.id?.toString() || '';
    const isValidSignature = verifyWebhookSignature(xSignature, xRequestId, dataId);

    if (!isValidSignature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

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

      // Se o pagamento foi aprovado e tem referência do pedido
      if (paymentDetails.status === 'approved' && paymentDetails.external_reference) {
        const orderId = paymentDetails.external_reference;

        // Idempotência: verifica se o pedido já foi marcado como pago
        const { supabaseAdmin } = await import('@/lib/supabase/server');
        const { data: existingOrder } = await supabaseAdmin
          .from('orders')
          .select('is_paid')
          .eq('id', orderId)
          .single();

        if (existingOrder?.is_paid) {
          return NextResponse.json({ received: true });
        }

        const updated = await updateOrderPaymentStatus(orderId, true, paymentId.toString());

        if (!updated) {
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      console.error('[MP Webhook] Erro ao buscar pagamento:', response.status);
      return null;
    }

    return await response.json();
  } catch (error: any) {
    console.error('[MP Webhook] Erro na requisição:', error.name, error.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// GET para verificação do Mercado Pago (health check)
export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'mercadopago' });
}
