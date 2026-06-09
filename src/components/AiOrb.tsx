interface AiOrbProps {
  size?: number;
  // 'thinking' → faster breath + morph cycles. 'idle' → calm.
  variant?: 'idle' | 'thinking';
}

// Apple-Intelligence-style AI orb.
//
// Three layers stack to fake the "breathing alive blob" look:
//   1. Outer wrapper — slow breathing pulse (scale 1 ↔ 1.05).
//   2. Inner stage — slow continuous rotation, giving the colour
//      composition a swirling current under the surface.
//   3. Four morphing radial-gradient discs inside — each on its own
//      keyframe of translate / scale / rotate / asymmetric border-radius,
//      with staggered negative delays so they never sync. Heavy CSS
//      blur (~18% of orb diameter) plus a touch of saturate makes the
//      union read as liquid, not as four separate shapes.
//
// Together: breath in/out + slow swirl + constant non-repeating morph =
// the "wave underneath" feeling you get from the Apple Intelligence orb.
export default function AiOrb({ size = 48, variant = 'idle' }: AiOrbProps) {
  const morph = variant === 'thinking' ? '2.6s' : '6s';
  const breath = variant === 'thinking' ? '2s' : '3.4s';
  const swirl = variant === 'thinking' ? '6s' : '14s';
  const blur = Math.max(4, Math.round(size * 0.18));

  return (
    <>
      <style>{`
        /* Outer wrapper — breath. A gentle scale pulse with ease-in-out
           on both ends gives the orb an inhale/exhale cadence. */
        .ai-orb-wrapper {
          display: inline-block;
          animation: ai-orb-breathe var(--ai-orb-breath) ease-in-out infinite;
        }
        @keyframes ai-orb-breathe {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.055); }
        }

        /* Middle layer — slow swirl. Rotates the whole composition so
           the colour positions drift continuously, creating the "wave"
           sensation without per-pixel work. */
        .ai-orb-stage {
          position: relative;
          overflow: hidden;
          border-radius: 50%;
          isolation: isolate;
          /* Transparent — the white FAB behind shows through any gaps
             between the colour discs, so the orb edge fades cleanly
             into the white ring without a visible internal border. */
          background: transparent;
          animation: ai-orb-swirl var(--ai-orb-swirl) linear infinite;
        }
        @keyframes ai-orb-swirl {
          to { transform: rotate(360deg); }
        }

        /* Inner discs — the actual colour mass. */
        .ai-orb-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(var(--ai-orb-blur)) saturate(160%);
          opacity: 0.88;
          will-change: transform, border-radius;
        }

        /* Each disc is sized as % of the stage, then placed so its
           OWN centre lands at the stage centre — width 80% needs
           top/left 10% to centre, width 75% needs 12.5%, etc. The
           morph keyframes then move them off-centre during the cycle. */

        /* Magenta/pink */
        .ai-orb-blob-1 {
          width: 80%; height: 80%;
          top: 10%; left: 10%;
          background: radial-gradient(circle at 50% 50%,
            #f9a8d4 0%, #ec4899 35%, #d946ef 75%, transparent 100%);
          animation: ai-orb-m1 var(--ai-orb-morph) ease-in-out infinite;
        }
        /* Warm orange/yellow */
        .ai-orb-blob-2 {
          width: 75%; height: 75%;
          top: 12.5%; left: 12.5%;
          background: radial-gradient(circle at 50% 50%,
            #fde68a 0%, #fb923c 40%, #f97316 80%, transparent 100%);
          animation: ai-orb-m2 var(--ai-orb-morph) ease-in-out infinite;
          animation-delay: calc(var(--ai-orb-morph) * -0.18);
        }
        /* Cyan/blue */
        .ai-orb-blob-3 {
          width: 80%; height: 80%;
          top: 10%; left: 10%;
          background: radial-gradient(circle at 50% 50%,
            #a5f3fc 0%, #22d3ee 40%, #3b82f6 80%, transparent 100%);
          animation: ai-orb-m3 var(--ai-orb-morph) ease-in-out infinite;
          animation-delay: calc(var(--ai-orb-morph) * -0.36);
        }
        /* Violet/indigo */
        .ai-orb-blob-4 {
          width: 65%; height: 65%;
          top: 17.5%; left: 17.5%;
          background: radial-gradient(circle at 50% 50%,
            #c4b5fd 0%, #8b5cf6 50%, #6366f1 100%);
          animation: ai-orb-m4 var(--ai-orb-morph) ease-in-out infinite;
          animation-delay: calc(var(--ai-orb-morph) * -0.54);
        }

        @keyframes ai-orb-m1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 55% 45% 50% 50%;
          }
          25% {
            transform: translate(15%, -10%) scale(1.08) rotate(60deg);
            border-radius: 65% 35% 60% 40%;
          }
          50% {
            transform: translate(20%, 12%) scale(0.92) rotate(140deg);
            border-radius: 40% 60% 45% 55%;
          }
          75% {
            transform: translate(-8%, 18%) scale(1.05) rotate(220deg);
            border-radius: 55% 45% 65% 35%;
          }
        }
        @keyframes ai-orb-m2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 50%;
          }
          33% {
            transform: translate(-15%, 18%) scale(1.15) rotate(-40deg);
            border-radius: 40% 60% 55% 45%;
          }
          66% {
            transform: translate(-12%, -10%) scale(0.95) rotate(-120deg);
            border-radius: 60% 40% 35% 65%;
          }
        }
        @keyframes ai-orb-m3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 50%;
          }
          50% {
            transform: translate(-10%, -18%) scale(1.12) rotate(80deg);
            border-radius: 60% 40% 50% 50%;
          }
        }
        @keyframes ai-orb-m4 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            border-radius: 50%;
          }
          50% {
            transform: translate(18%, 10%) scale(1.2) rotate(160deg);
            border-radius: 35% 65% 55% 45%;
          }
        }
      `}</style>
      <div
        className="ai-orb-wrapper"
        style={{
          ['--ai-orb-morph' as string]: morph,
          ['--ai-orb-breath' as string]: breath,
          ['--ai-orb-swirl' as string]: swirl,
          ['--ai-orb-blur' as string]: `${blur}px`,
        }}
        aria-hidden="true"
      >
        <div
          className="ai-orb-stage"
          style={{ width: size, height: size }}
        >
          <div className="ai-orb-blob ai-orb-blob-1" />
          <div className="ai-orb-blob ai-orb-blob-2" />
          <div className="ai-orb-blob ai-orb-blob-3" />
          <div className="ai-orb-blob ai-orb-blob-4" />
        </div>
      </div>
    </>
  );
}
