import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';

// ═══════════════════════════════════════════════════════════════════════════════
// CARD ISSUANCE ONBOARDING — 3-story flow
//   Story 1: Nexus partner cards orbit showcase
//   Story 2: Value inside the card (benefits + FAQ)
//   Story 3: Card selection → continue to issuance
// ═══════════════════════════════════════════════════════════════════════════════

const STORY_COUNT = 3;
const STORY_DURATION = 15_000; // ms per auto-advance story

// ── Card orbit theme palettes ────────────────────────────────────────────────
const cardThemes: [string, string][] = [
  ['from-fuchsia-500 via-pink-500 to-orange-400', 'bg-white/20'],
  ['from-cyan-400 via-sky-500 to-indigo-600', 'bg-white/20'],
  ['from-emerald-400 via-teal-500 to-cyan-500', 'bg-white/20'],
  ['from-violet-500 via-purple-500 to-fuchsia-500', 'bg-white/20'],
  ['from-amber-300 via-orange-400 to-rose-500', 'bg-black/10'],
  ['from-lime-300 via-green-400 to-emerald-500', 'bg-black/10'],
  ['from-slate-700 via-slate-800 to-black', 'bg-white/10'],
  ['from-blue-300 via-cyan-300 to-teal-300', 'bg-black/10'],
  ['from-rose-300 via-fuchsia-400 to-violet-500', 'bg-white/20'],
  ['from-yellow-200 via-amber-300 to-orange-500', 'bg-black/10'],
  ['from-indigo-500 via-blue-500 to-cyan-400', 'bg-white/20'],
  ['from-zinc-200 via-zinc-400 to-zinc-700', 'bg-black/10'],
];

// ── Swipeable card gallery for Story 3 (Revolut-style) ───────────────────────
const CARD_WIDTH = 240;
const CARD_GAP = 20;

const cardGallery = [
  { id: 'purple', color: '#9885F0', label: 'Violet',   lightText: false },
  { id: 'coral',  color: '#EF7E8B', label: 'Coral',    lightText: false },
  { id: 'teal',   color: '#65D2AD', label: 'Mint',     lightText: true },
  { id: 'yellow', color: '#FCD860', label: 'Gold',     lightText: true },
  { id: 'slate',  color: '#8CA6C0', label: 'Steel',    lightText: false },
  { id: 'dark',   color: '#5E676F', label: 'Graphite', lightText: false },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  FLOATING CARD (orbit animation)
// ═══════════════════════════════════════════════════════════════════════════════

function NexusMark() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-white/90" />
      <div className="text-[8px] font-semibold tracking-[0.22em] text-white/90 uppercase">
        Nexus
      </div>
    </div>
  );
}

interface FloatingCardProps {
  index: number;
  total: number;
  radiusX: number;
  radiusY: number;
  duration: number;
  delay: number;
  theme: [string, string];
  tilt?: number;
  network?: string;
}

function FloatingCard({ index, total, radiusX, radiusY, duration, delay, theme, tilt = 0, network = 'VISA' }: FloatingCardProps) {
  const angle = (index / total) * Math.PI * 2;
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;
  const rotateBase = (angle * 180) / Math.PI + tilt;

  return (
    <motion.div
      className="absolute left-1/2 top-1/2"
      style={{ x, y }}
      animate={{
        x: [x, x * 1.06, x * 0.96, x],
        y: [y, y * 0.94, y * 1.07, y],
        rotate: [rotateBase, rotateBase + 8, rotateBase - 6, rotateBase],
        scale: [1, 1.05, 0.97, 1],
      }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className={`relative h-20 w-32 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br ${theme[0]} shadow-[0_12px_32px_rgba(0,0,0,0.4)]`}
      >
        <div className="absolute inset-0 opacity-80">
          <div className={`absolute left-2 top-2 h-10 w-10 rounded-full blur-2xl ${theme[1]}`} />
          <div className="absolute -right-4 bottom-0 h-16 w-20 rotate-12 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute inset-x-0 top-8 h-px bg-white/20" />
          <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2),transparent_28%)]" />
        </div>
        <div className="relative z-10 flex h-full flex-col justify-between p-2.5">
          <NexusMark />
          <div className="flex items-end justify-between">
            <div className="text-[7px] uppercase tracking-[0.18em] text-white/60">Member</div>
            <div className="text-[8px] font-semibold text-white/80">{network}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STORY 1 — PARTNER CARDS ORBIT SHOWCASE
// ═══════════════════════════════════════════════════════════════════════════════

function Story1CardsShowcase() {
  const outerCards = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: `outer-${i}`,
        index: i,
        total: 14,
        radiusX: 220 + (i % 3) * 14,
        radiusY: 340 + (i % 4) * 8,
        duration: 3.6 + (i % 3) * 0.5,
        delay: i * 0.15,
        theme: cardThemes[i % cardThemes.length],
        tilt: i % 2 === 0 ? -12 : 10,
        network: i % 4 === 0 ? 'MC' : 'VISA',
      })),
    [],
  );

  const innerCards = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: `inner-${i}`,
        index: i,
        total: 10,
        radiusX: 130 + (i % 2) * 14,
        radiusY: 210 + (i % 3) * 10,
        duration: 2.8 + (i % 3) * 0.45,
        delay: i * 0.12,
        theme: cardThemes[(i + 5) % cardThemes.length],
        tilt: i % 2 === 0 ? 6 : -8,
        network: i % 3 === 0 ? 'MC' : 'VISA',
      })),
    [],
  );

  const words = useMemo(() => ['Discover', 'Premium', 'Partner', 'Cards'], []);
  const [wordIdx, setWordIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWordIdx((p) => (p + 1) % words.length), 2200);
    return () => clearInterval(id);
  }, [words.length]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06),transparent_28%),radial-gradient(circle_at_20%_10%,rgba(139,92,246,0.22),transparent_26%),radial-gradient(circle_at_80%_15%,rgba(236,72,153,0.15),transparent_22%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,0.15),transparent_28%)]" />

      {/* Border glow */}
      <div className="pointer-events-none absolute inset-3 rounded-[2rem] border border-white/10 shadow-[0_0_80px_rgba(168,85,247,0.15)]" />

      {/* Outer orbit — clockwise */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      >
        {outerCards.map((c) => (
          <FloatingCard key={c.id} {...c} />
        ))}
      </motion.div>

      {/* Inner orbit — counter-clockwise */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: -360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        {innerCards.map((c) => (
          <FloatingCard key={c.id} {...c} />
        ))}
      </motion.div>

      {/* Centre word morph */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={words[wordIdx]}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 backdrop-blur-sm"
          >
            <div className="text-center text-3xl font-semibold tracking-tight md:text-5xl">
              {words[wordIdx]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom tagline */}
      <div className="absolute bottom-14 left-0 right-0 px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-white/50 tracking-wide"
        >
          A premium card experience built for your community
        </motion.p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STORY 2 — VALUE INSIDE THE CARD
// ═══════════════════════════════════════════════════════════════════════════════

const benefits = [
  { icon: 'account_balance_wallet', title: 'Extra credit flexibility', desc: 'An additional non-bank credit line for everyday spending' },
  { icon: 'language', title: 'Better terms abroad', desc: 'Preferred billing on international and online purchases' },
  { icon: 'currency_exchange', title: 'Foreign currency advantages', desc: 'Deferred foreign charges and better conversion terms' },
  { icon: 'savings', title: 'Cashback rewards', desc: '2%–5% cashback at selected partner merchants' },
];

const faqItems = [
  { q: 'What do I get with this card?', a: 'An additional credit line, cashback at selected merchants, preferred terms for international purchases, and more — all in one card.' },
  { q: 'How is this different from my regular card?', a: 'This is a dedicated club card with benefits tailored to your community, including non-bank credit and preferred billing terms.' },
  { q: 'Can I use it abroad and online?', a: 'Yes. The card works for international purchases and online shopping with preferential terms on foreign currency transactions.' },
  { q: 'Are all benefits always available?', a: 'Benefits are subject to the terms of your club arrangement. Most benefits are available immediately upon card issuance.' },
];

function Story2ValueProposition() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-gray-900">
      <div className="mx-auto max-w-lg px-6 pb-28 pt-10">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-bold leading-snug tracking-tight text-gray-900">
            A card that gives you more
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Unlock benefits designed to make everyday spending smarter and more rewarding.
          </p>
        </motion.div>

        {/* Benefits */}
        <div className="mt-8 space-y-4">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
              className="flex items-start gap-4 rounded-2xl bg-gray-50 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#635bff]/10">
                <span
                  className="material-symbols-outlined text-[#635bff]"
                  style={{ fontSize: '22px' }}
                >
                  {b.icon}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{b.title}</p>
                <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.45 }}
          className="mt-10"
        >
          <h3 className="text-base font-bold text-gray-900 mb-3">Frequently asked questions</h3>
          <div className="space-y-2">
            {faqItems.map((f, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFaq(openFaq === i ? null : i);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-gray-800">{f.q}</span>
                  <span
                    className="material-symbols-outlined text-gray-400 transition-transform"
                    style={{
                      fontSize: '18px',
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                    }}
                  >
                    expand_more
                  </span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="px-4 pb-3 text-xs text-gray-500 leading-relaxed">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-[10px] text-gray-400 leading-relaxed text-center"
        >
          Benefits, eligibility, and terms are subject to the organization's applicable arrangement and terms.
        </motion.p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  STORY 3 — CARD SELECTION
// ═══════════════════════════════════════════════════════════════════════════════

function CardFace({ card, scale = 1 }: { card: typeof cardGallery[number]; scale?: number }) {
  const light = card.lightText;
  const textCls = light ? 'text-gray-900' : 'text-white';

  return (
    <div
      className="relative rounded-3xl flex flex-col items-center justify-between p-7 select-none"
      style={{
        width: CARD_WIDTH * scale,
        aspectRatio: '1 / 1.58',
        backgroundColor: card.color,
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* Top — vertical branding */}
      <div className="w-full flex justify-end">
        <span
          className={`text-3xl font-bold tracking-tight ${textCls} ${light ? 'opacity-70' : 'opacity-90'}`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Nexus
        </span>
      </div>

      {/* Bottom — MC logo + label */}
      <div className="w-full flex justify-between items-end">
        <div className="relative w-10 h-7">
          <div className={`absolute left-0 w-7 h-7 rounded-full bg-[#EB001B] ${light ? 'opacity-70' : 'opacity-80'}`} />
          <div className={`absolute right-0 w-7 h-7 rounded-full bg-[#F79E1B] ${light ? 'opacity-70' : 'opacity-80'}`} />
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-widest ${textCls} ${light ? 'opacity-50' : 'opacity-80'}`}
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Virtual
        </span>
      </div>

      {/* Ghosted card number */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.08 }}>
        <span className="text-sm font-mono tracking-tighter text-black" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          **** **** **** 0842
        </span>
      </div>

      {/* Sheen */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 50%, rgba(255,255,255,0.06) 100%)' }}
      />
    </div>
  );
}

function Story3CardSelection({ onContinue }: { onContinue: () => void }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const dragX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalCards = cardGallery.length;
  const slideWidth = CARD_WIDTH + CARD_GAP;

  const snapTo = (idx: number) => {
    setActiveIdx(Math.max(0, Math.min(idx, totalCards - 1)));
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipe = info.offset.x + info.velocity.x * 0.3;
    if (swipe < -50) {
      snapTo(activeIdx + 1);
    } else if (swipe > 50) {
      snapTo(activeIdx - 1);
    }
  };

  const activeCard = cardGallery[activeIdx];

  return (
    <div className="h-full w-full flex flex-col bg-white text-gray-900">
      {/* Main content — vertically centered */}
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">

        {/* Swipeable card carousel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          ref={containerRef}
          className="relative w-full"
          style={{ height: CARD_WIDTH * 1.58 + 20 }}
        >
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            animate={{ x: -activeIdx * slideWidth }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute flex items-center"
            style={{
              left: '50%',
              marginLeft: -(CARD_WIDTH / 2),
              gap: CARD_GAP,
              touchAction: 'pan-y',
              cursor: 'grab',
            }}
          >
            {cardGallery.map((card, i) => {
              const isActive = i === activeIdx;
              return (
                <motion.div
                  key={card.id}
                  animate={{
                    scale: isActive ? 1 : 0.88,
                    opacity: isActive ? 1 : 0.5,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="shrink-0"
                  style={{ width: CARD_WIDTH }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isActive) snapTo(i);
                  }}
                >
                  <CardFace card={card} />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Card name + description */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 text-center px-8"
        >
          <AnimatePresence mode="wait">
            <motion.h1
              key={activeCard.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-bold text-gray-900"
            >
              {activeCard.label}
            </motion.h1>
          </AnimatePresence>
          <p className="mt-3 text-gray-500 text-sm leading-relaxed max-w-[280px] mx-auto">
            Instantly create your virtual club card to unlock benefits, manage spending, and start using it right away.
          </p>
        </motion.div>

        {/* Dot indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-6 flex items-center justify-center gap-2"
        >
          {cardGallery.map((c, i) => (
            <button
              key={c.id}
              onClick={(e) => {
                e.stopPropagation();
                snapTo(i);
              }}
              className="transition-all duration-300"
              style={{
                width: i === activeIdx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === activeIdx ? c.color : '#e5e7eb',
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Sticky CTA footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-8 pt-4 pb-8 bg-white z-40"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContinue();
          }}
          className="w-full py-4 rounded-full bg-[#635bff] text-white font-semibold text-sm tracking-wide active:scale-[0.98] transition-all"
          style={{ boxShadow: '0 10px 20px rgba(99, 91, 255, 0.3)' }}
        >
          Get your club card for FREE
        </button>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE — Instagram-style story container
// ═══════════════════════════════════════════════════════════════════════════════

export default function CardIssuanceStoriesPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [currentStory, setCurrentStory] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef(Date.now());

  // Stories 2 & 3 are interactive (scrollable / tappable) — no auto-advance
  const isInteractive = currentStory >= 1;

  const goToStory = useCallback(
    (index: number) => {
      if (index >= STORY_COUNT) {
        navigate(`/${lang}/wallet`);
        return;
      }
      if (index < 0) return;
      setCurrentStory(index);
      setProgress(0);
      startTimeRef.current = Date.now();
    },
    [lang, navigate],
  );

  // Auto-advance timer for Story 1 only
  useEffect(() => {
    if (isInteractive) {
      setProgress(1);
      return;
    }

    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        goToStory(currentStory + 1);
      } else {
        timerRef.current = requestAnimationFrame(tick);
      }
    };

    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [currentStory, goToStory, isInteractive]);

  // Tap left/right to navigate (only on non-interactive stories)
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goToStory(currentStory - 1);
    } else if (x > (rect.width * 2) / 3) {
      goToStory(currentStory + 1);
    }
  };

  const handleContinueToIssuance = () => {
    navigate(`/${lang}/wallet`);
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col">
      {/* Progress bars */}
      <div className="flex gap-1 px-3 pt-3 pb-2 z-50">
        {Array.from({ length: STORY_COUNT }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[3px] rounded-full overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          >
            <motion.div
              className="h-full rounded-full bg-white"
              style={{
                width:
                  i < currentStory
                    ? '100%'
                    : i === currentStory
                      ? `${progress * 100}%`
                      : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={() => navigate(`/${lang}`)}
        className="absolute top-3 left-3 z-50 w-8 h-8 flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
          close
        </span>
      </button>

      {/* Story content */}
      <div
        className="flex-1 relative overflow-hidden rounded-t-2xl"
        onClick={!isInteractive ? handleTap : undefined}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {currentStory === 0 && <Story1CardsShowcase />}
            {currentStory === 1 && <Story2ValueProposition />}
            {currentStory === 2 && <Story3CardSelection onContinue={handleContinueToIssuance} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows for interactive stories */}
      {isInteractive && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-4 z-50 pointer-events-none">
          {currentStory > 0 && (
            <button
              onClick={() => goToStory(currentStory - 1)}
              className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                chevron_left
              </span>
            </button>
          )}
          <div /> {/* spacer */}
          {currentStory < STORY_COUNT - 1 && (
            <button
              onClick={() => goToStory(currentStory + 1)}
              className="pointer-events-auto w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>
                chevron_right
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
