import type { Coupon } from "@/types/coupon";

export function calculateDiscount(coupon: Coupon, orderTotal: number, shippingCost: number = 0): number {
  let discount = 0;

  if (coupon.discount_type === 'free_shipping') {
    discount = shippingCost;
  } else if (coupon.discount_type === 'percentage' && coupon.discount_value) {
    discount = (orderTotal * coupon.discount_value) / 100;
  } else if (coupon.discount_type === 'fixed' && coupon.discount_value) {
    discount = coupon.discount_value;
  }

  if (coupon.max_discount && coupon.discount_type !== 'free_shipping' && discount > coupon.max_discount) {
    discount = coupon.max_discount;
  }

  const maxDiscount = coupon.discount_type === 'free_shipping' ? shippingCost : orderTotal;
  if (discount > maxDiscount) {
    discount = maxDiscount;
  }

  return discount;
}
