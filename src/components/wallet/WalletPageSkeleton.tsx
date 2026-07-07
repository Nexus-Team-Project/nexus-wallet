import Skeleton from '../ui/Skeleton';

/**
 * Lightweight WalletPage skeleton — only the card slider (deck): a centred
 * card with the carousel's side-peek cards behind it. Everything else (cashback
 * / widgets / sections) fades in live, so the loading state stays minimal.
 */
export default function WalletPageSkeleton() {
  return (
    <div className="animate-fade-in pt-16">
      <section className="mt-4 px-5">
        <div className="relative flex items-center justify-center" style={{ minHeight: 264 }}>
          {/* Side-peek cards — hint the swipeable carousel. */}
          <Skeleton
            variant="rectangular"
            className="absolute start-0 h-[78%] w-[12%] rounded-2xl opacity-40"
          />
          <Skeleton
            variant="rectangular"
            className="absolute end-0 h-[78%] w-[12%] rounded-2xl opacity-40"
          />
          {/* Active (centred) card. */}
          <Skeleton
            variant="rectangular"
            className="relative w-[80%] aspect-[1.586/1] rounded-2xl shadow-xl"
          />
        </div>
      </section>
    </div>
  );
}
