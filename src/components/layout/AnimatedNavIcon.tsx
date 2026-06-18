import { useEffect, useRef, useState } from 'react';
import { DotLottieReact, setWasmUrl } from '@lottiefiles/dotlottie-react';
import type { DotLottie } from '@lottiefiles/dotlottie-web';
import wasmUrl from '@lottiefiles/dotlottie-web/dist/dotlottie-player.wasm?url';

// Serve the player's wasm from our own origin instead of the default CDN, so
// the icons still render if that CDN is blocked/unreachable. Runs once on import.
setWasmUrl(wasmUrl);

interface AnimatedNavIconProps {
  /** URL to the normal-weight wired Lottie icon. */
  src: string;
  /** URL to the bold (thick-stroke) variant of the *same* icon paths. */
  boldSrc: string;
  /** Whether this icon's route is the current page. */
  active: boolean;
  /** Rendered icon size in px. */
  size?: number;
  /** When provided, fades in instead of the bold Lottie after animation completes. */
  filledEl?: React.ReactNode;
}

/**
 * The realistic wired Lordicon icon. Both layers are the exact same artwork —
 * one normal weight, one with thicker strokes — so they line up perfectly.
 * When the icon becomes selected it first plays its reveal/movement, and only
 * once that animation completes does the bold layer fade in (the strokes
 * thicken). Pressing replays the same sequence.
 */
export default function AnimatedNavIcon({ src, boldSrc, active, size = 26, filledEl }: AnimatedNavIconProps) {
  const thinRef = useRef<DotLottie | null>(null);
  const boldRef = useRef<DotLottie | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  // The bold weight only shows after the line animation has finished playing.
  const [bold, setBold] = useState(false);

  const play = (dot: DotLottie | null) => {
    if (!dot) return;
    dot.setFrame(0);
    dot.play();
  };

  // Play the animation first; the bold layer is revealed by the line's
  // `complete` event below, not here.
  const startSequence = () => {
    setBold(false);
    play(thinRef.current);
    play(boldRef.current);
  };

  useEffect(() => {
    if (active) startSequence();
    else setBold(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const layer = { width: '100%', height: '100%' } as const;

  return (
    <span
      onPointerDown={startSequence}
      className="relative grid place-items-center"
      style={{ width: size, height: size, opacity: 1, transition: 'opacity 300ms ease' }}
    >
      {/* Normal weight — fades out when the filledEl takes over. */}
      <span
        className="absolute inset-0"
        style={{
          opacity: bold && filledEl ? 0 : 1,
          filter: bold && !filledEl ? 'brightness(0)' : 'none',
          transition: 'opacity 350ms ease, filter 400ms ease',
        }}
      >
        <DotLottieReact
          src={src}
          autoplay
          loop={false}
          dotLottieRefCallback={(dot) => {
            thinRef.current = dot;
            dot?.addEventListener('complete', () => {
              if (activeRef.current) setBold(true);
            });
          }}
          style={layer}
        />
      </span>

      {/* Bold weight — fades in only after the animation, when selected. */}
      <span className="absolute inset-0 flex items-center justify-center" style={{ opacity: bold ? 1 : 0, transition: 'opacity 350ms ease' }}>
        {filledEl ?? (
          <DotLottieReact
            src={boldSrc}
            autoplay
            loop={false}
            dotLottieRefCallback={(dot) => { boldRef.current = dot; }}
            style={layer}
          />
        )}
      </span>
    </span>
  );
}
