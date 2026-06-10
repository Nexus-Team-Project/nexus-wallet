import { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { mockVouchers } from '../mock/data/vouchers.mock';
import BusinessHero from '../components/business/BusinessHero';
import BusinessCardContent from '../components/business/BusinessCardContent';
import { StickyCTA } from '../components/business/BusinessContent';

export default function BusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );

  const vouchers = useMemo(
    () => mockVouchers.filter((v) => v.merchantName === business?.name),
    [business],
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
          <BusinessCardContent business={business} />
        </div>

        {/* Sticky CTA */}
        <StickyCTA business={business} firstVoucherId={vouchers[0]?.id} />
      </div>
  );
}
