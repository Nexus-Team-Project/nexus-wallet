import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vouchersApi } from '../api/vouchers.api';
import type { VoucherCategory } from '../types/voucher.types';

export function useVouchers(category?: VoucherCategory) {
  return useQuery({
    queryKey: ['vouchers', category],
    queryFn: () => vouchersApi.getAll(category),
  });
}

export function useVoucher(id: string) {
  return useQuery({
    queryKey: ['voucher', id],
    queryFn: () => vouchersApi.getById(id),
    enabled: !!id,
  });
}

export function usePurchaseVoucher() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (voucherId: string) => vouchersApi.purchase(voucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useMarkVoucherUsed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userVoucherId: string) => vouchersApi.markUsed(userVoucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVouchers'] });
    },
  });
}

export function useRequestVoucherRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userVoucherId: string) => vouchersApi.requestRefund(userVoucherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVouchers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
