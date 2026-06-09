import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import {
  X,
  Type,
  SunMoon,
  Link,
  AlignLeft,
  ZapOff,
  MoveHorizontal,
  MousePointer2,
  Crosshair,
  RotateCcw,
  Mail,
  Palette,
} from 'lucide-react';

// ─── Route-awareness hook (outside router) ────────────────────────────────────

/**
 * Track the current pathname from OUTSIDE the router. react-router uses
 * history.pushState/replaceState (no popstate), so we patch both to emit a
 * same-tab event and also listen to popstate for browser back/forward.
 * Returns the live pathname; re-renders the consumer on every navigation.
 */
function useLivePathname(): string {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    const emit = () => window.dispatchEvent(new Event('nexus:locationchange'));

    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);
    window.history.pushState = (...args: Parameters<typeof window.history.pushState>) => {
      const result = origPush(...args);
      emit();
      return result;
    };
    window.history.replaceState = (...args: Parameters<typeof window.history.replaceState>) => {
      const result = origReplace(...args);
      emit();
      return result;
    };

    window.addEventListener('popstate', update);
    window.addEventListener('nexus:locationchange', update);
    // Sync once in case the path changed between initial state and effect.
    update();
    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener('popstate', update);
      window.removeEventListener('nexus:locationchange', update);
    };
  }, []);
  return pathname;
}

/** True when the path is part of the first-time signup journey (FAB hidden there). */
const SIGNUP_ROUTE_RE = /^\/[a-z]{2}\/(auth-flow|register|auth\/email-required|auth\/email-otp)\b/;

// ─── Types ────────────────────────────────────────────────────────────────────

type FontSize = 0 | 1 | 2; // 0=normal, 1=large (+20%), 2=larger (+40%)

interface A11ySettings {
  fontSize: FontSize;
  highContrast: boolean;
  grayscale: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
  noAnimations: boolean;
  textSpacing: boolean;
  bigCursor: boolean;
  focusHighlight: boolean;
}

const DEFAULT_SETTINGS: A11ySettings = {
  fontSize: 0,
  highContrast: false,
  grayscale: false,
  highlightLinks: false,
  readableFont: false,
  noAnimations: false,
  textSpacing: false,
  bigCursor: false,
  focusHighlight: false,
};

const STORAGE_KEY = 'nexus-a11y-settings';
const BTN_SIZE = 52;
// Drag-to-dismiss trash target dimensions / placement. Sized to fit
// *underneath* the FAB visually — when the user drags the widget over
// it, the FAB hides the target almost entirely, reinforcing the
// "absorbed into" feeling.
const TRASH_SIZE = 56;
const TRASH_BOTTOM = 80;            // distance from bottom edge of viewport
const TRASH_HIT_RADIUS = 60;        // how close the FAB has to get to "snap in"

// ─── CSS class application ────────────────────────────────────────────────────

function applySettings(s: A11ySettings) {
  const html = document.documentElement;
  html.classList.remove('a11y-font-md', 'a11y-font-lg');
  if (s.fontSize === 1) html.classList.add('a11y-font-md');
  if (s.fontSize === 2) html.classList.add('a11y-font-lg');
  html.classList.toggle('a11y-high-contrast', s.highContrast);
  html.classList.toggle('a11y-grayscale', s.grayscale);
  html.classList.toggle('a11y-highlight-links', s.highlightLinks);
  html.classList.toggle('a11y-readable-font', s.readableFont);
  html.classList.toggle('a11y-no-animations', s.noAnimations);
  html.classList.toggle('a11y-text-spacing', s.textSpacing);
  html.classList.toggle('a11y-big-cursor', s.bigCursor);
  html.classList.toggle('a11y-focus-highlight', s.focusHighlight);
}

function isModified(s: A11ySettings) {
  return (
    s.fontSize !== 0 ||
    s.highContrast ||
    s.grayscale ||
    s.highlightLinks ||
    s.readableFont ||
    s.noAnimations ||
    s.textSpacing ||
    s.bigCursor ||
    s.focusHighlight
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  id: string;
}

function ToggleRow({ icon, label, checked, onChange, id }: ToggleRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        gap: 12,
      }}
    >
      <label
        htmlFor={id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          flex: 1,
          color: checked ? '#a78bfa' : 'rgba(255,255,255,0.85)',
          fontSize: 14,
          fontWeight: checked ? 500 : 400,
          userSelect: 'none',
          transition: 'color 0.2s',
        }}
      >
        <span
          style={{
            color: checked ? '#a78bfa' : 'rgba(255,255,255,0.5)',
            flexShrink: 0,
            transition: 'color 0.2s',
          }}
        >
          {icon}
        </span>
        {label}
      </label>

      {/* Toggle switch */}
      <button
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
          background: checked
            ? 'linear-gradient(135deg, #0d9488, #00d4ff)'
            : 'rgba(255,255,255,0.15)',
          transition: 'background 0.25s',
          outline: 'none',
        }}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onChange(!checked);
          }
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.25s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function AccessibilityWidget() {
  const [widgetState, setWidgetState] = useState<'idle' | 'showX' | 'panelOpen'>('idle');
  // Drag-to-dismiss state. `dragging` shows the trash target at the
  // bottom-center; `overTrash` highlights it red when the FAB hovers
  // within hit range. Both reset on pointer-up.
  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  // Opt-in visibility lives in a shared store so the home-page prompt card
  // can reveal the widget the moment the user adds it.
  const enabled = useAccessibilityStore((s) => s.enabled);
  const disableWidget = useAccessibilityStore((s) => s.disableWidget);
  // Route gate: hide the FAB on signup screens. Must be called unconditionally
  // (before any early return) because it is a hook.
  const pathname = useLivePathname();
  const hiddenForSignup = SIGNUP_ROUTE_RE.test(pathname);
  const [settings, setSettings] = useState<A11ySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Position state: { x, y } = top-left of the button (px from viewport top-left)
  // null = use default bottom-left (24, window.innerHeight - 24 - BTN_SIZE)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Drag tracking (no re-renders during drag, only on pointer-up)
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  // Initialize position to bottom-left after mount
  useEffect(() => {
    setPos({ x: 24, y: window.innerHeight - 24 - BTN_SIZE });
  }, []);

  // Apply settings on mount + on change
  useEffect(() => {
    applySettings(settings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  // Close on Escape
  useEffect(() => {
    if (widgetState !== 'panelOpen') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setWidgetState('idle');
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [widgetState]);

  // Close panel on outside click
  useEffect(() => {
    if (widgetState !== 'panelOpen') return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setWidgetState('idle');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [widgetState]);

  const update = useCallback(<K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  // ── Drag handlers (pointer events for mouse + touch support) ──────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      // Capture pointer so we get events even when dragging fast
      e.currentTarget.setPointerCapture(e.pointerId);
      const currentPos = pos ?? { x: 24, y: window.innerHeight - 24 - BTN_SIZE };
      dragRef.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        origX: currentPos.x,
        origY: currentPos.y,
      };
    },
    [pos],
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.moved = true;
      // First real movement → reveal the trash target at bottom-center.
      setDragging(true);
      const newX = Math.max(0, Math.min(window.innerWidth - BTN_SIZE, dragRef.current.origX + dx));
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - BTN_SIZE, dragRef.current.origY + dy),
      );
      setPos({ x: newX, y: newY });

      // Hit-test against the trash target. FAB center vs. trash center.
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
    dragRef.current.active = false;
    const wasOverTrash = overTrash;
    setDragging(false);
    setOverTrash(false);

    // Dropped over the trash → dismiss the widget. Drag wins over the
    // click-to-open flow so the user doesn't see the panel open on the
    // way to deleting the widget.
    if (wasOverTrash) {
      disableWidget();
      return;
    }

    // Not a drag → original click flow.
    if (!dragRef.current.moved) {
      setWidgetState((prev) => {
        if (prev === 'idle') return 'showX';
        if (prev === 'showX') return 'panelOpen';
        return 'idle'; // panelOpen → idle
      });
    }
  }, [overTrash, disableWidget]);

  const handleDismiss = useCallback(() => {
    disableWidget();
    setWidgetState('idle');
  }, [disableWidget]);

  const modified = isModified(settings);
  const panelOpen = widgetState === 'panelOpen';
  const showX = widgetState === 'showX';

  // ── Derived position values ───────────────────────────────────────────────

  // Container uses flex-direction: column-reverse → button at bottom, panel grows upward
  // Position the container so the button sits at (pos.x, pos.y)
  const containerBottom = pos ? window.innerHeight - pos.y - BTN_SIZE : 24;
  const containerLeft = pos?.x ?? 24;

  if (!enabled || hiddenForSignup) return null;

  return (
    <>
    {/* Trash sits OUTSIDE the widget container so it's not trapped in
        the widget's stacking context. With the widget at z 9999 and the
        trash at z 9990, the dragged FAB cleanly sits on top of the
        target — "absorbing into it" reads correctly. */}
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
          background: overTrash
            ? 'rgba(15, 23, 42, 0.92)'
            : 'rgba(15, 23, 42, 0.7)',
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
          zIndex: 9990,
          pointerEvents: 'none',
          transformOrigin: 'center',
          transform: `translateX(-50%) scale(${overTrash ? 1.08 : 1})`,
          transition: 'transform 0.18s ease-out, background 0.18s, border 0.18s, box-shadow 0.18s',
          animation: 'a11y-trash-in 0.2s ease-out',
        }}
      >
        <X size={20} strokeWidth={2} />
      </div>
    )}
    <div
      data-a11y-widget="true"
      style={{
        position: 'fixed',
        bottom: containerBottom,
        left: containerLeft,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'flex-start',
        gap: 12,
        fontFamily: "'Rubik', system-ui, -apple-system, sans-serif",
        direction: 'rtl',
      }}
    >
      {/* ── Full-screen Panel ─────────────────────────────────────────── */}
      {panelOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="הגדרות נגישות"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'linear-gradient(160deg, #0e1f3a 0%, #0a2540 60%, #111827 100%)',
            overflow: 'auto',
            animation: 'a11y-slide-up 0.25s ease-out',
            direction: 'rtl',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              background:
                'linear-gradient(90deg, rgba(99,91,255,0.18) 0%, rgba(0,212,255,0.08) 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="4" r="2" fill="#a78bfa" />
                <path
                  d="M12 7c-1.1 0-2 .9-2 2v4l-2 5h2l1.5-3.5h1L14 18h2l-2-5V9c0-1.1-.9-2-2-2z"
                  fill="#a78bfa"
                />
                <path d="M9 9H6M15 9h3" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 17 }}>הגדרות נגישות</span>
            </div>
            <button
              aria-label="סגור הגדרות נגישות"
              onClick={() => {
                setWidgetState('idle');
                triggerRef.current?.focus();
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                borderRadius: 8,
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '8px 20px 12px' }}>
            {/* Font size */}
            <div
              style={{
                padding: '14px 0',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    color: settings.fontSize > 0 ? '#a78bfa' : 'rgba(255,255,255,0.85)',
                    fontSize: 15,
                    fontWeight: settings.fontSize > 0 ? 500 : 400,
                  }}
                >
                  <Type
                    size={18}
                    color={settings.fontSize > 0 ? '#a78bfa' : 'rgba(255,255,255,0.5)'}
                  />
                  גודל טקסט
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {([0, 1, 2] as FontSize[]).map((level) => {
                    const labels = ['A', 'A+', 'A++'];
                    const sizes = [13, 15, 17];
                    const active = settings.fontSize === level;
                    return (
                      <button
                        key={level}
                        aria-pressed={active}
                        aria-label={`גודל טקסט ${labels[level]}`}
                        onClick={() => update('fontSize', level)}
                        style={{
                          width: 40,
                          height: 32,
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: sizes[level],
                          fontWeight: 700,
                          fontFamily: 'inherit',
                          background: active
                            ? 'linear-gradient(135deg, #0d9488, #00d4ff)'
                            : 'rgba(255,255,255,0.08)',
                          color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {labels[level]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Toggle rows */}
            <ToggleRow
              id="a11y-contrast"
              icon={<SunMoon size={18} />}
              label="ניגודיות גבוהה"
              checked={settings.highContrast}
              onChange={(v) => update('highContrast', v)}
            />
            <ToggleRow
              id="a11y-grayscale"
              icon={<Palette size={18} />}
              label="גווני אפור"
              checked={settings.grayscale}
              onChange={(v) => update('grayscale', v)}
            />
            <ToggleRow
              id="a11y-links"
              icon={<Link size={18} />}
              label="הדגשת קישורים"
              checked={settings.highlightLinks}
              onChange={(v) => update('highlightLinks', v)}
            />
            <ToggleRow
              id="a11y-font"
              icon={<AlignLeft size={18} />}
              label="פונט קריא (דיסלקציה)"
              checked={settings.readableFont}
              onChange={(v) => update('readableFont', v)}
            />
            <ToggleRow
              id="a11y-anim"
              icon={<ZapOff size={18} />}
              label="עצירת אנימציות"
              checked={settings.noAnimations}
              onChange={(v) => update('noAnimations', v)}
            />
            <ToggleRow
              id="a11y-spacing"
              icon={<MoveHorizontal size={18} />}
              label="ריווח טקסט מוגבר"
              checked={settings.textSpacing}
              onChange={(v) => update('textSpacing', v)}
            />
            <ToggleRow
              id="a11y-cursor"
              icon={<MousePointer2 size={18} />}
              label="סמן מוגדל"
              checked={settings.bigCursor}
              onChange={(v) => update('bigCursor', v)}
            />
            <ToggleRow
              id="a11y-focus"
              icon={<Crosshair size={18} />}
              label="הדגשת פוקוס מקלדת"
              checked={settings.focusHighlight}
              onChange={(v) => update('focusHighlight', v)}
            />
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '14px 20px 20px',
              borderTop: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <button
              onClick={reset}
              disabled={!modified}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.12)',
                background: modified ? 'rgba(99,91,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: modified ? '#a78bfa' : 'rgba(255,255,255,0.25)',
                cursor: modified ? 'pointer' : 'default',
                fontSize: 14,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={14} />
              איפוס כל ההגדרות
            </button>

            <a
              href="mailto:hello@nexus-pay.com?subject=פנייה בנושא נגישות"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 14,
                color: 'rgba(255,255,255,0.35)',
                fontSize: 12,
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.7)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)')
              }
            >
              <Mail size={12} />
              לפנייה בנושא נגישות: hello@nexus-pay.com
            </a>
          </div>
        </div>
      )}

      {/* ── Trigger button (draggable FAB) ────────────────────────────────── */}
      <div
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <button
          ref={triggerRef}
          aria-label={panelOpen ? 'סגור הגדרות נגישות' : 'פתח הגדרות נגישות'}
          aria-expanded={panelOpen}
          aria-haspopup="dialog"
          title="גרור להזזה • לחץ לפתיחה"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            width: BTN_SIZE,
            height: BTN_SIZE,
            borderRadius: '50%',
            border: 'none',
            cursor: dragRef.current.active ? 'grabbing' : 'grab',
            background: panelOpen
              ? 'linear-gradient(135deg, #4f46e5, #0ea5e9)'
              : 'linear-gradient(135deg, #0d9488, #00d4ff)',
            boxShadow: panelOpen
              ? '0 4px 20px rgba(99,91,255,0.6)'
              : '0 4px 16px rgba(99,91,255,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'box-shadow 0.2s',
            touchAction: 'none', // prevent scroll interference during drag
            userSelect: 'none',
          }}
        >
          {/* Universal Accessibility Icon */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0, pointerEvents: 'none' }}
          >
            <circle cx="12" cy="4.5" r="2" fill="white" />
            <path
              d="M6.5 8.5h11M12 8.5V14m0 0l-2.5 5.5M12 14l2.5 5.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {/* Active indicator dot */}
          {modified && !panelOpen && (
            <span
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#f97316',
                border: '2px solid white',
                pointerEvents: 'none',
              }}
            />
          )}
        </button>

        {/* Dismiss circle — appears on first FAB click */}
        {showX && (
          <button
            aria-label="הסתר ווידג'ט נגישות"
            title="הסתר"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid rgba(99,91,255,0.5)',
              background: '#0a2540',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#ef4444';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#0a2540';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Keyframe animation */}
      <style>{`
        @keyframes a11y-slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes a11y-trash-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.6); }
          to   { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        [data-a11y-widget="true"] button:focus-visible {
          outline: 2px solid #00d4ff !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </div>
    </>
  );
}
