/**
 * Coupon System Constants
 * Single source of truth for all coupon-related configuration.
 */

export const WELCOME_COUPON = {
  CODE: 'WELCOME10',
  TITLE: 'Welcome 10% Off',
  VALUE_TYPE: 'PERCENTAGE' as const,
  VALUE: 10, // 10%
  DESCRIPTION: 'First-order welcome discount for new members.',
} as const;

/** Discount value type union */
export type DiscountValueType = 'PERCENTAGE' | 'FIXED_AMOUNT';

/** Discount object passed to Shopify createCheckout */
export interface AppliedDiscount {
  title: string;
  valueType: DiscountValueType;
  value: number;
}
