/**
 * Payment methods on file for the current user.
 *
 * Currently a mock — returns a default Nexus card (the project's own
 * card) first, followed by any external bank cards. The Nexus card
 * always seeds at position 0 so it acts as the default, but the user
 * can drag others above it in the manage screen.
 *
 * Replace with a real query (React Query + paymentsApi) when the
 * backend is in place.
 */

export interface PaymentMethod {
  id: string;
  /** Display label — Hebrew + English variants. */
  label: string;
  labelHe: string;
  /** Last 4 digits — used in the label for external cards. Optional for
   *  wallets like Google Pay where the underlying card isn't surfaced. */
  last4: string;
  brand: 'visa' | 'mastercard' | 'maestro' | 'nexus' | 'googlepay' | 'unknown';
}

const MOCK_CARDS: PaymentMethod[] = [
  {
    id: 'pm_nexus',
    // Brand-prefixed label so the special Nexus card stays distinct from
    // generic external cards in the list while still showing its number.
    label: 'Nexus 1900',
    labelHe: 'נקסוס 1900',
    last4: '1900',
    brand: 'nexus',
  },
  {
    id: 'pm_001',
    label: 'Card 7526',
    labelHe: 'כרטיס 7526',
    last4: '7526',
    brand: 'mastercard',
  },
  {
    id: 'pm_gpay',
    // Wallet-level integration — no card-level last4 surfaced.
    label: 'Google Pay',
    labelHe: 'Google Pay',
    last4: '',
    brand: 'googlepay',
  },
];

export function usePaymentMethods(): {
  data: PaymentMethod[];
  hasAny: boolean;
} {
  return {
    data: MOCK_CARDS,
    hasAny: MOCK_CARDS.length > 0,
  };
}
