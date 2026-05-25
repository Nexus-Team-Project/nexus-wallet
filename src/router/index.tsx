import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import LanguageRouter from './LanguageRouter';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';
import { useAuth } from '../contexts/AuthContext';

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
const BenefitCategoriesSlide = lazy(() => import('../pages/register/onboarding/BenefitCategoriesSlide'));
const InviteFriendsSlide     = lazy(() => import('../pages/register/onboarding/InviteFriendsSlide'));

// Card issuance onboarding flow
const CardIssuanceStoriesPage = lazy(() => import('../pages/CardIssuanceStoriesPage'));

// Auth flow
const FlowTestPage         = lazy(() => import('../pages/auth-flow/FlowTestPage'));
const EmailRequiredPage    = lazy(() => import('../pages/auth/EmailRequiredPage'));
const EmailOtpPage         = lazy(() => import('../pages/auth/EmailOtpPage'));
const RouterScreen         = lazy(() => import('../pages/router/RouterScreen'));
const JoinTenantPage       = lazy(() => import('../pages/wallet/JoinTenantPage'));
const JoinSubmittedPage    = lazy(() => import('../pages/wallet/JoinSubmittedPage'));
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
 * Index route for /:lang. Logged-in users get redirected to the store
 * catalog. Anonymous users render nothing so AppLayout shows the
 * AnonymousSplash.
 *
 * When AuthContext exposes a postLoginRedirect signal (set by the
 * bootstrap after a fresh Google redirect-flow exchange), IndexRoute
 * RENDERS NULL so no premature Navigate-to-store fires. The
 * LanguageRouter effect owns navigation in that case and routes the
 * user to /:lang/router. After it clears the signal, IndexRoute would
 * naturally redirect to store on any later visit to /:lang.
 *
 * Without this deferral, IndexRoute's child-first effect order beat
 * LanguageRouter's redirect, leaving the user on /:lang/store instead
 * of the chooser.
 */
function IndexRoute() {
  const { me, loading, postLoginRedirect } = useAuth();
  if (loading) return null;
  if (!me) return null;
  if (postLoginRedirect) return null; // LanguageRouter is about to navigate
  return <Navigate to="store" replace />;
}

/**
 * /:lang/store guard. Anonymous users get bounced back to /:lang so
 * the wallet has exactly one anonymous landing URL. Logged-in users
 * see StorePage as usual.
 */
function StoreRoute() {
  const { me, loading } = useAuth();
  const { lang = 'he' } = useParams();
  if (loading) return null;
  if (!me) return <Navigate to={`/${lang}`} replace />;
  return (
    <S>
      <StorePage />
    </S>
  );
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
          // /:lang and /:lang/store: a single anonymous landing URL.
          // Anonymous typing /he/store gets redirected to /he, where
          // AppLayout renders AnonymousSplash. Logged-in typing /he
          // gets redirected to /he/store, where StorePage renders.
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
          { path: 'wallet/add-money',          element: <S><AddMoneyPage /></S> },
          { path: 'wallet/add-money/source',   element: <S><AddMoneySourcePage /></S> },
          { path: 'wallet/add-money/loading',  element: <S><AddMoneyLoadingPage /></S> },
          { path: 'wallet/voucher/:voucherId', element: <S><VoucherDetailPage /></S> },

          // === PROTECTED routes ===
          {
            element: <ProtectedRoute />,
            children: [
              { path: 'wallet',   element: <S><WalletPage /></S> },
              { path: 'activity', element: <S><ActivityPage /></S> },
              { path: 'profile',  element: <S><ProfilePage /></S> },
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
          { path: 'onboarding/benefit-categories', element: <S><BenefitCategoriesSlide /></S> },
          { path: 'onboarding/invite-friends',     element: <S><InviteFriendsSlide /></S> },
          { path: 'complete',    element: <S><RegistrationCompletePage /></S> },
        ],
      },

      // Auth Flow
      {
        path: 'auth-flow',
        children: [
          { path: 'test',       element: <S><FlowTestPage /></S> },
          { path: 'new-user',   element: <S><NewUserFlow /></S> },
          { path: 'org-user',   element: <S><OrgUserFlow /></S> },
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
      { path: 'router', element: <S><RouterScreen /></S> },

      // Plan #4: wallet tenant-join flow
      {
        path: 'wallet',
        children: [
          { path: 'join-tenant',    element: <S><JoinTenantPage /></S> },
          { path: 'join-submitted', element: <S><JoinSubmittedPage /></S> },
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
