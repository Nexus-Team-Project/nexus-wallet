export interface Review {
  id: string;
  businessId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  textHe: string;
  date: string;
  helpful: number;
}

export const mockReviews: Review[] = [
  // McDonald's
  { id: 'rev_001', businessId: 'biz_001', userName: 'Yael K.', userAvatar: 'https://ui-avatars.com/api/?name=YK&background=635bff&color=fff&size=64&bold=true', rating: 5, text: 'Great service and the new burger menu is amazing!', textHe: 'שירות מעולה והתפריט החדש פשוט מדהים!', date: '2026-05-01', helpful: 12 },
  { id: 'rev_002', businessId: 'biz_001', userName: 'Omer S.', userAvatar: 'https://ui-avatars.com/api/?name=OS&background=f59e0b&color=fff&size=64&bold=true', rating: 4, text: 'Always consistent quality. Drive-thru is fast.', textHe: 'תמיד איכות עקבית. הדרייב-טרו מהיר.', date: '2026-04-28', helpful: 8 },
  { id: 'rev_003', businessId: 'biz_001', userName: 'Noa L.', userAvatar: 'https://ui-avatars.com/api/?name=NL&background=10b981&color=fff&size=64&bold=true', rating: 4, text: 'Good food but sometimes crowded during lunch.', textHe: 'אוכל טוב אבל לפעמים צפוף בשעות הצהריים.', date: '2026-04-15', helpful: 5 },

  // Castro
  { id: 'rev_004', businessId: 'biz_002', userName: 'Shira M.', userAvatar: 'https://ui-avatars.com/api/?name=SM&background=ec4899&color=fff&size=64&bold=true', rating: 5, text: 'Love the new summer collection! Great quality for the price.', textHe: 'אוהבת את הקולקציית קיץ החדשה! איכות מעולה למחיר.', date: '2026-05-05', helpful: 18 },
  { id: 'rev_005', businessId: 'biz_002', userName: 'Dan R.', userAvatar: 'https://ui-avatars.com/api/?name=DR&background=3b82f6&color=fff&size=64&bold=true', rating: 4, text: 'Nice clothes, helpful staff at Dizengoff branch.', textHe: 'בגדים יפים, צוות עוזר בסניף דיזנגוף.', date: '2026-04-20', helpful: 7 },
  { id: 'rev_006', businessId: 'biz_002', userName: 'Maya T.', userAvatar: 'https://ui-avatars.com/api/?name=MT&background=8b5cf6&color=fff&size=64&bold=true', rating: 3, text: 'Designs are nice but sizes run small sometimes.', textHe: 'העיצובים יפים אבל המידות לפעמים קטנות.', date: '2026-04-10', helpful: 14 },

  // Cinema City
  { id: 'rev_007', businessId: 'biz_003', userName: 'Itai B.', userAvatar: 'https://ui-avatars.com/api/?name=IB&background=ef4444&color=fff&size=64&bold=true', rating: 5, text: 'Best IMAX experience in Israel! Worth every shekel.', textHe: 'חוויית IMAX הכי טובה בישראל! שווה כל שקל.', date: '2026-05-08', helpful: 22 },
  { id: 'rev_008', businessId: 'biz_003', userName: 'Tamar G.', userAvatar: 'https://ui-avatars.com/api/?name=TG&background=06b6d4&color=fff&size=64&bold=true', rating: 4, text: 'Great selection of movies and comfortable seats.', textHe: 'מבחר סרטים מעולה ומושבים נוחים.', date: '2026-04-25', helpful: 9 },

  // Aroma
  { id: 'rev_009', businessId: 'biz_004', userName: 'Lior A.', userAvatar: 'https://ui-avatars.com/api/?name=LA&background=f97316&color=fff&size=64&bold=true', rating: 5, text: 'Best coffee chain in Israel. The iced latte is perfect!', textHe: 'רשת הקפה הכי טובה בישראל. הלאטה קר מושלם!', date: '2026-05-10', helpful: 30 },
  { id: 'rev_010', businessId: 'biz_004', userName: 'Rotem H.', userAvatar: 'https://ui-avatars.com/api/?name=RH&background=84cc16&color=fff&size=64&bold=true', rating: 4, text: 'Always my go-to for breakfast meetings.', textHe: 'תמיד הבחירה שלי לפגישות בוקר.', date: '2026-04-22', helpful: 11 },

  // Superpharm
  { id: 'rev_011', businessId: 'biz_006', userName: 'Ella P.', userAvatar: 'https://ui-avatars.com/api/?name=EP&background=14b8a6&color=fff&size=64&bold=true', rating: 4, text: 'Great selection of beauty products. Club member discounts are worth it.', textHe: 'מבחר מעולה של מוצרי יופי. הנחות מועדון שוות.', date: '2026-05-03', helpful: 16 },

  // KSP
  { id: 'rev_012', businessId: 'biz_007', userName: 'Alon D.', userAvatar: 'https://ui-avatars.com/api/?name=AD&background=6366f1&color=fff&size=64&bold=true', rating: 4, text: 'Best prices on electronics. Online ordering is very convenient.', textHe: 'המחירים הכי טובים על אלקטרוניקה. הזמנה אונליין מאוד נוחה.', date: '2026-05-07', helpful: 20 },

  // Holmes Place
  { id: 'rev_013', businessId: 'biz_008', userName: 'Gal S.', userAvatar: 'https://ui-avatars.com/api/?name=GS&background=d946ef&color=fff&size=64&bold=true', rating: 5, text: 'Premium facilities. The pool and spa are incredible.', textHe: 'מתקנים פרימיום. הבריכה והספא מדהימים.', date: '2026-05-06', helpful: 13 },

  // Shufersal
  { id: 'rev_014', businessId: 'biz_009', userName: 'Hadas B.', userAvatar: 'https://ui-avatars.com/api/?name=HB&background=0ea5e9&color=fff&size=64&bold=true', rating: 3, text: 'Good variety but some branches could be better organized.', textHe: 'מגוון טוב אבל חלק מהסניפים יכולים להיות מסודרים יותר.', date: '2026-04-30', helpful: 6 },
];
