import { cn } from '../../utils/cn';
import type { Voucher } from '../../types/voucher.types';

/**
 * Tiny card-shaped thumbnail of a gift — the voucher's artwork when it has
 * one, otherwise its brand colour with the logo (or initials) centred.
 * Used in sub-balance rows so each gift is recognisable at a glance.
 * `locked` greys it out under a small lock (the Nexus joining gift).
 */
export default function MiniGiftCard({ voucher, className, locked }: { voucher?: Voucher; className?: string; locked?: boolean }) {
  if (locked) {
    return (
      <span className={cn('relative inline-flex flex-shrink-0', className)}>
        <span className="grayscale opacity-60 inline-flex">
          <MiniGiftCard voucher={voucher} />
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 rounded-full bg-white shadow flex items-center justify-center">
            <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 11, fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </span>
        </span>
      </span>
    );
  }
  const base = cn('w-9 h-6 rounded-[5px] border border-border/60 overflow-hidden flex-shrink-0', className);
  if (voucher?.cardImage) {
    return (
      <img
        src={voucher.cardImage}
        alt=""
        className={cn(base, 'object-cover')}
        style={{ objectPosition: voucher.cardImagePosition || 'center' }}
      />
    );
  }
  return (
    <span
      className={cn(base, 'flex items-center justify-center px-1')}
      style={{ backgroundColor: voucher?.brandColor || '#0a2540' }}
      aria-hidden
    >
      {voucher?.brandLogo ? (
        <img src={voucher.brandLogo} alt="" className="max-h-3.5 max-w-full object-contain" />
      ) : (
        <span className="text-[8px] font-extrabold text-white leading-none truncate">{voucher?.merchantName ?? ''}</span>
      )}
    </span>
  );
}
