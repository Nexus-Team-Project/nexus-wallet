import Skeleton from '../ui/Skeleton';

/**
 * Skeleton placeholder for the WalletHistoryPage. Renders the same
 * layout slots (header, spending summary, range selector, view-toggle,
 * chart area, day-grouped row list) as shimmer boxes so there's no
 * layout shift when the real content loads.
 */
export default function WalletHistorySkeleton() {
  return (
    <div className="min-h-dvh bg-white animate-fade-in pt-20">
      {/* Header — title + view toggle */}
      <header className="flex items-center justify-between px-6 pb-4">
        <Skeleton className="h-6 w-24 rounded" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </header>

      {/* Spending summary — centred stack inside the w-72 ring area */}
      <section className="flex flex-col items-center mt-4 px-6">
        <div className="relative w-72 h-72 flex flex-col items-center justify-center gap-3">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-12 w-32 rounded-lg" />
          <Skeleton className="h-1.5 w-[140px] rounded-full mt-2" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </section>

      {/* Time range selector — pills + filter button */}
      <section className="mt-12 mb-2 px-6 flex items-center gap-2">
        <div className="flex-grow flex bg-surface rounded-full p-1 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 h-7 rounded-full" />
          ))}
        </div>
        <Skeleton variant="circular" width="40px" height="40px" />
      </section>

      {/* Chart placeholder — six bars rising to varied heights */}
      <section className="mt-12 mb-2 px-6">
        <div className="flex justify-between items-end gap-3 h-[170px]">
          {[42, 26, 70, 18, 95, 110].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-1">
              <Skeleton className="h-3 w-6 rounded" />
              <Skeleton className="w-11 rounded-lg" height={`${h}px`} />
              <Skeleton className="h-3 w-7 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Categories / Transactions tab — two pill buttons */}
      <section className="mt-6 px-6 flex gap-3">
        <Skeleton className="flex-1 h-9 rounded-full" />
        <Skeleton className="flex-1 h-9 rounded-full" />
      </section>

      {/* Day-grouped list of transaction rows */}
      <section className="mt-8 px-6 space-y-7 mb-bottom-nav">
        {[0, 1].map((groupIdx) => (
          <div key={groupIdx}>
            <div className="flex items-center mb-4 gap-2">
              <Skeleton className="h-4 w-12 rounded" />
              <Skeleton className="h-3 w-3 rounded-full opacity-50" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
            <div className="space-y-4 px-1">
              {Array.from({ length: groupIdx === 0 ? 3 : 2 }).map((_, i) => (
                <div key={i} className="w-full flex gap-3 items-start">
                  <Skeleton variant="circular" width="44px" height="44px" />
                  <div className="flex-1 min-w-0 space-y-2 pt-1">
                    <div className="flex justify-between items-center gap-2">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </div>
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-3 w-40 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
