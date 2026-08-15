/**
 * VoucherStoriesPage — Instagram-style stories that teach the user how a
 * voucher is created. Reached from the "איך זה עובד?" CTA on /wallet/deal-intro.
 *
 * Shell structure mirrors the signup stories (AuthFlowStories): the shared
 * useStoryFlow step machine + StoryProgressBar, a fixed full-screen shell that
 * covers the global chrome, tap-to-navigate, and the same slide transitions.
 *
 * Unlike the signup stories — which show illustrative slides — each story here
 * plays the REAL screens of the voucher flow. Every beat mounts an actual page
 * (voucher search → voucher purchase → success → wallet) in a same-origin
 * iframe, scrolls it to the section being explained, parks a tap-hand on the
 * control in question, and captions it. The frames are pointer-events-none so
 * taps still drive story navigation rather than the embedded UI.
 *
 * /:lang/wallet/voucher-stories
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useStoryFlow, StoryProgressBar, type StoryStep } from '../features/stories';
import tapAnimUrl from '../assets/animations/tap.lottie?url';

/** The brand the walkthrough buys from — FOX, so every screen agrees with the
 *  brand the first beat searches for. */
const DEMO = {
  businessId: 'biz_014',
  voucherId: 'v_023',
  userVoucherId: 'uv_005',
  nameHe: 'פוקס',
  name: 'FOX',
};

const NAVY = '#0a153f';

// Tap-hand loop timing — mirrors the balance card's coach mark so the gesture
// is identical wherever the user meets it.
const TAP_SPEED = 0.6;
const TAP_LOOP_SEC = 1.18 / TAP_SPEED; // base loop is 1.18s at speed 1

// ─── Slide transition variants (same easing as the signup stories) ───────────
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0 }),
};

// ═════════════════════════════════════════════════════════════════════════════
//  Beat model — one beat per sentence of the story copy
// ═════════════════════════════════════════════════════════════════════════════
interface Beat {
  /** ms from slide start at which this beat takes over. */
  at: number;
  /** MemoryRouter entry — changing it remounts the frame as a real page change. */
  entry: string;
  /** Optional `data-story` anchor to scroll into view once mounted. */
  anchor?: string;
  /** Caption shown over the screen. */
  caption: string;
  /** Secondary aside under the caption — smaller, unbolded, asterisked. */
  note?: string;
  /**
   * `data-story-tap` value (or any CSS selector) of the control this step is
   * about. A white tap-hand is parked on it so the viewer sees *where* the
   * action happens, not just what it is.
   */
  tap?: string;
  /**
   * Controls the hand actually PRESSES (as opposed to `tap`, where it only
   * points). It walks the list on `tapEveryMs` and fires a real click on each
   * landing, so the page responds to the hand rather than to a blind timer.
   * A single-entry list means "press this one control, over and over" — which
   * is how a toggle gets shown flipping on and off.
   */
  tapSequence?: string[];
  /** Interval for `tapSequence` (default 2400ms). */
  tapEveryMs?: number;
  /** Nudge the hand off the target centre, in px, when it would cover it. */
  tapOffset?: { x?: number; y?: number };
  /** Fade the hand out this long after it lands — once its press has read, it
   *  is just covering the thing it pointed at. */
  tapHideAfterMs?: number;
}

interface Story {
  id: string;
  /** Fire the confetti burst when this story reaches its last beat. */
  celebrateOnLastBeat?: boolean;
  title: string;
  duration: number;
  beats: Beat[];
}

const purchaseEntry = (extra = '') =>
  `/he/business/${DEMO.businessId}/voucher/${DEMO.voucherId}?story=1${extra}`;

const walletEntry = '/he/wallet?story=1';

const STORIES: Story[] = [
  // ── 1. Find the brand — the store page, start to finish ───────────────────
  {
    id: 'find-the-brand',
    title: 'מחפשים את המותג',
    // Long enough for the hand to land on the brand and play its press twice
    // (the Lottie loop runs ~1.97s at TAP_SPEED), then hand over to the next
    // story. Nothing else happens on this screen once the brand is picked.
    duration: 10_200,
    beats: [
      {
        at: 0,
        entry: `/he/store?story=1&type=${DEMO.name}`,
        caption: 'חפשו את המותג שבו תרצו לקנות',
        tap: 'search',
      },
      // Same entry — no reload, the hand just walks from the search row down to
      // the brand it found and presses its logo.
      {
        at: 5_200,
        entry: `/he/store?story=1&type=${DEMO.name}`,
        caption: 'ובחרו את החנות מתוך התוצאות',
        tap: `store:${DEMO.name}`,
      },
    ],
  },

  // ── 2. Build the voucher — ONE page, scrolled down through its sections ────
  // Every beat shares an entry on purpose: the frame loads the create-voucher
  // page once and then simply scrolls, so the story reads as one continuous
  // page rather than three separate loads.
  {
    id: 'build-the-voucher',
    title: 'יוצרים את השובר',
    duration: 17_000,
    beats: [
      {
        at: 0,
        entry: purchaseEntry('&cycle=1'),
        caption: 'בוחרים סכום',
        tap: 'amount',
      },
      {
        at: 5_600,
        entry: purchaseEntry('&cycle=1'),
        anchor: 'terms',
        caption: 'מתאימים את התנאים להנחות בחנות',
        note: 'למדו עוד בלחיצה על סימן שאלה',
        tapSequence: ['terms-stack'],
        tapEveryMs: 2_200,
      },
      {
        at: 11_000,
        entry: purchaseEntry('&cycle=1'),
        anchor: 'payment',
        caption: 'בוחרים אמצעי תשלום — כרטיס האשראי שלכם, או יתרת Nexus ממתנה שקיבלתם או מקאשבק שצברתם',
        // The hand presses each option in turn; the page responds to the press
        // itself, so the selection switches in lockstep with the gesture.
        tapSequence: ['pay:pm_nexus', 'pay:pm_001'],
        tapEveryMs: 2_400,
        tapOffset: { x: -18 },
      },
    ],
  },

  // ── 3. Pay and redeem ─────────────────────────────────────────────────────
  {
    id: 'load-and-pay',
    title: 'צוברים ומשלמים',
    // Ends as the confetti finishes falling (burst at ~11.2s, last particle
    // lands ~15.2s) and wraps back to the first story — there is nothing left
    // to watch once the code is up.
    duration: 15_200,
    celebrateOnLastBeat: true,
    beats: [
      {
        at: 0,
        entry:
          `/he/pay/voucher-success?story=1&value=500&cashback=125` +
          `&merchantHe=${encodeURIComponent(DEMO.nameHe)}&merchant=${DEMO.name}`,
        caption: 'טוענים את השובר ומקבלים קאשבק לתוך יתרת ה-Nexus',
      },
      // The wallet home replays the real post-purchase moment: the balance
      // counts up by the cashback, the deck then slides across to the voucher
      // that was just bought, and finally that card flips to its code side.
      // One entry for both beats — reloading between them would kill the motion.
      {
        at: 4_500,
        entry: `${walletEntry}&cashback=125&card=voucher:${DEMO.userVoucherId}&flip=1&flipAt=3800`,
        caption: 'הכסף נכנס ליתרה, והשובר מחכה בארנק',
      },
      // Follows straight on from the deck slide — the wait between the card
      // arriving and the hand pressing it was dead air.
      {
        at: 9_000,
        entry: `${walletEntry}&cashback=125&card=voucher:${DEMO.userVoucherId}&flip=1&flipAt=3800`,
        caption: 'לוחצים על הכרטיס, ומציגים את הקוד בקופה לתשלום',
        tap: 'wallet-card',
        tapHideAfterMs: 1_800,
      },
    ],
  },
];

const steps: StoryStep[] = STORIES.map((s) => ({ id: s.id, duration: s.duration }));

// ═════════════════════════════════════════════════════════════════════════════
//  Screen frame — mounts a real page in an isolated router
// ═════════════════════════════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════════════════════════════
//  Confetti — one-shot burst for the final beat (the code is up at the register)
// ═════════════════════════════════════════════════════════════════════════════
const CONFETTI_COLORS = ['#4ade80', '#635bff', '#ffffff', '#ffd166', '#80deea', '#ff8fab'];

/** Deterministic per-index spread — no Math.random, so a re-render can't reshuffle. */
const CONFETTI = Array.from({ length: 44 }, (_, i) => {
  const golden = (i * 137.508) % 360;
  return {
    id: i,
    left: (i * 100) / 44 + ((golden % 7) - 3),
    delay: (i % 11) * 0.055,
    duration: 2.3 + ((i % 5) * 0.28),
    drift: ((golden % 60) - 30),
    rotate: golden * 2,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    width: 6 + (i % 3) * 2,
    height: 10 + (i % 4) * 3,
  };
});

function Confetti() {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;

  return (
    <div className="absolute inset-0 z-40 overflow-hidden pointer-events-none" aria-hidden>
      {CONFETTI.map((c) => (
        <motion.span
          key={c.id}
          className="absolute block rounded-[2px]"
          style={{
            left: `${c.left}%`,
            top: -20,
            width: c.width,
            height: c.height,
            background: c.color,
          }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: '110vh', x: c.drift, opacity: [0, 1, 1, 0], rotate: c.rotate }}
          transition={{ duration: c.duration, delay: c.delay, ease: 'easeIn', times: [0, 0.1, 0.75, 1] }}
        />
      ))}
    </div>
  );
}

/**
 * White tap-hand parked on the control the current step is about.
 *
 * The target lives inside the frame, so its position is measured from the
 * frame's document and drawn in the story layer above it. Measured on a short
 * poll rather than once: the embedded page is still animating in and may still
 * be smooth-scrolling to its anchor, so the target keeps moving for a beat.
 */
function TapHand({ frameRef, target, sequence, everyMs = 2400, offset, hideAfterMs, ready }: {
  frameRef: React.RefObject<HTMLIFrameElement | null>;
  target?: string;
  sequence?: string[];
  everyMs?: number;
  offset?: { x?: number; y?: number };
  hideAfterMs?: number;
  ready: boolean;
}) {
  // Remounted per beat by its `key`, so the position starts null on its own —
  // no reset needed when the target changes.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  // Which entry of `sequence` the hand is on. Single-target beats stay at 0.
  const [stepIdx, setStepIdx] = useState(0);
  const [hidden, setHidden] = useState(false);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!ready || !hideAfterMs) return;
    const t = window.setTimeout(() => setHidden(true), hideAfterMs);
    return () => window.clearTimeout(t);
  }, [ready, hideAfterMs]);

  const targets = sequence?.length ? sequence : target ? [target] : [];
  const active = targets[stepIdx % Math.max(targets.length, 1)];

  // Walk the sequence, pressing each control for real as the hand lands on it.
  // A genuine click (same-origin, so React's handler runs) is what keeps the
  // page's response in lockstep with the gesture — a parallel timer would drift.
  const presses = !!sequence?.length;
  useEffect(() => {
    if (!ready || !presses) return;
    const id = window.setInterval(() => setStepIdx((i) => i + 1), everyMs);
    return () => window.clearInterval(id);
  }, [ready, presses, everyMs]);

  useEffect(() => {
    if (!ready || !active || !presses) return;
    const doc = frameRef.current?.contentDocument;
    const el = doc?.querySelector<HTMLElement>(
      /^[#.[]/.test(active) ? active : `[data-story-tap="${active}"]`,
    );
    if (!el) return;
    // Fire just after the hand's press frame so cause reads before effect.
    const t = window.setTimeout(() => el.click(), 420);
    return () => window.clearTimeout(t);
    // stepIdx re-runs this on every tick, which is what repeats the press.
  }, [ready, active, presses, stepIdx, frameRef]);

  useEffect(() => {
    if (!ready || !active) return;
    const target = active;

    // `data-story-tap` value, or a raw CSS selector when it starts with # or .
    const selector = /^[#.[]/.test(target) ? target : `[data-story-tap="${target}"]`;

    let stop = false;
    const measure = () => {
      if (stop) return;
      const doc = frameRef.current?.contentDocument;
      const el = doc?.querySelector<HTMLElement>(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        // Only park on a target that is laid out AND actually on screen —
        // the page may still be scrolling it into view. Keep polling until then.
        const h = frameRef.current?.clientHeight ?? 0;
        const w = frameRef.current?.clientWidth ?? 0;
        const onScreen = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
        if (onScreen) {
          setPos({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        }
      }
    };

    // Track for the whole beat, not just the first moments: the page animates
    // in, then smooth-scrolls to its anchor, and some beats keep moving after
    // that (the wallet deck slides and flips on its own clock). A fixed window
    // would leave the hand stranded where the target used to be.
    measure();
    const id = window.setInterval(measure, 200);
    const view = frameRef.current?.contentWindow;
    view?.addEventListener('scroll', measure, { passive: true });
    return () => {
      stop = true;
      window.clearInterval(id);
      view?.removeEventListener('scroll', measure);
    };
  }, [frameRef, active, ready]);

  if (!pos || hidden) return null;

  const x = pos.x + (offset?.x ?? 0);
  const y = pos.y + (offset?.y ?? 0);

  return (
    // Three nested transforms, kept on separate elements on purpose: framer
    // animates x/y here, the middle div holds the static fingertip offset, and
    // the inner one runs the press loop. Sharing an element would make them
    // fight over `transform`.
    <motion.div
      className="absolute top-0 left-0 z-30 pointer-events-none"
      initial={{ x, y, opacity: 0, scale: 0.9 }}
      animate={{ x, y, opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      // A spring on x/y is what makes the hand glide between controls instead
      // of teleporting when a beat moves it to the next target.
      transition={{
        x: { type: 'spring', stiffness: 90, damping: 18, mass: 0.9 },
        y: { type: 'spring', stiffness: 90, damping: 18, mass: 0.9 },
        opacity: { duration: 0.4, ease: 'easeOut' },
        scale: { duration: 0.4, ease: 'easeOut' },
      }}
      aria-hidden
    >
      {/* The Lottie's fingertip sits near the top-start of its box, so the box
          hangs from just above/before the target rather than centred on it, and
          is nudged left so the hand clears what it points at. */}
      <div style={{ transform: 'translate(-42%, -22%)' }}>
        {/* Same white "tap" Lottie the Nexus balance card uses for its coach
            mark, with the same 18° tilt and lift-on-press loop, so the gesture
            reads identically wherever the user meets it. */}
        <motion.div
          className="w-32 h-32"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
          animate={prefersReduced ? { rotate: 18 } : { rotate: 18, y: [6, 6, -8, 6, 6] }}
          transition={
            prefersReduced
              ? { duration: 0 }
              : {
                  duration: TAP_LOOP_SEC,
                  times: [0, 0.06, 0.2, 0.62, 1],
                  ease: 'easeInOut',
                  repeat: Infinity,
                }
          }
        >
        <DotLottieReact
          src={tapAnimUrl}
          autoplay={!prefersReduced}
          loop={!prefersReduced}
          speed={TAP_SPEED}
          style={{ width: '100%', height: '100%' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

/**
 * One real screen, rendered in a same-origin iframe.
 *
 * An iframe (rather than mounting the page component directly) is what makes
 * this the genuine screen: the app boots its own router, layout chrome, stores
 * and data hooks exactly as it does for a real visit. It also sidesteps
 * react-router's hard ban on nesting a Router inside another Router, which
 * rules out the MemoryRouter approach entirely.
 *
 * The frame is inert (`pointer-events-none`) so the story's own tap-to-navigate
 * keeps working and nothing inside can be triggered by accident.
 */
function StoryScreen({ entry, anchor, tap, sequence, everyMs, offset, hideAfterMs }: {
  entry: string;
  anchor?: string;
  tap?: string;
  sequence?: string[];
  everyMs?: number;
  offset?: { x?: number; y?: number };
  hideAfterMs?: number;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  // Which entry has finished loading. Derived readiness (rather than a boolean
  // reset on every entry change) keeps the state out of the effect body.
  const [loadedEntry, setLoadedEntry] = useState<string | null>(null);
  const ready = loadedEntry === entry;

  // Entry change = a real page load inside the frame.
  useEffect(() => {
    const frame = frameRef.current;
    if (frame) frame.src = entry;
  }, [entry]);

  // Once loaded, scroll the embedded page to the section being explained.
  // Same-origin, so the frame's document is reachable. Consecutive beats may
  // share an entry and differ only by anchor — then this scrolls in place
  // instead of reloading, which is exactly the intended "walk down the page".
  useEffect(() => {
    if (!ready) return;
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;

    // Let the page's own entry animations settle — anchors below the fold
    // aren't laid out on the first tick after load.
    const id = window.setTimeout(() => {
      if (!anchor) {
        // The embedded pages scroll the document itself (the app's <main> grows
        // to content height inside AppLayout), so reset the frame's window.
        doc.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const el = doc.querySelector<HTMLElement>(`[data-story="${anchor}"]`);
      const view = doc.defaultView;
      if (!el || !view) return;
      // Not scrollIntoView({block:'start'}) — that pins the section flush to the
      // top edge, which clips the tap-hand hanging above its control. Leave a
      // band of headroom instead.
      const HEADROOM = 110;
      view.scrollTo({
        top: Math.max(0, view.scrollY + el.getBoundingClientRect().top - HEADROOM),
        behavior: 'smooth',
      });
    }, 500);

    return () => window.clearTimeout(id);
  }, [ready, anchor]);

  return (
    <>
      <iframe
        ref={frameRef}
        title=""
        aria-hidden
        tabIndex={-1}
        // Ignore the initial about:blank load — only a real src counts.
        onLoad={() => {
          if (frameRef.current?.getAttribute('src') === entry) setLoadedEntry(entry);
        }}
        className="absolute inset-0 w-full h-full border-0 pointer-events-none bg-white"
      />
      {/* White cover over the boot so page loads read as a transition, not a flash */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            key="booting"
            className="absolute inset-0 bg-white pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>
      <TapHand
        // Keyed by entry alone: within one page the hand stays mounted and
        // springs to the next control; a page change starts it fresh.
        key={entry}
        frameRef={frameRef}
        target={tap}
        sequence={sequence}
        everyMs={everyMs}
        offset={offset}
        hideAfterMs={hideAfterMs}
        ready={ready}
      />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Slide — a story's screens + its title and per-beat caption
// ═════════════════════════════════════════════════════════════════════════════
function StorySlide({ story, stepNumber, stepTotal }: { story: Story; stepNumber: number; stepTotal: number }) {
  // The slide is keyed by story id one level up, so this remounts per story —
  // no reset needed, the beat clock simply starts fresh.
  const [beatIdx, setBeatIdx] = useState(0);

  useEffect(() => {
    const timers = story.beats
      .slice(1)
      .map((b, i) => window.setTimeout(() => setBeatIdx(i + 1), b.at));
    return () => timers.forEach(clearTimeout);
  }, [story]);

  const beat = story.beats[beatIdx];

  // Celebrate only once the card has flipped to its code side — the burst is
  // the payoff of that reveal, so it must land after it, not with the caption.
  const onFinalBeat = !!story.celebrateOnLastBeat && beatIdx === story.beats.length - 1;
  const [celebrating, setCelebrating] = useState(false);
  useEffect(() => {
    if (!onFinalBeat) return;
    const t = window.setTimeout(() => setCelebrating(true), 2_200);
    return () => window.clearTimeout(t);
  }, [onFinalBeat]);

  return (
    <div className="absolute inset-0 overflow-hidden rounded-t-2xl bg-white" dir="rtl">
      <StoryScreen
        entry={beat.entry}
        anchor={beat.anchor}
        tap={beat.tap}
        sequence={beat.tapSequence}
        everyMs={beat.tapEveryMs}
        offset={beat.tapOffset}
        hideAfterMs={beat.tapHideAfterMs}
      />

      {celebrating && <Confetti />}

      {/* ── Text block — title, beat rail and caption all sit low on the screen
             over one tall scrim, so the real page above stays unobstructed. ── */}
      <div
        // pb clears the "קליק להמשך" pill pinned at bottom-6 (~44px tall), so
        // the caption always sits above the button and never runs under it.
        className="absolute bottom-0 inset-x-0 z-20 pointer-events-none px-5 pt-40 pb-24"
        style={{
          background:
            'linear-gradient(to top, rgba(10,21,63,0.96) 0%, rgba(10,21,63,0.92) 38%, rgba(10,21,63,0.7) 62%, rgba(10,21,63,0) 100%)',
        }}
      >
        <motion.div
          key={story.id}
          className="flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          {/* Step number — which of the three stages of creating a voucher this is */}
          <span
            className="flex-shrink-0 inline-flex items-center justify-center rounded-full font-extrabold"
            style={{
              width: 34,
              height: 34,
              background: '#ffffff',
              color: NAVY,
              fontSize: 17,
              marginTop: 2,
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            }}
            aria-label={`שלב ${stepNumber} מתוך ${stepTotal}`}
          >
            {stepNumber}
          </span>
          <h2 className="text-white font-extrabold text-[26px] leading-tight">{story.title}</h2>
        </motion.div>

        {/* Beat rail — how far through this story's steps we are. Sits between
            the title and the caption so it reads as a divider between them. */}
        <div className="flex gap-1.5 mt-3 w-32">
          {story.beats.map((b, i) => (
            <div
              key={b.at}
              className="h-[3px] flex-1 rounded-full transition-colors duration-300"
              style={{ background: i <= beatIdx ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={`${story.id}-${beatIdx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-white/85 text-[17px] font-bold leading-relaxed mt-2"
          >
            {beat.caption}
            {beat.note && (
              <span className="block text-white/60 text-[13px] font-normal leading-snug mt-1.5">
                * {beat.note}
              </span>
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function VoucherStoriesPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const {
    steps: flowSteps,
    current,
    direction,
    progress,
    handleTap,
  } = useStoryFlow({ initialSteps: steps, imagesLoaded: true });

  const barSegments = flowSteps.map((step, i) => ({
    key: step.id,
    isDone: i < current,
    isActive: i === current,
  }));

  const story = STORIES[current];

  return (
    <div className="fixed inset-0 max-w-md mx-auto z-[100] flex flex-col" style={{ backgroundColor: NAVY }}>
      {/* Progress bar */}
      <div className="px-3 pt-3 pb-2 z-50">
        <StoryProgressBar segments={barSegments} progress={progress} />
      </div>

      {/* Close → back to the deal intro */}
      <button
        onClick={() => navigate(`/${lang}/wallet/deal-intro`)}
        className="absolute top-3 left-3 z-[60] w-8 h-8 flex items-center justify-center"
        aria-label={isRTL ? 'סגירה' : 'Close'}
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
          close
        </span>
      </button>

      {/* "קליק להמשך" — the same white pill the signup stories use as their
          primary CTA (StoryCTABar), pinned to the bottom-left corner. Sits above
          the caption scrim and stops propagation so it doesn't also register as
          a story tap. */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/${lang}/store`);
        }}
        className="absolute bottom-6 left-4 z-[60] flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
        style={{ background: 'rgba(255,255,255,0.95)', color: NAVY, boxShadow: '0 6px 20px rgba(0,0,0,0.35)' }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '16px', fontVariationSettings: "'wght' 700" }}
        >
          chevron_left
        </span>
        קליק להמשך
      </button>

      {/* Story content */}
      <div className="flex-1 relative overflow-hidden rounded-t-2xl" onClick={handleTap}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={flowSteps[current]?.id ?? current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0"
          >
            {story && (
              <StorySlide
                key={story.id}
                story={story}
                stepNumber={current + 1}
                stepTotal={STORIES.length}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
