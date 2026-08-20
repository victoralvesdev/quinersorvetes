import { supabaseAdmin as supabase } from './server';
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
          .select('id, name, phone, email, created_at, updated_at')
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
 * Busca um usuário pelo email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
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

    // Atribuir automaticamente todos os cupons ativos ao novo usuário
    try {
      const now = new Date().toISOString();
      const { data: activeCoupons } = await supabase
        .from('coupons')
        .select('id')
        .eq('is_active', true)
        .lte('valid_from', now)
        .gte('valid_until', now);

      if (activeCoupons && activeCoupons.length > 0) {
        const userCoupons = activeCoupons.map((c) => ({
          coupon_id: c.id,
          user_id: data.id,
          is_used: false,
          assigned_at: now,
        }));
        await supabase.from('user_coupons').insert(userCoupons);
      }
    } catch {
      // Não bloqueia o cadastro se falhar a atribuição de cupons
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
export async function updateUser(userId: string, userData: Partial<UserFormData> & { cpf?: string }): Promise<User> {
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

export type RegisterResult =
  | { status: 'created' | 'existing'; user: User }
  | { status: 'phone_conflict' };

/**
 * Registra um usuário por email: busca por email primeiro (idempotente para
 * quem já se cadastrou), e só cria uma linha nova quando nem o email nem o
 * telefone já existem. Nunca sobrescreve/renomeia a conta de outra pessoa
 * quando o telefone colide - sinaliza o conflito para o chamador decidir.
 */
export async function registerUserByEmail(data: UserFormData): Promise<RegisterResult> {
  try {
    const existingByEmail = await getUserByEmail(data.email);
    if (existingByEmail) {
      return { status: 'existing', user: existingByEmail };
    }

    const existingByPhone = await getUserByPhone(data.phone);
    if (existingByPhone) {
      // Telefone já pertence a outra conta (ou a uma conta legada sem email)
      // - nunca renomeia/sobrescreve silenciosamente a partir de um cadastro
      // não verificado.
      return { status: 'phone_conflict' };
    }

    const user = await createUser(data);
    return { status: 'created', user };
  } catch (error) {
    console.error('Erro ao registrar usuário por email:', error);
    throw error;
  }
}

/**
 * Busca todos os usuários
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
}

