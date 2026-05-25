/**
 * Wallet join-submitted confirmation. Shows how many requests went out
 * (created) and how many were auto-accepted (had a matching open
 * invitation). Offers a link to Everyone's Catalog while the user waits.
 *
 * Spec: docs/superpowers/specs/2026-05-25-nexus-wallet-auth-design.md section 9
 */
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';

export default function JoinSubmittedPage() {
  const { lang = 'he' } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const isHe = language === 'he';
  const { reload } = useAuth();

  const created = parseInt(params.get('created') ?? '0', 10);
  const auto = parseInt(params.get('auto') ?? '0', 10);

  // Refresh /api/me so auto-accepted tenants land in memberships.
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-dvh bg-white pt-12 pb-20">
      <div className="max-w-md mx-auto px-6 text-center">
        <div className="text-5xl mb-4">✉️</div>
        <h1 className="text-xl font-bold text-text-primary mb-3">
          {isHe ? 'הבקשות נשלחו' : 'Requests sent'}
        </h1>
        <div className="text-sm text-text-muted mb-6 space-y-1">
          {created > 0 && (
            <p>
              {isHe
                ? `${created} בקשות בהמתנה לאישור אדמין הארגון.`
                : `${created} request(s) waiting for admin approval.`}
            </p>
          )}
          {auto > 0 && (
            <p>
              {isHe
                ? `${auto} צורפת אוטומטית (הזמנה פתוחה).`
                : `${auto} accepted automatically (open invite matched).`}
            </p>
          )}
          {created === 0 && auto === 0 && (
            <p>{isHe ? 'אין שינויים.' : 'No changes.'}</p>
          )}
        </div>

        <div className="space-y-3 text-start">
          <button
            onClick={() => navigate(`/${lang}/router`)}
            className="w-full p-4 rounded-2xl border-2 border-primary bg-primary/5 hover:bg-primary/10 text-center"
          >
            <div className="font-semibold text-primary">
              {isHe ? 'חזרה למסך הראשי' : 'Back to router'}
            </div>
          </button>
          <button
            onClick={() => navigate(`/${lang}/store?ecosystem=1`)}
            className="w-full p-4 rounded-2xl border border-border bg-white hover:bg-surface text-center"
          >
            <div className="font-semibold text-text-primary">
              {isHe ? 'בינתיים, צפה בקטלוג של כולם' : "While you wait, see everyone's catalog"}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
