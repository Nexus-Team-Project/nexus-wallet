import { useMemo } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { mockBranches } from '../mock/data/branches.mock';
import { mockVouchers } from '../mock/data/vouchers.mock';
import { mockReviews } from '../mock/data/reviews.mock';
import { useLanguage } from '../i18n/LanguageContext';
import BusinessHero from '../components/business/BusinessHero';
import BusinessActionBar from '../components/business/BusinessActionBar';
import {
  StoriesRow,
  OffersSlider,
  ProductsSection,
  ServicesSection,
  BuyInStoreSection,
  ReviewsSection,
  SimilarBusinesses,
  StickyCTA,
} from '../components/business/BusinessContent';
import type { Voucher } from '../types/voucher.types';

export default function BusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );

  const branches = useMemo(
    () => mockBranches.filter((b) => b.businessId === businessId),
    [businessId],
  );

  const vouchers = useMemo(
    () => mockVouchers.filter((v) => v.merchantName === business?.name),
    [business],
  );

  const reviews = useMemo(
    () => mockReviews.filter((r) => r.businessId === businessId),
    [businessId],
  );

  if (!business) {
    return <Navigate to=".." replace />;
  }

  return (
      <div className="bg-white animate-fade-in">
        <BusinessHero business={business} />

        {/* Main content area with rounded top — like Tabby/Bloomingdale's mockup */}
        <div
          className="relative z-20 bg-white"
          style={{ marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-300" />
          </div>

          {/* Action bar */}
          <div
            className="sticky top-0 z-30 bg-white"
            style={{ borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
          >
            <BusinessActionBar business={business} />
          </div>

          {/* Stories row */}
          <StoriesRow business={business} />

          {/* Offers slider */}
          <div id="offers-section">
            <OffersSlider
              vouchers={vouchers}
              business={business}
              onSelect={(v: Voucher) => navigate(`/${language}/business/${businessId}/voucher/${v.id}`)}
            />
          </div>

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

          {/* Bottom padding for sticky CTA */}
          <div className="h-24" />
        </div>

        {/* Sticky CTA */}
        <StickyCTA business={business} firstVoucherId={vouchers[0]?.id} />
      </div>
  );
}
