import { useNavigate, useParams } from 'react-router-dom';
import HeroBanner from '../components/home/HeroBanner';
import BrandSlider from '../components/home/BrandSlider';
import ActiveOffers from '../components/home/ActiveOffers';
import TopStores from '../components/home/TopStores';
import NearYou from '../components/home/NearYou';
import ReferralBanner from '../components/home/ReferralBanner';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { useGeolocationStore } from '../stores/geolocationStore';

export default function HomePage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const setTenant = useTenantStore((s) => s.setTenant);
  const clearTenant = useTenantStore((s) => s.clearTenant);
  const resetGeolocation = useGeolocationStore((s) => s.reset);

  const handleDevLogin = () => {
    login({
      token: `tok_dev_${Date.now()}`,
      userId: 'usr_001',
      method: 'google',
      isOrgMember: true,
      organizationName: 'מועדון עץ ההטבות של גולני',
      avatarUrl: 'https://ui-avatars.com/api/?name=Daniel+Cohen&background=635bff&color=fff&size=128&bold=true',
    });
    setTenant('golani-club', {
      id: 'golani-club',
      name: 'Golani Benefits Club',
      nameHe: 'מועדון עץ ההטבות של גולני',
      logo: '/nexus-logo.png',
      primaryColor: '#635bff',
      requiresMembershipFee: false,
      membershipBenefits: [
        'Exclusive deals up to 50% off',
        'Early access to new vouchers',
        'Premium member support',
      ],
      membershipBenefitsHe: [
        'הנחות בלעדיות עד 50%',
        'גישה מוקדמת לשוברים חדשים',
        'תמיכת חברים פרימיום',
      ],
    });
    window.location.reload();
  };

  const handleResetUser = () => {
    logout();
    clearTenant();
    window.location.reload();
  };

  return (
    <div className="animate-fade-in">
      <HeroBanner />
      <BrandSlider />
      <TopStores />
      <ReferralBanner />
      <NearYou />
      <ActiveOffers />

      {/* DEV ONLY: Login / Reset buttons */}
      <div className="px-6 py-4 flex flex-col gap-2">
        {!isAuthenticated && (
          <button
            onClick={handleDevLogin}
            className="w-full py-3 rounded-2xl bg-primary/10 text-primary text-xs font-semibold border border-primary/20 active:scale-[0.98] transition-all"
          >
            כניסה כדניאל (Dev)
          </button>
        )}
        {isAuthenticated && (
          <button
            onClick={handleResetUser}
            className="w-full py-3 rounded-2xl bg-error/10 text-error text-xs font-semibold border border-error/20 active:scale-[0.98] transition-all"
          >
            איפוס משתמש (Dev)
          </button>
        )}
        <button
          onClick={() => {
            resetGeolocation();
            window.location.reload();
          }}
          className="w-full py-3 rounded-2xl bg-amber-500/10 text-amber-600 text-xs font-semibold border border-amber-500/20 active:scale-[0.98] transition-all"
        >
          איפוס שיתוף מיקום (Dev)
        </button>
        <button
          onClick={() => navigate(`/${lang}/stories`)}
          className="w-full py-3 rounded-2xl bg-purple-500/10 text-purple-600 text-xs font-semibold border border-purple-500/20 active:scale-[0.98] transition-all"
        >
          Smart Stories (Dev)
        </button>
        <button
          onClick={() => navigate(`/${lang}/premium-reveal`)}
          className="w-full py-3 rounded-2xl bg-pink-500/10 text-pink-600 text-xs font-semibold border border-pink-500/20 active:scale-[0.98] transition-all"
        >
          Premium Reveal (Dev)
        </button>
        <button
          onClick={() => navigate(`/${lang}/auth-flow/test`)}
          className="w-full py-3 rounded-2xl bg-warning/10 text-warning text-xs font-semibold border border-warning/20 active:scale-[0.98] transition-all"
        >
          🧪 Auth Flow Test (Dev)
        </button>
      </div>
    </div>
  );
}
