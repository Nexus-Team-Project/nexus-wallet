/**
 * Optional brand palette — `base` is the CSS background under the blobs,
 * `blobs` the five blob colours (inner, outer) in the default's order.
 * Omitted = the Nexus aurora (teal / sky / orange / mint).
 */
export interface GradientPalette {
  base: string;
  blobs: [string, string][];
}

const NEXUS_PALETTE: GradientPalette = {
  base: 'linear-gradient(to right, #0D9488, #0EA5E9, #FB923C)',
  blobs: [
    ['#0D9488', '#0B7F74'],
    ['#0EA5E9', '#0284C7'],
    ['#FB923C', '#F97316'],
    ['#34D399', '#10B981'],
    ['#14B8A6', '#0D9488'],
  ],
};

interface AnimatedGradientProps {
  clipPath?: string;
  palette?: GradientPalette;
}

export default function AnimatedGradient({
  clipPath = 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
  palette = NEXUS_PALETTE,
}: AnimatedGradientProps) {
  const blob = (i: number, stop = '40%') => {
    const [a, b] = palette.blobs[i % palette.blobs.length];
    return `radial-gradient(circle, ${a} 0%, ${b} ${stop}, transparent 65%)`;
  };
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ clipPath }}
    >
      {/* Base gradient — teal → sky blue → soft orange */}
      <div className="absolute inset-0" style={{ background: palette.base }} />

      {/* Animated blobs — bigger, faster, more travel distance */}
      <div
        className="absolute w-[150%] h-[150%] -top-[25%] -left-[25%]"
        style={{ filter: 'blur(70px)', transform: 'translateZ(0)' }}
      >
        {/* Teal */}
        <div
          className="absolute w-[55%] h-[65%] rounded-full opacity-90"
          style={{
            background: blob(0),
            top: '0%',
            left: '50%',
            animation: 'blob1 10s ease-in-out infinite alternate',
            willChange: 'transform',
            backfaceVisibility: 'hidden' as const,
          }}
        />
        {/* Sky blue */}
        <div
          className="absolute w-[60%] h-[60%] rounded-full opacity-90"
          style={{
            background: blob(1),
            top: '20%',
            left: '20%',
            animation: 'blob2 13s ease-in-out infinite alternate',
            willChange: 'transform',
            backfaceVisibility: 'hidden' as const,
          }}
        />
        {/* Soft orange */}
        <div
          className="absolute w-[45%] h-[45%] rounded-full opacity-80"
          style={{
            background: blob(2, '35%'),
            top: '12%',
            left: '-5%',
            animation: 'blob3 12s ease-in-out infinite alternate',
            willChange: 'transform',
            backfaceVisibility: 'hidden' as const,
          }}
        />
        {/* Mint */}
        <div
          className="absolute w-[55%] h-[55%] rounded-full opacity-85"
          style={{
            background: blob(3),
            top: '30%',
            left: '40%',
            animation: 'blob4 11s ease-in-out infinite alternate',
            willChange: 'transform',
            backfaceVisibility: 'hidden' as const,
          }}
        />
        {/* Teal (cycle back) */}
        <div
          className="absolute w-[50%] h-[55%] rounded-full opacity-85"
          style={{
            background: blob(4),
            top: '5%',
            left: '30%',
            animation: 'blob5 14s ease-in-out infinite alternate',
            willChange: 'transform',
            backfaceVisibility: 'hidden' as const,
          }}
        />
      </div>

      <style>{`
        @keyframes blob1 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(-25%, 20%, 0) scale(1.25); }
          50% { transform: translate3d(15%, -20%, 0) scale(0.85); }
          75% { transform: translate3d(-20%, -10%, 0) scale(1.15); }
          100% { transform: translate3d(20%, 15%, 0) scale(0.9); }
        }
        @keyframes blob2 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(25%, -20%, 0) scale(1.3); }
          50% { transform: translate3d(-20%, 25%, 0) scale(0.8); }
          75% { transform: translate3d(15%, 15%, 0) scale(1.2); }
          100% { transform: translate3d(-25%, -15%, 0) scale(1.1); }
        }
        @keyframes blob3 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(-20%, -25%, 0) scale(1.2); }
          50% { transform: translate3d(25%, 20%, 0) scale(1.3); }
          75% { transform: translate3d(20%, -15%, 0) scale(0.85); }
          100% { transform: translate3d(-15%, 25%, 0) scale(1.15); }
        }
        @keyframes blob4 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(20%, 20%, 0) scale(0.85); }
          50% { transform: translate3d(-25%, -15%, 0) scale(1.25); }
          75% { transform: translate3d(-10%, 25%, 0) scale(1.1); }
          100% { transform: translate3d(25%, -20%, 0) scale(0.9); }
        }
        @keyframes blob5 {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          25% { transform: translate3d(25%, 10%, 0) scale(1.2); }
          50% { transform: translate3d(-15%, -25%, 0) scale(1.15); }
          75% { transform: translate3d(20%, 20%, 0) scale(0.85); }
          100% { transform: translate3d(-20%, 15%, 0) scale(1.3); }
        }
      `}</style>
    </div>
  );
}
