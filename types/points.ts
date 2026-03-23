export interface PointsTransaction {
  id: string;
  user_phone: string;
  amount: number;
  type: 'earned' | 'redeemed' | 'adjusted';
  order_id?: string;
  description?: string;
  created_at: string;
}

export interface ProductPointsReward {
  id: string;
  product_id: string;
  points_required: number;
  is_active: boolean;
  created_at: string;
  // joined from products
  product_name?: string;
  product_image?: string;
  product_price?: number;
}
