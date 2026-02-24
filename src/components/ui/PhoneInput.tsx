/**
 * PhoneInput — two separate pills: [🇮🇱 +972 ▾]  [050-000-0000]
 *
 * Layout (RTL):  [ 🇮🇱 +972 ▾ ]   [ שדה קלט טלפון     ]
 * Layout (LTR):  [ 050-000-0000     ]   [ 🇮🇱 +972 ▾ ]
 *
 * Country picker opens as a bottom sheet (slides up from bottom of screen).
 */
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../i18n/LanguageContext';

interface Country {
  flag: string;
  name: string;
  nameHe: string;
  dial: string;
  code: string;
  maxDigits: number;
}

const COUNTRIES: Country[] = [
  // ── Israel first ────────────────────────────────────────────────────────────
  { flag: '🇮🇱', name: 'Israel',                       nameHe: 'ישראל',                    dial: '+972', code: 'IL', maxDigits: 10 },
  // ── Rest alphabetically by English name ─────────────────────────────────────
  { flag: '🇦🇫', name: 'Afghanistan',                  nameHe: 'אפגניסטן',                 dial: '+93',  code: 'AF', maxDigits: 9  },
  { flag: '🇦🇱', name: 'Albania',                      nameHe: 'אלבניה',                   dial: '+355', code: 'AL', maxDigits: 9  },
  { flag: '🇩🇿', name: 'Algeria',                      nameHe: 'אלג\'יריה',                dial: '+213', code: 'DZ', maxDigits: 9  },
  { flag: '🇦🇩', name: 'Andorra',                      nameHe: 'אנדורה',                   dial: '+376', code: 'AD', maxDigits: 6  },
  { flag: '🇦🇴', name: 'Angola',                       nameHe: 'אנגולה',                   dial: '+244', code: 'AO', maxDigits: 9  },
  { flag: '🇦🇬', name: 'Antigua and Barbuda',          nameHe: 'אנטיגואה וברבודה',         dial: '+1268',code: 'AG', maxDigits: 7  },
  { flag: '🇦🇷', name: 'Argentina',                    nameHe: 'ארגנטינה',                 dial: '+54',  code: 'AR', maxDigits: 10 },
  { flag: '🇦🇲', name: 'Armenia',                      nameHe: 'ארמניה',                   dial: '+374', code: 'AM', maxDigits: 8  },
  { flag: '🇦🇺', name: 'Australia',                    nameHe: 'אוסטרליה',                 dial: '+61',  code: 'AU', maxDigits: 9  },
  { flag: '🇦🇹', name: 'Austria',                      nameHe: 'אוסטריה',                  dial: '+43',  code: 'AT', maxDigits: 11 },
  { flag: '🇦🇿', name: 'Azerbaijan',                   nameHe: 'אזרבייג\'ן',               dial: '+994', code: 'AZ', maxDigits: 9  },
  { flag: '🇧🇸', name: 'Bahamas',                      nameHe: 'איי בהאמה',                dial: '+1242',code: 'BS', maxDigits: 7  },
  { flag: '🇧🇭', name: 'Bahrain',                      nameHe: 'בחריין',                   dial: '+973', code: 'BH', maxDigits: 8  },
  { flag: '🇧🇩', name: 'Bangladesh',                   nameHe: 'בנגלדש',                   dial: '+880', code: 'BD', maxDigits: 10 },
  { flag: '🇧🇧', name: 'Barbados',                     nameHe: 'ברבדוס',                   dial: '+1246',code: 'BB', maxDigits: 7  },
  { flag: '🇧🇾', name: 'Belarus',                      nameHe: 'בלארוס',                   dial: '+375', code: 'BY', maxDigits: 9  },
  { flag: '🇧🇪', name: 'Belgium',                      nameHe: 'בלגיה',                    dial: '+32',  code: 'BE', maxDigits: 9  },
  { flag: '🇧🇿', name: 'Belize',                       nameHe: 'בליז',                     dial: '+501', code: 'BZ', maxDigits: 7  },
  { flag: '🇧🇯', name: 'Benin',                        nameHe: 'בנין',                     dial: '+229', code: 'BJ', maxDigits: 8  },
  { flag: '🇧🇹', name: 'Bhutan',                       nameHe: 'בהוטן',                    dial: '+975', code: 'BT', maxDigits: 8  },
  { flag: '🇧🇴', name: 'Bolivia',                      nameHe: 'בוליביה',                  dial: '+591', code: 'BO', maxDigits: 9  },
  { flag: '🇧🇦', name: 'Bosnia and Herzegovina',       nameHe: 'בוסניה והרצגובינה',        dial: '+387', code: 'BA', maxDigits: 8  },
  { flag: '🇧🇼', name: 'Botswana',                     nameHe: 'בוטסואנה',                 dial: '+267', code: 'BW', maxDigits: 8  },
  { flag: '🇧🇷', name: 'Brazil',                       nameHe: 'ברזיל',                    dial: '+55',  code: 'BR', maxDigits: 11 },
  { flag: '🇧🇳', name: 'Brunei',                       nameHe: 'ברוניי',                   dial: '+673', code: 'BN', maxDigits: 7  },
  { flag: '🇧🇬', name: 'Bulgaria',                     nameHe: 'בולגריה',                  dial: '+359', code: 'BG', maxDigits: 9  },
  { flag: '🇧🇫', name: 'Burkina Faso',                 nameHe: 'בורקינה פאסו',             dial: '+226', code: 'BF', maxDigits: 8  },
  { flag: '🇧🇮', name: 'Burundi',                      nameHe: 'בורונדי',                  dial: '+257', code: 'BI', maxDigits: 8  },
  { flag: '🇨🇻', name: 'Cabo Verde',                   nameHe: 'כף ורדה',                  dial: '+238', code: 'CV', maxDigits: 7  },
  { flag: '🇰🇭', name: 'Cambodia',                     nameHe: 'קמבודיה',                  dial: '+855', code: 'KH', maxDigits: 9  },
  { flag: '🇨🇲', name: 'Cameroon',                     nameHe: 'קמרון',                    dial: '+237', code: 'CM', maxDigits: 9  },
  { flag: '🇨🇦', name: 'Canada',                       nameHe: 'קנדה',                     dial: '+1',   code: 'CA', maxDigits: 10 },
  { flag: '🇨🇫', name: 'Central African Republic',    nameHe: 'הרפובליקה המרכז-אפריקאית', dial: '+236', code: 'CF', maxDigits: 8  },
  { flag: '🇹🇩', name: 'Chad',                         nameHe: 'צ\'אד',                    dial: '+235', code: 'TD', maxDigits: 8  },
  { flag: '🇨🇱', name: 'Chile',                        nameHe: 'צ\'ילה',                   dial: '+56',  code: 'CL', maxDigits: 9  },
  { flag: '🇨🇳', name: 'China',                        nameHe: 'סין',                      dial: '+86',  code: 'CN', maxDigits: 11 },
  { flag: '🇨🇴', name: 'Colombia',                     nameHe: 'קולומביה',                 dial: '+57',  code: 'CO', maxDigits: 10 },
  { flag: '🇰🇲', name: 'Comoros',                      nameHe: 'קומורו',                   dial: '+269', code: 'KM', maxDigits: 7  },
  { flag: '🇨🇬', name: 'Congo (Republic)',             nameHe: 'קונגו (רפובליקה)',         dial: '+242', code: 'CG', maxDigits: 9  },
  { flag: '🇨🇩', name: 'Congo (DR)',                   nameHe: 'קונגו (דמוקרטית)',         dial: '+243', code: 'CD', maxDigits: 9  },
  { flag: '🇨🇷', name: 'Costa Rica',                   nameHe: 'קוסטה ריקה',               dial: '+506', code: 'CR', maxDigits: 8  },
  { flag: '🇭🇷', name: 'Croatia',                      nameHe: 'קרואטיה',                  dial: '+385', code: 'HR', maxDigits: 9  },
  { flag: '🇨🇺', name: 'Cuba',                         nameHe: 'קובה',                     dial: '+53',  code: 'CU', maxDigits: 8  },
  { flag: '🇨🇾', name: 'Cyprus',                       nameHe: 'קפריסין',                  dial: '+357', code: 'CY', maxDigits: 8  },
  { flag: '🇨🇿', name: 'Czech Republic',               nameHe: 'צ\'כיה',                   dial: '+420', code: 'CZ', maxDigits: 9  },
  { flag: '🇩🇰', name: 'Denmark',                      nameHe: 'דנמרק',                    dial: '+45',  code: 'DK', maxDigits: 8  },
  { flag: '🇩🇯', name: 'Djibouti',                     nameHe: 'ג\'יבוטי',                 dial: '+253', code: 'DJ', maxDigits: 8  },
  { flag: '🇩🇲', name: 'Dominica',                     nameHe: 'דומיניקה',                 dial: '+1767',code: 'DM', maxDigits: 7  },
  { flag: '🇩🇴', name: 'Dominican Republic',           nameHe: 'הרפובליקה הדומיניקנית',    dial: '+1809',code: 'DO', maxDigits: 10 },
  { flag: '🇪🇨', name: 'Ecuador',                      nameHe: 'אקוודור',                  dial: '+593', code: 'EC', maxDigits: 9  },
  { flag: '🇪🇬', name: 'Egypt',                        nameHe: 'מצרים',                    dial: '+20',  code: 'EG', maxDigits: 10 },
  { flag: '🇸🇻', name: 'El Salvador',                  nameHe: 'אל סלבדור',                dial: '+503', code: 'SV', maxDigits: 8  },
  { flag: '🇬🇶', name: 'Equatorial Guinea',            nameHe: 'גינאה המשוונית',           dial: '+240', code: 'GQ', maxDigits: 9  },
  { flag: '🇪🇷', name: 'Eritrea',                      nameHe: 'אריתריאה',                 dial: '+291', code: 'ER', maxDigits: 7  },
  { flag: '🇪🇪', name: 'Estonia',                      nameHe: 'אסטוניה',                  dial: '+372', code: 'EE', maxDigits: 8  },
  { flag: '🇸🇿', name: 'Eswatini',                     nameHe: 'אסואטיני',                 dial: '+268', code: 'SZ', maxDigits: 8  },
  { flag: '🇪🇹', name: 'Ethiopia',                     nameHe: 'אתיופיה',                  dial: '+251', code: 'ET', maxDigits: 9  },
  { flag: '🇫🇯', name: 'Fiji',                         nameHe: 'פיג\'י',                   dial: '+679', code: 'FJ', maxDigits: 7  },
  { flag: '🇫🇮', name: 'Finland',                      nameHe: 'פינלנד',                   dial: '+358', code: 'FI', maxDigits: 10 },
  { flag: '🇫🇷', name: 'France',                       nameHe: 'צרפת',                     dial: '+33',  code: 'FR', maxDigits: 9  },
  { flag: '🇬🇦', name: 'Gabon',                        nameHe: 'גבון',                     dial: '+241', code: 'GA', maxDigits: 8  },
  { flag: '🇬🇲', name: 'Gambia',                       nameHe: 'גמביה',                    dial: '+220', code: 'GM', maxDigits: 7  },
  { flag: '🇬🇪', name: 'Georgia',                      nameHe: 'גאורגיה',                  dial: '+995', code: 'GE', maxDigits: 9  },
  { flag: '🇩🇪', name: 'Germany',                      nameHe: 'גרמניה',                   dial: '+49',  code: 'DE', maxDigits: 11 },
  { flag: '🇬🇭', name: 'Ghana',                        nameHe: 'גאנה',                     dial: '+233', code: 'GH', maxDigits: 9  },
  { flag: '🇬🇷', name: 'Greece',                       nameHe: 'יוון',                     dial: '+30',  code: 'GR', maxDigits: 10 },
  { flag: '🇬🇩', name: 'Grenada',                      nameHe: 'גרנדה',                    dial: '+1473',code: 'GD', maxDigits: 7  },
  { flag: '🇬🇹', name: 'Guatemala',                    nameHe: 'גואטמלה',                  dial: '+502', code: 'GT', maxDigits: 8  },
  { flag: '🇬🇳', name: 'Guinea',                       nameHe: 'גינאה',                    dial: '+224', code: 'GN', maxDigits: 9  },
  { flag: '🇬🇼', name: 'Guinea-Bissau',                nameHe: 'גינאה-ביסאו',              dial: '+245', code: 'GW', maxDigits: 9  },
  { flag: '🇬🇾', name: 'Guyana',                       nameHe: 'גיאנה',                    dial: '+592', code: 'GY', maxDigits: 7  },
  { flag: '🇭🇹', name: 'Haiti',                        nameHe: 'האיטי',                    dial: '+509', code: 'HT', maxDigits: 8  },
  { flag: '🇭🇳', name: 'Honduras',                     nameHe: 'הונדורס',                  dial: '+504', code: 'HN', maxDigits: 8  },
  { flag: '🇭🇺', name: 'Hungary',                      nameHe: 'הונגריה',                  dial: '+36',  code: 'HU', maxDigits: 9  },
  { flag: '🇮🇸', name: 'Iceland',                      nameHe: 'איסלנד',                   dial: '+354', code: 'IS', maxDigits: 7  },
  { flag: '🇮🇳', name: 'India',                        nameHe: 'הודו',                     dial: '+91',  code: 'IN', maxDigits: 10 },
  { flag: '🇮🇩', name: 'Indonesia',                    nameHe: 'אינדונזיה',                dial: '+62',  code: 'ID', maxDigits: 12 },
  { flag: '🇮🇷', name: 'Iran',                         nameHe: 'איראן',                    dial: '+98',  code: 'IR', maxDigits: 10 },
  { flag: '🇮🇶', name: 'Iraq',                         nameHe: 'עיראק',                    dial: '+964', code: 'IQ', maxDigits: 10 },
  { flag: '🇮🇪', name: 'Ireland',                      nameHe: 'אירלנד',                   dial: '+353', code: 'IE', maxDigits: 9  },
  { flag: '🇮🇹', name: 'Italy',                        nameHe: 'איטליה',                   dial: '+39',  code: 'IT', maxDigits: 10 },
  { flag: '🇯🇲', name: 'Jamaica',                      nameHe: 'ג\'מייקה',                 dial: '+1876',code: 'JM', maxDigits: 7  },
  { flag: '🇯🇵', name: 'Japan',                        nameHe: 'יפן',                      dial: '+81',  code: 'JP', maxDigits: 10 },
  { flag: '🇯🇴', name: 'Jordan',                       nameHe: 'ירדן',                     dial: '+962', code: 'JO', maxDigits: 9  },
  { flag: '🇰🇿', name: 'Kazakhstan',                   nameHe: 'קזחסטן',                   dial: '+7',   code: 'KZ', maxDigits: 10 },
  { flag: '🇰🇪', name: 'Kenya',                        nameHe: 'קניה',                     dial: '+254', code: 'KE', maxDigits: 9  },
  { flag: '🇰🇮', name: 'Kiribati',                     nameHe: 'קיריבאטי',                 dial: '+686', code: 'KI', maxDigits: 8  },
  { flag: '🇽🇰', name: 'Kosovo',                       nameHe: 'קוסובו',                   dial: '+383', code: 'XK', maxDigits: 8  },
  { flag: '🇰🇼', name: 'Kuwait',                       nameHe: 'כווית',                    dial: '+965', code: 'KW', maxDigits: 8  },
  { flag: '🇰🇬', name: 'Kyrgyzstan',                   nameHe: 'קירגיזסטן',                dial: '+996', code: 'KG', maxDigits: 9  },
  { flag: '🇱🇦', name: 'Laos',                         nameHe: 'לאוס',                     dial: '+856', code: 'LA', maxDigits: 10 },
  { flag: '🇱🇻', name: 'Latvia',                       nameHe: 'לטביה',                    dial: '+371', code: 'LV', maxDigits: 8  },
  { flag: '🇱🇧', name: 'Lebanon',                      nameHe: 'לבנון',                    dial: '+961', code: 'LB', maxDigits: 8  },
  { flag: '🇱🇸', name: 'Lesotho',                      nameHe: 'לסוטו',                    dial: '+266', code: 'LS', maxDigits: 8  },
  { flag: '🇱🇷', name: 'Liberia',                      nameHe: 'ליבריה',                   dial: '+231', code: 'LR', maxDigits: 8  },
  { flag: '🇱🇾', name: 'Libya',                        nameHe: 'לוב',                      dial: '+218', code: 'LY', maxDigits: 9  },
  { flag: '🇱🇮', name: 'Liechtenstein',                nameHe: 'ליכטנשטיין',               dial: '+423', code: 'LI', maxDigits: 9  },
  { flag: '🇱🇹', name: 'Lithuania',                    nameHe: 'ליטא',                     dial: '+370', code: 'LT', maxDigits: 8  },
  { flag: '🇱🇺', name: 'Luxembourg',                   nameHe: 'לוקסמבורג',                dial: '+352', code: 'LU', maxDigits: 9  },
  { flag: '🇲🇬', name: 'Madagascar',                   nameHe: 'מדגסקר',                   dial: '+261', code: 'MG', maxDigits: 9  },
  { flag: '🇲🇼', name: 'Malawi',                       nameHe: 'מלאווי',                   dial: '+265', code: 'MW', maxDigits: 9  },
  { flag: '🇲🇾', name: 'Malaysia',                     nameHe: 'מלזיה',                    dial: '+60',  code: 'MY', maxDigits: 10 },
  { flag: '🇲🇻', name: 'Maldives',                     nameHe: 'המלדיביים',                dial: '+960', code: 'MV', maxDigits: 7  },
  { flag: '🇲🇱', name: 'Mali',                         nameHe: 'מאלי',                     dial: '+223', code: 'ML', maxDigits: 8  },
  { flag: '🇲🇹', name: 'Malta',                        nameHe: 'מלטה',                     dial: '+356', code: 'MT', maxDigits: 8  },
  { flag: '🇲🇭', name: 'Marshall Islands',             nameHe: 'איי מרשל',                 dial: '+692', code: 'MH', maxDigits: 7  },
  { flag: '🇲🇷', name: 'Mauritania',                   nameHe: 'מאוריטניה',                dial: '+222', code: 'MR', maxDigits: 8  },
  { flag: '🇲🇺', name: 'Mauritius',                    nameHe: 'מאוריציוס',                dial: '+230', code: 'MU', maxDigits: 8  },
  { flag: '🇲🇽', name: 'Mexico',                       nameHe: 'מקסיקו',                   dial: '+52',  code: 'MX', maxDigits: 10 },
  { flag: '🇫🇲', name: 'Micronesia',                   nameHe: 'מיקרונזיה',                dial: '+691', code: 'FM', maxDigits: 7  },
  { flag: '🇲🇩', name: 'Moldova',                      nameHe: 'מולדובה',                  dial: '+373', code: 'MD', maxDigits: 8  },
  { flag: '🇲🇨', name: 'Monaco',                       nameHe: 'מונקו',                    dial: '+377', code: 'MC', maxDigits: 9  },
  { flag: '🇲🇳', name: 'Mongolia',                     nameHe: 'מונגוליה',                 dial: '+976', code: 'MN', maxDigits: 8  },
  { flag: '🇲🇪', name: 'Montenegro',                   nameHe: 'מונטנגרו',                 dial: '+382', code: 'ME', maxDigits: 8  },
  { flag: '🇲🇦', name: 'Morocco',                      nameHe: 'מרוקו',                    dial: '+212', code: 'MA', maxDigits: 9  },
  { flag: '🇲🇿', name: 'Mozambique',                   nameHe: 'מוזמביק',                  dial: '+258', code: 'MZ', maxDigits: 9  },
  { flag: '🇲🇲', name: 'Myanmar',                      nameHe: 'מיאנמר',                   dial: '+95',  code: 'MM', maxDigits: 10 },
  { flag: '🇳🇦', name: 'Namibia',                      nameHe: 'נמיביה',                   dial: '+264', code: 'NA', maxDigits: 10 },
  { flag: '🇳🇷', name: 'Nauru',                        nameHe: 'נאורו',                    dial: '+674', code: 'NR', maxDigits: 7  },
  { flag: '🇳🇵', name: 'Nepal',                        nameHe: 'נפאל',                     dial: '+977', code: 'NP', maxDigits: 10 },
  { flag: '🇳🇱', name: 'Netherlands',                  nameHe: 'הולנד',                    dial: '+31',  code: 'NL', maxDigits: 9  },
  { flag: '🇳🇿', name: 'New Zealand',                  nameHe: 'ניו זילנד',                dial: '+64',  code: 'NZ', maxDigits: 9  },
  { flag: '🇳🇮', name: 'Nicaragua',                    nameHe: 'ניקרגואה',                 dial: '+505', code: 'NI', maxDigits: 8  },
  { flag: '🇳🇪', name: 'Niger',                        nameHe: 'ניז\'ר',                   dial: '+227', code: 'NE', maxDigits: 8  },
  { flag: '🇳🇬', name: 'Nigeria',                      nameHe: 'ניגריה',                   dial: '+234', code: 'NG', maxDigits: 10 },
  { flag: '🇲🇰', name: 'North Macedonia',              nameHe: 'מקדוניה הצפונית',          dial: '+389', code: 'MK', maxDigits: 8  },
  { flag: '🇳🇴', name: 'Norway',                       nameHe: 'נורווגיה',                 dial: '+47',  code: 'NO', maxDigits: 8  },
  { flag: '🇴🇲', name: 'Oman',                         nameHe: 'עומאן',                    dial: '+968', code: 'OM', maxDigits: 8  },
  { flag: '🇵🇰', name: 'Pakistan',                     nameHe: 'פקיסטן',                   dial: '+92',  code: 'PK', maxDigits: 10 },
  { flag: '🇵🇼', name: 'Palau',                        nameHe: 'פלאו',                     dial: '+680', code: 'PW', maxDigits: 7  },
  { flag: '🇵🇦', name: 'Panama',                       nameHe: 'פנמה',                     dial: '+507', code: 'PA', maxDigits: 8  },
  { flag: '🇵🇬', name: 'Papua New Guinea',             nameHe: 'פפואה גינאה החדשה',        dial: '+675', code: 'PG', maxDigits: 8  },
  { flag: '🇵🇾', name: 'Paraguay',                     nameHe: 'פרגוואי',                  dial: '+595', code: 'PY', maxDigits: 9  },
  { flag: '🇵🇪', name: 'Peru',                         nameHe: 'פרו',                      dial: '+51',  code: 'PE', maxDigits: 9  },
  { flag: '🇵🇭', name: 'Philippines',                  nameHe: 'פיליפינים',                dial: '+63',  code: 'PH', maxDigits: 10 },
  { flag: '🇵🇱', name: 'Poland',                       nameHe: 'פולין',                    dial: '+48',  code: 'PL', maxDigits: 9  },
  { flag: '🇵🇹', name: 'Portugal',                     nameHe: 'פורטוגל',                  dial: '+351', code: 'PT', maxDigits: 9  },
  { flag: '🇶🇦', name: 'Qatar',                        nameHe: 'קטר',                      dial: '+974', code: 'QA', maxDigits: 8  },
  { flag: '🇷🇴', name: 'Romania',                      nameHe: 'רומניה',                   dial: '+40',  code: 'RO', maxDigits: 9  },
  { flag: '🇷🇺', name: 'Russia',                       nameHe: 'רוסיה',                    dial: '+7',   code: 'RU', maxDigits: 10 },
  { flag: '🇷🇼', name: 'Rwanda',                       nameHe: 'רואנדה',                   dial: '+250', code: 'RW', maxDigits: 9  },
  { flag: '🇰🇳', name: 'Saint Kitts and Nevis',        nameHe: 'סנט קיטס ונוויס',          dial: '+1869',code: 'KN', maxDigits: 7  },
  { flag: '🇱🇨', name: 'Saint Lucia',                  nameHe: 'סנט לוסיה',                dial: '+1758',code: 'LC', maxDigits: 7  },
  { flag: '🇻🇨', name: 'Saint Vincent and the Grenadines', nameHe: 'סנט וינסנט והגרנדינים', dial: '+1784',code: 'VC', maxDigits: 7  },
  { flag: '🇼🇸', name: 'Samoa',                        nameHe: 'סמואה',                    dial: '+685', code: 'WS', maxDigits: 7  },
  { flag: '🇸🇲', name: 'San Marino',                   nameHe: 'סן מרינו',                 dial: '+378', code: 'SM', maxDigits: 10 },
  { flag: '🇸🇹', name: 'São Tomé and Príncipe',        nameHe: 'סאו טומה ופרינסיפה',       dial: '+239', code: 'ST', maxDigits: 7  },
  { flag: '🇸🇦', name: 'Saudi Arabia',                 nameHe: 'ערב הסעודית',              dial: '+966', code: 'SA', maxDigits: 9  },
  { flag: '🇸🇳', name: 'Senegal',                      nameHe: 'סנגל',                     dial: '+221', code: 'SN', maxDigits: 9  },
  { flag: '🇷🇸', name: 'Serbia',                       nameHe: 'סרביה',                    dial: '+381', code: 'RS', maxDigits: 9  },
  { flag: '🇸🇨', name: 'Seychelles',                   nameHe: 'סיישל',                    dial: '+248', code: 'SC', maxDigits: 7  },
  { flag: '🇸🇱', name: 'Sierra Leone',                 nameHe: 'סיירה לאונה',              dial: '+232', code: 'SL', maxDigits: 8  },
  { flag: '🇸🇬', name: 'Singapore',                    nameHe: 'סינגפור',                  dial: '+65',  code: 'SG', maxDigits: 8  },
  { flag: '🇸🇰', name: 'Slovakia',                     nameHe: 'סלובקיה',                  dial: '+421', code: 'SK', maxDigits: 9  },
  { flag: '🇸🇮', name: 'Slovenia',                     nameHe: 'סלובניה',                  dial: '+386', code: 'SI', maxDigits: 8  },
  { flag: '🇸🇧', name: 'Solomon Islands',              nameHe: 'איי שלמה',                 dial: '+677', code: 'SB', maxDigits: 7  },
  { flag: '🇸🇴', name: 'Somalia',                      nameHe: 'סומליה',                   dial: '+252', code: 'SO', maxDigits: 9  },
  { flag: '🇿🇦', name: 'South Africa',                 nameHe: 'דרום אפריקה',              dial: '+27',  code: 'ZA', maxDigits: 9  },
  { flag: '🇸🇸', name: 'South Sudan',                  nameHe: 'דרום סודן',                dial: '+211', code: 'SS', maxDigits: 9  },
  { flag: '🇪🇸', name: 'Spain',                        nameHe: 'ספרד',                     dial: '+34',  code: 'ES', maxDigits: 9  },
  { flag: '🇱🇰', name: 'Sri Lanka',                    nameHe: 'סרי לנקה',                 dial: '+94',  code: 'LK', maxDigits: 9  },
  { flag: '🇸🇩', name: 'Sudan',                        nameHe: 'סודן',                     dial: '+249', code: 'SD', maxDigits: 9  },
  { flag: '🇸🇷', name: 'Suriname',                     nameHe: 'סורינאם',                  dial: '+597', code: 'SR', maxDigits: 7  },
  { flag: '🇸🇪', name: 'Sweden',                       nameHe: 'שוודיה',                   dial: '+46',  code: 'SE', maxDigits: 9  },
  { flag: '🇨🇭', name: 'Switzerland',                  nameHe: 'שוויץ',                    dial: '+41',  code: 'CH', maxDigits: 9  },
  { flag: '🇸🇾', name: 'Syria',                        nameHe: 'סוריה',                    dial: '+963', code: 'SY', maxDigits: 9  },
  { flag: '🇹🇼', name: 'Taiwan',                       nameHe: 'טייוואן',                  dial: '+886', code: 'TW', maxDigits: 9  },
  { flag: '🇹🇯', name: 'Tajikistan',                   nameHe: 'טג\'יקיסטן',               dial: '+992', code: 'TJ', maxDigits: 9  },
  { flag: '🇹🇿', name: 'Tanzania',                     nameHe: 'טנזניה',                   dial: '+255', code: 'TZ', maxDigits: 9  },
  { flag: '🇹🇭', name: 'Thailand',                     nameHe: 'תאילנד',                   dial: '+66',  code: 'TH', maxDigits: 9  },
  { flag: '🇹🇱', name: 'Timor-Leste',                  nameHe: 'טימור-לסטה',               dial: '+670', code: 'TL', maxDigits: 8  },
  { flag: '🇹🇬', name: 'Togo',                         nameHe: 'טוגו',                     dial: '+228', code: 'TG', maxDigits: 8  },
  { flag: '🇹🇴', name: 'Tonga',                        nameHe: 'טונגה',                    dial: '+676', code: 'TO', maxDigits: 7  },
  { flag: '🇹🇹', name: 'Trinidad and Tobago',          nameHe: 'טרינידד וטובגו',           dial: '+1868',code: 'TT', maxDigits: 7  },
  { flag: '🇹🇳', name: 'Tunisia',                      nameHe: 'תוניסיה',                  dial: '+216', code: 'TN', maxDigits: 8  },
  { flag: '🇹🇷', name: 'Turkey',                       nameHe: 'טורקיה',                   dial: '+90',  code: 'TR', maxDigits: 10 },
  { flag: '🇹🇲', name: 'Turkmenistan',                 nameHe: 'טורקמניסטן',               dial: '+993', code: 'TM', maxDigits: 8  },
  { flag: '🇹🇻', name: 'Tuvalu',                       nameHe: 'טובאלו',                   dial: '+688', code: 'TV', maxDigits: 6  },
  { flag: '🇺🇬', name: 'Uganda',                       nameHe: 'אוגנדה',                   dial: '+256', code: 'UG', maxDigits: 9  },
  { flag: '🇺🇦', name: 'Ukraine',                      nameHe: 'אוקראינה',                 dial: '+380', code: 'UA', maxDigits: 9  },
  { flag: '🇦🇪', name: 'United Arab Emirates',         nameHe: 'איחוד האמירויות',          dial: '+971', code: 'AE', maxDigits: 9  },
  { flag: '🇬🇧', name: 'United Kingdom',               nameHe: 'בריטניה',                  dial: '+44',  code: 'GB', maxDigits: 10 },
  { flag: '🇺🇸', name: 'United States',                nameHe: 'ארה"ב',                    dial: '+1',   code: 'US', maxDigits: 10 },
  { flag: '🇺🇾', name: 'Uruguay',                      nameHe: 'אורוגוואי',                dial: '+598', code: 'UY', maxDigits: 9  },
  { flag: '🇺🇿', name: 'Uzbekistan',                   nameHe: 'אוזבקיסטן',                dial: '+998', code: 'UZ', maxDigits: 9  },
  { flag: '🇻🇺', name: 'Vanuatu',                      nameHe: 'ונואטו',                   dial: '+678', code: 'VU', maxDigits: 7  },
  { flag: '🇻🇦', name: 'Vatican City',                 nameHe: 'הוותיקן',                  dial: '+39',  code: 'VA', maxDigits: 10 },
  { flag: '🇻🇪', name: 'Venezuela',                    nameHe: 'ונצואלה',                  dial: '+58',  code: 'VE', maxDigits: 10 },
  { flag: '🇻🇳', name: 'Vietnam',                      nameHe: 'וייטנאם',                  dial: '+84',  code: 'VN', maxDigits: 10 },
  { flag: '🇾🇪', name: 'Yemen',                        nameHe: 'תימן',                     dial: '+967', code: 'YE', maxDigits: 9  },
  { flag: '🇿🇲', name: 'Zambia',                       nameHe: 'זמביה',                    dial: '+260', code: 'ZM', maxDigits: 9  },
  { flag: '🇿🇼', name: 'Zimbabwe',                     nameHe: 'זימבבווה',                 dial: '+263', code: 'ZW', maxDigits: 9  },
  // ── Palestinian Territory ───────────────────────────────────────────────────
  { flag: '🇵🇸', name: 'Palestine',                    nameHe: 'הרשות הפלסטינית',          dial: '+970', code: 'PS', maxDigits: 9  },
  // ── Territories / Special regions ──────────────────────────────────────────
  { flag: '🇭🇰', name: 'Hong Kong',                    nameHe: 'הונג קונג',                dial: '+852', code: 'HK', maxDigits: 8  },
  { flag: '🇲🇴', name: 'Macau',                        nameHe: 'מקאו',                     dial: '+853', code: 'MO', maxDigits: 8  },
  { flag: '🇵🇷', name: 'Puerto Rico',                  nameHe: 'פוארטו ריקו',              dial: '+1787',code: 'PR', maxDigits: 10 },
  { flag: '🇬🇮', name: 'Gibraltar',                    nameHe: 'גיברלטר',                  dial: '+350', code: 'GI', maxDigits: 8  },
  { flag: '🇫🇴', name: 'Faroe Islands',                nameHe: 'איי פארו',                 dial: '+298', code: 'FO', maxDigits: 6  },
  { flag: '🇬🇱', name: 'Greenland',                    nameHe: 'גרינלנד',                  dial: '+299', code: 'GL', maxDigits: 6  },
  { flag: '🇮🇲', name: 'Isle of Man',                  nameHe: 'האי מאן',                  dial: '+44',  code: 'IM', maxDigits: 10 },
  { flag: '🇯🇪', name: 'Jersey',                       nameHe: 'ג\'רזי',                   dial: '+44',  code: 'JE', maxDigits: 10 },
  { flag: '🇳🇨', name: 'New Caledonia',                nameHe: 'קלדוניה החדשה',            dial: '+687', code: 'NC', maxDigits: 6  },
  { flag: '🇵🇫', name: 'French Polynesia',             nameHe: 'פולינזיה הצרפתית',         dial: '+689', code: 'PF', maxDigits: 8  },
];

export function formatPhoneNumber(value: string, maxDigits = 10): string {
  const digits = value.replace(/\D/g, '').slice(0, maxDigits);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: boolean;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  isLoading?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  onKeyDown,
  placeholder = '050-000-0000',
  error = false,
  autoFocus = false,
  inputRef,
  isLoading = false,
}: PhoneInputProps) {
  const { language } = useLanguage();
  const isHe = language === 'he';

  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  // mounted = portal exists in DOM; visible = sheet is slid into view
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const openSheet = () => {
    setSearch('');
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setVisible(true);
      setTimeout(() => searchRef.current?.focus(), 320);
    }));
  };

  const closeSheet = () => {
    setVisible(false);
    setSearch('');
  };

  const handleTransitionEnd = () => {
    if (!visible) setMounted(false);
  };

  const handleSelect = (c: Country) => {
    setCountry(c);
    closeSheet();
    onChange('');
  };

  const countryFieldCls = 'flex items-center justify-center gap-1.5 rounded-2xl px-4 h-12 border bg-white transition-colors w-1/4 flex-shrink-0';
  const phoneFieldCls   = 'flex items-center rounded-2xl px-4 h-12 border bg-white transition-colors flex-1 min-w-0 overflow-hidden';

  // ── Country field ──────────────────────────────────────────────────────────
  const countryField = (
    <button
      type="button"
      onClick={openSheet}
      className={`${countryFieldCls} border-border active:scale-95 transition-transform`}
    >
      <span className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ fontSize: '18px', lineHeight: 1 }}>{country.flag}</span>
      <span className="text-xs font-semibold text-text-primary" dir="ltr">{country.dial}</span>
      <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '14px' }}>
        keyboard_arrow_down
      </span>
    </button>
  );

  // ── Phone field ────────────────────────────────────────────────────────────
  const phoneField = (
    <div className={`${phoneFieldCls} ${error ? 'border-error' : 'border-border focus-within:border-primary'}`}>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(formatPhoneNumber(e.target.value, country.maxDigits))}
        onKeyDown={onKeyDown}
        autoComplete="tel-national"
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted min-w-0"
        dir="ltr"
        autoFocus={autoFocus}
      />
      {isLoading && (
        <span className="material-symbols-outlined text-primary animate-spin flex-shrink-0 ms-1" style={{ fontSize: '18px' }}>
          progress_activity
        </span>
      )}
    </div>
  );

  return (
    <>
      {/* ── Two equal fields side by side ── */}
      {/* dir="ltr" so flex order is always left→right regardless of page RTL */}
      <div className="flex items-center gap-2" dir="ltr">
        {countryField}
        {phoneField}
      </div>

      {/* ── Bottom sheet (portal to body so it overlays everything) ── */}
      {mounted && createPortal(
        <div dir={isHe ? 'rtl' : 'ltr'}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 z-[201] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300"
            style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
            onTransitionEnd={handleTransitionEnd}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Title */}
            <div className="px-5 py-3 border-b border-border">
              <p className="text-sm font-bold text-text-primary">
                {isHe ? 'בחר מדינה' : 'Select country'}
              </p>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2 bg-surface rounded-2xl px-3 h-10">
                <span className="material-symbols-outlined text-text-muted flex-shrink-0" style={{ fontSize: '18px' }}>
                  search
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isHe ? 'חיפוש מדינה...' : 'Search country...'}
                  className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
                />
                {search.length > 0 && (
                  <button type="button" onClick={() => setSearch('')} className="flex-shrink-0">
                    <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>
                      close
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Country list */}
            <div className="overflow-y-auto" style={{ maxHeight: '45vh' }}>
              {COUNTRIES.filter((c) => {
                const q = search.toLowerCase();
                return !q || c.name.toLowerCase().includes(q) || c.nameHe.includes(q) || c.dial.includes(q);
              }).map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors active:bg-surface ${
                    c.code === country.code ? 'bg-primary/5' : ''
                  }`}
                >
                  <span className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ fontSize: '24px', lineHeight: 1 }}>{c.flag}</span>
                  <span className={`flex-1 text-start font-medium ${c.code === country.code ? 'text-primary' : 'text-text-primary'}`}>
                    {isHe ? c.nameHe : c.name}
                  </span>
                  <span className="text-xs text-text-muted font-medium flex-shrink-0" dir="ltr">{c.dial}</span>
                  {c.code === country.code && (
                    <span className="material-symbols-outlined text-primary flex-shrink-0" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  )}
                </button>
              ))}

              {/* No results */}
              {COUNTRIES.filter((c) => {
                const q = search.toLowerCase();
                return !q || c.name.toLowerCase().includes(q) || c.nameHe.includes(q) || c.dial.includes(q);
              }).length === 0 && (
                <p className="text-center text-sm text-text-muted py-8">
                  {isHe ? 'לא נמצאו תוצאות' : 'No results found'}
                </p>
              )}
            </div>

            {/* Safe area bottom padding */}
            <div className="h-8" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
