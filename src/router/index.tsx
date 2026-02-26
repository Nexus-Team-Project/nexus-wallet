import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LanguageRouter from './LanguageRouter';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';

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

// Registration flow — single chunk (user goes through all slides sequentially)
const RegisterMembershipPage   = lazy(() => import('../pages/RegisterMembershipPage'));
const RegisterPreferencesPage  = lazy(() => import('../pages/RegisterPreferencesPage'));
const RegistrationCompletePage = lazy(() => import('../pages/register/RegistrationCompletePage'));

// Onboarding slides — chunk per slide (loaded one at a time)
const VerifyPhoneSlide       = lazy(() => import('../pages/register/onboarding/VerifyPhoneSlide'));
const FirstNameSlide         = lazy(() => import('../pages/register/onboarding/FirstNameSlide'));
const VerifyEmailSlide       = lazy(() => import('../pages/register/onboarding/VerifyEmailSlide'));
const ConsentsSlide          = lazy(() => import('../pages/register/onboarding/ConsentsSlide'));
const PurposeSlide           = lazy(() => import('../pages/register/onboarding/PurposeSlide'));
const LifeStageSlide         = lazy(() => import('../pages/register/onboarding/LifeStageSlide'));
const BirthdaySlide          = lazy(() => import('../pages/register/onboarding/BirthdaySlide'));
const GenderSlide            = lazy(() => import('../pages/register/onboarding/GenderSlide'));
const BenefitCategoriesSlide = lazy(() => import('../pages/register/onboarding/BenefitCategoriesSlide'));

// Auth flow
const FlowTestPage         = lazy(() => import('../pages/auth-flow/FlowTestPage'));
const SelectOrgPage        = lazy(() => import('../pages/auth-flow/SelectOrgPage'));
const NewUserFlow = lazy(() =>
  import('../pages/auth-flow/AuthFlowStories').then((m) => ({ default: m.NewUserFlow }))
);

// ── Minimal fallback (no spinner — just blank, transitions feel instant) ─────
function PageFallback() {
  return <div className="min-h-dvh bg-white" />;
}

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
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
          { index: true,      element: <S><HomePage /></S> },
          { path: 'store',    element: <S><StorePage /></S> },

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

      // Outside AppLayout (own headers)
      { path: 'search',           element: <S><SearchPage /></S> },
      { path: 'chat',             element: <S><AiChatPage /></S> },
      { path: 'near-you-map',     element: <S><NearYouMapPage /></S> },
      { path: 'insights',         element: <S><InsightsPage /></S> },
      { path: 'stories',          element: <S><StoriesPage /></S> },
      { path: 'referral-stories', element: <S><ReferralStoriesPage /></S> },
      { path: 'premium-reveal',   element: <S><PremiumRevealPage /></S> },

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
          { path: 'onboarding/purpose',            element: <S><PurposeSlide /></S> },
          { path: 'onboarding/life-stage',         element: <S><LifeStageSlide /></S> },
          { path: 'onboarding/birthday',           element: <S><BirthdaySlide /></S> },
          { path: 'onboarding/gender',             element: <S><GenderSlide /></S> },
          { path: 'onboarding/benefit-categories', element: <S><BenefitCategoriesSlide /></S> },
          { path: 'complete',    element: <S><RegistrationCompletePage /></S> },
        ],
      },

      // Auth Flow
      {
        path: 'auth-flow',
        children: [
          { path: 'test',       element: <S><FlowTestPage /></S> },
          { path: 'new-user',   element: <S><NewUserFlow /></S> },
          { path: 'select-org', element: <S><SelectOrgPage /></S> },
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
