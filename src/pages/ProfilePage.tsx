import { useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Crown, Heart } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuthStore } from '../stores/authStore';
import { useUser } from '../hooks/useUser';
import { mockBusinesses } from '../mock/data/businesses.mock';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs, { type ProfileTab } from '../components/profile/ProfileTabs';
import ProfileRecords from '../components/profile/ProfileRecords';
import ProfileBadges from '../components/profile/ProfileBadges';
import MenuList from '../components/profile/MenuList';
import OrgPickerSheet from '../components/profile/OrgPickerSheet';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import PaymentBrandMark from '../components/wallet/PaymentBrandMark';
import { mockTransactions } from '../mock/data/transactions.mock';
import AnimatedLocationIcon from '../components/ui/AnimatedLocationIcon';
import AddressMapThumb from '../components/business/AddressMapThumb';

/**
 * Profile page — flat M3-style layout:
 *  1. Page header with title + settings shortcut (sits under the
 *     overlay TopBar that AppLayout renders globally, hence the pt-20).
 *  2. Centered avatar + name + email hero.
 *  3. Tab strip (Activity / Saved / Help / Settings) — controls which
 *     section is shown below.
 *     - Activity → Records + Badges
 *     - Settings → full options list (notifications, language, help,
 *                  about, logout, …)
 *     - Saved / Help → empty for now (placeholder shown).
 */
export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>('activity');
  const [orgPickerOpen, setOrgPickerOpen] = useState(false);
  const authOrgName = useAuthStore((s) => s.organizationName);
  const { data: user } = useUser();
  const orgName = authOrgName ?? user?.organizationName;

  return (
    <div className="animate-fade-in pb-10">
      {/* Page header — mirrors the notifications page pattern. pt-20
          clears the global TopBar overlay (avatar + chat + bell). The
          gear here is a shortcut that jumps the tab strip to Settings. */}
      <header className="relative px-4 pt-20 pb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t.profile.title}</h1>
        <button
          type="button"
          aria-label="Profile settings"
          onClick={() => setTab('settings')}
          className="p-2 rounded-full text-text-secondary hover:bg-surface transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            settings
          </span>
        </button>
      </header>

      <ProfileHeader />

      {/* Cashback bubble */}
      <CashbackBubble isHe={language === 'he'} />

      {/* Quick-action grid — 2×2 */}
      <div className="px-6 pt-4 grid grid-cols-2 gap-4">
        {/* Premium */}
        <QuickCard
          label="Nexus Premium"
          onClick={() => navigate(`/${lang}/premium`)}
          iconBg="linear-gradient(135deg, #635bff 0%, #7c6cff 50%, #5649d8 100%)"
          iconColor="text-white"
        >
          <Crown size={20} strokeWidth={1.8} className="text-white" />
        </QuickCard>

        {/* Tenant / org */}
        {orgName ? (
          <QuickCard label={orgName} iconBg="#f0f0f0" onClick={() => setOrgPickerOpen(true)}>
            <span className="material-symbols-outlined text-gray-800" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
              apartment
            </span>
          </QuickCard>
        ) : <div />}

        {/* Saved — with overlapping brand logo tiles */}
        <button
          type="button"
          className="bg-white rounded-2xl p-4 flex flex-col items-start justify-between h-28 border border-gray-100 active:scale-95 transition-transform"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <LogoStack logos={[
            { src: '/brands/mcdonalds.png', bg: '#FFC72C', rot: -4 },
            { src: '/brands/aroma.png',     bg: '#2D6A4F', rot: 3  },
            { src: '/brands/hm.png',        bg: '#E8E8E8', rot: -3 },
            { src: '/brands/shufersal.png', bg: '#FF0000', rot: 5  },
          ]} />
          <span className="text-sm font-medium text-gray-900">{language === 'he' ? 'שמורים' : 'Saved'}</span>
        </button>

        {/* Following — with overlapping brand logo tiles */}
        <button
          type="button"
          className="bg-white rounded-2xl p-4 flex flex-col items-start justify-between h-28 border border-gray-100 active:scale-95 transition-transform"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
        >
          <LogoStack logos={[
            { src: '/brands/superpharm.png', bg: '#E30613', rot: -4 },
            { src: '/brands/ksp.png',        bg: '#1A1A1A', rot: 4  },
            { src: '/brands/golf.png',       bg: '#F5F0E8', rot: -3 },
            { src: '/brands/cinema-city.png',bg: '#1C1C1C', rot: 5  },
          ]} />
          <span className="text-sm font-medium text-gray-900">{language === 'he' ? 'עוקב אחרי' : 'Following'}</span>
        </button>
      </div>

      {/* Recently Viewed slider */}
      <ProfileRecentlyViewed />

      <ProfileTabs selected={tab} onChange={setTab} />

      {tab === 'activity' && (
        <>
          <ProfileRecords />
          <ProfileBadges />
        </>
      )}

      {tab === 'settings' && <MenuList />}

      {tab === 'account' && <AccountTab />}

      <OrgPickerSheet isOpen={orgPickerOpen} onClose={() => setOrgPickerOpen(false)} />

      {(tab === 'saved' || tab === 'help') && (
        <div className="px-4 pt-12 text-center text-sm text-text-muted">—</div>
      )}
    </div>
  );
}

function CashbackBubble({ isHe }: { isHe: boolean }) {
  const total = mockTransactions
    .filter((tx) => tx.type === 'cashback' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="px-6 pt-3 flex justify-center">
      <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-4 py-1.5">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
            {isHe ? 'קאשבק שנצבר' : 'Total cashback'}
          </span>
          <span className="text-[15px] font-bold text-gray-900 tabular-nums" dir="ltr">
            ₪{total % 1 === 0 ? total : total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProfileRecentlyViewed() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [favs, setFavs] = useState<Set<string>>(new Set());

  const toggleFav = (key: string) =>
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Mix brand tiles + product tiles
  type Tile =
    | { kind: 'brand'; key: string; name: string; logoUrl: string; bg?: string; bizId: string }
    | { kind: 'product'; key: string; name: string; image: string; price: number; currency: string; bizId: string; productId: string };

  const tiles: Tile[] = [];
  const BG_PALETTE = ['#f5f0eb', '#e8f4f8', '#f0ebe8', '#edf5ee', '#f5edf5', '#fff8e7'];
  let bgIdx = 0;

  for (const b of mockBusinesses.slice(0, 10)) {
    if (b.logoUrl) {
      tiles.push({ kind: 'brand', key: `b-${b.id}`, name: isHe ? b.nameHe : b.name, logoUrl: b.logoUrl, bg: BG_PALETTE[bgIdx++ % BG_PALETTE.length], bizId: b.id });
    }
    const prod = (b.products ?? []).find((p) => p.image);
    if (prod) {
      tiles.push({ kind: 'product', key: `p-${b.id}-${prod.id}`, name: isHe ? prod.nameHe : prod.name, image: prod.image, price: prod.price, currency: prod.currency, bizId: b.id, productId: prod.id });
    }
  }

  if (tiles.length === 0) return null;

  return (
    <section className="mt-6 mb-6" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="px-6 mb-3 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-gray-900">{isHe ? 'נצפו לאחרונה' : 'Recently viewed'}</h2>
        <button
          onClick={() => navigate(`/${lang}/store`)}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-90 transition-transform"
          aria-label={isHe ? 'הכל' : 'See all'}
        >
          <span className="material-symbols-rounded text-gray-700 block" style={{ fontSize: 18 }}>
            {isHe ? 'arrow_back' : 'arrow_forward'}
          </span>
        </button>
      </div>

      {/* Horizontal scroll */}
      <div
        className="flex overflow-x-auto gap-3 px-6 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {tiles.map((tile) =>
          tile.kind === 'brand' ? (
            <button
              key={tile.key}
              onClick={() => navigate(`/${lang}/business/${tile.bizId}`)}
              className="flex-shrink-0 w-44 h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-sm active:scale-[0.97] transition-transform flex items-center justify-center p-5"
              style={{ backgroundColor: tile.bg ?? '#f5f5f5' }}
            >
              <img src={tile.logoUrl} alt={tile.name} className="max-h-20 max-w-full object-contain" />
            </button>
          ) : (
            <button
              key={tile.key}
              onClick={() => navigate(`/${lang}/business/${tile.bizId}/product/${tile.productId}`)}
              className="flex-shrink-0 w-44 h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative bg-gray-100 active:scale-[0.97] transition-transform"
            >
              <img src={tile.image} alt={tile.name} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              {/* Price badge */}
              <span className="absolute top-2.5 px-2 py-0.5 rounded-full text-white text-[11px] font-semibold bg-black/35 backdrop-blur-sm" style={{ insetInlineStart: 10 }} dir="ltr">
                {tile.currency}{tile.price}
              </span>
              {/* Heart */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleFav(tile.key); }}
                className={`absolute bottom-2.5 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors ${favs.has(tile.key) ? 'bg-primary' : 'bg-black/20'}`}
                style={{ insetInlineEnd: 10 }}
                aria-label="Favorite"
              >
                <Heart size={15} className="text-white" fill={favs.has(tile.key) ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </button>
          )
        )}
      </div>
    </section>
  );
}

function LogoStack({ logos }: { logos: { src: string; bg: string; rot: number }[] }) {
  return (
    <div className="flex items-center">
      {logos.map((l, i) => (
        <span
          key={l.src}
          className="relative w-9 h-9 rounded-xl border border-black/5 overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: l.bg,
            marginInlineStart: i === 0 ? 0 : -10,
            transform: `rotate(${l.rot}deg)`,
            zIndex: 10 - i,
          }}
        >
          <img
            src={l.src}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-contain opacity-0 transition-opacity p-1"
            onLoad={(e) => { if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1'; }}
          />
        </span>
      ))}
    </div>
  );
}

function QuickCard({
  label,
  onClick,
  iconBg,
  iconColor,
  children,
}: {
  label: string;
  onClick?: () => void;
  iconBg?: string;
  iconColor?: string;
  children: ReactNode;
}) {
  const bg = iconBg ?? '#f3f4f6';
  const isGradient = bg.startsWith('linear');
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-4 flex flex-col items-start justify-between h-28 border border-gray-100 active:scale-95 transition-transform text-start"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${iconColor ?? 'text-gray-800'}`}
        style={isGradient ? { background: bg } : { backgroundColor: bg }}
      >
        {children}
      </div>
      <span className="text-sm font-medium text-gray-900 truncate w-full">{label}</span>
    </button>
  );
}

function AccountTab() {
  const { language } = useLanguage();
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isHe = language === 'he';

  const [addresses, setAddresses] = useState([
    { id: 'home',    label: isHe ? 'בית'       : 'Home',    line: isHe ? 'הרצל 45, תל אביב'     : '45 Herzl St, Tel Aviv',         coords: { lng: 34.7706, lat: 32.0632 } },
    { id: 'work',    label: isHe ? 'עבודה'     : 'Work',    line: isHe ? 'רוטשילד 12, תל אביב'  : '12 Rothschild Blvd, Tel Aviv',  coords: { lng: 34.7710, lat: 32.0644 } },
    { id: 'parents', label: isHe ? 'הורים'     : 'Parents', line: isHe ? 'דיזנגוף 100, תל אביב' : '100 Dizengoff St, Tel Aviv',    coords: { lng: 34.7740, lat: 32.0790 } },
    { id: 'gym',     label: isHe ? 'חדר כושר'  : 'Gym',     line: isHe ? 'ויצמן 15, חיפה'       : '15 Weizmann St, Haifa',         coords: { lng: 34.9896, lat: 32.7940 } },
  ]);
  const [selectedAddressId, setSelectedAddressId] = useState('home');
  const [addrAnimTick, setAddrAnimTick] = useState<Record<string, number>>({});
  const [addressOpen, setAddressOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const { data: user } = useUser();
  const selectedAddress = addresses.find((a) => a.id === selectedAddressId) ?? addresses[0];
  const mapCenter = selectedAddress?.coords ?? { lng: 34.7818, lat: 32.0853 };

  const { data: paymentMethods } = usePaymentMethods();
  const [payMethodId, setPayMethodId] = useState(paymentMethods[0]?.id ?? '');
  const [connectedWallets, setConnectedWallets] = useState<Record<string, boolean>>({ bit: false, paybox: false });
  const walletOptions = [
    { id: 'bit',    label: 'bit',    labelHe: 'ביט',      color: '#E5007D', logo: '/logos/bit.png' },
    { id: 'paybox', label: 'payBox', labelHe: 'פייבוקס',  color: '#19A7CE', logo: '/logos/paybox.webp' },
  ];
  const selectedPayMethod = paymentMethods.find((m) => m.id === payMethodId) ?? paymentMethods[0];
  const walletMethod = walletOptions.find((w) => w.id === payMethodId && connectedWallets[w.id]);
  const [paymentOpen, setPaymentOpen] = useState(true);

  return (
    <div className="px-6 pt-2 pb-10">

      {/* ── Addresses ── */}
      <section className="mt-6">
        <button
          type="button"
          onClick={() => setAddressOpen((v) => !v)}
          aria-expanded={addressOpen}
          className="w-full flex items-center justify-between gap-3 mb-3"
        >
          <h2 className="text-lg font-bold text-text-primary">{isHe ? 'הכתובות שלי' : 'My addresses'}</h2>
          <span
            className="material-symbols-rounded text-text-muted transition-transform"
            style={{ fontSize: 22, transform: addressOpen ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </button>

        {addressOpen && (
          <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
            {/* Map */}
            <div className="relative rounded-2xl overflow-hidden border border-border/30 h-[220px] mb-4">
              <AddressMapThumb
                lng={mapCenter.lng}
                lat={mapCenter.lat}
                avatarUrl={user?.avatar}
                onLoad={() => setMapReady(true)}
                className="w-full h-full"
                interactive={false}
              />
              <div
                aria-hidden
                className="absolute inset-0 z-[5] pointer-events-none overflow-hidden bg-[#e9eaef] transition-opacity duration-500"
                style={{ opacity: mapReady ? 0 : 1 }}
              >
                <div
                  className="absolute inset-y-0 w-2/3"
                  style={{
                    background: 'linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
                    animation: 'map-shimmer 1.4s ease-in-out infinite',
                  }}
                />
              </div>
            </div>

            <div className="-mx-4 px-4 mb-4 border-b border-border/60 pb-4">
              <div className="flex overflow-x-auto scrollbar-hide gap-3 snap-x snap-mandatory scroll-px-4 pb-1">
                {addresses.map((addr) => {
                  const active = addr.id === selectedAddressId;
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(addr.id);
                        setAddrAnimTick((m) => ({ ...m, [addr.id]: (m[addr.id] ?? 0) + 1 }));
                      }}
                      className={`flex-none w-48 snap-start text-start rounded-2xl border-2 p-3 transition-colors active:scale-[0.99] ${
                        active ? 'border-primary shadow-md bg-primary/5' : 'border-border/40 shadow-sm bg-white'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2 mb-1.5">
                        <AnimatedLocationIcon size={18} className={active ? 'text-primary' : 'text-text-muted'} playKey={addrAnimTick[addr.id] ?? 0} />
                        {active && (
                          <span className="material-symbols-rounded text-primary" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        )}
                      </span>
                      <span className="block text-sm font-bold text-text-primary">{addr.label}</span>
                      <span className="block text-xs text-text-muted leading-snug">{addr.line}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setAddresses((prev) => [...prev, { id: `new-${prev.length}`, label: isHe ? 'כתובת חדשה' : 'New address', line: '', coords: { lng: 34.7818, lat: 32.0853 } }])}
                  className="flex-none w-32 snap-start rounded-2xl bg-surface flex flex-col items-center justify-center gap-2 py-5 active:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>add</span>
                  <span className="text-xs font-semibold text-text-primary text-center leading-tight">{isHe ? 'הוספת כתובת' : 'Add address'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Payment methods ── */}
      <section className="mt-8">
        <button
          type="button"
          onClick={() => setPaymentOpen((v) => !v)}
          aria-expanded={paymentOpen}
          className="w-full flex items-center justify-between gap-3 mb-3"
        >
          <h2 className="text-lg font-bold text-text-primary">{isHe ? 'אמצעי תשלום' : 'Payment method'}</h2>
          <span
            className="material-symbols-rounded text-text-muted transition-transform"
            style={{ fontSize: 22, transform: paymentOpen ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </button>

        {paymentOpen && (
          <div className="border border-border rounded-2xl bg-white shadow-sm p-4">
            {(walletMethod || selectedPayMethod) && (
              <div className="w-full flex items-center gap-3 text-start pb-4 border-b border-border/60">
                <span className="relative shrink-0">
                  {walletMethod ? (
                    <span className="relative inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 h-10 min-w-[64px]">
                      <span className="text-sm font-black lowercase leading-none" style={{ color: walletMethod.color }}>
                        {walletMethod.label}
                      </span>
                      {walletMethod.logo && (
                        <img src={walletMethod.logo} alt="" aria-hidden
                          className="absolute inset-0 m-auto h-5 w-auto max-w-[80%] object-contain opacity-0 transition-opacity"
                          onLoad={(e) => { if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1'; }}
                        />
                      )}
                    </span>
                  ) : (
                    <PaymentBrandMark brand={selectedPayMethod.brand} />
                  )}
                  <span className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shadow">
                    <span className="material-symbols-rounded" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check</span>
                  </span>
                </span>
                <span className="flex-grow min-w-0">
                  <span className="block text-[15px] font-bold text-text-primary truncate">
                    {walletMethod ? (isHe ? walletMethod.labelHe : walletMethod.label) : (isHe ? selectedPayMethod.labelHe : selectedPayMethod.label)}
                  </span>
                  {!walletMethod && selectedPayMethod.last4 && (
                    <span className="block text-xs text-text-muted" dir="ltr">···· {selectedPayMethod.last4}</span>
                  )}
                </span>
              </div>
            )}

            <div className="-mx-4 px-4 mt-4">
              <div className="flex overflow-x-auto overscroll-x-contain scrollbar-hide gap-3 snap-x snap-proximity scroll-px-4 pb-1 touch-pan-x">
                {paymentMethods.map((m) => {
                  const active = m.id === payMethodId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethodId(m.id)}
                      className={`flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${
                        active ? 'border-primary shadow-sm' : 'border-border'
                      }`}
                    >
                      <PaymentBrandMark brand={m.brand} />
                      <span className="text-xs font-medium text-text-secondary text-center leading-tight truncate w-full" dir="ltr">
                        {m.last4 ? `···· ${m.last4}` : (isHe ? m.labelHe : m.label)}
                      </span>
                    </button>
                  );
                })}

                {walletOptions.map((w) => {
                  const connected = connectedWallets[w.id];
                  const active = connected && payMethodId === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        connected ? setPayMethodId(w.id) : setConnectedWallets((prev) => ({ ...prev, [w.id]: true }))
                      }
                      className={`flex-none w-36 snap-start rounded-xl border p-3 flex flex-col items-center gap-2 bg-white transition-colors ${
                        active ? 'border-primary shadow-sm' : 'border-border'
                      }`}
                    >
                      <span
                        className="relative inline-flex items-center justify-center rounded-lg border border-border bg-white px-3 py-1.5 h-9 min-w-[64px] transition-all"
                        style={{ filter: connected ? 'none' : 'grayscale(1)', opacity: connected ? 1 : 0.55 }}
                      >
                        <span className="text-sm font-black lowercase leading-none" style={{ color: connected ? w.color : '#9ca3af' }}>
                          {w.label}
                        </span>
                        {w.logo && (
                          <img src={w.logo} alt="" aria-hidden
                            className="absolute inset-0 m-auto h-5 w-auto max-w-[80%] object-contain opacity-0 transition-opacity"
                            onLoad={(e) => { if (e.currentTarget.naturalWidth > 1) e.currentTarget.style.opacity = '1'; }}
                          />
                        )}
                      </span>
                      <span
                        className="text-xs font-medium text-center leading-tight truncate w-full inline-flex items-center justify-center gap-0.5"
                        style={{ color: connected ? 'var(--color-text-secondary)' : '#9ca3af' }}
                      >
                        {connected ? (isHe ? w.labelHe : w.label) : (
                          <>
                            <span className="material-symbols-rounded" style={{ fontSize: 14 }}>link</span>
                            {isHe ? 'לחיבור' : 'Connect'}
                          </>
                        )}
                      </span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => navigate(`/${lang}/wallet/add-payment-method`)}
                  className="flex-none w-36 snap-start rounded-xl bg-surface p-3 flex flex-col items-center justify-center gap-2 active:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-rounded text-primary" style={{ fontSize: 28 }}>add</span>
                  <span className="text-xs font-semibold text-text-primary text-center leading-tight">
                    {isHe ? 'הוספת אמצעי תשלום' : 'Add payment'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
