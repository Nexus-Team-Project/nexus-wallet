import Skeleton from '../ui/Skeleton';

/**
 * Full-page skeleton for WalletPage.
 * Mirrors the real layout (balance card → action buttons → digital cards
 * section → vouchers grid) so there's no layout shift on reveal.
 */
export default function WalletPageSkeleton() {
  return (
    <div className="animate-fade-in pt-16">
      {/* ── Balance card ── */}
      <section className="mt-4 mb-8 px-5">
        <div className="relative bg-white border border-gray-100 rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
          {/* Top-corner badge placeholder */}
          <Skeleton className="absolute top-4 start-4 h-5 w-12 rounded-full" />

          {/* "יתרת Nexus" label */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <Skeleton className="h-5 w-28 rounded" />
          </div>

          {/* Balance amount */}
          <div className="flex justify-center mb-1">
            <Skeleton className="h-14 w-44 rounded-lg" />
          </div>

          {/* Action buttons row */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 w-24 rounded-full" />
            <Skeleton variant="circular" width="48px" height="48px" />
          </div>

          {/* Cashback line */}
          <div className="flex justify-center mt-3">
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        </div>
      </section>

      {/* ── Digital cards section ── */}
      <section className="mb-6">
        <div className="flex items-center justify-between px-5 mb-3">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton variant="circular" width="20px" height="20px" />
        </div>
        <div className="px-5">
          <Skeleton
            variant="rectangular"
            className="w-full aspect-[1.7/1] rounded-2xl shadow-2xl"
          />
        </div>
        <div className="flex justify-center mt-5">
          <Skeleton className="h-11 w-36 rounded-full" />
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="h-px bg-border mx-5 mb-5" />

      {/* ── Vouchers section ── */}
      <div className="px-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32 rounded" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        {/* Tab strip */}
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>

        {/* Voucher grid — 2 columns */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              className="aspect-[1.6/1] rounded-2xl"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
