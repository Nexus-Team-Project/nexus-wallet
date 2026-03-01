import { useUser } from '../../hooks/useUser';
import { useAuthStore } from '../../stores/authStore';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

export default function ProfileHeader() {
  const { data: user, isLoading } = useUser();
  // Prefer the name stored in authStore (set during login/registration)
  // over whatever the mock user API returns.
  const authFirstName = useAuthStore((s) => s.firstName);
  const firstName = authFirstName ?? user?.firstName;

  if (isLoading) {
    return (
      <Card className="flex items-center gap-4">
        <Skeleton variant="circular" className="w-16 h-16" />
        <div>
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </Card>
    );
  }

  const initials = `${firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;

  return (
    <Card className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-xl font-bold text-primary">{initials}</span>
      </div>
      <div>
        <h2 className="text-lg font-bold text-text-primary">{firstName} {user?.lastName}</h2>
        <p className="text-sm text-text-secondary">{user?.organizationName}</p>
        <p className="text-xs text-text-muted">{user?.email}</p>
      </div>
    </Card>
  );
}
