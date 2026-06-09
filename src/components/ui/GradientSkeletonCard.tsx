// Colorful gradient skeleton card — same look as the recommendations sheet:
// blurred multi-color blobs inside the image frame, gray bar placeholders
// for the text underneath, and a pulse animation on the whole card.
//
// Used both in the chat recommendations sheet (full-width, vertical list)
// and on the home page sliders (fixed width, horizontal scroll).

const SKELETON_COLORS: ReadonlyArray<readonly [string, string, string]> = [
  ['#fdba74', '#f87171', '#fcd34d'], // warm — orange / red / amber
  ['#86efac', '#fde047', '#a3e635'], // fresh — green / yellow / lime
  ['#f9a8d4', '#fbbf24', '#fb7185'], // sunset — pink / amber / rose
  ['#93c5fd', '#67e8f9', '#5eead4'], // ocean — blue / cyan / teal
  ['#c084fc', '#f0abfc', '#fda4af'], // berry — purple / fuchsia / pink
  ['#86efac', '#fde68a', '#fdba74'], // earth — green / amber / orange
];

interface GradientSkeletonCardProps {
  index?: number;
  /** Tailwind/CSS class for the outer card (use to control width, e.g. "w-full" or "w-[300px]") */
  className?: string;
  /** Image area height — string CSS value, e.g. "20vh" or "180px" */
  imageHeight?: string;
}

export default function GradientSkeletonCard({
  index = 0,
  className = 'w-full',
  imageHeight = '20vh',
}: GradientSkeletonCardProps) {
  const [c1, c2, c3] = SKELETON_COLORS[index % SKELETON_COLORS.length];
  const background = `
    radial-gradient(circle at 25% 30%, ${c1} 0%, transparent 55%),
    radial-gradient(circle at 75% 70%, ${c2} 0%, transparent 55%),
    radial-gradient(circle at 50% 55%, ${c3} 0%, transparent 60%),
    linear-gradient(135deg, ${c1}, ${c2})
  `;

  return (
    <div
      className={`bg-white border border-border rounded-lg shadow-sm overflow-hidden flex flex-col animate-pulse shrink-0 ${className}`}
    >
      <div
        className="relative overflow-hidden"
        style={{
          height: imageHeight,
          background,
          filter: 'saturate(0.85)',
        }}
      />
      <div className="px-3 py-3 space-y-2">
        <div className="h-2 w-1/4 bg-gray-200 rounded" />
        <div className="h-3 w-3/4 bg-gray-300 rounded" />
        <div className="h-3 w-1/3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
