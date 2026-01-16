import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_API_URL = 'https://api.mercadopago.com/v1/payments';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    if (!ACCESS_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN não configurado');
      return NextResponse.json(
        { error: 'Configuração do Mercado Pago não encontrada' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      token,
      amount,
      description,
      installments = 1,
      paymentMethodId,
      issuerId,
      payerEmail,
      payerName,
      payerCpf,
      orderId
    } = body;

    console.log('Recebendo requisição de pagamento com cartão:', { amount, description, installments, orderId });

    if (!token || !amount || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Token, amount e paymentMethodId são obrigatórios' },
        { status: 400 }
      );
    }

    if (!payerCpf) {
      return NextResponse.json(
        { error: 'CPF do pagador é obrigatório' },
        { status: 400 }
      );
    }

    const paymentData: any = {
      transaction_amount: parseFloat(amount),
      token: token,
      description: description || 'Pedido Quiner',
      installments: parseInt(installments),
      payment_method_id: paymentMethodId,
      issuer_id: issuerId || undefined,
      payer: {
        email: payerEmail || 'cliente@quiner.com.br',
        first_name: payerName?.split(' ')[0] || 'Cliente',
        last_name: payerName?.split(' ').slice(1).join(' ') || 'Quiner',
        identification: {
          type: 'CPF',
          number: payerCpf.replace(/\D/g, ''),
        },
      },
    };

    // Adiciona referência do pedido para rastreamento via webhook
    if (orderId) {
      paymentData.external_reference = orderId;
    }

    console.log('Enviando pagamento para Mercado Pago...');

    const idempotencyKey = randomUUID();

    const response = await fetch(MERCADOPAGO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(paymentData),
    });

    const responseData = await response.json();

    console.log('Resposta do Mercado Pago:', {
      status: response.status,
      paymentStatus: responseData.status,
      statusDetail: responseData.status_detail,
    });

    if (!response.ok) {
      console.error('Erro na API do Mercado Pago:', JSON.stringify(responseData, null, 2));
      return NextResponse.json(
        {
          error: responseData.message || 'Erro ao processar pagamento',
          details: responseData
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      paymentId: responseData.id,
      status: responseData.status,
      statusDetail: responseData.status_detail,
    });
  } catch (error: any) {
    console.error('Erro ao processar pagamento com cartão:', {
      message: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      {
        error: error.message || 'Erro ao processar pagamento',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
