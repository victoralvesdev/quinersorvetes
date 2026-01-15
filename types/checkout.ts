import { AddressFormData } from './address';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'pix' | 'cash_on_delivery';

export interface CheckoutData {
  addressId?: string;
  address?: AddressFormData;
  paymentMethod: PaymentMethod;
  isPaid?: boolean;
}

