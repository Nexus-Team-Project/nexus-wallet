import type { Branch } from '../../types/branch.types';

export const mockBranches: Branch[] = [
  // ── McDonald's (biz_001) ── 4 branches (most open late)
  {
    id: 'br_001', businessId: 'biz_001',
    name: "McDonald's Dizengoff Center", nameHe: 'מקדונלדס דיזנגוף סנטר',
    address: '50 Dizengoff St, Tel Aviv', addressHe: 'דיזנגוף 50, תל אביב',
    lat: 32.0755, lng: 34.7747,
    openHour: 8, closeHour: 1,
  },
  {
    id: 'br_002', businessId: 'biz_001',
    name: "McDonald's Azrieli", nameHe: 'מקדונלדס עזריאלי',
    address: '132 Menachem Begin Rd, Tel Aviv', addressHe: 'מנחם בגין 132, תל אביב',
    lat: 32.0741, lng: 34.7922,
    openHour: 7, closeHour: 23,
  },
  {
    id: 'br_003', businessId: 'biz_001',
    name: "McDonald's Ramat Aviv", nameHe: 'מקדונלדס רמת אביב',
    address: '40 Einstein St, Tel Aviv', addressHe: 'איינשטיין 40, תל אביב',
    lat: 32.1133, lng: 34.8044,
    openHour: 9, closeHour: 23,
  },
  {
    id: 'br_004', businessId: 'biz_001',
    name: "McDonald's Florentin", nameHe: 'מקדונלדס פלורנטין',
    address: '2 Vital St, Tel Aviv', addressHe: 'ויטל 2, תל אביב',
    lat: 32.0614, lng: 34.7721,
    openHour: 10, closeHour: 2,
  },

  // ── Castro (biz_002) ── 3 branches (retail hours)
  {
    id: 'br_005', businessId: 'biz_002',
    name: 'Castro Dizengoff Center', nameHe: 'קסטרו דיזנגוף סנטר',
    address: '50 Dizengoff St, Tel Aviv', addressHe: 'דיזנגוף 50, תל אביב',
    lat: 32.0758, lng: 34.7744,
    openHour: 9, closeHour: 21,
  },
  {
    id: 'br_006', businessId: 'biz_002',
    name: 'Castro Azrieli Mall', nameHe: 'קסטרו עזריאלי',
    address: '132 Menachem Begin Rd, Tel Aviv', addressHe: 'מנחם בגין 132, תל אביב',
    lat: 32.0745, lng: 34.7918,
    openHour: 9, closeHour: 22,
  },
  {
    id: 'br_007', businessId: 'biz_002',
    name: 'Castro Ramat Aviv Mall', nameHe: 'קסטרו קניון רמת אביב',
    address: '40 Einstein St, Tel Aviv', addressHe: 'איינשטיין 40, תל אביב',
    lat: 32.1136, lng: 34.8040,
    openHour: 9, closeHour: 21,
  },

  // ── Cinema City (biz_003) ── 3 branches (afternoon/evening)
  {
    id: 'br_008', businessId: 'biz_003',
    name: 'Cinema City Glilot', nameHe: 'סינמה סיטי גלילות',
    address: 'Glilot Junction, Ramat HaSharon', addressHe: 'צומת גלילות, רמת השרון',
    lat: 32.1480, lng: 34.8091,
    openHour: 11, closeHour: 1,
  },
  {
    id: 'br_009', businessId: 'biz_003',
    name: 'Cinema City Rishon LeZion', nameHe: 'סינמה סיטי ראשון לציון',
    address: 'Millennium Park, Rishon LeZion', addressHe: 'פארק מילניום, ראשון לציון',
    lat: 31.9730, lng: 34.7706,
    openHour: 11, closeHour: 0,
  },
  {
    id: 'br_010', businessId: 'biz_003',
    name: 'Cinema City Ramat HaSharon', nameHe: 'סינמה סיטי רמת השרון',
    address: '6 HaBarzel St, Ramat HaSharon', addressHe: 'הברזל 6, רמת השרון',
    lat: 32.1456, lng: 34.8120,
    openHour: 12, closeHour: 23,
  },

  // ── Aroma (biz_004) ── 5 branches (cafés open early)
  {
    id: 'br_011', businessId: 'biz_004',
    name: 'Aroma Rothschild', nameHe: 'ארומה רוטשילד',
    address: '42 Rothschild Blvd, Tel Aviv', addressHe: 'רוטשילד 42, תל אביב',
    lat: 32.0636, lng: 34.7748,
    openHour: 6, closeHour: 22,
  },
  {
    id: 'br_012', businessId: 'biz_004',
    name: 'Aroma Ibn Gabirol', nameHe: 'ארומה אבן גבירול',
    address: '71 Ibn Gabirol St, Tel Aviv', addressHe: 'אבן גבירול 71, תל אביב',
    lat: 32.0805, lng: 34.7822,
    openHour: 6, closeHour: 23,
  },
  {
    id: 'br_013', businessId: 'biz_004',
    name: 'Aroma Sarona', nameHe: 'ארומה שרונה',
    address: 'Sarona Market, Tel Aviv', addressHe: 'שרונה מרקט, תל אביב',
    lat: 32.0722, lng: 34.7870,
    openHour: 7, closeHour: 22,
  },
  {
    id: 'br_014', businessId: 'biz_004',
    name: 'Aroma Rabin Square', nameHe: 'ארומה כיכר רבין',
    address: 'Rabin Square, Tel Aviv', addressHe: 'כיכר רבין, תל אביב',
    lat: 32.0810, lng: 34.7810,
    openHour: 7, closeHour: 21,
  },
  {
    id: 'br_015', businessId: 'biz_004',
    name: 'Aroma Neve Tzedek', nameHe: 'ארומה נווה צדק',
    address: '10 Shabazi St, Tel Aviv', addressHe: 'שבזי 10, תל אביב',
    lat: 32.0604, lng: 34.7685,
    openHour: 7, closeHour: 20,
  },

  // ── Isrotel (biz_005) ── 3 branches (24h hotels)
  {
    id: 'br_016', businessId: 'biz_005',
    name: 'Isrotel Royal Beach', nameHe: "ישרוטל רויאל ביץ'",
    address: 'Herbert Samuel St, Tel Aviv', addressHe: 'הרברט סמואל, תל אביב',
    lat: 32.0683, lng: 34.7641,
    // no openHour/closeHour = always open (24h hotel)
  },
  {
    id: 'br_017', businessId: 'biz_005',
    name: 'Isrotel Tower', nameHe: 'ישרוטל טאואר',
    address: '78 HaYarkon St, Tel Aviv', addressHe: 'הירקון 78, תל אביב',
    lat: 32.0745, lng: 34.7660,
  },
  {
    id: 'br_018', businessId: 'biz_005',
    name: 'Isrotel Sport Club', nameHe: 'ישרוטל ספורט קלאב',
    address: '268 HaYarkon St, Tel Aviv', addressHe: 'הירקון 268, תל אביב',
    lat: 32.0930, lng: 34.7735,
  },

  // ── Superpharm (biz_006) ── 4 branches
  {
    id: 'br_019', businessId: 'biz_006',
    name: 'Superpharm Dizengoff', nameHe: 'סופרפארם דיזנגוף',
    address: '99 Dizengoff St, Tel Aviv', addressHe: 'דיזנגוף 99, תל אביב',
    lat: 32.0793, lng: 34.7740,
    openHour: 8, closeHour: 22,
  },
  {
    id: 'br_020', businessId: 'biz_006',
    name: 'Superpharm Allenby', nameHe: 'סופרפארם אלנבי',
    address: '30 Allenby St, Tel Aviv', addressHe: 'אלנבי 30, תל אביב',
    lat: 32.0676, lng: 34.7702,
    openHour: 8, closeHour: 21,
  },
  {
    id: 'br_021', businessId: 'biz_006',
    name: 'Superpharm Sarona', nameHe: 'סופרפארם שרונה',
    address: 'Sarona Market, Tel Aviv', addressHe: 'שרונה מרקט, תל אביב',
    lat: 32.0718, lng: 34.7874,
    openHour: 9, closeHour: 22,
  },
  {
    id: 'br_022', businessId: 'biz_006',
    name: 'Superpharm Ramat Aviv', nameHe: 'סופרפארם רמת אביב',
    address: '40 Einstein St, Tel Aviv', addressHe: 'איינשטיין 40, תל אביב',
    lat: 32.1130, lng: 34.8048,
    openHour: 9, closeHour: 21,
  },

  // ── KSP (biz_007) ── 3 branches (tech retail)
  {
    id: 'br_023', businessId: 'biz_007',
    name: 'KSP Azrieli', nameHe: 'KSP עזריאלי',
    address: '132 Menachem Begin Rd, Tel Aviv', addressHe: 'מנחם בגין 132, תל אביב',
    lat: 32.0738, lng: 34.7925,
    openHour: 9, closeHour: 21,
  },
  {
    id: 'br_024', businessId: 'biz_007',
    name: 'KSP Ramat Aviv', nameHe: 'KSP רמת אביב',
    address: '40 Einstein St, Tel Aviv', addressHe: 'איינשטיין 40, תל אביב',
    lat: 32.1140, lng: 34.8035,
    openHour: 10, closeHour: 20,
  },
  {
    id: 'br_025', businessId: 'biz_007',
    name: 'KSP Bnei Brak', nameHe: 'KSP בני ברק',
    address: "1 Jabotinsky St, Bnei Brak", addressHe: "ז'בוטינסקי 1, בני ברק",
    lat: 32.0893, lng: 34.8340,
    openHour: 9, closeHour: 19,
  },

  // ── Holmes Place (biz_008) ── 3 branches (gym hours)
  {
    id: 'br_026', businessId: 'biz_008',
    name: 'Holmes Place Dizengoff', nameHe: 'הולמס פלייס דיזנגוף',
    address: '50 Dizengoff St, Tel Aviv', addressHe: 'דיזנגוף 50, תל אביב',
    lat: 32.0750, lng: 34.7750,
    openHour: 6, closeHour: 23,
  },
  {
    id: 'br_027', businessId: 'biz_008',
    name: 'Holmes Place Sarona', nameHe: 'הולמס פלייס שרונה',
    address: 'Sarona Market, Tel Aviv', addressHe: 'שרונה מרקט, תל אביב',
    lat: 32.0715, lng: 34.7878,
    openHour: 6, closeHour: 22,
  },
  {
    id: 'br_028', businessId: 'biz_008',
    name: 'Holmes Place Herzeliya', nameHe: 'הולמס פלייס הרצליה',
    address: 'Arena Mall, Herzeliya', addressHe: 'קניון ארנה, הרצליה',
    lat: 32.1629, lng: 34.7986,
    openHour: 6, closeHour: 22,
  },

  // ── Shufersal (biz_009) ── 4 branches (supermarket hours)
  {
    id: 'br_029', businessId: 'biz_009',
    name: 'Shufersal Deal Bograshov', nameHe: 'שופרסל דיל בוגרשוב',
    address: '22 Bograshov St, Tel Aviv', addressHe: 'בוגרשוב 22, תל אביב',
    lat: 32.0735, lng: 34.7715,
    openHour: 7, closeHour: 23,
  },
  {
    id: 'br_030', businessId: 'biz_009',
    name: 'Shufersal Sheli Basel', nameHe: 'שופרסל שלי באין',
    address: '18 Basel St, Tel Aviv', addressHe: 'באין 18, תל אביב',
    lat: 32.0885, lng: 34.7792,
    openHour: 7, closeHour: 22,
  },
  {
    id: 'br_031', businessId: 'biz_009',
    name: 'Shufersal Online TLV', nameHe: 'שופרסל אונליין ת"א',
    address: '5 HaHarash St, Tel Aviv', addressHe: 'החרש 5, תל אביב',
    lat: 32.0560, lng: 34.7905,
    openHour: 8, closeHour: 20,
  },
  {
    id: 'br_032', businessId: 'biz_009',
    name: 'Shufersal Express Florentin', nameHe: 'שופרסל אקספרס פלורנטין',
    address: '15 Florentin St, Tel Aviv', addressHe: 'פלורנטין 15, תל אביב',
    lat: 32.0590, lng: 34.7720,
    openHour: 7, closeHour: 0,
  },

  // ── H&M (biz_010) ── 3 branches (retail hours)
  {
    id: 'br_033', businessId: 'biz_010',
    name: 'H&M Dizengoff Center', nameHe: 'H&M דיזנגוף סנטר',
    address: '50 Dizengoff St, Tel Aviv', addressHe: 'דיזנגוף 50, תל אביב',
    lat: 32.0760, lng: 34.7742,
    openHour: 9, closeHour: 21,
  },
  {
    id: 'br_034', businessId: 'biz_010',
    name: 'H&M Azrieli Mall', nameHe: 'H&M עזריאלי',
    address: '132 Menachem Begin Rd, Tel Aviv', addressHe: 'מנחם בגין 132, תל אביב',
    lat: 32.0740, lng: 34.7920,
    openHour: 9, closeHour: 22,
  },
  {
    id: 'br_035', businessId: 'biz_010',
    name: 'H&M TLV Fashion Mall', nameHe: 'H&M קניון האופנה ת"א',
    address: '6 Shaul Hamelech Blvd, Tel Aviv', addressHe: 'שאול המלך 6, תל אביב',
    lat: 32.0775, lng: 34.7865,
    openHour: 10, closeHour: 21,
  },
];
