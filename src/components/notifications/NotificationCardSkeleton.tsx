import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';

/**
 * Loading placeholder for a single NotificationCard.
 * Mirrors the real card's structure (44px avatar with category badge +
 * three lines of text on the trailing side) so there is no layout shift
 * when the data arrives.
 *
 * The avatar circle and the small category badge are filled with the
 * same colorful radial-gradient blobs used in `GradientSkeletonCard`
 * on the home page — each row gets a different palette via `index`,
 * giving the loading list visual rhythm instead of a wall of gray.
 */

// Same palette as src/components/ui/GradientSkeletonCard.tsx — keep
// these in sync so the notifications and home skeletons feel like one
// design system.
const SKELETON_COLORS: ReadonlyArray<readonly [string, string, string]> = [
  ['#fdba74', '#f87171', '#fcd34d'], // warm — orange / red / amber
  ['#86efac', '#fde047', '#a3e635'], // fresh — green / yellow / lime
  ['#f9a8d4', '#fbbf24', '#fb7185'], // sunset — pink / amber / rose
  ['#93c5fd', '#67e8f9', '#5eead4'], // ocean — blue / cyan / teal
  ['#c084fc', '#f0abfc', '#fda4af'], // berry — purple / fuchsia / pink
  ['#86efac', '#fde68a', '#fdba74'], // earth — green / amber / orange
];

function gradientFor(index: number): string {
  const [c1, c2, c3] = SKELETON_COLORS[index % SKELETON_COLORS.length];
  return `
    radial-gradient(circle at 25% 30%, ${c1} 0%, transparent 55%),
    radial-gradient(circle at 75% 70%, ${c2} 0%, transparent 55%),
    radial-gradient(circle at 50% 55%, ${c3} 0%, transparent 60%),
    linear-gradient(135deg, ${c1}, ${c2})
  `;
}

interface NotificationCardSkeletonProps {
  /** Picks which color palette to use — pass the row index so each row differs. */
  index?: number;
  className?: string;
}

export default function NotificationCardSkeleton({
  index = 0,
  className,
}: NotificationCardSkeletonProps) {
  const avatarBg = gradientFor(index);
  // Offset the badge so it doesn't share the avatar's palette — gives
  // a small color contrast between the two circles.
  const badgeBg = gradientFor(index + 3);

  return (
    <div
      className={cn(
        'relative mb-3 w-full bg-white rounded-2xl p-4 flex gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.05)] animate-pulse',
        className,
      )}
    >
      {/* Avatar + category badge — same 44px disc as the loaded card,
          filled with colorful gradient blobs instead of flat gray. */}
      <div className="flex-shrink-0 relative">
        <div
          className="w-11 h-11 rounded-full"
          style={{ background: avatarBg, filter: 'saturate(0.85)' }}
        />
        <div
          className="absolute -bottom-0.5 -end-0.5 w-5 h-5 rounded-full ring-2 ring-white"
          style={{ background: badgeBg, filter: 'saturate(0.85)' }}
        />
      </div>

      {/* Title row + subject line + body lines. */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-2.5 w-12 rounded" />
        </div>
        <Skeleton className="h-3 w-40 rounded mb-2" />
        <Skeleton className="h-2.5 w-full rounded mb-1.5" />
        <Skeleton className="h-2.5 w-3/4 rounded" />
      </div>
    </div>
  );
}
