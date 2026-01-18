import { supabase } from './client';
import { Coupon, UserCoupon, CouponFormData } from '@/types/coupon';

/**
 * Busca todos os cupons disponíveis para um usuário
 */
export async function getUserCoupons(userId: string): Promise<UserCoupon[]> {
  try {
    const { data, error } = await supabase
      .from('user_coupons')
      .select(`
        *,
        coupon:coupons(*)
      `)
      .eq('user_id', userId)
      .eq('is_used', false)
      .order('assigned_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Filtrar apenas cupons válidos e ativos
    const now = new Date().toISOString();
    const validCoupons = (data || []).filter(uc => {
      const coupon = uc.coupon;
      return coupon &&
             coupon.is_active &&
             coupon.valid_from <= now &&
             coupon.valid_until >= now;
    });

    return validCoupons;
  } catch (error) {
    console.error('Erro ao buscar cupons do usuário:', error);
    throw error;
  }
}

/**
 * Conta cupons disponíveis para um usuário (para badge)
 */
export async function getUserCouponsCount(userId: string): Promise<number> {
  try {
    const coupons = await getUserCoupons(userId);
    return coupons.length;
  } catch (error) {
    console.error('Erro ao contar cupons:', error);
    return 0;
  }
}

/**
 * Busca um cupom pelo código
 */
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar cupom:', error);
    throw error;
  }
}

/**
 * Valida se um cupom pode ser usado
 */
export function validateCoupon(
  coupon: Coupon, 
  orderTotal: number, 
  isFirstPurchase: boolean = false
): { valid: boolean; message: string } {
  const now = new Date();
  const validFrom = new Date(coupon.valid_from);
  const validUntil = new Date(coupon.valid_until);

  if (!coupon.is_active) {
    return { valid: false, message: 'Este cupom não está mais ativo' };
  }

  if (now < validFrom) {
    return { valid: false, message: 'Este cupom ainda não está disponível' };
  }

  if (now > validUntil) {
    return { valid: false, message: 'Este cupom expirou' };
  }

  if (coupon.first_purchase_only && !isFirstPurchase) {
    return { valid: false, message: 'Este cupom é válido apenas para primeira compra' };
  }

  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, message: 'Este cupom atingiu o limite de uso' };
  }

  if (coupon.min_order_value && orderTotal < coupon.min_order_value) {
    return {
      valid: false,
      message: `Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2).replace('.', ',')} para usar este cupom`
    };
  }

  return { valid: true, message: 'Cupom válido!' };
}

/**
 * Calcula o desconto de um cupom
 */
export function calculateDiscount(coupon: Coupon, orderTotal: number, shippingCost: number = 0): number {
  let discount = 0;

  if (coupon.discount_type === 'free_shipping') {
    // Para frete grátis, o desconto é o valor do frete
    discount = shippingCost;
  } else if (coupon.discount_type === 'percentage' && coupon.discount_value) {
    discount = (orderTotal * coupon.discount_value) / 100;
  } else if (coupon.discount_type === 'fixed' && coupon.discount_value) {
    discount = coupon.discount_value;
  }

  // Aplicar limite máximo de desconto se houver (não se aplica a frete grátis)
  if (coupon.max_discount && coupon.discount_type !== 'free_shipping' && discount > coupon.max_discount) {
    discount = coupon.max_discount;
  }

  // Não pode ser maior que o total do pedido (incluindo frete para frete grátis)
  const maxDiscount = coupon.discount_type === 'free_shipping' 
    ? shippingCost 
    : orderTotal;
  
  if (discount > maxDiscount) {
    discount = maxDiscount;
  }

  return discount;
}

/**
 * Marca um cupom como usado
 */
export async function useUserCoupon(userCouponId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_coupons')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', userCouponId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao usar cupom:', error);
    throw error;
  }
}

/**
 * Incrementa o contador de uso de um cupom
 */
export async function incrementCouponUsage(couponId: string): Promise<void> {
  try {
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('usage_count')
      .eq('id', couponId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const { error } = await supabase
      .from('coupons')
      .update({ usage_count: (coupon?.usage_count || 0) + 1 })
      .eq('id', couponId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao incrementar uso do cupom:', error);
    throw error;
  }
}

// ============ ADMIN FUNCTIONS ============

/**
 * Lista todos os cupons (admin)
 */
export async function getAllCoupons(): Promise<Coupon[]> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro detalhado ao buscar cupons:', error);
      // Se a tabela não existir, retornar array vazio em vez de erro
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Tabela coupons não encontrada. Execute as migrations primeiro.');
        return [];
      }
      throw error;
    }

    return data || [];
  } catch (error: any) {
    console.error('Erro ao listar cupons:', error);
    // Retornar array vazio em caso de erro para não quebrar a UI
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      return [];
    }
    throw error;
  }
}

/**
 * Cria um novo cupom (admin)
 */
export async function createCoupon(couponData: CouponFormData): Promise<Coupon> {
  try {
    // Se for frete grátis, garantir que discount_value seja null
    const dataToInsert = {
      ...couponData,
      code: couponData.code.toUpperCase(),
      usage_count: 0,
      discount_value: couponData.discount_type === 'free_shipping' 
        ? null 
        : couponData.discount_value,
    };

    const { data, error } = await supabase
      .from('coupons')
      .insert([dataToInsert])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    throw error;
  }
}

/**
 * Atualiza um cupom (admin)
 */
export async function updateCoupon(couponId: string, couponData: Partial<CouponFormData>): Promise<Coupon> {
  try {
    // Se for frete grátis, garantir que discount_value seja null
    const dataToUpdate: any = {
      ...couponData,
    };

    if (couponData.code) {
      dataToUpdate.code = couponData.code.toUpperCase();
    }

    if (couponData.discount_type === 'free_shipping') {
      dataToUpdate.discount_value = null;
    } else if (couponData.discount_value !== undefined) {
      dataToUpdate.discount_value = couponData.discount_value;
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(dataToUpdate)
      .eq('id', couponId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    throw error;
  }
}

/**
 * Deleta um cupom (admin)
 */
export async function deleteCoupon(couponId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', couponId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    throw error;
  }
}

/**
 * Atribui um cupom a um usuário (admin)
 */
export async function assignCouponToUser(couponId: string, userId: string): Promise<UserCoupon> {
  try {
    const { data, error } = await supabase
      .from('user_coupons')
      .insert([{
        coupon_id: couponId,
        user_id: userId,
        is_used: false,
        assigned_at: new Date().toISOString(),
      }])
      .select(`
        *,
        coupon:coupons(*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro ao atribuir cupom ao usuário:', error);
    throw error;
  }
}

/**
 * Atribui um cupom a todos os usuários (admin)
 */
export async function assignCouponToAllUsers(couponId: string): Promise<number> {
  try {
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      throw usersError;
    }

    if (!users || users.length === 0) {
      return 0;
    }

    // Criar registros de user_coupons para cada usuário
    const userCoupons = users.map(user => ({
      coupon_id: couponId,
      user_id: user.id,
      is_used: false,
      assigned_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('user_coupons')
      .insert(userCoupons);

    if (error) {
      throw error;
    }

    return users.length;
  } catch (error) {
    console.error('Erro ao atribuir cupom a todos os usuários:', error);
    throw error;
  }
}
