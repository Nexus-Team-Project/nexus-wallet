import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../utils/cn';
import type { UserVoucher } from '../../types/voucher.types';

interface MyVoucherCardProps {
  userVoucher: UserVoucher;
}

export default function MyVoucherCard({ userVoucher }: MyVoucherCardProps) {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const { voucher, status, id } = userVoucher;
  const bg = voucher.brandColor || '#f6f9fc';
  const isDark = isDarkColor(bg);

  return (
    <button
      onClick={() => navigate(`/${lang}/wallet/voucher/${id}`)}
      className={cn(
        'relative w-full aspect-[1.6/1] rounded-2xl overflow-hidden flex items-center justify-center transition-transform active:scale-[0.97]',
        status !== 'active' && 'opacity-50'
      )}
      style={{ backgroundColor: bg }}
    >
      {/* Brand logo or fallback text */}
      {voucher.brandLogo && !imgError ? (
        <img
          src={voucher.brandLogo}
          alt={voucher.merchantName}
          className="h-12 w-auto object-contain max-w-[60%]"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className="text-lg font-bold px-2 text-center"
          style={{ color: isDark ? '#fff' : '#000' }}
        >
          {voucher.merchantName}
        </span>
      )}

      {/* Status badge for used/expired */}
      {status !== 'active' && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>
            {status === 'used' ? 'check_circle' : 'schedule'}
          </span>
        </div>
      )}

      {/* Open icon for active */}
      {status === 'active' && (
        <div className="absolute bottom-2 end-2 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>open_in_new</span>
        </div>
      )}
    </button>
  );
}

/** Check if a hex color is dark */
function isDarkColor(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
