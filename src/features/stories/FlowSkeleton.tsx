import { motion } from 'framer-motion';

/** Fullscreen loading skeleton shown while flow images preload */
export function FlowSkeleton() {
  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-t-2xl"
      style={{ background: 'linear-gradient(135deg, #4c45d4 0%, #635bff 45%, #7c6fff 100%)' }}
    >
      {/* Animated shimmer overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.05, 0.15, 0.05] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)' }}
      />
      {/* Logo placeholder */}
      <div className="flex-shrink-0 px-6 pt-10 pb-1">
        <div className="h-16 w-32 rounded-xl bg-white/20 animate-pulse" />
      </div>
      {/* Text placeholder */}
      <div className="flex-shrink-0 pt-3 pb-3 px-6 space-y-2">
        <div className="h-9 w-40 rounded-lg bg-white/20 animate-pulse" />
        <div className="h-9 w-64 rounded-lg bg-white/20 animate-pulse" />
      </div>
      {/* Image strip placeholder */}
      <div className="flex-1 flex items-center justify-center gap-3 px-6">
        <div className="flex-1 h-32 rounded-2xl bg-white/15 animate-pulse" />
        <div className="w-24 h-44 rounded-3xl bg-white/10 animate-pulse" />
      </div>
      {/* CTA placeholder */}
      <div className="flex-shrink-0 px-6 pb-8 pt-2 flex justify-end">
        <div className="h-12 w-36 rounded-2xl bg-white/20 animate-pulse" />
      </div>
    </div>
  );
}
