import { supabase } from './client';
import { User, UserFormData } from '@/types/user';

/**
 * Busca um usuário pelo telefone
 */
export async function getUserByPhone(phone: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) {
      // Se for erro de não encontrado, retorna null
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return null;
      }
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }

    return data;
  } catch (error: any) {
    // Trata erro 406 (Not Acceptable) - pode ser problema de headers
    if (error?.status === 406 || error?.code === '406') {
      console.warn('Erro 406 ao buscar usuário, tentando sem headers especiais');
      // Tenta novamente com uma requisição mais simples
      try {
        const { data, error: retryError } = await supabase
          .from('users')
          .select('id, name, phone, created_at, updated_at')
          .eq('phone', phone)
          .maybeSingle();
        
        if (retryError && retryError.code !== 'PGRST116') {
          throw retryError;
        }
        return data;
      } catch (retryErr) {
        console.error('Erro ao buscar usuário (retry):', retryErr);
        return null;
      }
    }
    console.error('Erro ao buscar usuário:', error);
    throw error;
  }
}

/**
 * Cria um novo usuário
 */
export async function createUser(userData: UserFormData): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

/**
 * Atualiza um usuário existente
 */
export async function updateUser(userId: string, userData: Partial<UserFormData>): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

/**
 * Busca ou cria um usuário (login ou cadastro)
 */
export async function findOrCreateUser(userData: UserFormData): Promise<User> {
  try {
    // Tenta buscar usuário existente
    const existingUser = await getUserByPhone(userData.phone);
    
    if (existingUser) {
      // Se existe, atualiza o nome caso tenha mudado
      if (existingUser.name !== userData.name) {
        return await updateUser(existingUser.id, { name: userData.name });
      }
      return existingUser;
    }

    // Se não existe, cria novo usuário
    return await createUser(userData);
  } catch (error) {
    console.error('Erro ao buscar ou criar usuário:', error);
    throw error;
  }
}

