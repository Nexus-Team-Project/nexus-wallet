/**
 * Digital gift-card designs — shared between the gift-details page (the picker)
 * and the checkout (the chosen-card thumbnail). Each is a gradient theme built
 * from the app's accent palette with a 3D illustration sitting on top.
 */
export interface GiftCard {
  id: string;
  label: string;
  labelHe: string;
  gradient: string;
  emoji: string;
  /** Hero illustration shown on the card (public/gift-cards). */
  image: string;
  /** Text colour that sits well over the gradient. */
  ink: string;
  /** Tenant-branded card — its image is the tenant logo, shown big inside a
   *  white plate so any logo colour stays legible. */
  tenant?: boolean;
}

export const GIFT_CARDS: GiftCard[] = [
  { id: 'thanks',      label: 'Thank you',   labelHe: 'תודה',      gradient: 'linear-gradient(135deg, #7dd3a8 0%, #00d4ff 100%)', emoji: '🙏', image: '/gift-cards/thanks.png',      ink: '#0a2540' },
  { id: 'love',        label: 'With love',   labelHe: 'באהבה',     gradient: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 100%)', emoji: '❤️', image: '/gift-cards/love.png',        ink: '#ffffff' },
  { id: 'celebration', label: 'Celebration', labelHe: 'חגיגה',    gradient: 'linear-gradient(135deg, #635bff 0%, #9c88ff 100%)', emoji: '🎉', image: '/gift-cards/celebration.png', ink: '#ffffff' },
  { id: 'birthday',    label: 'Birthday',    labelHe: 'יום הולדת', gradient: 'linear-gradient(135deg, #ff91b8 0%, #ffb74d 100%)', emoji: '🎂', image: '/gift-cards/birthday.png',    ink: '#0a2540' },
  { id: 'mazaltov',    label: 'Mazal tov',   labelHe: 'מזל טוב',   gradient: 'linear-gradient(135deg, #0a2540 0%, #635bff 100%)', emoji: '✨', image: '/gift-cards/mazaltov.png',    ink: '#ffffff' },
];

/**
 * Resolve the visual for a saved gift's `cardId`. The tenant card is dynamic
 * (its image is the tenant logo), so it's passed in rather than stored here.
 */
export function resolveGiftCard(
  cardId: string,
  tenant?: { logo?: string; primaryColor?: string } | null,
): GiftCard {
  if (cardId === 'tenant' && tenant?.logo) {
    return {
      id: 'tenant',
      label: 'Brand',
      labelHe: 'מותג',
      gradient: `linear-gradient(150deg, ${tenant.primaryColor ?? '#0a2540'} 0%, rgba(0,0,0,0.45) 150%)`,
      emoji: '🏷️',
      image: tenant.logo,
      ink: '#ffffff',
      tenant: true,
    };
  }
  return GIFT_CARDS.find((c) => c.id === cardId) ?? GIFT_CARDS[0];
}
