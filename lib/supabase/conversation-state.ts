import { supabase } from './client';
import { ConversationState } from '@/types/whatsapp';

/**
 * Busca o estado da conversa de um usuário pelo número de telefone
 */
export async function getConversationState(
  phoneNumber: string
): Promise<ConversationState | null> {
  const { data, error } = await supabase
    .from('whatsapp_conversation_states')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Nenhum registro encontrado
      return null;
    }
    console.error('Erro ao buscar estado da conversa:', error);
    return null;
  }

  return {
    phoneNumber: data.phone_number,
    step: data.step as ConversationState['step'],
    categoryId: data.category_id,
    productData: data.product_data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Cria ou atualiza o estado da conversa de um usuário
 */
export async function upsertConversationState(
  state: Omit<ConversationState, 'createdAt' | 'updatedAt'>
): Promise<ConversationState | null> {
  // Se categoryId for string vazia, passa null para o banco (UUID não aceita string vazia)
  const categoryId = state.categoryId && state.categoryId.trim() !== '' ? state.categoryId : null;

  const { data, error } = await supabase
    .from('whatsapp_conversation_states')
    .upsert(
      {
        phone_number: state.phoneNumber,
        step: state.step,
        category_id: categoryId,
        product_data: state.productData,
      },
      {
        onConflict: 'phone_number',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar estado da conversa:', error);
    return null;
  }

  return {
    phoneNumber: data.phone_number,
    step: data.step as ConversationState['step'],
    categoryId: data.category_id,
    productData: data.product_data,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

/**
 * Deleta o estado da conversa de um usuário
 */
export async function deleteConversationState(
  phoneNumber: string
): Promise<boolean> {
  const { error } = await supabase
    .from('whatsapp_conversation_states')
    .delete()
    .eq('phone_number', phoneNumber);

  if (error) {
    console.error('Erro ao deletar estado da conversa:', error);
    return false;
  }

  return true;
}

/**
 * Atualiza apenas o step da conversa
 */
export async function updateConversationStep(
  phoneNumber: string,
  step: ConversationState['step']
): Promise<boolean> {
  const { error } = await supabase
    .from('whatsapp_conversation_states')
    .update({ step })
    .eq('phone_number', phoneNumber);

  if (error) {
    console.error('Erro ao atualizar step da conversa:', error);
    return false;
  }

  return true;
}

/**
 * Atualiza os dados do produto em construção
 */
export async function updateProductData(
  phoneNumber: string,
  productData: ConversationState['productData']
): Promise<boolean> {
  const { error } = await supabase
    .from('whatsapp_conversation_states')
    .update({ product_data: productData })
    .eq('phone_number', phoneNumber);

  if (error) {
    console.error('Erro ao atualizar dados do produto:', error);
    return false;
  }

  return true;
}
