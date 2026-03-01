/**
 * MotivationAnimation — animated hero for MotivationSlide.
 * Phases: 0=grid 1=dim 2=converge 3=absorb 4=label
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';

type Phase = 0 | 1 | 2 | 3 | 4;

interface CardDef {
  key: string; emoji: string; label: string;
  top: number; left: number; selected: boolean; selIdx: number;
}

const CARD_SIZE = 72;

const CARDS: readonly CardDef[] = [
  { key: 'vacation', emoji: 'U0001f3d6', label: 'נופש', top: 3, left: 5, selected: false, selIdx: -1 },
  { key: 'super', emoji: 'U0001f6d2', label: 'סופר', top: 3, left: 40, selected: false, selIdx: -1 },
  { key: 'food', emoji: 'U0001f355', label: 'מסעדות', top: 3, left: 75, selected: false, selIdx: -1 },
  { key: 'family', emoji: 'U0001f468‍U0001f469‍U0001f467', label: 'משפחה', top: 35, left: 5, selected: true, selIdx: 0 },
  { key: 'finance', emoji: 'U0001f4b3', label: 'פיננסים', top: 35, left: 40, selected: false, selIdx: -1 },
  { key: 'tech', emoji: 'U0001f4bb', label: 'אלקטרוניקה', top: 35, left: 75, selected: true, selIdx: 1 },
  { key: 'local', emoji: 'U0001f4cd', label: 'ליד הבית', top: 65, left: 5, selected: true, selIdx: 2 },
  { key: 'fashion', emoji: 'U0001f457', label: 'אופנה', top: 65, left: 40, selected: false, selIdx: -1 },
  { key: 'sports', emoji: '⚽', label: 'ספורט', top: 65, left: 75, selected: false, selIdx: -1 },
] as const;

const SEL_OFFSETS = [-92, 0, 92] as const;
const EASE = 'cubic-bezier(0.22, 0.61, 0.36, 1)';
const PHASE_TIMINGS: ReadonlyArray<[delayMs: number, phase: Phase]> = [
  [1500, 1], [2500, 2], [3300, 3], [4000, 4],
];

function getCardLabel(phase: Phase): string | null {
  if (phase >= 4) return 'לראות רק את מה שחשוב לך.';
  return null;
}

export function MotivationAnimation() {
  const [phase, setPhase] = useState<Phase>(0);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  useEffect(() => {
    const timers = PHASE_TIMINGS.map(([delay, ph]) => setTimeout(() => setPhase(ph), delay));
    return () => { timers.forEach(clearTimeout); };
  }, []);
  const showUserIcon = phase >= 3;
  const cardLabel = getCardLabel(phase);
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
      {CARDS.map((card) => {
        const dimmed   = phase >= 1 && !card.selected;
        const grouped  = phase >= 2 &&  card.selected;
        const absorbed = phase >= 3 &&  card.selected;
        const top  = grouped ? `calc(50% - ${CARD_SIZE / 2}px)` : `${card.top}%`;
        const left = grouped ? `calc(50% - ${CARD_SIZE / 2}px + ${SEL_OFFSETS[card.selIdx] ?? 0}px)` : `${card.left}%`;
        const opacity = absorbed ? 0 : dimmed ? 0.15 : 1;
        const scale   = absorbed ? 0.4 : dimmed ? 0.92 : 1;
        const blurPx  = dimmed ? 4 : 0;
        return (
          <div key={card.key} style={{
            position: 'absolute', top, left, width: CARD_SIZE, height: CARD_SIZE,
            opacity,
            filter: blurPx ? `blur(${blurPx}px)` : undefined,
            transform: `scale(${scale})`,
            transition: [`top 900ms ${EASE}`, `left 900ms ${EASE}`, `opacity 700ms ease`, `filter 700ms ease`, `transform 700ms ${EASE}`].join(', '),
            borderRadius: 14,
            background: card.selected ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
            border: card.selected ? '1.5px solid rgba(255,255,255,0.28)' : '1px solid rgba(255,255,255,0.10)',
            backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            pointerEvents: 'none', userSelect: 'none',
          }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{card.emoji}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 1.2, direction: 'rtl' }}>
              {card.label}
            </span>
          </div>
        );
      })}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%',
        background: ['linear-gradient(to top,', '  transparent 0%,', '  rgba(124,58,237,0.06) 35%,', '  rgba(124,58,237,0.22) 70%,', '  rgba(139,92,246,0.55) 88%,', '  rgba(167,139,250,0.85) 96%,', '  rgba(221,214,254,0.70) 100%', ')'].join(' '),
        transform: `translateY(${showUserIcon ? '-230%' : '115%'})`,
        transition: showUserIcon ? 'transform 1000ms cubic-bezier(0.22, 0.61, 0.36, 1)' : 'none',
        pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: `translate(-50%, -50%) scale(${showUserIcon ? 1 : 0})`,
        opacity: showUserIcon ? 1 : 0,
        transition: ['transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)', 'opacity 500ms ease'].join(', '),
        width: 60, height: 60, borderRadius: '50%',
        background: avatarUrl ? 'transparent' : 'var(--color-primary, #7c3aed)',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 28px rgba(124,58,237,0.45)', pointerEvents: 'none', zIndex: 2,
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span className="material-symbols-outlined" style={{ fontSize: 30, color: 'white', fontVariationSettings: "'FILL' 1" }}>person</span>
        )}
      </div>
      {cardLabel && (
        <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', padding: '0 20px', pointerEvents: 'none', zIndex: 3 }}>
          <span key={cardLabel} className="animate-fade-in" style={{ display: 'inline-block', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.01em', direction: 'rtl' }}>
            {cardLabel}
          </span>
        </div>
      )}
    </div>
  );
}
