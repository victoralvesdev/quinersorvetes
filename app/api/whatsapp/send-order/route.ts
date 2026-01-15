import { NextRequest, NextResponse } from 'next/server';
import { sendOrderMessage } from '@/lib/evolution-api';

/**
 * API Route para enviar mensagem de pedido via WhatsApp
 */
export async function POST(request: NextRequest) {
  console.log('[send-order] ===== INICIANDO ENVIO DE PEDIDO =====');

  try {
    const body = await request.json();
    const { orderId, orderData, customerPhone } = body;

    console.log('[send-order] Dados recebidos:', JSON.stringify({ orderId, customerPhone, isPaid: orderData?.isPaid, paymentMethod: orderData?.paymentMethod }, null, 2));
    console.log('[send-order] Admin phone configurado:', process.env.ADMIN_WHATSAPP_NUMBER);

    if (!orderId || !orderData || !customerPhone) {
      console.log('[send-order] ERRO: Dados incompletos');
      return NextResponse.json(
        { success: false, error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    // Formatar telefone para WhatsApp (remover caracteres especiais e adicionar código do país)
    const formatPhoneForWhatsApp = (phone: string): string => {
      // Remove todos os caracteres não numéricos
      const cleaned = phone.replace(/\D/g, '');
      // Se não começar com 55 (código do Brasil), adiciona
      return cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
    };

    const formattedPhone = formatPhoneForWhatsApp(customerPhone);
    const adminPhoneRaw = process.env.ADMIN_WHATSAPP_NUMBER; // Variável de ambiente do servidor
    const adminPhone = adminPhoneRaw ? formatPhoneForWhatsApp(adminPhoneRaw) : undefined;

    console.log('[send-order] Admin phone configurado:', !!adminPhone);
    console.log('[send-order] Admin phone:', adminPhone);

    console.log('[send-order] Chamando sendOrderMessage...');
    console.log('[send-order] formattedPhone:', formattedPhone);
    console.log('[send-order] adminPhone:', adminPhone);

    const success = await sendOrderMessage(
      formattedPhone,
      orderId,
      orderData,
      adminPhone
    );

    console.log('[send-order] Resultado do sendOrderMessage:', success);

    if (success) {
      console.log('[send-order] ===== ENVIO CONCLUÍDO COM SUCESSO =====');
      return NextResponse.json({ success: true });
    } else {
      console.log('[send-order] ===== ENVIO FALHOU =====');
      return NextResponse.json(
        { success: false, error: 'Erro ao enviar mensagem' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[send-order] ===== ERRO NO ENVIO =====', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

