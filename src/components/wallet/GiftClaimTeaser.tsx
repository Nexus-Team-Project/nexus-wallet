import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion, animate, AnimatePresence, useMotionValue, type PanInfo } from 'framer-motion';
import { GIFT_VARIANTS, giftClaimedKey } from '../../pages/GiftSamplePage';
import { useTransitionCurtainStore } from '../../stores/transitionCurtainStore';
import { useTenantStore } from '../../stores/tenantStore';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * GiftClaimTeaser — the "already signed in, haven't claimed the gift yet"
 * entry point into the SPAR gift-sample flow (GiftSamplePage.tsx).
 *
 * The email/SMS entry point drops a recipient straight onto /gift-sample;
 * this one is for a recipient who is already living inside the wallet. A
 * card peeks up from the bottom of the screen, in front of the floating
 * pill nav — logo on top, the headline snug beneath it, the hero
 * illustration floating in below that, cut off by the fold. It reuses the
 * same `variant` data (gradient, logo, title, image, fonts) GiftSamplePage's
 * own cover uses — same ingredients, same classes copied verbatim per piece
 * — just arranged for a short peek instead of the full-page layout, where
 * the headline sits near the BOTTOM of a much taller card and would be
 * off-screen here.
 *
 * Dragging up past the threshold (or tapping) opens the exact same route —
 * `useTransitionCurtainStore.cover()` drops a white curtain first so the
 * hand-off reads as a transition rather than an instant cut, then the new
 * route reveals under it (TransitionCurtain, already mounted globally in
 * AppLayout — the same mechanism reserved for other cross-route reveals).
 * Everything past that point (flip → letter → card → redeem) is identical
 * to the SMS flow.
 *
 * Portaled to <body>: WalletPage renders inside AppLayout's
 * `<main className="relative z-10">`, which caps this whole subtree at that
 * stacking level in the outer layout — no z-index in here could ever beat
 * the floating pill nav (a `<main>` sibling at z-50) without first escaping
 * that containing stacking context.
 *
 * The rest position is plain CSS (the outer wrapper sits with a negative
 * `bottom`); a `useMotionValue` `y` layers ONLY the drag offset on top of
 * it — mixing `drag` with a declarative `animate` target on the same value
 * fights the gesture, so springing back to rest is done imperatively.
 * Dismissing flips React state immediately and lets AnimatePresence's
 * `exit` play the slide-away cosmetically, rather than waiting on that
 * animation's completion to actually remove the card.
 *
 * Dismissing (drag down / the corner ✕) only hides it for this mount — it
 * comes back next visit. Only completing the claim (GiftSamplePage's
 * finishRedeem, via giftClaimedKey(tenant)) makes it gone for good.
 */

const CARD_HEIGHT = 480;
const PEEK_HEIGHT = 250;
const REST_BOTTOM = -(CARD_HEIGHT - PEEK_HEIGHT);
const OPEN_OFFSET = -60;
const OPEN_VELOCITY = -500;
const DISMISS_OFFSET = 70;
const DISMISS_VELOCITY = 500;
const SPRING = { type: 'spring' as const, damping: 26, stiffness: 300 };

export default function GiftClaimTeaser() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { direction, isRTL } = useLanguage();
  const storeTenantId = useTenantStore((s) => s.tenantId);
  const [dismissed, setDismissed] = useState(false);
  const y = useMotionValue(0);

  // Demo link (`?gift-teaser=demo`): always show the SPAR teaser — ignore the
  // claimed flag, and fall back to SPAR even if no loadsToBalance tenant is
  // active. ProtectedRoute auto-signs-in on this param, so the full URL works
  // cold in any browser.
  const isDemo = searchParams.get('gift-teaser') === 'demo';
  const tenantId = isDemo && !(storeTenantId && GIFT_VARIANTS[storeTenantId]?.loadsToBalance)
    ? 'spar'
    : storeTenantId;

  // Any tenant whose gift is an employer-wallet load (SPAR / Isrotel) gets the
  // teaser. Claim-mode variants (e.g. Menora) are excluded — they have no hero
  // illustration and their entry point isn't the wallet.
  const variant = (tenantId && GIFT_VARIANTS[tenantId]?.loadsToBalance) ? GIFT_VARIANTS[tenantId] : null;
  const claimed = (() => {
    if (isDemo) return false;
    try { return !!tenantId && localStorage.getItem(giftClaimedKey(tenantId)) === '1'; } catch { return false; }
  })();

  if (!variant || claimed) return null;

  const open = () => {
    useTransitionCurtainStore.getState().cover();
    navigate(`/${lang}/gift-sample?tenant=${tenantId}`);
  };
  const dismiss = () => setDismissed(true);
  const springHome = () => animate(y, 0, SPRING);

  const onDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y < OPEN_OFFSET || info.velocity.y < OPEN_VELOCITY) {
      open();
    } else if (info.offset.y > DISMISS_OFFSET || info.velocity.y > DISMISS_VELOCITY) {
      dismiss();
    } else {
      springHome();
    }
  };

  return createPortal(
    // Same page gutter as GiftSamplePage's own `px-5` — clear of the screen
    // edges, not flush against them. z-[60]: above the pill nav (z-50) and
    // its white fade backdrop (z-40).
    //
    // dir + font-hebrew are set explicitly here because a portal only
    // carries React context out to <body> — it does NOT carry the DOM
    // attributes from LanguageProvider's own wrapping
    // `<div dir={direction} className="font-hebrew">`. Without this, the
    // teaser silently fell back to the browser's default direction and
    // font-sans instead of Rubik, which is what actually looked "off" here.
    <div
      dir={direction}
      className={`fixed inset-x-0 z-[60] flex justify-center pointer-events-none px-5 ${isRTL ? 'font-hebrew' : 'font-sans'}`}
      style={{ bottom: REST_BOTTOM }}
    >
      <AnimatePresence>
        {!dismissed && (
          <motion.div
            className="w-full max-w-[400px] pointer-events-auto"
            style={{ height: CARD_HEIGHT, y }}
            exit={{ y: CARD_HEIGHT + 80, opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } }}
            drag="y"
            dragConstraints={{ top: REST_BOTTOM, bottom: DISMISS_OFFSET + 40 }}
            dragElastic={0.15}
            onDragEnd={onDragEnd}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={open}
              className="relative w-full h-full rounded-2xl flex flex-col items-center pt-5 px-7 pb-7 overflow-hidden text-start"
              style={{
                background: variant.gradient,
                color: '#ffffff',
                boxShadow: '0 -16px 32px -14px rgba(14,44,84,0.4)',
              }}
            >
              {/* Scrim — mirrors the full cover, keeps the white logo/title legible. */}
              <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(10,37,64,0.3) 0%, rgba(10,37,64,0.08) 55%, rgba(10,37,64,0.05) 100%)',
                }}
              />

              {/* Dismiss — literal top-left corner (not RTL-flipped). */}
              <span
                role="button"
                aria-label={lang === 'he' ? 'סגור' : 'Dismiss'}
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss();
                }}
                className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
              >
                <span className="material-symbols-rounded text-white" style={{ fontSize: 18 }}>
                  close
                </span>
              </span>

              {/* Logo — same asset + sizing class as the real cover. */}
              <img
                src={variant.logo}
                alt={variant.sender}
                className={`relative z-10 ${variant.logoClass} object-contain drop-shadow-lg`}
                style={variant.logoWhite ? { filter: 'brightness(0) invert(1)' } : undefined}
              />

              {/* Headline — same title text + styling as the real cover
                  (text-2xl font-extrabold), snug beneath the logo here
                  instead of near the card's bottom. */}
              <h2
                className="relative z-10 mt-2 w-full text-2xl font-extrabold text-center leading-tight"
                style={{ textShadow: '0 1px 14px rgba(10,37,64,0.5)' }}
              >
                {variant.coverTitle}
              </h2>

              {/* Hero illustration — same asset + sizing class as the real
                  cover, floats in below the headline and is cut off by the
                  fold partway down. Minimal top margin — pulled up snug
                  against the headline rather than pushed down the card. */}
              <div className="relative z-10 flex-1 min-h-0 w-full flex items-start justify-center animate-gift-float mt-1">
                <img
                  src={variant.heroImage}
                  alt=""
                  aria-hidden
                  className={`${variant.heroMaxW} max-h-full object-contain drop-shadow-xl rounded-xl`}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
