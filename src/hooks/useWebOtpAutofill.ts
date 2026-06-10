/**
 * useWebOtpAutofill — auto-fill an incoming SMS one-time-code on Android Chrome
 * via the WebOTP API (`navigator.credentials.get({ otp: { transport: ['sms'] } })`).
 *
 * Why this exists: on supported browsers (Chromium on Android) the OS can hand
 * the just-received code straight to the page, so the user never types it. On
 * every other browser this hook is a silent no-op and the existing
 * `autocomplete="one-time-code"` attribute handles the iOS Safari "tap to fill"
 * path instead. The two mechanisms are complementary; both rely on the SMS
 * carrying the origin-bound `@host #code` line (built server-side).
 *
 * It is strictly best-effort: any failure (unsupported, user dismissed, aborted,
 * insecure context) is swallowed - it must never block manual entry.
 *
 * Security: the code is delivered by the OS only for the matching origin; the
 * hook never stores or logs it, it only forwards it to `onCode`.
 */
import { useEffect, useRef } from 'react';

/** The credential the WebOTP API resolves to; `code` is the parsed OTP. */
interface OtpCredential extends Credential {
  code: string;
}

/**
 * `CredentialRequestOptions` does not yet type the `otp` member in the DOM lib,
 * so we extend it locally rather than weaken the call site with `any`.
 */
interface OtpCredentialRequestOptions extends CredentialRequestOptions {
  otp: { transport: 'sms'[] };
}

interface UseWebOtpAutofillArgs {
  /** Only arm the API while the OTP entry step is actually visible. */
  enabled: boolean;
  /** Receives the 6-digit code when the OS delivers it. */
  onCode: (code: string) => void;
  /**
   * Change this (e.g. the challenge id) to re-arm after a resend - a fresh SMS
   * needs a fresh `credentials.get` request.
   */
  rearmKey?: string | number;
}

/** True only where the WebOTP API can actually run (Chromium + secure context). */
function isWebOtpSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'OTPCredential' in window &&
    window.isSecureContext &&
    !!navigator.credentials
  );
}

/**
 * Arm the WebOTP listener while `enabled` is true. Cleans up (aborts the pending
 * request) on disable, unmount, or a `rearmKey` change.
 */
export function useWebOtpAutofill({ enabled, onCode, rearmKey }: UseWebOtpAutofillArgs): void {
  // Keep the latest callback without re-arming the request on every render.
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!enabled || !isWebOtpSupported()) return;

    const controller = new AbortController();
    // Cast: the `otp` request option is not in the standard typings yet.
    const options: OtpCredentialRequestOptions = {
      otp: { transport: ['sms'] },
      signal: controller.signal,
    };

    navigator.credentials
      .get(options as CredentialRequestOptions)
      .then((cred) => {
        const code = (cred as OtpCredential | null)?.code;
        if (code) onCodeRef.current(code);
      })
      .catch(() => {
        // Aborted, dismissed, unsupported transport, etc. - never surface to UI.
      });

    return () => controller.abort();
  }, [enabled, rearmKey]);
}
