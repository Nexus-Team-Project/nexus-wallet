import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';

interface BaseSlide {
  icon: string;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  titleKey: 'heroBannerTitle' | 'heroBannerTitle2' | 'heroBannerTitle3' | 'heroBannerTitleWallet' | 'heroBannerTitleInsights';
  type?: 'wallet' | 'insights';
}

interface TenantSlide {
  type: 'tenant';
}

type Slide = BaseSlide | TenantSlide;

const baseSlides: BaseSlide[] = [
  {
    icon: 'wallet',
    gradientFrom: 'from-primary',
    gradientVia: 'via-primary-dark',
    gradientTo: 'to-bg-dark',
    titleKey: 'heroBannerTitle',
  },
  {
    icon: 'account_balance_wallet',
    gradientFrom: 'from-indigo-600',
    gradientVia: 'via-violet-700',
    gradientTo: 'to-slate-900',
    titleKey: 'heroBannerTitleWallet',
    type: 'wallet',
  },
  {
    icon: 'redeem',
    gradientFrom: 'from-emerald-500',
    gradientVia: 'via-teal-600',
    gradientTo: 'to-cyan-800',
    titleKey: 'heroBannerTitle2',
  },
  {
    icon: 'local_offer',
    gradientFrom: 'from-orange-400',
    gradientVia: 'via-rose-500',
    gradientTo: 'to-pink-700',
    titleKey: 'heroBannerTitle3',
  },
  {
    icon: 'insights',
    gradientFrom: 'from-violet-600',
    gradientVia: 'via-purple-700',
    gradientTo: 'to-indigo-900',
    titleKey: 'heroBannerTitleInsights',
    type: 'insights',
  },
];

// ── Wallet phone mockup cards ──
const WALLET_CARDS = [
  { name: "Golf & Co",      logo: "/brands/golf.png",           bg: "#FFF59D", logoW: 40, logoH: 26 },
  { name: "American Eagle", logo: "/brands/american-eagle.png", bg: "#1a3a7a", logoW: 56, logoH: 36 },
  { name: "Rami Levy",      logo: "/brands/rami-levy.png",      bg: "#B3171D", logoW: 56, logoH: 36 },
  { name: "Mango",          logo: "/brands/mango.png",          bg: "#FFFFFF", logoW: 70, logoH: 42 },
  { name: "Foot Locker",    logo: "/brands/foot-locker.png",    bg: "#D3D3D3", logoW: 56, logoH: 36 },
  { name: "+",              logo: "",                            bg: "rgba(255,255,255,0.08)", logoW: 0, logoH: 0 },
];

// ── Insights mini expense cards ──
const INSIGHT_CARDS = [
  { title: 'אוכל בחוץ',  icon: '🍔', amount: 2434, saved: 332, color: '#d4d0f6' },
  { title: 'ביגוד',       icon: '👗', amount: 480,  saved: 422, color: '#c7f5d4' },
  { title: 'סופר',        icon: '🥑', amount: 1800, saved: 280, color: '#fde68a' },
];

const AUTO_PLAY_INTERVAL = 4000;

export default function HeroBanner() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const tenantConfig = useTenantStore((s) => s.config);
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const slides: Slide[] = useMemo(
    () => (tenantConfig ? [{ type: 'tenant' as const }, ...baseSlides] : baseSlides),
    [tenantConfig],
  );

  const tenantName = tenantConfig
    ? (language === 'he' ? tenantConfig.nameHe : tenantConfig.name)
    : '';

  const resetAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, AUTO_PLAY_INTERVAL);
    }
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
    resetAutoPlay();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left → next slide
        goToSlide((current + 1) % slides.length);
      } else {
        // Swiped right → prev slide
        goToSlide((current - 1 + slides.length) % slides.length);
      }
    }
  };

  // Auto-play
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
      }, AUTO_PLAY_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const getTitle = (key: string) => {
    const titles = t.home as Record<string, string>;
    return titles[key] || t.home.heroBannerTitle;
  };

  const slide = slides[current] ?? slides[0];

  return (
    <section className="mb-5 px-4">
      {/* Single banner container */}
      <div
        className="relative w-full rounded-xl overflow-hidden touch-pan-y"
        style={{ height: '220px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides — stacked, crossfade */}
        {slides.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {s.type === 'tenant' && tenantConfig ? (
              /* ── Tenant branding slide ── */
              <>
                {/* Background — tenant primaryColor gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(120% 120% at 30% 20%, ${tenantConfig.primaryColor}44, transparent 60%), linear-gradient(135deg, ${tenantConfig.primaryColor}cc 0%, ${tenantConfig.primaryColor} 40%, #0a0b14 100%)`,
                  }}
                />

                {/* Watermark logo — large, semi-transparent, filling the banner */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ opacity: 0.10 }}
                >
                  <img
                    src={tenantConfig.logo}
                    alt=""
                    className="w-[280px] h-[280px] object-contain"
                    style={{ filter: 'brightness(2) grayscale(0.3)' }}
                  />
                </div>

                {/* Glow behind crisp logo */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: '15%',
                    right: '8%',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: `${tenantConfig.primaryColor}55`,
                    filter: 'blur(40px)',
                  }}
                />

                {/* Crisp logo badge — top area */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    top: 20,
                    right: 20,
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.95)',
                    boxShadow: `0 8px 32px ${tenantConfig.primaryColor}40, 0 2px 8px rgba(0,0,0,0.12)`,
                    border: '2px solid rgba(255,255,255,0.8)',
                  }}
                >
                  <img
                    src={tenantConfig.logo}
                    alt={tenantName}
                    className="w-9 h-9 object-contain"
                  />
                </div>

                {/* Nexus co-brand badge — small, next to tenant logo */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    top: 52,
                    right: 12,
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: 'rgba(255,255,255,0.90)',
                    border: '1.5px solid rgba(255,255,255,0.6)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}
                >
                  <img src="/nexus-logo.png" alt="Nexus" className="w-3.5 h-3.5 object-contain rounded-full" />
                </div>

                {/* Dot grid overlay — subtle texture */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    maskImage: 'radial-gradient(80% 70% at 50% 30%, black 20%, transparent 70%)',
                    opacity: 0.6,
                  }}
                />

                {/* Diagonal shine stripe */}
                <div
                  className="absolute inset-0 pointer-events-none overflow-hidden"
                >
                  <div
                    className="absolute"
                    style={{
                      top: -40,
                      left: '60%',
                      width: 80,
                      height: 300,
                      background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.04), transparent)',
                      transform: 'rotate(25deg)',
                    }}
                  />
                </div>
              </>
            ) : s.type === 'insights' ? (
              /* ── Insights slide: purple bg + floating expense cards ── */
              <>
                <div
                  className="w-full h-full"
                  style={{
                    background: 'radial-gradient(120% 120% at 30% 20%, rgba(139,92,246,0.25), transparent 55%), linear-gradient(135deg, #1e1145, #2d1b69 40%, #0f0a2a)',
                  }}
                />

                {/* Animated blob — rotating organic shape */}
                <svg
                  className="absolute pointer-events-none"
                  style={{ top: -10, right: -20, width: 140, height: 140, opacity: 0.12 }}
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M50 6 C61 6,70 13,76 22 C86 27,95 37,92 50 C95 62,86 72,76 78 C70 87,61 94,50 92 C39 94,30 87,24 78 C14 72,5 62,8 50 C5 37,14 27,24 22 C30 13,39 6,50 6Z"
                    fill="#a78bfa"
                  />
                </svg>

                {/* Stacked mini expense cards */}
                <div
                  className="absolute pointer-events-none"
                  style={{ top: 18, left: '50%', transform: 'translateX(-50%)' }}
                >
                  {INSIGHT_CARDS.map((card, i) => (
                    <div
                      key={card.title}
                      className="relative flex items-center gap-2 px-3 py-2 mb-1.5"
                      style={{
                        width: 190,
                        borderRadius: 12,
                        background: 'rgba(255,255,255,0.95)',
                        boxShadow: `0 ${4 + i * 2}px ${12 + i * 4}px rgba(0,0,0,0.15)`,
                        transform: `rotate(${i === 0 ? -2 : i === 2 ? 2 : 0}deg) translateX(${i === 0 ? -6 : i === 2 ? 6 : 0}px)`,
                      }}
                    >
                      {/* Category icon chip */}
                      <div
                        className="flex-shrink-0 grid place-items-center text-xs"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: card.color,
                        }}
                      >
                        {card.icon}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-semibold text-gray-800 leading-tight">{card.title}</div>
                        <div className="text-[8px] text-gray-400">₪{card.amount.toLocaleString()}</div>
                      </div>
                      {/* Cashback badge */}
                      <div
                        className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}
                      >
                        +₪{card.saved}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Glow behind cards */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    top: 40,
                    width: 200,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(139,92,246,0.25)',
                    filter: 'blur(30px)',
                  }}
                />

                {/* Dot grid overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '18px 18px',
                    maskImage: 'radial-gradient(70% 55% at 50% 30%, black 25%, transparent 70%)',
                    opacity: 0.5,
                  }}
                />
              </>
            ) : s.type === 'wallet' ? (
              /* ── Wallet slide: dark bg + phone mockup ── */
              <>
                <div
                  className="w-full h-full"
                  style={{
                    background: 'radial-gradient(120% 120% at 40% 20%, rgba(99,91,255,0.22), transparent 55%), linear-gradient(135deg, #0a0b14, #121535 60%, #0d0820)',
                  }}
                />

                {/* Phone frame — enlarged, bottom-anchored, only top peeks */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    width: 200,
                    bottom: -200,
                    aspectRatio: '9 / 18.8',
                    borderRadius: 28,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #0b0f1a',
                    padding: 6,
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 -12px 50px rgba(99,91,255,0.30)',
                  }}
                >
                  {/* Inner highlight */}
                  <div
                    className="absolute pointer-events-none"
                    style={{ inset: 5, borderRadius: 23, border: '1px solid rgba(255,255,255,0.08)' }}
                  />

                  {/* Screen */}
                  <div
                    className="w-full h-full relative overflow-hidden"
                    style={{
                      borderRadius: 22,
                      background: 'radial-gradient(120% 120% at 40% 20%, rgba(99,91,255,0.18), transparent 55%), linear-gradient(180deg, #0a0b14, #121535)',
                    }}
                  >
                    {/* Notch */}
                    <div
                      className="absolute top-1.5 left-1/2 -translate-x-1/2 z-10"
                      style={{
                        width: 72, height: 16,
                        background: 'rgba(0,0,0,0.55)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '0 0 10px 10px',
                      }}
                    />

                    {/* Top bar */}
                    <div
                      className="absolute top-6 left-2.5 right-2.5 flex items-center justify-between z-10"
                      style={{ color: 'rgba(255,255,255,0.9)' }}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="grid place-items-center"
                          style={{
                            width: 15, height: 15, borderRadius: 999,
                            background: 'rgba(255,255,255,0.12)',
                            fontSize: 7,
                          }}
                        >
                          👤
                        </div>
                        <span className="text-[8px] font-semibold">Wallet</span>
                      </div>
                      <div className="flex gap-1">
                        {["⋯", "⤴"].map((icon, i) => (
                          <div
                            key={i}
                            className="grid place-items-center"
                            style={{
                              width: 18, height: 18, borderRadius: 999,
                              border: '1px solid rgba(255,255,255,0.10)',
                              background: 'rgba(255,255,255,0.06)',
                              fontSize: 8, color: 'rgba(255,255,255,0.85)',
                            }}
                          >
                            {icon}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cards grid */}
                    <div
                      className="absolute left-2 right-2 grid grid-cols-2 gap-1.5"
                      style={{ top: 42, alignContent: 'start' }}
                    >
                      {WALLET_CARDS.map((card) => (
                        <div
                          key={card.name}
                          className="relative overflow-hidden flex items-center justify-center"
                          style={{
                            height: 46,
                            borderRadius: 9,
                            background: card.bg,
                            border: card.logo ? '1px solid rgba(255,255,255,0.10)' : '1px dashed rgba(255,255,255,0.18)',
                            boxShadow: card.logo ? '0 5px 12px rgba(0,0,0,0.18)' : 'none',
                          }}
                        >
                          {card.logo ? (
                            <img
                              src={card.logo}
                              alt={card.name}
                              className="object-contain relative z-[1]"
                              style={{ width: card.logoW, maxHeight: card.logoH }}
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="grid place-items-center"
                              style={{
                                width: 22, height: 22, borderRadius: 999,
                                background: 'rgba(255,255,255,0.10)',
                                border: '1px solid rgba(255,255,255,0.14)',
                                fontSize: 13, color: 'rgba(255,255,255,0.9)',
                              }}
                            >
                              +
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Dot grid overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                        maskImage: 'radial-gradient(70% 55% at 50% 25%, black 25%, transparent 70%)',
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>

                {/* Subtle glow behind phone top */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{
                    bottom: 30,
                    width: 240, height: 120,
                    borderRadius: '50%',
                    background: 'rgba(99,91,255,0.20)',
                    filter: 'blur(30px)',
                  }}
                />
              </>
            ) : (
              /* ── Default slide: gradient + icon ── */
              <>
                <div className={`w-full h-full bg-gradient-to-br ${(s as BaseSlide).gradientFrom} ${(s as BaseSlide).gradientVia} ${(s as BaseSlide).gradientTo}`} />

                {/* Decorative blurs */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-[10%] right-[8%] w-24 h-24 rounded-full bg-white/10 blur-xl" />
                  <div className="absolute bottom-[15%] left-[5%] w-20 h-20 rounded-full bg-white/15 blur-lg" />
                </div>

                {/* Icon */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                  <span
                    className="material-symbols-outlined text-white/15"
                    style={{ fontSize: '90px', fontVariationSettings: "'FILL' 1" }}
                  >
                    {(s as BaseSlide).icon}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Bottom overlay — always on top */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-5">
          {slide.type === 'tenant' && tenantConfig ? (
            <>
              <h2 className="text-white text-xl font-bold leading-snug mb-0.5">
                {language === 'he'
                  ? `מועדון ${tenantConfig.nameHe}`
                  : `${tenantConfig.name} Club`}
              </h2>
              <p className="text-white/75 text-xs mb-2">
                {t.home.heroBannerTenantSub}
              </p>
              <button
                onClick={() => navigate(`/${lang}/store`)}
                className="px-5 py-2.5 rounded-full font-bold text-xs w-max hover:brightness-105 transition-all"
                style={{
                  background: 'white',
                  color: tenantConfig.primaryColor,
                }}
              >
                {t.home.heroBannerTenantCta}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-white text-xl font-bold leading-snug mb-1 whitespace-pre-line">
                {getTitle((slide as BaseSlide).titleKey)}
              </h2>
              {slide.type === 'wallet' && (
                <p className="text-white/70 text-xs mb-2">
                  {language === 'he' ? 'שלם בחנות בלי כאב ראש' : 'Pay in store, hassle-free'}
                </p>
              )}
              {slide.type === 'insights' && (
                <p className="text-white/70 text-xs mb-2">
                  {t.home.heroBannerInsightsSub}
                </p>
              )}
              {!slide.type && <div className="mb-2" />}
              <button
                onClick={() => navigate(
                  slide.type === 'wallet'
                    ? `/${lang}/wallet`
                    : slide.type === 'insights'
                      ? `/${lang}/auth-flow/new-user?step=story-insights&flow=new-user`
                      : `/${lang}/store`
                )}
                className="bg-white text-text-primary px-5 py-2.5 rounded-full font-bold text-xs w-max hover:brightness-105 transition-all"
              >
                {slide.type === 'insights' ? t.home.heroBannerInsightsCta : t.home.heroBannerCta}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Controls: Play/Pause (LEFT) + Dots */}
      <div className="flex items-center justify-center gap-3 mt-3">
        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`rounded-full transition-all duration-300 ${
                idx === current
                  ? 'w-5 h-2 bg-primary'
                  : 'w-2 h-2 bg-border'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Play/Pause button — on the left side */}
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-border transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <span
            className="material-symbols-outlined text-text-muted"
            style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}
          >
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>
      </div>
    </section>
  );
}
