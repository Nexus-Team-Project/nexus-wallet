/**
 * MotivationAnimation — animated hero for MotivationSlide.
 *
 * Concept: benefit-category cards scattered on a dark background →
 * irrelevant cards dim out → selected cards converge to a centre row →
 * they collapse into a single user-icon dot → final label reveal.
 *
 * Inspired by a bespoke HTML/CSS prototype; adapted to the Nexus design
 * context (app colour variables, Material Symbols, appropriate sizing for
 * the onboarding hero slot, RTL Hebrew labels).
 *
 * Phases:
 *   0 (0 ms)    — all cards scattered, label "לא הכל חשוב לך."
 *   1 (2000 ms) — label → "מתמקדים."
 *   2 (3000 ms) — non-selected cards dim (opacity 0.15, blur, scale down)
 *   3 (4000 ms) — selected cards group to a centred row
 *   4 (4800 ms) — selected cards absorb to centre, user-icon dot appears
 *   5 (5500 ms) — label → "לראות רק את הדברים שחשובים לך."
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

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

const CARD_SIZE = 72; // px — fits comfortably in clamp(200px, 38vh, 280px) hero slot

/** Six benefit categories — three selected, three unselected. */
const CARDS: readonly CardDef[] = [
  { key: 'vacation', emoji: '🏖',   label: 'נופש',        top:  6, left:  6, selected: false, selIdx: -1 },
  { key: 'super',    emoji: '🛒',   label: 'סופר',        top:  8, left: 62, selected: false, selIdx: -1 },
  { key: 'family',   emoji: '👨‍👩‍👧', label: 'משפחה',      top: 30, left: 12, selected: true,  selIdx:  0 },
  { key: 'tech',     emoji: '💻',   label: 'אלקטרוניקה', top: 50, left: 58, selected: true,  selIdx:  1 },
  { key: 'local',    emoji: '📍',   label: 'ליד הבית',   top: 62, left:  6, selected: true,  selIdx:  2 },
  { key: 'finance',  emoji: '💳',   label: 'פיננסים',    top: 20, left: 38, selected: false, selIdx: -1 },
] as const;

/**
 * Horizontal offsets (px) applied to each selected card during the grouped
 * phase.  Three 72 px cards spaced 92 px apart → 256 px total row width,
 * which fits comfortably on a ≥ 320 px screen.
 */
const SEL_OFFSETS = [-92, 0, 92] as const;

/** Easing for card position / scale transitions. */
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const PHASE_TIMINGS: ReadonlyArray<[delayMs: number, phase: Phase]> = [
  [2000, 1],
  [3000, 2],
  [4000, 3],
  [4800, 4],
  [5500, 5],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLabel(phase: Phase): string {
  if (phase === 0) return 'לא הכל חשוב לך.';
  if (phase >= 5)  return 'לראות רק את הדברים שחשובים לך.';
  return 'מתמקדים.';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MotivationAnimation() {
  const [phase, setPhase] = useState<Phase>(0);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);

  useEffect(() => {
    const timers = PHASE_TIMINGS.map(([delay, p]) =>
      setTimeout(() => setPhase(p), delay),
    );
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const labelText    = getLabel(phase);
  const showUserIcon = phase >= 4;

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: [
          'radial-gradient(ellipse at 25% 35%, rgba(124,58,237,0.10) 0%, transparent 55%)',
          'linear-gradient(160deg, #0e0e0e 0%, #111 100%)',
        ].join(', '),
      }}
    >

      {/* ── Category cards ─────────────────────────────────────────────────── */}
      {CARDS.map((card) => {
        const dimmed   = phase >= 2 && !card.selected;
        const grouped  = phase >= 3 &&  card.selected;
        const absorbed = phase >= 4 &&  card.selected;

        // In the grouped phase selected cards converge to a centred row.
        const top  = grouped
          ? `calc(50% - ${CARD_SIZE / 2}px)`
          : `${card.top}%`;
        const left = grouped
          ? `calc(50% - ${CARD_SIZE / 2}px + ${SEL_OFFSETS[card.selIdx] ?? 0}px)`
          : `${card.left}%`;

        const opacity   = absorbed ? 0 : dimmed ? 0.15 : 1;
        const scale     = absorbed ? 0.4 : dimmed ? 0.92 : 1;
        const blurPx    = dimmed ? 4 : 0;

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
              transition:     [
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

      {/* ── User-icon dot (phases 4 +) ──────────────────────────────────────── */}
      <div
        style={{
          position:       'absolute',
          top:            '50%',
          left:           '50%',
          transform:      `translate(-50%, -50%) scale(${showUserIcon ? 1 : 0})`,
          opacity:        showUserIcon ? 1 : 0,
          transition:     [
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

      {/* ── Phase label ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position:      'absolute',
          bottom:        16,
          left:          0,
          right:         0,
          textAlign:     'center',
          padding:       '0 20px',
          pointerEvents: 'none',
        }}
      >
        {/* key re-mounts the span on every label change → animate-fade-in re-triggers */}
        <span
          key={labelText}
          className="animate-fade-in"
          style={{
            display:       'inline-block',
            fontSize:      14,
            fontWeight:    700,
            color:         'rgba(255,255,255,0.92)',
            letterSpacing: '-0.01em',
            direction:     'rtl',
          }}
        >
          {labelText}
        </span>
      </div>

    </div>
  );
}
