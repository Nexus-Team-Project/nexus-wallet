/**
 * Toast the outcome of a tenant join request. The backend auto-accepts when a
 * tenant has it enabled (the requester joins instantly) and otherwise creates a
 * pending request that needs admin approval - this surfaces the right message
 * for each case from the CreateJoinResult buckets.
 */
import { toast } from 'sonner';
import type { CreateJoinResult } from '../services/walletTenants.service';

/**
 * Show the appropriate toast for a join result.
 * @param result the createJoinRequests() outcome (auto-accepted / pending / skipped).
 * @param isHe   true for Hebrew copy, false for English.
 */
export function joinResultToast(result: CreateJoinResult, isHe: boolean): void {
  const joined = result.autoAccepted.length;
  const pending = result.created.length;

  if (joined > 0 && pending > 0) {
    toast.success(
      isHe
        ? 'הצטרפת לחלק מהארגונים, השאר ממתינים לאישור מנהל'
        : 'Joined some organizations; the rest are pending admin approval',
    );
    return;
  }
  if (joined > 0) {
    toast.success(isHe ? 'הצטרפת לארגון!' : "You're in!");
    return;
  }
  if (pending > 0) {
    toast.success(
      isHe ? 'הבקשה נשלחה, ממתינה לאישור מנהל' : 'Request sent, pending admin approval',
    );
    return;
  }
  // Nothing joined or created -> everything was skipped (already member/pending).
  toast.info(isHe ? 'כבר ביקשת להצטרף לארגון זה' : "You've already requested to join");
}
