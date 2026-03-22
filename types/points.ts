export interface PointsTransaction {
  id: string;
  user_phone: string;
  amount: number;
  type: 'earned' | 'redeemed' | 'adjusted';
  order_id?: string;
  description?: string;
  created_at: string;
}
