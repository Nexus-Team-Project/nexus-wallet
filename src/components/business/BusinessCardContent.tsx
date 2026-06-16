import { useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { mockBranches } from '../../mock/data/branches.mock';
import { mockVouchers } from '../../mock/data/vouchers.mock';
import { mockReviews } from '../../mock/data/reviews.mock';
import type { Business } from '../../types/search.types';
import type { Voucher } from '../../types/voucher.types';
import {
  StoriesRow,
  OffersSlider,
  ProductsSection,
  ServicesSection,
  BuyInStoreSection,
  ReviewsSection,
  SimilarBusinesses,
} from './BusinessContent';

interface BusinessCardContentProps {
  business: Business;
  /** Optional store-action buttons rendered just under the offers slider.
   *  Only the business page passes these; the search-sheet reuse omits them. */
  storeActions?: ReactNode;
}

/**
 * The business-page "card" content, from the stories row downward. Extracted so
 * the exact same composition can be reused inside the store-scoped search sheet
 * (AiChatPage) and on the business page itself — single source of truth, so the
 * two never drift apart.
 */
export default function BusinessCardContent({ business, storeActions }: BusinessCardContentProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const branches = useMemo(
    () => mockBranches.filter((b) => b.businessId === business.id),
    [business.id],
  );
  const vouchers = useMemo(
    () => mockVouchers.filter((v) => v.merchantName === business.name),
    [business.name],
  );
  const reviews = useMemo(
    () => mockReviews.filter((r) => r.businessId === business.id),
    [business.id],
  );

  return (
    <>
      {/* Stories row */}
      <StoriesRow business={business} />

      {/* Offers slider */}
      <div id="offers-section">
        <OffersSlider
          vouchers={vouchers}
          business={business}
          onSelect={(v: Voucher) => navigate(`/${language}/business/${business.id}/voucher/${v.id}`)}
        />
      </div>

      {/* Store actions — sit directly under the offers (benefits) rows. */}
      {storeActions}

      {/* Products — only if business has products */}
      {business.products && business.products.length > 0 && (
        <ProductsSection products={business.products} business={business} />
      )}

      {/* Services — only if business has services */}
      {business.services && business.services.length > 0 && (
        <ServicesSection services={business.services} business={business} />
      )}

      {/* Buy in store — map */}
      <BuyInStoreSection branches={branches} business={business} />

      {/* Reviews */}
      <ReviewsSection reviews={reviews} business={business} />

      {/* Similar businesses */}
      <SimilarBusinesses
        business={business}
        allBusinesses={mockBusinesses}
        onSelect={(b) => navigate(`/${language}/business/${b.id}`)}
      />

      {/* Bottom padding */}
      <div className="h-24" />
    </>
  );
}
