import { useMemo } from 'react';
import { useUser } from './useUser';
import { useVouchers } from './useVouchers';
import { useMyVouchers } from './useMyVouchers';
import { useRegistrationStore } from '../stores/registrationStore';
import { useAuthStore } from '../stores/authStore';
import { buildUserSignals } from '../utils/buildUserSignals';
import { rankVouchers } from '../utils/recommendationEngine';
import type { ScoredVoucher } from '../types/recommendation.types';

interface UseRecommendationsOptions {
  maxResults?: number;
}

interface UseRecommendationsReturn {
  recommendations: ScoredVoucher[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useRecommendations(
  options: UseRecommendationsOptions = {},
): UseRecommendationsReturn {
  const { maxResults = 10 } = options;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: user, isLoading: userLoading, isError: userError } = useUser();
  const { data: vouchers, isLoading: vouchersLoading, isError: vouchersError, refetch } = useVouchers();
  const { data: userVouchers, isLoading: myVouchersLoading, isError: myVouchersError } = useMyVouchers(
    undefined,
    { enabled: isAuthenticated },
  );
  const questionnairePrefs = useRegistrationStore((s) => s.preferences);

  const isLoading = vouchersLoading || (isAuthenticated && (userLoading || myVouchersLoading));
  const isError = vouchersError || (isAuthenticated && (userError || myVouchersError));

  const recommendations = useMemo(() => {
    if (!vouchers) return [];

    const signals = buildUserSignals(user, userVouchers, questionnairePrefs);
    return rankVouchers(vouchers, signals, undefined, maxResults);
  }, [vouchers, user, userVouchers, questionnairePrefs, maxResults]);

  return { recommendations, isLoading, isError, refetch };
}
