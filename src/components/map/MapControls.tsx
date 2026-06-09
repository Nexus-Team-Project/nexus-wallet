import { useMemo } from 'react';
import { useMap } from 'react-map-gl/maplibre';
import { Plus, Minus, Locate, RotateCcw } from 'lucide-react';
import type { OfferCategory } from '../../types/map';
import { useMapStore } from '../../stores/mapStore';

/**
 * RTL-aware overlay controls for the OffersMap.
 * Uses glassmorphism (frosted-glass surfaces) for a modern, lift-off-the-map
 * feel. Category chips at the top, zoom + locate on the start side
 * (left when RTL is on).
 */

const CATEGORY_LABELS: Record<OfferCategory, { he: string; en: string }> = {
  food:          { he: 'אוכל',   en: 'Food' },
  retail:        { he: 'קניות',  en: 'Retail' },
  wellness:      { he: 'בריאות', en: 'Wellness' },
  entertainment: { he: 'בידור',  en: 'Entertainment' },
  services:      { he: 'שירותים', en: 'Services' },
};

const CATEGORY_DOT: Record<OfferCategory, string> = {
  food:          'bg-gradient-to-br from-blue-400 to-indigo-600',
  retail:        'bg-gradient-to-br from-fuchsia-400 to-purple-600',
  wellness:      'bg-gradient-to-br from-emerald-400 to-teal-600',
  entertainment: 'bg-gradient-to-br from-pink-400 to-rose-600',
  services:      'bg-gradient-to-br from-slate-400 to-slate-700',
};

const CATEGORY_ORDER: OfferCategory[] = ['food', 'retail', 'wellness', 'entertainment', 'services'];

interface MapControlsProps {
  rtl?: boolean;
  isHe?: boolean;
  onSearchHere?: () => void;
  showSearchHere?: boolean;
  availableCategories?: OfferCategory[];
}

export default function MapControls({
  rtl = true,
  isHe = true,
  onSearchHere,
  showSearchHere = false,
  availableCategories,
}: MapControlsProps) {
  const { current: map } = useMap();
  const activeCategories = useMapStore((s) => s.activeCategories);
  const toggleCategory = useMapStore((s) => s.toggleCategory);
  const clearCategories = useMapStore((s) => s.clearCategories);

  const visibleCategories = useMemo(
    () => availableCategories ?? CATEGORY_ORDER,
    [availableCategories],
  );

  const sideAnchor = rtl ? 'left-3' : 'right-3';

  return (
    <div
      dir={rtl ? 'rtl' : 'ltr'}
      className="absolute inset-0 pointer-events-none"
    >
      {/* ── Category filter row — top, glassmorphic pills ── */}
      <div className="absolute top-3 inset-x-3 z-10 pointer-events-auto">
        <div
          className="flex gap-2 overflow-x-auto hide-scrollbar items-center px-2 py-2 rounded-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.55)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={clearCategories}
            className={`flex-none px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategories.size === 0
                ? 'bg-slate-900 text-white shadow-md scale-105'
                : 'bg-white/80 text-slate-600 hover:bg-white'
            }`}
          >
            {isHe ? 'הכל' : 'All'}
          </button>
          {visibleCategories.map((cat) => {
            const active = activeCategories.has(cat);
            const label = isHe ? CATEGORY_LABELS[cat].he : CATEGORY_LABELS[cat].en;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-slate-900 text-white shadow-md scale-105'
                    : 'bg-white/80 text-slate-600 hover:bg-white'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${CATEGORY_DOT[cat]}`} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Zoom + locate controls — start side, glassmorphic stack ── */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${sideAnchor} flex flex-col gap-1 z-10 pointer-events-auto rounded-2xl overflow-hidden`}
        style={{
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
        }}
      >
        <ControlButton
          ariaLabel={isHe ? 'התקרבות' : 'Zoom in'}
          onClick={() => map?.zoomIn({ duration: 250 })}
        >
          <Plus size={18} strokeWidth={2.5} />
        </ControlButton>
        <span className="h-px bg-slate-200/60 mx-2" aria-hidden="true" />
        <ControlButton
          ariaLabel={isHe ? 'התרחקות' : 'Zoom out'}
          onClick={() => map?.zoomOut({ duration: 250 })}
        >
          <Minus size={18} strokeWidth={2.5} />
        </ControlButton>
        <span className="h-px bg-slate-200/60 mx-2" aria-hidden="true" />
        <ControlButton
          ariaLabel={isHe ? 'מיקום נוכחי' : 'My location'}
          onClick={() => map?.flyTo({ center: [34.7818, 32.0853], zoom: 14, duration: 600 })}
        >
          <Locate size={18} strokeWidth={2.5} />
        </ControlButton>
      </div>

      {/* ── "Search this area" button — appears after the user pans ── */}
      {showSearchHere && (
        <div className="absolute top-20 inset-x-0 flex justify-center z-10 pointer-events-auto">
          <button
            type="button"
            onClick={onSearchHere}
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-900 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-transform"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 6px 20px rgba(15, 23, 42, 0.12)',
            }}
          >
            <RotateCcw size={14} strokeWidth={2.5} />
            {isHe ? 'חפש באזור זה' : 'Search this area'}
          </button>
        </div>
      )}
    </div>
  );
}

function ControlButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-white/40 active:scale-95 transition-all"
    >
      {children}
    </button>
  );
}
