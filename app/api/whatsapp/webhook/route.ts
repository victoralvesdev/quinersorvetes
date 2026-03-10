import { NextRequest, NextResponse } from 'next/server';
import { getCategories, getCategoryById } from '@/lib/supabase/categories';
import { sendListMessage, sendTextMessage, sendImageMessage, getMediaBase64 } from '@/lib/evolution-api';
import {
  getConversationState,
  upsertConversationState,
  deleteConversationState,
} from '@/lib/supabase/conversation-state';
import { createProduct, getProductsByCategory, updateProduct, getProductById } from '@/lib/supabase/products';
import { uploadImageFromBase64 } from '@/lib/supabase/storage';
import { getOrderByShortCode, updateOrderStatus, getOrderWithUser } from '@/lib/supabase/orders';

// Número do admin configurado
const ADMIN_PHONE = process.env.ADMIN_WHATSAPP_NUMBER?.replace(/\D/g, '') || '';

// Timeout em minutos para cancelar conversa inativa
const CONVERSATION_TIMEOUT_MINUTES = 10;

/**
 * Webhook para receber mensagens do WhatsApp via Evolution API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Webhook recebido:', JSON.stringify(body, null, 2));

    // Verifica se é uma mensagem
    if (body.event === 'messages.upsert') {
      const message = body.data;

      // Ignora mensagens enviadas pelo próprio bot
      if (message.key?.fromMe) {
        return NextResponse.json({ success: true, message: 'Mensagem própria ignorada' });
      }

      // Extrai informações da mensagem
      const phoneNumber = message.key?.remoteJid?.replace('@s.whatsapp.net', '');
      const messageId = message.key?.id;
      const messageText = message.message?.conversation ||
                         message.message?.extendedTextMessage?.text ||
                         message.message?.imageMessage?.caption ||
                         '';

      // Verifica se é uma mensagem de imagem
      const isImageMessage = !!message.message?.imageMessage;

      if (!phoneNumber) {
        return NextResponse.json({ success: true, message: 'Mensagem sem número' });
      }

      // Verifica se há um estado de conversa ativo
      const conversationState = await getConversationState(phoneNumber);

      // Verifica se a conversa expirou por timeout (inatividade)
      if (conversationState) {
        const lastUpdate = conversationState.updatedAt;
        const now = new Date();
        const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

        if (diffMinutes > CONVERSATION_TIMEOUT_MINUTES) {
          console.log('[Webhook] Conversa expirada por timeout:', phoneNumber);
          await deleteConversationState(phoneNumber);
          await sendTextMessage(
            phoneNumber,
            '⏰ Sua sessão anterior expirou por inatividade.\n\nEnvie *cadastrar produto* ou *editar produto* para começar novamente.'
          );
          return NextResponse.json({ success: true, message: 'Conversa expirada' });
        }
      }

      // Detecta comando de cancelar (cancela qualquer ação em andamento)
      const cancelarAcaoRegex = /^cancelar$/i;
      if (cancelarAcaoRegex.test(messageText.trim()) && conversationState) {
        console.log('[Webhook] Cancelando ação em andamento para:', phoneNumber);
        await deleteConversationState(phoneNumber);
        await sendTextMessage(
          phoneNumber,
          '❌ Ação cancelada!\n\nEnvie *cadastrar produto* ou *editar produto* quando quiser recomeçar.'
        );
        return NextResponse.json({ success: true, message: 'Ação cancelada' });
      }

      // Se for uma imagem e estamos aguardando imagem, processa a imagem
      if (isImageMessage && conversationState?.step === 'awaiting_image') {
        console.log('[Webhook] Imagem recebida para cadastro, processando...');
        await handleProductImageUpload(phoneNumber, messageId, conversationState);
        return NextResponse.json({ success: true });
      }

      // Se for uma imagem e estamos aguardando imagem para edição
      if (isImageMessage && conversationState?.step === 'edit_awaiting_image') {
        console.log('[Webhook] Imagem recebida para edição, processando...');
        await handleEditProductImageUpload(phoneNumber, messageId, conversationState);
        return NextResponse.json({ success: true });
      }

      // Se não tem texto e não é imagem no momento certo, ignora
      if (!messageText) {
        return NextResponse.json({ success: true, message: 'Mensagem sem texto' });
      }

      // Detecta comando de cadastrar produto (case insensitive e com variações de digitação)
      const cadastrarProdutoRegex = /cadastr[ao]r?\s*prod[uo]t[oa]?/i;

      // Detecta comando de editar produto
      const editarProdutoRegex = /edit[ao]r?\s*prod[uo]t[oa]?/i;

      // Detecta comando de confirmar pedido: "Confirmar #código" ou "Confirmar pedido #código"
      const confirmarPedidoRegex = /confirmar\s*(?:pedido\s*)?#?([a-f0-9]{8})/i;

      // Detecta comando de cancelar pedido: "Cancelar #código" ou "Cancelar pedido #código"
      const cancelarPedidoRegex = /cancelar\s*(?:pedido\s*)?#?([a-f0-9]{8})/i;

      // Detecta comando de saiu para entrega: "Saiu #código" ou "Saiu para entrega #código"
      const saiuEntregaRegex = /sa[íi][ur]?\s*(?:para\s*)?(?:entrega\s*)?#?([a-f0-9]{8})/i;

      // Verifica se é mensagem do admin para confirmar/cancelar pedido
      const isAdmin = phoneNumber === ADMIN_PHONE || phoneNumber === ADMIN_PHONE.replace('55', '');

      // Verifica se é resposta de botão de pedido (confirmar/cancelar)
      const buttonResponse = message.message?.buttonsResponseMessage;
      if (isAdmin && buttonResponse) {
        const selectedButtonId = buttonResponse.selectedButtonId || '';
        const selectedButtonText = buttonResponse.selectedDisplayText || '';

        // Verifica se é botão de confirmar pedido
        const confirmarButtonMatch = selectedButtonId.match(/confirmar_([a-f0-9]{8})/i) ||
                                     selectedButtonText.match(/confirmar\s*#?([a-f0-9]{8})/i);
        if (confirmarButtonMatch) {
          const orderCode = confirmarButtonMatch[1];
          await handleConfirmarPedido(phoneNumber, orderCode);
          return NextResponse.json({ success: true });
        }

        // Verifica se é botão de cancelar pedido
        const cancelarButtonMatch = selectedButtonId.match(/cancelar_([a-f0-9]{8})/i) ||
                                    selectedButtonText.match(/cancelar\s*#?([a-f0-9]{8})/i);
        if (cancelarButtonMatch) {
          const orderCode = cancelarButtonMatch[1];
          await handleCancelarPedido(phoneNumber, orderCode);
          return NextResponse.json({ success: true });
        }
      }

      // Verifica se é resposta de lista interativa (confirmar/cancelar pedido)
      const listResponse = message.message?.listResponseMessage;
      if (isAdmin && listResponse) {
        const selectedRowId = listResponse.singleSelectReply?.selectedRowId || listResponse.selectedRowId || '';
        const selectedTitle = listResponse.title || '';

        console.log('[Webhook] Lista selecionada:', { selectedRowId, selectedTitle });

        // Verifica se é opção de confirmar pedido
        const confirmarListMatch = selectedRowId.match(/confirmar_([a-f0-9]{8})/i);
        if (confirmarListMatch) {
          const orderCode = confirmarListMatch[1];
          await handleConfirmarPedido(phoneNumber, orderCode);
          return NextResponse.json({ success: true });
        }

        // Verifica se é opção de cancelar pedido
        const cancelarListMatch = selectedRowId.match(/cancelar_([a-f0-9]{8})/i);
        if (cancelarListMatch) {
          const orderCode = cancelarListMatch[1];
          await handleCancelarPedido(phoneNumber, orderCode);
          return NextResponse.json({ success: true });
        }
      }

      const confirmarMatch = messageText.match(confirmarPedidoRegex);
      const cancelarMatch = messageText.match(cancelarPedidoRegex);
      const saiuMatch = messageText.match(saiuEntregaRegex);

      if (isAdmin && confirmarMatch) {
        const orderCode = confirmarMatch[1];
        await handleConfirmarPedido(phoneNumber, orderCode);
      } else if (isAdmin && cancelarMatch) {
        const orderCode = cancelarMatch[1];
        await handleCancelarPedido(phoneNumber, orderCode);
      } else if (isAdmin && saiuMatch) {
        const orderCode = saiuMatch[1];
        await handleSaiuEntrega(phoneNumber, orderCode);
      } else if (cadastrarProdutoRegex.test(messageText)) {
        await handleCadastrarProduto(phoneNumber);
      } else if (editarProdutoRegex.test(messageText)) {
        await handleEditarProduto(phoneNumber);
      }
      // Detecta resposta de botão de categoria
      else if (message.message?.buttonsResponseMessage) {
        const selectedButtonId = message.message.buttonsResponseMessage.selectedButtonId;
        await handleCategorySelection(phoneNumber, selectedButtonId);
      }
      // Se há um estado de conversa ativo, processa com base no passo atual
      else if (conversationState) {
        await handleConversationFlow(phoneNumber, messageText, conversationState);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

/**
 * Processa o comando "cadastrar produto"
 */
async function handleCadastrarProduto(phoneNumber: string) {
  try {
    console.log('[handleCadastrarProduto] Iniciando para:', phoneNumber);

    // Busca as categorias do banco de dados
    const categories = await getCategories();
    console.log('[handleCadastrarProduto] Categorias encontradas:', categories.length);

    if (categories.length === 0) {
      console.log('[handleCadastrarProduto] Nenhuma categoria encontrada');
      await sendTextMessage(
        phoneNumber,
        'Desculpe, não foi possível carregar as categorias no momento. Tente novamente mais tarde.'
      );
      return;
    }

    // Salva as categorias no estado para usar depois
    await upsertConversationState({
      phoneNumber,
      step: 'awaiting_category',
      categoryId: '',
      productData: {
        availableCategories: categories.map((c, index) => ({
          index: index + 1,
          id: c.id,
          name: c.name,
        })),
      },
    });

    // Cria lista de categorias em texto
    const categoryList = categories
      .map((category, index) => `*${index + 1}.* ${category.name}`)
      .join('\n');

    const message = `📦 *Cadastro de Produto*\n\nQual categoria você quer adicionar o novo produto?\n\n${categoryList}\n\n_Responda com o número da categoria desejada._`;

    const result = await sendTextMessage(phoneNumber, message);
    console.log('[handleCadastrarProduto] Resultado do envio:', result);
  } catch (error) {
    console.error('[handleCadastrarProduto] Erro:', error);
    await sendTextMessage(
      phoneNumber,
      'Desculpe, ocorreu um erro ao processar seu comando. Tente novamente.'
    );
  }
}

/**
 * Processa a seleção de categoria
 */
async function handleCategorySelection(phoneNumber: string, buttonId: string) {
  try {
    // Extrai o ID da categoria do buttonId
    const categoryId = buttonId.replace('category_', '');

    if (buttonId === 'more_categories') {
      // Busca todas as categorias e mostra as restantes
      const categories = await getCategories();
      const remainingCategories = categories.slice(3);

      const buttons = remainingCategories.slice(0, 3).map((category) => ({
        id: `category_${category.id}`,
        text: category.name,
      }));

      // Usa lista ao invés de botões (botões foram descontinuados na Evolution API)
      await sendListMessage(
        phoneNumber,
        'Escolha uma das categorias abaixo:',
        'Selecionar Categoria',
        [
          {
            title: 'Categorias',
            rows: buttons.map((btn) => ({
              title: btn.text,
              description: `Categoria: ${btn.text}`,
              rowId: btn.id,
            })),
          },
        ]
      );
    } else {
      // Busca a categoria selecionada
      const selectedCategory = await getCategoryById(categoryId);

      if (selectedCategory) {
        // Salva o estado da conversa
        await upsertConversationState({
          phoneNumber,
          step: 'awaiting_name',
          categoryId: selectedCategory.id,
          productData: {},
        });

        await sendTextMessage(
          phoneNumber,
          `✅ Categoria "${selectedCategory.name}" selecionada!\n\nAgora envie o *nome do produto* que deseja cadastrar.`
        );
      }
    }
  } catch (error) {
    console.error('Erro ao processar seleção de categoria:', error);
    await sendTextMessage(
      phoneNumber,
      'Desculpe, ocorreu um erro ao processar sua seleção. Tente novamente.'
    );
  }
}

/**
 * Processa o fluxo de conversa baseado no estado atual
 */
async function handleConversationFlow(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  try {
    switch (state.step) {
      // Fluxo de cadastro de produto
      case 'awaiting_category':
        await handleCategoryNumber(phoneNumber, messageText, state);
        break;
      case 'awaiting_name':
        await handleProductName(phoneNumber, messageText, state);
        break;
      case 'awaiting_description':
        await handleProductDescription(phoneNumber, messageText, state);
        break;
      case 'awaiting_price':
        await handleProductPrice(phoneNumber, messageText, state);
        break;
      case 'awaiting_image':
        await handleProductImage(phoneNumber, messageText, state);
        break;

      // Fluxo de edição de produto
      case 'edit_awaiting_category':
        await handleEditCategorySelection(phoneNumber, messageText, state);
        break;
      case 'edit_awaiting_product':
        await handleEditProductSelection(phoneNumber, messageText, state);
        break;
      case 'edit_awaiting_field':
        await handleEditFieldSelection(phoneNumber, messageText, state);
        break;
      case 'edit_awaiting_name':
        await handleEditProductName(phoneNumber, messageText, state);
        break;
      case 'edit_awaiting_description':
        await handleEditProductDescription(phoneNumber, messageText, state);
        break;
      case 'edit_awaiting_price':
        await handleEditProductPrice(phoneNumber, messageText, state);
        break;
      case 'edit_awaiting_image':
        await handleEditProductImageText(phoneNumber, messageText, state);
        break;

      default:
        break;
    }
  } catch (error) {
    console.error('Erro ao processar fluxo de conversa:', error);
    await sendTextMessage(
      phoneNumber,
      'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
    );
  }
}

/**
 * Processa a seleção de categoria por número
 */
async function handleCategoryNumber(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  const categoryNumber = parseInt(messageText.trim(), 10);
  const availableCategories = state.productData?.availableCategories as Array<{
    index: number;
    id: string;
    name: string;
  }> | undefined;

  if (!availableCategories) {
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao processar categorias. Envie *cadastrar produto* para recomeçar.'
    );
    await deleteConversationState(phoneNumber);
    return;
  }

  if (isNaN(categoryNumber) || categoryNumber < 1 || categoryNumber > availableCategories.length) {
    await sendTextMessage(
      phoneNumber,
      `❌ Opção inválida. Responda com um número de 1 a ${availableCategories.length}.`
    );
    return;
  }

  const selectedCategory = availableCategories.find((c) => c.index === categoryNumber);

  if (!selectedCategory) {
    await sendTextMessage(
      phoneNumber,
      '❌ Categoria não encontrada. Tente novamente.'
    );
    return;
  }

  // Atualiza o estado para aguardar o nome do produto
  await upsertConversationState({
    phoneNumber,
    step: 'awaiting_name',
    categoryId: selectedCategory.id,
    productData: {},
  });

  await sendTextMessage(
    phoneNumber,
    `✅ Categoria *${selectedCategory.name}* selecionada!\n\nAgora envie o *nome do produto* que deseja cadastrar.`
  );
}

/**
 * Processa o nome do produto
 */
async function handleProductName(
  phoneNumber: string,
  productName: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  // Valida o nome do produto
  if (productName.trim().length < 3) {
    await sendTextMessage(
      phoneNumber,
      '❌ O nome do produto deve ter pelo menos 3 caracteres. Tente novamente.'
    );
    return;
  }

  // Atualiza o estado com o nome do produto
  await upsertConversationState({
    phoneNumber,
    step: 'awaiting_description',
    categoryId: state.categoryId,
    productData: {
      ...state.productData,
      name: productName.trim(),
    },
  });

  await sendTextMessage(
    phoneNumber,
    `✅ Nome salvo: *${productName.trim()}*\n\nAgora envie a *descrição do produto*.`
  );
}

/**
 * Processa a descrição do produto
 */
async function handleProductDescription(
  phoneNumber: string,
  description: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  // Valida a descrição
  if (description.trim().length < 10) {
    await sendTextMessage(
      phoneNumber,
      '❌ A descrição deve ter pelo menos 10 caracteres. Tente novamente.'
    );
    return;
  }

  // Atualiza o estado com a descrição
  await upsertConversationState({
    phoneNumber,
    step: 'awaiting_price',
    categoryId: state.categoryId,
    productData: {
      ...state.productData,
      description: description.trim(),
    },
  });

  await sendTextMessage(
    phoneNumber,
    `✅ Descrição salva!\n\nAgora envie o *preço do produto* (exemplo: 15.90 ou 15,90).`
  );
}

/**
 * Processa o preço do produto
 */
async function handleProductPrice(
  phoneNumber: string,
  priceText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  // Converte o texto para número (aceita vírgula ou ponto como separador decimal)
  const normalizedPrice = priceText.trim().replace(',', '.');
  const price = parseFloat(normalizedPrice);

  // Valida o preço
  if (isNaN(price) || price <= 0) {
    await sendTextMessage(
      phoneNumber,
      '❌ Preço inválido. Envie um valor numérico positivo (exemplo: 15.90).'
    );
    return;
  }

  // Atualiza o estado com o preço
  await upsertConversationState({
    phoneNumber,
    step: 'awaiting_image',
    categoryId: state.categoryId,
    productData: {
      ...state.productData,
      price,
    },
  });

  await sendTextMessage(
    phoneNumber,
    `✅ Preço salvo: R$ ${price.toFixed(2)}\n\nAgora envie a *foto do produto* 📸 ou digite *PULAR* para finalizar sem imagem.`
  );
}

/**
 * Processa texto quando aguardando imagem (PULAR ou URL como fallback)
 */
async function handleProductImage(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  const trimmedText = messageText.trim();

  // Permite pular o envio da imagem
  if (trimmedText.toUpperCase() === 'PULAR') {
    await finalizeProductRegistration(phoneNumber, state, undefined);
    return;
  }

  // Verifica se é uma URL (fallback para quem preferir enviar URL)
  try {
    new URL(trimmedText);
    await finalizeProductRegistration(phoneNumber, state, trimmedText);
    return;
  } catch {
    // Não é uma URL, pede para enviar a foto
    await sendTextMessage(
      phoneNumber,
      '📸 Por favor, envie a *foto do produto* ou digite *PULAR* para continuar sem imagem.'
    );
  }
}

/**
 * Processa o upload de imagem do produto
 */
async function handleProductImageUpload(
  phoneNumber: string,
  messageId: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  try {
    await sendTextMessage(phoneNumber, '⏳ Processando imagem...');

    // Obtém o base64 da imagem da Evolution API
    const base64Data = await getMediaBase64(messageId);

    if (!base64Data) {
      await sendTextMessage(
        phoneNumber,
        '❌ Não foi possível processar a imagem. Por favor, envie novamente ou digite *PULAR*.'
      );
      return;
    }

    console.log('[handleProductImageUpload] Base64 obtido, tamanho:', base64Data.length);

    // Faz upload para o Supabase Storage
    const imageUrl = await uploadImageFromBase64(base64Data);

    if (!imageUrl) {
      await sendTextMessage(
        phoneNumber,
        '❌ Erro ao salvar a imagem. Por favor, envie novamente ou digite *PULAR*.'
      );
      return;
    }

    console.log('[handleProductImageUpload] Imagem salva:', imageUrl);

    // Finaliza o cadastro com a URL da imagem
    await finalizeProductRegistration(phoneNumber, state, imageUrl);
  } catch (error) {
    console.error('[handleProductImageUpload] Erro:', error);
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao processar a imagem. Por favor, envie novamente ou digite *PULAR*.'
    );
  }
}

/**
 * Finaliza o cadastro do produto
 */
async function finalizeProductRegistration(
  phoneNumber: string,
  state: Awaited<ReturnType<typeof getConversationState>>,
  imageUrl?: string
) {
  if (!state || !state.categoryId) return;

  try {
    const category = await getCategoryById(state.categoryId);
    const productData = {
      ...state.productData,
      image: imageUrl,
    };

    // Valida os dados do produto
    if (!productData.name || !productData.description || !productData.price) {
      await sendTextMessage(
        phoneNumber,
        '❌ Dados do produto incompletos. Por favor, inicie o cadastro novamente enviando *cadastrar produto*.'
      );
      await deleteConversationState(phoneNumber);
      return;
    }

    // Salva o produto no banco de dados
    const newProduct = await createProduct({
      name: productData.name,
      description: productData.description,
      price: productData.price,
      image: productData.image,
      category_id: state.categoryId,
      available: true,
      featured: false,
    });

    if (!newProduct) {
      await sendTextMessage(
        phoneNumber,
        '❌ Erro ao salvar o produto no banco de dados. Tente novamente.'
      );
      return;
    }

    const summary = `✅ *Produto cadastrado com sucesso!*

📦 *Resumo do Produto:*
• Categoria: ${category?.name || 'N/A'}
• Nome: ${productData.name}
• Descrição: ${productData.description}
• Preço: R$ ${productData.price.toFixed(2)}

Para cadastrar outro produto, envie *cadastrar produto* novamente.`;

    // Se tem imagem, envia a imagem com o resumo como legenda
    if (imageUrl) {
      await sendImageMessage(phoneNumber, imageUrl, summary);
    } else {
      // Sem imagem, envia apenas texto
      await sendTextMessage(phoneNumber, summary + '\n\n• Sem imagem');
    }

    // Limpa o estado da conversa
    await deleteConversationState(phoneNumber);
  } catch (error) {
    console.error('Erro ao finalizar cadastro do produto:', error);
    await sendTextMessage(
      phoneNumber,
      'Desculpe, ocorreu um erro ao finalizar o cadastro. Tente novamente.'
    );
  }
}

/**
 * Processa o comando de confirmar pedido
 */
async function handleConfirmarPedido(adminPhone: string, orderCode: string) {
  try {
    console.log('[handleConfirmarPedido] Confirmando pedido:', orderCode);

    // Busca o pedido pelo código curto
    const orderData = await getOrderWithUser(orderCode);

    if (!orderData) {
      // Tenta buscar pelo código curto
      const order = await getOrderByShortCode(orderCode);
      if (!order) {
        await sendTextMessage(
          adminPhone,
          `❌ Pedido #${orderCode} não encontrado.\n\nVerifique se o código está correto.`
        );
        return;
      }

      // Busca dados completos com usuário
      const fullOrderData = await getOrderWithUser(order.id);
      if (!fullOrderData) {
        await sendTextMessage(adminPhone, `❌ Erro ao buscar dados do pedido.`);
        return;
      }

      await processOrderConfirmation(adminPhone, fullOrderData.order, fullOrderData.userPhone);
    } else {
      await processOrderConfirmation(adminPhone, orderData.order, orderData.userPhone);
    }
  } catch (error) {
    console.error('[handleConfirmarPedido] Erro:', error);
    await sendTextMessage(
      adminPhone,
      `❌ Erro ao confirmar pedido. Tente novamente.`
    );
  }
}

/**
 * Processa a confirmação do pedido
 */
async function processOrderConfirmation(adminPhone: string, order: any, customerPhone: string) {
  const orderCode = order.id.slice(0, 8);

  // Verifica se o pedido já foi confirmado
  if (order.status !== 'novo') {
    await sendTextMessage(
      adminPhone,
      `⚠️ Pedido #${orderCode} já está com status: *${order.status}*`
    );
    return;
  }

  // Atualiza o status do pedido para "preparando"
  const updatedOrder = await updateOrderStatus(order.id, 'preparando');

  if (!updatedOrder) {
    await sendTextMessage(adminPhone, `❌ Erro ao atualizar status do pedido.`);
    return;
  }

  // Notifica o admin
  await sendTextMessage(
    adminPhone,
    `✅ Pedido #${orderCode} *CONFIRMADO*!\n\nO cliente será notificado.`
  );

  // Notifica o cliente
  if (customerPhone) {
    const formattedPhone = customerPhone.startsWith('55') ? customerPhone : `55${customerPhone.replace(/\D/g, '')}`;
    await sendTextMessage(
      formattedPhone,
      `🎉 *Ótima notícia!*\n\nSeu pedido #${orderCode} foi *confirmado* e está sendo preparado!\n\nEm breve você receberá mais atualizações. 🍦`
    );
  }

  console.log('[processOrderConfirmation] Pedido confirmado:', orderCode);
}

/**
 * Processa o comando de cancelar pedido
 */
async function handleCancelarPedido(adminPhone: string, orderCode: string) {
  try {
    console.log('[handleCancelarPedido] Cancelando pedido:', orderCode);

    // Busca o pedido pelo código curto
    const order = await getOrderByShortCode(orderCode);

    if (!order) {
      await sendTextMessage(
        adminPhone,
        `❌ Pedido #${orderCode} não encontrado.\n\nVerifique se o código está correto.`
      );
      return;
    }

    // Verifica se o pedido pode ser cancelado
    if (order.status === 'entregue') {
      await sendTextMessage(
        adminPhone,
        `⚠️ Pedido #${orderCode} já foi entregue e não pode ser cancelado.`
      );
      return;
    }

    if (order.status === 'cancelado') {
      await sendTextMessage(
        adminPhone,
        `⚠️ Pedido #${orderCode} já está cancelado.`
      );
      return;
    }

    // Busca dados do cliente
    const fullOrderData = await getOrderWithUser(order.id);

    // Atualiza o status do pedido para "cancelado"
    const updatedOrder = await updateOrderStatus(order.id, 'cancelado');

    if (!updatedOrder) {
      await sendTextMessage(adminPhone, `❌ Erro ao cancelar pedido.`);
      return;
    }

    // Notifica o admin
    await sendTextMessage(
      adminPhone,
      `🚫 Pedido #${orderCode} foi *CANCELADO*.\n\nO cliente será notificado.`
    );

    // Notifica o cliente
    if (fullOrderData?.userPhone) {
      const formattedPhone = fullOrderData.userPhone.startsWith('55')
        ? fullOrderData.userPhone
        : `55${fullOrderData.userPhone.replace(/\D/g, '')}`;
      await sendTextMessage(
        formattedPhone,
        `😔 *Pedido Cancelado*\n\nInfelizmente seu pedido #${orderCode} foi cancelado.\n\nSe tiver dúvidas, entre em contato conosco.`
      );
    }

    console.log('[handleCancelarPedido] Pedido cancelado:', orderCode);
  } catch (error) {
    console.error('[handleCancelarPedido] Erro:', error);
    await sendTextMessage(
      adminPhone,
      `❌ Erro ao cancelar pedido. Tente novamente.`
    );
  }
}

/**
 * Processa o comando de saiu para entrega (admin)
 */
async function handleSaiuEntrega(adminPhone: string, orderCode: string) {
  try {
    console.log('[handleSaiuEntrega] Marcando como saiu para entrega:', orderCode);

    // Busca o pedido pelo código curto
    const order = await getOrderByShortCode(orderCode);

    if (!order) {
      await sendTextMessage(
        adminPhone,
        `❌ Pedido #${orderCode} não encontrado.\n\nVerifique se o código está correto.`
      );
      return;
    }

    // Verifica se o pedido está no status correto
    if (order.status !== 'preparando') {
      if (order.status === 'saiu_entrega') {
        await sendTextMessage(
          adminPhone,
          `⚠️ Pedido #${orderCode} já está marcado como "saiu para entrega".`
        );
      } else if (order.status === 'entregue') {
        await sendTextMessage(
          adminPhone,
          `⚠️ Pedido #${orderCode} já foi entregue.`
        );
      } else if (order.status === 'cancelado') {
        await sendTextMessage(
          adminPhone,
          `⚠️ Pedido #${orderCode} está cancelado.`
        );
      } else {
        await sendTextMessage(
          adminPhone,
          `⚠️ Pedido #${orderCode} ainda não foi confirmado. Envie "Confirmar #${orderCode}" primeiro.`
        );
      }
      return;
    }

    // Busca dados do cliente
    const fullOrderData = await getOrderWithUser(order.id);

    // Atualiza o status do pedido para "saiu_entrega"
    const updatedOrder = await updateOrderStatus(order.id, 'saiu_entrega');

    if (!updatedOrder) {
      await sendTextMessage(adminPhone, `❌ Erro ao atualizar status do pedido.`);
      return;
    }

    // Notifica o admin
    await sendTextMessage(
      adminPhone,
      `🚴 Pedido #${orderCode} marcado como *SAIU PARA ENTREGA*!`
    );

    // Notifica o cliente
    if (fullOrderData?.userPhone) {
      const formattedPhone = fullOrderData.userPhone.startsWith('55')
        ? fullOrderData.userPhone
        : `55${fullOrderData.userPhone.replace(/\D/g, '')}`;

      const mensagemCliente = `🎉 *Oba! Seu pedido #${orderCode} está a caminho!*

🚴 Nosso entregador acabou de sair com sua encomenda deliciosa!

📍 Em breve você estará saboreando o melhor sorvete da região.

Agradecemos a preferência! 🍦💜`;

      await sendTextMessage(formattedPhone, mensagemCliente);
    }

    console.log('[handleSaiuEntrega] Pedido marcado como saiu para entrega:', orderCode);
  } catch (error) {
    console.error('[handleSaiuEntrega] Erro:', error);
    await sendTextMessage(
      adminPhone,
      `❌ Erro ao atualizar pedido. Tente novamente.`
    );
  }
}


/**
 * Processa o comando "editar produto"
 */
async function handleEditarProduto(phoneNumber: string) {
  try {
    console.log('[handleEditarProduto] Iniciando para:', phoneNumber);

    // Busca as categorias do banco de dados
    const categories = await getCategories();
    console.log('[handleEditarProduto] Categorias encontradas:', categories.length);

    if (categories.length === 0) {
      console.log('[handleEditarProduto] Nenhuma categoria encontrada');
      await sendTextMessage(
        phoneNumber,
        'Desculpe, não foi possível carregar as categorias no momento. Tente novamente mais tarde.'
      );
      return;
    }

    // Salva o estado da conversa para edição
    await upsertConversationState({
      phoneNumber,
      step: 'edit_awaiting_category',
      categoryId: '',
      productData: {
        availableCategories: categories.map((c, index) => ({
          index: index + 1,
          id: c.id,
          name: c.name,
        })),
      },
    });

    // Cria lista de categorias em texto
    const categoryList = categories
      .map((category, index) => `*${index + 1}.* ${category.name}`)
      .join('\n');

    const message = `✏️ *Editar Produto*\n\nDe qual categoria é o produto que você quer editar?\n\n${categoryList}\n\n_Responda com o número da categoria._\n\n💡 Envie *cancelar* a qualquer momento para cancelar.`;

    await sendTextMessage(phoneNumber, message);
  } catch (error) {
    console.error('[handleEditarProduto] Erro:', error);
    await sendTextMessage(
      phoneNumber,
      'Desculpe, ocorreu um erro ao processar seu comando. Tente novamente.'
    );
  }
}

/**
 * Processa a seleção de categoria para edição (mostra lista de produtos)
 */
async function handleEditCategorySelection(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  const categoryNumber = parseInt(messageText.trim(), 10);
  const availableCategories = state.productData?.availableCategories as Array<{
    index: number;
    id: string;
    name: string;
  }> | undefined;

  if (!availableCategories) {
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao processar categorias. Envie *editar produto* para recomeçar.'
    );
    await deleteConversationState(phoneNumber);
    return;
  }

  if (isNaN(categoryNumber) || categoryNumber < 1 || categoryNumber > availableCategories.length) {
    await sendTextMessage(
      phoneNumber,
      `❌ Opção inválida. Responda com um número de 1 a ${availableCategories.length}.`
    );
    return;
  }

  const selectedCategory = availableCategories.find((c) => c.index === categoryNumber);

  if (!selectedCategory) {
    await sendTextMessage(
      phoneNumber,
      '❌ Categoria não encontrada. Tente novamente.'
    );
    return;
  }

  // Busca os produtos dessa categoria
  const products = await getProductsByCategory(selectedCategory.id);

  if (products.length === 0) {
    await sendTextMessage(
      phoneNumber,
      `📦 Nenhum produto encontrado na categoria *${selectedCategory.name}*.\n\nEnvie *editar produto* para escolher outra categoria ou *cadastrar produto* para adicionar um novo.`
    );
    await deleteConversationState(phoneNumber);
    return;
  }

  // Salva os produtos disponíveis no estado
  await upsertConversationState({
    phoneNumber,
    step: 'edit_awaiting_product',
    categoryId: selectedCategory.id,
    productData: {
      availableProducts: products.map((p, index) => ({
        index: index + 1,
        id: p.id,
        name: p.name,
        price: Number(p.price),
      })),
    },
  });

  // Cria lista de produtos
  const productList = products
    .map((product, index) => `*${index + 1}.* ${product.name} - R$ ${Number(product.price).toFixed(2)}`)
    .join('\n');

  const message = `📦 *Produtos da categoria ${selectedCategory.name}:*\n\n${productList}\n\n_Responda com o número do produto que deseja editar._\n\n💡 Envie *cancelar* para cancelar.`;

  await sendTextMessage(phoneNumber, message);
}

/**
 * Processa a seleção de produto para edição (mostra opções de campos)
 */
async function handleEditProductSelection(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  const productNumber = parseInt(messageText.trim(), 10);
  const availableProducts = state.productData?.availableProducts as Array<{
    index: number;
    id: string;
    name: string;
    price: number;
  }> | undefined;

  if (!availableProducts) {
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao processar produtos. Envie *editar produto* para recomeçar.'
    );
    await deleteConversationState(phoneNumber);
    return;
  }

  if (isNaN(productNumber) || productNumber < 1 || productNumber > availableProducts.length) {
    await sendTextMessage(
      phoneNumber,
      `❌ Opção inválida. Responda com um número de 1 a ${availableProducts.length}.`
    );
    return;
  }

  const selectedProduct = availableProducts.find((p) => p.index === productNumber);

  if (!selectedProduct) {
    await sendTextMessage(
      phoneNumber,
      '❌ Produto não encontrado. Tente novamente.'
    );
    return;
  }

  // Salva o produto selecionado no estado
  await upsertConversationState({
    phoneNumber,
    step: 'edit_awaiting_field',
    categoryId: state.categoryId,
    productData: {
      editProductId: selectedProduct.id,
      editProductName: selectedProduct.name,
    },
  });

  const message = `✏️ *Editando: ${selectedProduct.name}*\n\nO que você deseja editar?\n\n*1.* Nome\n*2.* Descrição\n*3.* Preço\n*4.* Imagem\n\n_Responda com o número da opção._\n\n💡 Envie *cancelar* para cancelar.`;

  await sendTextMessage(phoneNumber, message);
}

/**
 * Processa a seleção de campo para edição
 */
async function handleEditFieldSelection(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state) return;

  const fieldNumber = parseInt(messageText.trim(), 10);

  if (isNaN(fieldNumber) || fieldNumber < 1 || fieldNumber > 4) {
    await sendTextMessage(
      phoneNumber,
      '❌ Opção inválida. Responda com um número de 1 a 4.'
    );
    return;
  }

  const productName = state.productData?.editProductName || 'Produto';
  let step: 'edit_awaiting_name' | 'edit_awaiting_description' | 'edit_awaiting_price' | 'edit_awaiting_image';
  let promptMessage = '';

  switch (fieldNumber) {
    case 1:
      step = 'edit_awaiting_name';
      promptMessage = `✏️ *Editando nome de: ${productName}*\n\nEnvie o *novo nome* do produto.`;
      break;
    case 2:
      step = 'edit_awaiting_description';
      promptMessage = `✏️ *Editando descrição de: ${productName}*\n\nEnvie a *nova descrição* do produto.`;
      break;
    case 3:
      step = 'edit_awaiting_price';
      promptMessage = `✏️ *Editando preço de: ${productName}*\n\nEnvie o *novo preço* do produto (exemplo: 15.90 ou 15,90).`;
      break;
    case 4:
      step = 'edit_awaiting_image';
      promptMessage = `✏️ *Editando imagem de: ${productName}*\n\nEnvie a *nova foto* do produto 📸`;
      break;
    default:
      return;
  }

  await upsertConversationState({
    phoneNumber,
    step,
    categoryId: state.categoryId,
    productData: state.productData,
  });

  await sendTextMessage(phoneNumber, promptMessage + '\n\n💡 Envie *cancelar* para cancelar.');
}

/**
 * Processa a edição do nome do produto
 */
async function handleEditProductName(
  phoneNumber: string,
  newName: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state || !state.productData?.editProductId) return;

  if (newName.trim().length < 3) {
    await sendTextMessage(
      phoneNumber,
      '❌ O nome deve ter pelo menos 3 caracteres. Tente novamente.'
    );
    return;
  }

  const updated = await updateProduct(state.productData.editProductId, {
    name: newName.trim(),
  });

  if (!updated) {
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao atualizar o nome. Tente novamente.'
    );
    return;
  }

  await deleteConversationState(phoneNumber);
  await sendTextMessage(
    phoneNumber,
    `✅ Nome atualizado com sucesso!\n\n*Novo nome:* ${newName.trim()}\n\nEnvie *editar produto* para continuar editando ou *cadastrar produto* para adicionar novos.`
  );
}

/**
 * Processa a edição da descrição do produto
 */
async function handleEditProductDescription(
  phoneNumber: string,
  newDescription: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state || !state.productData?.editProductId) return;

  if (newDescription.trim().length < 10) {
    await sendTextMessage(
      phoneNumber,
      '❌ A descrição deve ter pelo menos 10 caracteres. Tente novamente.'
    );
    return;
  }

  const updated = await updateProduct(state.productData.editProductId, {
    description: newDescription.trim(),
  });

  if (!updated) {
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao atualizar a descrição. Tente novamente.'
    );
    return;
  }

  await deleteConversationState(phoneNumber);
  await sendTextMessage(
    phoneNumber,
    `✅ Descrição atualizada com sucesso!\n\nEnvie *editar produto* para continuar editando ou *cadastrar produto* para adicionar novos.`
  );
}

/**
 * Processa a edição do preço do produto
 */
async function handleEditProductPrice(
  phoneNumber: string,
  priceText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state || !state.productData?.editProductId) return;

  const normalizedPrice = priceText.trim().replace(',', '.');
  const price = parseFloat(normalizedPrice);

  if (isNaN(price) || price <= 0) {
    await sendTextMessage(
      phoneNumber,
      '❌ Preço inválido. Envie um valor numérico positivo (exemplo: 15.90).'
    );
    return;
  }

  const updated = await updateProduct(state.productData.editProductId, {
    price,
  });

  if (!updated) {
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao atualizar o preço. Tente novamente.'
    );
    return;
  }

  await deleteConversationState(phoneNumber);
  await sendTextMessage(
    phoneNumber,
    `✅ Preço atualizado com sucesso!\n\n*Novo preço:* R$ ${price.toFixed(2)}\n\nEnvie *editar produto* para continuar editando ou *cadastrar produto* para adicionar novos.`
  );
}

/**
 * Processa a edição da imagem do produto (quando recebe texto - URL ou PULAR)
 */
async function handleEditProductImageText(
  phoneNumber: string,
  messageText: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state || !state.productData?.editProductId) return;

  const trimmedText = messageText.trim();

  // Verifica se é uma URL
  try {
    new URL(trimmedText);
    const updated = await updateProduct(state.productData.editProductId, {
      image: trimmedText,
    });

    if (!updated) {
      await sendTextMessage(
        phoneNumber,
        '❌ Erro ao atualizar a imagem. Tente novamente.'
      );
      return;
    }

    await deleteConversationState(phoneNumber);
    await sendTextMessage(
      phoneNumber,
      `✅ Imagem atualizada com sucesso!\n\nEnvie *editar produto* para continuar editando ou *cadastrar produto* para adicionar novos.`
    );
  } catch {
    await sendTextMessage(
      phoneNumber,
      '📸 Por favor, envie a *foto do produto* ou uma URL de imagem válida.'
    );
  }
}

/**
 * Processa upload de imagem para edição
 */
async function handleEditProductImageUpload(
  phoneNumber: string,
  messageId: string,
  state: Awaited<ReturnType<typeof getConversationState>>
) {
  if (!state || !state.productData?.editProductId) return;

  try {
    await sendTextMessage(phoneNumber, '⏳ Processando imagem...');

    const base64Data = await getMediaBase64(messageId);

    if (!base64Data) {
      await sendTextMessage(
        phoneNumber,
        '❌ Não foi possível processar a imagem. Por favor, envie novamente.'
      );
      return;
    }

    const imageUrl = await uploadImageFromBase64(base64Data);

    if (!imageUrl) {
      await sendTextMessage(
        phoneNumber,
        '❌ Erro ao salvar a imagem. Por favor, envie novamente.'
      );
      return;
    }

    const updated = await updateProduct(state.productData.editProductId, {
      image: imageUrl,
    });

    if (!updated) {
      await sendTextMessage(
        phoneNumber,
        '❌ Erro ao atualizar a imagem. Tente novamente.'
      );
      return;
    }

    await deleteConversationState(phoneNumber);
    await sendImageMessage(
      phoneNumber,
      imageUrl,
      `✅ Imagem atualizada com sucesso!\n\nEnvie *editar produto* para continuar editando ou *cadastrar produto* para adicionar novos.`
    );
  } catch (error) {
    console.error('[handleEditProductImageUpload] Erro:', error);
    await sendTextMessage(
      phoneNumber,
      '❌ Erro ao processar a imagem. Por favor, envie novamente.'
    );
  }
}

// Permite requisições GET para verificar se o webhook está ativo
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Webhook do WhatsApp está ativo'
  });
}
