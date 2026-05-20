import { useLanguage } from '../../i18n/LanguageContext';
import { useMyVouchers } from '../../hooks/useMyVouchers';
import MyVoucherCard from './MyVoucherCard';
import Skeleton from '../ui/Skeleton';
import type { UserVoucher } from '../../types/voucher.types';

interface WalletTabsProps {
  activeTab: UserVoucher['status'];
  onTabChange?: (tab: UserVoucher['status']) => void;
}

export default function WalletTabs({ activeTab }: WalletTabsProps) {
  const { t } = useLanguage();
  const { data: vouchers, isLoading } = useMyVouchers();

  const filteredVouchers = vouchers?.filter(v => v.status === activeTab) || [];

  return (
    <div>
      {/* Content — 2-column grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" className="aspect-[1.6/1] rounded-2xl" />
          ))}
        </div>
      ) : filteredVouchers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">👛</p>
          <p className="text-text-secondary">{t.wallet.noVouchers}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 tab-content-enter">
          {filteredVouchers.map((uv) => (
            <MyVoucherCard key={uv.id} userVoucher={uv} />
          ))}
        </div>
      )}
    </div>
  );
}
