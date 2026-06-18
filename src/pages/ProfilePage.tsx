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

      <OrgPickerSheet isOpen={orgPickerOpen} onClose={() => setOrgPickerOpen(false)} />

      {(tab === 'saved' || tab === 'help') && (
        <div className="px-4 pt-12 text-center text-sm text-text-muted">—</div>
      )}
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
