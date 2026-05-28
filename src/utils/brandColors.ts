// Background colour the brand's logo lives on. Picked per-brand so the
// transparent-PNG logos sit on the colour the brand designed for —
// McDonald's reads on white, Castro on black, Isrotel on its corporate
// navy, etc. Falls back to `#FFFFFF` for unknown ids.
//
// Shared between the home-page BrandSlider and the category page's
// FeaturedStoresCarousel so both surfaces present brands identically.
export const brandBgColors: Record<string, string> = {
  biz_001: '#FFFFFF', // McDonald's
  biz_002: '#000000', // Castro
  biz_003: '#FFFFFF', // Cinema City
  biz_004: '#000000', // Aroma
  biz_005: '#274968', // Isrotel — corporate navy
  biz_006: '#FFFFFF', // Superpharm
  biz_007: '#3478BE', // KSP — corporate blue
  biz_008: '#C44530', // Holmes Place — red
  biz_009: '#FFFFFF', // Shufersal
  biz_010: '#FFFFFF', // H&M
};

// KSP ships a logo where the brand mark already extends to the edges —
// it gets `object-cover` at 100% instead of the usual 85% contain. Keep
// this list narrow; anything else looks better with breathing room.
export const FULL_BLEED_LOGOS = new Set<string>(['biz_007']);
