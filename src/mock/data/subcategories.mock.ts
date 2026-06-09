import type { VoucherCategory } from '../../types/voucher.types';

export interface Subcategory {
  key: string;
  emoji: string;
  imageUrl: string;
  bg: string;
  labelEn: string;
  labelHe: string;
}

// Common Unsplash thumbnail params — keeps the file readable.
const IMG = (id: string) => `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&q=80`;

export const subcategoriesByCategory: Record<VoucherCategory, Subcategory[]> = {
  food: [
    { key: 'restaurants', emoji: '🍽️', imageUrl: IMG('1517248135467-4c7edcad34c4'), bg: 'bg-orange-50', labelEn: 'Restaurants', labelHe: 'מסעדות' },
    { key: 'cafes', emoji: '☕', imageUrl: IMG('1495474472287-4d71bcdd2085'), bg: 'bg-amber-50', labelEn: 'Cafes', labelHe: 'בתי קפה' },
    { key: 'fast_food', emoji: '🍔', imageUrl: IMG('1568901346375-23c9450c58cd'), bg: 'bg-red-50', labelEn: 'Fast Food', labelHe: 'מזון מהיר' },
    { key: 'grocery', emoji: '🛒', imageUrl: IMG('1542838132-92c53300491e'), bg: 'bg-green-50', labelEn: 'Grocery', labelHe: 'סופר' },
    { key: 'delivery', emoji: '🛵', imageUrl: IMG('1526367790999-0150786686a2'), bg: 'bg-sky-50', labelEn: 'Delivery', labelHe: 'משלוחים' },
    { key: 'bakery', emoji: '🥐', imageUrl: IMG('1509440159596-0249088772ff'), bg: 'bg-yellow-50', labelEn: 'Bakery', labelHe: 'מאפיות' },
    { key: 'snacks', emoji: '🍦', imageUrl: IMG('1497034825429-c343d7c6a68f'), bg: 'bg-pink-50', labelEn: 'Snacks', labelHe: 'חטיפים' },
    { key: 'drinks', emoji: '🍹', imageUrl: IMG('1551024506-0bccd828d307'), bg: 'bg-purple-50', labelEn: 'Drinks', labelHe: 'משקאות' },
  ],
  shopping: [
    { key: 'fashion', emoji: '👗', imageUrl: IMG('1445205170230-053b83016050'), bg: 'bg-pink-50', labelEn: 'Fashion', labelHe: 'אופנה' },
    { key: 'shoes', emoji: '👟', imageUrl: IMG('1542291026-7eec264c27ff'), bg: 'bg-amber-50', labelEn: 'Shoes', labelHe: 'נעליים' },
    { key: 'accessories', emoji: '👜', imageUrl: IMG('1584917865442-de89df76afd3'), bg: 'bg-purple-50', labelEn: 'Accessories', labelHe: 'אביזרים' },
    { key: 'home_decor', emoji: '🛋️', imageUrl: IMG('1555041469-a586c61ea9bc'), bg: 'bg-teal-50', labelEn: 'Home', labelHe: 'בית' },
    { key: 'kids', emoji: '🧸', imageUrl: IMG('1558877385-8d3e09b2b2bb'), bg: 'bg-sky-50', labelEn: 'Kids', labelHe: 'ילדים' },
    { key: 'sports', emoji: '🎾', imageUrl: IMG('1554062614-6da4fa67725a'), bg: 'bg-green-50', labelEn: 'Sports', labelHe: 'ספורט' },
    { key: 'jewelry', emoji: '💎', imageUrl: IMG('1605100804763-247f67b3557e'), bg: 'bg-rose-50', labelEn: 'Jewelry', labelHe: 'תכשיטים' },
    { key: 'gifts', emoji: '🎁', imageUrl: IMG('1513885535751-8b9238bd345a'), bg: 'bg-orange-50', labelEn: 'Gifts', labelHe: 'מתנות' },
  ],
  entertainment: [
    { key: 'cinema', emoji: '🎬', imageUrl: IMG('1517604931442-7e0c8ed2963c'), bg: 'bg-purple-50', labelEn: 'Cinema', labelHe: 'קולנוע' },
    { key: 'music', emoji: '🎵', imageUrl: IMG('1493225457124-a3eb161ffa5f'), bg: 'bg-pink-50', labelEn: 'Music', labelHe: 'מוזיקה' },
    { key: 'gaming', emoji: '🎮', imageUrl: IMG('1542751371-adc38448a05e'), bg: 'bg-blue-50', labelEn: 'Gaming', labelHe: 'גיימינג' },
    { key: 'streaming', emoji: '📺', imageUrl: IMG('1522202176988-66273c2fd55f'), bg: 'bg-red-50', labelEn: 'Streaming', labelHe: 'סטרימינג' },
    { key: 'shows', emoji: '🎭', imageUrl: IMG('1503095396549-807759245b35'), bg: 'bg-amber-50', labelEn: 'Shows', labelHe: 'מופעים' },
    { key: 'parks', emoji: '🎡', imageUrl: IMG('1568849676085-51415703900f'), bg: 'bg-green-50', labelEn: 'Parks', labelHe: 'פארקים' },
    { key: 'escape', emoji: '🔐', imageUrl: IMG('1582048903301-fbe6d7355c8d'), bg: 'bg-teal-50', labelEn: 'Escape Rooms', labelHe: 'חדרי בריחה' },
    { key: 'events', emoji: '🎉', imageUrl: IMG('1492684223066-81342ee5ff30'), bg: 'bg-orange-50', labelEn: 'Events', labelHe: 'אירועים' },
  ],
  travel: [
    { key: 'hotels', emoji: '🏨', imageUrl: IMG('1582719478250-c89cae4dc85b'), bg: 'bg-sky-50', labelEn: 'Hotels', labelHe: 'מלונות' },
    { key: 'flights', emoji: '✈️', imageUrl: IMG('1436491865332-7a61a109cc05'), bg: 'bg-blue-50', labelEn: 'Flights', labelHe: 'טיסות' },
    { key: 'car_rental', emoji: '🚗', imageUrl: IMG('1492144534655-ae79c964c9d7'), bg: 'bg-green-50', labelEn: 'Car Rental', labelHe: 'השכרת רכב' },
    { key: 'tours', emoji: '🗺️', imageUrl: IMG('1488646953014-85cb44e25828'), bg: 'bg-orange-50', labelEn: 'Tours', labelHe: 'סיורים' },
    { key: 'spa', emoji: '💆', imageUrl: IMG('1540555700478-4be289fbecef'), bg: 'bg-pink-50', labelEn: 'Spa', labelHe: 'ספא' },
    { key: 'camping', emoji: '🏕️', imageUrl: IMG('1504280390367-361c6d9f38f4'), bg: 'bg-emerald-50', labelEn: 'Camping', labelHe: 'קמפינג' },
    { key: 'cruises', emoji: '🛳️', imageUrl: IMG('1548574505-5e239809ee19'), bg: 'bg-cyan-50', labelEn: 'Cruises', labelHe: 'שייט' },
    { key: 'vacation', emoji: '🏖️', imageUrl: IMG('1507525428034-b723cf961d3e'), bg: 'bg-amber-50', labelEn: 'Vacation', labelHe: 'חופשה' },
  ],
  health: [
    { key: 'pharmacy', emoji: '💊', imageUrl: IMG('1556228578-0d85b1a4d571'), bg: 'bg-emerald-50', labelEn: 'Pharmacy', labelHe: 'בית מרקחת' },
    { key: 'fitness', emoji: '🏋️', imageUrl: IMG('1571019614242-c5c5dee9f50b'), bg: 'bg-blue-50', labelEn: 'Fitness', labelHe: 'כושר' },
    { key: 'beauty', emoji: '💄', imageUrl: IMG('1522335789203-aabd1fc54bc9'), bg: 'bg-pink-50', labelEn: 'Beauty', labelHe: 'יופי' },
    { key: 'dental', emoji: '🦷', imageUrl: IMG('1606811971618-4486d14f3f99'), bg: 'bg-sky-50', labelEn: 'Dental', labelHe: 'שיניים' },
    { key: 'skincare', emoji: '🧴', imageUrl: IMG('1556228720-195a672e8a03'), bg: 'bg-purple-50', labelEn: 'Skincare', labelHe: 'טיפוח עור' },
    { key: 'haircare', emoji: '💇', imageUrl: IMG('1562322140-8baeececf3df'), bg: 'bg-amber-50', labelEn: 'Hair Care', labelHe: 'טיפוח שיער' },
    { key: 'vitamins', emoji: '🌿', imageUrl: IMG('1607619056574-7b8d3ee536b2'), bg: 'bg-orange-50', labelEn: 'Vitamins', labelHe: 'ויטמינים' },
    { key: 'wellness', emoji: '🧘', imageUrl: IMG('1545205597-3d9d02c29597'), bg: 'bg-teal-50', labelEn: 'Wellness', labelHe: 'בריאות' },
  ],
  education: [
    { key: 'courses', emoji: '🎓', imageUrl: IMG('1503676260728-1c00da094a0b'), bg: 'bg-blue-50', labelEn: 'Courses', labelHe: 'קורסים' },
    { key: 'languages', emoji: '🗣️', imageUrl: IMG('1456513080510-7bf3a84b82f8'), bg: 'bg-purple-50', labelEn: 'Languages', labelHe: 'שפות' },
    { key: 'coding', emoji: '💻', imageUrl: IMG('1542831371-d531d36971e6'), bg: 'bg-emerald-50', labelEn: 'Coding', labelHe: 'תכנות' },
    { key: 'tutoring', emoji: '👨‍🏫', imageUrl: IMG('1571260899304-425eee4c7efc'), bg: 'bg-amber-50', labelEn: 'Tutoring', labelHe: 'שיעורים פרטיים' },
    { key: 'books', emoji: '📚', imageUrl: IMG('1495446815901-a7297e633e8d'), bg: 'bg-orange-50', labelEn: 'Books', labelHe: 'ספרים' },
    { key: 'workshops', emoji: '🛠️', imageUrl: IMG('1581094271901-8022df4466f9'), bg: 'bg-pink-50', labelEn: 'Workshops', labelHe: 'סדנאות' },
    { key: 'certifications', emoji: '🏆', imageUrl: IMG('1606326608606-aa0b62935f2b'), bg: 'bg-sky-50', labelEn: 'Certifications', labelHe: 'הסמכות' },
    { key: 'kids_edu', emoji: '🎨', imageUrl: IMG('1497019547-22be43906c87'), bg: 'bg-green-50', labelEn: 'Kids Education', labelHe: 'חינוך ילדים' },
  ],
  tech: [
    { key: 'phones', emoji: '📱', imageUrl: IMG('1511707171634-5f897ff02aa9'), bg: 'bg-blue-50', labelEn: 'Phones', labelHe: 'סלולר' },
    { key: 'computers', emoji: '💻', imageUrl: IMG('1496181133206-80ce9b88a853'), bg: 'bg-gray-50', labelEn: 'Computers', labelHe: 'מחשבים' },
    { key: 'audio', emoji: '🎧', imageUrl: IMG('1505740420928-5e560c06d30e'), bg: 'bg-purple-50', labelEn: 'Audio', labelHe: 'אודיו' },
    { key: 'gaming_tech', emoji: '🕹️', imageUrl: IMG('1493711662062-fa541adb3fc8'), bg: 'bg-green-50', labelEn: 'Gaming', labelHe: 'גיימינג' },
    { key: 'cameras', emoji: '📷', imageUrl: IMG('1502920917128-1aa500764cbd'), bg: 'bg-amber-50', labelEn: 'Cameras', labelHe: 'מצלמות' },
    { key: 'smart_home', emoji: '🏠', imageUrl: IMG('1558002038-1055907df827'), bg: 'bg-sky-50', labelEn: 'Smart Home', labelHe: 'בית חכם' },
    { key: 'wearables', emoji: '⌚', imageUrl: IMG('1523275335684-37898b6baf30'), bg: 'bg-pink-50', labelEn: 'Wearables', labelHe: 'שעונים חכמים' },
    { key: 'accessories_tech', emoji: '🔌', imageUrl: IMG('1583863788434-e58a36330cf0'), bg: 'bg-orange-50', labelEn: 'Accessories', labelHe: 'אביזרים' },
  ],
};
