import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../../types/search.types';

interface ProductPagerProps {
  items: Product[];
  /** Items per page (default 4 → 2×2). */
  per?: number;
  renderItem: (item: Product) => ReactNode;
  /** Grid classes for each page. */
  gridClassName?: string;
  /** Extra classes for the pager wrapper (e.g. bottom margin). */
  className?: string;
  /** Page-dot colours (Tailwind bg-*). */
  dotActive?: string;
  dotInactive?: string;
}

/**
 * ProductPager — a DISCRETE product pager shared by the store cards. Each swipe
 * (mouse drag or touch) brings the next full batch of `per` items; a short last
 * batch is completed from the start so a partial batch is never shown. With a
 * single page, dragging rubber-bands and snaps back — a clear "can't pull
 * further" cue. Vertical pans still scroll the page.
 */
export default function ProductPager({
  items,
  per = 4,
  renderItem,
  gridClassName = 'grid grid-cols-2 gap-3',
  className = '',
  dotActive = 'bg-white',
  dotInactive = 'bg-white/40',
}: ProductPagerProps) {
  const pages: Product[][] = [];
  for (let i = 0; i < items.length; i += per) {
    let pg = items.slice(i, i + per);
    if (pg.length < per && items.length >= per) {
      pg = pg.concat(items.slice(0, per - pg.length));
    }
    pages.push(pg);
  }

  const pageCount = pages.length;
  const [[page, dir], setPage] = useState<[number, number]>([0, 0]);
  const safePage = pageCount ? page % pageCount : 0;
  const paginate = (d: number) => {
    if (pageCount > 1) setPage(([p]) => [(p + d + pageCount) % pageCount, d]);
  };

  if (!pageCount) return null;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        key={safePage}
        initial={{ opacity: 0, x: dir >= 0 ? 48 : -48 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.16}
        onDragEnd={(_e, info) => {
          if (info.offset.x < -60) paginate(1);
          else if (info.offset.x > 60) paginate(-1);
        }}
        className={`${gridClassName} touch-pan-y`}
      >
        {(pages[safePage] ?? []).map(renderItem)}
      </motion.div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {pages.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === safePage ? `w-4 ${dotActive}` : `w-1.5 ${dotInactive}`}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
