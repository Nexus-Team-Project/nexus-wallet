import { mockOffers } from '../data/offers.mock';
import type { Offer } from '../../types/offer.types';

export async function mockGetOffers(): Promise<Offer[]> {
  return [...mockOffers];
}

export async function mockGetActiveOffers(): Promise<Offer[]> {
  return mockOffers.filter(o => !o.claimed && new Date(o.validUntil) > new Date());
}

export async function mockClaimOffer(offerId: string): Promise<Offer> {
  const offer = mockOffers.find(o => o.id === offerId);
  if (!offer) throw new Error('Offer not found');
  return { ...offer, claimed: true };
}
