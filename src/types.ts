/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ZiweiPalace {
  name: string;        // 宮位名稱 (e.g. "命宮", "夫妻宮")
  zhi: string;         // 地支 (e.g. "寅", "卯")
  majorStars: string[];// 主要星曜 (e.g. ["紫微", "天府"])
  minorStars: string[];// 輔助星曜與四化 (e.g. ["文昌", "文曲"])
  luShuai: string;     // 廟旺平陷 (e.g. "廟", "旺", "陷")
}

export interface KyuseiStarDetails {
  name: string;        // 九星名稱 (e.g. "四綠木星")
  element: string;     // 五行 (e.g. "木")
  color: string;       // 專屬色碼 (e.g. "#22C55E")
  desc: string;        // 文青風個性描述
}

export interface KyuseiInfo {
  yearStar: KyuseiStarDetails;  // 本命星
  monthStar: KyuseiStarDetails; // 月命星
  luckyDirections: string[];    // 吉位建議
  avoidDirections: string[];     // 避忌方向
}

export interface DayMasterInfo {
  name: string;           // 姓名
  gender: string;         // 性別
  solarBirthDate: string; // 陽曆出生
  lunarBirthDate: string; // 陰曆出生
  solarTerm: string;      // 節氣
  shengxiao: string;      // 生肖
  mingZhu: string;        // 命主 (e.g. "巨門")
  shenZhu: string;        // 身主 (e.g. "天同")
  mingGong: string;       // 命宮宮位 (e.g. "辰宮")
  birthHour?: number | string;
}

export interface FortuneResult {
  offlineUsed?: boolean;
  fallbackUsed?: boolean;
  calcId?: string;              // 每次計算的獨特隨機印記，用來重置 React DOM 掛載與動畫
  personalInfo: DayMasterInfo & {
    birthPlace: string;
    focusArea: string;
  };
  ziweiPalaces: ZiweiPalace[]; // 12宮位
  kyusei: KyuseiInfo;          // 九星氣學
  aiAnalysis: {
    fateRating: number;         // 終身星曜微光總分 1-100
    lifeHarmonyGuide: string;   // 最強人生中和指南報告 (Ultra-concise, powerful summary)
    personality: string;        // 星曜與性格微光
    career: string;             // 生涯與創造力軌跡
    love: string;               // 親密關係與溫溫相遇
    wealth: string;             // 物質豐盛與心靈流動
    health: string;             // 身心節奏與自我療癒
    lifeGuidance: string;       // 日常小開運與和諧指引
    currentYearFortune: string; // 2026 歲月流轉微光
  };
}

export interface FollowUpQuestionRequest {
  baziData: FortuneResult;      // 為相容舊接口保留名稱
  question: string;
  chatHistory: { role: "user" | "model"; text: string }[];
}

export interface FollowUpQuestionResponse {
  answer: string;
}
