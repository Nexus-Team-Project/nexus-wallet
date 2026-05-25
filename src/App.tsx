import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './router';
import FirebaseAuthSync from './components/FirebaseAuthSync';
import AccessibilityWidget from './components/AccessibilityWidget';
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
      <FirebaseAuthSync>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <AccessibilityWidget />
        </QueryClientProvider>
      </FirebaseAuthSync>
    </AuthProvider>
  );
}