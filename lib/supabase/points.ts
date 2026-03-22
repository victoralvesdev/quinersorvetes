import { supabase } from './client';
import { PointsTransaction } from '@/types/points';

export async function getPointsBalance(userPhone: string): Promise<number> {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('amount')
    .eq('user_phone', userPhone);

  if (error) {
    console.error('Erro ao buscar saldo de pontos:', error);
    return 0;
  }

  return (data || []).reduce((sum: number, row: { amount: number }) => sum + row.amount, 0);
}

export async function getPointsHistory(userPhone: string): Promise<PointsTransaction[]> {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('*')
    .eq('user_phone', userPhone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar histórico de pontos:', error);
    return [];
  }

  return (data || []) as PointsTransaction[];
}

export async function awardPointsForOrder(
  userPhone: string,
  orderId: string,
  orderTotal: number,
  pointsRatio: number
): Promise<boolean> {
  // pointsRatio: a cada R$X ganha 1 ponto
  const pointsEarned = Math.floor(orderTotal / pointsRatio);
  if (pointsEarned <= 0) return true;

  const { error } = await supabase
    .from('points_transactions')
    .insert({
      user_phone: userPhone,
      amount: pointsEarned,
      type: 'earned',
      order_id: orderId,
      description: `Pontos ganhos no pedido #${orderId.slice(0, 8).toUpperCase()}`,
    });

  if (error) {
    // Unique index violation means points already awarded for this order — safe to ignore
    if (error.code === '23505') {
      console.log('[points] Pontos já concedidos para este pedido, ignorando.');
      return true;
    }
    console.error('Erro ao conceder pontos:', error);
    return false;
  }

  return true;
}

export async function redeemPoints(
  userPhone: string,
  cost: number,
  description: string
): Promise<boolean> {
  const balance = await getPointsBalance(userPhone);
  if (balance < cost) return false;

  const { error } = await supabase
    .from('points_transactions')
    .insert({
      user_phone: userPhone,
      amount: -cost,
      type: 'redeemed',
      description,
    });

  if (error) {
    console.error('Erro ao resgatar pontos:', error);
    return false;
  }

  return true;
}

export async function adminAdjustPoints(
  userPhone: string,
  amount: number,
  description: string
): Promise<boolean> {
  const { error } = await supabase
    .from('points_transactions')
    .insert({
      user_phone: userPhone,
      amount,
      type: 'adjusted',
      description,
    });

  if (error) {
    console.error('Erro ao ajustar pontos:', error);
    return false;
  }

  return true;
}

export interface UserPointsSummary {
  user_phone: string;
  balance: number;
}

export async function getAllUsersPointsSummary(): Promise<UserPointsSummary[]> {
  const { data, error } = await supabase
    .from('points_transactions')
    .select('user_phone, amount');

  if (error) {
    console.error('Erro ao buscar resumo de pontos:', error);
    return [];
  }

  const map = new Map<string, number>();
  for (const row of data || []) {
    map.set(row.user_phone, (map.get(row.user_phone) || 0) + row.amount);
  }

  return Array.from(map.entries())
    .map(([user_phone, balance]) => ({ user_phone, balance }))
    .sort((a, b) => b.balance - a.balance);
}
