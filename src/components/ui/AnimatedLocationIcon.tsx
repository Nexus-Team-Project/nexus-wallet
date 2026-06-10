import { useState } from 'react';

interface AnimatedLocationIconProps {
  /** Rendered size in px. */
  size?: number;
  /** Wrapper classes — set the text color here; the stroke uses currentColor. */
  className?: string;
  /**
   * Change this value to replay the animation programmatically — e.g. bump it
   * (or pass the selected state) so the pin re-animates when its address row
   * becomes selected, not only on mount / press.
   */
  playKey?: unknown;
}

/**
 * Wired location-pin icon — an outline pin with an inner dot, matching the
 * line-art look of the app's wired icons. Animated with a CSS drop-and-settle
 * bounce (keyframe `loc-pin-drop` in index.css) so it animates in like the
 * wired Lottie action icons; plays on mount and replays on press. The stroke
 * inherits `currentColor`, so set the color via the wrapper's text-color class.
 */
export default function AnimatedLocationIcon({ size = 22, className, playKey }: AnimatedLocationIconProps) {
  // Bumping the key remounts the <svg>, restarting the drop animation. Driven
  // by a press (pointer down) or by the external `playKey` changing.
  const [pressKey, setPressKey] = useState(0);
  const animKey = `${pressKey}|${String(playKey ?? '')}`;

  return (
    <span
      onPointerDown={() => setPressKey((k) => k + 1)}
      className={className}
      style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size }}
    >
      <svg
        key={animKey}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          animation: 'loc-pin-drop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          transformOrigin: '50% 92%',
        }}
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    </span>
  );
}
