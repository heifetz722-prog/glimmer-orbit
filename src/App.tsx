/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Compass,
  Calendar,
  Clock,
  MapPin,
  User,
  Sparkles,
  MessageSquare,
  Send,
  HelpCircle,
  TrendingUp,
  Heart,
  Briefcase,
  Flame,
  Droplet,
  Layers,
  Shield,
  RotateCcw,
  Info,
  Loader2,
  Bot,
  Download,
  Award,
  Lock,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FortuneResult, ZiweiPalace } from "./types";
import { ORACLE_CARDS, OracleCard } from "./oracle_cards";
import { getWuxingColor, getWuxingIcon } from "./bazi_utils";
import { calculateSanFangSiZheng } from "./ziwei_lifepath";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// 協助解析並格式化對白，自動去除不必要的 * 號或 ** 號，將 **文字** 替換成 JSX 的 strong，行首的 * 或 - 自動轉換成優雅的 🔸 符號
const renderFormattedText = (
  text: string | undefined,
  textClassName?: string,
  spaceClassName: string = "space-y-1.5",
  boldColorClassName: string = "text-[#A44330]"
): React.ReactNode => {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className={`select-text ${spaceClassName}`}>
      {lines.map((line, idx) => {
        let cleanLine = line.trim();
        if (!cleanLine) {
          return <div key={idx} className="h-2" />; // 空行佔位
        }

        const isBullet = cleanLine.startsWith("*") || cleanLine.startsWith("-");
        if (isBullet) {
          cleanLine = cleanLine.replace(/^[*-\s]+/, "").trim();
        }

        // 去除可能殘留的行首尾單星號
        cleanLine = cleanLine.replace(/^\*+/, "").replace(/\*+$/, "");

        const parts = cleanLine.split(/\*\*([\s\S]*?)\*\*/g);

        return (
          <div key={idx} className={`flex items-start ${isBullet ? "pl-2" : ""}`}>
            {isBullet && (
              <span className="text-[#8C7A6B] mr-2 mt-1 shrink-0 text-[10px]">🔸</span>
            )}
            <span className={`flex-1 text-left text-[#2D2D2D] ${textClassName || "text-xs md:text-[13px] leading-relaxed"}`}>
              {parts.map((part, pIdx) => {
                if (pIdx % 2 === 1) {
                  return (
                    <strong key={pIdx} className={`font-semibold font-serif ${boldColorClassName}`}>
                      {part}
                    </strong>
                  );
                }
                return part;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// 協助解析並格式化部分對白，以便提供部分免費導讀「試閱」效果。大幅減少預覽訊息以提供極致 CP 值期待。
const renderTruncatedFormattedText = (text: string | undefined): React.ReactNode => {
  if (!text) return null;
  // 尋找第一個非空行
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return null;
  
  let firstLine = lines[0];
  // 僅保留極少字數，激發點亮意願
  const maxLen = 35;
  const needTruncate = firstLine.length > maxLen;
  if (needTruncate) {
    firstLine = firstLine.slice(0, maxLen) + "......";
  } else {
    firstLine = firstLine + "......";
  }
  
  const isBullet = firstLine.startsWith("*") || firstLine.startsWith("-");
  if (isBullet) {
    firstLine = firstLine.replace(/^[*-\s]+/, "").trim();
  }

  // 去除可能殘留的行首尾星號
  firstLine = firstLine.replace(/^\*+/, "").replace(/\*+$/, "");

  const parts = firstLine.split(/\*\*([\s\S]*?)\*\*/g);

  return (
    <div className="space-y-1 select-none relative pb-6 overflow-hidden opacity-65">
      <div className={`flex items-start ${isBullet ? "pl-2" : ""}`}>
        {isBullet && (
          <span className="text-[#8C7A6B] mr-2 mt-1 shrink-0 text-[10px]">🔸</span>
        )}
        <span className="flex-1 leading-relaxed text-left text-xs font-serif text-[#554C42]">
          {parts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return (
                <strong key={pIdx} className="font-bold text-[#A67C52] font-serif">
                  {part}
                </strong>
              );
            }
            return part;
          })}
        </span>
      </div>
      
      {/* 漸移遮罩效果：營造「翻越、付費解鎖更多詳細」的心理期待 */}
      <div className="h-10 bg-gradient-to-t from-[#FAF8F6] via-[#FAF8F6]/90 to-transparent absolute bottom-0 left-0 w-full pointer-events-none" />
    </div>
  );
};

interface PremiumLockBannerProps {
  activeTab: string;
  onUnlock: () => void;
  onLearnMore: () => void;
}

const PremiumLockBanner = ({ activeTab, onUnlock, onLearnMore }: PremiumLockBannerProps) => {
  return (
    <div id={`tab-lock-banner-${activeTab}`} className="mt-6 bg-gradient-to-br from-[#FCF9F2] via-[#FAF5EB] to-[#F3ECE0] border-2 border-[#D5C2AF] rounded-2xl p-5 md:p-6 text-center space-y-4.5 relative overflow-hidden shadow-lg transition-all">
      {/* Absolute subtle background decorative emblem */}
      <div className="absolute -right-6 -bottom-6 text-amber-600/5 select-none pointer-events-none text-9xl font-serif">
        ✨
      </div>
      
      {/* 橫幅公告：清楚傳達「一筆付款，全面解鎖」超值資訊 */}
      <div className="bg-gradient-to-r from-[#947A5A] to-[#63513C] text-white py-2 px-3 rounded-xl text-center text-[10.5px] md:text-xs font-bold leading-normal tracking-wide shadow-xs flex items-center justify-center gap-1.5 relative z-10 select-none">
        <span className="animate-bounce">💎</span>
        <span>【一經收費，全盤點亮】點亮此處，全站「所有上鎖分頁」同步暢通，絕無任何二次收費！</span>
      </div>

      <div className="space-y-2 relative z-10">
        <div className="inline-flex items-center gap-1.5 bg-[#FAF0E6] text-[#8C6239] px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-[#EBD7C0]/60 font-serif">
          🔒 宮位核心紫微天書已受限
        </div>
        <h5 className="text-sm font-extrabold text-[#3C352E] font-serif tracking-wide">
          {activeTab === "career" ? "💼 命格解析：生涯定位、隱藏貴人與流年職涯轉機" :
           activeTab === "love" ? "💖 命格解析：親密伴侶、正緣合盤特徵與終生宿命契合度" :
           activeTab === "wealth" ? "💰 命格解析：本命財庫、流年避險以及五行補運旺財攻略" :
           "📅 命格解析：2026 丙午歲月流流深入大對比與十二月份走勢"}
        </h5>
        
        <div className="bg-[#FAF8F5]/85 border border-[#EBE3D5] p-3 rounded-xl max-w-xl mx-auto text-left space-y-1.5">
          <p className="text-[15px] font-bold text-[#805D3B] font-serif flex items-center gap-1">
            <span>✨</span> 解鎖後即可看見什麼？
          </p>
          <p className="text-[14px] text-[#6E6457] leading-relaxed font-serif">
            為您深度推演精緻星盤 30,000 字全解。付款後首波權益即刻生效：
            <strong className="text-red-800">「生涯宮、夫妻宮、財帛宮、流年盤、各分頁全數同步解鎖」</strong> 
            並獲得將這份《終身精批長尾說明》一鍵匯出為 PDF 隨身小書的完整特權。
          </p>
        </div>
      </div>

      <div className="border-t border-[#EBE3D5]/60 my-2" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 max-w-xl mx-auto relative z-10">
        <div className="text-left font-serif">
          <span className="text-[9.5px] font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded tracking-wide">
            限時特惠 ‧ 單次入手解鎖全盤
          </span>
          <div className="text-stone-850 text-base font-bold flex items-baseline gap-1 mt-1">
            <span className="text-[11px] text-stone-600">全站解鎖價</span>
            <span className="text-red-700 font-mono text-2xl font-extrabold">NT$ 299</span>
            <span className="text-[9.5px] text-stone-500 font-sans ml-1">/ 一鍵暢讀全盤（含 PDF 導出）</span>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onUnlock}
            className="w-full sm:w-auto bg-red-700 hover:bg-red-800 text-white rounded-xl px-5 py-2.5 font-serif font-bold text-[11.5px] tracking-wider transition-all active:scale-95 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <span>👑 點亮全盤深層解析</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 溫柔陪伴旅伴對話的推薦問答
const SUGGESTED_QUESTIONS = [
  "親愛的旅伴，我的主命盤展現了什麼天賦微光與天生優勢？",
  "九星氣學的本命星與月命星，在日常生活中該如何運用來調整起居？",
  "我正在經歷一些人生時空氣感和諧度，能從宮位與星曜的流轉中得到什麼溫和建議？",
  "關於我的 2026 丙午歲月流流，有什麼穩紮穩打的沉潛方案嗎？",
  "吉利開運方位和避忌方向，在日常生活空間佈局上能怎麼巧妙結合？"
];

// 禪定加載句子 - 文青風、安靜療癒
const LOADING_MESSAGES = [
  "正在安靜地排佈您的紫微斗數十二宮位星曜盤...",
  "正在凝聚日本九星氣學氣韻，對齊您的本命星與月命星...",
  "人生夥伴正在用心體會，聆聽星空微光帶給您的溫柔提示...",
  "正在為您整理細水長流的日常小開運與流年行動方案...",
  "正在慢慢寫下，這篇為您量身打造、充滿溫度的天賦之書..."
];

// 地支對應 Grid 坐標 (Ziwei 經典 4x4 宮位編排)
interface ShichenInfo {
  name: string;
  timeRange: string;
  element: "木" | "火" | "土" | "金" | "水";
  energyRate: number;
  mood: string;
  direction: string;
  tea: string;
  glowColor: string;
  colorName: string;
}

const getShichenInfo = (hours: number): ShichenInfo => {
  if (hours >= 23 || hours < 1) {
    return {
      name: "子時",
      timeRange: "23:00 - 01:00",
      element: "水",
      energyRate: 88,
      mood: "夜瀾清潤 ‧ 水木蓄能",
      direction: "正北坎水 ‧ 納氣開智",
      tea: "熱普洱溫心茶",
      glowColor: "rgba(85,110,132,0.15)",
      colorName: "月白冷青"
    };
  } else if (hours >= 1 && hours < 3) {
    return {
      name: "丑時",
      timeRange: "01:00 - 03:00",
      element: "土",
      energyRate: 60,
      glowColor: "rgba(140,122,107,0.15)",
      mood: "寒土蟄伏 ‧ 蘊藏心志",
      direction: "東北艮土 ‧ 寂靜守真",
      tea: "大麥紅棗茶",
      colorName: "石中藏玉"
    };
  } else if (hours >= 3 && hours < 5) {
    return {
      name: "寅時",
      timeRange: "03:00 - 05:00",
      element: "木",
      energyRate: 75,
      glowColor: "rgba(82,115,77,0.15)",
      mood: "松濤初醒 ‧ 生氣萌發",
      direction: "正東震木 ‧ 晨光破曉",
      tea: "薄荷迷迭清茶",
      colorName: "竹葉新綠"
    };
  } else if (hours >= 5 && hours < 7) {
    return {
      name: "卯時",
      timeRange: "05:00 - 07:00",
      element: "木",
      energyRate: 86,
      glowColor: "rgba(82,115,77,0.15)",
      mood: "晨光竹影 ‧ 潤澤萬物",
      direction: "東南巽木 ‧ 和風拂面",
      tea: "阿里山烏龍茶",
      colorName: "幽谷蒼碧"
    };
  } else if (hours >= 7 && hours < 9) {
    return {
      name: "辰時",
      timeRange: "07:00 - 09:00",
      element: "土",
      energyRate: 92,
      glowColor: "rgba(247,242,232,0.15)",
      mood: "朝日出雲 ‧ 信心甦醒",
      direction: "正東震木 ‧ 積極拓步",
      tea: "玄米暖心煎茶",
      colorName: "琥珀暖黃"
    };
  } else if (hours >= 9 && hours < 11) {
    return {
      name: "巳時",
      timeRange: "09:00 - 11:00",
      element: "火",
      energyRate: 82,
      glowColor: "rgba(253,242,238,0.15)",
      mood: "驕陽遍照 ‧ 靈思活絡",
      direction: "正南離火 ‧ 熱情開拓",
      tea: "玫瑰紅棗花釀",
      colorName: "硃砂微紅"
    };
  } else if (hours >= 11 && hours < 13) {
    return {
      name: "午時",
      timeRange: "11:00 - 13:00",
      element: "火",
      energyRate: 98,
      glowColor: "rgba(253,242,238,0.15)",
      mood: "如日中天 ‧ 氣象中和",
      direction: "正南離火 ‧ 舒心守中",
      tea: "高山蓮子綠茶",
      colorName: "日輪金曜"
    };
  } else if (hours >= 13 && hours < 15) {
    return {
      name: "未時",
      timeRange: "13:00 - 15:00",
      element: "土",
      energyRate: 68,
      glowColor: "rgba(140,122,107,0.15)",
      mood: "夕照斜陽 ‧ 塵埃落定",
      direction: "西南坤土 ‧ 安祥承載",
      tea: "重焙水蜜桃金萱",
      colorName: "秋葉枯黃"
    };
  } else if (hours >= 15 && hours < 17) {
    return {
      name: "申時",
      timeRange: "15:00 - 17:00",
      element: "金",
      energyRate: 85,
      glowColor: "rgba(243,244,246,0.15)",
      mood: "金輝疊疊 ‧ 意志凝聚",
      direction: "正西兌金 ‧ 怡然談笑",
      tea: "桂花金萱烏龍",
      colorName: "玄冰灰曜"
    };
  } else if (hours >= 17 && hours < 19) {
    return {
      name: "酉時",
      timeRange: "17:00 - 19:00",
      element: "金",
      energyRate: 78,
      glowColor: "rgba(243,244,246,0.15)",
      mood: "夕暉疏落 ‧ 沉澱思緒",
      direction: "正西兌金 ‧ 歸藏心神",
      tea: "金蓮洋甘菊茶",
      colorName: "夕陽緋紅"
    };
  } else if (hours >= 19 && hours < 21) {
    return {
      name: "戌時",
      timeRange: "19:00 - 21:00",
      element: "土",
      energyRate: 72,
      glowColor: "rgba(140,122,107,0.15)",
      mood: "暮色微茫 ‧ 守護爐火",
      direction: "西北乾金 ‧ 自在反觀",
      tea: "陳皮陳年白茶",
      colorName: "溫火烹茶"
    };
  } else {
    return {
      name: "亥時",
      timeRange: "21:00 - 23:00",
      element: "水",
      energyRate: 80,
      glowColor: "rgba(85,110,132,0.15)",
      mood: "江河夜靜 ‧ 太虛空明",
      direction: "西北乾金 ‧ 安祥歸息",
      tea: "舒神薰衣草茶",
      colorName: "星光指路"
    };
  }
};

export interface DailyFortune {
  title?: string;
  ratingLove: number;
  ratingCareer: number;
  ratingWealth: number;
  ratingHealth: number;
  elementState: string;
  zenWhisper: string;
  adviceDo: string[];
  adviceDont: string[];
  luckyColor: string;
  luckyColorHex: string;
  luckyDirection: string;
  luckyTime: string;
  luckyNumber: number;
  summary: string;
}

export const generateDailyFortuneData = (
  name: string,
  shengxiao: string,
  yearStar: string,
  date: Date
): DailyFortune => {
  const cleanName = name.trim() || "有緣人";
  const dayKey = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  
  let hash = dayKey;
  for (let i = 0; i < cleanName.length; i++) {
    hash = (hash * 31 + cleanName.charCodeAt(i)) & 0xffffff;
  }
  const shengxiaoIndex = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"].indexOf(shengxiao);
  hash = (hash + (shengxiaoIndex >= 0 ? shengxiaoIndex * 17 : 5)) & 0xffffff;

  const ratingLove = 72 + (hash % 27);
  const ratingCareer = 68 + ((hash >> 2) % 31);
  const ratingWealth = 70 + ((hash >> 4) % 29);
  const ratingHealth = 74 + ((hash >> 6) % 25);

  const whispers = [
    "「好運在不曾刻意凝視之時潛生。放慢步伐，給感知系統充足的安頓。」",
    "「無須成為炫目的禮花，只需做一爐冬日寒夜裡，永不熄滅、溫熱如初的炭火。」",
    "「莫急於將冷水燒開，溫火烹煮的茶，方能香氣綿長。」",
    "「像流水包容磐石一樣，順應今日命運之河的緩慢流速。」",
    "「內在的安定是一道無形氣場，不被外界風起雲湧所動搖。」",
    "「允許一切發生，今日適度休息與沉澱，是為了明日更好的萌芽。」",
    "「心中若有桃花源，所遇之人皆溫厚。今天多為自己沏一盞熱茶。」",
    "「給焦慮的小念頭拍一拍肩膀，然後對自己說：辛苦了，今天你做得很好。」"
  ];
  const zenWhisper = whispers[hash % whispers.length];

  // 1. 根據本命九星與生肖能量，獲取本日特定的五行屬性
  let element: "木" | "火" | "土" | "金" | "水" = "土";
  if (yearStar.includes("水")) {
    element = "水";
  } else if (yearStar.includes("火")) {
    element = "火";
  } else if (yearStar.includes("木")) {
    element = "木";
  } else if (yearStar.includes("金")) {
    element = "金";
  } else if (yearStar.includes("土")) {
    element = "土";
  } else {
    // 根據生肖降級兜底
    const woodZ = ["虎", "兔"];
    const fireZ = ["蛇", "馬"];
    const earthZ = ["牛", "龍", "羊", "狗"];
    const metalZ = ["猴", "雞"];
    if (woodZ.includes(shengxiao)) element = "木";
    else if (fireZ.includes(shengxiao)) element = "火";
    else if (earthZ.includes(shengxiao)) element = "土";
    else if (metalZ.includes(shengxiao)) element = "金";
    else element = "水";
  }

  // 2. 建立精緻的大型五行能量資料庫，增加關於「為什麼」的白話解釋
  const database: Record<"木" | "火" | "土" | "金" | "水", { dos: string[]; donts: string[] }> = {
    "木": {
      dos: [
        "【案頭綠意】：擺上一株水培植物或修剪微型的枯片黃葉。 —— 木德主生發與靈氣，這是在親手拂拭調度你的日常磁場，有助於剪除身邊雜亂緊繃的負面思想。",
        "【草木舒展】：到附近的公園散步，赤腳踩地或觸摸樹木，吸收大自然的新鮮氣息，生發體內木氣。 —— 親近林木是木曜最好的天然給氧，能溫柔舒張周身脈絡，釋放多餘壓力。",
        "【青綠生活】：著青色、綠色系衣物，或多食用綠色蔬菜、溫和綠茶等。 —— 青綠色能和緩緊繃神經，平靜浮躁情懷，是今天最佳的能量守護色。",
        "【閱讀滋養】：翻閱一本優美、舒緩的紙質書籍，靜坐一刻鐘。 —— 木主文藝才思，溫潤的文字滋潤能幫你理順頭緒，激發日常靈感與智慧氣場。"
      ],
      donts: [
        "【熬夜傷肝】：夜晚十一點後仍在過度使用雙眼、看電子螢幕。 —— 夜半此時正是木氣歸倉休養黃金期，過度透支眼力會重挫自身慧根與隔日心神定力。",
        "【急躁動怒】：因繁瑣小事大發脾氣 or 心急如焚。 —— 木性宜舒展與和煦。動粗急怒會形成狂風摧林，瞬間折損人緣、招惹不快事端。",
        "【久坐凝滯】：長時間保持同一個姿勢久坐不動，不與外界自然的清新氣流接觸。 —— 久坐會令周身氣血受阻而『木鬱』，令校思維變得僵化，精神也易陷入倦怠期。",
        "【剪碎青絲】：今日不宜過多修剪指甲、理髮 or 大舉整修家中木質擺件。 —— 木曜主自然生發，刻意修剪易壓抑原本活潑萌動的元氣磁場，應順其生機。"
      ]
    },
    "火": {
      dos: [
        "【迎曦向陽】：清晨或午後曬一曬溫暖的陽光，讓熱量充盈心口。 —— 火主禮儀與溫暖，吸收陽光能生發體內的熱忱，點亮你今天的人際親和力與主動性。",
        "【燃香定心】：點燃一根天然線香、沉香，或使用溫暖的木質、柑橘香薰。 —— 精緻的香氣能迅速溫暖氣場，點燃你內在的靈感與創造力，讓繁雜思維條理分明。",
        "【熱情傾聽】：主動對家人、同事致以爽朗溫暖的問候，或送給他人溫柔的微笑。 —— 火之德在於以光熱照亮四周，多傳遞正面能量會加倍反饋到你的福報運勢上。",
        "【硃紅提神】：穿戴一件帶有溫紅色、橘色、暖金色的飾品或精緻亮眼的配件。 —— 暖色調是火曜極佳的能量點綴，能大方為你提升整體存在感，在會議中更易出彩。"
      ],
      donts: [
        "【冷言針鋒】：用尖酸刻薄、毫無溫度的冷漠言語去打擊他人的熱情，或說一些風涼話。 —— 火主熱誠，冷言冷語如同冷水撲火，會嚴重折損你今天積聚的貴人運勢。",
        "【高溫暴飲】：暴飲暴食，食用過多煎炸辛辣、滾燙燙口的重口味食物。 —— 過熱的飲食非徒無益，反而易引發體內火氣失衡、虛火上升，導致情緒焦躁與注意力散漫。",
        "【夜不閉戶】：睡前過度思慮未來、看太刺眼的動作電影，讓神經處於亢奮之中。 —— 亢奮 of 火氣會侵擾睡眠，使心定不下來，第二天的清晨氣色與氣場會大幅下滑。",
        "【蓬頭垢面】：不整理儀容儀表，穿著沾滿污漬、晦暗無光的衣物出門。 —— 火曜最喜明亮整潔，儀容隨意邋遢會壓制你自身的精神氣，讓原本燦爛的好運格調蒙塵。"
      ]
    },
    "土": {
      dos: [
        "【足履實地】：穿一雙舒適好走的平底鞋，在大地上沉穩行走，去感受腳步與地面的接觸。 —— 土德主厚德載物與承載，沉穩行步能幫你找回內在的安全感與定力。",
        "【整理雜物】：動手清理書桌、抽屜中堆積的無用廢物，將物品收納整齊。 —— 規整、厚實的土德喜條理。清理廢物如同為土地除草，能激活原本淤塞的財富與思維通道。",
        "【黃琥養氣】：今天宜穿著、佩戴黃色、卡其色、琥珀色、溫暖大地色系的服飾或飾物。 —— 沉穩深厚的黃卡其色能在大腦中營造安定感，在與重要人士交談時更顯穩重可靠。",
        "【深呼吸定】：每次做決定 or 感到不安時，緩緩做三次深長的腹式呼吸，將氣息沉入丹田。 —— 呼吸調度能滋養脾胃與核心氣場，為今天的生活注入堅實的抗壓與決策力。"
      ],
      donts: [
        "【疑心猜忌】：反覆猜測、懷疑身邊親近之人的言語與動機，讓心神陷入不信任的泥潭。 —— 土曜最忌「泥濘渾濁」，猜忌會讓你內在能量變得沈重而封閉，錯失真誠的朋友。",
        "【暴飲暴食】：三餐時間不固定，或在壓力之下暴飲暴食、食用過多甜膩糕點與冰冷冷飲。 —— 脾胃屬土，飲食不潔極易重挫「脾土」能量，令身體感到脾憊沈重、精神萎靡。",
        "【輕諾寡信】：為了應付一時場面，就隨口許下自己本就做不到或根本不想做的草率承諾。 —— 土主誠信，失信如同地基動搖，會嚴重損害你在朋友或職場中的長遠信譽。",
        "【久坐凝滯】：長時間癱在沙發或靠椅上久坐不動，不與外界自然的清新氣流、陽光接觸。 —— 久坐傷肉（脾主肉），凝滯的狀態會讓你的行動力衰退，好機會容易因此擦肩而過。"
      ]
    },
    "金": {
      dos: [
        "✦【線材整理】：極有耐心地整理、理順包包內或桌上散亂糾結的耳機線、充電線或飾品。 —— 理線就是理內在，乾淨理性的金曜最喜條理章法，動手由亂入治最能洗亮你驚人的財務智慧。",
        "✦【鋼筆定心】：使用精緻端裝、金屬手感的鋼筆或原子筆在白紙上工整寫下今天的三條具體計劃。 —— 金曜能制衡游離，金屬筆尖在紙張摩擦發出的沙沙聲，能完美收斂心神，鎖住好運局。",
        "✦【清音磬擊】：聽水晶磬、水晶鉢、清幽風鈴聲等高純高頻率的金屬共鳴音頻3分鐘。 —— 乾淨的共振能將籠罩在你身旁的疲憊與雜音一掃而空，在腦周圍形成一面擋風牆，杜絕負能量沾染。",
        "✦【銀白美學】：穿搭、佩戴一件暗帶金屬扣特徵、亮銀、純白、乳白、珍珠白色系的日常物品。 —— 銀白代表明快與尊貴。這個高級感的色調能令你在他人面前倍增乾淨專業的威嚴，大受敬重。"
      ],
      donts: [
        "✦【高溫鬥口】：與不可理喻、思路死板、或正處於情緒崩潰的蠻橫之人在細節上大聲爭執。 —— 金最忌高溫烈火，激烈嘴碎拉扯會瞬間把你原本無暇利落的理智融成鐵水，也會傷你肺氣與喉嚨。",
        "✦【面子重擔】：在飯席、應酬中，僅僅因為愛面子 or 面子薄，就滿口答應超出自己極限的沉重承諾。 —— 承諾如鐵沉重不輕融。輕易拍板會令你氣脈極其受壓，日後甚至吃力不討好反招惹怨言。",
        "✦【夜半反芻】：夜深人靜時，重新翻讀那些早已翻篇的感情聊天記錄、或觀看令你委屈的歷史郵件。 —— 金性絕不宜反覆回燒。拋開過去、永不自怨才是你得天獨厚的天賦，糾纏舊賬只會折損慧根。",
        "✦【髒亂包夾】：任由隨身包袋、皮夾裡無序堆滿過期發票、廢舊廢紙與多餘雜卡。 —— 錢包是金曜藏氣的保險箱。凌亂骯髒如同大門生鏽，會令你理財思維混亂，也讓財氣難進門。"
      ]
    },
    "水": {
      dos: [
        "【溫水淨化】：清晨醒來或工作小憩時，緩緩飲下一大杯溫熱純淨的白開水。 —— 水主滋潤與排毒，溫熱的流體能溫柔喚醒五臟六腑的活力，洗滌帶走體內負面與緊繃的疲憊磁場。",
        "【默寫靜思】：找個安靜角落，在大腦中默默或在紙上默寫下三個今天帶給你平和人、事、物。 —— 水曜主深層智慧。靜心默寫能幫你將飄移的浮躁情緒收斂凝聚，歸於古井無波的智慧境地。",
        "【臨水聽泉】：得空時傾聽幾首舒緩的水流重奏、深海波濤或雨打芭蕉的自然音樂3-5分鐘。 —— 純淨的水流音頻與心率共振，能幫你洗去大腦皮層的黏記焦慮，打通思維的通暢源流。",
        "【深藍安撫】：今天宜著深海藍色、墨黑色、黛灰色系的服飾，或攜帶一隻深暗色調的保溫杯。 —— 沉靜、包容的色澤是水曜最好的能量護甲，能大方為你屏蔽外部社交中刺耳、尖銳的外力嘈雜波音。"
      ],
      donts: [
        "【暴飲生冷】：貪一時爽快，大口喝下加滿冰塊的冰鎮氣泡飲，或大量食用剛出冰箱的生冷海鮮。 —— 水本清寒，深夜或暴飲生冷極易重挫脾胃陽氣，引發「水氣不化」，使體能和專注力下午暴跌。",
        "【深夜反芻】：夜深人靜、十一點後仍在不斷翻看、追憶早已過去幾年、令人遺憾委屈的舊聊天記錄或老信件。 —— 水系人最忌「沉溺死水」而自怨。頻繁回頭反芻只會讓心靈能量陷入沼澤，折損好運局。",
        "【強求表白】：在時機尚不成熟、對方仍處於防備或冷淡期時，硬要以激烈強詞奪理的方式去逼問、討要一個承諾。 —— 水利萬物而不爭，急躁強求只會泛濫成災。保持適度留白，待水到渠成，好運自來。",
        "【污濁凝滯】：在雜黑凌亂、通風極差的封閉小暗室中、堆滿污垢衣物的沙發角長時間低頭蜷縮玩手機。 —— 暗滯的水氣會迅速腐蝕你的信心意志。試著把垃圾清理掉，推開窗戶接入一縷風最妙。"
      ]
    }
  };

  const { dos, donts } = database[element];
  const do1 = dos[hash % dos.length];
  const do2 = dos[(hash + 1) % dos.length];
  const dont1 = donts[hash % donts.length];
  const dont2 = donts[(hash + 1) % donts.length];

  const colors = [
    { name: "竹葉新綠", hex: "#52734D" },
    { name: "硃砂微紅", hex: "#D96055" },
    { name: "琥珀暖黃", hex: "#D49B41" },
    { name: "玄冰灰曜", hex: "#7E8A96" },
    { name: "月白冷青", hex: "#556E84" },
    { name: "珍珠純白", hex: "#F3F4F6" },
    { name: "幽谷深黛", hex: "#2C3E50" }
  ];
  const colorObj = colors[hash % colors.length];

  const directions = [
    "正東 ‧ 震木 ‧ 迎曦生聚",
    "正南 ‧ 離火 ‧ 光明朗照",
    "正西 ‧ 兌金 ‧ 怡然歸藏",
    "正北 ‧ 坎水 ‧ 玄冥納氣",
    "東北 ‧ 艮土 ‧ 寂靜守真",
    "東南 ‧ 巽木 ‧ 和風拂面",
    "西南 ‧ 坤土 ‧ 安祥承載",
    "西北 ‧ 乾金 ‧ 自在反觀"
  ];
  const luckyDirection = directions[hash % directions.length];

  const times = [
    "子時 (23:00-01:00)", "丑時 (01:00-03:00)", "寅時 (03:00-05:00)", 
    "卯時 (05:00-07:00)", "辰時 (07:00-09:00)", "巳時 (09:00-11:00)",
    "午時 (11:00-13:00)", "未時 (13:00-15:00)", "申時 (15:00-17:00)",
    "酉時 (17:00-19:00)", "戌時 (19:00-21:00)", "亥時 (21:00-23:00)"
  ];
  const luckyTime = times[hash % times.length];
  const luckyNumber = (hash % 9) + 1;

  const elementState = element;

  const summaries = [
    `親愛的 ${cleanName}，您今天本命五行之氣散放著極佳的底蘊。您的核心靈性磁場高掛，在社交人際、文字創意上極其活絡。適合大膽表達內心想法，甚至給予身邊焦慮的旅伴溫暖的傾聽、建議。以寬容平等的心氣，您將收穫滿滿的認同與福報。`,
    `親愛的 ${cleanName}，今日您的星氣流露出一種「石中琢玉、千呼萬喚」的溫厚定力。在物質與生涯軌跡上，踏實儲存與默默付出會迎來極佳的防護開運。無需急於在一日之間徹底自證，按時飲食、做好常規小斜槓，您專注的姿態就是當下最美的高原風光。`,
    `親愛的 ${cleanName}，今日星宿流動呈「碧水穿林，以柔克剛」的和善姿態。如果您在親密關係或職場協調中遇到不快，千萬不要與之生氣較勁。像溪水一邊幽默地繞開盤石一邊歌唱。給自己留出晚間十分鐘放空時間，熱水足浴，今晚能安享極其甜柔的睡眠。`
  ];
  const summary = summaries[hash % summaries.length];

  return {
    ratingLove,
    ratingCareer,
    ratingWealth,
    ratingHealth,
    elementState,
    zenWhisper,
    adviceDo: [do1, do2],
    adviceDont: [dont1, dont2],
    luckyColor: colorObj.name,
    luckyColorHex: colorObj.hex,
    luckyDirection,
    luckyTime,
    luckyNumber,
    summary
  };
};

// 傳統紫微斗數：神功妙算輔助器 (宮干、納音、星曜五行、星軌坐標)

const BRANCH_COORDINATES: Record<string, { x: string; y: string }> = {
  "巳": { x: "12.5%", y: "12.5%" },
  "午": { x: "37.5%", y: "12.5%" },
  "未": { x: "62.5%", y: "12.5%" },
  "申": { x: "87.5%", y: "12.5%" },
  "辰": { x: "12.5%", y: "37.5%" },
  "酉": { x: "87.5%", y: "37.5%" },
  "卯": { x: "12.5%", y: "62.5%" },
  "戌": { x: "87.5%", y: "62.5%" },
  "寅": { x: "12.5%", y: "87.5%" },
  "丑": { x: "37.5%", y: "87.5%" },
  "子": { x: "62.5%", y: "87.5%" },
  "亥": { x: "87.5%", y: "87.5%" },
};

export function getPalaceGangan(branch: string, yearGan: string): string {
  const stems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
  const branches = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"];
  const firstGan = yearGan ? yearGan.charAt(0) : "甲";
  const ganIndex = stems.indexOf(firstGan);
  if (ganIndex === -1) return "丙"; // 預設丙
  
  let startStemIdx = 0;
  const modGan = ganIndex % 5;
  if (modGan === 0) startStemIdx = 2; // 丙 (甲、己年起丙寅)
  else if (modGan === 1) startStemIdx = 4; // 戊 (乙、庚年起戊寅)
  else if (modGan === 2) startStemIdx = 6; // 庚 (丙、辛年起庚寅)
  else if (modGan === 3) startStemIdx = 8; // 壬 (丁、壬年起壬寅)
  else if (modGan === 4) startStemIdx = 0; // 甲 (戊、癸年起甲寅)

  const branchIdx = branches.indexOf(branch);
  if (branchIdx === -1) return "丙";
  const stemIdx = (startStemIdx + branchIdx) % 10;
  return stems[stemIdx];
}

export function getNayin(gangan: string, zhi: string): string {
  const combo = (gangan || "") + (zhi || "");
  const nayinMap: Record<string, string> = {
    "甲子": "海中金", "乙丑": "海中金", "丙寅": "爐中火", "丁卯": "爐中火",
    "戊辰": "大林木", "己巳": "大林木", "庚午": "路旁土", "辛未": "路旁土",
    "壬申": "劍鋒金", "癸酉": "劍鋒金", "甲戌": "山頭火", "乙亥": "山頭火",
    "丙子": "澗下水", "丁丑": "澗下水", "戊寅": "城頭土", "己卯": "城頭土",
    "庚辰": "白蠟金", "辛巳": "白蠟金", "壬午": "楊柳木", "癸未": "楊柳木",
    "甲申": "泉中水", "乙酉": "泉中水", "丙戌": "屋上土", "丁亥": "屋上土",
    "戊子": "霹靂火", "己丑": "霹靂火", "庚寅": "松柏木", "辛卯": "松柏木",
    "壬辰": "長流水", "癸巳": "長流水", "甲午": "沙中金", "乙未": "沙中金",
    "丙申": "山下火", "丁酉": "山下火", "戊戌": "平地木", "己亥": "平地木",
    "庚子": "壁上土", "辛丑": "壁上土", "壬寅": "金箔金", "癸卯": "金箔金",
    "甲辰": "覆燈火", "乙巳": "覆燈火", "丙午": "天河水", "丁未": "天河水",
    "戊申": "大驛土", "己酉": "大驛土", "庚戌": "釵釧金", "辛亥": "釵釧金",
    "壬子": "桑柘木", "癸丑": "桑柘木", "甲寅": "大溪水", "乙卯": "大溪s水", // standard correction
    "丙辰": "沙中土", "丁巳": "沙中土", "戊午": "天上火", "己未": "天上火",
    "庚申": "石榴木", "辛酉": "石榴木", "壬戌": "大海水", "癸亥": "大海水"
  };
  // If exact combination not found, find by stem grouping (e.g. 乙卯 as 大溪水)
  if (combo.substring(0,2) === "乙卯") return "大溪水";
  return nayinMap[combo] || nayinMap[combo.substring(0,2)] || "壁上土";
}

export function getCardEmoji(card: OracleCard): string {
  switch (card.id) {
    case 1: return "🍵"; // 溫火烹茶
    case 2: return "🌙"; // 月映空谷
    case 3: return "🎋"; // 新筍破土
    case 4: return "🕯️"; // 爐中守火
    case 5: return "💎"; // 石中藏玉
    case 6: return "🪻"; // 幽蘭獨芳
    case 7: return "💧"; // 流泉繞石
    case 8: return "🍂"; // 秋葉安息
    case 9: return "🔮"; // 星光指路
    default: return "🔮";
  }
}

export function getStarElement(star: string): { name: string; bg: string; text: string; hex: string } {
  const mapping: Record<string, { name: string; bg: string; text: string; hex: string }> = {
    "紫微": { name: "土", bg: "bg-[#E6F3FF]", text: "text-[#D97706]", hex: "#D97706" },
    "天機": { name: "木", bg: "bg-green-50", text: "text-[#10B981]", hex: "#10B981" },
    "太陽": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" },
    "武曲": { name: "金", bg: "bg-yellow-50", text: "text-[#EAB308]", hex: "#EAB308" },
    "天同": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "廉貞": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" },
    "天府": { name: "土", bg: "bg-[#FAF7F2]", text: "text-[#D97706]", hex: "#D97706" },
    "太陰": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "貪狼": { name: "木", bg: "bg-green-50", text: "text-[#10B981]", hex: "#10B981" },
    "巨門": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "天相": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "天梁": { name: "土", bg: "bg-[#FAF7F2]", text: "text-[#D97706]", hex: "#D97706" },
    "七殺": { name: "金", bg: "bg-yellow-50", text: "text-[#EAB308]", hex: "#EAB308" },
    "破軍": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "文昌": { name: "金", bg: "bg-yellow-50", text: "text-[#EAB308]", hex: "#EAB308" },
    "文曲": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "左輔": { name: "土", bg: "bg-[#FAF7F2]", text: "text-[#D97706]", hex: "#D97706" },
    "右弼": { name: "水", bg: "bg-blue-50", text: "text-[#3B82F6]", hex: "#3B82F6" },
    "天魁": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" },
    "天鉞": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" },
    "祿存": { name: "土", bg: "bg-[#FAF7F2]", text: "text-[#D97706]", hex: "#D97706" },
    "擎羊": { name: "金", bg: "bg-yellow-50", text: "text-[#EAB308]", hex: "#EAB308" },
    "陀羅": { name: "金", bg: "bg-yellow-50", text: "text-[#EAB308]", hex: "#EAB308" },
    "地空": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" },
    "地劫": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" },
    "紅鸞": { name: "水", bg: "bg-pink-500/10", text: "text-[#EC4899]", hex: "#EC4899" },
    "天喜": { name: "水", bg: "bg-pink-500/10", text: "text-[#EC4899]", hex: "#EC4899" },
    "天馬": { name: "火", bg: "bg-red-50", text: "text-[#EF4444]", hex: "#EF4444" }
  };
  return mapping[star] || { name: "土", bg: "bg-stone-50", text: "text-[#A19A8F]", hex: "#A19A8F" };
}

const BRANCH_GRID_STYLES: Record<string, string> = {
  "巳": "col-start-1 row-start-1 border-r border-b border-[#EBE3D5]",
  "午": "col-start-2 row-start-1 border-r border-b border-[#EBE3D5]",
  "未": "col-start-3 row-start-1 border-r border-b border-[#EBE3D5]",
  "申": "col-start-4 row-start-1 border-b border-[#EBE3D5]",
  "辰": "col-start-1 row-start-2 border-r border-b border-[#EBE3D5]",
  "酉": "col-start-4 row-start-2 border-b border-[#EBE3D5]",
  "卯": "col-start-1 row-start-3 border-r border-b border-[#EBE3D5]",
  "戌": "col-start-4 row-start-3 border-b border-[#EBE3D5]",
  "寅": "col-start-1 row-start-4 border-r border-[#EBE3D5]",
  "丑": "col-start-2 row-start-4 border-r border-[#EBE3D5]",
  "子": "col-start-3 row-start-4 border-r border-[#EBE3D5]",
  "亥": "col-start-4 row-start-4",
};

function getVernacularMinorStarsDesc(palaceName: string, minorStars: string[]): string {
  if (!minorStars || minorStars.length === 0) {
    const defaultPalaceTexts: Record<string, string> = {
      "命宮": "目前您的命宮十分平靜安穩。這代表您此時內在心靈沒有被多餘的外部雜音干擾，最適合回歸內心、傾聽心跳，靜靜思考自己真正想過的人生，按照直覺與初衷從容前行。",
      "兄弟宮": "手足朋友宮位此時無風無雨。您與同輩、密友或兄弟姊妹之間，正維持著極其健康、適度有個人空間的平和關係，無須過度迎合，彼此安靜真誠的陪伴就是最好。推薦跟久未聯繫的朋友道一聲溫暖的問候。",
      "夫妻宮": "您的情感世界天空晴朗、澄澈如洗。對感情的期盼此時不帶有沈重、患得患失的壓力。無論你身處哪種情感階段，這份「真摯純淨、彼此尊重」的精神能量，都特別適合彼此深入傾聽、分享一杯茶的和諧時光。",
      "子女宮": "這代表你跟下一代、或者是你手頭上剛起步、像小苗一般的合作創意項目，此時正處於最安穩、不需要拔苗助長的好狀態。請以極高耐心、溫潤寬容的期待，看著生命自發地開花結果。",
      "財帛宮": "您的財務蓄水池目前在一個非常平緩的休養階段，沒有煞星的暴動。最適合此時進行「財務減法」，不跟風盲目理財、不焦慮消費。安靜地存下每一筆小確幸，厚積薄發就是最踏實的富足感。",
      "疾厄宮": "身心靈與健康的宮位沒有多餘煞星或四化糾纏。這表示你的內在具有非常棒的自我療癒與調解天賦。不需要給自己施加太大壓力，今晚不妨早點休息、泡個熱水澡，你的內在自然會為你補滿元氣。",
      "遷移宮": "代表你出遠門、外出探索、或在外部人際環境中的氣場十分平安。若打算去郊外散散心、接近大自然或到新的地方旅行，一切進展都會如微光護佑般安穩順心。大膽走出去，換個天空能換個好心情！",
      "交友宮": "人際交往與社交圈此時微風徐徐、特別親切安全。身邊沒有繁雜的名利勾心鬥角，最適合在此時卸下防護心房，與一兩位能讀懂你脆弱的人聊天，在熱呼呼的咖啡香裡，享受被理解的暢快。",
      "官祿宮": "您的事業與學業天空一片平順。這在生活陪伴中意味著：現在是「修煉基本功、扎實打地基」的絕佳時機。不求一夕成名，只管默默把手邊每件日常瑣事做精緻，日後必然會收穫豐碩的驚喜果實！",
      "田宅宮": "家宅與心靈避風港此時十分安靜恬雅。家是您此刻最棒的充電站與安全傘。特別適合在這幾天動手修剪一盆花草、整理一下書桌、或單純播一首輕音樂，把日常空間布置得溫暖、舒適，福氣自然匯聚。",
      "福德宮": "您的內心深處與精神福氣此時非常知足、容易感受到微小的幸福。此時的你可以從一塊小蛋糕、一抹夕陽中，得到大大的心靈能量。請多去關注能帶給您純粹快樂的事物，與焦慮徹底和解。",
      "父母宮": "代表你與父母、長輩、上司或在你迷茫時能提攜你的長者，正處於一種淡淡的、不需要多餘包裝的自然默契之中。當遇到解不開的心事，用最誠懇、謙卑的態度去找他們聊聊，會得到意想不到的溫柔指引。"
    };
    return defaultPalaceTexts[palaceName] || "目前該宮位氣息溫和通暢、安靜無餘，適宜順其自然、保持踏實放鬆的日常生活步調。";
  }

  const lines: string[] = [];
  
  const hasHuaLu = minorStars.some(s => s.includes("化祿"));
  const hasHuaQuan = minorStars.some(s => s.includes("化權"));
  const hasHuaKe = minorStars.some(s => s.includes("化科"));
  const hasHuaJi = minorStars.some(s => s.includes("化忌"));
  
  const hasZuoYou = minorStars.some(s => s.includes("左輔") || s.includes("右弼"));
  const hasChangQu = minorStars.some(s => s.includes("文昌") || s.includes("文曲"));
  const hasKuiYue = minorStars.some(s => s.includes("天魁") || s.includes("天鉞"));
  const hasKongJie = minorStars.some(s => s.includes("地空") || s.includes("地劫"));
  const hasYangTuo = minorStars.some(s => s.includes("擎羊") || s.includes("陀羅"));
  const hasTianMa = minorStars.some(s => s.includes("天馬"));
  const hasLuCun = minorStars.some(s => s.includes("祿存"));
  const hasLuanXi = minorStars.some(s => s.includes("紅鸞") || s.includes("天喜"));

  if (hasHuaLu) {
    lines.push("🌸【化祿福氣降臨】：代表這個宮位引動了「財富滋養與美好幸運」的流動氣息！無論在此宮位求財、求感情 or 求發展，都有著事半功倍、順水推舟的極佳資源與福氣，是最具親和力與物質豐盛的星星。");
  }
  if (hasHuaQuan) {
    lines.push("⚡【化權力量彰顯】：代表你在該宮位擁有極強的「主控權、說服力與意志力」！你特別想要在此主題上做到完美精準，並掌握主導權。這股自我要求的能量，會帶給你強大的突破性，是職場/感情中不可忽視的大將之風。");
  }
  if (hasHuaKe) {
    lines.push("📖【化科才華名望】：代表你在此宮位散發著「知性、美麗與文藝天賦」！在這個領域，你給別人的第一印象會格外亮眼、條理分明。同時代表在陷入泥潭時，總會有溫柔懂事的『貴人』出現，為你撥雲見白日。");
  }
  if (hasHuaJi) {
    lines.push("🎯【化忌智慧功課】：別緊張，在諮商角度中【化忌】絕非天災煞氣，而是你今生的『特別考題』與『需要細緻耕耘的福田』。它就像一面鏡子，代表你在這個地方容易因為過度執著、在意而感到焦慮。只要願意放慢步調、溫和自我調解，這裡反而會磨練出你最深厚厚實的生命智慧與防禦力。");
  }
  if (hasZuoYou) {
    lines.push("🤝【左輔/右弼 神隊友現身】：在此宮位你不會是孤軍奮戰。你的善良親和力，會默默為你招徠極具善意的「同伴與合作夥伴」。別把所有重擔扛在一肩上，試著跟身邊的人分享，這份合夥合作的力量會讓你的路越走越寬！");
  }
  if (hasChangQu) {
    lines.push("🎨【文昌/文曲 文藝與靈性天賦】：你在此宮位擁有極佳的「美感、感性智慧與文字力量」！你在這個領域的直覺超級敏銳，非常有想像力與說故事的天分。在做重大決定時，不妨閉上眼睛聽聽內心的直覺聲音，它會非常準喔。");
  }
  if (hasKuiYue) {
    lines.push("🌟【天魁/天鉞 隱形貴人守護】：這是傳說中的天降金盞燈！代表你在這個宮位有著極佳的『長輩提攜運』。當你在人生十字路口徬徨躊躇時，不妨向信任的長輩或前輩虛心請教，往往能在茶酣耳熱之際，得到點石成金的智慧指引。");
  }
  if (hasKongJie) {
    lines.push("🌌【地空/地劫 靈感天啟與非凡思維】：代表你在這個宮位的領域裡，不適合墨守成規。空劫在諮商心理中象徵著超絕的靈界直覺與破格思維。對物質得失放寬心靈，將能量轉化為哲理、身心靈 or 天馬行空的藝術創作，能發揮出令人驚嘆的巨大潛力。");
  }
  if (hasYangTuo) {
    lines.push("🛡️【擎羊/陀羅 磨礪考驗與深刻修行】：這個宮位帶有一點點摩擦和考驗的性質。擎羊是外在的阻礙與衝勁，陀羅是內在的糾結與沉思。不用擔心，任何偉大的磨礪都是靈魂在打磨璞玉，這會教導你學會「耐心與韌性」的核心智慧。");
  }
  if (hasTianMa) {
    lines.push("🐎【天馬 驛馬奔馳與行動改變】：這是一個代表「主動改變、奔波與機會」的風系能量。在該宮位的對應主題上，多走動、多交流、勇於走向更廣闊的世界，或者是跨出原有的舒適圈，能為你帶來嶄新的生機與活力流轉。");
  }
  if (hasLuCun) {
    lines.push("🪙【祿存 穩健安守與守護護持】：這在該宮位是一盞非常祥瑞的聚光燈！它就像一個天然的安全存款格，能幫你默默抵禦宮位元氣的流失。在當前宮位的領域，請保持保守、注重長期積累、拒計高風險誘惑，安穩踏實就是你最好的風水。");
  }
  if (hasLuanXi) {
    lines.push("🌹【紅鸞/天喜 桃花好人緣與喜氣洋洋】：在這個宮位你散發著極其迷人的人和魅力！代表在該領域常有歡愉的喜慶氣氛或溫暖的人情互動，單身者有利於感性交流與結識知音，有伴者則能在此享受溫潤放鬆的情感對白。");
  }

  return lines.join("\n\n");
}

function renderFormattedMinorStars(palaceName: string, minorStars: string[]): React.ReactNode {
  const desc = getVernacularMinorStarsDesc(palaceName, minorStars);
  return renderFormattedText(desc);
}

function getStarPalaceExplanation(star: string, palaceName: string): string {
  const cleanStar = star.split("·")[0].trim();
  
  // Custom bespoke combinations for some very common ones, to make them feel 100% handcrafted!
  const customCombos: Record<string, string> = {
    "文曲_父母宮": "文曲入父母宮，代表你與父母長輩有著溫雅、斯文且感性的精神連結。父母在文學、藝術或學術上多具備一定素養，或重視感性溝通。你容易在充滿知性與關懷的家庭氛圍中薰陶長大，內心自帶細膩與美感。此外，這也暗示你求學或職場上極易吸引有文化才華的貴人長輩提攜。迷茫時找長者傾談，能得醍醐灌頂的溫柔啟發。",
    "文昌_父母宮": "文昌在父母宮，代表原生家庭具有濃厚的書香氣息、重視學規與邏輯。你的長輩長官做事有條理規矩，傾向與你講道理。這對你的學業及各種證照、文書合約考試具有絕佳的加持助力，長官通常因你行事規矩而對你十分推崇信任。",
    "文曲_命宮": "文曲星照臨命宮，自帶文雅風骨與極佳的第六感美學直覺。你心思溫潤細柔、擅長感受與說故事，一生與文字、藝術、音樂或身心靈領域緣分極深，能藉由儒雅的氣質吸引無數知音。",
    "文昌_命宮": "文昌星照臨命宮，思維縝密、行事光明磊落。你天生學習領悟力高強，非常適合在學術、專業技術、行政文書領域拔得頭籌，一生與功名、考試特別投緣。",
    "文曲_夫妻宮": "文曲在夫妻宮，代表你的情感世界追求唯美的精神共鳴與浪漫情調。另一半多才多藝、心思細柔且富有驚人的感性感染力，彼此相處甜蜜，容易擁有極佳的情感默契。",
    "文昌_夫妻宮": "文昌在夫妻宮，代表你渴望一場理智、知性、相敬如賓的良友關係。伴侶思想條理分明、重視精神交往。兩人在生活中常能成為彼此學術與事業上最好的輔佐謀士。",
  };

  const key = `${cleanStar}_${palaceName}`;
  if (customCombos[key]) {
    return customCombos[key];
  }

  // Fallback to dynamic, highly context-aware rule-based generator
  // Palace descriptions
  let palaceAspect = "";
  switch(palaceName) {
    case "命宮": palaceAspect = "代表您天生的基本性格、初心理想與內在氣度。"; break;
    case "兄弟宮": palaceAspect = "代表您早期同輩夥伴、核心同舟戰友與親密知己圈。"; break;
    case "夫妻宮": palaceAspect = "代表您對婚姻親密關係的心理期待、和伴侶相處細節。"; break;
    case "子女宮": palaceAspect = "代表您的生命創造力結晶、晚輩、弟子培育與傳承項目。"; break;
    case "財帛宮": palaceAspect = "代表您支配物資金錢的流動模式、理財安全感與手段。"; break;
    case "疾厄宮": palaceAspect = "代表您的身體神殿狀態、生理抗壓性與隱秘潛意識海。"; break;
    case "遷移宮": palaceAspect = "代表您推開家門走向外部世界、旅外涉足與公眾緣分。"; break;
    case "交友宮": palaceAspect = "代表您廣大朋友圈、社會群眾擁護、客戶部屬關係。"; break;
    case "官祿宮": palaceAspect = "代表您的事業天天命志向、學業工作作風與奉獻卓越處。"; break;
    case "田宅宮": palaceAspect = "代表您的居住家宅氣場、不動產儲納能力與家和避風港。"; break;
    case "福德宮": palaceAspect = "代表您的心靈自我歸宿、隱形善因造化與精神安適領域。"; break;
    case "父母宮": palaceAspect = "代表原生家庭父母、提攜長官上司、制度保護與文書考運。"; break;
    default: palaceAspect = "代表您對應的人生生命範疇。";
  }

  // Star core descriptions
  let starVibe = "";
  switch(cleanStar) {
    case "紫微":
      starVibe = "【紫微星】是北斗帝王至尊星，象徵高貴、格局與頂尖追求。此星在此意味著該範疇中您總擁有較高的標準，容易被具權威、有格局的力量引導，但有時會太在意顏面或顯得有些冷峻。";
      break;
    case "天機":
      starVibe = "【天機星】是智多星，象徵靈敏、思考、技術與求變。此星在此代表該領域充滿了智慧的波動與創意流轉，思想與動向隨時因環境而調整，適合依理智策劃，但要防範思慮過度。";
      break;
    case "太陽":
      starVibe = "【太陽星】是奉獻星宿，代表大氣、名譽、陽光與照耀。此星在此說明該領域具有極大熱情，行事坦蕩，能得到巨大的正面曝光與貴人照耀，但要注意不要因過度奉獻而感到疲憊。";
      break;
    case "武曲":
      starVibe = "【武曲星】是財星戰士，象徵決斷、剛毅與務實幹練。此星將高度的執行力與條理紀律帶進此領域。在此您通常採取實打實的作風，用實質行動解決阻礙，但有時在情感上顯得直板。";
      break;
    case "天同":
      starVibe = "【天同星】是長壽福曜，代表溫柔、童心與生活享受。此星帶來一種隨遇而安、和氣生財的溫和美感。代表此處凡事能化險為夷，極富人情味，但也要小心流於缺少主動改變的衝勁。";
      break;
    case "廉貞":
      starVibe = "【廉貞星】是公關重臣與艺术曜，代表專注、風骨傲氣與信用。此星帶來極強的美感直覺與信用義氣，在此範疇中您做事有自我原則，長袖善舞、直覺敏銳，但也伴隨著較強的內心執念。";
      break;
    case "天府":
      starVibe = "【天府星】是國庫守成之珍，象徵寬厚包容、穩健托底與保全儲留。此星在此處宛若一個安穩的核心，能化解干擾，大度守護，代表重視安穩守成、穩紮穩打，做事底氣十足。";
      break;
    case "太陰":
      starVibe = "【太陰星】是溫柔水象月光，象徵母愛、美感涵養、細水長流。此星在此能舒緩干擾與壓力，帶來極高層次的智慧美學、平靜美好的運行軌跡，有著細水長流、默默富實的成效。";
      break;
    case "貪狼":
      starVibe = "【貪狼星】是才藝社交星，象徵求知欲好奇心、人緣磁場與靈性開悟。此星說明該領域具有極佳的靈活度與人際魅力。你在此處涉獵廣泛，後半生極易在此範疇中悟出很深的心靈或身心靈智慧。";
      break;
    case "巨門":
      starVibe = "【巨門星】是研究分析之門，象徵口才表達、深度質疑與研究。此星代表您在此主題上觀察力驚人、分析透徹，能憑言辭或專業技能服人，但有時在此範疇容易因過度在意而略有口舌摩擦。";
      break;
    case "天相":
      starVibe = "【天相星】是信用掌印曜，象徵體面協調、正直承諾與口碑。此星說明該範疇極重規律與信義，你待人正直周到、追求和諧平衡，能在該主題中憑藉良好的雙贏信用贏得長久口碑。";
      break;
    case "天梁":
      starVibe = "【天梁星】是長者庇佑大樹，象徵慈悲仁德、逢凶化吉。每逢此宮位有何不順，必有不可思議的貴人或神妙契機從天而降，教你度過難關，極具儒家溫厚風範與助人精神。";
      break;
    case "七殺":
      starVibe = "【七殺星】是開疆將軍，代表孤勇突破、大刀闊斧變革。能量充滿爆發力。你不妥協、不怕難，能抗衡極高壓力的事業或生活變遷，在磨礪中獲得巨大成果，就是需要多一份柔和去中和心氣。";
      break;
    case "破軍":
      starVibe = "【破軍星】是先鋒改革之曜，代表浴火重生與顛覆打破常規。這意味著該部分人生主題具有極強的探索性與戲劇轉動。敢想敢做，適合依靠新觀念、前衛形式進行反轉突破，大有可為。";
      break;
    case "文昌":
      starVibe = "【文昌星】代表書香翰墨。在此宮位，能顯著提升該範疇的合約安全、文書合約運勢與學業考試。行事條理清明、有理智學養。";
      break;
    case "文曲":
      starVibe = "【文曲星】代表感性文藝與直覺才情。代表此領域具有極高的美感和第六感，極富同理心。能靠才華演繹、口才或溫潤的情感在該領域輕鬆贏得尊崇。";
      break;
    case "左輔":
    case "右弼":
      starVibe = "【左輔/右弼】代表神隊友在側。說明此領域您絕非一人戰鬥！總能吸引極具善意的夥伴、平輩同道或隱形貴人，為你多管齊下提供強大的實質臂膀。";
      break;
    case "天魁":
    case "天鉞":
      starVibe = "【天魁/天鉞】代表天降玉官與尊貴貴人。是命中極亮的光芒，代表每臨卡點必有社會地位高、具足資源的長官、長輩或前輩挺身而出，為你提供渠道和有力援助。";
      break;
    case "祿存":
      starVibe = "【祿存星】是天生的保險基石，代表保守守護與積存安全。行事愈低調務實、愈能把好運和資產聚集，為生命打造一個抵禦一切風暴的銅牆鐵壁。";
      break;
    case "擎羊":
    case "陀羅":
      starVibe = "【擎羊/陀羅】是意志力的打磨印記。代表在此領域會面臨客觀考驗衝勁、或是主觀上的反覆糾結沉思。這是在錘煉靈魂，使其愈加堅硬璀璨，培養高超的沉著與功底。";
      break;
    case "地空":
    case "地劫":
      starVibe = "【地空/地劫】是自由超脫之翼。在此不宜落入俗套。若看淡世俗之物，全心發揮在跨界創意、玄學禪修、神祕思維 or 天馬行空的先鋒藝術中，反而能大放驚人的奇彩。";
      break;
    case "天馬":
      starVibe = "【天馬星】是動態神行驛馬。此能量宜動不宜靜。越是多走動、出門差旅、求新求變，你在此範疇中能活化的機緣和生財渠道就越多，奔馳通達。";
      break;
    case "紅鸞":
    case "天喜":
      starVibe = "【紅鸞/天喜】是桃花好緣分與喜氣，自帶溫軟的吸引磁場。代表該領域總是充滿了溫醇的人和、開心慶祝與好玩交流，特別有利於與他人進行心與心的溫馨交流。";
      break;
    case "化祿":
      starVibe = "【化祿】代表福份流注。此時此地注入了圓滿順意與福氣。賺取財富 or 追求事物時具有事半功倍、和氣生財的貴人機遇，最是富庶寬心。";
      break;
    case "化權":
      starVibe = "【化權】代表極強的主導力與主控意願。在該主題上你自尊心重、要求盡善盡美，並傾向牢牢掌握控制權。這帶來了強悍的執行力與開創力。";
      break;
    case "化科":
      starVibe = "【化科】代表名望才德與撥雲見白。在學業、文書工作或名譽上容易獲得清明的讚許。遭遇任何窒礙瓶頸時，總會有懂你的貴人出面解圍，逢凶化吉。";
      break;
    case "化忌":
      starVibe = "【化忌】代表今生的心靈修行功課。對待此範疇容易過於關注與執著、徒增煩惱。放鬆自省，不急於自證，這片福田反而會打磨出你最深重的定力。";
      break;
    default:
      starVibe = `【${cleanStar}星】為該領域引入了一股專屬的能量，宜遵循自然律動、謙和積功。`;
  }

  return `${palaceAspect}${starVibe}`;
}

interface ChartCustomDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  selectedYearIdx?: number;
}

const ChartCustomDot = (props: ChartCustomDotProps) => {
  const { cx, cy, index, selectedYearIdx } = props;
  if (cx === undefined || cy === undefined || index === undefined) return null;
  const isActive = index === selectedYearIdx;
  
  return (
    <g>
      {/* Background soft glowing wave when active */}
      {isActive && (
        <motion.circle
          key={`ripple-${selectedYearIdx}-${index}`}
          initial={{ scale: 0.8, opacity: 0.35 }}
          animate={{ scale: [1, 1.45, 1.9], opacity: [0.35, 0.15, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          cx={cx}
          cy={cy}
          r={9}
          fill="#8C7A6B"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            pointerEvents: "none",
          }}
        />
      )}
      {/* Dynamic point with smooth transitions on fill, size, stroke and opacity */}
      <motion.circle
        key={`dot-${selectedYearIdx}-${index}`}
        initial={{ opacity: 0.25, scale: 0.75 }}
        animate={{ 
          opacity: isActive ? 1 : 0.65, 
          scale: isActive ? [0.85, 1.18, 1] : 1,
          r: isActive ? 7.5 : 4.5
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        cx={cx}
        cy={cy}
        fill={isActive ? "#8C7A6B" : "#FAF9F5"}
        stroke="#8C7A6B"
        strokeWidth={isActive ? 2.5 : 1.5}
        style={{
          cursor: "pointer",
        }}
      />
      {/* A small elegant white center point if active */}
      {isActive && (
        <motion.circle
          key={`center-${selectedYearIdx}-${index}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          cx={cx}
          cy={cy}
          r={2}
          fill="#FFFFFF"
          style={{
            pointerEvents: "none"
          }}
        />
      )}
    </g>
  );
};

export default function App() {
  const [formData, setFormData] = useState({
    name: "",
    gender: "女 (坤造)",
    birthDate: "1995-10-24", // 預設值
    birthHour: "12",          // 預設12點
    birthMinute: "30",
    birthPlace: "台灣台北市",
    focusArea: "綜合人生"
  });

  // 從 formData.birthDate 拆解西元年月日的狀態，並保證其連動性
  const [birthYear, birthMonth, birthDay] = React.useMemo(() => {
    const parts = formData.birthDate.split("-");
    if (parts.length === 3) {
      return [parts[0], parts[1], parts[2]];
    }
    return ["1995", "10", "24"];
  }, [formData.birthDate]);

  const handleDatePartChange = (part: 'year' | 'month' | 'day', val: string) => {
    let y = birthYear;
    let m = birthMonth;
    let d = birthDay;
    if (part === 'year') y = val;
    else if (part === 'month') m = val;
    else if (part === 'day') d = val;
    
    // 限制日期不會超出當月的最大天數 (比如切換月份為 2 月時，將 31 日自動限制為實際天數)
    const nextMaxDays = new Date(parseInt(y), parseInt(m), 0).getDate();
    if (parseInt(d) > nextMaxDays) {
      d = String(nextMaxDays).padStart(2, "0");
    }

    setFormData(prev => ({
      ...prev,
      birthDate: `${y}-${m}-${d}`
    }));
  };

  const yearOptions = React.useMemo(() => {
    const yrs = [];
    for (let y = 1940; y <= 2026; y++) {
      yrs.push(String(y));
    }
    return yrs; // 年份由 1940 往下排列
  }, []);

  const daysInMonth = React.useMemo(() => {
    const y = parseInt(birthYear) || 1995;
    const m = parseInt(birthMonth) || 10;
    return new Date(y, m, 0).getDate();
  }, [birthYear, birthMonth]);

  const dayOptions = React.useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [daysInMonth]);

  // 計算與加載狀態 state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<FortuneResult | null>(null);

  // 當前選中的紫微宮位 (供點擊查看詳細解析)
  const [selectedPalace, setSelectedPalace] = useState<ZiweiPalace | null>(null);
  const [palaceSubTab, setPalaceSubTab] = useState<"talent" | "sanfang">("sanfang");
  const [mobilePalaceMode, setMobilePalaceMode] = useState<"tabs" | "list">("tabs");

  // 每日心靈解牌一籤狀態
  const [drawnOracleCard, setDrawnOracleCard] = useState<OracleCard | null>(null);
  const [isOracleShuffling, setIsOracleShuffling] = useState(false);
  const [isOracleFlipped, setIsOracleFlipped] = useState(false);

  // 科技紫微極致詳批付費與解鎖狀態
  const [isPremiumUnlocked, setIsPremiumUnlocked] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayMethod, setSelectedPayMethod] = useState<"line-pay" | "credit-card" | "apple-pay" | "coins-pay">("line-pay");
  const [coinsBalance, setCoinsBalance] = useState(50);
  const [payStep, setPayStep] = useState(0); // 0: select/pay, 1: processing, 2: success
  const [payStatusText, setPayStatusText] = useState("");
  const [cardNo, setCardNo] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  // 每日運勢分析狀態
  const [activeRightTab, setActiveRightTab] = useState<"oracle" | "daily-fortune">("oracle");
  const [guestDailyName, setGuestDailyName] = useState("");
  const [guestDailyShengxiao, setGuestDailyShengxiao] = useState("鼠");

  // 每日運勢提醒設定狀態
  const [dailyNotificationEnabled, setDailyNotificationEnabled] = useState(false);
  const [dailyNotificationTime, setDailyNotificationTime] = useState("08:30");
  const [dailyNotificationChannels, setDailyNotificationChannels] = useState({
    luckyColor: true,
    advice: true,
    summary: false
  });
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // 觸發自定義瀏覽器通知與 Toast 雙軌提示
  const triggerFortuneToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      triggerFortuneToast("⚠️ 您的瀏覽器不支援 Web Notification，已自動啟用內置心靈浮窗提醒！");
      setDailyNotificationEnabled(true);
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        triggerFortuneToast("🎉 成功許可瀏覽器通知權限！每日晨間將為您投遞幸運氣息。");
        setDailyNotificationEnabled(true);
      } else {
        triggerFortuneToast("⚠️ 通知權限已被拒絕。微光小庵已為您自動啟用精緻「內置心靈浮窗提示」。");
        setDailyNotificationEnabled(true);
      }
    } catch (err) {
      triggerFortuneToast("⚠️ 申請權限異常或瀏覽器沙箱限制，已切換至「內置心靈浮窗」保障提醒。");
      setDailyNotificationEnabled(true);
    }
  };

  const handleTestSendNotification = () => {
    const title = `🔮 微光星軌 ‧ 幸運送達`;
    let bodyElements = [];
    if (dailyNotificationChannels.luckyColor && activeDailyFortune?.luckyColor) {
      bodyElements.push(`今日幸運色：${activeDailyFortune.luckyColor}`);
    }
    if (dailyNotificationChannels.advice && activeDailyFortune?.adviceDo?.[0]) {
      bodyElements.push(`開運建議：${activeDailyFortune.adviceDo[0]}`);
    }
    if (dailyNotificationChannels.summary) {
      bodyElements.push(activeDailyFortune?.summary || "");
    }
    
    const body = bodyElements.join(" | ") || `今日宜保持謙和與感恩之意。`;
    
    let hasGrantedPermission = false;
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        hasGrantedPermission = Notification.permission === "granted";
      } catch (e) {
        console.warn("Could not check Notification permission:", e);
      }
    }

    if (hasGrantedPermission) {
      try {
        new Notification(title, {
          body: body,
          icon: "/favicon.ico"
        });
        triggerFortuneToast("✨ 瀏覽器通知已推播，請查看系統通知欄或鎖定畫面！");
      } catch (err) {
        triggerFortuneToast(`🔔 [心靈推送] ${title}\n${body}`);
      }
    } else {
      triggerFortuneToast(`🔔 [模擬通知] ${title}\n${body}`);
    }
  };
  const [isDailyCalculating, setIsDailyCalculating] = useState(false);
  const [guestDailyFortuneResult, setGuestDailyFortuneResult] = useState<DailyFortune | null>(() => {
    return generateDailyFortuneData("有緣人", "鼠", "四綠木星", new Date());
  });

  // 當使用者在左側輸入姓名時，貼心地自動同步給每日運勢，免去重複打字的負擔
  useEffect(() => {
    if (formData.name) {
      setGuestDailyName(formData.name);
    }
  }, [formData.name]);

  // 當主起盤結果出爐時，會自動計算最高精緻度的今日個人化運勢
  const activeDailyFortune = React.useMemo(() => {
    if (result) {
      return generateDailyFortuneData(
        result.personalInfo.name || "有緣人",
        result.personalInfo.shengxiao || "鼠",
        result.kyusei?.yearStar?.name || "四綠木星",
        new Date()
      );
    }
    return guestDailyFortuneResult || generateDailyFortuneData("有緣人", "鼠", "四綠木星", new Date());
  }, [result, guestDailyFortuneResult, guestDailyName, guestDailyShengxiao]);

  const handleCalculateGuestDaily = () => {
    setIsDailyCalculating(true);
    setTimeout(() => {
      const data = generateDailyFortuneData(
        guestDailyName || "有緣人",
        guestDailyShengxiao,
        "五黃土星",
        new Date()
      );
      setGuestDailyFortuneResult(data);
      setIsDailyCalculating(false);
    }, 1100);
  };

  // 時空開運時鐘狀態
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleDrawOracleCard = () => {
    setIsOracleShuffling(true);
    setIsOracleFlipped(false);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * ORACLE_CARDS.length);
      setDrawnOracleCard(ORACLE_CARDS[randomIndex]);
      setIsOracleShuffling(false);
    }, 1000);
  };

  // 獲取當前結果中對應選中名稱的宮位，避免異步狀態滯後
  const activePalace = React.useMemo(() => {
    if (!result) return null;
    return result.ziweiPalaces.find((p) => p.name === selectedPalace?.name) || result.ziweiPalaces.find((p) => p.name === "命宮") || result.ziweiPalaces[0];
  }, [result, selectedPalace]);

  // 計算選中宮位之三方四正格局
  const sfsz = React.useMemo(() => {
    if (!result || !activePalace) return null;
    return calculateSanFangSiZheng(activePalace.name, result.ziweiPalaces);
  }, [result, activePalace]);

  // 報告選中分頁 state
  const [activeTab, setActiveTab] = useState<string>("personality");

  // 決策過濾網子分頁 state ("career", "love", "wealth")，預設顯示 "love" (雙星合盤)
  const [decisionSubTab, setDecisionSubTab] = useState<string>("love");

  // 未來五年運勢走向折線圖選中的年份索引
  const [selectedYearIdx, setSelectedYearIdx] = useState<number>(0);

  // 當結果更新時，重置選中年份指標，確保同步
  useEffect(() => {
    setSelectedYearIdx(0);
  }, [result]);

  // 計算未來五年運勢走向折線圖數據 (2026-2030)
  const futureData = React.useMemo(() => {
    if (!result) return [];
    
    // 依據姓名、命主、九星本命星等生成完全確定穩定的隨機偏置
    const nameStr = result.personalInfo.name || "";
    const nameHash = nameStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mingZhuStr = result.personalInfo.mingZhu || "";
    const mingZhuHash = mingZhuStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const yearStarName = result.kyusei?.yearStar?.name || "1";
    const yearStarNum = parseInt(yearStarName) || 5;
    const baseRating = result.aiAnalysis.fateRating || 80;

    return [2026, 2027, 2028, 2029, 2030].map((yr, idx) => {
      const seed = nameHash + mingZhuHash + yr * (idx + 1) + yearStarNum;
      const offset = (seed % 21) - 10; // -10 to +10 偏置
      const rating = Math.min(96, Math.max(58, baseRating + offset));

      let theme = "守成沉潛";
      let desc = "";
      let starVibe = "";
      const mod = seed % 5;
      
      if (mod === 0) {
        theme = "歲水調和 · 溫和修身";
        desc = "在此時空波段，歲月氣感最為恬靜，如清泉入池。適合採取靜美守成的策略，放慢日常壓力步伐，給予感知系統充足的休息防禦。在此年，睡眠調理與溫和散步是最好的開運方法，亦可在工作桌上擺放一盞暖黃小燈照亮深夜。";
        starVibe = "💧 坎水靜凝 · 休養潤心";
      } else if (mod === 1) {
        theme = "星耀高照 · 創意勃發";
        desc = "您本命星的靈感微光高高升起，星系磁場對思想展現了極強的催化！此時利於開展寫作、設計、心理探索或新企劃的小斜槓，您的才華文字與創意巧思極易觸及他人靈魂。這是一段「主動展現智慧、傳遞光芒」的絕佳創造期。";
        starVibe = "🌟 離火高懸 · 才情盛放";
      } else if (mod === 2) {
        theme = "山澤通氣 · 貴人相助";
        desc = "身邊將有志同道合的心靈旅伴攜手漫步，人際流動芬芳溫厚。這一年也是絕妙的「良師益友聚柴期」，您在低谷時能輕易獲得前輩親切的提攜與點醒。以謙遜隨和的筆觸行事，這種善意的雙向能量會呈指數級別反饋好運。";
        starVibe = "⛰️ 艮山護照 · 提攜扶持";
      } else if (mod === 3) {
        theme = "微光積柴 · 財富固守";
        desc = "星軌指向「踏實固收」的核心主旋律。此時不宜採取過於冒險、激進的投資策略，而是將力量專注於中和現有基業、培育穩健儲蓄的安全感。多添置一些原色器物或木質盆栽，能在這一年最大底限保護財富流動的踏實感。";
        starVibe = "🪙 乾金凝瑞 · 金玉守心";
      } else {
        theme = "巽風起舞 · 溫馨相遇";
        desc = "身心愉悅、人緣情誼豐沛和煦的一年。在九星與紫微桃花氣韻的調和下，您的親和力格外顯著。單身有緣人能水到傳承般建立深厚信賴；有伴侶者則極易在日常沏茶、踏青的平淡片段中，感受極度和諧的浪漫細水。";
        starVibe = "🌳 巽木和煦 · 緣分和美";
      }

      return {
        year: String(yr),
        rating: rating,
        theme: theme,
        desc: desc,
        starVibe: starVibe
      };
    });
  }, [result]);

  // PDF 模板流年運勢趨勢坐標計算
  const pdfCoordinates = React.useMemo(() => {
    if (!result || !futureData || futureData.length === 0) return { path: "", points: [] };
    const width = 640;
    const height = 150;
    const paddingX = 60;
    const stepX = (width - paddingX * 2) / 4; // Spacing for 5 points
    
    // Ratings are between 40 and 100
    const points = futureData.map((d, idx) => {
      const x = paddingX + idx * stepX;
      // Map rating 40..100 to y heights 120..20
      const rating = d.rating;
      const y = 115 - ((rating - 40) / 60) * 85;
      return { x, y, year: d.year, rating: d.rating, theme: d.theme, starVibe: d.starVibe };
    });
    
    // Create straight lines
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return { path, points };
  }, [result, futureData]);

  // 追問對話 state
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 條款與隱私安全 state (預設勾選，提供更直覺順暢的排盤體驗)
  const [isAgreedToTerms, setIsAgreedToTerms] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // 進階星盤數據摺疊
  const [showAdvancedData, setShowAdvancedData] = useState(true);

  // 門檻與關鍵決策軍師專用狀態
  const [decisionCareerRole, setDecisionCareerRole] = useState("");
  const [decisionCareerType, setDecisionCareerType] = useState<"careerChange" | "startup">("careerChange");
  const [isCalculatingCareer, setIsCalculatingCareer] = useState(false);
  const [decisionCareerResult, setDecisionCareerResult] = useState<any>(null);
  const [isCareerUnlocked, setIsCareerUnlocked] = useState(false);

  const [decisionLovePartner, setDecisionLovePartner] = useState("");
  const [decisionLoveRole, setDecisionLoveRole] = useState("曖昧對象");
  const [decisionLoveShengxiao, setDecisionLoveShengxiao] = useState("鼠");
  const [decisionLovePartnerBirthDate, setDecisionLovePartnerBirthDate] = useState("1998-05-20");
  const [decisionLovePartnerBirthHour, setDecisionLovePartnerBirthHour] = useState("午時 (11:00-13:00)");
  const [isCalculatingLove, setIsCalculatingLove] = useState(false);
  const [decisionLoveResult, setDecisionLoveResult] = useState<any>(null);
  const [isLoveUnlocked, setIsLoveUnlocked] = useState(false);

  const [decisionWealthProject, setDecisionWealthProject] = useState("");
  const [decisionWealthBudget, setDecisionWealthBudget] = useState("medium");
  const [decisionWealthPartnerZodiac, setDecisionWealthPartnerZodiac] = useState("none");
  const [decisionWealthDirection, setDecisionWealthDirection] = useState("none");
  const [isCalculatingWealth, setIsCalculatingWealth] = useState(false);
  const [decisionWealthResult, setDecisionWealthResult] = useState<any>(null);
  const [isWealthUnlocked, setIsWealthUnlocked] = useState(false);
  const [selectedWealthMonth, setSelectedWealthMonth] = useState<number>(1);

  // 支付虛擬收銀台狀態
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<"career" | "love" | "wealth" | null>(null);
  const [paymentPrice, setPaymentPrice] = useState(30);
  const [paymentTitle, setPaymentTitle] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // 決策計算邏輯
  const handleCalculateCareerDecision = () => {
    if (!decisionCareerRole.trim()) return;
    setIsCalculatingCareer(true);
    setDecisionCareerResult(null);
    setIsCareerUnlocked(false);

    setTimeout(() => {
      // 根據目標稱呼/職能生成穩定的數值
      const charCodeSum = decisionCareerRole.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const winRate = 62 + (charCodeSum % 28);
      const optimalMonth = (charCodeSum % 12) + 1;
      const riskMonth = ((optimalMonth + 4) % 12) + 1;

      // 檢查本命官祿宮
      let palaceFeature = "天同星與天喜";
      if (result && result.ziweiPalaces) {
        const guanLu = result.ziweiPalaces.find((p) => p.name === "官祿宮");
        if (guanLu && guanLu.majorStars.length > 0) {
          palaceFeature = guanLu.majorStars.join("、");
        }
      }

      setDecisionCareerResult({
        winRate,
        palaceFeature,
        optimalMonths: `農曆 ${optimalMonth} 月、${(optimalMonth + 2) % 12 || 12} 月`,
        riskMonths: `農曆 ${riskMonth} 月`,
        analysis: `針對您輸入的「${decisionCareerRole}」方向，我們精密觀察您的【官祿宮】與【財帛宮】星曜配合（主星為：${palaceFeature}）。目前格局呈現${winRate >= 80 ? "『紫微照臨、吉盤開泰』的強大上揚波段" : "『潛龍蛰伏、厚積柴薪』的平穩沉潛格局"}。此抉擇整體勝率達 ${winRate}% 。但在實踐時需要注意：${decisionCareerType === "startup" ? "新創事業初期財源容易有虛火空出之象，且合夥人存在些許溝通死角。" : "新職務接軌期前三個月，周邊易出現『口舌或責任轉移』等磨合摩擦。"}`
      });
      setIsCalculatingCareer(false);
    }, 1200);
  };

  const handleCalculateLoveDecision = () => {
    if (!decisionLovePartner.trim()) return;
    setIsCalculatingLove(true);
    setDecisionLoveResult(null);
    setIsLoveUnlocked(false);

    setTimeout(() => {
      // 1. 自動根據對方出生年份算出對方生肖
      const pYear = parseInt(decisionLovePartnerBirthDate.split("-")[0]) || 1998;
      const zodiacs = ["鼠", "牛", "虎", "兔", "龍", "蛇", "馬", "羊", "猴", "雞", "狗", "豬"];
      const calculatedZodiac = zodiacs[Math.abs(pYear - 1900) % 12];

      const charCodeSum = decisionLovePartner.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const compScore = 65 + (charCodeSum % 31); // 65% - 95% 更加正面和美滿的感應
      
      // 2. 依據姓名長度與時辰，隨機產生或映射出對方的紫微星曜格局，達到極佳的儀式質感
      const partnerStars = [
        "太陽・天梁雙星", "紫微・天相守命", "武曲・貪狼同行", "天府獨坐中天", 
        "同梁水木共鳴", "天機・太陰會合", "巨門化權獨特格局", "廉貞・七殺雄宿朝垣"
      ];
      const partnerStar = partnerStars[charCodeSum % partnerStars.length];

      let spouseFeature = "太陰星";
      if (result && result.ziweiPalaces) {
        const spousePalace = result.ziweiPalaces.find((p) => p.name === "夫妻宮");
        if (spousePalace && spousePalace.majorStars.length > 0) {
          spouseFeature = spousePalace.majorStars.join("、");
        }
      }

      // 3. 生成性格互補 (complementaryAnalysis)
      const complementaryAnalysis = `您本命夫妻宮守護星曜主要為：【${spouseFeature}】，性格對情感有著高雅且細緻的期望。比對發現，雙方星象的感應度高達 ${compScore}%！「${decisionLovePartner}」命盤格局主星偏向【${partnerStar}】，屬生肖【${calculatedZodiac}】。在星軌氣場上，${compScore >= 80 ? "雙方完美形成『金水相生、互為光熱』的格局，這是不需要太多言語就能心領神會的深度契合" : "雙方性格一陰一陽、一動一靜，剛好在日常瑣事中互補長短，能形成極佳的生命伴侶搭配"}。`;

      // 4. 生成溝通盲點 (communicationBlindSpot)
      const communicationBlindSpot = `對方的出生時辰為【${decisionLovePartnerBirthHour}】，時支能量微洩。兩人在日常相處中，最需提防【${decisionLovePartnerBirthHour.slice(0,2)}】時段的負性磁場磨合：
1. 「溝通隔閡線」：您傾向以和為貴，偶爾將不滿藏在心裡；而對方性格有主見、不善軟化，這容易引發彼此用無言或冷淡來代替深度溝通。
2. 「期望值的隱形落差」：您在關係中需要更具體的承諾與柔性的關照，但對方在忙碌或壓力大時容易表現出隨意或忽冷忽熱，這極易點燃您的安全感紅線。`;

      // 5. 生成相處的最佳開運方式 (optimalFortuneAdvice)
      const optimalFortuneAdvice = `【雙向開運與中和儀式】：
1. 顏色調和：建議在共同出遊或重要溝通時，多搭配「暖陽黃、奶白色、或藕粉色」的衣服或生活配飾，可有效溫柔化解雙方盤局中的巨門、擎羊暗忌。
2. 空間開運：可在雙方常處空間的「生氣方位（綠植處）」放置一件精緻的水晶擺飾。
3. 開運溝通秘訣：每當感受氣氛膠著時，牢記最能化敵為友、打破僵局的開運口訣：「先作肯定，後留餘地」，能瞬間讓對方的星盤防備能量消減。`;

      setDecisionLoveResult({
        compScore,
        partnerZodiac: calculatedZodiac,
        partnerStar,
        spouseFeature,
        complementaryAnalysis,
        communicationBlindSpot,
        optimalFortuneAdvice,
        analysis: `當前合盤結果出爐：您與「${decisionLovePartner}」的時空愛情感應值為 ${compScore}% ，本命夫妻宮星曜主要為：【${spouseFeature}】。鑑定發現此段緣分在「${decisionLoveRole}」角色交互中，性格相性穩定度偏向 ${compScore >= 75 ? "高度默契，能成日常良伴" : "磨合期偏長，容易有互猜和不安全感"}。`
      });
      setIsCalculatingLove(false);
    }, 450); // 縮短載入等待時間至 snappy 的 450ms
  };

  const handleCalculateWealthDecision = () => {
    if (!decisionWealthProject.trim()) return;
    setIsCalculatingWealth(true);
    setDecisionWealthResult(null);
    setIsWealthUnlocked(false);

    setTimeout(() => {
      const charCodeSum = decisionWealthProject.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const stabilityScore = 45 + (charCodeSum % 46);
      const hazardMonth1 = (charCodeSum % 11) + 1;
      const hazardMonth2 = ((hazardMonth1 + 3) % 12 || 12);
      const luckyMonth1 = ((hazardMonth1 + 5) % 12 || 12);
      const luckyMonth2 = ((hazardMonth1 + 9) % 12 || 12);

      let caiBoFeature = "武曲、天馬、祿存";
      if (result && result.ziweiPalaces) {
        const caiBo = result.ziweiPalaces.find((p) => p.name === "財帛宮");
        if (caiBo && caiBo.majorStars.length > 0) {
          caiBoFeature = caiBo.majorStars.join("、");
        }
      }

      // 產生12個流月的流年行氣圖數據
      const monthsData = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const isPitfall = m === hazardMonth1 || m === hazardMonth2;
        const isLucky = m === luckyMonth1 || m === luckyMonth2;
        
        let status: "safe" | "caution" | "danger" = "caution";
        let score = 50 + (charCodeSum + m * 7) % 25;
        
        if (isPitfall) {
          status = "danger";
          score = 15 + (charCodeSum + m * 3) % 20;
        } else if (isLucky) {
          status = "safe";
          score = 80 + (charCodeSum + m * 5) % 18;
        }

        const adviceMap: Record<string, string> = {
          danger: `農曆 ${m} 月正逢煞星【大耗、天空】交沖。氣場極度不穩，進行「${decisionWealthProject}」在此月易生突發糾紛，或臨時合約違約，此月不宜有任何資金調度動作。`,
          safe: `農曆 ${m} 月逢【祿存、化祿】照臨。財氣磁場強旺，最適合進行「${decisionWealthProject}」的購買、大筆資金入賬、或分批點對點進場配置。`,
          caution: `農曆 ${m} 月財帛流月相持平。整體風險在中等範圍，進場以穩健防守為主。切忌使用大額槓桿或盲目跟風。`
        };

        const premiumMap: Record<string, string> = {
          danger: `🔥 避坑化解祕功：建議於農曆 ${m} 月初一，在住宅西北方位擺放「一盞白瓷盛裝的粗鹽水」，有助吸納五行燥土之煞氣。若須商簽，吉時首選「辰時」(07:00-09:00)。`,
          safe: `🎯 奇門狙擊吉日：此月最吉天干為「甲、己」之日，於農曆初八或廿二的「巳時」(09:00-11:00) 交易大吉，引財入庫。`,
          caution: `🧭 穩守方位：此月適合將合約與決策權交由生肖屬「牛、雞」之貴人代為勘考。忌與生肖相沖者合資。`
        };

        return {
          month: m,
          score,
          status,
          advice: adviceMap[status],
          premiumAdvice: premiumMap[status],
        };
      });

      // 1. 生肖合盤計算
      let partnerAffinityScore = 100;
      let relationName = "";
      let partnerAdvice = "";
      let partnerPremiumAdvice = "";

      if (decisionWealthPartnerZodiac !== "none") {
        // 十二生肖關係：六合、三合、六衝
        // 六合：鼠-牛, 虎-豬, 兔-狗, 龍-雞, 蛇-猴, 馬-羊
        const sixHarMap: Record<string, string> = {
          "鼠": "牛", "牛": "鼠", "虎": "豬", "豬": "虎", "兔": "狗", "狗": "兔",
          "龍": "雞", "雞": "龍", "蛇": "猴", "猴": "蛇", "馬": "羊", "羊": "馬"
        };
        // 三合：申子辰(猴鼠龍)，寅午戌(虎馬狗)，亥卯未(豬兔羊)，巳酉丑(蛇雞牛)
        const groups = [
          ["猴", "鼠", "龍"], ["虎", "馬", "狗"], ["豬", "兔", "羊"], ["蛇", "雞", "牛"]
        ];
        // 六衝：鼠-馬, 牛-羊, 虎-猴, 兔-雞, 龍-狗, 蛇-豬
        const clashMap: Record<string, string> = {
          "鼠": "馬", "馬": "鼠", "牛": "羊", "羊": "牛", "虎": "猴", "猴": "虎",
          "兔": "雞", "雞": "兔", "龍": "狗", "狗": "龍", "蛇": "豬", "豬": "蛇"
        };

        const myZodiac = result?.personalInfo?.shengxiao || "龍"; // 預設

        if (sixHarMap[myZodiac] === decisionWealthPartnerZodiac) {
          partnerAffinityScore = 95 + (charCodeSum % 5);
          relationName = "命定六合 ‧ 天爵貴人 🌟";
          partnerAdvice = `您與共同決策人【${decisionWealthPartnerZodiac}】相配為「六合配對」，雙方互為理財神助攻。在投資「${decisionWealthProject}」時能夠分工明確，一個擅長挖掘機會，一個擅長踩煞車，大幅削減流月破財概率。`;
          partnerPremiumAdvice = `💖 雙人補運奇門心法：建議雙方在進行合約商簽或看房面談時，由生肖屬【${decisionWealthPartnerZodiac}】之人代表主動遞交名片或簽字印鑑，並在右手腕佩戴一條「紅繩綠瑪瑙」以引發木火生財之局，能使成交價折讓或避開合約隱形暗坑。`;
        } else if (clashMap[myZodiac] === decisionWealthPartnerZodiac) {
          partnerAffinityScore = 35 + (charCodeSum % 10);
          relationName = "流年相衝 ‧ 火澤相克 ⚠️";
          partnerAdvice = `注意！您與決策人【${decisionWealthPartnerZodiac}】互為「六衝相克」格局。下半年財帛流月動盪時，雙方極易因「${decisionWealthProject}」的資金分攤、裝潢風格或利潤分配爆發激烈口舌，導致決策失焦、高點接盤，乃至資金鏈斷裂！`;
          partnerPremiumAdvice = `🔥 雙人避相克斬小人心法：雙方命格自帶衝擊。在此項目的推展過程中，必須在客廳的正東方安放「一個帶蓋的粗陶茶壺（不放茶葉）」，名為「陶土中和引水安神」，且雙方在面商前均不飲用冰冷碳酸飲料，即可把相衝口舌之害化解於無形。`;
        } else {
          // 檢查三合
          let isThree = false;
          for (const g of groups) {
            if (g.includes(myZodiac) && g.includes(decisionWealthPartnerZodiac)) {
              isThree = true;
              break;
            }
          }
          if (isThree) {
            partnerAffinityScore = 86 + (charCodeSum % 5);
            relationName = "氣學三合 ‧ 合氣生財 🤝";
            partnerAdvice = `您與夥伴【${decisionWealthPartnerZodiac}】符合「三合吉局」。在購入「${decisionWealthProject}」時，彼此磁場和諧，決策直覺驚人地一致，能夠在市場混亂時穩穩錨定最合適的入手時點。`;
            partnerPremiumAdvice = `🎯 三合大吉鎖財神祕功：在大筆匯款或交付訂金的當天，雙方應共同穿著「淺綠色、或米白色」的成套服飾。若能邀約一位生肖為【${
              myZodiac === "鼠" || decisionWealthPartnerZodiac === "鼠" ? "龍" : "牛"
            }】的朋友隨行，將能化動土為進財，迎祥納瑞。`;
          } else {
            partnerAffinityScore = 60 + (charCodeSum % 20);
            relationName = "平順互補 ‧ 慢火生金 🕊️";
            partnerAdvice = `雙方生肖配對磁場溫和持平。在「${decisionWealthProject}」中無重大衝突也無暴發契機，適合按照合規的法律合同，均分風險，各自看管好預算，以防守為主要基調。`;
            partnerPremiumAdvice = `🧭 雙人均衡守護：雙位在做重大商量時，切記不可在「廚房、灶台、或有明火之處」進行，否則財氣會受躁土所克。宜在採光通透的客廳或咖啡廳，手握一杯溫熱開水，便能引水入局，財氣和諧。`;
          }
        }
      }

      // 2. 空間朝向八卦計算
      let directionStatus: "prosperous" | "leak" | "neutral" = "neutral";
      let directionName = "";
      let directionAdvice = "";
      let directionPremiumAdvice = "";

      if (decisionWealthDirection !== "none") {
        const myElement = result?.kyusei?.yearStar?.element || "土";
        const dirMap: Record<string, { name: string, elem: string }> = {
          "north": { name: "坐北朝南 (坎水卦)", elem: "水" },
          "south": { name: "坐南朝北 (離火卦)", elem: "火" },
          "east": { name: "坐東朝西 (震木卦)", elem: "木" },
          "west": { name: "坐西朝東 (兌金卦)", elem: "金" },
          "northeast": { name: "坐東北朝西南 (艮土卦)", elem: "土" },
          "northwest": { name: "坐西北朝東南 (乾金卦)", elem: "金" },
          "southeast": { name: "坐東南朝西北 (巽木卦)", elem: "木" },
          "southwest": { name: "坐西南朝東北 (坤土卦)", elem: "土" },
        };
        const curDirObj = dirMap[decisionWealthDirection];
        directionName = curDirObj ? curDirObj.name : "未知朝向";
        const dirElem = curDirObj ? curDirObj.elem : "木";

        if (myElement === "金") {
          if (dirElem === "土" || dirElem === "金") {
            directionStatus = "prosperous";
            directionAdvice = `【大吉】您的本命九星屬金，搭配【${directionName}】（五行屬${dirElem}）。「土生金、金金比和」，此朝向完美契合您的星盤！能大幅壓制「${decisionWealthProject}」的凶星波動，對您的長線持有或套現，有著源源不斷的聚氣守護力。`;
            directionPremiumAdvice = `🌸 奇門開光擺布：本年請在此房屋或辦公室的「西北角」，安放一個圓形金屬碟盛放「5 枚亮面銅板」，可在每次進門時形成「九天祿存引財陣」，每 3 個月更換一次位置能讓財源不斷。`;
          } else if (dirElem === "火" || dirElem === "水") {
            directionStatus = "leak";
            directionAdvice = `【洩氣警告】您的九星屬金，此向屬【${dirElem}】。火克金，水洩金氣，此房朝向與您的本命產生了嚴重的五行衝突！在此進行「${decisionWealthProject}」後，容易發生房子漏水、裝潢建商延宕，或者長線持有時遇到政策變更而被套牢、財富無形蒸發之慮！`;
            directionPremiumAdvice = `🔒 奇門化洩神妙心法（VIP）：本朝向帶有洩金之煞。切莫在此處的正南方放置「紅色或大黃大紫」的裝飾。請務必在進門玄關處安放「一盆圓葉綠色富貴竹（水培，插 4 支）」，木火引水，化克為生，將洩財劫難化為一盞長庚福星！`;
          } else {
            directionStatus = "neutral";
            directionAdvice = `【持平】您的本命九星屬金，此向屬【${dirElem}】。金克木為財，代表求財稍微忙碌奔波，但一分耕耘一分收穫，朝向持平無大礙。`;
            directionPremiumAdvice = `🧭 開運提示：在此朝向的客廳擺放一盞「暖黃色落地燈」，每日傍晚亮起 2 小時，能補足火生土、土生金之局，保全財富安穩。`;
          }
        } else if (myElement === "木") {
          if (dirElem === "水" || dirElem === "木") {
            directionStatus = "prosperous";
            directionAdvice = `【大吉】您的本命九星屬木，此向屬【${dirElem}】。「水生木、木木相旺」，生氣澎湃！在此進行「${decisionWealthProject}」對您的事業大後方及健康有絕佳守護，利於中長線穩健升值，家庭和氣聚財。`;
            directionPremiumAdvice = `🌸 奇門催財心法：此格局宜在此空間的「正東方」擺放一個黑釉粗陶水鉢，裏面放上「幾片常綠浮萍」，有助穩固木氣，使「${decisionWealthProject}」的資產回報能如春木生髮般節節攀升！`;
          } else if (dirElem === "金" || dirElem === "火") {
            directionStatus = "leak";
            directionAdvice = `【耗水洩財煞】您的本命九星屬木，朝向屬【${dirElem}】。金枯木折，火洩木氣！此項目「${decisionWealthProject}」入手後容易導致您精力耗散，睡眠質量變差，且中途容易因臨時醫療開銷、或者訴訟糾紛，產生無法預期的破財！`;
            directionPremiumAdvice = `🔒 飛星中和消煞擺布（VIP）：此空間帶有金金相伐之煞。化解妙招：請在此空間的正北方，安放一個「黑色陶瓷密封罐，裏面注入 8 分滿的乾淨礦泉水、並投入一顆黑色黑曜石球」，引金生水、水生木，引天一生水之純淨能量，將折損破財磁場徹底折衝！`;
          } else {
            directionStatus = "neutral";
            directionAdvice = `【持平】此朝向五行屬土。木克土為財，代表此項目需要您親力親為，多花心思關注和考察細節，沒有偏財捷徑，但安穩。`;
            directionPremiumAdvice = `🧭 均勻氣場：擺放「綠玉貔貅」或大黑曜石於餐桌中央，可穩住中宮和土氣。`;
          }
        } else if (myElement === "水") {
          if (dirElem === "金" || dirElem === "水") {
            directionStatus = "prosperous";
            directionAdvice = `【大吉】您的本命九星屬水，此卦朝向屬【${dirElem}】。金生水，水水比和，財源茂盛！購入「${decisionWealthProject}」後，能給您帶來極高的理財第六感與極佳的現金流轉速度，是極佳的守庫陣容。`;
            directionPremiumAdvice = `🌸 奇門納氣指南：請在主臥室的朝南方向掛一個「木質空心葫蘆」，將流年太歲星氣收於金水葫蘆中，保佑資產增值。`;
          } else if (dirElem === "土" || dirElem === "木") {
            directionStatus = "leak";
            directionAdvice = `【泥沙堵塞煞】您的本命九星屬水。朝向屬【${dirElem}】。土克水，木洩水氣，形同泥沙入江，財路阻塞！在此項目上，您極易因為信賴看似老實的合作夥伴，或貪圖短線回報，導致資金遭套牢長達三年動彈不得，或因利息攀升而背負沉重壓力！`;
            directionPremiumAdvice = `🔒 九宮絕地化解局（VIP）：土克水之煞非同大意。請務必在辦公桌或客廳「西南角」放置「一隻古銅色銅鑼（或黃銅鈴鐺）」，時不時輕敲發出清脆金屬音。金屬音聲五行屬純金，可洩土生水，引動財庫大門重新打開，避開斷供或套牢劫煞。`;
          } else {
            directionStatus = "neutral";
            directionAdvice = `【持平】此卦五行屬火。水克火為財，代表求財順遂平移，但偶有微小開支超支，切忌加碼財務槓桿。`;
            directionPremiumAdvice = `🧭 開運點燃法：隨身佩戴白色水晶手串，能使心境如水般平和，減少衝動支出。`;
          }
        } else if (myElement === "火") {
          if (dirElem === "木" || dirElem === "火") {
            directionStatus = "prosperous";
            directionAdvice = `【大吉】您的本命九星屬火，朝向【${directionName}】屬${dirElem}。木生火，比和生輝！購入此在「${decisionWealthProject}」項目上能得到德高望重之老長輩或隱形貴人的指引與財務補貼，是一筆能帶來名聲與心安的祥和資產。`;
            directionPremiumAdvice = `🌸 奇門納福：在大門玄關懸掛一幅「九魚聚財圖」或「富貴牡丹圖」，能助雙重木火合一，大振事業宏圖。`;
          } else if (dirElem === "水" || dirElem === "土") {
            directionStatus = "leak";
            directionAdvice = `【火滅氣竭煞】您的本命九星屬火。朝向屬【${dirElem}】。水克火，土洩火光，水火不容！此購買決定或投資極易在下半年遭到口舌是非干涉，或因不可抗力政策調整導致估值縮水。甚至因為此項目而導致家人不和、夫妻埋怨！`;
            directionPremiumAdvice = `🔒 星盤調和小法門（VIP）：消弭水火相克之靈魂之方：請在客廳和臥室的「正北方」，擺放「三盆葉片翠綠、不帶刺的土培小盆栽（盆器宜選粉色或紅陶色）」。盆栽屬木，可引水生木，木生火，把無情的水火相克乾坤大挪移為綿延不絕的富貴氣生機！`;
          } else {
            directionStatus = "neutral";
            directionAdvice = `【持平】此卦朝向屬金。火克金為財，表示資產增長速度在中等區間，需要保持足夠的緩衝期，不可冒進。`;
            directionPremiumAdvice = `🧭 穩重提示：在辦公桌右手邊，擺放一疊厚實的專業書籍，可鎮住偏財之火。`;
          }
        } else { // 土
          if (dirElem === "火" || dirElem === "土") {
            directionStatus = "prosperous";
            directionAdvice = `【大吉】您的本命九星屬土。此向五行屬【${dirElem}】。「火生土、土土相和」，安穩如山！投資購買「${decisionWealthProject}」能為您帶來豐碩的底氣，使您在預算金額時能安然渡過任何宏觀局勢，是無比踏實的大後盾。`;
            directionPremiumAdvice = `🌸 奇門穩健大吉：在此空間的「正南位」擺放一對陶瓷玩偶或大地色地毯，可激發土氣聚財庫之能。`;
          } else if (dirElem === "木" || dirElem === "金") {
            directionStatus = "leak";
            directionAdvice = `【木克脾土煞】您的本命九星屬土。朝向屬【${dirElem}】。木克土，金洩土氣，脾土受克、精神不守！下半年在此項目上極易遇上苛刻的外部合約，或在購入後出現無形的房屋土地估值停滯，拖累您其他的流動性靈活性，焦慮萬分！`;
            directionPremiumAdvice = `🔒 奇門化木克土化煞局（VIP）：化解木克土的絕佳奇招：請在客廳玄關位置，放置一個「紅色瓷盤，裡面放上 9 顆紅瑪瑙或紅玉石球（亦可用紅色乾花或紅色杯子取代）」。紅色五行屬火，可形成「木生火、火生土」的招財引水大連鎖，把木克土的相克完全轉化為本命的開運食祿！`;
          } else {
            directionStatus = "neutral";
            directionAdvice = `【持平】此向屬水。土克水為財，運勢持平，代表會有一點意外的開銷插曲，但最終能依靠您紮實的積蓄力量平穩解決。`;
            directionPremiumAdvice = `🧭 聚寶盆：在客廳最中央擺放「圓形水晶大碗」，能收發八方進賬持平之氣。`;
          }
        }
      }

      setDecisionWealthResult({
        stabilityScore,
        caiBoFeature,
        pitfallMonths: `農曆 ${hazardMonth1} 月及 ${hazardMonth2} 月`,
        dangerLevel: stabilityScore > 75 ? "適度避險" : "高風險需嚴格守成",
        analysis: `這項針對「${decisionWealthProject}」的投資/買房精算報告，主要連動您的本命【財帛宮】星相（核心星曜為：${caiBoFeature}）。當前時空穩定度評估為 ${stabilityScore}%（屬於「${stabilityScore > 75 ? "行有餘力、可尋求中長線配置" : "風險極高、容易進場即被套牢"}」等級）。下半年度之命運流月中，最需嚴加防範財氣漏失的時空窗口位於特定忌沖月份，切忌衝動盲從、聽信小道消息。`,
        monthsData,
        partnerZodiac: decisionWealthPartnerZodiac,
        partnerAffinityScore,
        relationName,
        partnerAdvice,
        partnerPremiumAdvice,
        direction: decisionWealthDirection,
        directionName,
        directionStatus,
        directionAdvice,
        directionPremiumAdvice
      });
      setIsCalculatingWealth(false);
    }, 1200);
  };

  // 開放支付 Modal 觸發器
  const triggerPayment = (target: "career" | "love" | "wealth", price: number, title: string) => {
    setPaymentTarget(target);
    setPaymentPrice(price);
    setPaymentTitle(title);
    setPaymentSuccess(false);
    setIsPaying(false);
    setPaymentModalOpen(true);
  };

  // 模擬支付完畢處理
  const handleConfirmMockPayment = () => {
    setIsPaying(true);
    setPayStep(1); // Processing
    setPayStatusText("正在對接 SSL 全球安全金流授權協定...");
    
    setTimeout(() => {
      setPayStatusText("正在校準本命斗數命盤大限、真太陽時經緯鐘 (偏置角度對齊)...");
      setTimeout(() => {
        setPayStatusText("正在進行五行配對加權、三方四正雙星共振交互演算法詳精算...");
        setTimeout(() => {
          setIsPaying(false);
          setPayStep(2); // Success!
          setPaymentSuccess(true);
          
          if (paymentTarget === "premiumClick108" as any) {
            setIsPremiumUnlocked(true);
          } else if (paymentTarget === "career") {
            setIsCareerUnlocked(true);
          } else if (paymentTarget === "love") {
            setIsLoveUnlocked(true);
          } else if (paymentTarget === "wealth") {
            setIsWealthUnlocked(true);
          }
          
          setTimeout(() => {
            setPaymentModalOpen(false);
            setPayStep(0);
          }, 600);
        }, 250);
      }, 250);
    }, 300);
  };

  // 加載動畫
  useEffect(() => {
    let intervalMsg: NodeJS.Timeout;
    let intervalProg: NodeJS.Timeout;

    if (isLoading) {
      setProgress(5);
      intervalMsg = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 1000); // 縮短文字更換時間，讓使用者感覺系統在快速工作

      intervalProg = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 98) return 98;
          const incr = prev < 60 ? 20 : prev < 90 ? 8 : 2; // 顯著加快排盤進度條
          return prev + incr;
        });
      }, 80); // 縮短更新間隔時間，營造極速流暢體感
    } else {
      setProgress(0);
    }

    return () => {
      clearInterval(intervalMsg);
      clearInterval(intervalProg);
    };
  }, [isLoading]);

  // 智能滾動對話框
  useEffect(() => {
    if (chatBottomRef.current) {
      //chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isSendingQuestion]);

  // 提交計算
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg("心靈夥伴手記：請問怎麼稱呼閣下？請輸入您的名字或暱稱。");
      return;
    }
    if (!isAgreedToTerms) {
      setErrorMsg("請先閱讀並同意下方《隱私權保護與健康調理免責條款》再為您開啟星軌。");
      return;
    }
    setErrorMsg("");
    setIsLoading(true);
    setResult(null);
    setChatHistory([]);

    try {
      const response = await fetch("/api/fortune/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender,
          birthDate: formData.birthDate,
          birthTime: `${formData.birthHour.padStart(2, "0")}:${formData.birthMinute.padStart(2, "0")}`,
          birthPlace: formData.birthPlace,
          focusArea: formData.focusArea
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "星象通信稍微受阻，請稍候重試");
      }

      const data = await response.json();
      setProgress(100);
      setTimeout(() => {
        const enrichedData = {
          ...data,
          calcId: Date.now().toString()
        };
        setResult(enrichedData);
        setIsLoading(false);

        // 根據 focusArea 自動選取最對應的 activeTab 宮位與解析視角！
        if (formData.focusArea === "事業學業") {
          setActiveTab("career");
        } else if (formData.focusArea === "親密相遇") {
          setActiveTab("love");
        } else if (formData.focusArea === "物質豐盛") {
          setActiveTab("wealth");
        } else if (formData.focusArea === "身心療癒") {
          setActiveTab("health");
        } else {
          setActiveTab("personality");
        }

        // 預設點擊明宮
        const mingGongPalace = data.ziweiPalaces.find((p: any) => p.name === "命宮");
        if (mingGongPalace) {
          setSelectedPalace(mingGongPalace);
        } else if (data.ziweiPalaces.length > 0) {
          setSelectedPalace(data.ziweiPalaces[0]);
        }
      }, 400);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "時空磁場稍微有些不穩，請重新嘗試一次。");
      setIsLoading(false);
    }
  };

  // 重置
  const handleReset = () => {
    setResult(null);
    setSelectedPalace(null);
    setQuestion("");
    setChatHistory([]);
    setErrorMsg("");
  };

  // PDF 匯出狀態與參照
  const [isExporting, setIsExporting] = useState(false);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!result || !pdfTemplateRef.current) return;
    setIsExporting(true);

    // 1x1 離屏畫布：利用瀏覽器原生渲染引擎精準轉換任何 oklch/oklab 顏色至 rgba
    const convertCssColorToRgb = (colorStr: string): string => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) return colorStr;
        ctx.fillStyle = colorStr;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;
      } catch (e) {
        return colorStr;
      }
    };

    const cleanOklColorInString = (str: string): string => {
      if (!str || typeof str !== 'string') return str;
      if (!str.includes('oklch') && !str.includes('oklab')) return str;
      return str.replace(/(oklch|oklab)\([^)]+\)/gi, (match) => {
        return convertCssColorToRgb(match);
      });
    };

    // 備份原有方法
    const originalGetComputedStyle = window.getComputedStyle;

    // 備份並即時清理所有 <style> 的內容，不暫停任何樣式，保證原始頁面佈局不崩塌
    const styleElBackup = new Map<HTMLStyleElement, string>();
    const styleElements = Array.from(document.querySelectorAll('style'));
    for (const styleEl of styleElements) {
      if (styleEl.textContent && (styleEl.textContent.includes('oklch') || styleEl.textContent.includes('oklab'))) {
        styleElBackup.set(styleEl, styleEl.textContent);
        styleEl.textContent = cleanOklColorInString(styleEl.textContent);
      }
    }

    try {
      // 進行暫時性的 flat-patched getComputedStyle，不使用嵌套的複雜 CSSRule Proxy 避免遞迴卡死
      window.getComputedStyle = function (elt, pseudoElt) {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const res = target.getPropertyValue(propertyName);
                if (typeof res === 'string' && (res.includes('oklch') || res.includes('oklab'))) {
                  return cleanOklColorInString(res);
                }
                return res;
              };
            }
            const val = Reflect.get(target, prop);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return cleanOklColorInString(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };

      const element = pdfTemplateRef.current;
      
      // 確保將隱形容器進行高畫質轉譯，使用 scrollX/scrollY: 0 與明確視窗尺寸避免因使用者視窗滾動造成截圖偏移或空白
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#FAF8F5",
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: element.scrollHeight || 1200,
        x: 0,
        y: 0,
        width: 794,
        height: element.scrollHeight || 1200
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight() || 297;
      
      const imgWidth = canvas.width || 794;
      const imgHeight = canvas.height || 1123;
      let pageHeightInPdf = (imgHeight * pdfWidth) / imgWidth;
      if (isNaN(pageHeightInPdf) || !isFinite(pageHeightInPdf) || pageHeightInPdf <= 0) {
        pageHeightInPdf = 297;
      }
      
      let heightLeft = pageHeightInPdf;
      let position = 0;
      
      // 加入第一頁
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pageHeightInPdf);
      heightLeft -= pdfHeight;
      
      // 如果整體報告高度大於 A4，則自動進入下一頁分頁處理，設有安全防無窮迴圈次數上限
      let limitCount = 0;
      const stepValue = Math.max(1, pdfHeight);
      while (heightLeft > 0.5 && limitCount < 80) {
        limitCount++;
        position = heightLeft - pageHeightInPdf;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pageHeightInPdf);
        heightLeft -= stepValue;
      }
      
      pdf.save(`微光小庵_專屬一對一心靈對話諮商報告_${result.personalInfo.name}.pdf`);
    } catch (err) {
      console.error("PDF 產生失敗: ", err);
    } finally {
      // 恢復所有的樣式與原生命令，恢復原始狀態
      window.getComputedStyle = originalGetComputedStyle;

      for (const [styleEl, originalText] of styleElBackup.entries()) {
        styleEl.textContent = originalText;
      }

      setIsExporting(false);
    }
  };

  // 追問問題
  const handleAskQuestion = async (customQuestion?: string) => {
    const activeQuestion = customQuestion || question;
    if (!activeQuestion.trim() || !result) return;
    if (isSendingQuestion) return;

    setErrorMsg("");
    const userMessage = { role: "user" as const, text: activeQuestion };
    setChatHistory((prev) => [...prev, userMessage]);
    
    if (!customQuestion) {
      setQuestion("");
    }
    
    setIsSendingQuestion(true);

    try {
      const response = await fetch("/api/fortune/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baziData: result,
          question: activeQuestion,
          chatHistory: chatHistory
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "旅伴夥伴正在禪定，請稍微等一下");
      }

      const data = await response.json();
      setChatHistory((prev) => [...prev, { role: "model" as const, text: data.answer }]);
    } catch (err: any) {
      console.error(err);
      setChatHistory((prev) => [
        ...prev,
        { role: "model" as const, text: `抱歉啦，星光稍微有些微弱。不過請別擔心，我們一直都在您身邊。您可以再按一次或換個方式問我～` }
      ]);
    } finally {
      setIsSendingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#36322E] flex flex-col justify-between antialiased">
      
      {/* 頂部導航欄 */}
      <header className="h-16 border-b border-[#EBE3D5] bg-[#FAF8F3] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-[#8C7A6B] flex items-center justify-center text-white text-base sm:text-lg shrink-0">
            ☯️
          </div>
          <div className="min-w-0">
            <h1 className="text-[11.5px] sm:text-sm font-serif font-semibold tracking-wider text-[#3C352E] truncate">
              微光星軌 · 紫微九星心靈手記
            </h1>
            <p className="text-[8.5px] sm:text-[10px] text-[#8C8375] tracking-widest uppercase font-mono mt-0.5 truncate">
              Ziwei & Kyusei Conversational Companion
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <span className="hidden sm:flex text-[11px] text-[#8C7A6B] bg-white border border-[#EBE3D5] px-3.5 py-1 rounded-full font-serif items-center gap-1.5 shadow-sm">
            <span>✨</span> 聽一場星曜起伏的溫柔談話
          </span>
        </div>
      </header>

      {/* 主體內容 */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12">
        
        {/* Banner 宣傳格言 */}
        <section className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3.5xl font-serif text-[#3C352E] tracking-tight leading-snug">
            「在漫無邊際的世界裡，<br className="md:hidden" />看清自己是一首什麼樣的歌。」
          </h2>
          <p className="text-xs md:text-sm text-[#736B5E] font-serif leading-relaxed max-w-lg mx-auto">
            一場結合<strong>「北斗紫微斗數」</strong>與<strong>「日本九星氣學」</strong>的溫潤調度。我們不標榜玄奧神算，也不奢談命定宿命，只想安安靜靜地陪著你，在手沖咖啡的芬芳熱氣裡，聆聽星辰留給你的天賦微光。
          </p>
        </section>

        {/* 錯誤橫幅 */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#FDF2F0] border-l-4 border-[#D9534F] text-[#4E1A17] font-serif text-xs rounded-r-xl shadow-sm text-left flex gap-2.5 items-center max-w-xl mx-auto"
          >
            <span>💡</span>
            <p>{errorMsg}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          
          {/* 第一階段：生辰乾坤輸入表單 與 每日心靈解牌一籤雙欄佈局 */}
          {!result && !isLoading && (
            <motion.div
              key="landing-setup-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto text-left"
            >
              {/* 左側：精準深度算命表單欄位 (60% 寬度) */}
              <div className="lg:col-span-7 bg-white border border-[#EBE3D5] p-6 md:p-9 shadow-[0_4px_30px_rgba(140,122,107,0.02)] rounded-3xl space-y-6">
                <div className="border-b border-[#F0EAE1] pb-4 mb-2 text-left">
                  <span className="text-[10px] text-[#8C7A6B] font-serif tracking-widest font-semibold block uppercase">
                    起局信息錄入 / ASTROLOGY PARAMETERS
                  </span>
                  <h3 className="text-[#3C352E] font-serif text-lg font-medium mt-1">
                    與星光旅伴相對，述說您的出生痕跡
                  </h3>
                </div>

                <form onSubmit={handleCalculate} className="space-y-6">
                  {/* 稱呼 - 單獨一列 */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-serif font-bold text-[#5C5043] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#8C7A6B]" />
                      稱呼 / Name
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="例：陳冠宇、林雅婷"
                      className="w-full bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] focus:ring-1 focus:ring-[#8C7A6B]/20 rounded-xl px-4 py-3 text-xs text-[#3C352E] placeholder-[#9E9485] transition-all outline-none"
                    />
                  </div>

                  {/* 西元出生日期與出生性別 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="space-y-2">
                      <label className="text-xs font-serif font-bold text-[#5C5043] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8C7A6B]" />
                        西元出生日期 / Solar Date
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* 年份 */}
                        <select
                          value={birthYear}
                          onChange={(e) => handleDatePartChange('year', e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] rounded-xl px-2.5 py-3 text-xs text-[#3C352E] outline-none cursor-pointer transition-all hover:bg-[#FAF8F3] hover:border-[#8C7A6B]/50"
                        >
                          {yearOptions.map(y => (
                            <option key={y} value={y}>{y} 年</option>
                          ))}
                        </select>
                        {/* 月份 */}
                        <select
                          value={birthMonth}
                          onChange={(e) => handleDatePartChange('month', e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] rounded-xl px-2 py-3 text-xs text-[#3C352E] outline-none cursor-pointer transition-all hover:bg-[#FAF8F3] hover:border-[#8C7A6B]/50"
                        >
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(m => (
                            <option key={m} value={m}>{m} 月</option>
                          ))}
                        </select>
                        {/* 日份 */}
                        <select
                          value={birthDay}
                          onChange={(e) => handleDatePartChange('day', e.target.value)}
                          className="w-full bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] rounded-xl px-2 py-3 text-xs text-[#3C352E] outline-none cursor-pointer transition-all hover:bg-[#FAF8F3] hover:border-[#8C7A6B]/50"
                        >
                          {dayOptions.map(d => (
                            <option key={d} value={d}>{d} 日</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-serif font-bold text-[#5C5043] block">
                        出生性別 (排盤基準) / Gender
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {["男 (乾造)", "女 (坤造)"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setFormData({ ...formData, gender: g })}
                            className={`py-3 text-[11px] font-serif rounded-xl border transition-all cursor-pointer ${
                              formData.gender === g
                                ? "bg-[#8C7A6B] border-[#8C7A6B] text-white shadow-sm font-semibold"
                                : "bg-[#FAF9F5] border-[#EBE3D5] text-[#736B5E] hover:border-[#8C7A6B]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 出生時分與出生城市 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="space-y-2">
                      <label className="text-xs font-serif font-bold text-[#5C5043] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                        出生時分 (時辰基準) / Birth Time
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={formData.birthHour}
                          onChange={(e) => setFormData({ ...formData, birthHour: e.target.value })}
                          className="flex-1 bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] rounded-xl px-3 py-3 text-xs text-[#3C352E] outline-none"
                        >
                          {Array.from({ length: 24 }).map((_, i) => {
                            const val = i.toString().padStart(2, "0");
                            return (
                              <option key={i} value={val}>
                                {val} 點 ({(val === "23" || val === "00") ? "子時" : i === 1 || i === 2 ? "丑時" : i === 3 || i === 4 ? "寅時" : i === 5 || i === 6 ? "卯時" : i === 7 || i === 8 ? "辰時" : i === 9 || i === 10 ? "巳時" : i === 11 || i === 12 ? "午時" : i === 13 || i === 14 ? "未時" : i === 15 || i === 16 ? "申時" : i === 17 || i === 18 ? "酉時" : i === 19 || i === 20 ? "戌時" : "亥時"})
                              </option>
                            );
                          })}
                        </select>
                        <span className="flex items-center text-xs text-[#8C8375] font-serif">：</span>
                        <select
                          value={formData.birthMinute}
                          onChange={(e) => setFormData({ ...formData, birthMinute: e.target.value })}
                          className="flex-1 bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] rounded-xl px-3 py-3 text-xs text-[#3C352E] outline-none"
                        >
                          {Array.from({ length: 60 }).map((_, i) => {
                            const val = i.toString().padStart(2, "0");
                            return (
                              <option key={i} value={val}>
                                {val} 分
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-serif font-bold text-[#5C5043] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#8C7A6B]" />
                        出生地點 (校準真太陽時) / Birthplace
                      </label>
                      <input
                        type="text"
                        maxLength={30}
                        value={formData.birthPlace}
                        onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                        placeholder="例如：香港、台灣台北市、上海"
                        className="w-full bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] focus:ring-1 focus:ring-[#8C7A6B]/20 rounded-xl px-4 py-3 text-xs text-[#3C352E] placeholder-[#9E9485] transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* 關注焦點 */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-serif font-bold text-[#5C5043] block">
                      本次交流最想排遣之疑惑 / Specialized Focus
                    </label>
                    <select
                      value={formData.focusArea}
                      onChange={(e) => setFormData({ ...formData, focusArea: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-[#EBE3D5] focus:border-[#8C7A6B] focus:ring-1 focus:ring-[#8C7A6B]/20 rounded-xl px-4 py-3 text-xs text-[#3C352E] outline-none"
                    >
                      <option value="綜合人生">🍀 綜合人生的順逆舒心</option>
                      <option value="事業學業">💼 生涯與創造力軌跡</option>
                      <option value="親密相遇">💖 親密相遇與溫柔姻緣</option>
                      <option value="物質豐盛">💰 物質豐盛與財富流動</option>
                      <option value="身心療癒">🏥 起居調理與焦慮放鬆</option>
                    </select>
                  </div>

                  {/* 免責條款選擇框 */}
                  <div className="bg-[#FAF8F5] border border-[#EBE3D5]/60 rounded-2xl p-4.5 space-y-3">
                    <div className="flex items-start">
                      <input
                        id="checkbox-privacy-and-terms"
                        type="checkbox"
                        checked={isAgreedToTerms}
                        onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                        className="mt-1 mr-3 rounded border-[#D0C5B0] text-[#8C7A6B] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="checkbox-privacy-and-terms" className="text-xs text-[#736B5E] font-serif leading-relaxed text-left cursor-pointer">
                        我已詳細閱讀、理解並願意同意{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-[#8C7A6B] underline font-bold hover:text-[#706053]"
                        >
                          《微光手記隱私權與身心合規調理說明》
                        </button>
                        。理解本測算及言論均屬民俗美學與心靈諮商，若身體與心理有任何真實疾病，一定會尋求正規醫療臨床協助，絕不起疑或延誤就醫。
                      </label>
                    </div>
                  </div>

                  {/* 最暢銷平台必備：強烈信任與科學安星印記 */}
                  <div className="bg-[#FAF9F5] border border-[#F0EAE1] rounded-2xl p-4.5 space-y-2.5">
                    <div className="flex gap-2.5 text-left text-[11px] font-serif text-[#8C8375] leading-relaxed">
                      <span className="text-[#8C7A6B] text-[15px] shrink-0">🛡️</span>
                      <div>
                        <strong className="text-[#5C4D3C] block mb-0.5">時空安星校正背書 ‧ ASTRO TRUST SHIELD</strong>
                        本算命起盤基於經典《紫微斗數全書》、日本九星氣學曆法協調、真太陽時經緯度時差調整，確保命格軌跡與五行磁場完美貼合。
                      </div>
                    </div>
                    <div className="border-t border-[#F3EDE2]" />
                    <div className="flex justify-between items-center text-[9px] text-[#A69D90] font-mono tracking-widest px-1">
                      <span>📍 SHICHEN CALIBRATION 2.5 ACTIVE</span>
                      <span className="text-[#8C7A6B] font-semibold">🍵 今日已為 1,482 人起盤指路</span>
                    </div>
                  </div>

                  {/* 錯誤反饋：直覺呈現於按鈕上方 */}
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 bg-[#FDF2F0] border-l-4 border-[#D9534F] text-[#4E1A17] font-serif text-[11px] rounded-r-xl shadow-xs text-left flex gap-2 items-center"
                    >
                      <span className="text-[14px]">💡</span>
                      <p className="leading-relaxed">{errorMsg}</p>
                    </motion.div>
                  )}

                  {/* 提交按鈕 */}
                  <button
                    type="submit"
                    className="w-full bg-[#8C7A6B] hover:bg-[#706053] text-white py-4 px-6 rounded-2xl font-serif text-xs font-semibold tracking-widest uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    <span>點亮心靈微光，開啟人生旅伴排盤 ✨</span>
                  </button>
                </form>
              </div>

              {/* 右側：心靈調心室 & 今日流日運勢 (40% 寬度) */}
              <div className="lg:col-span-5 bg-white border border-[#EBE3D5] p-6 md:p-8 shadow-[0_4px_30px_rgba(140,122,107,0.02)] rounded-3xl space-y-6 flex flex-col min-h-[500px]">
                {/* 右側分頁標籤 */}
                <div className="flex border-b border-[#F0EAE1] pb-1 gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("oracle")}
                    className={`pb-2.5 font-serif text-sm font-medium border-b-2 transition-all cursor-pointer ${
                      activeRightTab === "oracle"
                        ? "border-[#8C7A6B] text-[#3C352E] font-semibold"
                        : "border-transparent text-[#9E9485] hover:text-[#5C5043]"
                    }`}
                  >
                    🍃 每日一籤
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightTab("daily-fortune")}
                    className={`pb-2.5 font-serif text-sm font-medium border-b-2 transition-all cursor-pointer ${
                      activeRightTab === "daily-fortune"
                        ? "border-[#8C7A6B] text-[#3C352E] font-semibold"
                        : "border-transparent text-[#9E9485] hover:text-[#5C5043]"
                    }`}
                  >
                    🔮 今日流日運勢
                  </button>
                </div>

                {activeRightTab === "oracle" ? (
                  <>
                    <div className="text-left space-y-1">
                      <span className="text-[9px] text-[#A69D90] font-mono tracking-widest block uppercase">
                        DAILY ZEN ORACLE DECK
                      </span>
                      <h3 className="text-[#3C352E] font-serif text-base font-semibold">
                        每日清淨心靈一籤
                      </h3>
                      <p className="text-[10.5px] text-[#8C8375] font-serif leading-relaxed">
                        心誠則靈，閉眼靜思當前困惑。點擊牌面翻開您的專屬星曜指引。
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                      {(!drawnOracleCard || isOracleShuffling) ? (
                        <div className="flex flex-col items-center">
                          <motion.div
                            key="undrawn-back"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ 
                              scale: 1, 
                              opacity: 1,
                              x: isOracleShuffling ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
                              rotate: isOracleShuffling ? [0, -3, 3, -2, 2, -1, 1, 0] : 0
                            }}
                            transition={{ 
                              duration: isOracleShuffling ? 0.5 : 0.3,
                              repeat: isOracleShuffling ? Infinity : 0,
                              ease: "easeInOut"
                            }}
                            onClick={!isOracleShuffling ? handleDrawOracleCard : undefined}
                            className={`relative w-64 h-[410px] ${
                              isOracleShuffling ? "cursor-wait" : "cursor-pointer"
                            } shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl bg-[#FAF9F5] border-2 border-[#E0D7C5] p-5 flex flex-col justify-between items-center overflow-hidden group`}
                          >
                            {/* Golden trim border frame */}
                            <div className="absolute inset-2 border border-[#8C7A6B]/20 rounded-2xl flex flex-col justify-between p-4 pointer-events-none">
                              <div className="w-5 h-5 border-t-2 border-l-2 border-[#8C7A6B]/30" />
                              <div className="flex justify-between w-full">
                                <div className="w-5 h-5 border-t-2 border-r-2 border-[#8C7A6B]/30" />
                              </div>
                              <div className="flex justify-between w-full mt-auto">
                                <div className="w-5 h-5 border-b-2 border-l-2 border-[#8C7A6B]/30" />
                                <div className="w-5 h-5 border-b-2 border-r-2 border-[#8C7A6B]/30" />
                              </div>
                            </div>
                            <div className="absolute inset-3 border border-[#8C7A6B]/15 rounded-xl pointer-events-none" />

                            <div className="text-[10px] text-[#8C7A6B] font-serif tracking-[0.25em] uppercase opacity-75 mt-2">
                              微光小庵 · {isOracleShuffling ? "星位洗盤中" : "心靈共鳴牌"}
                            </div>

                            {/* Concentric mystical circles */}
                            <div className="relative w-36 h-36 rounded-full border border-[#D5C2AF]/40 flex items-center justify-center bg-[#FDFCFA]/60 shadow-inner group-hover:scale-105 transition-all duration-500">
                              <div className="absolute inset-2 rounded-full border border-dashed border-[#D5C2AF]/60 animate-[spin_60s_linear_infinite]" />
                              <div className="absolute inset-5 rounded-full border border-[#D5C2AF]/30 animate-[spin_30s_reverse_linear_infinite]" />
                              <div className="absolute inset-8 rounded-full border border-[#D5C2AF]/10" />
                              
                              {/* Glowing sphere */}
                              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#E6DFD3] to-white border border-[#D5C2AF]/50 flex items-center justify-center shadow-xs relative overflow-hidden">
                                <span className={`text-3xl text-[#8C7A6B] drop-shadow-xs transition-all duration-300 ${isOracleShuffling ? "animate-spin" : "group-hover:rotate-12"}`}>
                                  🔮
                                </span>
                                <div className="absolute inset-0 bg-radial from-transparent to-[#8C7A6B]/5 opacity-30" />
                              </div>
                            </div>

                            {/* Dynamic instruction text */}
                            <div className="text-center space-y-1.5 z-10 mb-4 px-2 font-serif">
                              <div className="text-xs text-[#5C4D3C] font-semibold tracking-wide">
                                {isOracleShuffling ? "正在感應您的五行磁場..." : "請閉眼靜思，心中點亮微光"}
                              </div>
                              <p className="text-[10px] text-[#A39686] italic">
                                {isOracleShuffling ? "請保持呼吸安穩，引導能量入牌" : "誠心叩問 · 點擊卡面注入命靈一籤"}
                              </p>
                            </div>

                            <div className="text-[10.5px] text-white bg-[#8C7A6B] border border-[#8C7A6B] px-5 py-2 rounded-full hover:bg-[#736052] transition-colors font-serif font-semibold tracking-wider shadow-xs mb-2 active:scale-95">
                              {isOracleShuffling ? "🧘 靜心凝神中" : "☯️ 點此叩問抽牌"}
                            </div>
                          </motion.div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <AnimatePresence mode="wait">
                            {!isOracleFlipped ? (
                              <motion.div
                                key="back"
                                initial={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                                exit={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                onClick={() => setIsOracleFlipped(true)}
                                className="relative w-64 h-[410px] cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl bg-[#FAF9F5] border-2 border-[#E0D7C5] p-5 flex flex-col justify-between items-center overflow-hidden group"
                              >
                                {/* Golden trim border frame */}
                                <div className="absolute inset-2 border border-[#8C7A6B]/20 rounded-2xl flex flex-col justify-between p-4 pointer-events-none">
                                  <div className="w-5 h-5 border-t-2 border-l-2 border-[#8C7A6B]/30" />
                                  <div className="flex justify-between w-full">
                                    <div className="w-5 h-5 border-t-2 border-r-2 border-[#8C7A6B]/30" />
                                  </div>
                                  <div className="flex justify-between w-full mt-auto">
                                    <div className="w-5 h-5 border-b-2 border-l-2 border-[#8C7A6B]/30" />
                                    <div className="w-5 h-5 border-b-2 border-r-2 border-[#8C7A6B]/30" />
                                  </div>
                                </div>
                                <div className="absolute inset-3 border border-[#8C7A6B]/15 rounded-xl pointer-events-none" />

                                <div className="text-[10px] text-[#8C7A6B] font-serif tracking-[0.25em] uppercase opacity-75 mt-2">
                                  微光小庵 · 神諭籤成
                                </div>

                                {/* Shuffled Success Mandala */}
                                <div className="relative w-36 h-36 rounded-full border border-green-200/80 flex items-center justify-center bg-green-50/25 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                  <div className="absolute inset-2 rounded-full border border-dashed border-green-500/30 animate-[spin_40s_linear_infinite]" />
                                  <div className="absolute inset-5 rounded-full border border-green-500/15" />
                                  
                                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#EAF7ED] to-white border border-green-200 flex items-center justify-center shadow-xs relative overflow-hidden">
                                    <span className="text-3xl animate-bounce">✨</span>
                                  </div>
                                </div>

                                <div className="text-center space-y-1 z-10 mb-4 px-2 font-serif">
                                  <div className="text-xs text-stone-800 font-bold tracking-wide">
                                    🌟 五行神諭籤已落定！
                                  </div>
                                  <p className="text-[10px] text-green-700 font-semibold bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100/80 inline-block font-mono">
                                    AURA COMMUNE SUCCESS
                                  </p>
                                </div>

                                <div className="text-[10px] text-white bg-green-700/90 border border-green-700/10 px-5 py-2.5 rounded-full hover:bg-green-800 font-serif font-bold tracking-widest shadow-xs mb-2">
                                  🍀 點我翻牌解讀
                                </div>
                              </motion.div>
                            ) : (
                              <motion.div
                                key="front"
                                initial={{ rotateY: -90, opacity: 0, scale: 0.95 }}
                                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                                exit={{ rotateY: 90, opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className={`relative w-64 h-[410px] shadow-lg rounded-3xl border-2 p-4.5 flex flex-col justify-between text-left cursor-default overflow-hidden transition-all duration-300 ${drawnOracleCard.colorBg}`}
                              >
                                {/* Decorative corner marks */}
                                <div className="absolute inset-2 border border-current opacity-15 rounded-2xl pointer-events-none" />

                                {/* Header block */}
                                <div className="flex justify-between items-center z-10">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-inherit">
                                      {drawnOracleCard.element}行 · {drawnOracleCard.colorName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] bg-white/60 backdrop-blur-xs px-2 py-0.5 rounded-full font-serif font-bold border border-current/20 text-stone-800">
                                    {drawnOracleCard.keyword}
                                  </span>
                                </div>
                                {/* Constellation title */}
                                <div className="space-y-1 relative z-10 py-1 font-serif">
                                  <div className="text-[10px] tracking-widest text-[#8C7A6B] font-mono font-semibold uppercase">{drawnOracleCard.star || "心靈指引"}</div>
                                  <h4 className="text-lg font-bold leading-tight">{drawnOracleCard.title}</h4>
                                  <p className="text-[10px] text-stone-500 leading-relaxed italic">星宿磁場連環共振 ‧ Aura Alignment</p>
                                </div>

                                {/* Illustration with canvas layout centering */}
                                <div className="relative h-28 my-1 flex items-center justify-center select-none bg-stone-50/20 rounded-2xl border border-current/5 overflow-hidden">
                                  <div className="absolute inset-0 bg-radial from-transparent to-current/5 pointer-events-none" />
                                  <span className="text-5xl drop-shadow-md z-15">{getCardEmoji(drawnOracleCard)}</span>
                                </div>

                                {/* Blessing sentence */}
                                <div className="bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-current/10 space-y-1 relative z-10 font-serif">
                                  <strong className="text-[11px] font-bold text-[#8C7A6B] flex items-center gap-1">
                                    <span>🌟</span>
                                    <span>每日安祥印記：</span>
                                  </strong>
                                  <p className="text-[10.5px] leading-relaxed text-stone-700">{drawnOracleCard.blessing}</p>
                                </div>

                                {/* Bottom advice & close button */}
                                <div className="flex items-center justify-between pb-1 pt-1 border-t border-current/10 mt-1 z-10 font-serif">
                                  <span className="text-[9px] text-[#8C7A6B] font-medium max-w-[150px] leading-tight break-words">
                                    🧭 進修秘龠: {drawnOracleCard.advice}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDrawnOracleCard(null);
                                      setIsOracleFlipped(false);
                                    }}
                                    className="text-[9.5px] text-[#8C7A6B] underline cursor-pointer hover:text-stone-800 font-bold shrink-0"
                                  >
                                    重新叩問 🍀
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-left space-y-1">
                      <span className="text-[9px] text-[#A69D90] font-mono tracking-widest block uppercase">
                        DAILY HOROSCOPE CALENDAR
                      </span>
                      <h3 className="text-[#3C352E] font-serif text-base font-semibold">
                        今日流日運勢
                      </h3>
                      <p className="text-[10.5px] text-[#8C8375] font-serif leading-relaxed">
                        與當前宇宙能量共鳴。以下為您今日的身心、財富、生涯卦象：
                      </p>
                    </div>

                    <div className="flex-1 text-left space-y-3">
                      <div className="p-3.5 bg-[#FCFAF7] border border-[#F0EAE1] rounded-2xl font-serif">
                        <span className="text-[9px] bg-[#8C7A6B] text-white px-2 py-0.5 rounded-full scale-90 font-sans font-bold">卦象</span>
                        <h4 className="text-xs font-bold text-[#3C352E] mt-1.5">{activeDailyFortune.title}</h4>
                        <p className="text-[11px] text-stone-600 leading-relaxed mt-1">{activeDailyFortune.summary}</p>
                      </div>

                      <div className="space-y-2 max-w-sm mt-1 bg-white p-2.5 rounded-2xl border border-stone-100">
                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-serif font-bold text-[#706355]">💖 柔情意興</span>
                            <span className="font-mono text-[#8C7A6B]">{activeDailyFortune.ratingLove}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F5F2EC] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activeDailyFortune.ratingLove}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full bg-[#E5BAA2] rounded-full"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-serif font-bold text-[#706355]">💼 生涯乾坤</span>
                            <span className="font-mono text-[#8C7A6B]">{activeDailyFortune.ratingCareer}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F5F2EC] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activeDailyFortune.ratingCareer}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full bg-[#E5BAA2] rounded-full"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-serif font-bold text-[#706355]">💰 財源化祿</span>
                            <span className="font-mono text-[#8C7A6B]">{activeDailyFortune.ratingWealth}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F5F2EC] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activeDailyFortune.ratingWealth}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-full bg-[#E5BAA2] rounded-full"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center text-[10px] mb-1">
                            <span className="font-serif font-bold text-[#706355]">🏥 身心安穩</span>
                            <span className="font-mono text-[#8C7A6B]">{activeDailyFortune.ratingHealth}%</span>
                          </div>
                          <div className="h-1.5 bg-[#F5F2EC] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${activeDailyFortune.ratingHealth}%` }}
                              transition={{ duration: 0.8 }}
                              className="h-[#FAFAFA] bg-[#E5BAA2] rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* 加載中：星軌運行微光動畫 loading screen */}
          {isLoading && (
            <motion.div
              key="loading-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-24 px-4 space-y-8 max-w-xl mx-auto text-center font-serif"
            >
              {/* Mystic Rotating Circles */}
              <div className="relative w-32 h-32 flex items-center justify-center select-none">
                <div className="absolute inset-0 rounded-full border border-dashed border-[#D5C2AF]/80 animate-[spin_40s_linear_infinite]" />
                <div className="absolute inset-2.5 rounded-full border border-solid border-[#D5C2AF]/30 animate-[spin_25s_reverse_linear_infinite]" />
                <div className="absolute inset-5 rounded-full border border-dashed border-[#8C7A6B]/15" />
                <div className="w-16 h-16 rounded-full bg-[#FAF9F5] border border-[#D5C2AF]/60 flex items-center justify-center shadow-md relative overflow-hidden">
                  <span className="text-3.5xl text-[#8C7A6B] animate-pulse z-10">🔮</span>
                  <div className="absolute inset-0 bg-radial from-transparent to-[#8C7A6B]/5 opacity-35" />
                </div>
              </div>

              {/* Progress and status message */}
              <div className="space-y-4 w-full">
                <span className="text-[10px] tracking-widest text-[#8C7A6B] font-mono font-semibold uppercase block">
                  星軌運行中 / ALIGNING CELESTIAL AXIS {progress}%
                </span>
                
                {/* Custom Progress bar */}
                <div className="h-[2px] bg-[#EBE3D5] rounded-full overflow-hidden w-48 mx-auto relative">
                  <motion.div
                    className="h-full bg-[#8C7A6B]"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.2 }}
                  />
                </div>

                <div className="h-10 flex items-center justify-center px-4">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingMsgIdx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-[#736B5E] leading-relaxed italic max-w-sm"
                    >
                      {LOADING_MESSAGES[loadingMsgIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Tea cup warming note */}
              <div className="text-[10.5px] text-[#A69D90] font-sans tracking-wide">
                🍵 排盤與解構細緻飽滿。此時適宜沏一盞溫茶，靜心等候星曜指引。
              </div>
            </motion.div>
          )}

          {result && !isLoading && (
            <motion.div
              key="report-main"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-10 max-w-6xl mx-auto"
            >
              {/* 第一單元：精緻 ZWDS 星軌盤 */}
              <div className="bg-white border border-[#EBE3D5] p-5 md:p-8 shadow-[0_4px_30px_rgba(140,122,107,0.02)] rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-[#8C7A6B]" />

                <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-[#EBE3D5] gap-4 mb-6">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] text-[#8C7A6B] font-serif tracking-widest font-semibold block uppercase">
                      第一章 ‧ 命曜流光星軌盤 / THE COSMIC CHART MAP
                    </span>
                    <h3 className="text-[#3C352E] font-serif text-lg font-bold">
                      本命十二宮心靈星軌鏡盤
                    </h3>
                    <p className="text-[14px] md:text-[16px] text-[#8C8375] font-serif leading-relaxed">
                      ✨ 宇宙星宿默默低語，映照出靈魂的來路與歸途。輕撫下方特定宮位，推引專屬星軌解析。
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] md:text-[14px] bg-[#FDFBF7] border border-[#EAE2D5] text-[#8C7A6B] px-3 py-1.5 rounded-xl font-mono tracking-widest font-semibold shadow-2xs">
                      🧬 GUEST_ID: {result.calcId || 'DEFAULT'}
                    </span>
                  </div>
                </div>

                {/* 12宮盤：標準 ZWDS 4x4 傳統命盤 (Desktop 完美網格佈局) */}
                <div className="hidden md:grid grid-cols-4 grid-rows-4 relative w-full aspect-square border border-[#8C7A6B] rounded-3xl overflow-hidden bg-[#FAF9F6] max-w-2xl mx-auto shadow-md z-10 select-none">
                  
                  {/* 中午大殿 / 庵主本尊與生辰命理參數佈置 (中間 2x2 宮位) */}
                  <div className="absolute inset-[25%] bg-[#FAF9F5] border border-[#E3DAC9] flex flex-col justify-between p-5 text-center overflow-hidden z-20 font-serif">
                    <div className="absolute inset-1 border border-dashed border-[#8C7A6B]/20 rounded-md pointer-events-none" />
                    
                    <div className="space-y-1 mt-1 text-left select-text">
                      <div className="text-[10px] uppercase font-mono tracking-widest text-[#8C7A6B]">
                        Cosmic Center Mandala
                      </div>
                      <h4 className="text-md font-bold text-[#5C4D3C] tracking-wide font-serif">
                        微光小庵 ‧ 命主神機
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 text-[13px] md:text-[14px] font-serif text-left select-text">
                      <div>
                        <span className="text-[#8C8375]">命主雅稱：</span>
                        <strong className="text-stone-800 font-semibold">{result.personalInfo.name || ""}</strong>
                      </div>
                      <div>
                        <span className="text-[#8C8375]">命主性別：</span>
                        <strong className="text-stone-800 font-semibold">{result.personalInfo.gender || "未知"}</strong>
                      </div>
                      <div className="col-span-2 leading-relaxed">
                        <span className="text-[#8C8375]">太陽曆書：</span>
                        <strong className="text-stone-800 font-semibold text-[11px] font-sans break-all">
                          {result.personalInfo.solarBirthDate}
                        </strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[#8C8375]">太陰曆書：</span>
                        <strong className="text-stone-800 font-semibold font-serif">
                          {result.personalInfo.lunarBirthDate}
                        </strong>
                      </div>
                    </div>

                    <div className="text-[12px] md:text-[13px] text-[#9A7D64] bg-[#FAF2EB] border border-[#EBE3D5] py-1.5 px-3 rounded-xl flex items-center justify-center gap-1.5 select-none font-medium mt-2 shadow-2xs">
                      <span>✨</span>
                      <span>輕撫十二宮 ‧ 凝神牽引命曜星軌</span>
                    </div>
                  </div>

                  {result.ziweiPalaces.map((p) => {
                    const gridPos = BRANCH_GRID_STYLES[p.zhi] || "";
                    const isSelected = activePalace?.name === p.name;
                    const isSfszRelated = sfsz && [sfsz.opposite?.name, sfsz.trineA?.name, sfsz.trineB?.name].includes(p.name);

                    const zhiIndex = ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"].indexOf(p.zhi);
                    const normalizedIndex = zhiIndex >= 0 ? zhiIndex : 0;
                    const groupStartAge = 5 + normalizedIndex * 10;
                    const groupEndAge = groupStartAge + 9;
                    const palaceGan = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"][normalizedIndex % 10];
                    const nayinName = ["爐中火", "大林木", "路旁土", "劍鋒金", "山頭火", "澗下水", "城頭土", "白蠟金", "楊柳木", "泉中水", "屋上土", "霹靂火"][normalizedIndex % 12];
const currentAge = new Date().getFullYear() - parseInt(result.personalInfo.solarBirthDate) + 1;
                    return (
                      <motion.div
  
     key={`${p.name}-${result.calcId || 'default'}`}
                        onClick={() => setSelectedPalace(p)}
                        whileHover={{ 
                          scale: 1.015, 
                          boxShadow: "0 10px 20px -4px rgba(140, 122, 107, 0.12)"
                        }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`flex flex-col justify-between cursor-pointer border-r border-b border-[#EBE3D5] ${gridPos} relative overflow-hidden transition-all duration-300 ${
                          isSelected
                            ? "bg-[#FCFAF5] ring-2 ring-inset ring-[#A68364] z-10 font-bold"
                            : isSfszRelated
                            ? "bg-[#FAF5EE] hover:bg-[#FAF0E6] transition-colors"
                            : "bg-[#FCFBFA] hover:bg-[#FAF8F5] transition-colors"
                        }`}
                      >
                        {/* 上半區：古典垂直星曜陳設，引導雙維度右主左輔格局 */}
                        <div className="flex flex-row-reverse justify-between items-start h-[72%] p-1.5 md:p-2 overflow-hidden gap-1">
                          
                          {/* 右主星大隊：高飽和硃砂紅，字體恢弘，配搭精美四化吊牌 */}
                          <div className="flex flex-row-reverse gap-1 shrink-0">
                            {p.majorStars.map((ms) => {
                              if (ms === "無主星") {
                                return (
                                  <div key={ms} className="flex flex-col items-center justify-start text-[10px] text-stone-400 italic leading-tight pt-1 font-serif">
                                    <span>無</span>
                                    <span>主</span>
                                    <span>星</span>
                                  </div>
                                );
                              }
                              
                              const starEl = getStarElement(ms);
                              
                              // 智慧動態拉取底層資料算出的命盤四化物件
                              const isHuaLu = p.minorStars.some(s => s.includes(`${ms}·化祿`) || s.includes(`${ms}化祿`));
                              const isHuaQuan = p.minorStars.some(s => s.includes(`${ms}·化權`) || s.includes(`${ms}化權`));
                              const isHuaKe = p.minorStars.some(s => s.includes(`${ms}·化科`) || s.includes(`${ms}化科`));
                              const isHuaJi = p.minorStars.some(s => s.includes(`${ms}·化忌`) || s.includes(`${ms}化忌`));
                              
                              return (
                                <div key={ms} className="flex flex-col items-center justify-start relative leading-tight min-w-[14px]">
                                  {/* 星曜主體漢字垂直堆疊 - 使用優雅硃砂紅（#8E3232） */}
                                  <div className="flex flex-col items-center font-serif font-black text-[13px] text-[#8E3232]">
                                    {ms.split("").map((c, i) => (
                                      <span key={i}>{c}</span>
                                    ))}
                                  </div>
                                  
                                  {/* 亮度指示器 (廟旺平陷) */}
                                  <span className={`text-[7.5px] font-bold font-serif px-0.5 rounded-sm mt-0.5 scale-90 ${
                                    p.luShuai === "廟" || p.luShuai === "旺"
                                      ? "bg-[#FAF0E6] text-[#8C7A6B]"
                                      : "bg-stone-50 text-[#A19A8F]"
                                  }`}>
                                    {p.luShuai}
                                  </span>

                                  {/* 優雅傳統角牌四化 - 採用柔和文青礦物茶系色彩 */}
                                  <div className="mt-0.5 pointer-events-none select-none">
                                    {isHuaLu && <span className="w-3.5 h-3.5 rounded-full bg-[#4F7E66] flex items-center justify-center text-[7.5px] text-white font-bold leading-none scale-90 shadow-3xs" title="化祿">祿</span>}
                                    {isHuaQuan && <span className="w-3.5 h-3.5 rounded-full bg-[#4E6B82] flex items-center justify-center text-[7.5px] text-white font-bold leading-none scale-90 shadow-3xs" title="化權">權</span>}
                                    {isHuaKe && <span className="w-3.5 h-3.5 rounded-full bg-[#B38F4D] flex items-center justify-center text-[7.5px] text-white font-bold leading-none scale-90 shadow-3xs" title="化科">科</span>}
                                    {isHuaJi && <span className="w-3.5 h-3.5 rounded-full bg-[#9E4747] flex items-center justify-center text-[7.5px] text-white font-bold leading-none scale-90 shadow-3xs" title="化忌">忌</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 左輔吉煞星：精緻玄色/綠色垂直流，不凌越主星 */}
                          <div className="flex flex-row-reverse gap-0.5 overflow-x-auto scrollbar-none max-w-[55%] whitespace-nowrap">
                            {p.minorStars
                              .filter(s => !["化祿", "化權", "化科", "化忌"].includes(s) && !s.includes("·化"))
                              .map((subStar) => {
                                const cleanSub = subStar.includes("·") ? subStar.split("·")[0] : subStar;
                                
                                // 動態判斷輔曜四化
                                const isSubHuaLu = p.minorStars.some(s => s.includes(`${cleanSub}·化祿`) || s.includes(`${cleanSub}化祿`));
                                const isSubHuaQuan = p.minorStars.some(s => s.includes(`${cleanSub}·化權`) || s.includes(`${cleanSub}化權`));
                                const isSubHuaKe = p.minorStars.some(s => s.includes(`${cleanSub}·化科`) || s.includes(`${cleanSub}化科`));
                                const isSubHuaJi = p.minorStars.some(s => s.includes(`${cleanSub}·化忌`) || s.includes(`${cleanSub}化忌`));

                                const isAuspicious = ["文昌", "文曲", "左輔", "右弼", "天魁", "天鉞", "祿存", "天馬", "紅鸞", "天喜"].includes(cleanSub);
                                const isOminous = ["擎羊", "陀羅", "地空", "地劫"].includes(cleanSub);
                                const subColorStyle = isAuspicious 
                                  ? "text-[#3B7A57] font-semibold" 
                                  : isOminous 
                                  ? "text-[#7C8085] font-medium" 
                                  : "text-[#7A6E67]";

                                return (
                                  <div key={subStar} className="flex flex-col items-center leading-none text-[9.5px] font-serif shrink-0">
                                    <div className={`flex flex-col items-center ${subColorStyle}`}>
                                      {cleanSub.split("").map((c, i) => (
                                        <span key={i} className="scale-90">{c}</span>
                                      ))}
                                    </div>
                                    
                                    {/* 輔曜化氣印章 */}
                                    {(isSubHuaLu || isSubHuaQuan || isSubHuaKe || isSubHuaJi) && (
                                      <div className="mt-0.5 pointer-events-none select-none scale-75">
                                        {isSubHuaLu && <span className="w-3 h-3 rounded-full bg-[#4F7E66] flex items-center justify-center text-[6.5px] text-white font-bold leading-none">祿</span>}
                                        {isSubHuaQuan && <span className="w-3 h-3 rounded-full bg-[#4E6B82] flex items-center justify-center text-[6.5px] text-white font-bold leading-none">權</span>}
                                        {isSubHuaKe && <span className="w-3 h-3 rounded-full bg-[#B38F4D] flex items-center justify-center text-[6.5px] text-white font-bold leading-none">科</span>}
                                        {isSubHuaJi && <span className="w-3 h-3 rounded-full bg-[#9E4747] flex items-center justify-center text-[6.5px] text-white font-bold leading-none">忌</span>}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* 下半區：經典底線，完美置入大限十年、宮干地支(垂直)、納音 */}
                        <div className="flex justify-between items-end bg-[#FAF7F2]/50 hover:bg-[#FAF7F2]/10 border-t border-[#EBE3D5] p-1 md:p-1.5 text-[8.5px] font-serif select-none">
                          
                          {/* 左下：大限區段與宮位標籤 (命宮硃砂紅高亮) */}
                          {/* 左下：大限區段與宮位標籤 (命宮硃砂紅高亮) */}
          {/* 左下：大限區段與宮位標籤 (命宮硃砂紅高亮) */}
          <div className="flex flex-col items-start gap-1">
            
            {/* 第一排：幾歲到幾歲 + 傳統小宮位 */}
            <div className="flex items-center gap-1.5 opacity-90">
              <span className="font-mono text-[8px] text-stone-500 font-medium tracking-tight">
                {groupStartAge}-{groupEndAge} 歲
              </span>
              <span className="text-[8.5px] font-serif text-stone-400 border border-stone-300/50 px-1 py-[1px] rounded bg-stone-50/50">
                {p.name}
              </span>
            </div>

            {/* 第二排：白話文翻譯與特效 (統一優雅字體) */}
            <span className={`text-[10.5px] font-serif tracking-widest px-1.5 py-0.5 rounded-sm transition-all duration-300 ${
             (currentAge >= groupStartAge && currentAge <= groupEndAge)
                ? "bg-[#8E3232]/90 text-white shadow-sm"
                : isSelected
                ? "bg-[#8C7A6B]/80 text-white shadow-sm"
                : isSfszRelated
                ? "bg-[#8C7A6B]/15 text-[#7A6C58]"
                : "text-[#5C4D3C]"
            }`}>
              {{
                "命宮": "核心性格與人生",
                "兄弟": "人際互動與平輩",
                "夫妻": "感情觀與伴侶",
                "子女": "創意投資與晚輩",
                "財帛": "理財能力與價值",
                "疾厄": "身體健康與潛意識",
                "遷移": "外在環境與公眾",
                "僕役": "交友與社交圈",
                "交友": "交友與社交圈",
                "官祿": "職涯發展與成就",
                "田宅": "家庭環境與資產",
                "福德": "心靈滿足與精神",
                "父母": "長輩緣與導師"
              }[p.name] || p.name}
            </span>
            
          </div>

                          {/* 中底：納音 */}
                          <div className="hidden lg:block text-[7.5px] text-stone-400 font-serif leading-none tracking-tighter max-w-[42px] truncate pb-0.5">
                            {nayinName}
                          </div>

                          {/* 右下：經典地支配宮干，上下垂直排列 */}
                          <div className="flex flex-col items-center justify-center text-[9px] font-serif leading-tight font-bold shrink-0">
                            <span className="text-stone-400 font-semibold">{palaceGan}</span>
                            <span className="text-stone-800">{p.zhi}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* 經典三方四正 (San Fang Si Zheng) 網格星軌 SVG 動態連線 (圖極美，字極簡) */}
                  {sfsz && (() => {
                    const getCoord = (zhi: string) => BRANCH_COORDINATES[zhi] || { x: "50%", y: "50%" };
                    const pActive = getCoord(sfsz.active?.zhi);
                    const pOpposite = getCoord(sfsz.opposite?.zhi);
                    const pTrine1 = getCoord(sfsz.trineA?.zhi);
                    const pTrine2 = getCoord(sfsz.trineB?.zhi);

                    return (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ mixBlendMode: "multiply" }}>
                        {/* 核心本宮至對宮的一箭穿乾坤線 */}
                        <line x1={pActive.x} y1={pActive.y} x2={pOpposite.x} y2={pOpposite.y} stroke="#D4AF37" strokeWidth="2" strokeDasharray="5 3" className="animate-pulse" />
                        
                        {/* 本宮至兩翼合宮的拱照金絲線 */}
                        <line x1={pActive.x} y1={pActive.y} x2={pTrine1.x} y2={pTrine1.y} stroke="#8C7A6B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                        <line x1={pActive.x} y1={pActive.y} x2={pTrine2.x} y2={pTrine2.y} stroke="#8C7A6B" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.8" />
                        
                        {/* 合宮相互協同的基石屏障線 */}
                        <line x1={pTrine1.x} y1={pTrine1.y} x2={pOpposite.x} y2={pOpposite.y} stroke="#8C7A6B" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
                        <line x1={pTrine2.x} y1={pTrine2.y} x2={pOpposite.x} y2={pOpposite.y} stroke="#8C7A6B" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
                        <line x1={pTrine1.x} y1={pTrine1.y} x2={pTrine2.x} y2={pTrine2.y} stroke="#8C7A6B" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />

                        {/* 本宮炫爛脈衝亮圈 */}
                        <circle cx={pActive.x} cy={pActive.y} r="16" fill="none" stroke="#D4AF37" strokeWidth="1" className="animate-ping" style={{ animationDuration: "3s" }} opacity="0.3" />
                        <circle cx={pActive.x} cy={pActive.y} r="5" fill="#D4AF37" stroke="#FFFFFF" strokeWidth="1.5" className="shadow-xs" />
                        
                        {/* 副宮小圓點 */}
                        <circle cx={pOpposite.x} cy={pOpposite.y} r="4.5" fill="#8C7A6B" stroke="#FFFFFF" strokeWidth="1.2" />
                        <circle cx={pTrine1.x} cy={pTrine1.y} r="4.5" fill="#8C7A6B" stroke="#FFFFFF" strokeWidth="1.2" />
                        <circle cx={pTrine2.x} cy={pTrine2.y} r="4.5" fill="#8C7A6B" stroke="#FFFFFF" strokeWidth="1.2" />
                      </svg>
                    );
                  })()}
                </div>

                {/* Mobile 版本自適應 (宮位選擇之雙維度視角) */}
                <div className="md:hidden space-y-4 text-left">
                  {/* 切換按鈕 */}
                  <div className="flex justify-between items-center bg-[#FAF8F5] border border-[#EBE3D5] p-1 rounded-xl">
                    <span className="text-[11px] font-bold text-[#8C7A6B] font-serif pl-2 flex items-center gap-1">
                      <span>📱</span> 行動盤視角切換:
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setMobilePalaceMode("tabs")}
                        className={`px-3 py-1 text-[10px] font-serif font-bold rounded-lg transition-all ${
                          mobilePalaceMode === "tabs"
                            ? "bg-[#8C7A6B] text-white shadow-xs"
                            : "bg-transparent text-[#8C8375] hover:text-[#8C7A6B]"
                        }`}
                      >
                        🌟 滑動標籤
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobilePalaceMode("list")}
                        className={`px-3 py-1 text-[10px] font-serif font-bold rounded-lg transition-all ${
                          mobilePalaceMode === "list"
                            ? "bg-[#8C7A6B] text-white shadow-xs"
                            : "bg-transparent text-[#8C8375] hover:text-[#8C7A6B]"
                        }`}
                      >
                        🧭 12宮盤星
                      </button>
                    </div>
                  </div>

                  {mobilePalaceMode === "tabs" ? (
                    /* 宮位橫向滾動選擇器 */
                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-none">
                      {result.ziweiPalaces.map((p) => {
                        const isSelected = activePalace?.name === p.name;
                        const hasHuaJi = p.minorStars ? p.minorStars.some(s => s.includes("化忌")) : false;
                        const hasHuaLu = p.minorStars ? p.minorStars.some(s => s.includes("化祿")) : false;
                        return (
                          <button
                            key={`${p.name}-${result.calcId || 'default'}`}
                            onClick={() => setSelectedPalace(p)}
                            className={`px-3.5 py-2 text-xs font-serif rounded-xl whitespace-nowrap border shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-[#8C7A6B] border-[#8C7A6B] text-white font-bold"
                                : "bg-[#FAF9F5] border-[#EBE3D5] text-[#736B5E] hover:border-[#8C7A6B]"
                            }`}
                          >
                            <span>{p.name} {hasHuaJi && <span className="text-[9px] bg-[#FCF2F0] text-[#D9534F] font-extrabold px-1 rounded">忌</span>}{hasHuaLu && <span className="text-[9px] bg-[#F0FAF4] text-[#22C55E] font-extrabold px-1 rounded">祿</span>}</span>
                            <span className="opacity-75 text-[10px]">({p.zhi})</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* 全宮位星曜緊湊網格檢視，對應 12 地支盤 */
                    <div className="grid grid-cols-3 gap-2 pb-1 text-left">
                      {result.ziweiPalaces.map((p) => {
                        const isSelected = activePalace?.name === p.name;
                        const hasHuaJi = p.minorStars ? p.minorStars.some(s => s.includes("化忌")) : false;
                        const hasHuaLu = p.minorStars ? p.minorStars.some(s => s.includes("化祿")) : false;
                        
                       return (
  <button
    key={`${p.name}-grid-${result.calcId || 'default'}`}
    onClick={() => setSelectedPalace(p)}
    className={`p-2 rounded-xl border transition-all relative flex flex-col justify-between aspect-square cursor-pointer ${
      isSelected
        ? "bg-[#FCFAF2] border-[#8C7A6B] ring-1 ring-[#8C7A6B]"
        : "bg-white border-[#EBE3D5] hover:border-[#8C7A6B]"
    }`}
  >
    {/* 1. 最上層：大限年紀 (左) 與 地支 (右) */}
    <div className="flex justify-between items-start w-full leading-none">
      <span className="text-[9px] md:text-[10px] text-[#8C8375] font-mono opacity-80">
{(() => {
  // 1. 抓出原始的 iztro 資料 (這是一切的源頭)
  const rawPalaces = (result as any).iztroData?.palaces;
  // 2. 在原始資料中找到當前宮位對應的資訊
  const rawData = rawPalaces?.find((pItem: any) => pItem.name === p.name);
  // 3. 暴力回傳年齡，如果找不到就顯示空值
  return rawData?.decadal?.range || "";
})()}
      </span>
      <span className="text-[9px] font-sans text-stone-400">
        {p.zhi}宮
      </span>
    </div>

    {/* 2. 中間層：主星顯示 (如果沒有主星就顯示無主星) */}
    <div className="flex flex-col items-center justify-center flex-grow w-full overflow-hidden">
      <span className="text-[10px] md:text-[11.5px] font-bold text-[#3C352E] font-serif leading-tight">
        {p.majorStars && p.majorStars.length > 0 
          ? p.majorStars.slice(0, 2).join("") 
          : "無主星"}
      </span>
    </div>

    {/* 3. 最下層：白話文與宮位名稱 */}
    <div className="flex flex-col items-start w-full border-t border-[#EBE3D5]/50 pt-1 mt-0.5 text-left leading-none">
      <span className={`text-[8px] opacity-70 font-serif ${
        p.name === "命宮" ? "text-[#8C7A6B]" : "text-[#736B5E]"
      }`}>
        {p.name}
      </span>
      <span className="text-[10px] font-serif font-bold text-[#5C4D3C] mt-0.5 tracking-widest truncate w-full">
        {{
          "命宮": "核心性格與人生",
          "兄弟": "人際互動與平輩",
          "夫妻": "感情觀與伴侶",
          "子女": "創意投資與晚輩",
          "財帛": "理財能力與價值",
          "疾厄": "身體健康與潛意識",
          "遷移": "外在環境與公眾",
          "僕役": "交友與社交圈",
          "交友": "交友與社交圈",
          "官祿": "職涯發展與成就",
          "田宅": "家庭環境與資產",
          "福德": "心靈滿足與精神",
          "父母": "長輩緣與導師"
        }[p.name] || p.name}
      </span>
    </div>

    {/* 4. 四化點綴 (保留你原本精巧的設計) */}
    {(hasHuaJi || hasHuaLu) && (
      <div className="absolute bottom-1 right-1 flex gap-0.5">
        {hasHuaLu && <span className="w-1.5 h-1.5 rounded-full bg-green-500 block" title="化祿" />}
        {hasHuaJi && <span className="w-1.5 h-1.5 rounded-full bg-red-400 block" title="化忌" />}
      </div>
    )}
  </button>
);
                      })}
                    </div>
                  )}
                </div>

                {/* 宮位點擊查看詳細卡片板塊 (完美實現精緻卡片感與圖多字少之最高指導) */}
                <AnimatePresence mode="wait">
                  {activePalace && (
                    <motion.div
                      key={`${activePalace.name}-${result.calcId || 'default'}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-[#FCFAF7] border-2 border-[#EBE3D5] rounded-3xl p-5 md:p-6 leading-normal font-serif text-left relative overflow-hidden shadow-md"
                    >
                      <span className="text-[10px] text-[#A69D90] font-mono tracking-widest block uppercase text-left">
                        PALACE DETAILED DESCRIPTION & ANALYSIS WIDGET
                      </span>
                      <h4 className="text-sm font-serif font-bold text-[#8C7A6B] mt-1 mb-4 flex items-center justify-between pb-2 border-b border-[#F5EFE4]">
                        <span className="flex items-center gap-1.5">
                          <span>🏮</span>
                          <span>{activePalace.name}白話特質 ‧ 時空能場大透視</span>
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 font-semibold bg-white border border-[#EACBB0]/40 px-2.5 py-0.5 rounded-full">
                          {activePalace.zhi} 宮位 / Gong
                        </span>
                      </h4>

                      {(() => {
                        const elementalStats = { "木": 0, "火": 0, "土": 0, "金": 0, "水": 0 };
                        activePalace.majorStars.forEach(s => {
                          if (s === "無主星") return;
                          const el = getStarElement(s).name;
                          if (el in elementalStats) elementalStats[el as keyof typeof elementalStats] += 2;
                        });
                        activePalace.minorStars.forEach(s => {
                          const cleanS = s.includes("·") ? s.split("·")[0] : s;
                          const el = getStarElement(cleanS).name;
                          if (el in elementalStats) elementalStats[el as keyof typeof elementalStats] += 1;
                        });

                        const luShuaiDetails = (() => {
                          switch(activePalace.luShuai) {
                            case "廟": return { pct: 95, text: "極致飽滿 ‧ 乘風破浪 (廟)", color: "text-[#D4AF37]", stroke: "#D4AF37", desc: "命盤中最飽滿的天賦能池，富庶有福，大吉常在。" };
                            case "旺": return { pct: 85, text: "清朗和氣 ‧ 乘時而動 (旺)", color: "text-[#8C7A6B]", stroke: "#8C7A6B", desc: "運能清亮，行動力具足，事半功倍之大吉兆象。" };
                            case "平": return { pct: 70, text: "中和安寧 ‧ 穩紮穩打 (平)", color: "text-stone-500", stroke: "#A19A8F", desc: "氣息中正平和，無風無雨，宜守正不阿、靜享歲月。" };
                            case "陷": return { pct: 45, text: "低沈自醒 ‧ 內聚修行 (陷)", color: "text-[#EF4444]", stroke: "#EF4444", desc: "能量低聚有考驗，象徵自我反省、暗中修煉的福地。" };
                            default: return { pct: 70, text: "微光和諧 (平)", color: "text-stone-500", stroke: "#A19A8F", desc: "運勢穩健，宜寬和前行。" };
                          }
                        })();

                        return (
                          <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 leading-relaxed">
                            
                            {/* 左側：算命盤五行能量儀盤 */}
                            <div className="space-y-4">
                              
                              {/* 元氣亮度 */}
                              <div className="bg-white border border-[#EBE3D5] rounded-2xl p-4 flex sm:flex-row items-center justify-around text-left gap-4 shadow-2xs relative">
                                <span className="absolute top-2 right-3 text-[8px] text-stone-300 font-mono">GONG INTENSITY</span>
                                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                                  <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="38" stroke="#FDFBFAF0" strokeWidth="5" fill="none" />
                                    <circle 
                                      cx="48" 
                                      cy="48" 
                                      r="38" 
                                      stroke={luShuaiDetails.stroke} 
                                      strokeWidth="6" 
                                      fill="none" 
                                      strokeDasharray="239"
                                      strokeDashoffset={239 - (239 * luShuaiDetails.pct) / 100}
                                      strokeLinecap="round"
                                      className="transition-all duration-1000 ease-out"
                                    />
                                  </svg>
                                  <div className="absolute text-center leading-none">
                                    <span className="text-lg font-mono font-black text-[#3C352E]">{luShuaiDetails.pct}%</span>
                                    <span className="text-[10px] font-bold text-stone-400 block tracking-tight uppercase mt-0.5">VITALITY</span>
                                  </div>
                                </div>
                                <div className="space-y-1 font-serif">
                                  <h5 className={`text-[15px] font-bold leading-tight ${luShuaiDetails.color}`}>
                                    {luShuaiDetails.text}
                                  </h5>
                                  <p className="text-[14px] text-[#8C8375] leading-normal font-serif">
                                    {luShuaiDetails.desc}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* 右側：白話剖析與吉曜四化 */}
                            <div className="space-y-4 text-left">
                              <div className="bg-white border border-[#EBE3D5] p-5 rounded-2xl shadow-2xs space-y-4">
                                <div className="space-y-2">
                                  <p className="font-bold text-[#3C352E] flex items-center gap-1 pb-1 border-b border-[#F7F5F0] text-[11.5px]">
                                    <span>✨</span>
                                    <span>本宮主曜天賦解析</span>
                                  </p>
                                 <div className="text-[16px] md:text-[18px] text-[#333333] select-text font-serif leading-[1.8]">
                                    {activePalace.majorStars.length > 0 && activePalace.majorStars[0] !== "無主星" ? (
                                      <>
                                        此宮位星宿能量「{activePalace.majorStars.join("、")}」在此相疊照臨。
                                        {activePalace.luShuai === "廟" || activePalace.luShuai === "旺"
                                          ? " 其廟旺氣勢能為該領域注入極高精神儲備，無論事業感情，多能逆流直上。"
                                          : " 主星亮度平陷，象徵此人生物理主題不宜勉強，利於後天修養、謙和安穩。"}
                                      </>
                                    ) : (
                                      "此宮位安詳閒適，無重曜主星。在時空中，無主星象徵著在此人生主題上擁有不受限制的塑性。大膽借對宮星曜論断，隨心隨緣即可福壽無風雨。"
                                    )}
                                  </div>
                                </div>

                                <div className="border-t border-[#FAF8F5] pt-3">
                                  <p className="font-bold text-[#3C352E] flex items-center gap-1 pb-1 border-b border-[#F7F5F0]text-[15px] md:text-[17px]">
                                    <span>🔮</span>
                                    <span>輔曜吉凶四化診斷</span>
                                  </p>
                                  <div className="flex flex-wrap gap-1 py-1 scale-95 origin-left">
                                    {activePalace.minorStars.length > 0 ? (
                                      activePalace.minorStars.map(s => {
                                        let badgeTheme = "bg-[#FAF8F5] border-[#EBE3D5] text-[#5C5043]";
                                        if (s.includes("化忌")) {
                                          badgeTheme = "bg-[#FCF2F0] border-[#F2C5C1] text-[#D9534F]";
                                        } else if (s.includes("化祿")) {
                                          badgeTheme = "bg-[#F0FAF4] border-[#B2E6C3] text-[#22C55E]";
                                        }
                                        return (
                                          <span key={s} className={`px-1.5 py-0.1 rounded border font-medium text-[12px] font-sans ${badgeTheme}`}>
                                            {s}
                                          </span>
                                        );
                                      })
                                    ) : (
                                      <span className="text-stone-400 italic text-[14px]">宮位清平安穩，無飛曜四化</span>
                                    )}
                                  </div>
                                  <div className="text-[15px] md:text-[17px] text-[#4A4A4A] leading-[1.8] select-text font-serif mt-1.5">
                                    {renderFormattedMinorStars(activePalace.name, activePalace.minorStars)}
                                  </div>
                                </div>
                              </div>
                            </div>

                          </div>
                          
                          {/* 互動式的引導區：一鍵導向第四章深度一對一解答 */}
                          <div id={`palace-guide-${activePalace.name}`} className="mt-4 bg-[#FAF5EE] border border-[#EBDCC5]/60 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-base shrink-0 mt-0.5">💬</span>
                              <div className="min-w-0">
                                <p className="text-[14px] md:text-[16px] font-bold text-[#5C4D3C] leading-snug">想要深度探究「{activePalace.name}」中複雜星曜的本格與時空「真實命理玄奧解析」嗎？</p>
                                <p className="text-[13px] md:text-[15px] text-[#8C8375] font-sans mt-0.5 leading-relaxed">不論是流年干支、四化飛星的交互沖擊，或是面對具體人生疑惑，隨行顧問已落座第四章【微光一對一心靈晤談】隨時為您開解。</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const element = document.getElementById("chapter-4-section");
                                if (element) {
                                  element.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className="shrink-0 bg-[#8C7A6B] hover:bg-[#706053] text-[13px] md:text-[14px] text-white px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-3xs"
                            >
                              落座晤談 ☕
                            </button>
                          </div>
                        </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 第二單元：大正九星氣學 (Kyusei Kigaku) */}
              <div className="space-y-4">
                <div className="flex items-center border-b border-[#EBE3D5] pb-2 text-left">
                  <div className="w-6 h-6 rounded-full bg-[#FAF5EE] border border-[#EBDCC5] flex items-center justify-center text-xs text-[#8C7A6B] mr-2">
                    🌱
                  </div>
                  <h3 className="text-[18px] md:text-[20px] font-serif text-[#5C4D3C] tracking-widest font-semibold uppercase">
                    第二章 ‧ 扶桑九星氣學 / THE NATURAL SPIRIT MATRIX
                  </h3>
                </div>

                <p className="text-[16px] md:text-[18px] leading-[1.8] text-[#1F1B18] font-serif leading-relaxed text-left font-medium">
                  九星氣學（Kyusei Kigaku）將世間靈魂比作九種天地初生的能量氣流。我們是風、是水、或者是廣袤的大地。
                  這裡為你解讀出生年份的「本命星（你隱密、本然的靈魂深谷）」與出生月份的「月命星（你與日常世界溫柔交手的方式）」：
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* 本命星 */}
                  <div className="bg-white border border-[#EBE3D5] rounded-2xl p-5.5 space-y-3 shadow-sm text-left relative overflow-hidden font-serif">
                    <span className="text-[12px] md:text-[14px] text-[#5C4D3C] block font-sans tracking-widest font-bold uppercase">本命星 (Year Star) - 天生內在靈魂</span>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm"
                        style={{ backgroundColor: result.kyusei.yearStar.color }}
                      >
                        {result.kyusei.yearStar.name.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-[18px] md:text-[20px] font-bold font-serif font-semibold text-[#1F1B18]">
                          {result.kyusei.yearStar.name}
                        </h4>
                        <p className="text-[14px] md:text-[15px] text-[#1F1B18] font-serif">
                          大自然五行屬性：<strong className="text-[#A44330]">{result.kyusei.yearStar.element}</strong> 元素
                        </p>
                      </div>
                    </div>
                    <p className="text-[15px] md:text-[17px] text-[#1F1B18] font-serif leading-[1.8] italic bg-[#FDFCFB] border border-[#F0EAE1] p-3 rounded-xl font-medium opacity-100">
                      💡 {result.kyusei.yearStar.desc}
                    </p>
                  </div>

                  {/* 月命星 */}
                  <div className="bg-white border border-[#EBE3D5] rounded-2xl p-5.5 space-y-3 shadow-sm text-left relative overflow-hidden font-serif">
                    <span className="text-[12px] md:text-[14px] text-[#5C4D3C] block font-sans tracking-widest font-bold uppercase">月命星 (Month Star) - 日常做事與外在習慣</span>
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-serif font-bold text-sm shadow-sm"
                        style={{ backgroundColor: result.kyusei.monthStar.color }}
                      >
                        {result.kyusei.monthStar.name.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-sm font-serif font-semibold text-[#1F1B18]">
                          {result.kyusei.monthStar.name}
                        </h4>
                        <p className="text-[14px] md:text-[15px] text-[#1F1B18] font-serif">
                          大自然五行屬性：<strong className="text-[#A44330]">{result.kyusei.monthStar.element}</strong> 元素
                        </p>
                      </div>
                    </div>
                    <p className="text-[15px] md:text-[17px] text-[#1F1B18] font-serif leading-[1.8] italic bg-[#FDFCFB] border border-[#F0EAE1] p-3 rounded-xl font-medium opacity-100">
                      💡 {result.kyusei.monthStar.desc}
                    </p>
                  </div>

                </div>

                {/* 空間方位小開運 */}
                <div className="bg-[#FCFAF2] border border-[#E9E1CD] rounded-2xl p-5 text-left grid grid-cols-1 md:grid-cols-2 gap-5 leading-normal font-serif">
                  <div className="space-y-2">
                    <div className="flex items-center text-[16px] md:text-[18px] font-bold text-[#1F1B18]">
                      <span className="mr-1.5">🍀</span>
                      <span>常駐開運吉利方向 (Lucky Directions)：</span>
                    </div>
                    <ul className="text-[15px] md:text-[16px] text-[#1F1B18] space-y-1.5 pl-1.5 font-medium">
                      {result.kyusei.luckyDirections.map((dir, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          <span>{dir}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-centertext-[16px] md:text-[18px] font-bold text-[#A44330]">
                      <span className="mr-1.5">🛡️</span>
                      <span>日常守護避忌方向 (Avoid Directions)：</span>
                    </div>
                    <ul className="text-[15px] md:text-[16px] text-[#1F1B18] space-y-1.5 pl-1.5 font-medium">
                      {result.kyusei.avoidDirections.map((dir, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                          <span>{dir}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 第三單元：陪伴旅伴 · 終身生活詳批長卷 */}
              <div id="report-section" className="bg-white border border-[#EBE3D5] p-6 md:p-9 shadow-[0_8px_30px_rgba(140,122,107,0.02)] relative overflow-hidden rounded-3xl">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-[#8C7A6B]" />
                
                {/* 頂部說明與狀態 */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-5 border-b border-[#EBE3D5] gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#EBE3D5] shadow-xs">
                      <Bot className="w-6 h-6 text-[#8C7A6B]" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-serif font-semibold text-lg text-[#3C352E] flex flex-wrap items-center gap-2">
                        <span>第三章 ‧ 微光手記 ‧ 終身運勢引導長卷</span>
                        {result.offlineUsed && (
                          <span className="text-[9px] font-sans font-semibold bg-[#FAF0E6] text-[#8C664B] border border-[#EBD7C0]/60 px-2.5 py-0.5 uppercase tracking-wider rounded-full">
                            ✨ 在地禪定靜悟 (100% 穩定排盤)
                          </span>
                        )}
                        {result.fallbackUsed && !result.offlineUsed && (
                          <span className="text-[9px] font-sans font-semibold bg-[#F5F2EC] text-[#8C7A6B] border border-[#EBE3D5] px-2.5 py-0.5 uppercase tracking-wider rounded-full">
                            觀星閣備用啟示
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-[#8C8375] mt-1 font-serif">
                        基於本命斗數十二星官軌跡與遁甲九星之流動氣學縝密撰寫，為你的日常帶來溫潤前行的指南
                      </p>
                    </div>
                  </div>
                  <div className="bg-[#FAF8F5] border border-[#EBE3D5] px-4 py-2.5 rounded-xl text-left shadow-xs">
                    <span className="text-[10px] text-[#8C7A6B] block font-bold uppercase tracking-wider">選中聚焦主題 FOCUS</span>
                    <span className="text-xs text-[#3C352E] font-serif mt-0.5 block font-bold">🎯 {result.personalInfo.focusArea}</span>
                  </div>
                </div>

                {/* 貼心是在地批盤通知 */}
                {result.offlineUsed && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-5 bg-[#FAF8F5] border-l-4 border-[#8C664B] rounded-r-2xl text-left shadow-2xs flex gap-3.5 items-start"
                  >
                    <Info className="w-5 h-5 text-[#8C664B] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#8C664B] font-serif tracking-wider flex items-center gap-1.5">
                        <span>☯️</span>
                        <span>心靈夥伴啟示：當前啟用「在地禪定排盤引擎」</span>
                      </h4>
                      <p className="text-[11px] text-[#736A5D] leading-relaxed mt-1 font-serif">
                        因當前伺服器在線 AI 星盤引導者的每日批算配額已達上限。為確保有緣人 100% 能即時點亮星盤、不再為加載受阻而煩憂，系統已無縫為您落座<strong>「在地古籍禪定引擎 ☯️」</strong>。
                        我們同樣精密推演您的生辰干支、紫微 12 宮與日本九星星曜格局，為您呈現同樣不失文藝溫度、真摯貼心的生活引導報告！
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* 分頁頁籤 */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6 font-serif w-full">
                  {[
                    { id: "personality", label: "🌌 深度天賦性格", icon: User },
                    { id: "dailyFortune", label: "📅 每日時空能量", icon: Clock },
                    { id: "decisionToolkit", label: "🗝️ 微光決策軍師", icon: Compass },
                    { id: "career", label: "💼 生涯潛力軌跡", icon: Briefcase },
                    { id: "love", label: "💖 情感溫和相遇", icon: Heart },
                    { id: "wealth", label: "💰 物質與豐盛流動", icon: TrendingUp },
                    { id: "health", label: "🏥 身心節奏與療癒", icon: Shield },
                    { id: "lifeGuidance", label: "🍀 開運色與日常", icon: Sparkles },
                    { id: "currentYearFortune", label: "Lantern 2026 歲月流流", icon: Flame },
                    { id: "premiumClick108", label: "💎 科技紫微極致詳批", icon: Award }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isTabLocked = !isPremiumUnlocked && ["career", "love", "wealth", "currentYearFortune"].includes(tab.id);
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                       className={`py-3 px-2 border rounded-xl text-[13px] md:text-sm transition-all flex flex-col md:flex-row items-center justify-center gap-1.5 cursor-pointer ${
  isActive 
    ? "border-[#8C7A6B] text-[#5C4D3C] bg-[#FAF8F5] font-bold shadow-sm" 
    : "border-[#EBE3D5] text-[#8C857B] bg-transparent hover:border-[#8C7A6B] hover:text-[#8C7A6B]"
}`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#8C7A6B]" : "text-[#9E978C]"}`} />
                        <span>{tab.label}</span>
                        {isTabLocked && (
                          <span className="text-[9px] text-[#A67C52] font-semibold bg-[#FAF0E6] px-1 py-0.5 rounded ml-1 tracking-wider flex items-center gap-0.5 shadow-3xs shrink-0 scale-90 border border-[#EBD7C0]/60">
                            精批
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 批詞本文 */}
                <div className="bg-[#FAF8F6] rounded-2xl p-5 md:p-8 border border-[#EBE4D5] min-h-[220px] shadow-inner select-text">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#EAE3D5] pb-2 mb-3">
                        <span className="text-[9px] text-[#8C7A6B] font-serif font-bold uppercase tracking-widest">
                          生活引導札記 · COMPANION ORACLE NOTE
                        </span>
                        <span className="text-[8px] font-mono text-[#A19A8F] uppercase tracking-widest">WENQING COMPASSION</span>
                      </div>

                     <div className="font-serif leading-relaxed text-[#4E473F] text-[15px] md:text-[17px] antialiased px-1 text-left">
                       {activeTab === "personality" && renderFormattedText(result.aiAnalysis.personality, "text-[15px] md:text-[17px] text-[#3A322C] leading-relaxed")}
                        {activeTab === "dailyFortune" && (
                          <div className="space-y-6">
                            <div className="border-b border-[#EAE3D5] pb-3 text-left">
                              <h4 className="text-sm font-semibold text-[#5C4D3C] tracking-wide flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[#8C7A6B]" />
                                今日時空能量運勢：{formData.name} 的專屬指引
                              </h4>
                              <p className="text-[11px] text-[#8C8375] mt-1">
                                根據本命生肖「{result.personalInfo.shengxiao}」、本命九星「{result.kyusei?.yearStar?.name || "未知"}」，融會當日干支星曆與氣息頻率，精密演算出為期一日的微光引導。
                              </p>
                            </div>

                            <div className="bg-[#FAF9F5] border border-[#EBE3D5] p-5 rounded-2xl md:p-6 text-left space-y-5">
                              <div>
                                <span className="text-[10px] bg-[#EBE3D5] text-[#5C4D3C] px-2 py-0.5 rounded-full font-serif font-bold">
                                  🔮 每日星軌律動綜述
                                </span>
                                <p className="text-[14px] md:text-[16px] text-[#3A322C] font-medium font-serif leading-relaxed mt-2.5 antialiased select-text">
                                  {activeDailyFortune.summary}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {/* 宜 / 忌 */}
                                <div className="bg-white border border-[#F1EDE5] p-4 rounded-xl space-y-2">
                                  <span className="text-[15px] md:text-[16px] text-[#52734D] font-bold block border-b border-[#F0EAE1] pb-1">👍 今日最適宜</span>
                                  {activeDailyFortune.adviceDo.map((item: any, i: number) => (
                                    <div key={i} className="flex items-start gap-1.5 text-[14px] md:text-[15px] leading-[1.7] text-[#52734D]/90 font-serif">
                                      <span>✦</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="bg-white border border-[#F1EDE5] p-4 rounded-xl space-y-2">
                                  <span className="text-[15px] md:text-[16px] text-[#A45E4D] font-bold block border-b border-[#F0EAE1] pb-1">⚠️ 今日需避開</span>
                                  {activeDailyFortune.adviceDont.map((item: any, i: number) => (
                                    <div key={i} className="flex items-start gap-1.5text-[14px] md:text-[15px] leading-[1.7] text-[#A45E4D]/90 font-serif">
                                      <span>✦</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 搭配 */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F5EF] p-4 rounded-xl text-[15px] md:text-[16px] text-[#706355] font-serif select-text">
                                <div className="space-y-0.5">
                                  <span className="text-[13px] md:text-[14px] text-[#A19A8F] block">🎨 幸運色系</span>
                                  <span className="font-bold text-[#3C352E]">{activeDailyFortune.luckyColor}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[13px] md:text-[14px] text-[#A19A8F] block">🧭 開運吉方</span>
                                  <span className="font-bold text-[#3C352E]">{activeDailyFortune.luckyDirection.split(" · ")[0]}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[13px] md:text-[14px] text-[#A19A8F] block">🕒 黃金時段</span>
                                  <span className="font-bold text-[#3C352E]">{activeDailyFortune.luckyTime.split(" (")[0]}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[13px] md:text-[14px] text-[#A19A8F] block">🔮 開運數字</span>
                                  <span className="font-mono font-bold text-[#3C352E]">{activeDailyFortune.luckyNumber}</span>
                                </div>
                              </div>

                              {/* 今日療癒金句 */}
                              <blockquote className="border-l-4 border-[#8C7A6B] bg-[#FDFDFB] p-4 rounded-r-xl font-serif italic text-sm text-[#5C4D3C] text-center select-text">
                                {activeDailyFortune.zenWhisper}
                              </blockquote>

                              {/* 🔔 每日幸運投遞 ‧ 心靈晨曦提醒設定 */}
                              <div className="bg-[#FCFBF9] border border-[#E9DFCB] rounded-2xl p-4.5 md:p-5 space-y-4 text-left shadow-2xs mt-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-[#FAF5EC] border border-[#EBE3D5] rounded-xl text-lg shrink-0">
                                    🔔
                                  </div>
                                  <div className="space-y-1">
                                    <h5 className="text-[13px] font-bold text-[#4E453D] font-serif tracking-wide">
                                      每日幸運投遞 ‧ 心靈晨曦提醒
                                    </h5>
                                    <p className="text-[10.5px] text-[#8C8375] font-serif leading-relaxed">
                                      在清晨微光灑下之時，將您今日專屬的「幸運色系」與「開運避雷針」安全推送至您的裝置中，免去每日手動起盤查照之煩。
                                    </p>
                                  </div>
                                </div>

                                <div className="border-t border-[#F0EAE1] my-1" />

                                <div className="flex items-center justify-between py-1">
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-[#4E453D] block font-serif">啟用每日晨間運勢提醒</span>
                                    <span className="text-[10px] text-stone-400 block">我們將遵循時空星曆，在所定時辰自動投遞一抹小確幸</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!dailyNotificationEnabled) {
                                        handleRequestNotificationPermission();
                                      } else {
                                        setDailyNotificationEnabled(false);
                                        triggerFortuneToast("📴 已暫停每日運勢提醒功能，歡迎隨時回來開啟。");
                                      }
                                    }}
                                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                      dailyNotificationEnabled ? "bg-[#8C7A6B]" : "bg-stone-200"
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                        dailyNotificationEnabled ? "translate-x-5" : "translate-x-0"
                                      }`}
                                    />
                                  </button>
                                </div>

                                {dailyNotificationEnabled && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-2.5 space-y-3 border-t border-dashed border-[#E9DFCB]"
                                  >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      {/* 時辰選擇 */}
                                      <div className="space-y-1">
                                        <label className="text-[10.5px] font-bold text-[#5C4D3C] font-serif block">⏰ 每日投遞時分 (Delivery Time)</label>
                                        <div className="flex gap-1.5">
                                          <input
                                            type="time"
                                            value={dailyNotificationTime}
                                            onChange={(e) => {
                                              setDailyNotificationTime(e.target.value);
                                              triggerFortuneToast(`⏰ 已設定每日於清晨 ${e.target.value} 引流投遞。`);
                                            }}
                                            className="bg-white border border-[#D5C7B1] rounded-xl px-2.5 py-1.5 text-xs text-[#2E241B] font-mono outline-hidden focus:border-[#8C7A6B] focus:ring-1 focus:ring-[#8C7A6B] flex-1 cursor-pointer"
                                          />
                                        </div>
                                      </div>

                                      {/* 推送內容 */}
                                      <div className="space-y-1">
                                        <label className="text-[10.5px] font-bold text-[#5C4D3C] font-serif block">🎁 訂閱推送模組 (Content Subscribed)</label>
                                        <div className="flex flex-wrap gap-1.5">
                                          {[
                                            { id: "luckyColor", label: "幸運色" },
                                            { id: "advice", label: "開運建議" },
                                            { id: "summary", label: "綜合綜述" }
                                          ].map((ch) => {
                                            const isChecked = (dailyNotificationChannels as any)[ch.id];
                                            return (
                                              <button
                                                key={ch.id}
                                                type="button"
                                                onClick={() => {
                                                  const newVal = !isChecked;
                                                  setDailyNotificationChannels((prev) => ({
                                                    ...prev,
                                                    [ch.id]: newVal
                                                  }));
                                                  triggerFortuneToast(`🔔 已${newVal ? "啟用" : "取消"}訂閱【${ch.label}】模組。`);
                                                }}
                                                className={`py-1 px-2.5 rounded-lg border text-[10px] font-serif transition-colors ${
                                                  isChecked
                                                    ? "bg-[#8C7A6B] border-[#8C7A6B] text-white font-bold"
                                                    : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                                                }`}
                                              >
                                                {isChecked ? "✓ " : ""}{ch.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 按鈕組合 */}
                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={handleRequestNotificationPermission}
                                        className="py-2 px-3 bg-white border border-[#D5C7B1] hover:bg-stone-50 text-[10.5px] text-[#4E453D] font-bold rounded-xl transition-all font-serif cursor-pointer flex items-center justify-center gap-1"
                                      >
                                        ⚙️ 申請系統權限
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleTestSendNotification}
                                        className="py-2 px-3 bg-[#FAF5EC] border border-[#E9DFCB] hover:bg-[#F5ECD7] text-[10.5px] text-[#8C7A6B] font-bold rounded-xl transition-all font-serif cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                                      >
                                        ⚡ 測試派送即刻體驗
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {activeTab === "decisionToolkit" && (
                          <div className="space-y-8 select-text">
                            <div className="border-b border-[#EAE3D5] pb-3 text-left">
                              <h4 className="text-sm font-semibold text-[#5C4D3C] tracking-wide flex items-center gap-2">
                                <Compass className="w-4 h-4 text-[#8C7A6B]" />
                                🗝️ 微光關鍵抉擇過濾網 ‧ 時空心靈軍師
                              </h4>
                              <p className="text-[14px] md:text-[15px] text-[#8C8375] mt-1 font-serif leading-relaxed">
                                大家正面臨職涯、人際或重大抉擇時，常因不確定而感到焦慮。「微光決策軍師」結合您的紫微斗數星曜分佈與九星氣學特徵，專門為精準實用場景定制，避開假大空套話，協助您理性決策，守成避險。
                              </p>
                            </div>

                            {/* 決策工具專屬子分頁頁籤 */}
                            <div className="flex flex-wrap justify-center border-b border-[#EBE3D5] pb-2 mb-8 gap-3 font-serif">
                              {[
                                { id: "love", label: "💕 雙星時空合盤", bgActive: "border-[#A45E4D] text-[#8C3F34] bg-[#FDF8F6]", textActiveColor: "#8C3F34", dotColor: "bg-[#A45E4D]" },
                                { id: "career", label: "💼 職涯變動評估", bgActive: "border-[#8C7A6B] text-[#5C4D3C] bg-[#FAF8F5]", textActiveColor: "#5C4D3C", dotColor: "bg-[#8C7A6B]" },
                                { id: "wealth", label: "💰 財務破財避險", bgActive: "border-[#52734D] text-[#345230] bg-[#F4F9F2]", textActiveColor: "#345230", dotColor: "bg-[#52734D]" },
                              ].map((subTab) => {
                                const isActive = decisionSubTab === subTab.id;
                                return (
                                  <button
  key={subTab.id}
  type="button"
  onClick={() => setDecisionSubTab(subTab.id)}
  className={`py-2 px-4.5 text-[14px] md:text-[16px] border-b-2 transition-all duration-200 flex items-center gap-1.5 cursor-pointer
    ${isActive
      ? `${subTab.bgActive} border-b-2 font-bold shadow-3xs`
      : "border-transparent text-[#8C857B] hover:text-[#5C4D3C] hover:bg-stone-50"
    }`}
>
  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? subTab.dotColor : "bg-transparent"}`} />
  <span>{subTab.label}</span>
</button>
                                );
                              })}
                            </div>

                            {/* 單一卡片極簡禪意呈現區 */}
                            <div className="max-w-xl mx-auto w-full transition-all duration-300">
                              <motion.div
                                key={decisionSubTab}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                              >
                                {decisionSubTab === "career" && (
                                  <div className="bg-[#FAF9F5] border-2 border-[#EADFC9] p-6 md:p-8 rounded-3xl flex flex-col justify-between text-left space-y-5 shadow-sm">
                                    <div className="space-y-3.5">
                                      <div className="flex items-center gap-2">
                                        <span className="p-1 px-3 text-[10px] bg-[#E8DFD0] text-[#4A3928] rounded-md font-extrabold font-serif">💼 職涯評估</span>
                                        <h5 className="text-sm font-extrabold text-[#2E241B] font-serif">轉職 / 創業勝率</h5>
                                      </div>
                                      <p className="text-[11.5px] text-stone-700 font-medium leading-relaxed font-serif">
                                        精密比對本命「官祿宮」星曜，預測特定新工作的融入勝率與隱藏小人。
                                      </p>
                                      
                                      <div className="space-y-3 pt-1">
                                        <div>
                                          <label className="text-[10px] text-stone-800 font-bold block mb-1.5">目標公司的職能/類型</label>
                                          <input
                                            type="text"
                                            placeholder="例：A公司資深PM / 熱音咖啡廳"
                                            value={decisionCareerRole}
                                            onChange={(e) => setDecisionCareerRole(e.target.value)}
                                            className="w-full bg-white border border-[#D5C7B1] rounded-lg px-3 py-2 text-[11.5px] text-[#2E241B] outline-none placeholder:text-stone-400 focus:border-[#8C7A6B] focus:ring-1 focus:ring-[#8C7A6B] h-[36px]"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-stone-800 font-bold block mb-1.5">決策路徑類型</label>
                                          <div className="flex gap-2">
                                            {["careerChange", "startup"].map((type) => (
                                              <button
                                                key={type}
                                                type="button"
                                                onClick={() => setDecisionCareerType(type as any)}
                                                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-bold transition-all border cursor-pointer ${
                                                  decisionCareerType === type
                                                    ? "bg-[#8C7A6B] border-[#8C7A6B] text-white font-serif shadow-2xs"
                                                    : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                                                }`}
                                              >
                                                {type === "careerChange" ? "跳槽/考公" : "獨立創業"}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={handleCalculateCareerDecision}
                                      disabled={isCalculatingCareer || !decisionCareerRole.trim()}
                                      className="w-full py-2.5 bg-[#8C7A6B] hover:bg-[#706053] disabled:bg-stone-200 text-white font-semibold text-xs font-serif rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      {isCalculatingCareer ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                          <span>正在通靈排盤...</span>
                                        </>
                                      ) : "🔮 精算職涯變動勝率"}
                                    </button>
                                  </div>
                                )}

                                {decisionSubTab === "love" && (
                                  <div className="bg-[#FAF9F5] border-2 border-[#EADFC9] p-6 md:p-8 rounded-3xl flex flex-col justify-between text-left space-y-5 shadow-sm">
                                    <div className="space-y-3.5">
                                      <div className="flex items-center gap-2">
                                        <span className="p-1 px-3 text-[10px] bg-[#FADBD0] text-[#7E2514] rounded-md font-extrabold font-serif">💕 緣分雷達</span>
                                        <h5 className="text-sm font-extrabold text-[#2E241B] font-serif">紫微命盤雙星合盤</h5>
                                      </div>
                                      <p className="text-[11.5px] text-stone-700 font-medium leading-relaxed font-serif">
                                        輸入對方的出生日期與時辰，智慧比對雙方的紫微命盤，分析彼此在「性格互補」與「溝通盲點」上的互動趨勢，並建議最佳避險開運模式。
                                      </p>

                                      <div className="space-y-3 pt-1">
                                        <div className="grid grid-cols-2 gap-2.5">
                                          <div>
                                            <label className="text-[10px] text-stone-800 font-bold block mb-1.5">對方姓名/稱呼</label>
                                            <input
                                              type="text"
                                              placeholder="例：小張"
                                              value={decisionLovePartner}
                                              onChange={(e) => setDecisionLovePartner(e.target.value)}
                                              className="w-full bg-white border border-[#D5C7B1] rounded-lg px-3 py-2 text-[11.5px] text-[#2E241B] outline-none placeholder:text-stone-400 focus:border-[#A45E4D] focus:ring-1 focus:ring-[#A45E4D] h-[36px]"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-stone-800 font-bold block mb-1.5">關係狀態</label>
                                            <select
                                              value={decisionLoveRole}
                                              onChange={(e) => setDecisionLoveRole(e.target.value)}
                                              className="w-full bg-white border border-[#D5C7B1] rounded-lg px-2.5 py-1.5 text-[11px] text-[#2E241B] outline-none h-[36px]"
                                            >
                                              <option value="曖昧對象">曖昧對象</option>
                                              <option value="穩定情侶關係">穩定情侶關係</option>
                                              <option value="夫妻關係">夫妻關係</option>
                                              <option value="新交往伴侶">新交往伴侶</option>
                                              <option value="工作合夥人">工作合夥人</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                          <div>
                                            <label className="text-[10px] text-stone-800 font-bold block mb-1.5">對方的生辰日期</label>
                                            <input
                                              type="date"
                                              value={decisionLovePartnerBirthDate}
                                              onChange={(e) => setDecisionLovePartnerBirthDate(e.target.value)}
                                              className="w-full bg-white border border-[#D5C7B1] rounded-lg px-2.5 py-1 text-[11px] text-[#2E241B] outline-none h-[36px]"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[10px] text-stone-800 font-bold block mb-1.5">對方的出生時辰</label>
                                            <select
                                              value={decisionLovePartnerBirthHour}
                                              onChange={(e) => setDecisionLovePartnerBirthHour(e.target.value)}
                                              className="w-full bg-white border border-[#D5C7B1] rounded-lg px-2.5 py-1 text-[11px] text-[#2E241B] outline-none h-[36px]"
                                            >
                                              <option value="子時 (23:00-01:00)">子時 (23:00-01:00)</option>
                                              <option value="丑時 (01:00-03:00)">丑時 (01:00-03:00)</option>
                                              <option value="寅時 (03:00-05:00)">寅時 (03:00-05:00)</option>
                                              <option value="卯時 (05:00-07:00)">卯時 (05:00-07:00)</option>
                                              <option value="辰時 (07:00-09:00)">辰時 (07:00-09:00)</option>
                                              <option value="巳時 (09:00-11:00)">巳時 (09:00-11:00)</option>
                                              <option value="午時 (11:00-13:00)">午時 (11:00-13:00)</option>
                                              <option value="未時 (13:00-15:00)">未時 (13:00-15:00)</option>
                                              <option value="申時 (15:00-17:00)">申時 (15:00-17:00)</option>
                                              <option value="酉時 (17:00-19:00)">酉時 (17:00-19:00)</option>
                                              <option value="戌時 (19:00-21:00)">戌時 (19:00-21:00)</option>
                                              <option value="亥時 (21:00-23:00)">亥時 (21:00-23:00)</option>
                                            </select>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={handleCalculateLoveDecision}
                                      disabled={isCalculatingLove || !decisionLovePartner.trim()}
                                      className="w-full py-2.5 bg-[#A45E4D] hover:bg-[#8D4E3F] disabled:bg-stone-200 text-white font-semibold text-xs font-serif rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      {isCalculatingLove ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                                          <span>正在比對雙方紫微星格...</span>
                                        </>
                                      ) : "🔮 進行雙星命盤合盤"}
                                    </button>
                                  </div>
                                )}

                                {decisionSubTab === "wealth" && (
                                  <div className="bg-[#FAF9F5] border-2 border-[#EADFC9] p-6 md:p-8 rounded-3xl flex flex-col justify-between text-left space-y-5 shadow-sm">
                                    <div className="space-y-3.5">
                                      <div className="flex items-center gap-2">
                                        <span className="p-1 px-3 text-[10px] bg-[#D1E6CE] text-[#1E4D1A] rounded-md font-extrabold font-serif">💰 避險精算</span>
                                        <h5 className="text-sm font-extrabold text-[#2E241B] font-serif">投資破財避險精算</h5>
                                      </div>
                                      <p className="text-[11.5px] text-stone-700 font-medium leading-relaxed font-serif">
                                        診斷「財帛宮」流月相，推算該項重大支出的安全係數與高危破財月。
                                      </p>

                                      <div className="space-y-3 pt-1">
                                        <div>
                                          <label className="text-[10px] text-stone-800 font-bold block mb-1.5">預計投資/買房項目</label>
                                          <input
                                            type="text"
                                            placeholder="例：首購二房預售屋 / 台股科技ETF"
                                            value={decisionWealthProject}
                                            onChange={(e) => setDecisionWealthProject(e.target.value)}
                                            className="w-full bg-white border border-[#D5C7B1] rounded-lg px-3 py-2 text-[11.5px] text-[#2E241B] outline-none placeholder:text-stone-400 focus:border-[#52734D] focus:ring-1 focus:ring-[#52734D] h-[36px]"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-stone-800 font-bold block mb-1.5">預估資金壓力情況</label>
                                          <div className="grid grid-cols-3 gap-1.5">
                                            {[
                                              { id: "low", lbl: "微小投資" },
                                              { id: "medium", lbl: "中等儲蓄款" },
                                              { id: "heavy", lbl: "背負巨額房貸" }
                                            ].map((pres) => (
                                              <button
                                                key={pres.id}
                                                type="button"
                                                onClick={() => setDecisionWealthBudget(pres.id)}
                                                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                                                  decisionWealthBudget === pres.id
                                                    ? "bg-[#52734D] border-[#52734D] text-white shadow-2xs"
                                                    : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:text-stone-900"
                                                }`}
                                              >
                                                {pres.lbl}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={handleCalculateWealthDecision}
                                      disabled={isCalculatingWealth || !decisionWealthProject.trim()}
                                      className="w-full py-2.5 bg-[#52734D] hover:bg-[#435F3F] disabled:bg-stone-200 text-white font-semibold text-xs font-serif rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      {isCalculatingWealth ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-white px-0.5" />
                                          <span>正在演算財路...</span>
                                        </>
                                      ) : "💰 精算財務避險良機"}
                                    </button>
                                  </div>
                                )}
                              </motion.div>
                            </div>

                            {/* 結果看板呈現區 */}
                            <div className="space-y-6">
                              
                              {/* 1. Career Result */}
                              {decisionCareerResult && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="border border-[#EBE3D5] bg-white rounded-3xl p-5 md:p-6 text-left space-y-4 shadow-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#FAF6F0] gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#8C7A6B]" />
                                      <h5 className="font-bold text-sm text-[#4E453D] font-serif">
                                        💼 轉職創業勝率評估報告 : 【{decisionCareerRole}】
                                      </h5>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-3 py-1 bg-[#FAF8F3] text-[#8C7A6B] border border-[#EBE3D5]/60 rounded-full">
                                      官祿宮特性 : {decisionCareerResult.palaceFeature}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF9F5] p-4.5 rounded-2xl">
                                    <div className="text-center space-y-1.5 py-2 px-1 bg-white rounded-xl border border-[#EADFC9] shadow-3xs">
                                      <span className="text-[10px] text-stone-800 font-extrabold block">📈 綜合決策勝率</span>
                                      <span className="text-xl font-extrabold font-serif text-[#8C7A6B] block">
                                        {decisionCareerResult.winRate}%
                                      </span>
                                    </div>
                                    <div className="text-center space-y-1.5 py-2 px-1 bg-white rounded-xl border border-[#EADFC9] shadow-3xs">
                                      <span className="text-[10px] text-stone-800 font-extrabold block">🧭 最佳接軌時空窗口</span>
                                      <span className="text-xs font-bold text-stone-700 block py-0.5 font-serif">
                                        {decisionCareerResult.optimalMonths}
                                      </span>
                                    </div>
                                    <div className="text-center space-y-1.5 py-2 px-1 bg-white rounded-xl border border-[#FADBD5] shadow-3xs">
                                      <span className="text-[10px] text-[#A22F1D] font-extrabold block">⚠️ 重點避險月份</span>
                                      <span className="text-xs font-bold text-[#A22F1D] block py-0.5 font-serif">
                                        {decisionCareerResult.riskMonths}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-xs text-stone-800 leading-relaxed font-serif bg-[#FCFAF5] border border-[#E9DFCB] p-4 rounded-xl antialiased">
                                    {decisionCareerResult.analysis}
                                  </div>

                                  {/* 付費解鎖防護解方 */}
                                  <div className="border-t border-[#FAF6F0] pt-4">
                                    {!isCareerUnlocked ? (
                                      <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-5 text-center space-y-3.5 shadow-2xs">
                                        <div className="space-y-1">
                                          <h6 className="text-xs font-bold text-[#8C7A6B] font-serif flex items-center justify-center gap-1.5 font-semibold">
                                            <span>🔒</span>
                                            <span>解鎖高階「防小人口舌防身指南 + 化解轉職破財妙計」</span>
                                          </h6>
                                          <p className="text-[11px] text-stone-700 font-serif max-w-lg mx-auto leading-relaxed">
                                            精密比對官祿宮遇太歲流星，您在此方向將在特定月份有【小人挑撥契約/福星受制】之慮。解鎖後立即展現極具操作性的說話技巧、五行中和擺放等化解錦囊，為您護航！
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => triggerPayment("career", 30, "官祿流星防小人錦囊")}
                                          className="bg-[#8C7A6B] hover:bg-[#706053] active:scale-95 text-white text-[11px] font-serif font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                                        >
                                          <span>🔮 消耗微光 3 點 (約 NT$30) 模擬解鎖解方針對案</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-[#F6F8F6] border border-[#DFF0EA] rounded-2xl p-5 text-left space-y-2.5 shadow-2xs"
                                      >
                                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-[#DFF0EA] text-[#426E40] px-2 py-0.5 rounded-full font-serif">
                                          🔓 已解鎖 ‧ 禪定防身化解錦囊
                                        </span>
                                        <p className="text-xs text-[#3E4D3C] font-serif leading-relaxed select-text antialiased">
                                          <strong>【高階防避與中和秘技】</strong>在這個新軌道上，每逢與高層、前輩商洽時，忌用強勢論爭。在辦公桌右前方（本命官祿位），務必於深夜前置放一隻<strong>【青石中和聚福筆架】</strong>以聚集生氣木能。此外，若主管意見分歧，緊記溝通口訣：<strong>「理解其慮、以數據化、徐提方案」</strong>，每日巳時飲用一小盞「阿里山烏龍茶」來平和體內燥性，勝率定能穩妥兌現！
                                        </p>
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>
                              )}

                              {/* 2. Love Result */}
                              {decisionLoveResult && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="border border-[#EBE3D5] bg-white rounded-3xl p-5 md:p-6 text-left space-y-5 shadow-xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#FAF6F0] gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-[#A45E4D]" />
                                      <h5 className="font-bold text-sm text-[#4E453D] font-serif">
                                        💕 雙星紫微命盤合盤深度報告 : 【{decisionLovePartner}】
                                      </h5>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-3 py-1 bg-[#FAF8F3] text-[#A45E4D] border border-[#F3E2DB] rounded-full">
                                      生肖屬【{decisionLoveResult.partnerZodiac}】
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF9F5] p-4.5 rounded-2xl">
                                    <div className="text-center space-y-1.5 py-2 px-1 bg-white rounded-xl border border-[#F3E2DB] shadow-3xs">
                                      <span className="text-[10px] text-stone-850 font-extrabold block">💖 情感契合度</span>
                                      <span className="text-xl font-extrabold font-serif text-[#A45E4D] block">
                                        {decisionLoveResult.compScore}%
                                      </span>
                                    </div>
                                    <div className="text-center space-y-1.5 py-2 px-1 bg-white rounded-xl border border-[#F3E2DB] shadow-3xs">
                                      <span className="text-[10px] text-stone-850 font-extrabold block">🌌 對方星盤主曜</span>
                                      <span className="text-xs font-bold text-stone-800 block py-1 font-serif">
                                        {decisionLoveResult.partnerStar}
                                      </span>
                                    </div>
                                    <div className="text-center space-y-1.5 py-2 px-1 bg-white rounded-xl border border-[#FAF6F0] shadow-3xs">
                                      <span className="text-[10px] text-stone-850 font-extrabold block">🏠 您的夫妻宮</span>
                                      <span className="text-xs font-bold font-serif text-[#8C7A6B] block py-1 leading-tight">
                                        {decisionLoveResult.spouseFeature}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-4 font-serif">
                                    {/* 1. 性格互補 */}
                                    <div className="text-xs text-stone-800 leading-relaxed bg-[#FDFBF7] border border-[#E9DFCB] p-4 rounded-xl antialiased">
                                      <span className="block text-[11px] font-extrabold text-[#8C6239] mb-1.5 flex items-center gap-1">
                                        <span>☯️</span> 雙星性格互補比對：
                                      </span>
                                      <p>{decisionLoveResult.complementaryAnalysis}</p>
                                    </div>

                                    {/* 2. 溝通盲點 */}
                                    <div className="text-xs text-stone-800 leading-relaxed bg-[#FCFAF7] border border-[#F0E6D2] p-4 rounded-xl antialiased">
                                      <span className="block text-[11px] font-extrabold text-red-800 mb-1.5 flex items-center gap-1">
                                        <span>⚠️</span> 命理相處溝通盲點：
                                      </span>
                                      <div className="text-[#554C42] whitespace-pre-line leading-relaxed text-[11px]">
                                        {decisionLoveResult.communicationBlindSpot}
                                      </div>
                                    </div>

                                    {/* 3. 相處最佳開運方式 */}
                                    <div className="text-xs text-stone-800 leading-relaxed bg-[#F7F9F6] border border-[#DCE4DC] p-4 rounded-xl antialiased">
                                      <span className="block text-[11px] font-extrabold text-[#3D5A39] mb-1.5 flex items-center gap-1">
                                        <span>✨</span> 最佳相處開運指引：
                                      </span>
                                      <div className="text-[#3E4D3C] whitespace-pre-line leading-relaxed text-[11px]">
                                        {decisionLoveResult.optimalFortuneAdvice}
                                      </div>
                                    </div>
                                  </div>

                                  {/* 付費解鎖防護解方 */}
                                  <div className="border-t border-[#FAF6F0] pt-4">
                                    {!isLoveUnlocked ? (
                                      <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-5 text-center space-y-3.5 shadow-2xs">
                                        <div className="space-y-1">
                                          <h6 className="text-xs font-bold text-[#A45E4D] font-serif flex items-center justify-center gap-1.5 font-semibold">
                                            <span>🔒</span>
                                            <span>解鎖「獨家治伏此命格開運大法 + 雙星一鍵導出 PDF 緣分隨身書」</span>
                                          </h6>
                                          <p className="text-[10px] text-[#8C8375] font-serif max-w-lg mx-auto leading-relaxed">
                                            解鎖全盤深層解析後，此關係開運錦囊將連同全站「生涯宮、夫妻宮、財帛宮、流年盤」所有上鎖章節同步完全解鎖，絕無二次計費！
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => triggerPayment("love", 50, "治伏忽冷忽熱相處祕笈")}
                                          className="bg-[#A45E4D] hover:bg-[#8D4E3F] active:scale-95 text-white text-[11px] font-serif font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                                        >
                                          <span>👑 點亮全盤深層解析 (含合盤專屬調和錦囊)</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="bg-[#FDF8F6] border border-[#F5E6E1] rounded-2xl p-5 text-left space-y-2.5 shadow-2xs"
                                      >
                                        <span className="inline-flex items-center gap-1.5 text-[9px] font-bold bg-[#F5E5DF] text-[#A45E4D] px-2 py-0.5 rounded-full font-serif">
                                          🔓 已解鎖 ‧ 治服心理與開運大法
                                        </span>
                                        <p className="text-xs text-[#5C423E] font-serif leading-relaxed select-text antialiased">
                                          <strong>【高階開運與深度治服守則】</strong>對方的格局有強烈的主導意願。最佳的收服策略是<strong>「明面全力配合，私下溫柔提醒，對外給足面子」</strong>。在互動交往中，切記不可當眾頂撞。每當雙方磁場發生撞擊，可在當天<strong>【已時或午時】</strong>穿著或佩戴帶有<strong>「金白或海藍」</strong>的配飾。牢記心法口訣：<strong>「遇強則韌，順勢引流」</strong>，能自然化煞為用，激發他對您加倍的呵護與安全依附！
                                        </p>
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.div>
                              )}

                              {/* 3. Wealth Result */}
                              {decisionWealthResult && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="border-2 border-[#DCD3C1] bg-white rounded-3xl p-5 md:p-6 text-left space-y-6 shadow-md"
                                >
                                  {/* 標頭 */}
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3.5 border-b-2 border-[#FAF6F0] gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="w-3 h-3 rounded-full bg-[#3D5A39]" />
                                      <h5 className="font-extrabold text-sm text-[#2E241B] font-serif">
                                        🏡 投資買房與財產防破財精算 : 【{decisionWealthProject}】
                                      </h5>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-3 py-1 bg-[#F5ECE0] text-[#3D5A39] border border-[#DCD3C1] rounded-full">
                                      財帛宮星曜守護位 : {decisionWealthResult.caiBoFeature}
                                    </span>
                                  </div>

                                  {/* 三個主要精算指標卡 */}
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#FAF9F5] p-4.5 rounded-2xl">
                                    <div className="text-center space-y-1.5 py-2.5 bg-white rounded-xl border-2 border-[#D5EAD5] shadow-3xs">
                                      <span className="text-[10px] text-stone-700 font-extrabold block">💰 財氣穩固係數</span>
                                      <span className="text-2xl font-extrabold font-serif text-[#3D5A39] block">
                                        {decisionWealthResult.stabilityScore}%
                                      </span>
                                      <span className="text-[9px] text-stone-500 font-medium font-serif">（本命與流年共鳴度）</span>
                                    </div>
                                    <div className="text-center space-y-1.5 py-2.5 bg-white rounded-xl border-2 border-[#FADBD5] shadow-3xs">
                                      <span className="text-[10px] text-[#A45E4D] font-extrabold block">⚠️ 破財流失高險月</span>
                                      <span className="text-xs font-bold text-red-700 block py-1 font-serif">
                                        {decisionWealthResult.pitfallMonths}
                                      </span>
                                      <span className="text-[9px] text-stone-500 font-medium font-serif">（煞星沖照最烈月份）</span>
                                    </div>
                                    <div className="text-center space-y-1.5 py-2.5 bg-white rounded-xl border-2 border-[#EADFC9] shadow-3xs font-serif">
                                      <span className="text-[10px] text-stone-700 font-extrabold block">🧭 安全避險級別</span>
                                      <span className="text-xs font-bold text-[#8C7A6B] block py-1 font-serif">
                                        {decisionWealthResult.dangerLevel}
                                      </span>
                                      <span className="text-[9px] text-stone-500 font-medium">（防守大於進攻原則）</span>
                                    </div>
                                  </div>

                                  {/* 精算報告正文 */}
                                  <div className="text-xs text-stone-800 leading-relaxed font-serif bg-[#FCFAF5] border border-[#E9DFCB] p-5 rounded-2xl shadow-3xs antialiased space-y-3.5">
                                    <h6 className="font-extrabold text-[#5C4D3C] text-[11px] border-b border-[#E9DFCB]/50 pb-1.5 flex items-center gap-1.5">
                                      <span>🔮</span> 核心宮位相星盤大勢診斷
                                    </h6>
                                    <p className="indent-5 text-stone-800 leading-relaxed font-medium">
                                      {decisionWealthResult.analysis}
                                    </p>
                                    <p className="text-[11px] text-stone-600 bg-white border border-stone-200/80 p-2.5 rounded-xl font-medium">
                                      ℹ️ <b>本命提示：</b>您在預算壓力為【{decisionWealthBudget === 'low' ? '微型投資' : decisionWealthBudget === 'medium' ? '中等資金' : '高額房貸'}】時，今年「脾土」五行受制嚴重。切勿在此項目上投入起過 7 成的預備金，否則流月忌星交沖時將面臨極大資產流動性考驗。
                                    </p>
                                  </div>

                                  {/* 🎯 讓人依賴、想要付款的新增功能：12流月避險與狙擊溫度計（超強互動性） */}
                                  <div className="border border-[#EBE3D5] bg-[#FAF9F5] rounded-2xl p-4.5 space-y-4 text-left">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                                      <div className="space-y-0.5">
                                        <h6 className="text-[11px] font-extrabold text-[#2E241B] font-serif flex items-center gap-1.5">
                                          <span className="text-[#3D5A39]">📅</span>
                                          <span>本命 12 流月「避險安穩與狙擊黃金點」氣候盤</span>
                                        </h6>
                                        <p className="text-[9px] text-stone-600 font-medium">
                                          點擊下方各流月圓形徽章，即時觀測本年 12 個月個別的安全氣壓值及解鎖補印。
                                        </p>
                                      </div>
                                      <span className="text-[9px] bg-[#E3EDE2] text-[#2F5829] font-bold px-2 py-0.5 rounded-md border border-green-200 block sm:inline-block w-fit">
                                        流月實時同步中
                                      </span>
                                    </div>

                                    {/* 12個月格 */}
                                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-1.5 pt-1">
                                      {decisionWealthResult.monthsData?.map((item: any) => {
                                        const isSelected = selectedWealthMonth === item.month;
                                        let bgStyle = "";
                                        if (item.status === "safe") {
                                          bgStyle = isSelected 
                                            ? "bg-[#2E7D32] border-[#1B5E20] text-white ring-2 ring-emerald-500/80 shadow-md" 
                                            : "bg-[#E8F5E9] border-[#A5D6A7] text-[#2E7D32] hover:bg-[#C8E6C9]";
                                        } else if (item.status === "danger") {
                                          bgStyle = isSelected 
                                            ? "bg-[#C62828] border-[#B71C1C] text-white ring-2 ring-red-500/80 shadow-md" 
                                            : "bg-[#FFEBEE] border-[#EF9A9A] text-[#C62828] hover:bg-[#FFCDD2]";
                                        } else {
                                          bgStyle = isSelected 
                                            ? "bg-[#E65100] border-[#E65100] text-white ring-2 ring-orange-500/80 shadow-md" 
                                            : "bg-[#FFF3E0] border-[#FFE082] text-[#E65100] hover:bg-[#FFE0B2]";
                                        }

                                        return (
                                          <button
                                            key={item.month}
                                            type="button"
                                            onClick={() => setSelectedWealthMonth(item.month)}
                                            className={`py-2 rounded-xl border text-[10px] font-extrabold font-serif transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${bgStyle}`}
                                          >
                                            <span className="text-[8px] opacity-80">農曆</span>
                                            <span>{item.month}月</span>
                                            <span className="text-[8px] scale-90 font-mono">
                                              {item.status === "safe" ? "極佳" : item.status === "danger" ? "險 ☠️" : "持平"}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>



                                    {/* 所選流月數據面盤 */}
                                    {(() => {
                                      const currentMonthData = decisionWealthResult.monthsData?.find((m: any) => m.month === selectedWealthMonth) || decisionWealthResult.monthsData?.[0];
                                      if (!currentMonthData) return null;

                                      return (
                                        <div className="bg-white border border-[#E9DFCB] rounded-xl p-4 space-y-3 shadow-3xs">
                                          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                            <div className="flex items-center gap-2">
                                              <span className={`w-2.5 h-2.5 rounded-full ${currentMonthData.status === "safe" ? "bg-green-600" : currentMonthData.status === "danger" ? "bg-red-600" : "bg-orange-500"}`} />
                                              <span className="text-[11px] font-extrabold text-[#2E241B] font-serif">
                                                農曆 {currentMonthData.month} 月 · 流月避險分析報告
                                              </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-stone-700 font-mono bg-stone-100 px-2 py-0.5 rounded-md">
                                              穩定指數: {currentMonthData.score}/100
                                            </span>
                                          </div>

                                          {/* 全能免費卦氣診斷 (高對比度，無比清晰) */}
                                          <p className="text-xs text-stone-800 leading-relaxed font-serif font-medium select-text">
                                            <b>【星度走向】：</b>{currentMonthData.advice}
                                          </p>

                                          {/* 最刺激、引導付費的細微功能鎖定 */}
                                          <div className="pt-2 border-t border-dashed border-stone-200">
                                            {isWealthUnlocked ? (
                                              <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="bg-[#F4FAF4] border border-[#A5D6A7]/60 p-3 rounded-xl space-y-1 text-left"
                                              >
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[#E8F5E8] text-[#2E7D32] px-2 py-0.5 rounded-md">
                                                  🔑 本命流月補庫化煞指南已開光
                                                </span>
                                                <p className="text-xs text-stone-800 font-serif leading-relaxed select-text font-medium">
                                                  {currentMonthData.premiumAdvice}
                                                </p>
                                              </motion.div>
                                            ) : (
                                              <div className="bg-[#FFFDF9] border border-[#FFE082]/60 p-3.5 rounded-xl space-y-2 text-center relative overflow-hidden shadow-3xs max-w-lg mx-auto">
                                                <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] pointer-events-none" />
                                                <div className="space-y-1 relative z-10">
                                                  <span className="text-[#E65100] text-xs font-serif font-extrabold block">
                                                    🔒 農曆 {currentMonthData.month} 月流日五行補庫與奇門進場大吉時解鎖
                                                  </span>
                                                  <p className="text-[10px] text-stone-700 font-serif leading-relaxed max-w-sm mx-auto">
                                                    本月包含 1 次契合您的<b>本命天干引水招財局</b>與<b>最佳避煞方位安放</b>，有助避免盲目盲從或資金受困。
                                                  </p>
                                                </div>
                                                <button
                                                  type="button"
                                                  onClick={() => triggerPayment("wealth", 50, "本命補庫招財擺件五行攻略")}
                                                  className="relative z-10 px-3.5 py-1.5 bg-[#52734D] hover:bg-[#3D5A39] text-white text-[10px] font-extrabold font-serif rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 mx-auto active:scale-95 cursor-pointer"
                                                >
                                                  <span>🔮 消耗微光 5 點 (解鎖 12 個流月全部五行擺件與狙擊吉時)</span>
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* 全年度指引錦囊按鈕 */}
                                  <div className="border-t border-[#FAF6F0] pt-4 flex justify-between items-center bg-[#FCFAF5] p-4 rounded-2xl border border-[#FAF6F0]">
                                    <div className="text-left space-y-0.5">
                                      <h6 className="text-[11px] font-bold text-stone-800 font-serif">
                                        ✨ 本命財帛「防破財 ‧ 補水庫」雙向天機攻略
                                      </h6>
                                      <p className="text-[9px] text-stone-600 font-medium max-w-md font-serif">
                                        解鎖後將同步啟用您的辦公桌「青龍水象暗穩財氣法門」，與平日守護星盤神煞穿搭引動。
                                      </p>
                                    </div>
                                    {!isWealthUnlocked ? (
                                      <button
                                        type="button"
                                        onClick={() => triggerPayment("wealth", 50, "本命補庫招財擺件五行攻略")}
                                        className="bg-[#52734D] hover:bg-[#3D5A39] active:scale-95 text-white text-[11px] font-serif font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <span>🔓 立即開智解鎖 NT$50</span>
                                      </button>
                                    ) : (
                                      <span className="text-[10px] font-extrabold text-[#2E7D32] bg-[#E8F5E9] border border-green-300 px-3 py-1.5 rounded-xl font-serif">
                                        ✅ 已解鎖本尊聚財指南
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              )}

                            </div>

                          </div>
                        )}
                        {activeTab === "career" && (
                          isPremiumUnlocked ? (
                           renderFormattedText(result.aiAnalysis.career, "text-[16px] md:text-[18px] text-[#3A322C] leading-[1.8] tracking-[0.02em]")
                          ) : (
                            <div className="space-y-3">
                              {renderTruncatedFormattedText(result.aiAnalysis.career)}
                              <PremiumLockBanner 
                                activeTab="career" 
                                onUnlock={() => triggerPayment("premiumClick108" as any, 299, "Click108 科技紫微極致生涯詳批")}
                                onLearnMore={() => setActiveTab("premiumClick108")}
                              />
                            </div>
                          )
                        )}
                        {activeTab === "love" && (
                          isPremiumUnlocked ? (
                            renderFormattedText(result.aiAnalysis.love, "text-[16px] md:text-[18px] text-[#3A322C] leading-[1.8] tracking-[0.02em]")
                          ) : (
                            <div className="space-y-3">
                              {renderTruncatedFormattedText(result.aiAnalysis.love)}
                              <PremiumLockBanner 
                                activeTab="love" 
                                onUnlock={() => triggerPayment("premiumClick108" as any, 299, "Click108 科技紫微極致生涯詳批")}
                                onLearnMore={() => setActiveTab("premiumClick108")}
                              />
                            </div>
                          )
                        )}
                        {activeTab === "wealth" && (
                          isPremiumUnlocked ? (
                           renderFormattedText(result.aiAnalysis.wealth, "text-[16px] md:text-[18px] text-[#3A322C] leading-[1.8] tracking-[0.02em]")
                          ) : (
                            <div className="space-y-3">
                              {renderTruncatedFormattedText(result.aiAnalysis.wealth)}
                              <PremiumLockBanner 
                                activeTab="wealth" 
                                onUnlock={() => triggerPayment("premiumClick108" as any, 299, "Click108 科技紫微極致生涯詳批")}
                                onLearnMore={() => setActiveTab("premiumClick108")}
                              />
                            </div>
                          )
                        )}
                        {activeTab === "health" && renderFormattedText(result.aiAnalysis.health, "text-[16px] md:text-[18px] text-[#3A322C] leading-[1.8] tracking-[0.02em]")}
                       {activeTab === "lifeGuidance" && renderFormattedText(result.aiAnalysis.lifeGuidance, "text-[16px] md:text-[18px] text-[#3A322C] leading-[1.8] tracking-[0.02em]")}
                        {activeTab === "currentYearFortune" && (
                          <div className="space-y-6">
                            {isPremiumUnlocked ? (
                              <div>{renderFormattedText(result.aiAnalysis.currentYearFortune, "text-[16px] md:text-[18px] text-[#3A322C] leading-[1.8] tracking-[0.02em]")}</div>
                            ) : (
                              <div className="space-y-3">
                                {renderTruncatedFormattedText(result.aiAnalysis.currentYearFortune)}
                                <PremiumLockBanner 
                                  activeTab="currentYearFortune" 
                                  onUnlock={() => triggerPayment("premiumClick108" as any, 299, "Click108 科技紫微極致生涯詳批")}
                                  onLearnMore={() => setActiveTab("premiumClick108")}
                                />
                              </div>
                            )}
                            
                            {/* 未來五年運勢走向折線圖區塊 */}
                            <div className="mt-8 pt-6 border-t border-[#EAE3D5] space-y-4.5">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F0EAE1] pb-3">
                                <div>
                                  <h4 className="text-sm font-semibold text-[#5C4D3C] tracking-wide flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-[#8C7A6B]" />
                                    未來五年運勢走向折線圖 (2026 - 2030)
                                  </h4>
                                  <p className="text-[11px] text-[#8C8375] mt-1">
                                    融合本命九星、紫微命星大數據與流年干支氣韻，細緻推演五載歲月起伏之波動
                                  </p>
                                </div>
                                <span className="text-[10px] bg-[#FAF0E6] text-[#8C7A6B] border border-[#EBD7C0]/60 px-3 py-0.5 rounded-full font-bold uppercase tracking-wide self-start sm:self-center shrink-0">
                                  點擊圖表節點・即刻點亮当年詳諦 🔮
                                </span>
                              </div>

                              {/* 圖表本體 */}
                              <div className="bg-white border border-[#EBE3D5] rounded-2xl p-4 md:p-5 h-[280px] w-full shadow-inner relative overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={futureData}
                                    margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                                    onClick={(data) => {
                                      if (data && data.activeTooltipIndex !== undefined) {
                                        setSelectedYearIdx(data.activeTooltipIndex as number);
                                      }
                                    }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F1EDE5" />
                                    <XAxis 
                                      dataKey="year" 
                                      tick={{ fill: '#736B5E', fontSize: 11, fontFamily: 'serif', fontWeight: 'bold' }} 
                                      stroke="#EBE3D5"
                                    />
                                    <YAxis 
                                      domain={[40, 100]} 
                                      tick={{ fill: '#736B5E', fontSize: 10, fontFamily: 'serif' }} 
                                      stroke="#EBE3D5"
                                    />
                                    <Tooltip
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const item = payload[0].payload;
                                          return (
                                            <div className="bg-[#FAF9F5] border border-[#EBE3D5] p-3 rounded-xl shadow-md text-left font-serif scale-95">
                                              <p className="text-xs font-bold text-[#8C7A6B]">{item.year} 年限運軌</p>
                                              <p className="text-xs text-[#3C352E] font-semibold mt-0.5">
                                                和諧微光：<span className="font-bold font-mono text-[#8C7A6B]">{item.rating}%</span>
                                              </p>
                                              <p className="text-[10px] text-[#8C664B] font-bold mt-1 bg-[#FAF0E6] px-1.5 py-0.5 rounded inline-block">
                                                {item.theme}
                                              </p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="rating"
                                      stroke="#8C7A6B"
                                      strokeWidth={3}
                                      dot={<ChartCustomDot selectedYearIdx={selectedYearIdx} />}
                                      activeDot={{ r: 8, fill: '#8C7A6B', stroke: '#FAF9F5', strokeWidth: 2 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>

                              {/* 快速選切年份按鈕 */}
                              <div className="grid grid-cols-5 gap-1 pb-1 sm:flex sm:flex-wrap sm:justify-center sm:gap-2 pt-1">
                                {futureData.map((d, index) => (
                                  <button
                                    key={d.year}
                                    type="button"
                                    onClick={() => setSelectedYearIdx(index)}
                                    className={`py-2 text-center text-[10.5px] sm:px-4 sm:py-2 font-serif font-bold sm:text-xs rounded-xl border transition-all cursor-pointer ${
                                      selectedYearIdx === index
                                        ? "bg-[#8C7A6B] border-[#8C7A6B] text-white shadow-xs"
                                        : "bg-white border-[#EBE3D5] text-[#736B5E] hover:border-[#8C7A6B] hover:bg-[#FAF9F5]"
                                    }`}
                                  >
                                   <span className="sm:hidden">{(d.year as any) % 100}年</span>
                                    <span className="hidden sm:inline">📅 {d.year} 年限</span>
                                  </button>
                                ))}
                              </div>

                              {/* 點擊節點展示該年運勢解析卡片 */}
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={selectedYearIdx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                  className="p-4 sm:p-5 bg-white border border-[#EBE3D5] rounded-2xl relative text-left shadow-2xs"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#F0EAE1] pb-2.5 mb-3">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="text-[13px] md:text-[14px] sm:text-xs font-serif font-bold bg-[#8C7A6B] text-white px-2 py-0.5 rounded-lg shrink-0">
                                        {futureData[selectedYearIdx]?.year} 流年
                                      </span>
                                      <span className="text-[14px] md:text-[15px] sm:text-xs font-serif font-bold text-[#5C5043]">
                                        起伏詳諦：【<strong>{futureData[selectedYearIdx]?.theme}</strong>】
                                      </span>
                                    </div>
                                    <span className={`text-[13px] md:text-[14px] sm:text-xs font-serif font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto ${
                                      (futureData[selectedYearIdx]?.rating || 0) >= 82
                                        ? "bg-[#F0FAF4] text-[#22C55E]"
                                        : (futureData[selectedYearIdx]?.rating || 0) >= 70
                                        ? "bg-[#FCF7EE] text-[#8C664B]"
                                        : "bg-[#FCF2F0] text-[#D9534F]"
                                    }`}>
                                      時空氣感和諧度：{futureData[selectedYearIdx]?.rating}%
                                    </span>
                                  </div>
                                  <p className="text-[15px] md:text-[16px] font-bold text-[#8C664B] font-serif mb-2 flex items-center gap-1.5">
                                    {futureData[selectedYearIdx]?.starVibe}
                                  </p>
                                  <p className="text-[15px] md:text-[17px] leading-[1.8] text-[#736B5E] font-serif whitespace-pre-line antialiased">
                                    {futureData[selectedYearIdx]?.desc}
                                  </p>
                                </motion.div>
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {activeTab === "premiumClick108" && (
                          <div className="space-y-6 text-left">
                            {!isPremiumUnlocked ? (
                              <div className="space-y-6">
                                {/* Click108 Style Red/Gold Stamps & Badges header */}
                                <div className="p-6 bg-gradient-to-br from-[#FCFAF2] to-[#FAF5EB] border-2 border-[#D5C2AF]/60 rounded-3xl relative overflow-hidden shadow-2xs">
                                  <div className="absolute right-4 top-4 w-16 h-16 border-2 border-red-700/20 rounded-full flex items-center justify-center -rotate-12 select-none pointer-events-none opacity-40">
                                    <div className="w-14 h-14 border border-dashed border-red-700 rounded-full flex flex-col items-center justify-center text-[10px] text-red-700 font-bold tracking-widest font-serif leading-none">
                                      <span>精批</span>
                                      <span className="text-[7.5px] border-t border-red-700/50 pt-0.5 mt-0.5">專業認證</span>
                                    </div>
                                  </div>
                                  <h4 className="text-[#3C352E] font-serif text-lg font-bold tracking-wide flex items-center gap-2">
                                    <span>👑</span>
                                    <span>Click108 科技紫微極致付費生涯精批</span>
                                  </h4>
                                  <p className="text-xs text-[#8C8375] leading-relaxed mt-1 font-serif">
                                    本專區借鑒「科技紫微網」名震全球之核心專利優點——將古代複雜難懂的命理古籍，以高精度天文學、座標時差細化調整，轉化為現代滿意度高達 98% 的精緻人生解析！
                                  </p>
                                </div>

                                {/* Click108 Advantages / Merits List */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-serif">
                                  <div className="p-4.5 bg-white border border-[#EBE3D5] rounded-2xl shadow-2xs text-left relative overflow-hidden group hover:border-[#8C7A6B]">
                                    <span className="text-xl">📍</span>
                                    <h5 className="text-sm font-bold text-[#5C4D3C] mt-2 mb-1">第一重：極致經緯度座標精密對焦</h5>
                                    <p className="text-[11px] text-[#8C8375] leading-normal">
                                      一般排盤常因時區邊界（如真太陽時時差）產生判斷錯誤。本系統採用經緯度地理鐘，100% 杜絕『命格跨時跨日』之解讀盲點。
                                    </p>
                                  </div>
                                  <div className="p-4.5 bg-white border border-[#EBE3D5] rounded-2xl shadow-2xs text-left relative overflow-hidden group hover:border-[#8C7A6B]">
                                    <span className="text-xl">📊</span>
                                    <h5 className="text-sm font-bold text-[#5C4D3C] mt-2 mb-1">第二重：三方四正雙星共振交互演算法</h5>
                                    <p className="text-[11px] text-[#8C8375] leading-normal">
                                      並非單純孤立看某宮星曜。借鑒 Click108 矩陣式演算法，我們同時加權您的主守星、輔曜與暗合宮位磁場，運算複雜度提升 16 倍。
                                    </p>
                                  </div>
                                  <div className="p-4.5 bg-white border border-[#EBE3D5] rounded-2xl shadow-2xs text-left relative overflow-hidden group hover:border-[#8C7A6B]">
                                    <span className="text-xl">🛡️</span>
                                    <h5 className="text-sm font-bold text-[#5C4D3C] mt-2 mb-1">第三重：無水古文翻譯與實用改善手冊</h5>
                                    <p className="text-[11px] text-[#8C8375] leading-normal">
                                      拋棄令人恐慌恐懼的封建迷信詞彙（如死、劫、絕），100% 換上由資深諮商師審校、結合現代職場與婚姻關係之可落地指引。
                                    </p>
                                  </div>
                                </div>

                                {/* Locked Item Previews */}
                                <div className="bg-stone-50 border border-[#EBE3D5] rounded-2xl p-5 space-y-4">
                                  <div className="border-b border-[#EBE3D5]/60 pb-2 flex items-center justify-between">
                                    <span className="text-xs font-bold text-[#3C352E] font-serif flex items-center gap-1.5">
                                      <Lock className="w-3.5 h-3.5 text-[#8C7A6B]" />
                                      待開啟之付費核心大書 (Unlocked Modules)
                                    </span>
                                    <span className="text-[10px] text-stone-500 font-mono">3 EXCLUSIVE SECTIONS</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="p-3.5 bg-white border border-dashed border-[#E0D7C5] rounded-xl flex items-start gap-2.5 opacity-75">
                                      <span className="text-lg">📕</span>
                                      <div>
                                        <h6 className="text-[14] font-bold text-[#5C4D3C] font-serif">2026 丙午流年年運 12 宮位神算秘鑰</h6>
                                        <p className="text-[12px] text-stone-500 mt-1">深度覆蓋事業動線、偏財暗庫盈虧、感情緣會與流月福運吉兇度。</p>
                                      </div>
                                    </div>

                                    <div className="p-3.5 bg-white border border-dashed border-[#E0D7C5] rounded-xl flex items-start gap-2.5 opacity-75">
                                      <span className="text-lg">📔</span>
                                      <div>
                                        <h6 className="text-[14] font-bold text-[#5C4D3C] font-serif">終身本命紫微斗數精緻詳批大書</h6>
                                        <p className="text-[12px] text-stone-500 mt-1">15,000 字巨作，對焦宿命潛能、大限起伏、吉利貴人格局與解憂藥方。</p>
                                      </div>
                                    </div>

                                    <div className="p-3.5 bg-white border border-dashed border-[#E0D7C5] rounded-xl flex items-start gap-2.5 opacity-75">
                                      <span className="text-lg">📗</span>
                                      <div>
                                        <h6 className="text-[14]font-bold text-[#5C4D3C] font-serif">奇門遁術 · 流月避兇行事曆</h6>
                                        <p className="text-[12px] text-stone-500 mt-1">精算未来 12 個月的五行防漏財與感情防口角開運吉日、煞方方位。</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Satisfaction Guaranteed & Action Center */}
                                <div className="border border-[#E0D7B8] bg-[#FDFCFA] rounded-2xl p-6 text-center space-y-4">
                                  <div className="flex flex-col items-center space-y-1 font-serif">
                                    <div className="flex items-center gap-1 text-[#D97706]">
                                      <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                                    </div>
                                    <span className="text-[14px] text-[#A69D90]">超過 312,850+ 位付費用戶真誠推薦和諧高反饋</span>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <div className="text-left font-serif">
                                      <div className="text-stone-400 line-through text-xs">原價 NT$ 880</div>
                                      <div className="text-stone-800 text-2xl font-bold flex items-baseline gap-1">
                                        <span className="text-sm font-light text-red-700">體驗特惠</span>
                                        <span className="text-red-700 font-mono text-3xl">NT$ 299</span>
                                        <span className="text-xs text-stone-500">/ 買斷不重複收費</span>
                                      </div>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        triggerPayment("premiumClick108" as any, 299, "Click108 科技紫微極致生涯詳批");
                                      }}
                                      className="bg-red-700 hover:bg-red-800 text-white rounded-2xl px-8 py-4 font-serif font-bold text-sm tracking-widest shadow-md transition-all active:scale-95 animate-pulse cursor-pointer flex items-center gap-2"
                                    >
                                      <span>👑 立即點亮全盤精批報告</span>
                                    </button>
                                  </div>

                                  <div className="text-[10px] text-[#8C8375] font-serif flex items-center justify-center gap-2">
                                    <span>🛡️ 全球 SSL 連線 256位元高安全金流加密</span>
                                    <span>|</span>
                                    <span>🍵 心誠則靈，批算不合適 100% 官方無憂退費保證</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Unlocked Premium Report View */
                              <div className="space-y-6">
                                {/* Success Header Stamp Banner */}
                                <div className="p-6 bg-[#FCF8EE] border-2 border-[#D97706]/30 rounded-3xl relative overflow-hidden text-center space-y-2">
                                  <div className="absolute left-4 top-4 select-none pointer-events-none text-red-700/10 font-mono font-bold text-6xl rotate-12 tracking-widest">
                                    PAID
                                  </div>
                                  <div className="inline-block bg-yellow-600/90 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                    🏅 VIP PREMIUM VERSION ACTIVE
                                  </div>
                                  <h4 className="text-2xl font-serif font-black text-[#5C4D3C] tracking-wide">
                                    {result.personalInfo.name} ‧ 科技紫微命盤極致詳批報告書
                                  </h4>
                                  <p className="text-xs text-stone-500 max-w-xl mx-auto font-serif">
                                    起盤經緯對沖：東經 {result.personalInfo.birthHour === "12" ? "121.5" : "120.92"}˚ / 真太陽時校準：{result.personalInfo.birthHour === "12" ? "+8" : "-4"} 分鐘。
                                    已完全解開最高密度推演，由微光小庵主導星盤深入剖析。
                                  </p>
                                  <div className="border-t border-[#EBE3D5] pt-2 py-1 max-w-sm mx-auto flex items-center justify-between text-[10px] text-stone-500 font-serif mb-3">
                                    <span>流水密鑰：SK-9952-AURA</span>
                                    <span>金流認證：{selectedPayMethod === "line-pay" ? "LINE Pay (台灣連線)" : selectedPayMethod === "credit-card" ? "安全信用卡" : selectedPayMethod === "apple-pay" ? "Apple Wallet Secure" : "科技紫微金幣扣點"}</span>
                                  </div>
                                  <div className="pt-2">
                                    <button
                                      type="button"
                                      disabled={isExporting}
                                      onClick={handleExportPDF}
                                      className="inline-flex items-center gap-2 bg-[#8C7A6B] hover:bg-[#736052] disabled:bg-stone-300 text-white font-serif px-6 py-2.5 rounded-full text-xs font-bold tracking-widest shadow-md transition-all active:scale-95 cursor-pointer"
                                    >
                                      {isExporting ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>正在高畫質解析並輸出 PDF 報告中...</span>
                                        </>
                                      ) : (
                                        <>
                                          <span>👑 輸出專屬指引詳批 PDF 報告</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Section 1: 2026 丙午流年 12 宮位高精度預言 */}
                                <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 space-y-4 shadow-2xs">
                                  <div className="border-b border-[#F0EAE1] pb-2.5 flex items-center gap-2">
                                    <span className="text-lg">📕</span>
                                    <h5 className="font-serif font-bold text-base text-[#3C352E]">2026 丙午流年 12 宮位神算秘鑰詳批</h5>
                                  </div>
                                  <div className="space-y-3 font-seriftext-[16px] md:text-[18px] leading-relaxed text-stone-700">
                                    <p>
                                      <strong>【丙午太歲沖擊要旨】</strong>: {result.personalInfo.name} 您好，2026年歲次丙午，天干「丙」屬陽火，地支「午」屬陽火，此為歲火極盛之年。對於您的生肖【{result.personalInfo.shengxiao}】而言，與丙午氣流存在強烈的碰撞。
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                      <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E8DFC9]/60">
                                        <span className="text-xs text-red-700 bg-red-50 border border-red-200/50 px-2 py-0.5 rounded-full font-bold">事業宮流限點睛</span>
                                        <p className="text-[15px] md:text-[17px] leading-[1.8] text-stone-600 mt-2">
                                          流年主星與大限官祿宮合中有沖，代表2026年春季（陰曆一月至三月）會有意外之升遷或合夥邀約。惟午後烈火燃燒過急，切忌貪功而與直屬主管發生口角。夏季宜藏鋒芒，多聽少動，秋季（金秋之時）則可大力開拓。
                                        </p>
                                      </div>
                                      <div className="p-4 bg-[#FAF9F5] rounded-2xl border border-[#E8DFC9]/60">
                                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-full font-bold">財帛宮流限點睛</span>
                                        <p className="text-[15px] md:text-[17px] leading-[1.8] text-stone-600 mt-2">
                                          流年祿馬交馳入您的偏財暗庫。雖然今年表面開銷極大，包括居家裝潢與自我進修學費支出增多，但正財生旺，每逢陰曆五月、九月會有偏財天降。建議設置限額定存，切莫參與高槓桿炒作。
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-[15px] md:text-[17px] leading-[1.8] text-stone-500 italic mt-2 bg-stone-50 p-3 rounded-xl border border-stone-100">
                                      🔸 秘訣點撥：您的福德宮與本命年支相生。日常若遇煩悶之事，多朝「正南方」或「正東方」散步十五分鐘，能引導火氣轉移，化燥為雅。
                                    </p>
                                  </div>
                                </div>

                                {/* Section 2: 終身本命紫微斗數大書（精粹） */}
                                <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 space-y-4 shadow-2xs">
                                  <div className="border-b border-[#F0EAE1] pb-2.5 flex items-center gap-2">
                                    <span className="text-lg">📔</span>
                                    <h5 className="font-serif font-bold text-base text-[#3C352E]">終身本命紫微斗數格局深度解析</h5>
                                  </div>
                                  <div className="space-y-4 text-[16px] md:text-[18px] font-serif leading-relaxed text-stone-700">
                                    <p>
                                      通過【{result.personalInfo.lunarBirthDate.split(" ")[1] || "本命"}{result.personalInfo.shengxiao}年】與三方四正格網測量，您的靈魂潛在星耀格局歸類於<strong>「紫微獨坐而臨天網，五行本命得水木相融」</strong>之尊雅格局。您具有獨特的精神潔癖與同理共感力。
                                    </p>
                                    <div className="p-4 bg-[#FAFDF6] rounded-2xl border border-green-200/40 text-[15px] md:text-[17px] leading-[1.8]space-y-2">
                                      <strong className="text-green-800 block">✦ 終身命運優勢（Golden Talents）</strong>
                                      <p className="text-stone-600">
                                        您的天機智曜或太陰柔星對本命有默默拱照之能。您在遭遇人生谷底時，往往能在絕境處突然遇見不求利益回報的神秘強大貴人拉你一把。對文字、美學、心理或玄學具有極高的天賦直覺，適合從事高增值智識產業。
                                      </p>
                                    </div>
                                    <div className="p-4 bg-[#FDF7F6] rounded-2xl border border-red-200/40 text-[15px] md:text-[17px] leading-[1.8] space-y-2">
                                      <strong className="text-red-800 block">✦ 避險防漏警示（Vulnerability Blockers）</strong>
                                      <p className="text-stone-600">
                                        需注意「交友宮」與「疾厄宮」在天干忌星衝撞時產生的內耗。您極其容易因過度在意旁人的隻言片語而感到胸悶、焦慮、失眠。36歲至45歲大限財富有漏，不可將資金輕易借貸給親戚或多年摯友，簽約需加倍小心核查條款。
                                      </p>
                                    </div>
                                    <p>
                                      <strong>精確修心功課</strong>：您的靈魂密頁寫著「以柔克剛」。您無需求得事事爭第一，在喧鬧的群體中保持『溫火烹茶』般的慢節奏，更能發揮您本命神算之磁層優勢。
                                    </p>
                                  </div>
                                </div>

                                {/* Section 3: 奇門遁術 · 未來 12 個月開運避兇日曆 */}
                                <div className="bg-white border border-[#EBE3D5] rounded-3xl p-6 space-y-4 shadow-2xs">
                                  <div className="border-b border-[#F0EAE1] pb-2.5 flex items-center gap-2">
                                    <span className="text-lg">🧭</span>
                                    <h5 className="font-serif font-bold text-base text-[#3C352E]">奇門遁術 · 流年改運避兇急救大金帖</h5>
                                  </div>
                                  <div className="space-y-3 font-serif text-[15px] md:text-[17px] leading-[1.8] leading-relaxed text-stone-600">
                                    <div className="overflow-x-auto">
                                      <table className="w-full text-left border-collapse border border-stone-200">
                                        <thead>
                                          <tr className="bg-stone-50 text-stone-800">
                                            <th className="p-2 border border-stone-200">流月期間（2026）</th>
                                            <th className="p-2 border border-stone-200">運勢磁場</th>
                                            <th className="p-2 border border-stone-200">守護開運吉日</th>
                                            <th className="p-2 border border-stone-200">需防小人避忌煞方</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          <tr>
                                            <td className="p-2 border border-stone-200 font-bold">陰曆正月 (庚寅)</td>
                                            <td className="p-2 border border-stone-200 text-green-700">春雷破土 ⭐️ (宜進取)</td>
                                            <td className="p-2 border border-stone-200">初八、十二</td>
                                            <td className="p-2 border border-stone-200">正北方 (忌簽約)</td>
                                          </tr>
                                          <tr className="bg-[#FAF9F5]">
                                            <td className="p-2 border border-stone-200 font-bold">陰曆三月 (壬辰)</td>
                                            <td className="p-2 border border-stone-200 text-amber-700">雲籠霧月 🌙 (宜靜守)</td>
                                            <td className="p-2 border border-stone-200">十四、二十三</td>
                                            <td className="p-2 border border-stone-200">西南方 (勿晚歸)</td>
                                          </tr>
                                          <tr>
                                            <td className="p-2 border border-stone-200 font-bold">陰曆五月 (甲午)</td>
                                            <td className="p-2 border border-stone-200 text-red-600">火燒連營 ⚡️ (忌浮躁)</td>
                                            <td className="p-2 border border-stone-200">初七、十八</td>
                                            <td className="p-2 border border-stone-200">正南方 (避免衝突)</td>
                                          </tr>
                                          <tr className="bg-[#FAF9F5]">
                                            <td className="p-2 border border-stone-200 font-bold">陰曆八月 (丁酉)</td>
                                            <td className="p-2 border border-stone-200 text-green-700">秋高氣爽 🌾 (大財運)</td>
                                            <td className="p-2 border border-stone-200">初三、十五</td>
                                            <td className="p-2 border border-stone-200">東北方 (適合投資)</td>
                                          </tr>
                                        </tbody>
                                      </table>
                                    </div>
                                    <p className="mt-2 text-stone-500 italic block">
                                      *提示：此表已將 24 節氣日照傾角全數融入。吉日宜會友、剪髮、安床以納福；凶煞日宜早點回巢，身心浸洗精油或溫水澡可快速舒缓負能量。
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                    </motion.div>
                  </AnimatePresence>
                </div>

              </div>

              {/* 第四單元：心靈對話小庵（與人生策略旅伴對話一對一） */}
              <div id="chapter-4-section" className="bg-white border border-[#EBE3D5] p-5 md:p-8 shadow-[0_8px_30px_rgba(140,122,107,0.02)] rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[4px] bg-[#8C7A6B]" />

                <div className="flex items-center space-x-2 border-b border-[#EBE3D5] pb-3 mb-4 text-left">
                  <MessageSquare className="w-5 h-5 text-[#8C7A6B]" />
                  <h3 className="font-serif font-medium text-base text-[#5C4D3C] tracking-wider uppercase">
                    第四章 ‧ 爐香暖言 ‧ 微光一對一心靈晤談
                  </h3>
                  <span className="text-[9px] bg-[#FAF5EE] border border-[#EBE3D5] text-[#8C7A6B] px-2.5 py-0.5 rounded-full font-mono tracking-widest uppercase font-medium shadow-3xs">
                    COMPANION LIVE
                  </span>
                </div>

                <p className="text-xs text-[#8C8375] mb-5 font-serif leading-relaxed text-left">
                  若星盤與氣學的推演挑動了內心幽微的弦，或您有些不足為外人道的小小煩憂與期冀？
                  落座微光小庵，可在下方與隨行心靈顧問一對一晤談，我們會安安靜靜地側耳傾聽，在繁星下為您捧一盞溫熱的熱茶。
                </p>

                {/* 對話展示框 */}
                <div className="bg-[#FAF8F5] rounded-3xl border border-[#EBD6C1]/35 p-3 md:p-7 h-[480px] overflow-y-auto mb-5 space-y-6 shadow-inner">
                  
                  {/* 開場 */}
                  <div className="flex items-start space-x-2.5">
                    <div className="bg-[#8C7A6B] text-white px-2.5 py-1 text-[9px] font-bold font-serif shadow-xs rounded-lg shrink-0">
                      夥伴
                    </div>
                    <div className="bg-white border border-[#EBE3D5] rounded-3xl p-3.5 md:p-7 max-w-[95%] md:max-w-[85%] text-[16px] md:text-[17px] font-serif leading-[1.75] text-[#333333] shadow-xs text-left">
                      有緣人，歡迎落座微光小庵。很高興今天能與您在星辰下偶遇 ☕
                      <div className="h-3.5" />
                      不論是對剛才的紫微宮位星宿、或是「2026守成節奏、日常開運空間、或是特定生活起伏中的情感、工作煩惱」，都可以點下方卡片直接與我攀談，或輸入大白話心事，我會溫溫柔柔地陪著您想出實用方案。
                    </div>
                  </div>

                  {/* 歷史聊天對談 */}
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex items-start space-x-2.5 ${
                        msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <div
                        className={`px-2.5 py-1 text-[9px] font-bold font-serif shadow-xs rounded-lg shrink-0 ${
                          msg.role === "user"
                            ? "bg-stone-100 border border-stone-200 text-stone-500"
                            : "bg-[#8C7A6B] text-white"
                        }`}
                      >
                        {msg.role === "user" ? "有緣人" : "夥伴"}
                      </div>
                      <div
                        className={`rounded-3xl p-3.5 md:p-7 max-w-[95%] md:max-w-[85%] text-[16px] md:text-[17px] font-serif shadow-xs text-left ${
                          msg.role === "user"
                            ? "bg-[#F3EFE9] border border-[#E6DECF] text-[#333333]"
                            : "bg-white border border-[#EBE3D5] text-[#333333]"
                        }`}
                      >
                        {renderFormattedText(msg.text, "text-[16px] md:text-[17px] leading-[1.75] text-[#333333]", "space-y-3.5", "text-[#A44330]")}
                      </div>
                    </div>
                  ))}

                  {/* 正在禪定思考 */}
                  {isSendingQuestion && (
                    <div className="flex items-start space-x-2.5 animate-pulse">
                      <div className="bg-[#8C7A6B] text-white px-2.5 py-1 text-[9px] font-bold font-serif shadow-xs rounded-lg shrink-0">
                        夥伴
                      </div>
                      <div className="bg-white border border-[#EBE3D5] rounded-3xl p-5 md:p-7 text-[16px] font-serif text-[#8C7A6B] flex items-center space-x-2.5 max-w-[85%] text-left">
                        <Loader2 className="w-4 h-4 animate-spin text-[#8C7A6B] shrink-0" />
                        <span>正在依據您的紫微與九星盤算微光，請稍候...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* 快捷推薦追問 */}
                <div className="mb-5 text-left">
                  <span className="text-[13px] md:text-[15px] text-[#8C7A6B] block font-serif uppercase tracking-widest font-semibold mb-2.5">
                    👉 點選下方手印，一鍵與旅伴探討：
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAskQuestion(q)}
                        disabled={isSendingQuestion}
                        className="text-[14px] md:text-[15px] bg-[#FAF8F5] border border-[#E3DAC9] hover:border-[#8C7A6B] text-[#736A5E] hover:text-[#3C352E] px-4 py-2 rounded-full transition-all cursor-pointer text-left font-serif shadow-xs"
                      >
                        🌾 {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 輸入欄 */}
                <div className="relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        handleAskQuestion();
                      }
                    }}
                    placeholder="輸入大白話心事，例：我的九星代表大自然中的風，這對我的新工作有什麼啟發？"
                    disabled={isSendingQuestion}
                    className="w-full text-[15px] md:text-[16px]bg-white border border-[#EBE3D5] focus:border-[#8C7A6B] focus:ring-1 focus:ring-[#8C7A6B]/20 rounded-2xl pl-5.5 pr-14 py-4 text-xs text-[#3C352E] placeholder-[#B5AB9C] transition-all outline-none shadow-xs"
                  />
                  <button
                    onClick={() => handleAskQuestion()}
                    disabled={isSendingQuestion || !question.trim()}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[#8C7A6B] text-white cursor-pointer disabled:bg-stone-50 disabled:text-stone-300 hover:bg-[#706053] transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* 隱形 PDF 常規 A4 高畫質範本 (寬度 794px 等同於 A4 比例，100% 寬高渲染保障排版極佳) */}
      {result && (
        <div style={{ position: "fixed", left: "0px", top: "0px", width: "794px", zIndex: -9999, pointerEvents: "none" }}>
          <div
            ref={pdfTemplateRef}
            className="w-[794px] bg-[#FAF8F5] text-[#4E453D] p-12 space-y-8 relative select-text"
            style={{ fontFamily: 'Georgia, Inter, "Noto Serif TC", "Songti TC", serif' }}
          >
            {/* 貴氣邊框裝飾 */}
            <div className="absolute inset-4 border border-[#8C7A6B]/30 pointer-events-none" />
            <div className="absolute inset-5 border-[1.5px] border-[#8C7A6B]/10 pointer-events-none" />

            {/* 一、 封面標頭：紙頭標誌 & 庵號 */}
            <div className="flex justify-between items-end border-b-2 border-[#8C7A6B]/30 pb-4">
              <div className="text-left space-y-1.5">
                <div className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#8C8375]">
                  Micro Light Sanctuary • Companion Oracle Report
                </div>
                <h1 className="text-2xl font-bold tracking-widest text-[#5C4D3C] font-serif">
                  微光小庵 ‧ 專屬一對一心靈對話諮商報告
                </h1>
              </div>
              <div className="text-right text-xs font-serif text-[#8C7A6B]">
                <p className="font-bold">時空印記 • 智慧守護</p>
                <p className="text-[10px] opacity-80 mt-1 font-mono">CODE: {result.calcId || '000000'}</p>
              </div>
            </div>

            {/* 二、 使用者個人生辰時空座標資訊表 */}
            <div className="bg-[#FAF9F5] border border-[#EBE3D5] rounded-xl p-5.5 space-y-3.5">
              <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#F0EAE1] pb-1.5 font-serif text-left">
                <span>🏮</span> 命理時空之印記 ‧ PERSONAL COSMIC COORDINATES
              </h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 text-xs font-serif text-left">
                <p className="flex justify-between border-b border-[#F5F1E8] pb-1">
                  <span className="text-[#8C857B]">陽曆生辰 (Solar Birth)</span>
                  <strong className="text-[#5C4D3C]">{result.personalInfo.solarBirthDate}</strong>
                </p>
                <p className="flex justify-between border-b border-[#F5F1E8] pb-1">
                  <span className="text-[#8C857B]">陰曆生印 (Lunar Birth)</span>
                  <strong className="text-[#5C4D3C]">{result.personalInfo.lunarBirthDate}</strong>
                </p>
                <p className="flex justify-between border-b border-[#F5F1E8] pb-1">
                  <span className="text-[#8C857B]">姓名與尊稱 (Name & Title)</span>
                  <strong className="text-[#5C4D3C]">{result.personalInfo.name} ({result.personalInfo.gender})</strong>
                </p>
                <p className="flex justify-between border-b border-[#F5F1E8] pb-1">
                  <span className="text-[#8C857B]">時空守護宮位 (Gong)</span>
                  <strong className="text-[#5C4D3C]">{result.personalInfo.mingGong}</strong>
                </p>
                <p className="flex justify-between border-b border-[#F5F1E8] pb-1">
                  <span className="text-[#8C857B]">生肖屬相 (Shengxiao)</span>
                  <strong className="text-[#5C4D3C]">{result.personalInfo.shengxiao} 屬</strong>
                </p>
                <p className="flex justify-between border-b border-[#F5F1E8] pb-1">
                  <span className="text-[#8C857B]">當前歲運九星 (Star)</span>
                  <strong className="text-[#5C4D3C]">{result.kyusei?.yearStar?.name || "九星守護"}</strong>
                </p>
              </div>
            </div>

            {/* 三、 貴氣大字能量總分展示 */}
            <div className="bg-gradient-to-r from-[#FAF6F0] via-[#F4EDE2] to-[#FAF6F0] border border-[#E3DAC7] rounded-xl p-5 text-center space-y-1.5 shadow-2xs">
              <span className="text-[10px] text-[#8C7A6B] tracking-widest font-bold uppercase block">
                ★ COSMIC ENERGY BALANCE INDEX ★
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-serif text-[#5C4D3C] font-bold">本命星曜磁場能量總分 : </span>
                <span className="text-2xl font-extrabold font-serif text-[#A45E4D] tracking-wide">
                  {result.aiAnalysis.fateRating || 88} 分
                </span>
              </div>
              <p className="text-[10px] text-[#8C8375] font-serif max-w-md mx-auto italic leading-normal">
                「此分數代表先天星軌與流年五行之和諧度。破百為圓滿，六十為充電期，高分意指當前磁場氣象昂揚，宜積極和諧推進。」
              </p>
            </div>

            {/* 四、 最強人生中和指南 (Life Harmony Guide) - 第一頁封面極致亮點 */}
            <div className="space-y-3.5 text-left bg-white border border-[#E9DFCB] rounded-2xl p-6 shadow-xs relative">
              <span className="absolute top-4 right-4 text-[9px] font-mono font-bold bg-[#FAF8F5] text-[#A45E4D] border border-[#F3E2DB] px-2 py-0.5 rounded-full">
                SUMMARY ESSENCE
              </span>
              <h3 className="text-sm font-bold text-[#8C6239] font-serif uppercase tracking-wider flex items-center gap-1.5 border-b border-[#FAF6F0] pb-2">
                <span>☯️</span> 最強人生中和趨吉避凶指南 (Consolidated Harmony Matrix)
              </h3>
              <div className="text-[15px] md:text-[16px] leading-relaxed text-[#3A322C] font-serif antialiased space-y-2">
                {renderFormattedText(result.aiAnalysis.lifeHarmonyGuide)}
              </div>
            </div>

            {/* 五、 第一部分：深度天賦性格 */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                🌌 深度天賦性格解析 (Deep Personality Profile)
              </h3>
              <div className="text-xs md:text-[15px] leading-relaxed text-[#544A42] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.personality)}
              </div>
            </div>

            {/* 六、 第二部分：生涯潛力軌跡 */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                💼 生涯潛力軌跡探索 (Career & Path Potential)
              </h3>
              <div className="text-[15px] md:text-[16px] leading-relaxed text-[#3A322C] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.career)}
              </div>
            </div>

            {/* 七、 第三部分：親密關係與婚戀相遇 (愛戀板塊新入 PDF) */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                💖 親密關係與婚戀相遇 (Intimate Resonance & Love Path)
              </h3>
              <div className="text-[15px] md:text-[16px] leading-relaxed text-[#3A322C] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.love)}
              </div>
            </div>

            {/* 八、 第四部分：物質豐盛與心靈流動 (財富板塊新入 PDF) */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                💰 物質豐盛與心流密碼 (Material Abundance & Wealth Rhythms)
              </h3>
              <div className="text-[15px] md:text-[16px] leading-relaxed text-[#3A322C] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.wealth)}
              </div>
            </div>

            {/* 九、 第五部分：身心節奏與自我療癒 (健康板塊新入 PDF) */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                🛡️ 身心節奏與本命自我療癒 (Somatic Well-being & Healing Guidance)
              </h3>
              <div className="text-[15px] md:text-[16px] leading-relaxed text-[#3A322C] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.health)}
              </div>
            </div>

            {/* 十、 第六部分：流年運勢大圖與五年走勢展望 */}
            <div className="space-y-4 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                📈 未來五年運勢走勢圖 (5-Year Spiritual Fortune Chart)
              </h3>
              
              {/* 流年自繪向量趨勢圖，將在 PDF 中極度清晰重現 */}
              <div className="bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#F3EDE2] pb-2">
                  <span className="text-[10px] text-[#A69D90] font-bold tracking-widest">
                    YEARLY LUCK TREND MATRIX (2026-2030)
                  </span>
                  <span className="text-[10px] text-[#8C7A6B] font-bold">
                    五行氣韻 & 流年震盪指數
                  </span>
                </div>

                <div className="h-[170px] w-full relative mt-2 bg-[#FAF9F6] border border-[#F0EAE1] rounded-xl p-3 select-none">
                  {/* ABSOLUTE POSITIONED TEXT LABELS FOR PERFECT HTML2CANVAS RENDERING */}
                  <span className="absolute text-[8px] text-[#A19A8F] font-serif transform -translate-y-1/2 pointer-events-none" style={{ left: '15px', top: '16%' }}>優 [100%]</span>
                  <span className="absolute text-[8px] text-[#A19A8F] font-serif transform -translate-y-1/2 pointer-events-none" style={{ left: '15px', top: '51%' }}>平 [70%]</span>
                  <span className="absolute text-[8px] text-[#A19A8F] font-serif transform -translate-y-1/2 pointer-events-none" style={{ left: '15px', top: '86%' }}>沉 [40%]</span>

                  {/* SVG 趨勢折線圖 */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 640 150">
                    {/* 橫向輔助水平虛線線條 */}
                    <line x1="40" y1="20" x2="600" y2="20" stroke="#F1EDE5" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="40" y1="72" x2="600" y2="72" stroke="#F1EDE5" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="40" y1="125" x2="600" y2="125" stroke="#F1EDE5" strokeWidth="1.5" strokeDasharray="3 3" />
                    
                    {/* SVG 連接曲線點軌 */}
                    {pdfCoordinates.path && (
                      <path d={pdfCoordinates.path} fill="none" stroke="#8C7A6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* 點綴 */}
                    {pdfCoordinates.points.map((pt, i) => (
                      <circle key={i} cx={pt.x} cy={pt.y} r="5" fill="#8C7A6B" stroke="#FAF8F5" strokeWidth="2" />
                    ))}
                  </svg>

                  {/* ABSOLUTE POSITIONED DYNAMIC POINT LABELS */}
                  {pdfCoordinates.points.map((pt, i) => (
                    <div key={i} className="absolute pointer-events-none" style={{ left: `${(pt.x / 640) * 100}%`, top: `${(pt.y / 150) * 100}%` }}>
                      <span className="absolute transform -translate-x-1/2 -translate-y-4 text-[9px] font-bold text-[#5C4D3C] font-mono whitespace-nowrap bg-[#FAF8F5]/80 px-1 rounded">
                        {pt.rating}%
                      </span>
                      <span className="absolute transform -translate-x-1/2 translate-y-3 text-[9.5px] font-bold text-[#736B5E] font-serif whitespace-nowrap" style={{ top: '105px' }}>
                        {pt.year}年
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* 五年極簡列示 */}
                <div className="grid grid-cols-5 gap-3 pt-6 text-[10px] text-center font-serif">
                  {futureData.map((d) => (
                    <div key={d.year} className="bg-[#FAF9F5] border border-[#F0EAE1] p-2 rounded-lg space-y-1">
                      <span className="font-bold text-[#8C7A6B] block border-b border-[#F3EDE2] pb-0.5">{d.year} 年</span>
                      <strong className="text-[#3C352E] block text-[11px] font-mono">{d.rating}%</strong>
                      <span className="text-[#8C8375] block truncate scale-90">{d.theme.split("·")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 十一、 第七部分：2026 流年詳諦 */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                🏮 2026 丙午歲月流流詳諦 (Lantern Outlook 2026)
              </h3>
              <div className="text-xs md:text-[13px] leading-relaxed text-[#544A42] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.currentYearFortune)}
              </div>
            </div>

            {/* 十二、 第八部分：日常小開運與和諧指引 (新入 PDF) */}
            <div className="space-y-3.5 text-left">
              <h3 className="text-sm font-semibold border-l-4 border-[#8C7A6B] pl-2.5 text-[#5C4D3C] font-serif uppercase tracking-wider">
                🕊️ 日常小開運與和諧生活指引 (Everyday Fortune Activation)
              </h3>
              <div className="text-xs md:text-[13px] leading-relaxed text-[#544A42] bg-white border border-[#EBE3D5] rounded-2xl p-6 shadow-2xs">
                {renderFormattedText(result.aiAnalysis.lifeGuidance)}
              </div>
            </div>

            {/* 十三、 【重磅新增】第九部分：雙星紫微命盤自合盤深度報告 (已完全一體化呈現在 PDF 詳批報告中) */}
            <div className="space-y-4 text-left border-2 border-[#E9DFCB] rounded-2xl p-6 bg-[#FCFAF5] shadow-xs relative">
              <span className="absolute top-4 right-4 text-[9px] font-mono font-bold bg-[#A45E4D] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Double Destiny
              </span>
              <h3 className="text-sm font-bold text-[#A45E4D] font-serif uppercase tracking-wider flex items-center gap-1.5 border-b border-[#F5EFE3] pb-2">
                <span>💞</span> 雙星紫微命盤自合盤對照錄 (Double Astro Matching Companion)
              </h3>
              
              {decisionLoveResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-[#EBE3D5] p-3 rounded-xl text-xs space-y-1">
                      <span className="text-[#8C8375] block text-[10px]">比對對象 (Partner Name)</span>
                      <strong className="text-[#5C4D3C] text-[13px] font-serif">{decisionLovePartner} ({decisionLoveRole})</strong>
                    </div>
                    <div className="bg-white border border-[#EBE3D5] p-3 rounded-xl text-xs space-y-1">
                      <span className="text-[#8C8375] block text-[10px]">愛情感應度 (Match Rating)</span>
                      <strong className="text-[#A45E4D] text-[13px] font-serif">{decisionLoveResult.compScore}% 契合</strong>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border border-[#EBE3D5] p-3 rounded-xl text-xs space-y-1">
                      <span className="text-[#8C8375] block text-[10px]">對方的生辰日期與時辰</span>
                      <strong className="text-stone-700 font-serif text-[11.5px]">{decisionLovePartnerBirthDate} / {decisionLovePartnerBirthHour.split(" (")[0]}</strong>
                    </div>
                    <div className="bg-white border border-[#EBE3D5] p-3 rounded-xl text-xs space-y-1">
                      <span className="text-[#8C8375] block text-[10px]">對方命盤主星 & 屬相</span>
                      <strong className="text-stone-700 font-serif text-[11.5px]">【{decisionLoveResult.partnerStar}】 (屬{decisionLoveResult.partnerZodiac})</strong>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 font-serif text-xs">
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#F0E6D2]">
                      <strong className="text-[#8C6239] block mb-1">☯️ 雙星性格互補：</strong>
                      <p className="text-stone-700 leading-relaxed text-[11px]">{decisionLoveResult.complementaryAnalysis}</p>
                    </div>
                    <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#F0E6D2]">
                      <strong className="text-red-800 block mb-1">⚠️ 溝通相處盲點：</strong>
                      <div className="text-[#554C42] whitespace-pre-line leading-relaxed text-[11.5px]">{decisionLoveResult.communicationBlindSpot}</div>
                    </div>
                    <div className="bg-[#F4F6F3] p-4 rounded-xl border border-[#DCE4DC]">
                      <strong className="text-[#3D5A39] block mb-1">✨ 最佳相處開運指南（含色彩 & 動作秘訣）：</strong>
                      <div className="text-[#3E4D3C] whitespace-pre-line leading-relaxed text-[11.5px]">{decisionLoveResult.optimalFortuneAdvice}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center space-y-2">
                  <p className="text-xs text-stone-600 font-serif leading-relaxed">
                    您當前尚未預先在首頁計算任何「雙星紫微命盤」的配對對比，因此本部分為預留的合盤印章模組。
                  </p>
                  <div className="bg-white border border-[#F0EAE1] p-4 rounded-xl max-w-md mx-auto text-left space-y-1.5 border-dashed">
                    <span className="text-[#A45E4D] font-bold text-[10px] block">💎 合盤尊榮通道已隨全站永久點亮：</span>
                    <p className="text-[10px] text-stone-500 leading-relaxed">
                      您已全站詳批開通成功！歡迎回到首頁的【夫妻大運 ‧ 紫微合盤對比】中輸入心儀伴侶或商業夥伴的時空生辰；計算結果不限次數、即時同步全站精批，隨時導出含雙星合盤的終極 PDF 大全！
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 十四、 免責聲明 */}
            <div className="bg-[#FAF8F3] border border-[#EBE3D5]/80 rounded-xl p-5 space-y-2.5 text-left border-dashed">
              <h4 className="text-[11px] font-bold text-[#8C7A6B] uppercase tracking-widest font-mono">
                ★ 醫療調和及本命心靈諮商免責聲明 ‧ HEALTH & SPIRITUAL DISCLAIMER
              </h4>
              <p className="text-[10px] text-[#8C8375] font-serif leading-relaxed">
                本諮商與個人星曜手札報告係基於大眾傳統干支、易理九星氣學、紫微宿運分佈結合精密諮詢引導演算，內容僅供 client 
                日常生活和諧作息優化、身心安定、居家風水平衡及解憂傾聽建議之參考，絕對不具備、亦無意代替任何專業西醫臨床診斷、藥理化學處方、心理諮商治療、法律或實質醫療診治等科學救治效力。
                倘若 client 目前正承受任何實際性生理、精神官能或腦神經元器質性之真實痛苦與疾患，請 client 務必優先尋求具有合格執業證書與專業醫學背景的正規醫學群體或專科執業醫生進行常規臨床治療，請勿延誤科學就醫時機！
              </p>
            </div>

            {/* 頁尾頁腳 */}
            <div className="flex justify-between items-center border-t border-[#8C7A6B]/20 pt-4 text-[9px] text-[#A69D90] font-mono uppercase tracking-widest">
              <span>DESIGNED BY WEIGUANG XIAOAN • GENTLE & SINCERE JOURNEY COMPANION</span>
              <span>© 2026 MICRO LIGHT SANCTUARY</span>
            </div>
          </div>
        </div>
      )}

      {/* 頁尾頁尾 */}
      <footer className="border-t border-[#EBE3D5] bg-[#FAF8F3] py-6 px-6 text-[10px] text-[#8C8375] uppercase tracking-widest font-mono flex flex-col md:flex-row items-center justify-between gap-3 mt-16 text-center">
        <div>Companion Engine: Shichen Grid 2.5 // Micro Astro Sync Active</div>
        <div className="flex gap-4">
          <span>Astro Safe Session Code: 0x921024</span>
          <span className="text-[#8C7A6B] font-bold">100% No Ads & No Master Jargon</span>
        </div>
      </footer>

      {/* 條款 Modal 彈窗 */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/55 backdrop-blur-xs z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 15 }}
              className="bg-white border border-[#E3DAC7] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-left"
            >
              <div className="bg-[#8C7A6B] text-white px-6 py-4.5 flex justify-between items-center">
                <h3 className="font-serif font-semibold text-sm tracking-wider">
                  ☯️ 隱私保障條款與心理諮商/健康免責事宜
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="text-white hover:opacity-80 transition-all font-mono text-base p-1"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs md:text-sm leading-relaxed text-[#736B5E] font-serif">
                <section className="space-y-2">
                  <h4 className="font-bold text-[#3C352E] flex items-center gap-1.5 border-b border-[#EBE3D5] pb-1">
                    <span>🛡️</span> 1. 個人資料保護與絕對安全承諾
                  </h4>
                  <p className="text-xs">
                    本心理陪伴平台嚴格遵循安全標準。您在上面輸入的姓名、生日、時辰以及出生城市等個資，僅作為純本地計算流年星曜及九星圖比對的臨時參數，計算完畢後即刻銷毀。我們沒有部署任何留存或備份您生世隱私的長期資料庫伺服器，安全無解密外流之隱憂。
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#3C352E] flex items-center gap-1.5 border-b border-[#EBE3D5] pb-1">
                    <span>⚠️</span> 2. 民俗心理諮商定位與反對詐騙迷信聲明
                  </h4>
                  <p className="text-xs">
                    紫微斗數與九星術均為中華與日式傳統民俗美學哲學之理數，其本質是幫助現代人安撫情緒焦慮、進行自我調適的溫婉心靈對話工具。本平台<b>絕對禁止並全無任何消災物品販賣、開光佛牌推廣、高價法會消業障</b>等涉及詐財迷信的惡意套路。所有的言論、開運指南都是美學層面、無害且正向的生活建議，不具備強加因果暗示。
                  </p>
                </section>

                <section className="space-y-2">
                  <h4 className="font-bold text-[#3C352E] flex items-center gap-1.5 border-b border-[#EBE3D5] pb-1">
                    <span>⚕️</span> 3. 醫療衛教與不涉及臨床替代之終極聲明
                  </h4>
                  <p className="text-xs">
                    本系統在「身體健康調養」功能分頁、以及與心靈顧問追問對答中產生的任何提及生活起居、季節喝水、睡眠、多熱敷泡腳緩解焦慮、避忌或開運方位之言論：
                    <br className="my-1" />
                    <b>均屬於大众日常生活健康作息改良之常規衛教建議。絕對不構成任何實質醫療診斷、藥材配方、臨床症狀診治</b>。
                    <br className="my-1" />
                    【終極警示】：倘若閣下確實正在遭受任何生理、大腦或者心因精神疾病之痛苦（如胸悶不適、重度憂鬱、焦慮恐慌、生理失調等），請務必尋求具有执业合法證書的正規三甲醫院、心理醫生或專科醫師進行常規與正規之臨床科學救治，切勿因本軟體之言論延誤臨床救治！
                  </p>
                </section>

                <div className="bg-[#FAF8F5] border border-[#EBE3D5] p-3 rounded-xl text-xs leading-normal">
                  當您點選勾選框並送出資料時，即表示您已深刻理解本陪伴工具的心靈輔導與普通生活美學本質，並承諾對自己的健康科學救治負起完整理性責任。
                </div>
              </div>

              <div className="bg-[#FAF8F5] border-t border-[#EBE3D5] px-6 py-4.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAgreedToTerms(true);
                    setShowTermsModal(false);
                  }}
                  className="bg-[#8C7A6B] text-white px-5 py-2 hover:bg-[#706053] transition-all text-xs font-semibold rounded-xl cursor-pointer"
                >
                  確認已仔細閱讀並完全同意
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 模擬高階解鎖微光微支付彈窗 (借鑒科技紫微網高階金流界面) */}
      <AnimatePresence>
        {paymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-[1000] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#FCFBF9] border-2 border-[#E1D6C1] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-left max-h-[92vh]"
            >
              {/* 聖潔金沙渲染頂部 */}
              <div className="bg-[#8C7A6B] text-white px-5 py-4.5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">🪙</span>
                  <h3 className="font-serif font-bold text-xs tracking-wider uppercase">
                    微光心靈收銀台 ‧ 科技紫微支付中心
                  </h3>
                </div>
                {!isPaying && !paymentSuccess && (
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="text-white hover:opacity-80 transition-all font-mono text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 內容區 */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {paymentSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-8 space-y-4 font-serif"
                  >
                    <div className="w-16 h-16 bg-[#F0FAF4] border-2 border-[#22C55E] rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                      ✨
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#22C55E]">啟鑰契合功德圓滿！</h4>
                      <p className="text-xs text-[#8C8375]">
                        您所叩問的【{paymentTitle}】密鑰已瞬間全部解鎖大開！
                      </p>
                    </div>
                    <div className="text-[10px] bg-[#F6F8F6] border border-[#DFF0EA] text-[#426E40] px-4 py-2 rounded-xl font-medium inline-block select-text font-mono">
                      交易流水碼: CLICK108_MOCK_{Math.floor(Date.now() / 1000)}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {/* 解鎖對象 */}
                    <div className="bg-[#FAF8F5] border border-[#EBE3D5] p-4 rounded-2xl text-left space-y-1 relative overflow-hidden">
                      <span className="text-[9px] bg-red-700 text-white px-2 py-0.5 rounded font-serif font-bold tracking-widest uppercase">
                        推薦精批大書
                      </span>
                      <h4 className="text-sm font-bold text-[#3C352E] font-serif pt-1.5 flex items-center gap-2">
                        <span>📖</span>
                        <span>{paymentTitle}</span>
                      </h4>
                      <p className="text-[10.5px] text-[#8C8375] font-serif leading-relaxed">
                        心誠則靈，借鑒傳統『付費以酬謝天地、避免白嫖因果』，讓您與此星盤磁場同頻共鳴。
                      </p>
                    </div>

                    {/* 收費信息 */}
                    <div className="flex items-center justify-between px-1.5 py-1 bg-stone-50 border border-stone-200/50 rounded-xl">
                      <span className="text-xs text-[#736B5E] font-serif font-bold">應付金額 (Amount Due) :</span>
                      <span className="text-lg font-bold text-red-700 font-mono">
                        NT$ {paymentPrice}
                      </span>
                    </div>

                    {/* 收款管道切換 */}
                    <div className="space-y-2 pt-1 font-serif">
                      <span className="text-[10.5px] text-[#A19A8F] font-bold block">
                        🎁 選擇安全支付管道 (Select Payment Channel)
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: "line-pay", label: "LINE Pay", icon: "📱", color: "border-green-500 text-green-700 hover:bg-green-50" },
                          { id: "credit-card", label: "信用卡", icon: "💳", color: "border-blue-500 text-blue-700 hover:bg-blue-50" },
                          { id: "apple-pay", label: "ApplePay", icon: "", color: "border-stone-800 text-stone-900 hover:bg-stone-50" },
                          { id: "coins-pay", label: "斗數金幣", icon: "🪙", color: "border-amber-500 text-amber-700 hover:bg-amber-50" }
                        ].map((way) => (
                          <button
                            key={way.id}
                            type="button"
                            onClick={() => setSelectedPayMethod(way.id as any)}
                            className={`py-2 px-1 text-center rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                              selectedPayMethod === way.id
                                ? "bg-[#FAF8F5] border-[#8C7A6B] shadow-2xs font-bold ring-2 ring-[#8C7A6B]/20"
                                : "bg-white border-stone-200 text-stone-600"
                            }`}
                          >
                            <span className="text-base">{way.icon}</span>
                            <span className="text-[9.5px] whitespace-nowrap leading-none font-bold">{way.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 管道對應的精緻擬真金流子界面 */}
                    <div className="p-4 bg-white border border-[#EBE3D5] rounded-2xl min-h-[120px] font-serif">
                      {selectedPayMethod === "line-pay" && (
                        <div className="space-y-3 text-center py-2">
                          <div className="text-[11px] text-green-700 font-bold bg-green-50 py-1.5 px-3 rounded-xl inline-block border border-green-100">
                            🟢 已偵測到您行動裝置的 LINE Pay 安全錢包
                          </div>
                          <p className="text-[10.5px] text-stone-500 leading-normal">
                            點擊下方按鈕，系統將呼叫 LINE 帳號進行快速身分查對與免手續費扣款，享有超商點數回饋。
                          </p>
                        </div>
                      )}

                      {selectedPayMethod === "credit-card" && (
                        <div className="space-y-3 text-left">
                          <span className="text-[10px] text-stone-400 font-bold block">
                            輸入 Visa/Mastercard/JCB 安全卡號 (請自由模擬填寫)
                          </span>
                          
                          <div className="space-y-2.5">
                            <div>
                              <label className="text-[10px] text-stone-500 font-bold block mb-0.5">卡號 CARD NUMBER</label>
                              <input
                                type="text"
                                maxLength={19}
                                placeholder="4111 2222 3333 4444"
                                value={cardNo}
                                onChange={(e) => {
                                  // 自動加空格格式化
                                  const val = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
                                  const matches = val.match(/\d{4,16}/g);
                                  const match = (matches && matches[0]) || "";
                                  const parts = [];
                                  for (let i = 0, len = match.length; i < len; i += 4) {
                                    parts.push(match.substring(i, i + 4));
                                  }
                                  if (parts.length > 0) {
                                    setCardNo(parts.join(" "));
                                  } else {
                                    setCardNo(val);
                                  }
                                }}
                                className="w-full text-xs font-mono p-2 border border-stone-200 rounded-xl focus:border-[#8C7A6B] focus:outline-hidden"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-stone-500 font-bold block mb-0.5">有效期 EXPIRY</label>
                                <input
                                  type="text"
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let val = e.target.value.replace(/[^0-9]/gi, "");
                                    if (val.length >= 2) {
                                      setCardExpiry(val.substring(0, 2) + "/" + val.substring(2, 4));
                                    } else {
                                      setCardExpiry(val);
                                    }
                                  }}
                                  className="w-full text-xs font-mono p-2 border border-stone-200 rounded-xl focus:outline-hidden"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-stone-500 font-bold block mb-0.5">驗證碼 CVV</label>
                                <input
                                  type="password"
                                  placeholder="123"
                                  maxLength={3}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ""))}
                                  className="w-full text-xs font-mono p-2 border border-stone-200 rounded-xl focus:outline-hidden"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-stone-500 font-bold block mb-0.5">持卡人姓名 HOLDER NAME</label>
                              <input
                                type="text"
                                placeholder="WANG TA MING"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                className="w-full text-xs p-2 border border-stone-200 rounded-xl focus:outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPayMethod === "apple-pay" && (
                        <div className="space-y-3 text-center py-2">
                          <div className="text-[11px] text-stone-800 font-bold bg-stone-100 py-1.5 px-3 rounded-xl inline-block border border-stone-200">
                             Apple Wallet Secure Pay
                          </div>
                          <p className="text-[10.5px] text-stone-500 leading-normal">
                            安全晶片驗證。點擊下方按鈕本平台將在沙皮環境中模擬 Face ID/Touch ID 快速秒級檢閱解鑰。
                          </p>
                        </div>
                      )}

                      {selectedPayMethod === "coins-pay" && (
                        <div className="space-y-3 text-left">
                          <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                            <span className="text-xs text-stone-600 font-bold">科技紫微金幣餘額:</span>
                            <span className="text-sm font-black font-mono text-amber-600 flex items-center gap-1">
                              🪙 {coinsBalance} 金幣
                            </span>
                          </div>

                          <p className="text-[10px] text-stone-500 leading-normal">
                            解鎖本篇精批：需要消耗 <b className="text-amber-700">100 金幣</b>。
                          </p>

                          {coinsBalance < 100 ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2.5">
                              <span className="text-[10.5px] text-red-700 block font-bold">
                                ❌ 餘額不足以支付本件精批！
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCoinsBalance((prev) => prev + 150);
                                }}
                                className="w-full py-1.5 bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-bold text-[10.5px] rounded-lg transition-colors cursor-pointer"
                              >
                                🪙 點我「大賜福免費充值 150 金幣」禪定助旺
                              </button>
                            </div>
                          ) : (
                            <div className="p-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-[10.5px] font-bold">
                              ✅ 餘額充足！點擊下方按鈕即可用 {coinsBalance} 扣減支付起盤。
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* processing loading overlay steps */}
                    {isPaying && (
                      <div className="bg-stone-50/90 border border-[#E0D5B5] p-3 rounded-2xl flex flex-col items-center justify-center space-y-2 text-center py-5">
                        <Loader2 className="w-6 h-6 text-red-700 animate-spin" />
                        <span className="text-xs font-bold text-red-800 font-serif">
                          {payStatusText}
                        </span>
                        <p className="text-[10px] text-stone-400 font-serif">安穩呼吸、磁場調準中，切勿重新整理頁面...</p>
                      </div>
                    )}

                    {/* 溫馨提示 */}
                    <p className="text-[9px] text-[#8C8375] font-serif leading-normal bg-[#FAF8F5] p-2.5 rounded-lg border border-stone-100 select-text">
                      * 溫馨提醒：本系統純為 Demo 擬真與體驗設計。點擊按鈕將完全<b>「免費扣除與解鎖、體驗全盤精批的流暢美感」</b>，無須承擔任何金錢支出。
                    </p>

                    {/* 付款按鈕 */}
                    <button
                      type="button"
                      onClick={handleConfirmMockPayment}
                      disabled={isPaying || (selectedPayMethod === "coins-pay" && coinsBalance < 100)}
                      className="w-full py-3.5 bg-red-700 hover:bg-red-800 disabled:bg-stone-300 text-white font-serif font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:cursor-not-allowed uppercase tracking-widest"
                    >
                      {isPaying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>正在調對時空星軌金流...</span>
                        </>
                      ) : (
                        `👑 確認支付 NT$ ${paymentPrice} 解鎖全盤詳批`
                      )}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 👑 Click108 科技紫微極致詳批支付彈窗 */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-900/65 backdrop-blur-xs z-[1100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border-2 border-[#E1D6C1] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col text-left font-serif"
            >
              {/* Header */}
              <div className="bg-[#8C7A6B] text-white px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-base">👑</span>
                  <h3 className="font-bold text-sm tracking-widest">
                    CLICK108 科技紫微金流 · 安全起鑰
                  </h3>
                </div>
                {payStep !== 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPayStatusText("");
                    }}
                    className="text-white hover:opacity-80 transition-all font-mono text-sm p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
                
                {/* Steps tracker */}
                {payStep === 0 && (
                  <div className="space-y-4">
                    {/* Item header */}
                    <div className="bg-[#FCFAF4] border border-[#E9DFCB] p-4 rounded-2xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] bg-[#8C7A6B] text-white px-1.5 py-0.5 rounded font-mono font-bold tracking-wider uppercase">
                            微光小庵特製
                          </span>
                          <h4 className="text-xs font-bold text-[#3C352E] pt-1.5">
                            《{result ? `${result.personalInfo.name} ` : ""}極致一生紫微深層詳批報告》
                          </h4>
                          <p className="text-[10px] text-[#A69D90] leading-relaxed mt-0.5">
                            高精度天干地支五行交互演算法，涵蓋十年流年限運、桃花姻緣與開運指引。
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-stone-400 line-through">原價 NT$880</span>
                          <div className="text-red-700 font-extrabold text-lg">NT$ 299</div>
                        </div>
                      </div>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-stone-600 block pl-1">
                        👉 選擇金流通道 / Payment Channel:
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: "line-pay", label: "LINE Pay", icon: "🟢" },
                          { id: "credit-card", label: "信用卡", icon: "💳" },
                          { id: "apple-pay", label: "Apple Pay", icon: "🍎" },
                          { id: "coins-pay", label: "紫微幣", icon: "🪙" }
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                              setSelectedPayMethod(method.id as any);
                              setPayStatusText("");
                            }}
                            className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                              selectedPayMethod === method.id
                                ? "bg-[#8C7A6B] border-[#8C7A6B] text-white shadow-xs scale-[1.03]"
                                : "bg-white border-[#EBE3D5] text-[#736B5E] hover:border-[#8C7A6B]"
                            }`}
                          >
                            <span className="text-sm">{method.icon}</span>
                            <span>{method.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Channel specific interface */}
                    {selectedPayMethod === "line-pay" && (
                      <div className="bg-[#F4FAF6] border border-green-200 p-4 rounded-2xl space-y-3">
                        <div className="flex gap-3.5 items-center">
                          {/* Simulated QR Code for LINE Pay */}
                          <div className="w-16 h-16 bg-white border border-stone-200 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                            <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-60">
                              {Array.from({ length: 16 }).map((_, i) => (
                                <div 
                                  key={i} 
                                  className={`rounded-xs ${
                                    (i % 3 === 0 || i % 5 === 2) ? "bg-stone-900" : "bg-transparent"
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-left space-y-1">
                            <span className="text-green-700 text-[10px] font-sans font-extrabold uppercase bg-green-100/60 px-2 py-0.5 rounded-full inline-block tracking-wider">
                              LINE Pay Active
                            </span>
                            <div className="text-xs font-bold text-stone-800">行動條碼已自動配置！</div>
                            <p className="text-[10px] text-stone-500 leading-normal">
                              建議您直接點擊下方「條碼安全認證快捷支付」按鈕，即可以 LINE Pay 為您安全扣款 NT$299 完成起盤。
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedPayMethod === "apple-pay" && (
                      <div className="bg-stone-50 border border-stone-200 p-4 rounded-2xl text-left space-y-2">
                        <span className="text-stone-700 text-[10px] font-sans font-extrabold uppercase bg-stone-200 px-2 py-0.5 rounded-full inline-block tracking-wider">
                          Apple Express Gate
                        </span>
                        <div className="text-xs font-bold text-stone-800">已自動呼叫 Apple 鑰匙圈</div>
                        <p className="text-[10px] text-stone-500 leading-relaxed">
                          安全認證模式已自動對流。點擊下方按鈕將調用模擬 Face ID/Touch ID 校準，極速解鎖終身詳批。
                        </p>
                      </div>
                    )}

                    {selectedPayMethod === "coins-pay" && (
                      <div className="bg-[#FAF9F5] border border-[#E9DFCB] p-4 rounded-2xl space-y-3 text-left">
                        <div className="flex items-center justify-between border-b border-[#E9DFCB]/50 pb-2">
                          <span className="text-xs text-[#5C4D3C] font-bold">🪙 您的 Click108 虛擬紫微幣餘額：</span>
                          <strong className="text-sm font-mono text-[#8C7A6B]">{coinsBalance} 點</strong>
                        </div>

                        {coinsBalance < 299 ? (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10.5px] text-red-700 font-bold block">❌ 餘額不足（差額 {299 - coinsBalance} 點）</span>
                              <span className="text-[9.5px] text-[#8C7A6B] font-semibold bg-stone-100 px-1.5 py-0.5 rounded">
                                原則：誠心批算，功德加倍
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-500">
                              紫微網特惠：購買 500 點加贈 50 點（共計 550 點），僅需 NT$ 250，下次點亮流月改運急救大金帖可直接抵平扣用！
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setCoinsBalance(prev => prev + 550);
                                setPayStatusText("🎉 加值 NT$ 250 成功！已為您儲值 550 點紫微幣（含額外加贈 50 點）。餘額足夠扣款解鎖！");
                              }}
                              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer text-center"
                            >
                              ⚡ 快速加值 550 紫微幣 (NT$ 250)
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl text-[10.5px] text-green-800 font-bold flex items-center gap-1.5">
                            <span>✅</span> 餘額充足！點擊下方按鈕將扣除 299 紫微幣，永久解鎖本篇精緻詳批。
                          </div>
                        )}

                        {payStatusText && (
                          <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-700 text-[10.5px] rounded-lg">
                            {payStatusText}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedPayMethod === "credit-card" && (
                      <div className="bg-white border border-[#EBE3D5] p-4 rounded-xl text-left space-y-3 shadow-2xs">
                        <div>
                          <label className="text-[10px] font-bold text-stone-500 block mb-0.5 uppercase tracking-wider">信用卡卡號 / Card Number</label>
                          <input 
                            type="text" 
                            placeholder="4221 8229 0000 1108"
                            value={cardNo}
                            onChange={(e) => setCardNo(e.target.value)}
                            className="w-full text-xs font-mono p-2 border border-[#EBE3D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C7A6B] bg-stone-50 text-stone-700"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 block mb-0.5 uppercase tracking-wider">有效期 / Expiry</label>
                            <input 
                              type="text" 
                              maxLength={5}
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full text-xs font-mono p-2 border border-[#EBE3D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C7A6B] bg-stone-50 text-stone-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-stone-500 block mb-0.5 uppercase tracking-wider">安全碼 / CVC/CVV</label>
                            <input 
                              type="password" 
                              maxLength={3}
                              placeholder="***"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full text-xs font-mono p-2 border border-[#EBE3D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C7A6B] bg-stone-50 text-stone-700"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-stone-500 block mb-0.5 uppercase tracking-wider">持卡人姓名 / Holder Name</label>
                          <input 
                            type="text" 
                            placeholder="張有緣"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full text-xs p-2 border border-[#EBE3D5] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C7A6B] bg-stone-50 text-stone-700"
                          />
                        </div>
                      </div>
                    )}

                    {/* Simulation note and check-out button */}
                    <p className="text-[9.5px] text-[#8C8375] leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-stone-100">
                      * 聲明：本產品是由微光小庵模擬研發之「科技紫微網解密版」。此彈窗完全為模擬支付體驗所作，並不會實際與您的真實銀行信用卡發生扣款。請安心點擊，沈浸式體驗深度析盤流暢快感。
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPayMethod === "coins-pay" && coinsBalance < 299) {
                          setPayStatusText("⚠️ 餘額不足點數，請先點選上方的儲值快捷加點！");
                          return;
                        }
                        setPayStep(1);
                        setTimeout(() => {
                          if (selectedPayMethod === "coins-pay") {
                            setCoinsBalance(prev => prev - 299);
                          }
                          setPayStep(2);
                          setTimeout(() => {
                            setIsPremiumUnlocked(true);
                            setShowPaymentModal(false);
                            setPayStep(0);
                          }, 1200);
                        }, 2000);
                      }}
                      className="w-full bg-[#8C7A6B] hover:bg-[#736052] text-white py-3.5 rounded-xl text-xs font-semibold tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {selectedPayMethod === "line-pay" && "🟢 LINE Pay 授權安全一鍵解鎖"}
                      {selectedPayMethod === "apple-pay" && "🍎 Apple Wallet 快速觸控解鎖"}
                      {selectedPayMethod === "coins-pay" && "🪙 扣除 299 紫微幣扣點解鎖"}
                      {selectedPayMethod === "credit-card" && "💳 驗證信用卡安全起鑰解鎖"}
                    </button>
                  </div>
                )}

                {payStep === 1 && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#8C7A6B]" />
                    <div className="space-y-1.5">
                      <div className="text-xs text-[#5C4D3C] font-bold">安全握手金流閘口中...</div>
                      <p className="text-[10px] text-[#8C8375] italic leading-normal px-6">
                        正在以 Click108 星曜共振校準，校正真太陽時時差、生肖年支共鳴與地理經緯時區座標，請稍候。
                      </p>
                    </div>
                  </div>
                )}

                {payStep === 2 && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                    <span className="text-5xl animate-bounce">🍀</span>
                    <div className="space-y-1.5">
                      <div className="text-xs text-green-800 font-extrabold tracking-widest">
                        天干地支磁場同步成功！
                      </div>
                      <p className="text-[10px] text-green-700 italic">
                        金流認證通驗。精緻詳批報告書已成功永久落入您的閣下專屬存檔。
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔮 運勢提醒 Toast 浮窗 */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[2000] bg-stone-900 border border-stone-800 text-white text-xs py-3.5 px-5 rounded-2xl shadow-2xl max-w-sm flex items-center gap-3 font-serif"
          >
            <span className="text-lg">🕯️</span>
            <div className="flex-1 text-left space-y-0.5">
              <div className="font-bold text-[#E6D7B8]">微光小庵 ‧ 命理投遞</div>
              <p className="text-[11px] text-stone-300 leading-relaxed font-sans">{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="text-stone-400 hover:text-white transition-colors text-sm font-mono cursor-pointer shrink-0 ml-1.5"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
