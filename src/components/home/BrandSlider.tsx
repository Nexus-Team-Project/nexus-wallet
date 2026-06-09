import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { mockBusinesses } from '../../mock/data/businesses.mock';
import { brandBgColors, FULL_BLEED_LOGOS } from '../../utils/brandColors';

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

      <div className="flex overflow-x-auto hide-scrollbar gap-4 px-5 items-center">
        {mockBusinesses.map((biz) => (
          <button
            key={biz.id}
            onClick={() => navigate(`/${lang}/business/${biz.id}`)}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform duration-100"
          >
            <div
              className="w-[60px] h-[60px] rounded-full overflow-hidden shadow-sm flex items-center justify-center"
              style={{ backgroundColor: brandBgColors[biz.id] || '#FFFFFF' }}
            >
              {biz.logoUrl ? (
                <img src={biz.logoUrl} alt={biz.name} className={FULL_BLEED_LOGOS.has(biz.id) ? 'w-full h-full object-cover' : 'w-[85%] h-[85%] object-contain'} />
              ) : (
                <span className="text-2xl">{biz.logo}</span>
              )}
            </div>
            <span className="text-[10px] font-semibold text-text-primary leading-tight text-center max-w-[60px] line-clamp-1">
              {isHe ? biz.nameHe : biz.name}
            </span>
          </button>
        ))}

        {/* Arrow circle at the end */}
        <ArrowBubble onNavigate={() => navigate(`/${lang}/store`)} />
      </div>
    </section>
  );
}
