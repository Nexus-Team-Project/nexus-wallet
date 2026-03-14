import type { VoucherCategory } from '../../types/voucher.types';

export interface Subcategory {
  key: string;
  icon: string;
  iconColor: string;
  bg: string;
  labelEn: string;
  labelHe: string;
}

export const subcategoriesByCategory: Record<VoucherCategory, Subcategory[]> = {
  food: [
    { key: 'restaurants', icon: 'restaurant', iconColor: 'text-orange-600', bg: 'bg-orange-50', labelEn: 'Restaurants', labelHe: 'מסעדות' },
    { key: 'cafes', icon: 'local_cafe', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Cafes', labelHe: 'בתי קפה' },
    { key: 'fast_food', icon: 'fastfood', iconColor: 'text-red-500', bg: 'bg-red-50', labelEn: 'Fast Food', labelHe: 'מזון מהיר' },
    { key: 'grocery', icon: 'shopping_cart', iconColor: 'text-green-600', bg: 'bg-green-50', labelEn: 'Grocery', labelHe: 'סופר' },
    { key: 'delivery', icon: 'delivery_dining', iconColor: 'text-sky-600', bg: 'bg-sky-50', labelEn: 'Delivery', labelHe: 'משלוחים' },
    { key: 'bakery', icon: 'bakery_dining', iconColor: 'text-yellow-700', bg: 'bg-yellow-50', labelEn: 'Bakery', labelHe: 'מאפיות' },
    { key: 'snacks', icon: 'icecream', iconColor: 'text-pink-500', bg: 'bg-pink-50', labelEn: 'Snacks', labelHe: 'חטיפים' },
    { key: 'drinks', icon: 'local_bar', iconColor: 'text-purple-600', bg: 'bg-purple-50', labelEn: 'Drinks', labelHe: 'משקאות' },
  ],
  shopping: [
    { key: 'fashion', icon: 'checkroom', iconColor: 'text-pink-600', bg: 'bg-pink-50', labelEn: 'Fashion', labelHe: 'אופנה' },
    { key: 'shoes', icon: 'steps', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Shoes', labelHe: 'נעליים' },
    { key: 'accessories', icon: 'watch', iconColor: 'text-purple-600', bg: 'bg-purple-50', labelEn: 'Accessories', labelHe: 'אביזרים' },
    { key: 'home_decor', icon: 'chair', iconColor: 'text-teal-600', bg: 'bg-teal-50', labelEn: 'Home', labelHe: 'בית' },
    { key: 'kids', icon: 'child_care', iconColor: 'text-sky-600', bg: 'bg-sky-50', labelEn: 'Kids', labelHe: 'ילדים' },
    { key: 'sports', icon: 'sports_tennis', iconColor: 'text-green-600', bg: 'bg-green-50', labelEn: 'Sports', labelHe: 'ספורט' },
    { key: 'jewelry', icon: 'diamond', iconColor: 'text-rose-500', bg: 'bg-rose-50', labelEn: 'Jewelry', labelHe: 'תכשיטים' },
    { key: 'gifts', icon: 'redeem', iconColor: 'text-orange-500', bg: 'bg-orange-50', labelEn: 'Gifts', labelHe: 'מתנות' },
  ],
  entertainment: [
    { key: 'cinema', icon: 'movie', iconColor: 'text-purple-600', bg: 'bg-purple-50', labelEn: 'Cinema', labelHe: 'קולנוע' },
    { key: 'music', icon: 'music_note', iconColor: 'text-pink-500', bg: 'bg-pink-50', labelEn: 'Music', labelHe: 'מוזיקה' },
    { key: 'gaming', icon: 'sports_esports', iconColor: 'text-blue-600', bg: 'bg-blue-50', labelEn: 'Gaming', labelHe: 'גיימינג' },
    { key: 'streaming', icon: 'play_circle', iconColor: 'text-red-500', bg: 'bg-red-50', labelEn: 'Streaming', labelHe: 'סטרימינג' },
    { key: 'shows', icon: 'theater_comedy', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Shows', labelHe: 'מופעים' },
    { key: 'parks', icon: 'attractions', iconColor: 'text-green-600', bg: 'bg-green-50', labelEn: 'Parks', labelHe: 'פארקים' },
    { key: 'escape', icon: 'lock_open', iconColor: 'text-teal-600', bg: 'bg-teal-50', labelEn: 'Escape Rooms', labelHe: 'חדרי בריחה' },
    { key: 'events', icon: 'celebration', iconColor: 'text-orange-500', bg: 'bg-orange-50', labelEn: 'Events', labelHe: 'אירועים' },
  ],
  travel: [
    { key: 'hotels', icon: 'hotel', iconColor: 'text-sky-600', bg: 'bg-sky-50', labelEn: 'Hotels', labelHe: 'מלונות' },
    { key: 'flights', icon: 'flight', iconColor: 'text-blue-600', bg: 'bg-blue-50', labelEn: 'Flights', labelHe: 'טיסות' },
    { key: 'car_rental', icon: 'directions_car', iconColor: 'text-green-600', bg: 'bg-green-50', labelEn: 'Car Rental', labelHe: 'השכרת רכב' },
    { key: 'tours', icon: 'tour', iconColor: 'text-orange-500', bg: 'bg-orange-50', labelEn: 'Tours', labelHe: 'סיורים' },
    { key: 'spa', icon: 'spa', iconColor: 'text-pink-500', bg: 'bg-pink-50', labelEn: 'Spa', labelHe: 'ספא' },
    { key: 'camping', icon: 'camping', iconColor: 'text-emerald-600', bg: 'bg-emerald-50', labelEn: 'Camping', labelHe: 'קמפינג' },
    { key: 'cruises', icon: 'sailing', iconColor: 'text-cyan-600', bg: 'bg-cyan-50', labelEn: 'Cruises', labelHe: 'שייט' },
    { key: 'vacation', icon: 'beach_access', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Vacation', labelHe: 'חופשה' },
  ],
  health: [
    { key: 'pharmacy', icon: 'local_pharmacy', iconColor: 'text-emerald-600', bg: 'bg-emerald-50', labelEn: 'Pharmacy', labelHe: 'בית מרקחת' },
    { key: 'fitness', icon: 'fitness_center', iconColor: 'text-blue-600', bg: 'bg-blue-50', labelEn: 'Fitness', labelHe: 'כושר' },
    { key: 'beauty', icon: 'face', iconColor: 'text-pink-500', bg: 'bg-pink-50', labelEn: 'Beauty', labelHe: 'יופי' },
    { key: 'dental', icon: 'dentistry', iconColor: 'text-sky-600', bg: 'bg-sky-50', labelEn: 'Dental', labelHe: 'שיניים' },
    { key: 'skincare', icon: 'dermatology', iconColor: 'text-purple-500', bg: 'bg-purple-50', labelEn: 'Skincare', labelHe: 'טיפוח עור' },
    { key: 'haircare', icon: 'content_cut', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Hair Care', labelHe: 'טיפוח שיער' },
    { key: 'vitamins', icon: 'medication', iconColor: 'text-orange-500', bg: 'bg-orange-50', labelEn: 'Vitamins', labelHe: 'ויטמינים' },
    { key: 'wellness', icon: 'self_improvement', iconColor: 'text-teal-600', bg: 'bg-teal-50', labelEn: 'Wellness', labelHe: 'בריאות' },
  ],
  education: [
    { key: 'courses', icon: 'school', iconColor: 'text-blue-600', bg: 'bg-blue-50', labelEn: 'Courses', labelHe: 'קורסים' },
    { key: 'languages', icon: 'translate', iconColor: 'text-purple-600', bg: 'bg-purple-50', labelEn: 'Languages', labelHe: 'שפות' },
    { key: 'coding', icon: 'code', iconColor: 'text-emerald-600', bg: 'bg-emerald-50', labelEn: 'Coding', labelHe: 'תכנות' },
    { key: 'tutoring', icon: 'person', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Tutoring', labelHe: 'שיעורים פרטיים' },
    { key: 'books', icon: 'menu_book', iconColor: 'text-orange-500', bg: 'bg-orange-50', labelEn: 'Books', labelHe: 'ספרים' },
    { key: 'workshops', icon: 'groups', iconColor: 'text-pink-500', bg: 'bg-pink-50', labelEn: 'Workshops', labelHe: 'סדנאות' },
    { key: 'certifications', icon: 'workspace_premium', iconColor: 'text-sky-600', bg: 'bg-sky-50', labelEn: 'Certifications', labelHe: 'הסמכות' },
    { key: 'kids_edu', icon: 'child_care', iconColor: 'text-green-600', bg: 'bg-green-50', labelEn: 'Kids Education', labelHe: 'חינוך ילדים' },
  ],
  tech: [
    { key: 'phones', icon: 'smartphone', iconColor: 'text-blue-600', bg: 'bg-blue-50', labelEn: 'Phones', labelHe: 'סלולר' },
    { key: 'computers', icon: 'laptop', iconColor: 'text-gray-700', bg: 'bg-gray-50', labelEn: 'Computers', labelHe: 'מחשבים' },
    { key: 'audio', icon: 'headphones', iconColor: 'text-purple-600', bg: 'bg-purple-50', labelEn: 'Audio', labelHe: 'אודיו' },
    { key: 'gaming_tech', icon: 'videogame_asset', iconColor: 'text-green-600', bg: 'bg-green-50', labelEn: 'Gaming', labelHe: 'גיימינג' },
    { key: 'cameras', icon: 'photo_camera', iconColor: 'text-amber-600', bg: 'bg-amber-50', labelEn: 'Cameras', labelHe: 'מצלמות' },
    { key: 'smart_home', icon: 'home', iconColor: 'text-sky-600', bg: 'bg-sky-50', labelEn: 'Smart Home', labelHe: 'בית חכם' },
    { key: 'wearables', icon: 'watch', iconColor: 'text-pink-500', bg: 'bg-pink-50', labelEn: 'Wearables', labelHe: 'שעונים חכמים' },
    { key: 'accessories_tech', icon: 'cable', iconColor: 'text-orange-500', bg: 'bg-orange-50', labelEn: 'Accessories', labelHe: 'אביזרים' },
  ],
};
