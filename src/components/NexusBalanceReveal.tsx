import RisingBubbles from './RisingBubbles';

/**
 * The rising brand-bubble field that closes the About page.
 *
 * It used to carry the "we already loaded ₪25 for you" headline and the real
 * Nexus balance card (components/wallet/BalanceCard in its `logoCorner`
 * variant, scroll-scaled into view) on top of the bubbles; both were dropped,
 * leaving the animation on its own. The height is explicit now because
 * nothing inside gives the box one — RisingBubbles only renders absolutely
 * positioned bubbles, so an auto-height parent would collapse to zero.
 */
export default function NexusBalanceReveal() {
  return (
    <div className="relative overflow-hidden" style={{ height: 380 }}>
      <RisingBubbles />
    </div>
  );
}
