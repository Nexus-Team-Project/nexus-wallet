/**
 * MotivationAnimation — animated hero for MotivationSlide.
 *
 * Phases:
 *   0  (   0 ms) — "{name}, אנחנו יכולים לסייע לך בהרבה תחומים."
 *   1  (1600 ms) — "אבל לא הכל רלוונטי באותה מידה."
 *   2  (3000 ms) — "מתמקדים."  (large + bold)
 *   3  (3900 ms) — "נתחיל ממה שהכי חשוב לך."
 *   4  (5000 ms) — text fades; cards fly in (3×3 grid)
 *   5  (6500 ms) — non-selected cards dim
 *   6  (7500 ms) — selected cards converge to centre
 *   7  (8300 ms) — selected cards absorb; user-icon dot appears
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface CardDef {
  key:      string;
  emoji:    string;
  label:    string;
  top:      number; // % of container height
  left:     number; // % of container width
  selected: boolean;
  selIdx:   number; // index within selected group (-1 if unselected)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CARD_SIZE = 72; // px

/**
 * Nine benefit categories in a clean 3×3 grid.
 * Three are pre-selected; the rest dim during the focus sequence.
 */
const CARDS: readonly CardDef[] = [
  // Row 0 — top
  { key: 'vacation', emoji: '🏖️',  label: 'נופש',        top:  3, left:  5, selected: false, selIdx: -1 },
  { key: 'super',    emoji: '🛒',   label: 'סופר',        top:  3, left: 40, selected: false, selIdx: -1 },
  { key: 'food',     emoji: '🍕',   label: 'מסעדות',      top:  3, left: 75, selected: false, selIdx: -1 },
  // Row 1 — middle
  { key: 'family',   emoji: '👨‍👩‍👧', label: 'משפחה',      top: 35, left:  5, selected: true,  selIdx:  0 },
  { key: 'finance',  emoji: '💳',   label: 'פיננסים',    top: 35, left: 40, selected: false, selIdx: -1 },
  { key: 'tech',     emoji: '💻',   label: 'אלקטרוניקה', top: 35, left: 75, selected: true,  selIdx:  1 },
  // Row 2 — bottom
  { key: 'local',    emoji: '📍',   label: 'ליד הבית',   top: 65, left:  5, selected: true,  selIdx:  2 },
  { key: 'fashion',  emoji: '👗',   label: 'אופנה',       top: 65, left: 40, selected: false, selIdx: -1 },
  { key: 'sports',   emoji: '⚽',   label: 'ספורט',       top: 65, left: 75, selected: false, selIdx: -1 },
] as const;

/**
 * Horizontal offsets (px) for the three selected cards during the converge
 * phase. Three 72 px cards spaced 92 px apart → 256 px total row width.
 */
const SEL_OFFSETS = [-92, 0, 92] as const;

const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const PHASE_TIMINGS: ReadonlyArray<[delayMs: number, phase: Phase]> = [
  [1600, 1], // "אבל לא הכל..."
  [3000, 2], // "מתמקדים."
  [3900, 3], // "נתחיל ממה שהכי..."
  [5000, 4], // cards enter; text fades
  [6500, 5], // non-selected dim
  [7500, 6], // selected converge
  [8300, 7], // absorb → user icon
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTextLine(phase: Phase, name: string): string | null {
  const greeting = name ? `${name}, ` : '';
  if (phase === 0) return `${greeting}אנחנו יכולים לסייע לך בהרבה תחומים.`;
  if (phase === 1) return 'אבל לא הכל רלוונטי באותה מידה.';
  if (phase === 2) return 'מתמקדים.';
  if (phase === 3) return 'נתחיל ממה שהכי חשוב לך.';
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MotivationAnimation() {
  const [phase, setPhase] = useState<Phase>(0);

  const avatarUrl     = useAuthStore((s) => s.avatarUrl);
  const authFirstName = useAuthStore((s) => s.firstName);
  const regFirstName  = useRegistrationStore((s) => s.profileData.firstName);
  const firstName     = regFirstName ?? authFirstName ?? '';

  useEffect(() => {
    const timers = PHASE_TIMINGS.map(([delay, p]) =>
      setTimeout(() => setPhase(p), delay),
    );
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const showCards    = phase >= 4;
  const showUserIcon = phase >= 7;
  const textLine     = getTextLine(phase, firstName);

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: [
          'radial-gradient(ellipse at 78% 22%, rgba(216,129,244,0.55) 0%, transparent 52%)',
          'radial-gradient(ellipse at 18% 62%, rgba(128,222,234,0.45) 0%, transparent 52%)',
          'radial-gradient(ellipse at 52% 92%, rgba(255,183,77,0.35) 0%, transparent 45%)',
          'radial-gradient(ellipse at 82% 78%, rgba(244,143,177,0.45) 0%, transparent 45%)',
          'radial-gradient(ellipse at 28% 18%, rgba(179,157,219,0.45) 0%, transparent 48%)',
          'linear-gradient(135deg, #0d0820 0%, #0a1525 60%, #120820 100%)',
        ].join(', '),
      }}
    >

      {/* ── Narrative text intro (phases 0–3) ──────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          padding:        '0 28px',
          opacity:        phase < 4 ? 1 : 0,
          transition:     'opacity 600ms ease',
          pointerEvents:  'none',
          zIndex:         2,
        }}
      >
        {textLine && (
          <span
            key={textLine}
            className="animate-fade-in"
            style={{
              fontSize:      phase === 2 ? 24 : 17,
              fontWeight:    phase === 2 ? 800 : 600,
              color:         'rgba(255,255,255,0.94)',
              textAlign:     'center',
              lineHeight:    1.55,
              letterSpacing: phase === 2 ? '-0.025em' : '-0.01em',
              direction:     'rtl',
            }}
          >
            {textLine}
          </span>
        )}
      </div>

      {/* ── Category cards (visible from phase 4) ───────────────────────────── */}
      {CARDS.map((card) => {
        const dimmed   = phase >= 5 && !card.selected;
        const grouped  = phase >= 6 &&  card.selected;
        const absorbed = phase >= 7 &&  card.selected;

        const top  = grouped
          ? `calc(50% - ${CARD_SIZE / 2}px)`
          : `${card.top}%`;
        const left = grouped
          ? `calc(50% - ${CARD_SIZE / 2}px + ${SEL_OFFSETS[card.selIdx] ?? 0}px)`
          : `${card.left}%`;

        const opacity = !showCards ? 0 : absorbed ? 0 : dimmed ? 0.15 : 1;
        const scale   = !showCards ? 0.8 : absorbed ? 0.4 : dimmed ? 0.92 : 1;
        const blurPx  = dimmed ? 4 : 0;

        return (
          <div
            key={card.key}
            style={{
              position:       'absolute',
              top,
              left,
              width:          CARD_SIZE,
              height:         CARD_SIZE,
              opacity,
              filter:         blurPx ? `blur(${blurPx}px)` : undefined,
              transform:      `scale(${scale})`,
              transition: [
                `top 900ms ${EASE}`,
                `left 900ms ${EASE}`,
                `opacity 700ms ease`,
                `filter 700ms ease`,
                `transform 700ms ${EASE}`,
              ].join(', '),
              borderRadius:   14,
              background:     card.selected
                ? 'rgba(255,255,255,0.14)'
                : 'rgba(255,255,255,0.08)',
              border:         card.selected
                ? '1.5px solid rgba(255,255,255,0.28)'
                : '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(8px)',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            4,
              pointerEvents:  'none',
              userSelect:     'none',
            }}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{card.emoji}</span>
            <span
              style={{
                fontSize:   9,
                fontWeight: 700,
                color:      'rgba(255,255,255,0.82)',
                textAlign:  'center',
                lineHeight: 1.2,
                direction:  'rtl',
              }}
            >
              {card.label}
            </span>
          </div>
        );
      })}

      {/* ── Scanner sweep (phase 7+) ─────────────────────────────────────────── */}
      <div
        style={{
          position:   'absolute',
          left:       0,
          right:      0,
          bottom:     0,
          height:     '45%',
          background: [
            'linear-gradient(to top,',
            '  transparent 0%,',
            '  rgba(124,58,237,0.06) 35%,',
            '  rgba(124,58,237,0.22) 70%,',
            '  rgba(139,92,246,0.55) 88%,',
            '  rgba(167,139,250,0.85) 96%,',
            '  rgba(221,214,254,0.70) 100%',
            ')',
          ].join(' '),
          transform:  `translateY(${showUserIcon ? '-230%' : '115%'})`,
          transition: showUserIcon
            ? 'transform 1000ms cubic-bezier(0.22, 0.61, 0.36, 1)'
            : 'none',
          pointerEvents: 'none',
          zIndex:     1,
        }}
      />

      {/* ── User-icon dot (phase 7+) ─────────────────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          top:            '50%',
          left:           '50%',
          transform:      `translate(-50%, -50%) scale(${showUserIcon ? 1 : 0})`,
          opacity:        showUserIcon ? 1 : 0,
          transition: [
            'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            'opacity 500ms ease',
          ].join(', '),
          width:          60,
          height:         60,
          borderRadius:   '50%',
          background:     avatarUrl ? 'transparent' : 'var(--color-primary, #7c3aed)',
          overflow:       'hidden',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 0 28px rgba(124,58,237,0.45)',
          pointerEvents:  'none',
          zIndex:         2,
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span
            className="material-symbols-outlined"
            style={{
              fontSize:             30,
              color:                'white',
              fontVariationSettings: "'FILL' 1",
            }}
          >
            person
          </span>
        )}
      </div>

    </div>
  );
}
