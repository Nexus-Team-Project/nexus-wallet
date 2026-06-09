import Skeleton from '../ui/Skeleton';
import GradientSkeletonCard from '../ui/GradientSkeletonCard';

/**
 * Full-page skeleton for HomePage.
 * Shown while the initial vouchers data is loading.
 * Each section mirrors the real layout so there's no layout shift on reveal.
 *
 * Slider cards use the same colorful "GradientSkeletonCard" style as the
 * chat recommendations sheet — blurred multi-color blobs in the image frame
 * with text-bar placeholders below, pulsing as a whole.
 */
export default function HomePageSkeleton() {
  return (
    <div className="animate-fade-in">
      {/* ── HeroBanner ── */}
      <section className="mb-5 px-4">
        <Skeleton variant="rectangular" className="w-full rounded-xl" height="220px" />
        <div className="flex items-center justify-center gap-2 mt-3">
          <Skeleton variant="rectangular" className="rounded-full" width="20px" height="8px" />
          <Skeleton variant="circular" width="8px" height="8px" />
          <Skeleton variant="circular" width="8px" height="8px" />
          <Skeleton variant="circular" width="24px" height="24px" />
        </div>
      </section>

      {/* ── BrandSlider — circular avatars ── */}
      <section className="mb-5">
        <div className="flex items-center justify-between px-5 mb-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-12 rounded-md" />
        </div>
        <div className="flex gap-4 px-5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <Skeleton variant="circular" width="60px" height="60px" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </section>

      {/* ── TopStores / slider rows — colorful gradient cards ── */}
      <SkeletonSliderRow titleWidth="w-32" />
      <SkeletonSliderRow titleWidth="w-36" startIndex={2} />
      <SkeletonSliderRow titleWidth="w-40" startIndex={4} />
    </div>
  );
}

function SkeletonSliderRow({
  titleWidth,
  startIndex = 0,
}: {
  titleWidth: string;
  startIndex?: number;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between px-5 mb-3">
        <Skeleton className={`h-5 ${titleWidth}`} />
        <Skeleton className="h-6 w-10 rounded-md" />
      </div>
      <div className="flex gap-3 px-5 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <GradientSkeletonCard
            key={i}
            index={startIndex + i}
            className="w-[75vw] max-w-[300px]"
            imageHeight="20vh"
          />
        ))}
      </div>
    </section>
  );
}
