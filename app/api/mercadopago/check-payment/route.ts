import { NextRequest, NextResponse } from 'next/server';

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      );
    }

    if (!ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Configuração do Mercado Pago não encontrada' },
        { status: 500 }
      );
    }

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
      const errorData = await response.json();
      return NextResponse.json(
        { error: 'Erro ao verificar pagamento', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      paymentId: data.id,
      status: data.status,
      statusDetail: data.status_detail,
    });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}
