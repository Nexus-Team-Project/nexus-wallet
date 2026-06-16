import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { brandBgColors } from '../../utils/brandColors';
import StoreTile, { StoreNameRating } from './StoreTile';

function ArrowBubble({ onNavigate }: { onNavigate: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) setVisible(true);
        else if (!entry.isIntersecting && visible) setVisible(false);
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="flex-none flex items-center justify-center px-1">
      <button
        onClick={onNavigate}
        className="w-10 h-10 bg-sky-100 flex items-center justify-center active:scale-90"
        style={{
          opacity: visible ? 1 : 0,
          borderRadius: visible ? '50%' : '20% 50% 50% 20%',
          transform: visible ? 'none' : 'translateX(-16px) scaleX(0.2) scaleY(0.5)',
          animation: visible ? 'drip-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
        }}
      >
        <span
          className="material-symbols-outlined text-sky-600"
          style={{ fontSize: '20px' }}
        >
          chevron_left
        </span>
      </button>
    </div>
  );
}

export default function BrandSlider() {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Gentle auto-scroll (marquee) that yields fully to the user. It ping-pongs
  // between the ends; any manual scroll / drag / momentum / hover pauses it and
  // it resumes only after the activity has been idle for a moment — so it never
  // fights the user. Honours reduced-motion.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (el.scrollWidth <= el.clientWidth + 4) return; // nothing to scroll

    const STEP = 0.4; // px per frame (~24px/s) — slow drift
    let dir = isHe ? -1 : 1; // numeric direction; the bounds below handle RTL sign
    let pos = el.scrollLeft; // FLOAT accumulator — never read back (scrollLeft may round)
    let paused = false;
    let resumeTimer = 0;
    let expected = el.scrollLeft; // the (rounded) position our own write left it at
    let raf = 0;

    const scheduleResume = (delay = 2000) => {
      if (resumeTimer) clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { paused = false; pos = el.scrollLeft; }, delay);
    };
    const pauseNow = () => {
      paused = true;
      scheduleResume();
    };

    // Distinguish the user's scroll (drag / momentum / wheel) from our own
    // sub-pixel writes by comparing against the position we last set.
    const onScroll = () => {
      if (Math.abs(el.scrollLeft - expected) <= 2) return;
      pos = el.scrollLeft; // continue from where the user left it
      pauseNow();
    };
    const onPointerDown = () => pauseNow();
    const onEnter = () => { paused = true; if (resumeTimer) { clearTimeout(resumeTimer); resumeTimer = 0; } };
    const onLeave = () => scheduleResume(600);

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    const loop = () => {
      if (!paused) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        const minSL = isHe ? -maxScroll : 0;
        const maxSL = isHe ? 0 : maxScroll;
        pos += dir * STEP;
        // Ping-pong on the numeric bounds (works for both LTR and RTL).
        if (pos <= minSL) { pos = minSL; dir = 1; }
        else if (pos >= maxSL) { pos = maxSL; dir = -1; }
        el.scrollLeft = pos;
        expected = el.scrollLeft;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      if (resumeTimer) clearTimeout(resumeTimer);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [isHe]);

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-base font-bold">{isHe ? 'המותגים שלנו' : 'Our Brands'}</h3>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="px-3 py-1 rounded-md bg-sky-100 text-sky-600 text-xs font-normal hover:bg-sky-200 transition-colors active:scale-95"
        >
          {isHe ? 'הכל' : 'All'}
        </button>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar gap-4 px-5 items-center">
        {mockBusinesses.map((biz) => {
          // Prefer a single product shot (one item, cleaner + more colourful)
          // over the busier atmosphere/hero image.
          const image =
            biz.products?.find((p) => p.image)?.image ??
            biz.heroImageUrl ??
            biz.heroImages?.[0];
          return (
            <StoreTile
              key={biz.id}
              image={image}
              logoUrl={biz.logoUrl}
              bg={brandBgColors[biz.id]}
              onClick={() => navigate(`/${lang}/business/${biz.id}`)}
            >
              <StoreNameRating
                name={isHe ? biz.nameHe : biz.name}
                rating={biz.rating}
                reviewCount={biz.reviewCount}
              />
            </StoreTile>
          );
        })}

        {/* Arrow circle at the end */}
        <ArrowBubble onNavigate={() => navigate(`/${lang}/store`)} />
      </div>
    </section>
  );
}
