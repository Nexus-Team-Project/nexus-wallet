/**
 * Route-level branch for /wallet.
 *
 * The wallet is the screen a marketing SMS lands on, so it has to render for a
 * visitor who has never signed in — it used to sit behind ProtectedRoute and
 * bounce them to the home page, which meant the money they were promised was
 * the one thing they could not see.
 *
 * The branch lives here rather than as an early return inside WalletPage:
 * that component calls ~20 hooks before its first return, and a conditional
 * return threaded through them is exactly the kind of thing that breaks the
 * next time someone adds a hook.
 */
import { useAuthStore } from '../stores/authStore';
import WalletAnonymousView from '../components/wallet/WalletAnonymousView';
import WalletPage from './WalletPage';

export default function WalletRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <WalletPage /> : <WalletAnonymousView />;
}
