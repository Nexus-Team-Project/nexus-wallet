/**
 * StoreRow — one business row in the store list: a brand logo circle, the
 * merchant name, and a green CASHBACK tag (same emerald cashback treatment as
 * the wallet "קאשבק" section). Shared by StoreList and the store page's
 * Nexus-picks recommendations view.
 */
import { Crown } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Voucher } from '../../types/voucher.types';

interface StoreRowProps {
  voucher: Voucher;
  onSelect: (voucher: Voucher) => void;
}

// Cashback %, derived stably per merchant (vouchers carry no cashback field),
// matching the wallet "קאשבק" section's 5–30% steps.
function cashbackPct(key: string): number {
  let sum = 0;
  for (let i = 0; i < key.length; i++) sum += key.charCodeAt(i);
  const steps = [5, 8, 10, 12, 15, 20, 25, 30];
  return steps[sum % steps.length];
}

export default function StoreRow({ voucher: v, onSelect }: StoreRowProps) {
  const { t, language } = useLanguage();
  const isHe = language === 'he';
  const unavailable = !!v.comingSoon || !v.inStock;
  const pct = cashbackPct(v.merchantName || v.id);

  return (
    <button
      onClick={() => !unavailable && onSelect(v)}
      disabled={unavailable}
      className="flex items-center gap-4 w-full text-start active:opacity-70 transition-opacity disabled:opacity-50"
    >
      {/* Brand logo circle */}
      <div
        className="relative w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden border border-border"
        style={{ backgroundColor: v.brandColor || '#FFFFFF' }}
      >
        {v.brandLogo ? (
          <img
            src={v.brandLogo}
            alt={v.merchantName}
            className="w-[72%] h-[72%] object-contain"
          />
        ) : (
          <span className="text-2xl">{v.merchantLogo}</span>
        )}
        {v.isNew && (
          <span className="absolute -top-0.5 -end-0.5 bg-primary text-[9px] font-bold text-white w-4 h-4 rounded-full flex items-center justify-center border border-white">
            ★
          </span>
        )}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <h4 className="font-bold text-text-primary truncate">{v.merchantName}</h4>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Cashback at both tiers (גישה ג׳) — regular chip + bold Premium 2× chip */}
          <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-bold whitespace-nowrap">
            {isHe ? 'רגיל' : 'Regular'} {pct}%
          </span>
          <span className="inline-flex items-center gap-0.5 rounded-md bg-primary text-white px-2 py-0.5 text-xs font-bold whitespace-nowrap">
            <Crown size={11} strokeWidth={2.5} className="shrink-0" />
            Premium {pct * 2}%
          </span>
          {v.isOnline && (
            <span className="text-text-secondary text-sm">{t.store.online}</span>
          )}
          {v.comingSoon && (
            <span className="text-text-secondary text-sm">{t.store.comingSoon}</span>
          )}
        </div>
      </div>
    </button>
  );
}
