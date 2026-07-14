/**
 * StoreFeaturedRow — the featured strip at the top of the store browse page.
 *
 * Uses the same StoreTile "brand card" as the home "Our Brands" slider: a
 * portrait image card with the brand logo cut-out and centered over the image
 * and a faded foot. The foot shows the merchant name + discount line instead
 * of a rating. Tapping a card opens the same VoucherDetail sheet the list rows
 * use.
 */
import { Crown } from 'lucide-react';
import StoreTile from '../home/StoreTile';
import type { Voucher } from '../../types/voucher.types';

interface StoreFeaturedRowProps {
  vouchers: Voucher[];
  onSelect: (voucher: Voucher) => void;
}

export default function StoreFeaturedRow({ vouchers, onSelect }: StoreFeaturedRowProps) {
  if (!vouchers.length) return null;

  return (
    <section className="mt-1 mb-1">
      <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 pb-1 items-center">
        {vouchers.map((v) => (
          <StoreTile
            key={v.id}
            image={v.imageUrl}
            logoUrl={v.brandLogo}
            bg={v.brandColor}
            onClick={() => onSelect(v)}
          >
            <p className="text-[14px] font-bold text-text-primary leading-tight truncate">
              {v.merchantName}
            </p>
            {/* Cashback shown at both tiers (גישה ג׳): green = regular tier,
                crowned purple = Premium at 2×. Labels dropped. */}
            <div className="mt-1 flex flex-wrap items-center gap-1">
              <span dir="ltr" className="rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5">
                {v.discountPercent}%-{v.discountPercent + 5}%
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-primary text-white text-[10px] font-medium px-2 py-0.5">
                <Crown size={10} strokeWidth={2} className="shrink-0" />
                {v.discountPercent * 2}%
              </span>
            </div>
          </StoreTile>
        ))}
      </div>
    </section>
  );
}
