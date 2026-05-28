import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircleMore, X } from 'lucide-react';
import AiOrb from './AiOrb';

export type ChatVariant = 'ai' | 'human';

interface SupportChatButtonProps {
  // 'ai' → always-on, sparkles badge, violet gradient accents.
  // 'human' → only mounted when a human agent is engaged, green
  // "online" dot badge. Both share the same chat bubble + typing
  // dots, drag-anywhere behaviour and drop-to-trash dismissal.
  variant: ChatVariant;
  // Click handler — opens the relevant chat panel.
  onClick?: () => void;
  // Drives the typing-dots animation. For 'ai' this is "thinking",
  // for 'human' this is "agent typing". The host wires it to the
  // appropriate store flag.
  isTyping?: boolean;
}

// Geometry shared across both variants.
const BTN_SIZE = 56;
const EDGE_MARGIN = 12;
const DRAG_THRESHOLD = 5;
const TRASH_SIZE = 56;
const TRASH_BOTTOM = 80;
const TRASH_HIT_RADIUS = 60;

// Per-variant configuration: storage keys are namespaced so each FAB
// remembers its own position + dismiss state independently. Default
// stacking offsets place the AI button at the bottom-right and the
// human button just above it so they don't overlap on first paint.
const VARIANT = {
  ai: {
    posKey: 'nexus-chat-fab-ai-pos',
    dismissKey: 'nexus-chat-fab-ai-dismissed-v1',
    defaultOffsetX: 16,
    defaultOffsetY: 96,
    ariaLabel: 'Open AI assistant',
    title: 'AI assistant — drag to move',
  },
  human: {
    posKey: 'nexus-chat-fab-human-pos',
    dismissKey: 'nexus-chat-fab-human-dismissed-v1',
    defaultOffsetX: 16,
    // 96 (AI bottom offset) + BTN_SIZE + 16 gap = stacks above the AI FAB
    defaultOffsetY: 168,
    ariaLabel: 'Open support chat',
    title: 'Live agent — drag to move',
  },
} as const;

export default function SupportChatButton({ variant, onClick, isTyping = true }: SupportChatButtonProps) {
  const config = VARIANT[variant];
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(config.dismissKey) === 'true';
    } catch {
      return false;
    }
  });

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // Pick the initial position once we know the viewport size.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(config.posKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { x: number; y: number };
        const x = Math.max(EDGE_MARGIN, Math.min(window.innerWidth - BTN_SIZE - EDGE_MARGIN, parsed.x));
        const y = Math.max(EDGE_MARGIN, Math.min(window.innerHeight - BTN_SIZE - EDGE_MARGIN, parsed.y));
        setPos({ x, y });
        return;
      }
    } catch {
      // ignore
    }
    setPos({
      x: window.innerWidth - BTN_SIZE - config.defaultOffsetX,
      y: window.innerHeight - BTN_SIZE - config.defaultOffsetY,
    });
  }, [config.posKey, config.defaultOffsetX, config.defaultOffsetY]);

  // Persist position whenever it changes.
  useEffect(() => {
    if (!pos) return;
    try {
      localStorage.setItem(config.posKey, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [pos, config.posKey]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!pos) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        origX: pos.x,
        origY: pos.y,
      };
    },
    [pos],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragRef.current.moved = true;
      setDragging(true);
      const newX = Math.max(
        EDGE_MARGIN,
        Math.min(window.innerWidth - BTN_SIZE - EDGE_MARGIN, dragRef.current.origX + dx),
      );
      const newY = Math.max(
        EDGE_MARGIN,
        Math.min(window.innerHeight - BTN_SIZE - EDGE_MARGIN, dragRef.current.origY + dy),
      );
      setPos({ x: newX, y: newY });

      // Hit-test against the trash target at bottom-center.
      const fabCenterX = newX + BTN_SIZE / 2;
      const fabCenterY = newY + BTN_SIZE / 2;
      const trashCenterX = window.innerWidth / 2;
      const trashCenterY = window.innerHeight - TRASH_BOTTOM - TRASH_SIZE / 2;
      const distance = Math.hypot(fabCenterX - trashCenterX, fabCenterY - trashCenterY);
      setOverTrash(distance < TRASH_HIT_RADIUS);
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.active) return;
    const wasMoved = dragRef.current.moved;
    const wasOverTrash = overTrash;
    dragRef.current.active = false;
    setDragging(false);
    setOverTrash(false);

    if (wasOverTrash) {
      setDismissed(true);
      try {
        localStorage.setItem(config.dismissKey, 'true');
      } catch {
        // ignore
      }
      return;
    }
    if (!wasMoved) onClick?.();
  }, [overTrash, onClick, config.dismissKey]);

  if (dismissed) return null;
  if (!pos) return null;

  // Per-variant accent classes/colors — kept narrow so the badge is the
  // only thing that visually changes between AI and human variants.
  const isAi = variant === 'ai';

  return (
    <>
      <style>{`
        @keyframes supportFabSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes supportTrashIn {
          from { opacity: 0; transform: translateX(-50%) scale(0.6); }
          to   { opacity: 1; transform: translateX(-50%) scale(1); }
        }

        /* Typing dots — bounce paths 2/3/4 of the MessageCircleMore svg
           (path 1 is the bubble outline). Staggered delays give the
           classic 3-dot indicator feel. */
        .support-fab-typing path:nth-child(2),
        .support-fab-typing path:nth-child(3),
        .support-fab-typing path:nth-child(4) {
          transform-box: fill-box;
          transform-origin: center;
          animation: supportFabDotBounce 1.2s ease-in-out infinite;
        }
        .support-fab-typing path:nth-child(3) { animation-delay: 0.15s; }
        .support-fab-typing path:nth-child(4) { animation-delay: 0.3s; }

        @keyframes supportFabDotBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-2.5px); }
        }
      `}</style>

      {dragging && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            bottom: TRASH_BOTTOM,
            left: '50%',
            width: TRASH_SIZE,
            height: TRASH_SIZE,
            borderRadius: '50%',
            background: overTrash ? 'rgba(15, 23, 42, 0.92)' : 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${overTrash ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.12)'}`,
            boxShadow: overTrash
              ? '0 10px 28px rgba(0, 0, 0, 0.28)'
              : '0 6px 18px rgba(0, 0, 0, 0.18)',
            color: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            pointerEvents: 'none',
            transformOrigin: 'center',
            transform: `translateX(-50%) scale(${overTrash ? 1.08 : 1})`,
            transition: 'transform 0.18s ease-out, background 0.18s, border 0.18s, box-shadow 0.18s',
            animation: 'supportTrashIn 0.2s ease-out',
          }}
        >
          <X size={20} strokeWidth={2} />
        </div>
      )}

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={config.ariaLabel}
        title={config.title}
        style={{
          position: 'fixed',
          top: pos.y,
          left: pos.x,
          width: BTN_SIZE,
          height: BTN_SIZE,
          zIndex: 40,
          touchAction: 'none',
          cursor: dragging ? 'grabbing' : 'grab',
          animation: 'supportFabSlideUp 0.4s ease-out',
          transition: dragging ? 'none' : 'box-shadow 0.3s, transform 0.2s',
          transform: hovered && !dragging ? 'translate3d(0, -2px, 0)' : 'translate3d(0, 0, 0)',
          willChange: 'transform',
        }}
        // White ring is intentional — both variants. For AI we replace
        // the slate border with a hair-thin shadow-ring (`0 0 0 1px
        // rgba(0,0,0,0.04)`) plus a soft glow, so the ring reads as a
        // polished frosted disc rather than a CSS border. Human variant
        // keeps the classic border for its colder chat-pill look.
        //
        // No `overflow-hidden` — the AI orb already clips itself via
        // its inner stage, and overflow-hidden here would clip the
        // overlay status dots into the disc instead of letting them
        // poke out as proper badges.
        className={`rounded-full bg-white flex items-center justify-center active:scale-95 transition-shadow duration-300 ${
          isAi
            ? 'shadow-[0_6px_24px_rgba(15,23,42,0.10),_0_0_0_1px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_32px_rgba(15,23,42,0.14),_0_0_0_1px_rgba(15,23,42,0.05)]'
            : 'border border-border/60 shadow-lg shadow-slate-300/60 hover:shadow-2xl'
        }`}
      >
        {/* AI variant gets the Apple-Intelligence-style morphing orb;
            the human variant keeps the chat bubble + dots icon. */}
        {isAi ? (
          <>
            {/* The orb lives directly inside the FAB's flex container —
                no intermediate <div>. That stray wrapper used to stretch
                to full width and push the orb off-centre. Now the orb
                wrapper (inline-block, sized to 40px) is the only flex
                item, so flex-center hits it exactly. 40 inside 56 →
                8px of clean white margin on every side. */}
            <AiOrb size={40} variant={isTyping && !dragging ? 'thinking' : 'idle'} />
            {/* Live indicator — small blinking dot in the corner, like
                the green online dot on the human FAB but tinted violet
                to match the AI's brand palette. Pulses softly so it
                reads as "AI is live and available". `pointer-events-none`
                keeps it from being a stray flex item competing for
                centring. */}
            <span
              aria-hidden="true"
              // Sits on top of the FAB's top-right edge so it reads as
              // a badge overlay, not a tag clipped inside the disc.
              // Negative offsets push half of the dot beyond the
              // FAB's bounding circle.
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-white shadow-sm pointer-events-none ai-fab-blink z-10"
            />
            <style>{`
              @keyframes aiFabBlink {
                0%, 100% { opacity: 1; transform: scale(1); }
                50%      { opacity: 0.55; transform: scale(0.88); }
              }
              .ai-fab-blink { animation: aiFabBlink 1.6s ease-in-out infinite; }
            `}</style>
          </>
        ) : (
          <>
            <MessageCircleMore
              size={24}
              className={`text-primary transition-transform duration-300 pointer-events-none ${isTyping && !dragging ? 'support-fab-typing' : ''}`}
              style={{
                transform: hovered && !dragging ? 'scale(1.15) rotate(-8deg)' : 'scale(1) rotate(0)',
              }}
            />
            <span
              aria-hidden="true"
              // Same overlay treatment as the AI dot — sits on top of
              // the FAB's edge rather than clipped inside it.
              className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm pointer-events-none z-10"
            />
          </>
        )}
      </button>
    </>
  );
}
