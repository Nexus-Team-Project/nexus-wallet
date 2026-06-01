import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams, useSearchParams, useLocation } from 'react-router-dom';
import LanguageRouter from './LanguageRouter';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';
import { useRegistrationStore } from '../stores/registrationStore';

// ── Always eager (tiny, needed immediately) ─────────────────────────────────
import RegistrationGuard from '../components/registration/RegistrationGuard';
import AppLayout from '../components/layout/AppLayout';
import NotFoundPage from '../pages/NotFoundPage';

// ── Lazy chunks ──────────────────────────────────────────────────────────────
// Main app tabs — loaded right after initial render
const HomePage           = lazy(() => import('../pages/HomePage'));
const StorePage          = lazy(() => import('../pages/StorePage'));
const WalletPage         = lazy(() => import('../pages/WalletPage'));
const ActivityPage       = lazy(() => import('../pages/ActivityPage'));
const ProfilePage        = lazy(() => import('../pages/ProfilePage'));

// Utility pages
const SearchPage         = lazy(() => import('../pages/SearchPage'));
const AiChatPage         = lazy(() => import('../pages/AiChatPage'));
const NearYouMapPage     = lazy(() => import('../pages/NearYouMapPage'));
const InsightsPage       = lazy(() => import('../pages/InsightsPage'));
const StoriesPage        = lazy(() => import('../pages/StoriesPage'));
const ReferralStoriesPage = lazy(() => import('../pages/ReferralStoriesPage'));
const PremiumRevealPage  = lazy(() => import('../pages/PremiumRevealPage'));
const CategoryPage       = lazy(() => import('../pages/CategoryPage'));
const BusinessPage       = lazy(() => import('../pages/BusinessPage'));
const VoucherPurchasePage = lazy(() => import('../pages/VoucherPurchasePage'));

// Wallet add-money flow
const AddMoneyPage       = lazy(() => import('../pages/AddMoneyPage'));
const AddMoneySourcePage = lazy(() => import('../pages/AddMoneySourcePage'));
const AddMoneyLoadingPage = lazy(() => import('../pages/AddMoneyLoadingPage'));
const VoucherDetailPage  = lazy(() => import('../pages/VoucherDetailPage'));

// Registration flow — single chunk (user goes through all slides sequentially)
const RegisterMembershipPage   = lazy(() => import('../pages/RegisterMembershipPage'));
const RegisterPreferencesPage  = lazy(() => import('../pages/RegisterPreferencesPage'));
const RegistrationCompletePage = lazy(() => import('../pages/register/RegistrationCompletePage'));

// Onboarding slides — chunk per slide (loaded one at a time)
const VerifyPhoneSlide       = lazy(() => import('../pages/register/onboarding/VerifyPhoneSlide'));
const FirstNameSlide         = lazy(() => import('../pages/register/onboarding/FirstNameSlide'));
const VerifyEmailSlide       = lazy(() => import('../pages/register/onboarding/VerifyEmailSlide'));
const ConsentsSlide          = lazy(() => import('../pages/register/onboarding/ConsentsSlide'));
const MotivationSlide        = lazy(() => import('../pages/register/onboarding/MotivationSlide'));
const PurposeSlide           = lazy(() => import('../pages/register/onboarding/PurposeSlide'));
const LifeStageSlide         = lazy(() => import('../pages/register/onboarding/LifeStageSlide'));
const BirthdaySlide          = lazy(() => import('../pages/register/onboarding/BirthdaySlide'));
const GenderSlide            = lazy(() => import('../pages/register/onboarding/GenderSlide'));
const InviteFriendsSlide     = lazy(() => import('../pages/register/onboarding/InviteFriendsSlide'));

// Card issuance onboarding flow
const CardIssuanceStoriesPage = lazy(() => import('../pages/CardIssuanceStoriesPage'));

// Auth flow
const FlowTestPage         = lazy(() => import('../pages/auth-flow/FlowTestPage'));
const EmailRequiredPage    = lazy(() => import('../pages/auth/EmailRequiredPage'));
const EmailOtpPage         = lazy(() => import('../pages/auth/EmailOtpPage'));
const JoinStandalone       = lazy(() => import('../pages/auth-flow/JoinStandalone'));
const NewUserFlow = lazy(() =>
  import('../pages/auth-flow/AuthFlowStories').then((m) => ({ default: m.NewUserFlow }))
);
const OrgUserFlow = lazy(() =>
  import('../pages/auth-flow/AuthFlowStories').then((m) => ({ default: m.OrgUserFlow }))
);

// ── Minimal fallback (no spinner — just blank, transitions feel instant) ─────
function PageFallback() {
  return <div className="min-h-dvh bg-white" />;
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

/**
 * Index route for /:lang. The catalog is the public front door for
 * everyone (anonymous + logged-in), so redirect to /store. Preserve the
 * full incoming query string so ?tenant=X AND the Google OAuth ?code=
 * callback survive. Default to ?ecosystem=1 when no context is present.
 */
function IndexRoute() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (!params.get('tenant') && params.get('ecosystem') !== '1') {
    params.set('ecosystem', '1');
  }
  return <Navigate to={{ pathname: 'store', search: `?${params.toString()}` }} replace />;
}

/**
 * /:lang/store - the public catalog. No auth required to view. If neither
 * ?tenant nor ?ecosystem is present, default to ecosystem.
 */
function StoreRoute() {
  const { lang = 'he' } = useParams();
  const [searchParams] = useSearchParams();
  const hasContext = !!searchParams.get('tenant') || searchParams.get('ecosystem') === '1';
  if (!hasContext) {
    return <Navigate to={`/${lang}/store?ecosystem=1`} replace />;
  }
  return (<S><StorePage /></S>);
}

/**
 * Guards /:lang/auth-flow/*. The stories/onboarding chain only makes sense
 * mid-flow: allow when a registration is in progress OR a session exists
 * (a returning non-member reaching auth-flow/join is logged in). Otherwise
 * an anonymous cold-load bounces to the public ecosystem catalog.
 */
function AuthFlowGuard() {
  const { lang = 'he' } = useParams();
  const { me, loading } = useAuth();
  const isRegistering = useRegistrationStore((s) => s.isRegistering);
  if (loading) return null;
  if (!isRegistering && !me) {
    return <Navigate to={`/${lang}/store?ecosystem=1`} replace />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/he" replace />,
  },
  {
    path: '/:lang',
    element: <LanguageRouter />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // === PUBLIC routes ===
          // /:lang and /:lang/store: the public catalog front door for
          // everyone. /he redirects to /he/store, defaulting to
          // ?ecosystem=1 when no tenant/ecosystem context is present, so
          // anonymous and logged-in users both land on StorePage.
          // See IndexRoute + StoreRoute above.
          { index: true,      element: <IndexRoute /> },
          { path: 'home',     element: <S><HomePage /></S> },
          { path: 'store',    element: <StoreRoute /> },
          { path: 'search',           element: <S><SearchPage /></S> },
          { path: 'chat',             element: <S><AiChatPage /></S> },
          { path: 'near-you-map',     element: <S><NearYouMapPage /></S> },
          { path: 'insights',         element: <S><InsightsPage /></S> },
          { path: 'stories',          element: <S><StoriesPage /></S> },
          { path: 'referral-stories', element: <S><ReferralStoriesPage /></S> },
          { path: 'premium-reveal',   element: <S><PremiumRevealPage /></S> },
          { path: 'card-issuance',    element: <S><CardIssuanceStoriesPage /></S> },
          { path: 'category/:categoryId', element: <S><CategoryPage /></S> },
          { path: 'business/:businessId', element: <S><BusinessPage /></S> },
          { path: 'business/:businessId/voucher/:voucherId', element: <S><VoucherPurchasePage /></S> },

          // === PROTECTED routes ===
          {
            element: <ProtectedRoute />,
            children: [
              { path: 'wallet',                    element: <S><WalletPage /></S> },
              { path: 'wallet/add-money',          element: <S><AddMoneyPage /></S> },
              { path: 'wallet/add-money/source',   element: <S><AddMoneySourcePage /></S> },
              { path: 'wallet/add-money/loading',  element: <S><AddMoneyLoadingPage /></S> },
              { path: 'wallet/voucher/:voucherId', element: <S><VoucherDetailPage /></S> },
              { path: 'activity',                  element: <S><ActivityPage /></S> },
              { path: 'profile',                   element: <S><ProfilePage /></S> },
            ],
          },
        ],
      },

      // Registration flow
      {
        path: 'register',
        element: <RegistrationGuard />,
        children: [
          { path: 'membership',  element: <S><RegisterMembershipPage /></S> },
          { path: 'preferences', element: <S><RegisterPreferencesPage /></S> },
          { path: 'onboarding/verify-phone',       element: <S><VerifyPhoneSlide /></S> },
          { path: 'onboarding/first-name',         element: <S><FirstNameSlide /></S> },
          { path: 'onboarding/verify-email',       element: <S><VerifyEmailSlide /></S> },
          { path: 'onboarding/consents',           element: <S><ConsentsSlide /></S> },
          { path: 'onboarding/motivation',         element: <S><MotivationSlide /></S> },
          { path: 'onboarding/purpose',            element: <S><PurposeSlide /></S> },
          { path: 'onboarding/life-stage',         element: <S><LifeStageSlide /></S> },
          { path: 'onboarding/birthday',           element: <S><BirthdaySlide /></S> },
          { path: 'onboarding/gender',             element: <S><GenderSlide /></S> },
          { path: 'onboarding/invite-friends',     element: <S><InviteFriendsSlide /></S> },
          { path: 'complete',    element: <S><RegistrationCompletePage /></S> },
        ],
      },

      // Auth Flow
      {
        path: 'auth-flow',
        element: <AuthFlowGuard />,
        children: [
          { path: 'test',     element: <S><FlowTestPage /></S> },
          { path: 'new-user', element: <S><NewUserFlow /></S> },
          { path: 'org-user', element: <S><OrgUserFlow /></S> },
          { path: 'join',     element: <S><JoinStandalone /></S> },
        ],
      },

      // Plan #2: wallet auth (phone -> email signup branch + post-login router)
      {
        path: 'auth',
        children: [
          { path: 'email-required', element: <S><EmailRequiredPage /></S> },
          { path: 'email-otp',      element: <S><EmailOtpPage /></S> },
        ],
      },
      { path: '*', element: <Navigate to=".." replace /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
