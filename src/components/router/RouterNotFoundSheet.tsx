/**
 * "Can't find my organization" secondary sheet for RouterScreen.
 * Two CTAs: open the join-tenant flow, or fall back to Nexus-Catalog.
 * Mobile = bottom-anchored; desktop (lg+) = centered modal.
 */
import { motion, AnimatePresence } from 'framer-motion';

interface RouterNotFoundSheetProps {
  open: boolean;
  onClose: () => void;
  isHe: boolean;
  onRequestJoin: () => void;
  onContinueWithNexus: () => void;
}

export default function RouterNotFoundSheet({
  open,
  onClose,
  isHe,
  onRequestJoin,
  onContinueWithNexus,
}: RouterNotFoundSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.35)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex min-h-[180px] w-full max-w-xl flex-col rounded-t-3xl bg-white px-5 pb-10 pt-3 shadow-2xl sm:min-h-[220px] sm:max-w-xl sm:px-8 lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-3xl lg:px-10 lg:pb-10 lg:pt-6"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, info) => { if (info.offset.y > 40) onClose(); }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex cursor-grab justify-center">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>
            <div className="flex w-full flex-1 flex-col gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); onRequestJoin(); }}
                className="flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-md shadow-slate-900/20 transition-all active:scale-[0.98] sm:py-4 sm:text-base"
              >
                {isHe ? 'בקש להצטרף לארגון' : 'Request to join an organization'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onContinueWithNexus(); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 transition-all active:scale-[0.98] sm:py-4"
              >
                <span
                  className="text-sm font-semibold sm:text-base"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {isHe ? 'המשך עם' : 'Continue with'}
                </span>
                <img
                  src="/nexus-logo-black.png"
                  alt="Nexus"
                  className="object-contain"
                  style={{ height: 20, maxWidth: 100, objectPosition: 'center' }}
                />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
