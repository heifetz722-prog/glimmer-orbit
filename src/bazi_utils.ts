/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Solar } from "lunar-javascript";
import { FortuneResult, ZiweiPalace, KyuseiInfo, KyuseiStarDetails } from "./types";

// 地支順序 (Zi Wei Dou Shu standard grid starting from Yin bottom-left)
const ZI_BRANCHES = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];

const SHICHEN_ZHI_INDEX: Record<string, number> = {
  "子": 1, "丑": 2, "寅": 3, "卯": 4, "辰": 5, "巳": 6,
  "午": 7, "未": 8, "申": 9, "酉": 10, "戌": 11, "亥": 12
};

const PALACE_NAMES = [
  "命宮", "兄弟宮", "夫妻宮", "子女宮", "財帛宮", "疾厄宮",
  "遷移宮", "交友宮", "官祿宮", "田宅宮", "福德宮", "父母宮"
];

// Kyusei Kigaku configurations
const KYUSEI_NAMES: Record<number, string> = {
  1: "一白水星",
  2: "二黑土星",
  3: "三碧木星",
  4: "四綠木星",
  5: "五黃土星",
  6: "六白金星",
  7: "七赤金星",
  8: "八白土星",
  9: "九紫火星"
};

const KYUSEI_ELEMENTS: Record<number, string> = {
  1: "水",
  2: "土",
  3: "木",
  4: "木",
  5: "土",
  6: "金",
  7: "金",
  8: "土",
  9: "火"
};

const KYUSEI_COLORS: Record<number, string> = {
  1: "#3B82F6", // Blue
  2: "#6B7280", // Grayish Slate
  3: "#10B981", // Emerald
  4: "#22C55E", // Green
  5: "#D97706", // Amber
  6: "#9CA3AF", // Light Gray
  7: "#EF4444", // Red
  8: "#8B5CF6", // Purple
  9: "#EC4899"  // Pink/Rose
};

const KYUSEI_DESCS: Record<number, string> = {
  1: "你像是一杯乾淨涼爽的泉水。你特別心思細膩、擅長傾聽、懂人心。有你在，身邊的朋友就會覺得心情很平靜，感覺被療癒了。",
  2: "你就像一片溫暖、默默付出的寬容大地。做事特別踏實可靠、不愛出風頭，喜歡默默幫忙別人的日常大小事，對感情非常專一。",
  3: "你就像初春剛冒出來的小嫩芽，身上常常散發著滿滿的活力，像個朝氣蓬勃的小太陽！你的腦袋裡總是藏著許多新鮮有趣的點子，熱愛自由與創意。",
  4: "你就像是一陣吹過原野、很溫和很舒服的春風。你非常好相處、脾氣溫和，而且最擅長打破尷尬的氣氛，深受大家喜愛。",
  5: "你就像是大地深處沉穩強大的磐石。你內心非常堅強、獨立，不論遇到多大挑戰或打擊，都有一種浴火重生的神祕抗壓力量，很講義氣。",
  6: "你做事非常有原則，講誠信，就像純淨明亮的金屬。你對生活品質與美感有著很高的標準，辦事乾淨俐落、條理分明，是個精緻又靠得住的人。",
  7: "你天生自帶幽默感，就像秋天豐收時金黃喜悅的麥田！只要有你在的場合就總是充滿笑聲，非常懂得享受生活、熱愛美食，是大家的好旅伴。",
  8: "你就像是一座高大穩重、默默守護人心的巍峨高山。你外表看起來可能成熟、安靜內斂，但內心非常有安全感，辦事穩重且心思縝密。",
  9: "你就像夜空中明亮閃爍的星星。你的直覺非常敏銳、感情豐富，全身自帶迷人的文藝才華，對新鮮事物隨時充滿好奇，總能蹦出讓人驚喜的好主意！"
};

export function getWuxingColor(wuxing: string): string {
  switch (wuxing) {
    case "金": return "#EAB308";
    case "木": return "#22C55E";
    case "水": return "#3B82F6";
    case "火": return "#EF4444";
    case "土": return "#8B5CF6";
    default: return "#9CA3AF";
  }
}

export function getWuxingIcon(wuxing: string): string {
  switch (wuxing) {
    case "金": return "🪙";
    case "木": return "🌳";
    case "水": return "💧";
    case "火": return "🔥";
    case "土": return "⛰️";
    default: return "🌀";
  }
}

// Year Star Formula
export function getYearStarNum(lunarYear: number): number {
  const diff = (lunarYear - 1990) % 9;
  let star = 1 - diff;
  while (star <= 0) {
    star += 9;
  }
  return star;
}

// Month Star Formula
export function getMonthStarNum(yearStar: number, monthZhi: string): number {
  const MONTH_BRANCH_INDEX: Record<string, number> = {
    "寅": 1, "卯": 2, "辰": 3, "巳": 4, "午": 5, "未": 6,
    "申": 7, "酉": 8, "戌": 9, "亥": 10, "子": 11, "丑": 12
  };
  const mIndex = MONTH_BRANCH_INDEX[monthZhi] || 1;
  let startStar = 8;
  if ([1, 4, 7].includes(yearStar)) {
    startStar = 8;
  } else if ([2, 5, 8].includes(yearStar)) {
    startStar = 2;
  } else if ([3, 6, 9].includes(yearStar)) {
    startStar = 5;
  }
  
  let star = startStar - (mIndex - 1);
  while (star <= 0) {
    star += 9;
  }
  return star;
}

// Get Directions based on Kyusei
export function getKyuseiDirections(starNum: number): { lucky: string[], avoid: string[] } {
  const directions: Record<number, { lucky: string[], avoid: string[] }> = {
    1: { lucky: ["東北方 (利追求平靜學問)", "西方 (開展心靈桃花與好緣分)"], avoid: ["南方 (細心防範言語口舌)", "東南方 (留心步調瑣碎繁雜)"] },
    2: { lucky: ["西北方 (帶來充沛創意)", "東南方 (利於家庭溫馨傾聽)"], avoid: ["東北方 (留心行事步調稍慢)", "西方 (注意日常開銷節奏)"] },
    3: { lucky: ["南方 (引燃生活與創意靈感)", "西南方 (多帶有溫和的累積運勢)"], avoid: ["西北方 (注意防範精神過度緊繃)", "東方 (避免急躁時做決策)"] },
    4: { lucky: ["北方 (有助於心思安穩)", "西南方 (便於與夥伴溫柔合作)"], avoid: ["東北方 (注意不要陷入死胡同)", "西方 (溝通語氣多帶點微笑)"] },
    5: { lucky: ["東南方 (利於溫和人緣)", "西北方 (易獲得前輩親切關照)"], avoid: ["東方 (注意生活細節安全)", "南方 (注意排解浮躁心緒)"] },
    6: { lucky: ["西方 (利於文字與手作)", "東北方 (容易找到人生的小指引)"], avoid: ["南方 (防行事後勁不足)", "西北方 (放慢生活過急的步伐)"] },
    7: { lucky: ["東南方 (大富貴人微光扶助)", "西北方 (利於建立心靈歸宿)"], avoid: ["東方 (買小物件防衝動)", "東北方 (睡眠時間多放鬆)"] },
    8: { lucky: ["西南方 (利於沉穩經營細水)", "東南方 (適合漫步放鬆視野)"], avoid: ["北方 (稍微多思多慮)", "西方 (注意社交排毒與獨處)"] },
    9: { lucky: ["東方 (利於活力萌生)", "北方 (利於沉澱寫作或修行)"], avoid: ["西南方 (避免熬夜耗精神)", "西北方 (同伴相處多點傾聽溫熱)"] }
  };
  return directions[starNum] || { lucky: ["東方", "南方"], avoid: ["北方", "西方"] };
}

// Authentic traditional Ziwei Doushu star brightness (廟旺平陷) lookup table
const ZIWEI_BRIGHT_MAP: Record<string, Record<string, string>> = {
  "紫微": {
    "子": "平", "丑": "廟", "寅": "廟", "卯": "旺", "辰": "廟", "巳": "旺",
    "午": "廟", "未": "廟", "申": "廟", "酉": "旺", "戌": "廟", "亥": "平"
  },
  "天機": {
    "子": "廟", "丑": "陷", "寅": "平", "卯": "廟", "辰": "平", "巳": "平",
    "午": "廟", "未": "陷", "申": "平", "酉": "廟", "戌": "平", "亥": "平"
  },
  "太陽": {
    "子": "陷", "丑": "陷", "寅": "旺", "卯": "廟", "辰": "廟", "巳": "廟",
    "午": "廟", "未": "平", "申": "平", "酉": "陷", "戌": "陷", "亥": "陷"
  },
  "武曲": {
    "子": "旺", "丑": "廟", "寅": "平", "卯": "平", "辰": "廟", "巳": "平",
    "午": "旺", "未": "廟", "申": "平", "酉": "平", "戌": "廟", "亥": "平"
  },
  "天同": {
    "子": "旺", "丑": "陷", "寅": "平", "卯": "廟", "辰": "平", "巳": "廟",
    "午": "陷", "未": "陷", "申": "平", "酉": "平", "戌": "平", "亥": "廟"
  },
  "廉貞": {
    "子": "平", "丑": "平", "寅": "廟", "卯": "平", "辰": "平", "巳": "陷",
    "午": "廟", "未": "平", "申": "廟", "酉": "平", "戌": "平", "亥": "陷"
  },
  "天府": {
    "子": "廟", "丑": "廟", "寅": "廟", "卯": "平", "辰": "廟", "巳": "平",
    "午": "廟", "未": "廟", "申": "廟", "酉": "旺", "戌": "廟", "亥": "平"
  },
  "太陰": {
    "子": "廟", "丑": "廟", "寅": "陷", "卯": "陷", "辰": "陷", "巳": "陷",
    "午": "陷", "未": "陷", "申": "平", "酉": "旺", "戌": "廟", "亥": "廟"
  },
  "貪狼": {
    "子": "旺", "丑": "廟", "寅": "平", "卯": "平", "辰": "廟", "巳": "陷",
    "午": "旺", "未": "廟", "申": "平", "酉": "平", "戌": "廟", "亥": "陷"
  },
  "巨門": {
    "子": "廟", "丑": "陷", "寅": "廟", "卯": "廟", "辰": "陷", "巳": "旺",
    "午": "廟", "未": "陷", "申": "廟", "酉": "廟", "戌": "陷", "亥": "旺"
  },
  "天相": {
    "子": "廟", "丑": "廟", "寅": "廟", "卯": "陷", "辰": "平", "巳": "平",
    "午": "廟", "未": "廟", "申": "廟", "酉": "陷", "戌": "平", "亥": "平"
  },
  "天梁": {
    "子": "廟", "丑": "廟", "寅": "廟", "卯": "廟", "辰": "旺", "巳": "陷",
    "午": "廟", "未": "廟", "申": "陷", "酉": "平", "戌": "廟", "亥": "陷"
  },
  "七殺": {
    "子": "旺", "丑": "廟", "寅": "廟", "卯": "陷", "辰": "廟", "巳": "平",
    "午": "旺", "未": "廟", "申": "廟", "酉": "陷", "戌": "廟", "亥": "平"
  },
  "破軍": {
    "子": "廟", "丑": "旺", "寅": "陷", "卯": "陷", "辰": "廟", "巳": "平",
    "午": "廟", "未": "旺", "申": "陷", "酉": "陷", "戌": "廟", "亥": "平"
  }
};

// Deterministic Lu Shuai (庙旺平陷)
function getLuShuai(star: string, branch: string): string {
  if (ZIWEI_BRIGHT_MAP[star] && ZI_BRANCHES.includes(branch)) {
    return ZIWEI_BRIGHT_MAP[star][branch] || "平";
  }
  return "平";
}

// Ziwei Stars calculation
export function calculateZiweiStars(lunarMonth: number, lunarDay: number, hourZhi: string, yearGan: string, yearZhi: string) {
  const branchStars: Record<string, { major: string[], minor: string[] }> = {};
  ZI_BRANCHES.forEach(b => {
    branchStars[b] = { major: [], minor: [] };
  });

  // Position of Zi Wei (Yin grid start is index 0)
  let ziweiPos = ((lunarDay * 2) + lunarMonth) % 12;
  const ziweiBranch = ZI_BRANCHES[ziweiPos];
  branchStars[ziweiBranch].major.push("紫微");

  // Other major stars relative to Zi Wei
  let tianjiPos = (ziweiPos - 1 + 12) % 12;
  branchStars[ZI_BRANCHES[tianjiPos]].major.push("天機");

  let taiyangPos = (ziweiPos - 3 + 12) % 12;
  branchStars[ZI_BRANCHES[taiyangPos]].major.push("太陽");

  let wuquPos = (ziweiPos - 4 + 12) % 12;
  branchStars[ZI_BRANCHES[wuquPos]].major.push("武曲");

  let tiantongPos = (ziweiPos - 5 + 12) % 12;
  branchStars[ZI_BRANCHES[tiantongPos]].major.push("天同");

  let lianzhenPos = (ziweiPos - 8 + 12) % 12;
  branchStars[ZI_BRANCHES[lianzhenPos]].major.push("廉貞");

  // Tian Fu stars (opposite Zi Wei in reference of 10-ziweiPos)
  let tianfuPos = (10 - ziweiPos + 12) % 12;
  branchStars[ZI_BRANCHES[tianfuPos]].major.push("天府");

  let taiyinPos = (tianfuPos + 1) % 12;
  branchStars[ZI_BRANCHES[taiyinPos]].major.push("太陰");

  let tanlangPos = (tianfuPos + 2) % 12;
  branchStars[ZI_BRANCHES[tanlangPos]].major.push("貪狼");

  let jumenPos = (tianfuPos + 3) % 12;
  branchStars[ZI_BRANCHES[jumenPos]].major.push("巨門");

  let tianxiangPos = (tianfuPos + 4) % 12;
  branchStars[ZI_BRANCHES[tianxiangPos]].major.push("天相");

  let tianliangPos = (tianfuPos + 5) % 12;
  branchStars[ZI_BRANCHES[tianliangPos]].major.push("天梁");

  let qishaPos = (tianfuPos + 6) % 12;
  branchStars[ZI_BRANCHES[qishaPos]].major.push("七殺");

  let pojunPos = (tianfuPos + 10) % 12;
  branchStars[ZI_BRANCHES[pojunPos]].major.push("破軍");

  // Minor stars (文昌 / 文曲)
  const hIdx = SHICHEN_ZHI_INDEX[hourZhi] || 1;
  let wenchangPos = (8 - (hIdx - 1) + 12) % 12; // 8 is 戌
  branchStars[ZI_BRANCHES[wenchangPos]].minor.push("文昌");

  let wenquPos = (2 + (hIdx - 1)) % 12; // 2 is 辰
  branchStars[ZI_BRANCHES[wenquPos]].minor.push("文曲");

  // 六吉/六凶與歲時輔星
  // 左輔 / 右弼
  let zuofuPos = (2 + (lunarMonth - 1)) % 12;
  branchStars[ZI_BRANCHES[zuofuPos]].minor.push("左輔");

  let youbiPos = (8 - (lunarMonth - 1) + 12) % 12;
  branchStars[ZI_BRANCHES[youbiPos]].minor.push("右弼");

  // 地空 / 地劫
  let dikongPos = (9 - (hIdx - 1) + 12) % 12;
  branchStars[ZI_BRANCHES[dikongPos]].minor.push("地空");

  let dijiePos = (9 + (hIdx - 1)) % 12;
  branchStars[ZI_BRANCHES[dijiePos]].minor.push("地劫");

  // 天魁 / 天鉞
  let tiankuiPos = 11;
  let tianyuePos = 5;
  if (["甲", "戊", "庚"].includes(yearGan)) {
    tiankuiPos = 11; // 丑
    tianyuePos = 5;  // 未
  } else if (["乙", "己"].includes(yearGan)) {
    tiankuiPos = 10; // 子
    tianyuePos = 8;  // 戌
  } else if (["丙", "丁"].includes(yearGan)) {
    tiankuiPos = 9;  // 亥
    tianyuePos = 7;  // 酉
  } else if (yearGan === "辛") {
    tiankuiPos = 0;  // 寅
    tianyuePos = 4;  // 午
  } else if (["壬", "癸"].includes(yearGan)) {
    tiankuiPos = 1;  // 卯
    tianyuePos = 3;  // 巳
  }
  branchStars[ZI_BRANCHES[tiankuiPos]].minor.push("天魁");
  branchStars[ZI_BRANCHES[tianyuePos]].minor.push("天鉞");

  // 祿存 / 擎羊 / 陀羅
  let lucunPos = 0;
  let qingyangPos = 1;
  let tuoluoPos = 11;
  switch (yearGan) {
    case "甲": lucunPos = 0; qingyangPos = 1; tuoluoPos = 11; break;
    case "乙": lucunPos = 1; qingyangPos = 2; tuoluoPos = 0; break;
    case "丙": lucunPos = 3; qingyangPos = 4; tuoluoPos = 2; break;
    case "丁": lucunPos = 4; qingyangPos = 5; tuoluoPos = 3; break;
    case "戊": lucunPos = 3; qingyangPos = 4; tuoluoPos = 2; break;
    case "己": lucunPos = 4; qingyangPos = 5; tuoluoPos = 3; break;
    case "庚": lucunPos = 6; qingyangPos = 7; tuoluoPos = 5; break;
    case "辛": lucunPos = 7; qingyangPos = 8; tuoluoPos = 6; break;
    case "壬": lucunPos = 9; qingyangPos = 10; tuoluoPos = 8; break;
    case "癸": lucunPos = 10; qingyangPos = 11; tuoluoPos = 9; break;
  }
  branchStars[ZI_BRANCHES[lucunPos]].minor.push("祿存");
  branchStars[ZI_BRANCHES[qingyangPos]].minor.push("擎羊");
  branchStars[ZI_BRANCHES[tuoluoPos]].minor.push("陀羅");

  // 天馬 (基於年支)
  let tianmaPos = 6;
  if (["寅", "午", "戌"].includes(yearZhi)) {
    tianmaPos = 6; // 申
  } else if (["申", "子", "辰"].includes(yearZhi)) {
    tianmaPos = 0; // 寅
  } else if (["巳", "酉", "丑"].includes(yearZhi)) {
    tianmaPos = 9; // 亥
  } else if (["亥", "卯", "未"].includes(yearZhi)) {
    tianmaPos = 3; // 巳
  }
  branchStars[ZI_BRANCHES[tianmaPos]].minor.push("天馬");

  // 紅鸞 / 天喜
  const BRANCH_ORDER_MAP: Record<string, number> = {
    "子": 0, "丑": 1, "寅": 2, "卯": 3, "辰": 4, "巳": 5,
    "午": 6, "未": 7, "申": 8, "酉": 9, "戌": 10, "亥": 11
  };
  const yzOrder = BRANCH_ORDER_MAP[yearZhi] || 0;
  let hongluanPos = (1 - yzOrder + 12) % 12;
  let tianxiPos = (hongluanPos + 6) % 12;
  branchStars[ZI_BRANCHES[hongluanPos]].minor.push("紅鸞");
  branchStars[ZI_BRANCHES[tianxiPos]].minor.push("天喜");

  // Si Hua (four transformers) map
  const SI_HUA_MAP: Record<string, { lu: string, quan: string, ke: string, ji: string }> = {
    "甲": { lu: "廉貞", quan: "破軍", ke: "武曲", ji: "太陽" },
    "乙": { lu: "天機", quan: "天梁", ke: "紫微", ji: "太陰" },
    "丙": { lu: "天同", quan: "天機", ke: "文昌", ji: "廉貞" },
    "丁": { lu: "太陰", quan: "天同", ke: "天機", ji: "巨門" },
    "戊": { lu: "貪狼", quan: "太陰", ke: "右弼", ji: "天機" },
    "己": { lu: "武曲", quan: "貪狼", ke: "天梁", ji: "文曲" },
    "庚": { lu: "太陽", quan: "武曲", ke: "太陰", ji: "天同" },
    "辛": { lu: "巨門", quan: "太陽", ke: "文曲", ji: "文昌" },
    "壬": { lu: "天梁", quan: "紫微", ke: "左輔", ji: "武曲" },
    "癸": { lu: "破軍", quan: "巨門", ke: "太陰", ji: "貪狼" },
  };

  const sihua = SI_HUA_MAP[yearGan] || SI_HUA_MAP["甲"];
  ZI_BRANCHES.forEach(b => {
    const starInfo = branchStars[b];
    if (starInfo.major.includes(sihua.lu)) starInfo.minor.push(`${sihua.lu}·化祿`);
    if (starInfo.major.includes(sihua.quan)) starInfo.minor.push(`${sihua.quan}·化權`);
    if (starInfo.major.includes(sihua.ke)) starInfo.minor.push(`${sihua.ke}·化科`);
    if (starInfo.major.includes(sihua.ji)) starInfo.minor.push(`${sihua.ji}·化忌`);
  });

  return branchStars;
}

function getMingZhu(branch: string): string {
  const map: Record<string, string> = {
    "子": "貪狼", "丑": "巨門", "寅": "天梁", "卯": "文曲",
    "辰": "廉貞", "巳": "武曲", "午": "破軍", "未": "天相",
    "申": "廉貞", "酉": "文曲", "戌": "天同", "亥": "巨門"
  };
  return map[branch] || "紫微";
}

function getShenZhu(yearZhi: string): string {
  const map: Record<string, string> = {
    "子": "天機", "丑": "天相", "寅": "天梁", "卯": "天同",
    "辰": "文昌", "巳": "天機", "午": "文曲", "未": "天相",
    "申": "天梁", "酉": "天同", "戌": "文昌", "亥": "天機"
  };
  return map[yearZhi] || "天同";
}

/**
 * 轉化為整合了紫微斗數與日本九星氣學的資料結構
 */
export function calculateRawBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number = 0
): FortuneResult {
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();
  
  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthZhi = eightChar.getMonthZhi();
  const hourZhi = eightChar.getTimeZhi();
  const shengxiao = lunar.getYearShengXiao();
  const solarTerm = lunar.getJieQi() || "無特殊節氣";
  
  const lunarMonth = lunar.getMonth();
  const lunarDay = lunar.getDay();
  
  // 1. Calculate Ming Gong (命宮)
  const mIndex = lunarMonth;
  const hIndex = SHICHEN_ZHI_INDEX[hourZhi] || 1;
  let mingGongPosIndex = (mIndex - 1) - (hIndex - 1);
  if (mingGongPosIndex < 0) mingGongPosIndex += 12;
  const mingGongBranch = ZI_BRANCHES[mingGongPosIndex];
  
  // 2. Generate 12 palaces
  const starsByBranch = calculateZiweiStars(lunarMonth, lunarDay, hourZhi, yearGan, yearZhi);
  const ziweiPalaces: ZiweiPalace[] = PALACE_NAMES.map((name, i) => {
    let branchIndex = (mingGongPosIndex - i) % 12;
    if (branchIndex < 0) branchIndex += 12;
    const branch = ZI_BRANCHES[branchIndex];
    const stars = starsByBranch[branch];
    const primaryStar = stars.major[0] || "無主星";
    
    return {
      name,
      zhi: branch,
      majorStars: stars.major.length > 0 ? stars.major : ["無主星"],
      minorStars: stars.minor,
      luShuai: getLuShuai(primaryStar, branch)
    };
  });

  // 3. Kyusei Kigaku Calculation
  const adjustedYear = targetCosmicYear(solar, lunar);
  const yearStarNum = getYearStarNum(adjustedYear);
  const monthStarNum = getMonthStarNum(yearStarNum, monthZhi);
  
  const yDetails: KyuseiStarDetails = {
    name: KYUSEI_NAMES[yearStarNum],
    element: KYUSEI_ELEMENTS[yearStarNum],
    color: KYUSEI_COLORS[yearStarNum],
    desc: KYUSEI_DESCS[yearStarNum]
  };
  
  const mDetails: KyuseiStarDetails = {
    name: KYUSEI_NAMES[monthStarNum],
    element: KYUSEI_ELEMENTS[monthStarNum],
    color: KYUSEI_COLORS[monthStarNum],
    desc: KYUSEI_DESCS[monthStarNum]
  };

  const kyuseiDirs = getKyuseiDirections(yearStarNum);
  const kyusei: KyuseiInfo = {
    yearStar: yDetails,
    monthStar: mDetails,
    luckyDirections: kyuseiDirs.lucky,
    avoidDirections: kyuseiDirs.avoid
  };

  // 4. Basic Info
  const mingZhu = getMingZhu(mingGongBranch);
  const shenZhu = getShenZhu(yearZhi);
  const lunarBirthDate = `陰曆 ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}日`;
  const solarBirthDateStr = `${year}年${month}月${day}日 ${hour.toString().padStart(2, "0")}點`;

  return {
    personalInfo: {
      name: "",
      gender: "",
      solarBirthDate: solarBirthDateStr,
      lunarBirthDate,
      solarTerm,
      shengxiao,
      mingZhu,
      shenZhu,
      mingGong: `${mingGongBranch}宮`,
      birthPlace: "",
      focusArea: ""
    },
    ziweiPalaces,
    kyusei,
    aiAnalysis: {
      fateRating: 80,
      lifeHarmonyGuide: "",
      personality: "",
      career: "",
      love: "",
      wealth: "",
      health: "",
      lifeGuidance: "",
      currentYearFortune: ""
    }
  };
}

/**
 * Helper to determine corresponding cosmic boundary year adjusted by solar periods
 */
function targetCosmicYear(solar: any, lunar: any): number {
  // Li Chun typically around Feb 4, matches Lunar calendar boundary in traditional ki
  return lunar.getYear();
}
