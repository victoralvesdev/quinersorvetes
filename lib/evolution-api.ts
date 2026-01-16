/**
 * Cliente para integração com Evolution API v2.x (WhatsApp)
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || '';

function isEvolutionConfigured(): boolean {
  return Boolean(EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE);
}

/**
 * Envia uma mensagem de texto simples
 */
export async function sendTextMessage(
  phoneNumber: string,
  text: string
): Promise<boolean> {
  if (!isEvolutionConfigured()) {
    console.error('Evolution API não configurada. Verifique as variáveis de ambiente.');
    return false;
  }

  try {
    // Evolution API v2.x usa formato simplificado
    const payload = {
      number: phoneNumber,
      text,
    };

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao enviar mensagem:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    return false;
  }
}

/**
 * Envia uma mensagem com imagem (URL ou base64)
 */
export async function sendImageMessage(
  phoneNumber: string,
  imageSource: string,
  caption?: string
): Promise<boolean> {
  if (!isEvolutionConfigured()) {
    console.error('Evolution API não configurada. Verifique as variáveis de ambiente.');
    return false;
  }

  try {
    // Detecta se é base64 ou URL
    const isBase64 = imageSource.startsWith('data:') || !imageSource.startsWith('http');

    let payload;
    if (isBase64) {
      // Remove prefixo data:image/... se existir
      let cleanBase64 = imageSource;
      if (imageSource.includes(',')) {
        cleanBase64 = imageSource.split(',')[1];
      }

      payload = {
        number: phoneNumber,
        media: cleanBase64,
        mimetype: 'image/jpeg',
        caption: caption || '',
      };
    } else {
      // É uma URL
      payload = {
        number: phoneNumber,
        media: imageSource,
        mediatype: 'image',
        caption: caption || '',
      };
    }

    console.log('[sendImageMessage] Enviando imagem para:', phoneNumber);

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendImageMessage] Erro ao enviar imagem:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('[sendImageMessage] Imagem enviada com sucesso:', result.key?.id);
    return true;
  } catch (error) {
    console.error('[sendImageMessage] Erro:', error);
    return false;
  }
}

/**
 * Envia uma mensagem com botões interativos
 * Formato baseado no Postman que funcionou
 */
export async function sendButtonMessage(
  phoneNumber: string,
  options: {
    title: string;
    description: string;
    footer?: string;
    thumbnailUrl?: string;
    buttons: { id: string; text: string }[];
  }
): Promise<boolean> {
  if (!isEvolutionConfigured()) {
    console.error('Evolution API não configurada. Verifique as variáveis de ambiente.');
    return false;
  }

  try {
    // Formata o número para o formato correto do WhatsApp
    // Se já tiver @s.whatsapp.net, mantém; senão, adiciona
    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.includes('@')) {
      // Remove caracteres não numéricos e adiciona @s.whatsapp.net
      const cleaned = formattedNumber.replace(/\D/g, '');
      formattedNumber = `${cleaned}@s.whatsapp.net`;
    }

    // Formato conforme Postman que funcionou - formato simples
    const formattedButtons = options.buttons.map((button) => ({
      type: 'reply',
      displayText: button.text,
      id: button.id,
    }));

    // Formato 1: Formato simples conforme Postman
    const payloadSimple: {
      number: string;
      title: string;
      description: string;
      footer?: string;
      thumbnailUrl?: string;
      buttons: Array<{ type: string; displayText: string; id: string }>;
    } = {
      number: formattedNumber,
      title: options.title,
      description: options.description,
      buttons: formattedButtons,
    };

    // Adiciona footer se fornecido
    if (options.footer) {
      payloadSimple.footer = options.footer;
    }

    // Adiciona thumbnailUrl se fornecido
    if (options.thumbnailUrl) {
      payloadSimple.thumbnailUrl = options.thumbnailUrl;
    }

    // Tenta diferentes endpoints - formato simples conforme Postman
    const endpoints = [
      { 
        path: `/message/sendButtons/${EVOLUTION_INSTANCE}`, 
        payload: payloadSimple,
        name: 'sendButtons (formato simples)'
      },
      { 
        path: `/message/sendButton/${EVOLUTION_INSTANCE}`, 
        payload: payloadSimple,
        name: 'sendButton (formato simples)'
      },
    ];

    let lastError: string | null = null;
    let response: Response | null = null;
    let responseText: string = '';
    let lastEndpoint: string = '';

    for (const { path, payload: testPayload, name } of endpoints) {
      const endpoint = `${EVOLUTION_API_URL}${path}`;
      lastEndpoint = endpoint;
      console.log(`[sendButtonMessage] Tentando: ${name}`);
      console.log('[sendButtonMessage] Endpoint:', endpoint);
      console.log('[sendButtonMessage] Payload:', JSON.stringify(testPayload, null, 2));

      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify(testPayload),
        });

        responseText = await response.text();

        if (response.ok) {
          console.log('[sendButtonMessage] Sucesso com endpoint:', endpoint);
          // Verifica se realmente foi enviado como botões
          try {
            const responseData = JSON.parse(responseText);
            if (responseData.messageType && responseData.messageType !== 'conversation') {
              console.log('[sendButtonMessage] Mensagem enviada com tipo:', responseData.messageType);
              break;
            }
          } catch {
            // Continua tentando se não conseguir verificar
          }
        } else {
          lastError = responseText;
          console.log(`[sendButtonMessage] Endpoint ${endpoint} falhou:`, response.status, responseText);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
        console.log(`[sendButtonMessage] Erro ao tentar endpoint ${endpoint}:`, lastError);
      }
    }

    if (!response || !response.ok) {
      console.error('[sendButtonMessage] Todos os endpoints falharam. Último erro:', lastError);
      return false;
    }
    
    console.log('[sendButtonMessage] Response status:', response.status);
    console.log('[sendButtonMessage] Response body:', responseText);

    // Verifica se a resposta indica sucesso
    try {
      const responseData = JSON.parse(responseText);
      console.log('[sendButtonMessage] Resposta parseada:', JSON.stringify(responseData, null, 2));
      
      // Verifica diferentes formatos de resposta de erro
      if (responseData.error || responseData.status === 'error' || responseData.message?.includes('error')) {
        console.error('[sendButtonMessage] API retornou erro na resposta:', responseData);
        return false;
      }
      
      // Verifica se há indicação de que foi enviado como texto
      if (responseData.messageType === 'conversation' || responseData.type === 'text' || responseData.message?.conversation) {
        console.error('❌ [sendButtonMessage] ERRO: Mensagem foi enviada como TEXTO ao invés de BOTÕES!');
        console.error('[sendButtonMessage] Resposta completa:', JSON.stringify(responseData, null, 2));
        console.error('[sendButtonMessage] Endpoint usado:', lastEndpoint);
        console.error('[sendButtonMessage] Isso indica que a Evolution API não está aceitando o formato de botões.');
        console.error('[sendButtonMessage] Verifique: 1) Se o endpoint está correto, 2) Se a instância está configurada corretamente, 3) Se precisa de template aprovado pelo WhatsApp');
        return false; // Retorna false para indicar falha
      }
      
      // Verifica se foi enviado como botões
      if (responseData.messageType === 'buttonsResponseMessage' || responseData.type === 'buttons' || responseData.message?.buttonsResponseMessage) {
        console.log('✅ [sendButtonMessage] Sucesso: Mensagem enviada como BOTÕES!');
      }
    } catch (parseError) {
      // Se não conseguir parsear, verifica se é uma resposta de sucesso simples
      if (responseText.toLowerCase().includes('error') || responseText.toLowerCase().includes('fail')) {
        console.error('[sendButtonMessage] Resposta indica erro:', responseText);
        return false;
      }
      console.log('[sendButtonMessage] Resposta não é JSON, assumindo sucesso');
    }

    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem com botões:', error);
    return false;
  }
}

/**
 * Envia uma mensagem de pedido com botões de aprovação/rejeição
 */
export async function sendOrderMessage(
  phoneNumber: string,
  orderId: string,
  orderData: {
    customerName: string;
    items: Array<{ product_name: string; quantity: number; price: number }>;
    total: number;
    paymentMethod: string;
    isPaid?: boolean;
    address?: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
      reference?: string;
    };
  },
  adminPhoneNumber?: string
): Promise<boolean> {
  if (!isEvolutionConfigured()) {
    console.error('Evolution API não configurada. Verifique as variáveis de ambiente.');
    return false;
  }

  try {
    // Formata os itens do pedido
    const itemsText = orderData.items
      .map((item) => `• ${item.product_name} x${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`)
      .join('\n');

    // Formata o endereço
    const addressText = orderData.address
      ? `${orderData.address.street}, ${orderData.address.number}${orderData.address.complement ? ` - ${orderData.address.complement}` : ''}\n${orderData.address.neighborhood}, ${orderData.address.city} - ${orderData.address.state}\nCEP: ${orderData.address.zip_code}${orderData.address.reference ? `\nReferência: ${orderData.address.reference}` : ''}`
      : 'Endereço não informado';

    // Formata método de pagamento
    const paymentMethodMap: Record<string, string> = {
      'pix': 'PIX',
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'card': 'Cartão de Crédito/Débito',
      'cash_on_delivery': 'Pagar na Entrega'
    };
    const paymentMethodText = paymentMethodMap[orderData.paymentMethod] || orderData.paymentMethod;

    // Status do pagamento
    const paymentStatusText = orderData.isPaid
      ? '✅ *PAGO*'
      : '⏳ *Aguardando pagamento na entrega*';

    const description = `📦 *Novo Pedido #${orderId.slice(0, 8)}*

👤 *Cliente:* ${orderData.customerName}
📱 *Telefone:* ${phoneNumber}

🛒 *Itens:*
${itemsText}

💰 *Total:* R$ ${orderData.total.toFixed(2)}
💳 *Pagamento:* ${paymentMethodText}
${paymentStatusText}

📍 *Endereço de Entrega:*
${addressText}`;

    // Se houver número do admin, envia mensagem com comandos para confirmar/cancelar
    if (adminPhoneNumber) {
      console.log('[sendOrderMessage] Enviando mensagem para admin:', adminPhoneNumber);

      const orderCode = orderId.slice(0, 8);

      // Envia a descrição do pedido
      await sendTextMessage(adminPhoneNumber, description);

      // Pequeno delay para garantir ordem das mensagens
      await new Promise(resolve => setTimeout(resolve, 500));

      // Envia mensagem de confirmação
      await sendTextMessage(adminPhoneNumber, `Confirmar #${orderCode}`);

      // Pequeno delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // Envia mensagem de cancelamento
      await sendTextMessage(adminPhoneNumber, `Cancelar #${orderCode}`);

      console.log('[sendOrderMessage] Mensagens de acao enviadas para admin');
    } else {
      console.log('[sendOrderMessage] Admin phone number não configurado');
    }

    // Envia mensagem de confirmação para o cliente (sempre em texto)
    await sendTextMessage(
      phoneNumber,
      `✅ *Pedido Confirmado!*\n\nSeu pedido #${orderId.slice(0, 8)} foi recebido e está sendo processado.\n\nEm breve você receberá atualizações sobre o status do seu pedido.`
    );

    return true;
  } catch (error) {
    console.error('Erro ao enviar mensagem de pedido:', error);
    return false;
  }
}

/**
 * Envia uma mensagem com lista de opções
 */
export async function sendListMessage(
  phoneNumber: string,
  text: string,
  buttonText: string,
  sections: {
    title: string;
    rows: { title: string; description?: string; rowId: string }[];
  }[]
): Promise<boolean> {
  if (!isEvolutionConfigured()) {
    console.error('Evolution API não configurada. Verifique as variáveis de ambiente.');
    return false;
  }

  try {
    // Formata o número
    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.includes('@')) {
      const cleaned = formattedNumber.replace(/\D/g, '');
      formattedNumber = cleaned;
    }

    // Evolution API v2.x formato correto para listas
    const payload = {
      number: formattedNumber,
      options: {
        delay: 1200,
        presence: 'composing',
      },
      listMessage: {
        title: 'Quiner',
        description: text,
        buttonText,
        footerText: 'Selecione uma opção',
        sections,
      },
    };

    console.log('[sendListMessage] Enviando lista para:', formattedNumber);
    console.log('[sendListMessage] Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendList/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    console.log('[sendListMessage] Response status:', response.status);
    console.log('[sendListMessage] Response body:', responseText);

    if (!response.ok) {
      console.error('[sendListMessage] Erro ao enviar mensagem com lista:', responseText);
      return false;
    }

    // Verifica se a resposta indica sucesso real
    try {
      const responseData = JSON.parse(responseText);
      if (responseData.error || responseData.status === 'error') {
        console.error('[sendListMessage] API retornou erro:', responseData);
        return false;
      }
    } catch {
      // Se não for JSON, assume sucesso se status HTTP foi ok
    }

    return true;
  } catch (error) {
    console.error('[sendListMessage] Erro ao enviar mensagem com lista:', error);
    return false;
  }
}

/**
 * Obtém o base64 de uma mídia (imagem, áudio, vídeo) de uma mensagem
 */
export async function getMediaBase64(messageId: string): Promise<string | null> {
  if (!isEvolutionConfigured()) {
    console.error('Evolution API não configurada. Verifique as variáveis de ambiente.');
    return null;
  }

  try {
    const payload = {
      message: {
        key: {
          id: messageId,
        },
      },
      convertToMp4: false,
    };

    console.log('[getMediaBase64] Buscando mídia para messageId:', messageId);

    const response = await fetch(
      `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[getMediaBase64] Erro ao buscar mídia:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('[getMediaBase64] Resposta recebida, tamanho base64:', data.base64?.length || 0);

    return data.base64 || null;
  } catch (error) {
    console.error('[getMediaBase64] Erro:', error);
    return null;
  }
}
