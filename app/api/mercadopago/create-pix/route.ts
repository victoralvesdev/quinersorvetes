import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Credenciais do Mercado Pago
const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_API_URL = 'https://api.mercadopago.com/v1/payments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verificar se o token está configurado
    if (!ACCESS_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Configuração do Mercado Pago não encontrada' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, description, payerEmail, payerName, payerCpf, orderId } = body;

    console.log('Recebendo requisição PIX:', { amount, description, orderId });

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Amount e description são obrigatórios' },
        { status: 400 }
      );
    }

    // CPF padrão para pagamentos PIX (necessário para API do Mercado Pago)
    const defaultCpf = '12345678909';

    // Criar pagamento PIX usando API REST direta
    const paymentData: any = {
      transaction_amount: parseFloat(amount),
      description: description,
      payment_method_id: 'pix',
      payer: {
        email: payerEmail || 'cliente@quiner.com.br',
        first_name: payerName?.split(' ')[0] || 'Cliente',
        last_name: payerName?.split(' ').slice(1).join(' ') || 'Quiner',
        identification: {
          type: 'CPF',
          number: payerCpf ? payerCpf.replace(/\D/g, '') : defaultCpf,
        },
      },
    };

    // Adiciona referência do pedido para rastreamento via webhook
    if (orderId) {
      paymentData.external_reference = orderId;
    }

    console.log('Enviando requisição PIX para Mercado Pago:', { orderId, amount });

    const idempotencyKey = randomUUID();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(MERCADOPAGO_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(paymentData),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    console.log('Status da resposta MP:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na API do Mercado Pago:', { status: response.status, cause: errorData.cause });
      return NextResponse.json(
        { error: errorData.message || errorData.error || 'Erro ao criar pagamento PIX' },
        { status: response.status }
      );
    }

    const responseData = await response.json();

    if (!responseData?.point_of_interaction) {
      console.error('Resposta inválida do Mercado Pago: point_of_interaction ausente');
      return NextResponse.json(
        { error: 'Erro ao criar pagamento PIX. Tente novamente.' },
        { status: 500 }
      );
    }

    // Extrair dados do PIX
    const pixData = {
      paymentId: responseData.id,
      status: responseData.status,
      qrCode: responseData.point_of_interaction?.transaction_data?.qr_code || null,
      qrCodeBase64: responseData.point_of_interaction?.transaction_data?.qr_code_base64 || null,
      ticketUrl: responseData.point_of_interaction?.transaction_data?.ticket_url || null,
    };

    console.log('Pagamento PIX criado com sucesso:', pixData.paymentId);

    return NextResponse.json(pixData);
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    console.error('Erro ao criar pagamento PIX:', error.name, error.message);
    return NextResponse.json(
      { error: isTimeout ? 'Tempo esgotado ao conectar com Mercado Pago. Tente novamente.' : 'Erro ao processar pagamento PIX.' },
      { status: 500 }
    );
  }
}

