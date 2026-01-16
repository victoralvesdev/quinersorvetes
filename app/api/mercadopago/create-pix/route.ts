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

    // Log para debug (mostra apenas os primeiros caracteres)
    console.log('Token configurado:', ACCESS_TOKEN.substring(0, 20) + '...');

    const body = await request.json();
    const { amount, description, payerEmail, payerName, payerCpf, orderId } = body;

    console.log('Recebendo requisição PIX:', { amount, description, orderId });

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'Amount e description são obrigatórios' },
        { status: 400 }
      );
    }

    if (!payerCpf) {
      return NextResponse.json(
        { error: 'CPF do pagador é obrigatório' },
        { status: 400 }
      );
    }

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
          number: payerCpf.replace(/\D/g, ''),
        },
      },
    };

    // Adiciona referência do pedido para rastreamento via webhook
    if (orderId) {
      paymentData.external_reference = orderId;
    }

    console.log('Enviando requisição para Mercado Pago:', JSON.stringify(paymentData, null, 2));

    // Gerar chave de idempotência única para evitar pagamentos duplicados
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

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || 'Erro desconhecido' };
      }
      
      console.error('Erro na API do Mercado Pago:', JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      }, null, 2));
      
      return NextResponse.json(
        { 
          error: errorData.message || errorData.error || 'Erro ao criar pagamento PIX',
          details: errorData 
        },
        { status: response.status }
      );
    }

    const responseData = await response.json();
    console.log('Resposta do Mercado Pago recebida');

    if (!responseData || !responseData.point_of_interaction) {
      console.error('Resposta inválida do Mercado Pago:', responseData);
      return NextResponse.json(
        { error: 'Erro ao criar pagamento PIX - resposta inválida', details: responseData },
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
    console.error('Erro ao criar pagamento PIX:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao processar pagamento PIX',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

