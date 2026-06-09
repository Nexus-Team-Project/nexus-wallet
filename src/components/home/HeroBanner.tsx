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
  type?: 'wallet' | 'insights' | 'referral' | 'map';
}

// ── Map tile helpers (mirrors NearYou's teaser map) ──
function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = 2 ** zoom;
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

// 3×3 grid of CARTO voyager tiles around Tel Aviv center, used as a decorative
// map backdrop for the "cashback around you" hero slide.
const MAP_CENTER = { lat: 32.0853, lng: 34.7818 };
const MAP_TILES = (() => {
  const zoom = 16;
  const { x, y } = latLngToTile(MAP_CENTER.lat, MAP_CENTER.lng, zoom);
  const tileX = Math.floor(x);
  const tileY = Math.floor(y);
  const tiles: { url: string; x: number; y: number }[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({
        url: `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tileX + dx}/${tileY + dy}@2x.png`,
        x: dx,
        y: dy,
      });
    }
  }
  return tiles;
})();

// Brand logos shown as an overlapping cluster on the right of the map slide.
const MAP_BRANDS = [
  { src: '/brands/mcdonalds.png', bg: '#FFFFFF' },
  { src: '/brands/carrefour.png', bg: '#FFFFFF' },
  { src: '/brands/aroma.png', bg: '#000000' },
];

// Friend portraits — same face-cropped Unsplash set used by the referral page
// and home banner, so the carousel slide reads as a preview of that flow.
const AV = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=120&h=120&fit=crop&crop=faces&q=80`;
const REFERRAL_AVATARS = [
  AV('1494790108377-be9c29b29330'), // woman
  AV('1500648767791-00dcc994a43e'), // man
  AV('1534528741775-53994a69daeb'), // woman
];

interface TenantSlide {
  type: 'tenant';
}

type Slide = BaseSlide | TenantSlide;

const baseSlides: BaseSlide[] = [
  {
    icon: 'account_balance_wallet',
    gradientFrom: 'from-indigo-600',
    gradientVia: 'via-violet-700',
    gradientTo: 'to-slate-900',
    titleKey: 'heroBannerTitleWallet',
    type: 'wallet',
  },
  {
    icon: 'location_on',
    gradientFrom: 'from-emerald-400',
    gradientVia: 'via-teal-500',
    gradientTo: 'to-cyan-700',
    titleKey: 'heroBannerTitle', // unused — map slide has its own overlay branch
    type: 'map',
  },
  {
    icon: 'card_giftcard',
    gradientFrom: 'from-sky-400',
    gradientVia: 'via-sky-500',
    gradientTo: 'to-[#0a2540]',
    titleKey: 'heroBannerTitle', // unused for referral (own overlay branch)
    type: 'referral',
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
            ) : s.type === 'referral' ? (
              /* ── Referral slide: navy bg + friend avatars (matches the
                   referral page / banner) ── */
              <>
                <div
                  className="w-full h-full"
                  style={{
                    background:
                      'radial-gradient(120% 120% at 30% 20%, rgba(125,211,252,0.28), transparent 55%), linear-gradient(135deg, #0a2540, #0a2540 55%, #06182b)',
                  }}
                />

                {/* Glow behind avatars */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                  style={{ bottom: 8, width: 190, height: 96, borderRadius: '50%', background: 'rgba(125,211,252,0.28)', filter: 'blur(36px)' }}
                />

                {/* Friend-avatar cluster — pinned to the right, larger, sits
                    directly on the navy (no white card behind it). */}
                <div className="absolute bottom-6 right-5">
                  <div className="flex -space-x-5 relative">
                    {REFERRAL_AVATARS.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover border-2 border-white"
                      />
                    ))}
                    {/* Sky-blue share badge */}
                    <div className="absolute -top-1 -right-2 w-8 h-8 bg-[#7dd3fc] rounded-full border-2 border-white flex items-center justify-center text-[#0a2540]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H4.5a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.5v15m7.5-7.5H4.5M12 4.5a3 3 0 110 6 3 3 0 110-6z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>

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
            ) : s.type === 'map' ? (
              /* ── Map slide: CARTO tiles + scattered brand circles ── */
              <>
                <div className="absolute inset-0 overflow-hidden bg-gray-100">
                  {/* Tile grid — centered on Tel Aviv. Keyed on `current` so the
                      satellite zoom-in restarts each time this slide activates. */}
                  <div
                    key={`map-tiles-${idx === current ? current : 'idle'}`}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: 768,
                      height: 768,
                      transform: 'translate(-50%, -50%)',
                      animation: idx === current ? 'satellite-zoom 1.5s cubic-bezier(0.22, 1, 0.36, 1) both' : 'none',
                    }}
                  >
                    {MAP_TILES.map((tile) => (
                      <img
                        key={tile.url}
                        src={tile.url}
                        alt=""
                        width={256}
                        height={256}
                        loading="lazy"
                        className="absolute"
                        style={{ left: `${(tile.x + 1) * 256}px`, top: `${(tile.y + 1) * 256}px` }}
                      />
                    ))}
                  </div>

                  {/* Lighten the map so white overlay text stays legible */}
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />

                  {/* Brand cluster — overlapping circles pinned to bottom-right */}
                  <div
                    className="absolute z-10"
                    style={{ bottom: 16, right: 18 }}
                  >
                    <div className="flex -space-x-4">
                      {MAP_BRANDS.map((brand, i) => (
                        <div
                          key={brand.src}
                          className="w-14 h-14 rounded-full shadow-lg border-2 border-white flex items-center justify-center overflow-hidden"
                          style={{ backgroundColor: brand.bg, zIndex: MAP_BRANDS.length - i }}
                        >
                          <img src={brand.src} alt="" className="w-[70%] h-[70%] object-contain" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
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

        {/* Text overlay — always on top. Referral slide anchors its text to the
            TOP (matching the promo card); all others anchor to the bottom. */}
        <div
          className={`absolute inset-0 z-20 flex flex-col p-5 ${
            slide.type === 'referral'
              ? 'justify-between bg-gradient-to-b from-black/40 via-transparent to-transparent'
              : slide.type === 'map'
                ? 'bg-gradient-to-b from-black/45 via-transparent to-black/40'
                : 'justify-end bg-gradient-to-t from-black/50 via-transparent to-transparent'
          }`}
        >
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
          ) : slide.type === 'referral' ? (
            <>
              <h2 className="text-[#7dd3fc] text-2xl font-black tracking-tighter leading-tight mb-2.5 flex items-center gap-1.5 flex-wrap">
                <span>שתפו את</span>
                <span className="inline-flex items-center bg-sky-300 rounded-xl px-2.5 py-1 overflow-hidden">
                  <img
                    src="/nexus-logo-black.png"
                    alt="נקסוס"
                    className="h-7 w-auto object-contain"
                    style={{ transform: 'scale(1.5)' }}
                  />
                </span>
                <span>וקבלו 100 ₪</span>
              </h2>
              <button
                onClick={() => navigate(`/${lang}/referral-stories`)}
                className="self-end bg-[#7dd3fc] text-[#0a2540] px-6 py-2.5 rounded-full font-bold text-xs w-max hover:brightness-105 transition-all"
              >
                שתפו עכשיו
              </button>
            </>
          ) : slide.type === 'map' ? (
            <>
              {/* Text — top-right */}
              <div className="absolute top-4 right-5 text-right max-w-[62%]">
                <h2 className="text-white text-xl font-bold leading-snug drop-shadow-md">
                  {language === 'he' ? 'מצא קאשבק מסביבך' : 'Find cashback around you'}
                </h2>
                <p className="text-white/85 text-xs mt-1 drop-shadow">
                  {language === 'he' ? 'הטבות מהעסקים הקרובים אליך' : 'Deals from businesses near you'}
                </p>
              </div>
              {/* Button — bottom-left */}
              <button
                onClick={() => navigate(`/${lang}/near-you-map`)}
                className="absolute bottom-4 left-5 bg-white text-text-primary px-5 py-2.5 rounded-full font-bold text-xs w-max hover:brightness-105 transition-all"
              >
                {language === 'he' ? 'גלה עכשיו' : 'Explore now'}
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
