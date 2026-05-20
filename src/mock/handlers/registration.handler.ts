import type { UserPreferences } from '../../types/registration.types';

/** Complete user profile (mock) */
export async function mockCompleteProfile(
  userId: string,
  data: { firstName: string; lastName: string; email: string; birthday?: string }
): Promise<{ success: boolean }> {
  console.log(`[Mock] Profile completed for ${userId}:`, data);
  return { success: true };
}

/** Save user preferences from questionnaire (mock) */
export async function mockSavePreferences(
  userId: string,
  preferences: UserPreferences
): Promise<{ success: boolean }> {
  console.log(`[Mock] Preferences saved for ${userId}:`, preferences);
  return { success: true };
}

/** Process membership fee payment (mock) */
export async function mockProcessMembershipFee(
  userId: string,
  amount: number
): Promise<{ success: boolean; transactionId: string }> {
  const transactionId = `txn_${Date.now()}`;
  console.log(`[Mock] Membership fee ₪${amount} processed for ${userId}: ${transactionId}`);
  return { success: true, transactionId };
}
