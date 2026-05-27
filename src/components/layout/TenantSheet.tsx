import { useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTenantStore } from '../../stores/tenantStore';
import { useAuthStore } from '../../stores/authStore';

interface TenantSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TenantSheet({ isOpen, onClose }: TenantSheetProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const tenantConfig = useTenantStore((s) => s.config);
  const organizationName = useAuthStore((s) => s.organizationName);
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.3s ease-out';
      sheetRef.current.style.transform = 'translateY(100%)';
    }
    if (overlayRef.current) {
      overlayRef.current.style.transition = 'opacity 0.3s ease-out';
      overlayRef.current.style.opacity = '0';
    }
    setTimeout(onClose, 300);
  }, [onClose]);

  // Drag to dismiss
  const dragStartY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    const header = document.getElementById('tenant-sheet-header');
    if (!header) return;

    const onStart = (e: TouchEvent) => {
      dragStartY.current = e.touches[0].clientY;
      isDragging.current = true;
      currentY.current = 0;
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
    };
    const onMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const delta = e.touches[0].clientY - dragStartY.current;
      if (delta > 0) {
        e.preventDefault();
        currentY.current = delta;
        if (sheetRef.current) sheetRef.current.style.transform = `translateY(${delta}px)`;
        if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - delta / 400));
      }
    };
    const onEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (currentY.current > 80) {
        dismiss();
      } else {
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'transform 0.3s ease-out';
          sheetRef.current.style.transform = 'translateY(0)';
        }
        if (overlayRef.current) {
          overlayRef.current.style.transition = 'opacity 0.3s ease-out';
          overlayRef.current.style.opacity = '1';
        }
      }
    };

    header.addEventListener('touchstart', onStart, { passive: true });
    header.addEventListener('touchmove', onMove, { passive: false });
    header.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      header.removeEventListener('touchstart', onStart);
      header.removeEventListener('touchmove', onMove);
      header.removeEventListener('touchend', onEnd);
    };
  }, [isOpen, dismiss]);

  if (!isOpen) return null;

  const clubName = organizationName || (tenantConfig ? (isHe ? tenantConfig.nameHe : tenantConfig.name) : 'Nexus');
  const benefits = tenantConfig
    ? (isHe ? tenantConfig.membershipBenefitsHe : tenantConfig.membershipBenefits) || []
    : [];

  // Portal to document.body so `position: fixed` is relative to viewport,
  // not the transformed parent header in AppLayout.
  return createPortal(
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[60] bg-black/40 animate-fade-in"
        onClick={dismiss}
      />

      {/* Sheet — bottom-anchored, full-width on mobile */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-[60] bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up"
      >
        {/* ── DRAG HEADER ── */}
        <div
          id="tenant-sheet-header"
          className="flex-shrink-0 select-none"
          style={{ touchAction: 'none' }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8">
          {/* Club header */}
          <div className="flex items-center gap-3 mb-6 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-surface flex items-center justify-center border border-border/60 shadow-sm">
              {tenantConfig ? (
                <img
                  src={tenantConfig.logo}
                  alt={clubName}
                  className="w-9 h-9 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const fb = document.createElement('span');
                      fb.className = 'text-xl font-bold text-primary';
                      fb.textContent = clubName.charAt(0);
                      parent.appendChild(fb);
                    }
                  }}
                />
              ) : (
                <span className="text-xl font-bold text-primary">{clubName.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-primary leading-tight">{clubName}</h3>
              <p className="text-xs text-text-muted mt-0.5">
                {isHe ? 'מועדון הטבות' : 'Benefits Club'}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface rounded-2xl p-3.5 text-center">
              <p className="text-xl font-bold text-primary">12</p>
              <p className="text-[10px] text-text-muted mt-0.5">{isHe ? 'שוברים' : 'Vouchers'}</p>
            </div>
            <div className="bg-surface rounded-2xl p-3.5 text-center">
              <p className="text-xl font-bold text-success">₪340</p>
              <p className="text-[10px] text-text-muted mt-0.5">{isHe ? 'נחסך' : 'Saved'}</p>
            </div>
            <div className="bg-surface rounded-2xl p-3.5 text-center">
              <p className="text-xl font-bold text-warning">4.8 ⭐</p>
              <p className="text-[10px] text-text-muted mt-0.5">{isHe ? 'דירוג' : 'Rating'}</p>
            </div>
          </div>

          {/* Benefits section */}
          {benefits.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-text-primary mb-3">
                {isHe ? 'ההטבות שלך' : 'Your Benefits'}
              </h4>
              <div className="space-y-3">
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 bg-surface rounded-xl p-3">
                    <span
                      className="material-symbols-outlined text-success mt-0.5 flex-shrink-0"
                      style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                    <span className="text-sm text-text-secondary">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-text-primary mb-3">
              {isHe ? 'קישורים מהירים' : 'Quick Links'}
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: 'local_offer', label: isHe ? 'השוברים שלי' : 'My Vouchers' },
                { icon: 'history', label: isHe ? 'היסטוריה' : 'History' },
                { icon: 'support_agent', label: isHe ? 'תמיכה' : 'Support' },
                { icon: 'info', label: isHe ? 'אודות המועדון' : 'About Club' },
              ].map((link) => (
                <button
                  key={link.icon}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-surface hover:bg-border/50 transition-colors active:scale-[0.98]"
                >
                  <span
                    className="material-symbols-outlined text-primary"
                    style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                  >
                    {link.icon}
                  </span>
                  <span className="text-xs font-semibold text-text-primary">{link.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Powered by Nexus */}
          <div className="flex items-center justify-center gap-1 mt-4 mb-2">
            <img src="/nexus-logo.png" alt="Nexus" className="h-5 opacity-40" />
            <span className="text-[9px] text-text-muted/50">Powered by Nexus</span>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
