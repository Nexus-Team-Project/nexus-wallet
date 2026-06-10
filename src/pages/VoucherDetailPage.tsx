import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useMyVouchers } from '../hooks/useMyVouchers';
import { formatDate } from '../utils/formatDate';
import PayCodesPanel from '../components/wallet/PayCodesPanel';
import { voucherStacks } from '../components/wallet/VoucherCard';
import WalletCardActions from '../components/wallet/WalletCardActions';

/** Perceived-luminance check so we pick readable ink on the brand colour. */
function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '');
  if (c.length < 6) return true;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

/**
 * Voucher-detail page — same layout as the card-detail page (the voucher
 * sits large at the top of a white surface with its details + actions
 * below), keeping the voucher's own actions (copy, receipt, terms, status).
 */
export default function VoucherDetailPage() {
  const { lang = 'he', voucherId } = useParams();
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const locale = language === 'he' ? 'he-IL' : 'en-IL';
  const { data: vouchers } = useMyVouchers();
  const [logoError, setLogoError] = useState(false);

  const uv = vouchers?.find((v) => v.id === voucherId);

  if (!uv) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  const { voucher, redemptionCode, qrCode, purchasedAt, expiresAt, status } = uv;
  const bg = voucher.brandColor || '#0a2540';
  const dark = isDarkColor(bg);
  const ink = dark ? '#ffffff' : '#0a2540';
  const stacks = voucherStacks(uv.id);

  const statusLabel =
    status === 'active'
      ? isRTL ? 'פעיל' : 'Active'
      : status === 'used'
        ? isRTL ? 'מומש' : 'Used'
        : isRTL ? 'פג תוקף' : 'Expired';

  const rows: { icon: string; label: string; value: string }[] = [
    { icon: 'event', label: isRTL ? 'בתוקף עד' : 'Valid until', value: formatDate(expiresAt, locale) },
    { icon: 'shopping_bag', label: isRTL ? 'נרכש בתאריך' : 'Purchased', value: formatDate(purchasedAt, locale) },
    { icon: 'verified', label: isRTL ? 'סטטוס' : 'Status', value: statusLabel },
  ];

  const actions: { icon: string; label: string }[] = [
    { icon: 'receipt_long', label: t.wallet.receipt },
    { icon: 'description', label: t.wallet.termsLabel },
    { icon: 'ios_share', label: isRTL ? 'שיתוף' : 'Share' },
  ];

  return (
    <div className="relative min-h-dvh bg-white px-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back button — dark on the white surface */}
      <button
        onClick={() => navigate(-1)}
        aria-label={isRTL ? 'חזרה' : 'Back'}
        className="absolute top-5 start-4 z-10 w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '22px' }}>
          {isRTL ? 'arrow_forward' : 'arrow_back'}
        </span>
      </button>

      {/* ── VOUCHER CARD — sits large at the top ── */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pt-20"
      >
        <div
          className="relative w-full rounded-xl shadow-xl overflow-hidden p-5"
          style={{ aspectRatio: '1.586 / 1', backgroundColor: bg }}
        >
          {/* Nexus mark — top-left */}
          <img
            src="/nexus-white-wide-logo.png"
            alt="Nexus"
            draggable={false}
            className="absolute top-4 left-4 h-9 w-auto opacity-95 pointer-events-none"
            style={{ filter: dark ? undefined : 'brightness(0)' }}
          />
          {/* Brand logo / name — centred */}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            {voucher.brandLogo && !logoError ? (
              <img
                src={voucher.brandLogo}
                alt={voucher.merchantName}
                className="h-20 w-auto max-w-[64%] object-contain"
                onError={() => setLogoError(true)}
                draggable={false}
              />
            ) : (
              <span className="text-2xl font-extrabold text-center leading-tight" style={{ color: ink }}>
                {voucher.merchantName}
              </span>
            )}
          </div>
          {/* Discount pill — bottom-left */}
          {voucher.discountPercent ? (
            <span
              className="absolute bottom-4 left-4 text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: ink }}
            >
              {`-${voucher.discountPercent}%`}
            </span>
          ) : null}

          {/* Stacking fact — translucent pill (like the discount %), top-right */}
          <span
            className="absolute top-4 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.18)', color: ink }}
          >
            {stacks ? t.wallet.includesStacking : t.wallet.excludesStacking}
          </span>
        </div>
      </motion.div>

      {/* ── DETAILS ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="pt-6 pb-10"
      >
        {/* In-store codes — the actual barcode / QR + redemption code.
            Grey surface so it blends with the sections below. */}
        <div className="mb-4">
          <PayCodesPanel
            code={redemptionCode}
            qrSrc={qrCode}
            hideTitle
            surface
          />
        </div>

        {/* Heading — below the barcode rectangle */}
        <h1 className="text-xl font-bold text-text-primary mb-4">{voucher.merchantName}</h1>

        {/* Detail rows */}
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center gap-3 px-4 py-3.5">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '22px' }}>
                {row.icon}
              </span>
              <span className="text-sm text-text-secondary flex-1">{row.label}</span>
              <span className="text-sm font-semibold text-text-primary">{row.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {actions.map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface border border-border py-4 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-text-primary" style={{ fontSize: '24px' }}>
                {action.icon}
              </span>
              <span className="text-[11px] font-medium text-text-secondary text-center leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>

        {/* Transfer-to-balance + Add to Google Pay */}
        <WalletCardActions
          className="mt-5"
          onTransfer={() => navigate(`/${lang}/wallet/balance`)}
        />
      </motion.div>
    </div>
  );
}
