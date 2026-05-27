/**
 * Shared types for the Offers map (MapLibre GL).
 * The map is intentionally decoupled from the Voucher domain — it just
 * receives a flat array of pins, so it can be reused for businesses,
 * branches, or any other geo-tagged entity later on.
 */

export type OfferCategory =
  | 'food'
  | 'retail'
  | 'wellness'
  | 'entertainment'
  | 'services';

export interface OfferPin {
  id: string;
  /** Hebrew or English display name, shown in the popup */
  name: string;
  category: OfferCategory;
  lng: number;
  lat: number;
  tenantId: string;
  /** Optional brand logo URL — when present the map marker renders as a
   *  simple circle with the logo instead of the category-tinted teardrop. */
  brandLogo?: string;
  /** Optional brand color — used as the circle's background behind the
   *  logo (or as a fallback fill when no logo is provided). */
  brandColor?: string;
}

/** Map viewport — center + zoom. Direct value-type, no MapLibre import here. */
export interface MapViewport {
  lng: number;
  lat: number;
  zoom: number;
}
