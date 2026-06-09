import { useMemo, useState } from 'react';
import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';
import { useTopBarBadgeStore } from '../stores/topBarBadgeStore';

type SortKey = 'recent' | 'helpful' | 'critical';

interface MockReview {
  id: string;
  author: string;
  time: string;
  timeHe: string;
  stars: number;
  title: string;
  titleHe: string;
  body: string;
  bodyHe: string;
  helpful: number;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'r1', author: 'Viktoriia', time: '11 hours ago', timeHe: 'לפני 11 שעות', stars: 5,
    title: 'The best for my skin!!', titleHe: 'הכי טוב לעור שלי!!',
    body: "I fell deeply in love with this product! It's my third time buying it and I'll definitely do it again! Leaves your skin super glowy and hydrated.",
    bodyHe: 'פשוט התאהבתי במוצר הזה! זו הפעם השלישית שאני קונה אותו ובטח אמשיך! העור שלי זוהר ולח.',
    helpful: 14,
  },
  {
    id: 'r2', author: 'Aeriel', time: '10 hours ago', timeHe: 'לפני 10 שעות', stars: 5,
    title: 'Truly a beautiful product', titleHe: 'מוצר יפהפה באמת',
    body: "This product gives me such a beautiful hydrating glow. I've tried other products and I always come back to this one.",
    bodyHe: 'המוצר נותן זוהר לח ויפה. ניסיתי אחרים אבל תמיד חוזרת לזה.',
    helpful: 9,
  },
  {
    id: 'r3', author: 'Yoav', time: '3 days ago', timeHe: 'לפני 3 ימים', stars: 4,
    title: 'Great quality, fast shipping', titleHe: 'איכות מעולה, משלוח מהיר',
    body: 'Product arrived quickly and matches the description exactly. Very happy with the purchase overall.',
    bodyHe: 'המוצר הגיע מהר ותואם בדיוק לתיאור. מרוצה מאוד מהרכישה.',
    helpful: 6,
  },
  {
    id: 'r4', author: 'Noa', time: '5 days ago', timeHe: 'לפני 5 ימים', stars: 5,
    title: 'Absolutely love it', titleHe: 'פשוט אוהבת',
    body: 'Exceeded all expectations. The texture is amazing and it absorbs quickly without any residue.',
    bodyHe: 'עבר את כל הציפיות. המרקם מדהים ונספג מהר ללא שאריות.',
    helpful: 21,
  },
  {
    id: 'r5', author: 'Dana', time: '1 week ago', timeHe: 'לפני שבוע', stars: 3,
    title: 'Good but not for everyone', titleHe: 'טוב אבל לא לכולם',
    body: 'Nice product overall, but a bit pricey for the quantity. Results are decent but not as dramatic as advertised.',
    bodyHe: 'מוצר סביר, אבל קצת יקר לכמות. התוצאות בסדר אבל לא דרמטיות כמו בפרסום.',
    helpful: 4,
  },
];

export default function BusinessReviewsPage() {
  const { businessId, productId } = useParams<{ businessId: string; productId: string }>();

  const { language } = useLanguage();
  const isHe = language === 'he';

  const business = useMemo(() => mockBusinesses.find((b) => b.id === businessId), [businessId]);
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const [sort, setSort] = useState<SortKey>('recent');
  const [helpfulMap, setHelpfulMap] = useState<Record<string, boolean>>({});
  const setBadge = useTopBarBadgeStore((s) => s.setBadge);

  useEffect(() => {
    if (!business) return;
    setBadge({
      src: business.logoUrl,
      alt: business.name,
      filter: business.id === 'biz_002' ? 'brightness(0)' : undefined,
    });
    return () => setBadge(null);
  }, [business, setBadge]);

  if (!business || !product) return <Navigate to=".." replace />;

  const productName = isHe ? product.nameHe : product.name;

  const sortedReviews = [...MOCK_REVIEWS].sort((a, b) => {
    if (sort === 'helpful') return b.helpful - a.helpful;
    if (sort === 'critical') return a.stars - b.stars;
    return 0; // 'recent' keeps insertion order
  });

  const sortLabels: Record<SortKey, string> = {
    recent:  isHe ? 'אחרונות' : 'Most recent',
    helpful: isHe ? 'הכי מועיל' : 'Most helpful',
    critical: isHe ? 'ביקורתיות' : 'Critical',
  };

  return (
    <div className="bg-white min-h-screen pb-10" dir={isHe ? 'rtl' : 'ltr'}>

      {/* ── Sub-header (sticks below the global TopBar) ── */}
      <div className="relative sticky top-[56px] z-10 bg-white/75 backdrop-blur-xl border-b border-border/40 px-5 pt-5 pb-3 overflow-visible">

        {/* Title + brand name */}
        <div className="flex items-baseline justify-between mb-0.5">
          <h1 className="text-xl font-bold text-text-primary leading-tight">
            {isHe ? 'ביקורות' : 'Reviews'}{' '}
            <span className="text-text-muted font-normal text-base">
              ({business.reviewCount.toLocaleString()})
            </span>
          </h1>
          <div className="flex items-center gap-1 shrink-0 me-1">
            <span
              className="material-symbols-rounded text-black"
              style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
            >star</span>
            <span className="text-xl font-bold text-text-primary">{business.rating.toFixed(1)}</span>
            <span className="text-sm text-text-muted font-normal">
              ({business.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>
        <p className="text-sm text-text-muted mb-3">{productName}</p>

        {/* Sort chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {(Object.keys(sortLabels) as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                sort === key
                  ? 'bg-black text-white'
                  : 'bg-surface text-text-secondary'
              }`}
            >
              {sortLabels[key]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Review list ── */}
      <div className="px-5 pt-5 space-y-8">
        {sortedReviews.map((review) => {
          const markedHelpful = helpfulMap[review.id] ?? false;
          return (
            <article key={review.id} className="pb-8 border-b border-border/40 last:border-0">
              {/* Top row: thumbnail + meta */}
              <div className="flex items-start gap-4 mb-4">
                {/* Product thumbnail */}
                <div className="w-16 h-22 bg-surface rounded-xl overflow-hidden flex-shrink-0 border border-border/40"
                  style={{ height: 88 }}>
                  <img
                    src={product.image}
                    alt={productName}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Stars + 3-dot */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`material-symbols-rounded ${s <= review.stars ? 'text-black' : 'text-gray-200'}`}
                          style={{ fontSize: 13, fontVariationSettings: s <= review.stars ? "'FILL' 1" : "'FILL' 0" }}
                        >star</span>
                      ))}
                    </div>
                    <button className="p-1 -me-1">
                      <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 20 }}>more_horiz</span>
                    </button>
                  </div>

                  {/* Author + time */}
                  <p className="text-sm text-text-muted">
                    <span className="font-semibold text-text-primary">{review.author}</span>
                    {' · '}
                    {isHe ? review.timeHe : review.time}
                  </p>

                  {/* Product name */}
                  <p className="text-sm font-medium text-text-secondary mt-0.5">{productName}</p>
                </div>
              </div>

              {/* Review body */}
              <h4 className="text-sm font-bold text-text-primary mb-1">
                {isHe ? review.titleHe : review.title}
              </h4>
              <p className="text-sm leading-relaxed text-text-secondary">
                {isHe ? review.bodyHe : review.body}
              </p>

              {/* Footer: helpful button */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setHelpfulMap((m) => ({ ...m, [review.id]: !m[review.id] }))}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors active:opacity-70 ${
                    markedHelpful ? 'text-text-primary' : 'text-text-muted'
                  }`}
                >
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: 18, fontVariationSettings: markedHelpful ? "'FILL' 1" : "'FILL' 0" }}
                  >thumb_up</span>
                  {isHe ? 'מועיל' : 'Helpful'}
                  {' '}
                  <span className="text-text-muted font-normal">
                    ({review.helpful + (markedHelpful ? 1 : 0)})
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
