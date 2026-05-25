/**
 * Bottom-sheet org picker used by RouterScreen. Spring-animated,
 * drag-to-dismiss, with a fuzzy HE/EN transliteration search. Picker
 * options are passed in - this component does not know about /api/me
 * or backend tenants directly. Mobile = bottom-anchored sheet;
 * desktop (lg+) = centered modal.
 */
import { motion, AnimatePresence } from 'framer-motion';
import type { Dispatch, SetStateAction } from 'react';
import { useRef } from 'react';

export interface PickerOption {
  /** 'nexus' for the ecosystem option, tenantId otherwise. */
  id: string;
  /** Localized display name. */
  name: string;
  /** Two-letter fallback initials when no logo is set. */
  initials: string;
  /** Solid background color behind the logo / initials. */
  color: string;
  /** Optional logo asset (white-filtered inline by the avatar tile). */
  logo?: string;
  /** True for the Nexus-Catalog ecosystem option. */
  isNexus: boolean;
}

interface RouterPickerSheetProps {
  open: boolean;
  onClose: () => void;
  isHe: boolean;
  options: PickerOption[];
  filtered: PickerOption[];
  selectedId: string;
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  onPick: (opt: PickerOption) => void;
}

export default function RouterPickerSheet({
  open,
  onClose,
  isHe,
  filtered,
  selectedId,
  search,
  setSearch,
  onPick,
}: RouterPickerSheetProps) {
  // Backdrop drag-to-dismiss for the bottom-sheet variant (mobile).
  // We track the down position and close on a sufficient downward
  // swipe - keeps parity with ReferralStoriesPage gestures.
  const dragY = useRef(0);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onPointerDown={(e) => { dragY.current = e.clientY; }}
            onPointerUp={(e) => { if (e.clientY - dragY.current > 40) onClose(); }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex w-full max-w-xl flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-xl lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-2xl lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
            style={{ maxHeight: '82vh' }}
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => { if (info.offset.y > 60) onClose(); }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex-shrink-0 px-5 pb-3 sm:px-8">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 sm:text-xl">
                {isHe ? 'בחר ארגון' : 'Choose an organization'}
              </h2>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    fontSize: 18,
                    color: 'var(--color-text-muted)',
                    [isHe ? 'right' : 'left']: 12,
                  } as React.CSSProperties}
                >
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={isHe ? 'חיפוש ארגון...' : 'Search organization...'}
                  className="w-full rounded-2xl border-2 border-border bg-surface py-3 text-sm outline-none transition-colors focus:border-primary sm:py-4 sm:text-base"
                  style={{
                    [isHe ? 'paddingRight' : 'paddingLeft']: 40,
                    [isHe ? 'paddingLeft' : 'paddingRight']: 16,
                    color: 'var(--color-text-primary)',
                  } as React.CSSProperties}
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-8">
              <div className="space-y-2 pb-4 sm:space-y-3">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm py-8" style={{ color: 'var(--color-text-muted)' }}>
                    {isHe ? 'לא נמצאו ארגונים' : 'No organizations found'}
                  </p>
                ) : (
                  filtered.map((opt, i) => {
                    const isPicked = selectedId === opt.id;
                    return (
                      <motion.button
                        key={opt.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                        onClick={() => onPick(opt)}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition-all sm:gap-4 sm:px-5 sm:py-4"
                        style={{
                          background: isPicked ? 'rgba(15,23,42,0.04)' : '#fff',
                          border: isPicked ? '2px solid #0f172a' : '2px solid #ebebf0',
                        }}
                      >
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
                          style={{ background: opt.color }}
                        >
                          {opt.logo ? (
                            <img
                              src={opt.logo}
                              alt=""
                              className="h-6 w-6 object-contain sm:h-8 sm:w-8"
                              style={{ filter: 'brightness(0) invert(1)' }}
                            />
                          ) : (
                            opt.initials
                          )}
                        </div>
                        <span
                          className="flex-1 text-sm font-semibold sm:text-base"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {opt.name}
                        </span>
                        {isPicked ? (
                          <span
                            className="material-symbols-outlined flex-shrink-0 text-slate-900"
                            style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}
                          >
                            check_circle
                          </span>
                        ) : (
                          <span
                            className="material-symbols-outlined flex-shrink-0 text-text-muted"
                            style={{ fontSize: 18 }}
                          >
                            {isHe ? 'chevron_left' : 'chevron_right'}
                          </span>
                        )}
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
