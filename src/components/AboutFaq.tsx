import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

/**
 * Collapsible FAQ list for the About page. Follows the same accordion
 * pattern as the business page's `AccordionSection`
 * (src/components/business/BusinessAccordions.tsx) — chevron that rotates on
 * open, max-height + opacity transition — since that shell is private to
 * that module rather than exported.
 */

interface FaqItem {
  q: string;
  qEn: string;
  a: string;
  aEn: string;
}

/**
 * Ordered as a funnel: what it is → why join → what it costs → what you get →
 * how earning works → where to spend → the organizational track.
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    q: 'מה זה נקסוס?',
    qEn: 'What is Nexus?',
    a: 'ארנק דיגיטלי שמחזיר לך כסף על קניות שאתה עושה בכל מקרה. משלמים דרך נקסוס אצל המותגים שבמערכת, והקאשבק נכנס ליתרה שלך.',
    aEn: 'A digital wallet that pays you back on purchases you already make. Pay through Nexus at participating brands and the cashback lands in your balance.',
  },
  {
    q: 'למה כדאי לי להצטרף?',
    qEn: 'Why should I join?',
    a: 'כי זה לא עולה כלום ומחזיר כסף על קניות שאתם עושים ממילא. מצמידים את כרטיס האשראי הקיים, ממשיכים לשלם בקופה כרגיל, והקאשבק נכנס לארנק — בזמן שההטבות של חברת האשראי שלכם ממשיכות להיצבר במקביל.',
    aEn: "Because it costs nothing and pays you back on purchases you'd make anyway. Link your existing credit card, keep paying at the register as usual, and cashback lands in your wallet — while your card issuer's own perks keep accruing alongside it.",
  },
  {
    q: 'כמה זה עולה לי?',
    qEn: 'What does it cost me?',
    a: 'כלום. אין דמי מנוי, אין עמלות נסתרות ואין צורך להנפיק כרטיס חדש. אפשר להפסיק בכל רגע.',
    aEn: 'Nothing. No subscription, no hidden fees, and no new card to issue. You can stop at any time.',
  },
  {
    q: 'מה מקבלים בהצטרפות?',
    qEn: 'What do I get when I join?',
    a: '₪150 שנכנסים לארנק כבר בהצטרפות, בכפוף לתנאים — ומשם גישה לקאשבק של עד 60% במאות המותגים שבמערכת ולשוברים במחיר מוזל.',
    aEn: '₪150 credited to your wallet on signup, subject to terms — and from there, access to up to 60% cashback across hundreds of brands in the network, plus discounted vouchers.',
  },
  {
    q: 'איך צוברים קאשבק?',
    qEn: 'How do I earn cashback?',
    a: 'מצמידים את כרטיס האשראי הקיים ומשלמים בקופה כרגיל. הקאשבק מחושב אוטומטית בכל תשלום שמתבצע דרך נקסוס — בלי קודים להזין ובלי טפסים למלא — ונכנס ליתרה שלכם ומחכה לקנייה הבאה.',
    aEn: 'Link your existing card and pay at the register as usual. Cashback is calculated automatically on every payment made through Nexus — no codes to enter, no forms to fill — and lands in your balance, ready for your next purchase.',
  },
  {
    q: 'איפה אפשר לממש את הקאשבק?',
    qEn: 'Where can I spend the cashback?',
    a: 'במאות עסקים במערכת — סופר, דלק, אופנה, פארם ועוד. אפשר לשלם ישירות מהיתרה או לרכוש שוברים מוזלים.',
    aEn: 'At hundreds of businesses in the network — supermarkets, gas, fashion, pharmacy and more. You can pay directly from your balance or buy discounted vouchers.',
  },
  {
    q: 'מה זה ארנק ארגוני?',
    qEn: 'What is an organizational wallet?',
    a: 'אם מקום העבודה או הקהילה שלך עובדים עם נקסוס, אפשר להתחבר לארנק הארגוני ולקבל אחוזי קאשבק גבוהים יותר והצעות שמותאמות לארגון שלך.',
    aEn: 'If your workplace or community works with Nexus, you can connect to the organizational wallet for higher cashback rates and offers tailored to your organization.',
  },
  {
    q: 'איך אני יודע אם הארגון שלי בפנים?',
    qEn: 'How do I know if my organization is in?',
    a: 'לוחצים על "מצא את הארגון שלי" ומחפשים את מקום העבודה או הקהילה שלכם ברשימה. אם הם שם — אפשר להתחבר לארנק הארגוני מיד.',
    aEn: 'Tap "Find my organization" and look for your workplace or community in the list. If it\'s there, you can connect to the organizational wallet right away.',
  },
  {
    q: 'האם אני יכול להתחבר לנקסוס ללא ארגון?',
    qEn: 'Can I join Nexus without an organization?',
    a: 'בהחלט. הארנק פתוח לכולם, וגם בלי ארגון צוברים קאשבק במאות המותגים שבמערכת. אם הארגון שלכם יצטרף בהמשך, תוכלו לחבר אותו לאותו ארנק ולקבל אחוזים גבוהים יותר.',
    aEn: 'Absolutely. The wallet is open to everyone, and you earn cashback across hundreds of brands with or without one. If your organization joins later, you can connect it to the same wallet for higher rates.',
  },
];

function FaqRow({ item, isHe }: { item: FaqItem; isHe: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    /* Each question is its own bordered card (rounded-xl, p-4, shadow-sm),
       question in font-medium text-lg with a small grey chevron on the
       opposite edge — the answer expands inside the same card. */
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full p-4 flex justify-between items-center gap-4 text-start hover:bg-gray-50 active:bg-gray-50 transition-colors focus:outline-none"
      >
        <span className="font-medium text-lg leading-tight text-text-primary">
          {isHe ? item.q : item.qEn}
        </span>
        <span
          className="material-symbols-outlined text-gray-400 transition-transform duration-300 flex-shrink-0"
          style={{ fontSize: 18, transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          expand_more
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0 }}
      >
        <p className="text-sm text-text-secondary leading-relaxed px-4 pb-4">
          {isHe ? item.a : item.aEn}
        </p>
      </div>
    </div>
  );
}

export default function AboutFaq() {
  const { isRTL } = useLanguage();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="text-start">
      <h2 className="text-3xl font-bold text-text-primary mb-6">
        {isRTL ? 'שאלות נפוצות' : 'Frequently asked questions'}
      </h2>
      <div className="flex flex-col gap-3">
        {FAQ_ITEMS.map((item) => (
          <FaqRow key={item.qEn} item={item} isHe={isRTL} />
        ))}
      </div>
    </div>
  );
}
