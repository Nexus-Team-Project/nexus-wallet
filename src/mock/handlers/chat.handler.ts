import { mockVouchers } from '../data/vouchers.mock';
import type { ChatMessage } from '../../types/chat.types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms)); // keep for AI "thinking" UX

// Keyword → category/voucher mapping for smart recommendations
const keywordMap: Record<string, { ids: string[]; responseHe: string; responseEn: string }> = {
  // Birthday / Gift
  'יום הולדת': {
    ids: ['v_002', 'v_003', 'v_010'],
    responseHe: 'למתנת יום הולדת, הנה כמה אפשרויות מעולות! 🎂 שובר אופנה תמיד עובד, או אולי בילוי מיוחד?',
    responseEn: 'For a birthday gift, here are some great options! 🎂 A fashion voucher always works, or maybe a special experience?',
  },
  'birthday': {
    ids: ['v_002', 'v_003', 'v_010'],
    responseHe: 'למתנת יום הולדת, הנה כמה אפשרויות מעולות! 🎂',
    responseEn: 'For a birthday gift, here are some great options! 🎂',
  },
  'gift': {
    ids: ['v_002', 'v_007', 'v_011'],
    responseHe: 'הנה כמה רעיונות למתנה:',
    responseEn: 'Here are some gift ideas:',
  },
  'מתנה': {
    ids: ['v_002', 'v_007', 'v_011'],
    responseHe: 'הנה כמה רעיונות למתנה! 🎁 בחרתי שוברים שמתאימים לכל אחד:',
    responseEn: 'Here are some gift ideas! 🎁',
  },

  // Couple / Date
  'זוגי': {
    ids: ['v_003', 'v_005', 'v_010'],
    responseHe: 'לבילוי זוגי מושלם 💑 הנה כמה הצעות רומנטיות:',
    responseEn: 'For the perfect date 💑 here are some romantic suggestions:',
  },
  'date': {
    ids: ['v_003', 'v_005', 'v_010'],
    responseHe: 'לדייט מושלם:',
    responseEn: 'For the perfect date:',
  },
  'רומנטי': {
    ids: ['v_005', 'v_003', 'v_004'],
    responseHe: 'ערב רומנטי? הנה כמה רעיונות 🌹',
    responseEn: 'A romantic evening? Here are some ideas 🌹',
  },

  // Food / Restaurant
  'אוכל': {
    ids: ['v_001', 'v_004', 'v_009'],
    responseHe: 'אוהב אוכל טוב? 🍔 הנה הטבות מעולות למסעדות ובתי קפה:',
    responseEn: 'Love good food? 🍔 Here are great food deals:',
  },
  'food': {
    ids: ['v_001', 'v_004', 'v_009'],
    responseHe: 'הנה הטבות אוכל:',
    responseEn: 'Here are food deals:',
  },
  'קפה': {
    ids: ['v_004', 'v_001'],
    responseHe: 'קפה טוב זה תמיד רעיון מצוין! ☕ הנה מה שיש לי:',
    responseEn: 'Good coffee is always a great idea! ☕',
  },
  'coffee': {
    ids: ['v_004', 'v_001'],
    responseHe: 'קפה! ☕',
    responseEn: 'Coffee! ☕ Here are some options:',
  },

  // Discount / Cheap
  'הנחה': {
    ids: ['v_003', 'v_012', 'v_004'],
    responseHe: 'מחפש את ההנחות הכי שוות? 🔥 הנה השוברים עם אחוזי ההנחה הגבוהים ביותר:',
    responseEn: 'Looking for the best discounts? 🔥 Here are the highest discount vouchers:',
  },
  'discount': {
    ids: ['v_003', 'v_012', 'v_004'],
    responseHe: 'הנה ההנחות הטובות ביותר:',
    responseEn: 'Here are the best discounts:',
  },
  'זול': {
    ids: ['v_004', 'v_001', 'v_003'],
    responseHe: 'מחפש משהו בתקציב? 💰 הנה שוברים במחירים נוחים:',
    responseEn: 'Looking for budget options? 💰',
  },
  'cheap': {
    ids: ['v_004', 'v_001', 'v_003'],
    responseHe: 'אפשרויות בתקציב:',
    responseEn: 'Budget options:',
  },

  // Entertainment
  'בילוי': {
    ids: ['v_003', 'v_010', 'v_005'],
    responseHe: 'רוצה לצאת לבלות? 🎉 הנה כמה חוויות מדהימות:',
    responseEn: 'Want to go out? 🎉 Here are some amazing experiences:',
  },
  'entertainment': {
    ids: ['v_003', 'v_010', 'v_005'],
    responseHe: 'בילויים:',
    responseEn: 'Entertainment options:',
  },
  'סרט': {
    ids: ['v_003'],
    responseHe: 'אוהב קולנוע? 🎬 הנה שובר מעולה:',
    responseEn: 'Love movies? 🎬',
  },
  'movie': {
    ids: ['v_003'],
    responseHe: 'קולנוע! 🎬',
    responseEn: 'Movies! 🎬 Here you go:',
  },

  // Shopping / Fashion
  'קניות': {
    ids: ['v_002', 'v_011', 'v_007'],
    responseHe: 'בא לך שופינג? 🛍️ הנה שוברים לרשתות האהובות:',
    responseEn: 'In the mood for shopping? 🛍️',
  },
  'shopping': {
    ids: ['v_002', 'v_011', 'v_007'],
    responseHe: 'שופינג! 🛍️',
    responseEn: 'Shopping time! 🛍️ Here are some deals:',
  },

  // Tech
  'טכנולוגיה': {
    ids: ['v_007'],
    responseHe: 'גיקים מתאחדים! 💻 הנה מה שיש לי בטכנולוגיה:',
    responseEn: 'Tech lovers unite! 💻',
  },
  'tech': {
    ids: ['v_007'],
    responseHe: 'טכנולוגיה! 💻',
    responseEn: 'Tech deals! 💻',
  },

  // Health / Fitness
  'ספורט': {
    ids: ['v_012', 'v_006'],
    responseHe: 'גוף בריא, נשמה בריאה! 💪 הנה הטבות כושר ובריאות:',
    responseEn: 'Healthy body, healthy mind! 💪',
  },
  'fitness': {
    ids: ['v_012', 'v_006'],
    responseHe: 'כושר ובריאות! 💪',
    responseEn: 'Fitness & health deals! 💪',
  },
  'בריאות': {
    ids: ['v_006', 'v_012'],
    responseHe: 'בריאות זה הדבר הכי חשוב! 💊 הנה מה שמצאתי:',
    responseEn: 'Health is everything! 💊',
  },

  // Travel
  'טיול': {
    ids: ['v_005'],
    responseHe: 'אוהב לטייל? ✈️ הנה הטבה מעולה:',
    responseEn: 'Love to travel? ✈️',
  },
  'travel': {
    ids: ['v_005'],
    responseHe: 'טיולים! ✈️',
    responseEn: 'Travel deals! ✈️',
  },
  'מלון': {
    ids: ['v_005'],
    responseHe: 'מלון מפנק? 🏨 הנה הצעה מצוינת:',
    responseEn: 'A luxury hotel? 🏨',
  },
};

// Fallback suggestions for follow-up
const followUpSuggestionsHe = ['ספר לי עוד', 'יש משהו יותר זול?', 'מה הכי פופולרי?', 'עוד אפשרויות'];
const followUpSuggestionsEn = ['Tell me more', 'Something cheaper?', 'Most popular?', 'More options'];

function findMatch(message: string): { ids: string[]; responseHe: string; responseEn: string } | null {
  const lower = message.toLowerCase();
  for (const [keyword, data] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) {
      return data;
    }
  }
  return null;
}

// Welcome message when AI chat opens
export function getWelcomeMessage(isHe: boolean): ChatMessage {
  return {
    id: 'welcome',
    role: 'assistant',
    content: isHe
      ? 'היי! 👋 אני גלי — אני כאן לעזור לך למצוא את ההטבה המושלמת. ספר לי מה אתה מחפש, או בחר מההצעות למטה:'
      : "Hi! 👋 I'm Gali — I'm here to help you find the perfect deal. Tell me what you're looking for, or pick from the suggestions below:",
    suggestions: isHe
      ? ['מתנה ליום הולדת', 'בילוי זוגי', 'ההנחה הכי שווה', 'קפה טוב']
      : ['Birthday gift', 'Date night', 'Best discount', 'Good coffee'],
    timestamp: new Date(),
  };
}

export async function mockAiResponse(
  userMessage: string,
  _history: ChatMessage[],
  isHe: boolean
): Promise<ChatMessage> {
  // Simulate AI thinking time
  await delay(1000 + Math.random() * 1000);

  const match = findMatch(userMessage);

  if (match) {
    const products = match.ids
      .map(id => mockVouchers.find(v => v.id === id))
      .filter(Boolean) as typeof mockVouchers;

    return {
      id: `ai_${Date.now()}`,
      role: 'assistant',
      content: isHe ? match.responseHe : match.responseEn,
      products,
      suggestions: isHe
        ? followUpSuggestionsHe.slice(0, 3)
        : followUpSuggestionsEn.slice(0, 3),
      timestamp: new Date(),
    };
  }

  // Fallback: recommend popular vouchers
  const popular = mockVouchers.filter(v => v.popular).slice(0, 3);

  return {
    id: `ai_${Date.now()}`,
    role: 'assistant',
    content: isHe
      ? 'הנה כמה מההטבות הפופולריות ביותר שלנו — אולי תמצא פה משהו שמתאים! ⭐'
      : "Here are some of our most popular deals — maybe you'll find something you like! ⭐",
    products: popular,
    suggestions: isHe
      ? ['מתנה למישהו', 'בילוי בסופש', 'משהו בתקציב']
      : ['Gift for someone', 'Weekend fun', 'Budget friendly'],
    timestamp: new Date(),
  };
}
