import { useCallback, useEffect, useRef, useState } from 'react';

/** Length of a pay session, in seconds. */
export const PAY_SESSION_SECONDS = 30;
/** Hold this long for a press to count as a "hold" (resume) vs a tap (toggle). */
const PAY_HOLD_MS = 250;

/**
 * The inline "Payment" panel session. Tapping the pay button reveals the
 * pay panel and starts a 30s countdown shown on the button; at 0 it
 * auto-closes. Holding the button freezes the countdown so the panel
 * stays open while the finger is down. Extracted from the wallet page so
 * the balance-detail page can reuse the exact same behaviour.
 */
export function usePaySession() {
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [paySecondsLeft, setPaySecondsLeft] = useState(PAY_SESSION_SECONDS);
  const [payPaused, setPayPaused] = useState(false);
  const payHoldStart = useRef(0);

  const openPay = useCallback(() => {
    setPaySecondsLeft(PAY_SESSION_SECONDS);
    setPayPaused(false);
    setShowPaySheet(true);
  }, []);

  const closePay = useCallback(() => {
    setShowPaySheet(false);
    setPayPaused(false);
  }, []);

  // Countdown — one tick per second while open and not held.
  useEffect(() => {
    if (!showPaySheet || payPaused) return;
    if (paySecondsLeft <= 0) {
      closePay();
      return;
    }
    const id = setTimeout(() => setPaySecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [showPaySheet, payPaused, paySecondsLeft, closePay]);

  // Press = freeze while held; release distinguishes a quick tap
  // (toggle open/close) from a hold (resume countdown).
  const handlePayPointerDown = useCallback(() => {
    payHoldStart.current = Date.now();
    if (showPaySheet) setPayPaused(true);
  }, [showPaySheet]);

  const handlePayPointerUp = useCallback(() => {
    const held = Date.now() - payHoldStart.current;
    if (!showPaySheet) {
      openPay();
      return;
    }
    if (held >= PAY_HOLD_MS) {
      setPayPaused(false);
    } else {
      closePay();
    }
  }, [showPaySheet, openPay, closePay]);

  const handlePayPointerLeave = useCallback(() => {
    if (showPaySheet && payPaused) setPayPaused(false);
  }, [showPaySheet, payPaused]);

  return {
    showPaySheet,
    paySecondsLeft,
    payPaused,
    openPay,
    closePay,
    handlePayPointerDown,
    handlePayPointerUp,
    handlePayPointerLeave,
  };
}

export type PaySession = ReturnType<typeof usePaySession>;
