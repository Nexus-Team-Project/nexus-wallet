import OffersMap from './OffersMap';
import type { OfferPin } from '../../types/map';

const DEMO_PINS: OfferPin[] = [
  { id: 'p1', name: 'מסעדת גרין',     category: 'food',          lng: 34.7818, lat: 32.0853, tenantId: 'acme' },
  { id: 'p2', name: 'קפה ירושלים',    category: 'food',          lng: 34.7745, lat: 32.0710, tenantId: 'acme' },
  { id: 'p3', name: 'אופנת קסטרו',    category: 'retail',        lng: 34.7900, lat: 32.0900, tenantId: 'acme' },
  { id: 'p4', name: 'יקב גן הברכה',   category: 'retail',        lng: 34.7700, lat: 32.0800, tenantId: 'acme' },
  { id: 'p5', name: 'יוגה סטודיו אור', category: 'wellness',      lng: 34.7860, lat: 32.0780, tenantId: 'acme' },
  { id: 'p6', name: 'הבימה',          category: 'entertainment', lng: 34.7790, lat: 32.0743, tenantId: 'acme' },
  { id: 'p7', name: 'סינמה סיטי',     category: 'entertainment', lng: 34.7950, lat: 32.0850, tenantId: 'acme' },
  { id: 'p8', name: 'מוסך אקספרס',    category: 'services',      lng: 34.7820, lat: 32.0680, tenantId: 'acme' },
];

// Fits inside the app's phone-sized container (AppLayout's max-w-md wrapper).
export default function OffersMapDemo() {
  return (
    <div className="w-full h-[100dvh] relative">
      <OffersMap
        pins={DEMO_PINS}
        initialCenter={[34.7818, 32.0810]}
        initialZoom={12}
        onPinClick={(p) => {
          // eslint-disable-next-line no-console
          console.log('pin clicked:', p);
        }}
      />
    </div>
  );
}
