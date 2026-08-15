import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, CreditCard } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuthGate } from '../hooks/useAuthGate';
import AnimatedGradient from '../components/AnimatedGradient';
import ExpenseCashbackGallery from '../components/ExpenseCashbackGallery';
import SmartShoppingPush from '../components/SmartShoppingPush';
import Footer from '../components/Footer';
import LovedBrandsGrid from '../components/LovedBrandsGrid';
import DarkPitchCard from '../components/DarkPitchCard';
import PeopleWall from '../components/PeopleWall';
import Reveal from '../components/Reveal';
import ReferralPromoCard from '../components/ReferralPromoCard';
import RisingBubbles from '../components/RisingBubbles';
import GiftCardsCarousel from '../components/onboarding/GiftCardsCarousel';
import AllBenefitsPhonePeek from '../components/AllBenefitsPhonePeek';
import AboutFaq from '../components/AboutFaq';

/**
 * Public "what is Nexus Wallet" explainer — reached from the profile / a
 * marketing link. No auth required to view; the closing CTA gates on sign-in.
 *
 * Layout borrows the Mami Plus pitch-page structure: a rounded hero panel
 * (here filled with the brand aurora gradient instead of a flat color) with
 * the expense/cashback gallery peeking over its bottom edge. Registered as
 * an `isFullScreenForm` route so it owns its own header/CTA instead of the
 * global TopBar + bottom nav.
 */

export default function AboutWalletPage() {
  const { isRTL } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, requireAuth } = useAuthGate();
  const [copied, setCopied] = useState(false);

  const handleCta = async () => {
    if (isAuthenticated) {
      navigate(`/${lang}/wallet`);
      return;
    }
    const authed = await requireAuth({
      promptMessage: isRTL ? 'התחברו כדי לפתוח את הארנק שלכם' : 'Sign in to open your wallet',
    });
    if (authed) navigate(`/${lang}/wallet`);
  };

  // Share — Web Share API where available, clipboard + toast as fallback
  // (same shape as the business page's share action).
  const handleShare = async () => {
    const url = window.location.href;
    const title = isRTL ? 'נקסוס — הארנק שמשלם לך בחזרה' : 'Nexus — the wallet that pays you back';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* user dismissed */
    }
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="relative min-h-screen bg-white pb-28">
      {/* Floating actions — back + share, pinned to the viewport so they stay
          reachable while scrolling (and so the hand/phone artwork can still
          bleed to the top edge). The wrapper repeats the bottom CTA's
          `max-w-md mx-auto` trick: without it `fixed` would anchor to the
          browser edge instead of the app frame on desktop. It's
          pointer-events-none so the full-width strip can't swallow taps. */}
      <div className="fixed top-5 inset-x-0 max-w-md mx-auto w-full px-4 z-40 flex items-center gap-2 pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          aria-label={isRTL ? 'חזרה' : 'Back'}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] active:scale-95 transition-transform"
        >
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 24 }}>
            {isRTL ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
        <button
          onClick={handleShare}
          aria-label={isRTL ? 'שיתוף' : 'Share'}
          className="pointer-events-auto w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-[0_6px_16px_rgba(0,0,0,0.14)] active:scale-95 transition-transform"
        >
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 22 }}>
            ios_share
          </span>
        </button>
        {copied && (
          <span className="text-[11px] font-semibold text-text-primary bg-white rounded-full px-3 py-1 shadow-[0_6px_16px_rgba(0,0,0,0.14)]">
            {isRTL ? 'הקישור הועתק' : 'Link copied'}
          </span>
        )}
      </div>

      <main>
        {/* ── Hero ── */}
        {/* `flex flex-col` isn't for layout here — it establishes a new
            formatting context so the card's `mt-*` can't margin-collapse
            through this section (and every unstyled ancestor above it) up
            to the page root, which silently shoves the whole app frame down
            instead of making space inside the hero. */}
        <section className="px-4 pb-16 relative flex flex-col">
          {/* Gradient card — pulled up to start 108px down instead of 122px,
              tightening the white strip above it. Only the card's top edge
              moves: the headline's pt below is bumped by the same 14px, so
              its position on screen is unchanged. */}
          <div className="rounded-3xl overflow-hidden relative mt-[108px] pb-28 px-6 flex flex-col items-center">
            <AnimatedGradient clipPath="none" />

            {/* Headline — pushed down to clear the overlay hand image, which
                ends at container-relative 294px (+10px gap). Right-aligned
                (literal right, not RTL-logical). `w-full` matters here: the
                card is a `flex-col items-center` column, which shrink-wraps
                children to their content width and centers THAT box — so
                without it, `text-right` had no extra width to align within
                and visually did nothing. */}
            {/* pt clears the hand image's VISIBLE content, not its box: the
                PNG's hand+phone+glow stop ~87% down the 420px render (≈363px
                into the section), and the rest of the file is transparent. It
                used to clear the full box, which left a 60px hole of bare
                gradient above the headline. */}
            <div className="relative z-10 w-full text-right pt-[276px] px-2">
              {/* 28px — the largest size where "נקסוס, עד 60% בחזרה" still
                  fits on one line in this column; 30-32px wrapped it to
                  three lines and collided with the expense gallery below. */}
              <h1 className="text-white text-[28px] font-extrabold leading-tight text-right">
                {isRTL ? (
                  <>נקסוס, עד 60% בחזרה<br />על הכסף שלך</>
                ) : (
                  <>Nexus, up to 60% back<br />on your money</>
                )}
              </h1>
              <p className="text-white/85 text-sm font-medium mt-2 text-right">
                {isRTL ? (
                  <>הארנק שמשלם לך בחזרה במותגים<br />שכולנו אוהבים.</>
                ) : (
                  <>The wallet that pays you back at the brands<br />we all love.</>
                )}
              </p>
            </div>
          </div>

          {/* Hand + balance illustration — pulled out of the card entirely
              and pinned to the top of the screen as a floating overlay ON
              TOP of the gradient card (not inside it, not pushing it down).
              Pushed well right of center — deliberately bleeds off the
              right edge of the screen (image is 280px wide; left:140 pushes
              ~45px of it past the 375px edge). */}
          <img
            src="/wallet-in-hand.png"
            alt=""
            aria-hidden
            className="absolute -top-1 z-30 h-[420px] w-auto object-contain pointer-events-none"
            style={{ left: 140 }}
            draggable={false}
          />

          {/* Black wide wordmark, plain — no background pill, no rotation.
              Floating ABOVE the gradient card's top-left corner (top < the
              card's own mt-[108px]), not inside it, so the card's
              overflow-hidden doesn't clip it. */}
          <img
            src="/nexus-logo-black.png"
            alt="Nexus"
            className="absolute z-40 h-[104px] w-auto object-contain"
            // Re-centered on the white strip's vertical midpoint, which the
            // card's higher top edge shortened: 0–108px ⇒ centre 54 ⇒ top 2.
            style={{ top: 2, left: 16 }}
            draggable={false}
          />

          {/* Expense/cashback gallery — moved up by the same 42px the headline
              was, so it keeps overlapping the card's bottom edge by the same
              amount (the card's height follows the headline's pt). */}
          <div className="absolute inset-x-0 mx-auto z-10" style={{ top: 556, width: 300 }}>
            <ExpenseCashbackGallery />
          </div>
        </section>

        {/* ── Pitch — the Wallet-headline design (big extrabold title with
            the green underline accent), carrying the "how it works" copy. ── */}
        <Reveal>
        <section className="text-center px-6 mt-16 flex flex-col items-center">
          <h1 className="text-4xl font-extrabold mb-1 text-text-primary">
            {isRTL ? (
              <>
                איך זה{' '}
                <span className="relative inline-block text-text-primary">
                  עובד?
                  <div className="absolute bottom-1 inset-x-0 h-[3px] bg-primary rounded-full" />
                </span>
              </>
            ) : (
              <>
                How does it{' '}
                <span className="relative inline-block text-text-primary">
                  work?
                  <div className="absolute bottom-1 inset-x-0 h-[3px] bg-primary rounded-full" />
                </span>
              </>
            )}
          </h1>
          <p className="text-xl font-bold mb-2 text-text-primary">
            {isRTL ? 'הנה כמה מהדברים' : "Here's a taste of what"}
          </p>
          <p className="text-text-muted text-sm">
            {isRTL
              ? 'שאלפי משתמשים עושים עם Nexus'
              : 'thousands of users already do with Nexus'}
          </p>
          <div className="my-8 text-text-muted/70">
            <ArrowDown size={22} strokeWidth={1.5} />
          </div>
        </section>
        </Reveal>

        {/* ── Loved brands — the About-page variant of the home page's dark
            tile-grid card: chain logos only, cashback % per tile. Sits right
            under the "how it works" intro block. ── */}
        <Reveal>
          <LovedBrandsGrid />
        </Reveal>

        {/* ── "Not issuing a card, just upgrading" — the wallet phone-peek
            card, butted straight up against the brands grid above (no top
            margin; both carry their own mb-6). ── */}
        <Reveal>
          <AllBenefitsPhonePeek onCtaClick={handleCta} />
        </Reveal>

        {/* ── Gift-cards 3D carousel — the hero animation from the "create a
            voucher on your terms" intro page (DealIntroPage), in the same
            white card shell and butted straight against the wallet card
            above (no top margin; that card carries its own mb-6). The glow
            and the top fade live in an inner rounded box with
            overflow-hidden, so neither bleeds past the card's corners. ── */}
        <Reveal>
        <section className="mx-4 mb-6 bg-white rounded-[2rem] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.18)] border border-border/60 p-5">
          {/* Header — icon chip + title/sub, same as the wallet card's */}
          <header className="flex items-start gap-3">
            <span className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface shrink-0">
              <CreditCard size={24} strokeWidth={1.8} className="text-text-primary" />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-lg font-bold text-text-primary leading-tight">
                {isRTL ? 'צרו כרטיס בתנאים שלכם' : 'Create a card on your terms'}
              </span>
              <span className="text-xs font-medium text-text-muted mt-1 leading-snug">
                {isRTL
                  ? 'גובה הקאשבק, מספר התשלומים והפיצולים — הכל בדיוק כפי שמתאים לכם.'
                  : 'Cashback rate, number of payments, splits — all exactly as it suits you.'}
              </span>
            </span>
          </header>

          {/* Full-bleed: -mx-5 cancels the card's own p-5 so the carousel and
              its glow run edge to edge instead of sitting in an inset box.
              No rounding — this band is mid-card, nowhere near the card's own
              rounded corners — but overflow-hidden stays, to keep the glow
              from spilling outside the card. */}
          <div className="relative overflow-hidden -mx-5 mt-3 mb-6">
            <div
              className="absolute inset-0 z-0"
              style={{
                background:
                  'radial-gradient(120% 80% at 50% 0%, rgba(156,136,255,0.18) 0%, rgba(128,222,234,0.12) 45%, rgba(255,255,255,0) 75%)',
              }}
            />
            <div className="relative z-[1]">
              <GiftCardsCarousel height={340} showNotifications={false} />
            </div>
            <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
          </div>

          {/* Footer CTA — same big label + circular arrow as the sibling
              cards; short enough here to carry their full text-4xl. */}
          <button
            onClick={handleCta}
            className="flex items-center justify-between gap-3 w-full pt-2 active:opacity-70"
          >
            <span className="text-4xl font-semibold tracking-tight leading-[1.05] text-start text-text-primary">
              {isRTL ? 'שלטו בעסקה שלכם' : 'Own your transaction'}
            </span>
            <span className="w-12 h-12 bg-[#b1b1b1] rounded-full flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-rounded block" style={{ fontSize: 24 }}>
                {isRTL ? 'arrow_back' : 'arrow_forward'}
              </span>
            </span>
          </button>
        </section>
        </Reveal>

        {/* ── Second dark card — same shell as the brands card, no tile grid.
            Body is the falling-coins artwork from the checkout page's
            "discover our reward program" banner. TODO: real headline +
            accordion copy TBD. ── */}
        <Reveal className="mt-10 relative">
          <div className="relative z-10">
            {/* No `title` prop here — the headline is laid out inside the
                body instead, so it can sit beside the coins rather than
                above them. */}
            <DarkPitchCard
              moreContent={
                isRTL
                  ? 'נקסוס לא עולה לכם שקל — אין דמי מנוי, אין עמלות נסתרות, ואין צורך להנפיק כרטיס חדש. וכדי שתתחילו עם רוח גבית, כבר הפקדנו לכם ₪150 לארנק.'
                  : "Nexus doesn't cost you a thing — no subscription, no hidden fees, and no new card to issue. And to get you started, we've already deposited ₪150 into your wallet."
              }
            >
              {/* Height is sized to the coin stream itself, not the file: the
                  artwork runs from ~5% to ~92% of the 350px render, so
                  0.92*350 - 18 ≈ 306px clears the last coin instead of
                  slicing it. */}
              <div className="relative h-[306px]">
                {/* Artwork layer — overflow-hidden lives on this inner box,
                    not the card, so the crop can't square off the card's
                    rounded corners, and not on the parent, so it can't clip
                    the headline either. */}
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <img
                    src="/reward-coins.png"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute object-contain"
                    // The PNG is square with wide transparent margins: the coin
                    // stream runs from ~32% to ~66% across and starts ~5% down,
                    // so the offsets are computed off the render size, not the
                    // file box — anchoring the file box would leave a gap.
                    // Right-flush would be -(350 - 0.66*350) = -119; -109 backs
                    // it 10px off the edge. Top: -0.05*350 ≈ -18.
                    style={{ width: 350, height: 350, right: -109, top: -18 }}
                    draggable={false}
                  />
                </div>

                {/* Headline — pinned to the inline-end edge (the left in
                    Hebrew) and centred on the block's horizontal midline,
                    opposite the coins. Lines are kept short: the coins eat
                    ~130px of the row, so at 32px anything longer wraps and
                    breaks the three-line shape. */}
                <div className="absolute inset-y-0 end-0 max-w-[56%] flex items-center">
                  <h2 className="text-[32px] font-semibold leading-[1.12] tracking-tight text-end">
                    {isRTL ? (
                      <>
                        בחינם.
                        <br />
                        וגם ₪150
                        <br />
                        שמחכים לכם
                      </>
                    ) : (
                      <>
                        Free.
                        <br />
                        Plus ₪150
                        <br />
                        already waiting
                      </>
                    )}
                  </h2>
                </div>
              </div>
            </DarkPitchCard>
          </div>

          {/* Promo strip — the card-foot pattern from BrandFeatureStore
              (colored pill + condition on one centered line), tucked BEHIND
              the dark card so it slides out from under its bottom edge.
              -mt-8 outruns the card's own mb-6 by 8px, which is the slice
              that stays hidden; pt-6 pushes the text clear of that overlap.
              Full card width (mx-5, matching the card) and rounded only at
              the bottom — at matching radius, so the two read as one stack.
              The pill takes the tenant's primary colour, same as the store
              cards. */}
          <div className="relative z-0 mx-5 -mt-8 pt-6 pb-3.5 px-6 bg-white rounded-b-3xl border border-t-0 border-border/60 shadow-[0_12px_24px_-12px_rgba(0,0,0,0.28)] text-center text-sm font-medium text-text-primary">
            <span
              className="bg-primary text-white px-2 py-0.5 rounded text-[11px] font-bold"
              style={{ marginInlineEnd: 6 }}
            >
              {isRTL ? '₪150 מתנה' : '₪150 gift'}
            </span>
            {isRTL ? 'בכפוף לתנאים' : 'subject to terms'}
          </div>
        </Reveal>

        {/* ── Second gradient square — org-member upsell copy up top, the
            push-strip animation from the Nexus hero story slide below it.
            px-5 matches the RecentlyViewed card above (its own mx-5), so the
            two dark/gradient cards share the same width. ── */}
        <Reveal>
        <section className="px-5 mt-10">
          <div className="relative aspect-[3/4.6] w-full rounded-3xl overflow-hidden">
            <AnimatedGradient clipPath="none" />
            <div className="relative z-10 h-full flex flex-col">
              {/* pt-10 gives the copy more breathing room from the card's
                  top edge than the uniform p-6 did. */}
              {/* Type scale matched to the dark cards: 28px semibold headline,
                  then a text-base secondary line, then the same
                  text-sm/leading-relaxed white/70 body they use. */}
              <div className="flex-shrink-0 px-6 pt-10 pb-6 text-right">
                <h3 className="text-white text-[28px] font-semibold leading-[1.05] tracking-tight">
                  {isRTL ? 'חבר בארגון שעובד איתנו?' : 'Part of an organization that works with us?'}
                </h3>
                <p className="text-white/80 text-base font-medium mt-2">
                  {isRTL ? 'יכול להיות שמגיע לך יותר' : 'You may be entitled to more'}
                </p>
                <p className="text-white/70 text-sm leading-relaxed mt-3">
                  {isRTL
                    ? 'תוכל להתחבר לארנק הארגוני שלך ולקבל קאשבק גבוה יותר, והצעות שמותאמות במיוחד בשבילך.'
                    : 'You can connect to your organizational wallet for higher cashback and offers tailored specifically for you.'}
                </p>
              </div>
              {/* pb clears the absolutely-positioned CTA below, so the
                  animation isn't sitting right up against the button. */}
              <div className="flex-1 min-h-0 pb-20">
                <SmartShoppingPush />
              </div>
            </div>

            {/* CTA — the dark cards' footer row rather than a pill button:
                label on the inline-start edge (the right in Hebrew), circled
                arrow on the other end, spanning the card's full width along
                its bottom. Straight into the org-picker step of the auth
                flow — the same slide (SlideSelectOrg) registration uses. */}
            <button
              onClick={() => navigate(`/${lang}/auth-flow/new-user?step=select-org`)}
              className="absolute bottom-6 inset-x-6 z-20 flex items-center justify-between gap-3 active:opacity-80 transition-opacity"
            >
              {/* Big footer label like the other cards. 28px, not their
                  text-4xl: this label is long enough that 36px wraps to three
                  lines beside the arrow. */}
              <span className="text-[28px] font-semibold tracking-tight leading-[1.05] text-start text-white">
                {isRTL ? 'מצא את הארגון שלי' : 'Find my organization'}
              </span>
              <span className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-white block" style={{ fontSize: 24 }}>
                  {isRTL ? 'arrow_back' : 'arrow_forward'}
                </span>
              </span>
            </button>
          </div>
        </section>
        </Reveal>

        {/* ── People wall — the marketing site's portrait grid in the page's
            white card shell. Carries its own mx-4 mb-6 margins. ── */}
        <Reveal className="mt-10">
          <PeopleWall onCtaClick={handleCta} />
        </Reveal>

        {/* ── Referral promo — the navy share card from ReferralStoriesPage,
            with that page's friends/orgs track switch above it. ── */}
        <Reveal className="mt-10">
          <ReferralPromoCard />
        </Reveal>

        {/* ── Closing region — FAQ + footer share one bubble field instead of
            it sitting in a band of its own. The bubbles are an absolute layer
            at z-0 spanning the whole region, so they spawn below the footer
            (hidden behind its opaque diagonal), climb past it and through the
            questions, and fade out as they reach the people wall above. Both
            blocks ride at z-10 so nothing is ever drawn over them.

            travel is a fixed 1400px — the region's height isn't knowable at
            build time, and this clears the footer + its 192px gap + the FAQ
            on a phone. If the FAQ grows a lot, raise it to match, or the
            bubbles will die before they reach the top. ── */}
        <div className="relative">
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <RisingBubbles travel={1400} />
          </div>

          {/* ── FAQ — collapsible questions at the foot of the page. The
              z-10 lives on the Reveal wrapper: while it animates, its own
              opacity/transform make it a stacking context, which would trap
              an inner z-10 below the bubble layer. ── */}
          <Reveal className="relative z-10">
            <section className="px-6 pt-12">
              <AboutFaq />
            </section>
          </Reveal>

          {/* ── Footer — pushed well below the FAQ: its diagonal background
              bleeds 100px above the footer itself, so the margin must clear
              that overlap plus breathing room. ── */}
          <div className="relative z-10 mt-48">
            <Footer />
          </div>
        </div>
      </main>

      {/* ── Fixed bottom CTA — transparent backing with a light blur, so
          the page content stays visible drifting behind the button. ── */}
      <div className="fixed bottom-0 inset-x-0 max-w-md mx-auto w-full bg-white/30 backdrop-blur-sm px-4 pt-4 pb-6 z-50">
        <button
          onClick={handleCta}
          className="w-full bg-bg-dark text-white font-bold text-lg py-4 rounded-full shadow-lg active:scale-[0.98] transition-transform"
        >
          {isRTL ? 'פתחו את הארנק שלכם' : 'Open your wallet'}
        </button>
        <div className="text-center mt-2 text-[11px] text-text-muted flex justify-center items-center gap-1">
          <span>{isRTL ? 'ללא עלות' : 'No cost'}</span>
          <span className="text-border">•</span>
          <span>{isRTL ? 'התקנה מיידית' : 'Instant setup'}</span>
          <span className="text-border">•</span>
          <span>{isRTL ? 'ביטול בכל רגע' : 'Cancel anytime'}</span>
        </div>
      </div>
    </div>
  );
}
