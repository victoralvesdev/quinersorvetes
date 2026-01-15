import { supabase } from './client';
import { Address, AddressFormData } from '@/types/address';

/**
 * Busca todos os endereços de um usuário
 */
export async function getUserAddresses(userId: string): Promise<Address[]> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    throw error;
  }
}

/**
 * Busca o endereço padrão de um usuário
 */
export async function getUserDefaultAddress(userId: string): Promise<Address | null> {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar endereço padrão:', error);
    throw error;
  }
}

/**
 * Cria um novo endereço
 */
export async function createAddress(userId: string, addressData: AddressFormData): Promise<Address> {
  try {
    // Se este endereço for marcado como padrão, remove o padrão dos outros
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('addresses')
      .insert([{
        ...addressData,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    throw error;
  }
}

/**
 * Atualiza um endereço existente
 */
export async function updateAddress(addressId: string, userId: string, addressData: Partial<AddressFormData>): Promise<Address> {
  try {
    // Se este endereço for marcado como padrão, remove o padrão dos outros
    if (addressData.is_default) {
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', addressId);
    }

    const { data, error } = await supabase
      .from('addresses')
      .update(addressData)
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    throw error;
  }
}

/**
 * Define um endereço como padrão
 */
export async function setDefaultAddress(addressId: string, userId: string): Promise<void> {
  try {
    // Remove o padrão de todos os endereços do usuário
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Define o novo endereço como padrão
    const { error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao definir endereço padrão:', error);
    throw error;
  }
}

/**
 * Deleta um endereço
 */
export async function deleteAddress(addressId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao deletar endereço:', error);
    throw error;
  }
}

