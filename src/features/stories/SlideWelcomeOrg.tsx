import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { useRegistrationStore } from '../../stores/registrationStore';
import { useTenantStore } from '../../stores/tenantStore';
import type { OrgInfo } from './types';
import { walletCards, PUSH_IMAGES } from './constants';

interface SlideWelcomeOrgProps {
  org: OrgInfo | null;
}

export function SlideWelcomeOrg({ org }: SlideWelcomeOrgProps) {
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());
  const [logoError, setLogoError] = useState(false);
  const [pushIdx, setPushIdx] = useState(0);
  const [videoExpanded, setVideoExpanded] = useState(false);
  const tenantConfig = useTenantStore((s) => s.config);
  const authFirstName = useAuthStore((s) => s.firstName);
  const authAvatarUrl = useAuthStore((s) => s.avatarUrl);
  const orgMember = useRegistrationStore((s) => s.orgMember);

  // First name: from Google/Apple → authFirstName; from phone+pre-provisioned → orgMember
  const firstName = authFirstName ?? orgMember?.firstName ?? null;

  useEffect(() => {
    // Phase 1: push — phone enters from right, image stays left
    const t1 = setTimeout(() => setPushIdx(1), 1200);
    // Phase 2: after push — image expands and video starts
    const t2 = setTimeout(() => setVideoExpanded(true), 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Background colour — org colour with gradient; fallback to tenantStore
  const orgColor = org?.color ?? tenantConfig?.primaryColor ?? '#635bff';
  const bg = `linear-gradient(135deg, ${orgColor}cc 0%, ${orgColor} 45%, ${orgColor}dd 100%)`;
  const orgName = org?.name ?? tenantConfig?.nameHe ?? 'הארגון שלך';

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden rounded-t-2xl"
      style={{ background: bg }}
    >
      {/* Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-2xl">
        <div className="absolute w-72 h-72 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.25)', top: '-15%', right: '-10%', filter: 'blur(48px)' }} />
        <div className="absolute w-56 h-56 rounded-full opacity-15"
          style={{ background: 'rgba(255,255,255,0.2)', bottom: '-5%', left: '-5%', filter: 'blur(40px)' }} />
      </div>

      {/* Org logo + user avatar */}
      <div className="flex-shrink-0 pt-10 pb-2 relative z-10 px-6 flex justify-start items-center gap-3">
        {(() => {
          const logoSrc = org?.logo ?? tenantConfig?.logo;
          const initials = orgName
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join('');

          if (logoSrc && !logoError) {
            return (
              <motion.img
                src={logoSrc}
                alt={orgName}
                onError={() => setLogoError(true)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
                className="rounded-2xl object-contain flex-shrink-0"
                style={{
                  width: 52, height: 52,
                  background: 'rgba(255,255,255,0.25)',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(8px)',
                  padding: 6,
                }}
              />
            );
          }
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
              className="rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                width: 52, height: 52,
                background: 'rgba(255,255,255,0.25)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <span className="text-white font-bold text-lg leading-none">{initials}</span>
            </motion.div>
          );
        })()}

        {authAvatarUrl && (
          <motion.img
            src={authAvatarUrl}
            alt={firstName ?? ''}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            className="rounded-2xl object-cover flex-shrink-0"
            style={{
              width: 52, height: 52,
              border: '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          />
        )}
      </div>

      {/* Headline — max 55% width, left-aligned */}
      <div className="flex-shrink-0 pb-3 relative z-10 px-6 flex justify-start">
        <div style={{ maxWidth: '55%' }}>
          <h2 className="text-white font-extrabold text-[32px] leading-tight" dir="rtl">
            {firstName ? `${firstName}, ברוכים הבאים,` : 'ברוכים הבאים,'}
          </h2>
          <h2 className="text-white font-extrabold text-[32px] leading-tight" dir="rtl">
            {orgName} עובדת עם נקסוס 🎉
          </h2>
        </div>
      </div>

      {/*
        Reverse strip: [video_image | phone | image]
        Start: x='-33.33%' → visible: [phone | image] (phone on right)
        After push: x='0%'  → visible: [video_image | phone] (phone moved left)
      */}
      <div className="flex-1 flex items-center relative z-10 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 flex flex-row items-center"
          style={{ width: '150%', left: 0 }}
          initial={{ x: '-33.33%' }}
          animate={{ x: pushIdx === 0 ? '-33.33%' : '0%' }}
          transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* slot 1: image that expands into video */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <motion.div
              className="relative overflow-hidden"
              animate={videoExpanded
                ? { width: '92%', height: 190, borderRadius: 18 }
                : { width: '75%', height: 130, borderRadius: 16 }}
              transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 }}
              style={{ position: 'relative' }}
            >
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
              <div className="absolute inset-0 z-20 pointer-events-none"
                style={{ border: '2.5px solid #0d1025', borderRadius: 'inherit' }} />
              <img
                src={PUSH_IMAGES[0]} alt=""
                className="absolute inset-0 object-cover w-full h-full"
                style={{ borderRadius: 'inherit', zIndex: videoExpanded ? 10 : 12, opacity: videoExpanded ? 0 : 1, transition: 'opacity 0.3s' }}
              />
              <video
                src="/tap-pay.mp4"
                autoPlay muted loop playsInline
                className="absolute inset-0 object-cover w-full h-full"
                style={{ borderRadius: 'inherit', zIndex: videoExpanded ? 12 : 10, opacity: videoExpanded ? 1 : 0, transition: 'opacity 0.3s 0.2s' }}
              />
              <div className="absolute z-30 flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
              </div>
            </motion.div>
          </div>

          {/* slot 2: phone mockup */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative flex items-center justify-center">
              <div className="absolute rounded-3xl"
                style={{ width: 110, height: 160, background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(180,170,255,0.30) 100%)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(2px)', zIndex: 1 }} />
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="relative"
                style={{ width: 88, aspectRatio: '9 / 18.8', borderRadius: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04)), #0b0f1a', padding: 3, border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 16px 48px rgba(0,0,0,0.55)', zIndex: 2 }}
              >
                <div className="absolute top-1 left-1/2 -translate-x-1/2 z-10"
                  style={{ width: 32, height: 7, background: 'rgba(0,0,0,0.6)', borderRadius: '0 0 5px 5px' }} />
                <div className="w-full h-full relative overflow-hidden" style={{ borderRadius: 11, background: 'linear-gradient(180deg, #0a0b14, #121535)' }}>
                  <div className="absolute top-3.5 left-1.5 right-1.5 flex items-center justify-between z-10">
                    <span className="text-[5px] font-bold text-white/80">Wallet</span>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 8, height: 8, borderRadius: 999, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute left-1.5 right-1.5 grid grid-cols-2 z-[2]" style={{ top: 23, gap: '2px', alignContent: 'start' }}>
                    {walletCards.map((card, i) => (
                      <motion.div key={card.name}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                        className="flex items-center justify-center overflow-hidden"
                        style={{ height: 23, borderRadius: 4, background: card.bg, border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        {!imgErrors.has(i) ? (
                          <img src={card.logo} alt={card.name}
                            style={{ width: card.logoW * 0.6, maxHeight: card.logoMaxH * 0.6, objectFit: 'contain' }}
                            onError={() => setImgErrors(prev => new Set(prev).add(i))} />
                        ) : (
                          <span style={{ fontSize: 4, color: 'rgba(0,0,0,0.7)' }}>{card.name}</span>
                        )}
                      </motion.div>
                    ))}
                    <div className="flex items-center justify-center"
                      style={{ height: 23, borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.2)' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>+</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* slot 3: second image */}
          <div className="flex items-center justify-center" style={{ width: '33.33%' }}>
            <div className="relative" style={{ width: '75%', height: 130 }}>
              <div className="absolute inset-0 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.10)', filter: 'blur(12px)', transform: 'scale(1.04)' }} />
              <div className="absolute inset-0 rounded-2xl z-20 pointer-events-none"
                style={{ border: '2.5px solid #0d1025', borderRadius: 16 }} />
              <img src={PUSH_IMAGES[1]} alt="" className="relative z-10 rounded-2xl object-cover shadow-xl w-full h-full" />
              <div className="absolute z-30 flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: '#22c55e', border: '2px solid #0d1025', bottom: -7, right: -7, boxShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                <span style={{ color: '#fff', fontSize: 13, lineHeight: 1, fontWeight: 800, marginTop: -1 }}>+</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
