import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LanguageRouter from './LanguageRouter';
import ProtectedRoute from './ProtectedRoute';
import ErrorBoundary from '../components/ErrorBoundary';

// ── Always eager (tiny, needed immediately) ─────────────────────────────────
import RegistrationGuard from '../components/registration/RegistrationGuard';
import AppLayout from '../components/layout/AppLayout';
import NotFoundPage from '../pages/NotFoundPage';
// HomePageSkeleton / WalletPageSkeleton are eager so they can be shown
// immediately as the Suspense fallback for their respective routes —
// avoids the blank white flash on first load.
import HomePageSkeleton from '../components/home/HomePageSkeleton';
import WalletPageSkeleton from '../components/wallet/WalletPageSkeleton';
import WalletHistorySkeleton from '../components/wallet/WalletHistorySkeleton';

// ── Lazy chunks ──────────────────────────────────────────────────────────────
// Main app tabs — loaded right after initial render
const HomePage           = lazy(() => import('../pages/HomePage'));
const StorePage          = lazy(() => import('../pages/StorePage'));
const WalletPage         = lazy(() => import('../pages/WalletPage'));
const ActivityPage       = lazy(() => import('../pages/ActivityPage'));
const ProfilePage        = lazy(() => import('../pages/ProfilePage'));

// Utility pages
const AiChatPage         = lazy(() => import('../pages/AiChatPage'));
const NearYouMapPage     = lazy(() => import('../pages/NearYouMapPage'));
// MapLibre demo — lazy so MapLibre's ~250KB only loads on this route
const OffersMapDemo      = lazy(() => import('../components/map/OffersMap.demo'));
const InsightsPage       = lazy(() => import('../pages/InsightsPage'));
const StoriesPage        = lazy(() => import('../pages/StoriesPage'));
const ReferralStoriesPage = lazy(() => import('../pages/ReferralStoriesPage'));
const PremiumRevealPage  = lazy(() => import('../pages/PremiumRevealPage'));
const CategoryPage       = lazy(() => import('../pages/CategoryPage'));
const BusinessPage       = lazy(() => import('../pages/BusinessPage'));
const BusinessStorePage  = lazy(() => import('../pages/BusinessStorePage'));
const BusinessProductPage  = lazy(() => import('../pages/BusinessProductPage'));
const BusinessReviewsPage  = lazy(() => import('../pages/BusinessReviewsPage'));
const BusinessCheckoutPage = lazy(() => import('../pages/BusinessCheckoutPage'));
const GiftDetailsPage      = lazy(() => import('../pages/GiftDetailsPage'));
const GiftSamplePage       = lazy(() => import('../pages/GiftSamplePage'));
const SplitBillPage        = lazy(() => import('../pages/SplitBillPage'));
const OrderConfirmationPage = lazy(() => import('../pages/OrderConfirmationPage'));
const ReceiptPage = lazy(() => import('../pages/ReceiptPage'));
const VoucherPurchasePage = lazy(() => import('../pages/VoucherPurchasePage'));
const NotificationsPage  = lazy(() => import('../pages/NotificationsPage'));
const OrdersPage         = lazy(() => import('../pages/OrdersPage'));
const OrderTrackingPage  = lazy(() => import('../pages/OrderTrackingPage'));

// Wallet add-money flow
const AddMoneyPage       = lazy(() => import('../pages/AddMoneyPage'));
const AddMoneySourcePage = lazy(() => import('../pages/AddMoneySourcePage'));
const AddMoneyLoadingPage = lazy(() => import('../pages/AddMoneyLoadingPage'));
const AddPaymentMethodPage = lazy(() => import('../pages/AddPaymentMethodPage'));
const PaymentMethodsPage = lazy(() => import('../pages/PaymentMethodsPage'));
const WalletHistoryPage = lazy(() => import('../pages/WalletHistoryPage'));
const WallpaperPage = lazy(() => import('../pages/WallpaperPage'));
const WalletCustomizePage = lazy(() => import('../pages/WalletCustomizePage'));
const WalletActionsPage = lazy(() => import('../pages/WalletActionsPage'));
const CardDetailPage = lazy(() => import('../pages/CardDetailPage'));
const BalanceDetailPage = lazy(() => import('../pages/BalanceDetailPage'));
const VoucherDetailPage  = lazy(() => import('../pages/VoucherDetailPage'));
const PaymentIntroPage   = lazy(() => import('../pages/PaymentIntroPage'));

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
const NewUserFlow = lazy(() =>
  import('../pages/auth-flow/AuthFlowStories').then((m) => ({ default: m.NewUserFlow }))
);
const OrgUserFlow = lazy(() =>
  import('../pages/auth-flow/AuthFlowStories').then((m) => ({ default: m.OrgUserFlow }))
);

// ── Minimal fallback (no spinner — just blank, transitions feel instant) ─────
// Fixed + above the overlay TopBar (z-50) so the persistent tenant logo in the
// TopBar doesn't float over the white flash during a lazy-route transition.
// Constrained to the app frame (max-w-md) to match the centred layout.
function PageFallback() {
  return <div className="fixed inset-y-0 left-0 right-0 mx-auto max-w-md bg-white z-[55]" />;
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
          {
            index: true,
            element: (
              <Suspense fallback={<HomePageSkeleton />}>
                <HomePage />
              </Suspense>
            ),
          },
          { path: 'store',    element: <S><StorePage /></S> },
          { path: 'chat',             element: <S><AiChatPage /></S> },
          { path: 'search',           element: <S><AiChatPage /></S> },
          { path: 'near-you-map',     element: <S><NearYouMapPage /></S> },
          { path: 'map-demo',         element: <S><OffersMapDemo /></S> },
          { path: 'insights',         element: <S><InsightsPage /></S> },
          { path: 'stories',          element: <S><StoriesPage /></S> },
          { path: 'referral-stories', element: <S><ReferralStoriesPage /></S> },
          { path: 'premium-reveal',   element: <S><PremiumRevealPage /></S> },
          { path: 'card-issuance',    element: <S><CardIssuanceStoriesPage /></S> },
          { path: 'category/:categoryId', element: <S><CategoryPage /></S> },
          { path: 'business/:businessId', element: <S><BusinessPage /></S> },
          { path: 'business/:businessId/store', element: <S><BusinessStorePage /></S> },
          { path: 'business/:businessId/product/:productId', element: <S><BusinessProductPage /></S> },
          { path: 'business/:businessId/product/:productId/reviews', element: <S><BusinessReviewsPage /></S> },
          { path: 'business/:businessId/product/:productId/checkout', element: <S><BusinessCheckoutPage /></S> },
          { path: 'business/:businessId/product/:productId/gift', element: <S><GiftDetailsPage /></S> },
          { path: 'business/:businessId/product/:productId/split', element: <S><SplitBillPage /></S> },
          { path: 'business/:businessId/product/:productId/order-confirmed', element: <S><OrderConfirmationPage /></S> },
          { path: 'business/:businessId/product/:productId/receipt', element: <S><ReceiptPage /></S> },
          { path: 'business/:businessId/voucher/:voucherId', element: <S><VoucherPurchasePage /></S> },
          { path: 'wallet/add-money',          element: <S><AddMoneyPage /></S> },
          { path: 'wallet/add-money/source',   element: <S><AddMoneySourcePage /></S> },
          { path: 'wallet/add-money/loading',  element: <S><AddMoneyLoadingPage /></S> },
          { path: 'wallet/add-payment-method', element: <S><AddPaymentMethodPage /></S> },
          { path: 'wallet/payment-methods',    element: <S><PaymentMethodsPage /></S> },
          { path: 'wallet/pay-intro',          element: <S><PaymentIntroPage /></S> },
          { path: 'wallpaper',                 element: <S><WallpaperPage /></S> },
          { path: 'wallet/customize',          element: <S><WalletCustomizePage /></S> },
          { path: 'wallet/actions',            element: <S><WalletActionsPage /></S> },
          { path: 'wallet/card',               element: <S><CardDetailPage /></S> },
          { path: 'wallet/balance',            element: <S><BalanceDetailPage /></S> },
          {
            path: 'wallet/history',
            element: (
              <Suspense fallback={<WalletHistorySkeleton />}>
                <WalletHistoryPage />
              </Suspense>
            ),
          },
          { path: 'wallet/voucher/:voucherId', element: <S><VoucherDetailPage /></S> },
          { path: 'notifications',             element: <S><NotificationsPage /></S> },
          { path: 'orders',                    element: <S><OrdersPage /></S> },
          { path: 'orders/track',              element: <S><OrderTrackingPage /></S> },
          // Standalone ready-made gift page (Bnei Akiva — Passover)
          { path: 'gift-sample',               element: <S><GiftSamplePage /></S> },

          // === PROTECTED routes ===
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: 'wallet',
                element: (
                  <Suspense fallback={<WalletPageSkeleton />}>
                    <WalletPage />
                  </Suspense>
                ),
              },
              { path: 'activity',      element: <S><ActivityPage /></S> },
              { path: 'profile',       element: <S><ProfilePage /></S> },
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

      { path: '*', element: <Navigate to=".." replace /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
