import { useMemo, useState } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { mockBusinesses } from '../mock/data/businesses.mock';
import { useLanguage } from '../i18n/LanguageContext';
import { useUser } from '../hooks/useUser';
import { useTenantStore } from '../stores/tenantStore';
import { GIFT_CARDS, type GiftCard } from '../data/giftCards';
import PhoneInput, { formatPhoneNumber } from '../components/ui/PhoneInput';
import AnimatedActionIcon from '../components/layout/AnimatedActionIcon';
import profileUrl from '../assets/animations/profile.json?url';

// Wide white "NEXUS™" wordmark — the same brand lockup used on the credit card.
const NEXUS_WIDE_WHITE = '/nexus-white-wide-logo.png';

/**
 * GiftDetailsPage — "Send as a gift" details form.
 *
 * Reached from the checkout page's "Send as a gift" button. Lets the giver
 * personalise the gift: pick a digital card design, write a greeting, and
 * name + phone of the recipient (so the gift can be delivered to them). The
 * design mirrors the Wolt gift flow but rebuilt in the nexus design language
 * (light theme, brand tokens, RTL, rounded cards) rather than Wolt's dark UI.
 *
 * On Save it returns to the checkout carrying the gift details in nav state,
 * so the checkout reflects "Sending as a gift".
 */

export interface GiftDetails {
  cardId: string;
  senderName: string;
  message: string;
  recipientName: string;
  recipientPhone: string;
}

const MAX_MESSAGE = 200;

export default function GiftDetailsPage() {
  const { businessId, productId, voucherId } = useParams<{ businessId: string; productId?: string; voucherId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { data: user } = useUser();
  const tenantConfig = useTenantStore((s) => s.config);

  // The selectable cards: the built-in designs, plus a tenant-branded card
  // (logo big in the centre) when a tenant is active.
  const cards = useMemo<GiftCard[]>(() => {
    if (!tenantConfig?.logo) return GIFT_CARDS;
    const tenantCard: GiftCard = {
      id: 'tenant',
      label: tenantConfig.name,
      labelHe: tenantConfig.nameHe,
      gradient: `linear-gradient(150deg, ${tenantConfig.primaryColor ?? '#0a2540'} 0%, rgba(0,0,0,0.45) 150%)`,
      emoji: '🏷️',
      image: tenantConfig.logo,
      ink: '#ffffff',
      tenant: true,
    };
    return [...GIFT_CARDS, tenantCard];
  }, [tenantConfig]);

  const business = useMemo(
    () => mockBusinesses.find((b) => b.id === businessId),
    [businessId],
  );
  const product = useMemo(
    () => business?.products?.find((p) => p.id === productId),
    [business, productId],
  );

  const navState = location.state as {
    qty?: number;
    color?: { hex: string; name: string };
    gift?: GiftDetails;
  } | null;
  const qty = Math.max(1, navState?.qty ?? 1);
  const color = navState?.color;
  const existing = navState?.gift;

  // Pre-fill from any previously-saved gift, else sensible defaults.
  const [cardId, setCardId] = useState(existing?.cardId ?? GIFT_CARDS[0].id);
  const [senderName, setSenderName] = useState(
    existing?.senderName ?? [user?.firstName, user?.lastName].filter(Boolean).join(' ') ?? '',
  );
  const [message, setMessage] = useState(existing?.message ?? '');
  const [recipientName, setRecipientName] = useState(existing?.recipientName ?? '');
  const [recipientPhone, setRecipientPhone] = useState(existing?.recipientPhone ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Voucher context — no product needed; navigate back to voucher page instead
  const isVoucherContext = !!voucherId;

  if (!business || (!product && !isVoucherContext)) return <Navigate to=".." replace />;

  // The recipient name + a valid-ish phone are the gates for saving.
  const phoneDigits = recipientPhone.replace(/\D/g, '');
  const canSave = recipientName.trim().length > 0 && phoneDigits.length >= 7;

  // The card the recipient will see — drives the preview screen.
  const selectedCard = cards.find((c) => c.id === cardId) ?? cards[0];
  const productName = product ? (isHe ? product.nameHe : product.name) : '';

  const returnPath = isVoucherContext
    ? `/${language}/business/${business!.id}/voucher/${voucherId}`
    : `/${language}/business/${business!.id}/product/${product!.id}/checkout`;

  const handleSave = () => {
    if (!canSave) return;
    const gift: GiftDetails = {
      cardId,
      senderName: senderName.trim(),
      message: message.trim(),
      recipientName: recipientName.trim(),
      recipientPhone,
    };
    navigate(returnPath, { state: { qty, color, gift } });
  };

  // Pick a recipient from the device contacts where the Contact Picker API is
  // available (mobile Chrome/Safari); a no-op elsewhere.
  const handlePickContact = async () => {
    type ContactInfo = { name?: string[]; tel?: string[] };
    type ContactsManager = {
      select: (props: string[], opts?: { multiple?: boolean }) => Promise<ContactInfo[]>;
    };
    const contacts = (navigator as Navigator & { contacts?: ContactsManager }).contacts;
    if (!contacts?.select) return;
    try {
      const [picked] = await contacts.select(['name', 'tel'], { multiple: false });
      if (picked?.name?.[0]) setRecipientName(picked.name[0]);
      if (picked?.tel?.[0]) setRecipientPhone(formatPhoneNumber(picked.tel[0].replace(/\D/g, '')));
    } catch {
      /* user cancelled the picker */
    }
  };

  // Discard the gift entirely and return to the originating page without it.
  const handleDelete = () => {
    navigate(returnPath, { state: { qty, color } });
  };

  const sectionTitle = 'text-xl font-extrabold text-text-primary mb-5';
  const fieldLabel = 'block text-base font-bold text-text-primary mb-2';
  const inputCls =
    'w-full rounded-xl border border-border bg-white px-4 py-3.5 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary transition-colors shadow-sm text-start';

  return (
    <div className="relative min-h-dvh bg-white flex flex-col overflow-hidden" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Decorative gradient glow — identical to the home page wash. */}
      <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0">
        <div
          className="w-full h-full opacity-[0.18]"
          style={{
            background:
              'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)',
          }}
        />
      </div>

      {/* Header — fixed at the top (non-sticky), transparent over the gradient. */}
      <header className="relative z-10 flex items-center justify-between px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          aria-label={isHe ? 'חזרה' : 'Back'}
          className="p-2 -m-2 active:opacity-60 transition-opacity"
        >
          <span className="material-symbols-rounded text-text-primary" style={{ fontSize: 24 }}>
            {isHe ? 'arrow_forward' : 'arrow_back'}
          </span>
        </button>
        <h1 className="text-lg font-bold text-text-primary">
          {isHe ? 'הוספת פרטי מתנה' : 'Add gift details'}
        </h1>
        {existing ? (
          /* Discard the gift — only when editing an already-saved gift. */
          <button
            onClick={handleDelete}
            aria-label={isHe ? 'הסרת המתנה' : 'Remove gift'}
            className="p-2 -m-2 text-error active:opacity-60 transition-opacity"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 24 }}>delete</span>
          </button>
        ) : (
          <span className="w-8" aria-hidden />
        )}
      </header>

      <main className="relative z-10 flex-grow px-5 pt-6 pb-44">
        {/* ── Recipient details ── */}
        <section>
          <h2 className={sectionTitle}>{isHe ? 'פרטי הנמען' : 'Recipient details'}</h2>

          {/* Who is the gift for? */}
          <div className="mb-6">
            <label htmlFor="gift-recipient" className={fieldLabel}>{isHe ? 'למי המתנה?' : 'Who is the gift for?'}</label>

            {/* Pick from contacts — fills the name (and phone) from a contact. */}
            <button
              type="button"
              onClick={handlePickContact}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-3.5 text-sm font-bold text-text-primary shadow-sm active:bg-surface transition-colors"
            >
              {/* Wired profile Lottie (same as the TopBar profile icon) —
                  plays on mount and replays on press. */}
              <span className="shrink-0">
                <AnimatedActionIcon src={profileUrl} size={22} />
              </span>
              {isHe ? 'בחר מאנשי הקשר שלך' : 'Choose from your contacts'}
            </button>

            {/* "or" divider */}
            <div className="flex items-center gap-3 my-3">
              <span className="flex-1 h-px bg-border" />
              <span className="text-xs font-medium text-text-muted">{isHe ? 'או' : 'or'}</span>
              <span className="flex-1 h-px bg-border" />
            </div>

            <input
              id="gift-recipient"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder={isHe ? 'שם' : 'Name'}
              className={inputCls}
            />
          </div>

          {/* Recipient phone */}
          <div className="mb-6">
            <label className={fieldLabel}>{isHe ? 'מה המספר של מקבל המתנה?' : "Recipient's phone number?"}</label>
            <PhoneInput
              value={recipientPhone}
              onChange={setRecipientPhone}
              placeholder={isHe ? '050-000-0000' : '050-000-0000'}
            />
          </div>

          {/* Legal / info text */}
          <p className="text-sm text-text-secondary leading-relaxed">
            {isHe
              ? 'המספר הזה יקבל קישור למעקב, ויכול להיות שהשליח ייצור איתו קשר. בביצוע ההזמנה, מאושר על ידך שנשתף את שם המשתמש ומספר הטלפון עם מקבל ומוסר המשלוח, ושמסירת המידע האישי (לרבות לשליח) מותרת על פי דין.'
              : "This number will receive a tracking link, and the courier may contact them. By placing the order you confirm we may share your name and phone number with the recipient and courier, and that sharing this personal information (including with the courier) is permitted by law."}
          </p>
        </section>

        {/* ── Personalize — digital card picker ── */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-text-primary mb-2">
            {isHe ? 'להתאים אישית את המתנה שלך' : 'Personalize your gift'}
          </h2>
          <p className="text-base font-bold text-text-secondary mb-6">
            {isHe ? 'לבחירת כרטיס דיגיטלי' : 'Choose a digital card'}
          </p>

          {/* pt/pb give the selected card's ring + shadow room — an x-scroll
              container also clips the y-axis, so without padding the rounded
              tops get cut off. */}
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pt-3 pb-5 -mx-5 px-5 snap-x snap-mandatory scroll-px-5">
            {cards.map((c) => {
              const active = c.id === cardId;
              const lightCard = c.ink !== '#ffffff';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardId(c.id)}
                  aria-pressed={active}
                  className={`relative flex-none snap-start w-[280px] h-[380px] rounded-3xl p-5 flex flex-col text-start shadow-lg transition-all ${
                    active ? 'ring-2 ring-primary' : ''
                  }`}
                  style={{ background: c.gradient, color: c.ink }}
                >
                  {/* Confetti — festive decoration filling the tenant card,
                      sitting behind the logo. */}
                  {c.tenant && (
                    <img
                      src="/gift-cards/confetti.png"
                      alt=""
                      aria-hidden
                      className="absolute inset-0 z-0 h-full w-full object-cover object-top rounded-3xl pointer-events-none -translate-y-6"
                    />
                  )}

                  {/* Store (merchant brand) logo — same logo as the business
                      page. On normal cards it sits bare in the top-centre; on
                      the tenant card it moves to the bottom-right so the tenant
                      logo can own the centre. */}
                  {business.logoUrl && (
                    <img
                      src={business.logoUrl}
                      alt={isHe ? business.nameHe : business.name}
                      className={
                        c.tenant
                          ? 'absolute bottom-5 right-5 z-10 h-12 w-auto max-w-[40%] object-contain drop-shadow-md'
                          : 'absolute top-5 left-1/2 -translate-x-1/2 z-10 h-16 w-auto max-w-[65%] object-contain drop-shadow-md'
                      }
                    />
                  )}

                  {/* Nexus wordmark — same lockup as the credit card, pinned to
                      the bottom-left. Inverted to dark on light cards so it
                      stays legible. */}
                  <img
                    src={NEXUS_WIDE_WHITE}
                    alt="Nexus"
                    className="absolute bottom-5 left-5 z-10 h-10 w-auto"
                    style={lightCard ? { filter: 'brightness(0)', opacity: 0.85 } : undefined}
                  />
                  <span className="relative z-10 flex-1 flex items-center justify-center">
                    {c.tenant ? (
                      <img
                        src={c.image}
                        alt={isHe ? c.labelHe : c.label}
                        className="w-52 h-52 object-contain drop-shadow-xl -translate-y-10"
                      />
                    ) : (
                      <img
                        src={c.image}
                        alt={isHe ? c.labelHe : c.label}
                        className={`object-contain drop-shadow-xl ${
                          // The bouquet hand-off reads best edge-to-edge, so the
                          // hands touch the frame exactly; the rest stay inset.
                          c.id === 'love' ? 'w-[280px] max-w-none h-auto' : 'w-52 h-52'
                        }`}
                      />
                    )}
                  </span>
                  {active && (
                    <span
                      className="material-symbols-rounded absolute top-4"
                      style={{ fontSize: 28, fontVariationSettings: "'FILL' 1", insetInlineEnd: 16 }}
                    >
                      check_circle
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Sender name — floating label ── */}
        <section className="mt-10">
          <h2 className={sectionTitle}>{isHe ? 'ממי המתנה?' : 'Who is it from?'}</h2>
          <div className="relative">
            <label
              htmlFor="gift-sender"
              className="absolute top-2 text-xs font-bold text-text-muted"
              style={{ insetInlineStart: 16 }}
            >
              {isHe ? 'שם' : 'Name'}
            </label>
            <input
              id="gift-sender"
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full rounded-xl border border-border bg-white px-4 pt-7 pb-3 text-base font-bold text-text-primary outline-none focus:border-primary transition-colors shadow-sm text-start"
            />
          </div>
        </section>

        {/* ── Greeting ── */}
        <section className="mt-10">
          <h2 className={sectionTitle}>{isHe ? 'במילים שלך' : 'In your words'}</h2>
          <div className="relative">
            <input
              id="gift-message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
              placeholder={isHe ? 'מה לכתוב בברכה? 😍' : 'What should the note say? 😍'}
              className={`${inputCls} pe-12`}
            />
            <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ insetInlineEnd: 16 }}>
              <span className="material-symbols-rounded text-text-muted" style={{ fontSize: 22 }}>chat_bubble</span>
            </div>
          </div>
          <p className="mt-2 text-sm text-text-muted text-start">{isHe ? 'אופציונלי' : 'Optional'}</p>
        </section>
      </main>

      {/* Fixed action bar — Save (primary) stacked over Preview (text). */}
      <footer className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-white px-5 pt-4 pb-8 flex flex-col gap-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="w-full bg-bg-dark text-white py-4 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
        >
          {isHe ? 'שמירה' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { setRevealed(false); setPreviewOpen(true); }}
          className="w-full py-2 text-center text-base font-bold text-primary active:opacity-60 transition-opacity"
        >
          {isHe ? 'תצוגה מקדימה' : 'Preview'}
        </button>
      </footer>

      {/* ── Recipient preview ── full-screen screen showing the gift exactly as
          the recipient will receive it, opened from the "Preview" button.
          Tapping "Discover gift" flips the card to reveal the message + the
          actual product. */}
      {previewOpen && (
        <div className="fixed inset-0 z-[120] mx-auto max-w-md bg-white flex flex-col overflow-hidden animate-fade-in" dir={isHe ? 'rtl' : 'ltr'}>
          {/* Decorative gradient glow — identical to the home page wash. */}
          <div className="absolute top-0 inset-x-0 h-[280px] pointer-events-none z-0">
            <div
              className="w-full h-full opacity-[0.18]"
              style={{
                background:
                  'linear-gradient(135deg, #ffb74d 0%, #ff91b8 35%, #9c88ff 65%, #80deea 100%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 60%, #ffffff 100%)',
              }}
            />
          </div>

          {/* Header */}
          <header className="relative z-10 flex items-center justify-between px-4 py-4">
            <button
              onClick={() => { setPreviewOpen(false); setRevealed(false); }}
              aria-label={isHe ? 'סגירה' : 'Close'}
              className="h-10 w-10 inline-flex items-center justify-center rounded-full bg-white/70 backdrop-blur-sm active:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-rounded text-text-secondary" style={{ fontSize: 24 }}>close</span>
            </button>
            <h1 className="text-lg font-bold text-text-primary flex-grow text-center pe-10">{isHe ? 'תצוגה מקדימה' : 'Preview'}</h1>
          </header>

          {/* Scrollable body */}
          <main className={`relative z-10 flex-1 overflow-y-auto scrollbar-hide px-6 ${revealed ? 'pt-4 pb-10' : 'flex items-start justify-center pt-3 pb-4'}`}>
            <div className="w-full max-w-[360px] mx-auto">
              {/* Flip card */}
              <div className="flip-perspective w-full">
                <div className={`flip-inner ${revealed ? 'is-flipped' : ''}`}>
                  {/* FRONT — the chosen gift card */}
                  <div
                    className="flip-face relative w-full aspect-[10/15] rounded-2xl flex flex-col items-center justify-between p-7 overflow-hidden"
                    style={{
                      background: selectedCard.gradient,
                      color: selectedCard.ink,
                      boxShadow: '0 26px 40px -18px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    {business.logoUrl && (
                      <img
                        src={business.logoUrl}
                        alt={isHe ? business.nameHe : business.name}
                        className="h-14 w-auto max-w-[60%] object-contain drop-shadow-md"
                      />
                    )}

                    <div className="flex-1 min-h-0 w-full flex items-center justify-center animate-gift-float my-2">
                      <img
                        src={selectedCard.image}
                        alt=""
                        aria-hidden
                        className="max-w-[85%] max-h-full object-contain drop-shadow-xl"
                      />
                    </div>

                    <div className="w-full space-y-4">
                      <h2 className="text-2xl font-extrabold text-center leading-tight">
                        {isHe
                          ? `קיבלת מתנה מ${senderName.trim() ? ` ${senderName.trim()}` : ''}!`
                          : `You've got a gift${senderName.trim() ? ` from ${senderName.trim()}` : ''}!`}
                      </h2>
                      {message.trim() && (
                        <p className="text-center text-sm font-semibold leading-relaxed opacity-90 whitespace-pre-wrap break-words">
                          “{message.trim()}”
                        </p>
                      )}
                      <div className="flex flex-col items-center gap-3 pt-1">
                        <img
                          src={NEXUS_WIDE_WHITE}
                          alt="Nexus"
                          className="h-7 w-auto"
                          style={selectedCard.ink !== '#ffffff' ? { filter: 'brightness(0)', opacity: 0.85 } : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setRevealed(true)}
                          className="w-full bg-bg-dark text-white py-4 px-6 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98]"
                        >
                          {isHe ? 'גלה מתנה' : 'Discover gift'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BACK — the opened message, in the refer-a-friend card colour */}
                  <div
                    className="flip-face flip-face-back w-full aspect-[10/15] rounded-2xl p-8 flex flex-col text-start overflow-hidden"
                    style={{ background: '#0a2540', boxShadow: '0 26px 40px -18px rgba(0, 0, 0, 0.45)' }}
                  >
                    <h2 className="mt-16 text-3xl font-black text-white leading-tight">
                      {isHe ? 'איזה כיף, קיבלת משהו במיוחד בשבילך!' : 'How lovely — someone got you something special!'}
                    </h2>
                    {message.trim() && (
                      <p className="mt-5 text-base font-semibold text-white/80 leading-relaxed whitespace-pre-wrap break-words">
                        “{message.trim()}”
                      </p>
                    )}
                    <p className="mt-auto text-2xl font-bold text-[#7dd3fc]">
                      {senderName.trim() || (isHe ? 'מאיתנו' : 'From us')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gift item — appears once the card is opened */}
              {revealed && (
                <section className="mt-8 animate-fade-in">
                  <h3 className="text-xl font-bold text-text-primary mb-4 text-start">{isHe ? 'המתנה שלך' : 'Your gift'}</h3>
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-border flex flex-col">
                    <div className="h-48 w-full overflow-hidden bg-surface">
                      {product.image && (
                        <img src={product.image} alt={productName} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4 bg-[#222222] flex justify-between items-center">
                      <span className="text-white text-lg font-medium">{productName}</span>
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                    </div>
                  </div>
                </section>
              )}
            </div>
          </main>

          {/* Sticky footer — once the gift is opened it becomes a Save bar
              (matching the checkout button); otherwise an iOS home indicator. */}
          <footer className="relative z-10 shrink-0 px-6 pt-2 pb-6">
            {revealed ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="w-full bg-bg-dark text-white py-4 rounded-full font-bold text-base shadow-lg shadow-bg-dark/30 transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
              >
                {isHe ? 'שמירה' : 'Save'}
              </button>
            ) : (
              <div className="h-8 flex justify-center items-end pb-2">
                <div className="w-32 h-1 bg-border rounded-full" />
              </div>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}
