import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import AccessibilityWidget from './components/AccessibilityWidget';
import MobileViewportGate from './components/layout/MobileViewportGate';
import { AuthProvider } from './contexts/AuthContext';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <AccessibilityWidget />
        {/* Global mobile-only gate: covers the whole app on wide viewports.
            Self-contained (no router/provider dependency) so one mount here
            protects every page. Inert in local dev. */}
        <MobileViewportGate />
      </QueryClientProvider>
    </AuthProvider>
  );
}