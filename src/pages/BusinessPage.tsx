import { useMemo, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { mockVouchers } from '../mock/data/vouchers.mock';
import { useLanguage } from '../i18n/LanguageContext';
import BusinessHero from '../components/business/BusinessHero';
import BusinessCardContent from '../components/business/BusinessCardContent';
import { StickyCTA } from '../components/business/BusinessContent';
import CouponCodesSheet from '../components/business/CouponCodesSheet';
import type { CouponCode } from '../types/search.types';

export default function BusinessPage() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [couponsOpen, setCouponsOpen] = useState(false);

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

  const couponCodes = business.couponCodes ?? [];
  const hasCoupons = couponCodes.length > 0;

  // Copy the code, then open the embedded supplier site so it's ready to paste.
  const handleUseCode = async (c: CouponCode) => {
    try {
      await navigator.clipboard.writeText(c.code);
    } catch {
      /* clipboard may be unavailable — ignore */
    }
    setCouponsOpen(false);
    navigate(`/${language}/business/${business.id}/site?code=${encodeURIComponent(c.code)}`);
  };

  // TODO: wire to the "deal on your terms" flow once it exists.
  const handleCreateDeal = () => {
    console.log('Create a deal on your terms', business.id);
  };

  // Gray pills (checkout-style), stacked one above the other — rendered just
  // under the offers (benefits) rows inside the business content.
  const storeActions = (
    <div className="px-5 pt-2 pb-1 flex flex-col gap-3">
      <button
        onClick={handleCreateDeal}
        className="bg-surface rounded-2xl py-3.5 px-4 text-center text-sm font-semibold text-text-primary active:opacity-70 transition-opacity"
      >
        {isHe ? 'צור עסקה בתנאים שלך' : 'Make a deal on your terms'}
      </button>
      {hasCoupons && (
        <button
          onClick={() => setCouponsOpen(true)}
          className="bg-surface rounded-2xl py-3.5 px-4 text-center text-sm font-semibold text-text-primary active:opacity-70 transition-opacity"
        >
          {isHe ? 'קודי קופון' : 'Coupon codes'}
        </button>
      )}
    </div>
  );

  return (
      <div className="bg-white animate-fade-in">
        <BusinessHero business={business} />

        {/* Main content area with rounded top — like Tabby/Bloomingdale's mockup */}
        <div
          className="relative z-20 bg-white"
          style={{ marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30 }}
        >
          <BusinessCardContent business={business} storeActions={storeActions} />
        </div>

        {/* Sticky CTA */}
        <StickyCTA business={business} firstVoucherId={vouchers[0]?.id} />

        {/* Coupon codes sheet — copy a code and jump to the embedded supplier site */}
        <CouponCodesSheet
          isOpen={couponsOpen}
          onClose={() => setCouponsOpen(false)}
          codes={couponCodes}
          onUseCode={handleUseCode}
        />
      </div>
  );
}
