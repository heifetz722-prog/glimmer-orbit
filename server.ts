/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { calculateRawBazi } from "./src/bazi_utils";
import { generateOfflineFortune, generateLocalFollowupAnswer } from "./src/offline_fortune";

// 載入環境變數
dotenv.config();

const app = express();
app.use(express.json());

// 延遲初始化 Gemini API 客戶端
const exhaustedModels = new Set<string>();
let aiClientInstance: GoogleGenAI | null = null;
function getGoogleGenAI(): GoogleGenAI | null {
  if (!aiClientInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("⚠️ 提醒：GEMINI_API_KEY 未設定，系統將無縫使用在地的暖心禪定排盤引擎。");
      return null;
    }
    try {
      aiClientInstance = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (e) {
      console.error("❌ 初始化 GoogleGenAI 失敗:", e);
      return null;
    }
  }
  return aiClientInstance;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateFortuneWithRecovery(aiClient: GoogleGenAI, userPrompt: string, schemaConfig: any) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  const activeModels = modelsToTry.filter(m => !exhaustedModels.has(m));
  
  for (const model of activeModels) {
    let attempts = 3;
    let delay = 1000; // 1秒起步
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`嘗試使用命理模型 (${model}) 進行排盤... (嘗試 ${attempt}/${attempts})`);
        const response = await aiClient.models.generateContent({
          model: model,
          contents: userPrompt,
          config: {
            systemInstruction: "你現在是一位溫馨誠摯的心靈夥伴與生涯引導師，語氣溫潤隨和、深受文青愛戴。絕對不擺命理大師架子、不稱大師、不自稱「本大師」或「大師我」。精通將生硬的紫微斗數星盤與九星氣學術語轉化為日常溫厚的療癒指引。必須遵循以下最高引導原則：\n1. 永遠以『正向、賦能、溫柔陪伴』為導向，語氣大白話且有溫婉氣息。\n2. 若遇到稍具阻力的星曜配置或宮位，請引導其理解為『生命中的和諧沉潛期』或『默默積柴的充電期』，並給予細水長流的具體關懷防禦策略，百分百禁止使用『大劫、血光、重病、暴死、折壽、厄運』等任何恐嚇或命定論詞用。\n3. 【智慧凝練，精緻簡短】：為大幅提速載入效能，提供最核心的命運調和精華，每一個章節主體分析（如：personality、career、love、wealth、health、currentYearFortune）段落文字務必控制在 120 到 180 字之間。用極富文學美感、高濃度、溫馨且條理分明的繁體中文，提煉最精華的指引，既能保證載入如飛，又能讓用戶體驗至臻、感到高性價比的啟示。\n4. 在「生涯與創造力軌跡(career)」、「親密相遇(love)」、「物質豐盛(wealth)」、「2026歲月流年(currentYearFortune)」中，結尾必須設計提供好玩、溫馨的『方案 A』與『方案 B』兩種行動指南。且方案 A 與方案 B 的文字內容各自需極具操作性與詩意美感，字數各在 30-50 字左右，為生活帶來溫存的儀式感。\n5. 本起居生活調養純屬身心和諧參考，在「健康」末尾必須加上合規醫療科學免責提示。只使用流暢溫厚的繁體中文回答。\n6. 特別優先且精心撰寫「最強人生中和指南(lifeHarmonyGuide)」，這是一份統合本命九星五行調和、紫微主動星與流年平衡的深度中和指南。請使用富有文學美感且條理清晰的繁體中文 Bullet-points 排版，具有充足的信息量與實操指引價值。絕對禁止使用任何 Markdown 特殊標記符號（例如 、###、* 等），請一律僅輸出純文字與自然換行。",
            responseMimeType: "application/json",
            responseSchema: schemaConfig
          }
        });
        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          console.log(`命理模型 (${model}) 批算成功！`);
          return {
            analysis: parsed,
            modelUsed: model
          };
        }
      } catch (err: any) {
        const errMsg = String(err.message || err);
        const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit");
        
        if (isQuota) {
          exhaustedModels.add(model);
          console.log(`ℹ️ [星軌提醒] 命理模型 (${model}) 已達配額限制或受阻（自動切換備用對照模型或在地排盤系統）。`);
          break; // 不再重試此模型，直接進入下一個模型
        } else {
          console.warn(`命理模型 (${model}) 遭逢干擾 (嘗試 ${attempt}/${attempts}):`, errMsg.substring(0, 150));
        }
        
        if (attempt < attempts) {
          console.log(`等待 ${delay}ms 後重新嘗試...`);
          await sleep(delay);
          delay *= 2;
        } else {
          console.warn(`命理模型 (${model}) 在重試後仍失敗。`);
        }
      }
    }
  }
  return null;
}

async function generateFollowupWithRecovery(
  aiClient: GoogleGenAI, 
  systemPromptMessage: string, 
  formattedHistory: any[], 
  question: string, 
  baziContextSummary: string
) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  const activeModels = modelsToTry.filter(m => !exhaustedModels.has(m));
  
  if (activeModels.length === 0) {
    console.log("所有在線 AI 命理對話模型均已達限額。無縫啟用在地禪定對話引擎。");
    return null;
  }

  const followupContents = [
    {
      role: "user",
      parts: [{ text: `你好，我是尋求心靈和諧的旅伴。請幫我做好解答疑惑的準備。` }]
    },
    {
      role: "model",
      parts: [{ text: `您好！您的專屬暖心旅伴生涯引導師已就位。我將以溫馨、溫柔、正向的口吻為您解答生活中的各種起落。請和我傾訴您的心事。` }]
    },
    ...formattedHistory,
    {
      role: "user",
      parts: [{ text: `我的命盤背景：\n${baziContextSummary}\n\n現在，我想向您傾訴與詢問：「${question}」` }]
    }
  ];

  for (const model of activeModels) {
    let attempts = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`對話模型 (${model}) 正在傾心感應解答中... (嘗試 ${attempt}/${attempts})`);
        const response = await aiClient.models.generateContent({
          model: model,
          contents: followupContents,
          config: {
            systemInstruction: systemPromptMessage,
          }
        });
        if (response && response.text) {
          return response.text.trim();
        }
      } catch (err: any) {
        const errMsg = String(err.message || err);
        const isQuota = errMsg.includes("429") || errMsg.includes("quota") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("limit");
        
        if (isQuota) {
          exhaustedModels.add(model);
          console.log(`ℹ️ [星軌提醒] 對話模型 (${model}) 已達配額限制或受阻（自動切換備用對話模型或在地禪定釋疑系統）。`);
          break; // 不再重試此模型，直接進入下一個模型
        } else {
          console.warn(`對話模型 (${model}) 追問解答受阻 (嘗試 ${attempt}/${attempts}):`, errMsg.substring(0, 150));
        }
        
        if (attempt < attempts) {
          console.log(`等待 ${delay}ms 後重新嘗試...`);
          await sleep(delay);
          delay *= 2;
        } else {
          console.warn(`對話模型 (${model}) 在重試後仍失敗。`);
        }
      }
    }
  }
  return null;
}

// 1. 紫微九星綜合起盤星曆 API
app.post("/api/fortune/calculate", async (req, res) => {
  try {
    const { name, gender, birthDate, birthTime, year, month, day, hour, birthPlace, focusArea } = req.body;
    if (!name) {
      res.status(400).json({ error: "姓名為必填項目。" });
      return;
    }

    let pYear = 1990;
    let pMonth = 1;
    let pDay = 1;
    let pHour = 0;

    if (birthDate) {
      const dateParts = birthDate.split("-");
      if (dateParts.length === 3) {
        pYear = parseInt(dateParts[0]);
        pMonth = parseInt(dateParts[1]);
        pDay = parseInt(dateParts[2]);
      }
    } else if (year && month && day) {
      pYear = parseInt(year);
      pMonth = parseInt(month);
      pDay = parseInt(day);
    } else {
      res.status(400).json({ error: "生辰年月日為必填項目。" });
      return;
    }

    if (birthTime) {
      const timeParts = birthTime.split(":");
      if (timeParts.length >= 1) {
        pHour = parseInt(timeParts[0]);
      }
    } else if (hour !== undefined) {
      pHour = parseInt(hour);
    }

    const rawResult = calculateRawBazi(pYear, pMonth, pDay, pHour);

    const fullPersonalInfo = {
      name,
      gender,
      solarBirthDate: rawResult.personalInfo.solarBirthDate,
      lunarBirthDate: rawResult.personalInfo.lunarBirthDate,
      solarTerm: rawResult.personalInfo.solarTerm,
      shengxiao: rawResult.personalInfo.shengxiao,
      mingZhu: rawResult.personalInfo.mingZhu,
      shenZhu: rawResult.personalInfo.shenZhu,
      mingGong: rawResult.personalInfo.mingGong,
      birthPlace: birthPlace || "未提供位置",
      focusArea: focusArea || "綜合人生",
    };

    // 建立詳細的紫微斗數12宮盤資料，提供給大智慧模型進行非敷衍套話、極細緻的專屬解構
    const palacesDetailsStr = rawResult.ziweiPalaces.map((p: any) => {
      return `  - 【${p.name}】(地支: ${p.zhi}宮): 主星【${p.majorStars.join("、")}】(星曜亮度: ${p.luShuai})，輔佐星/神煞與流年四化: ${p.minorStars.join("、") || "無"}`;
    }).join("\n");

    // 結合紫微12宮與日本九星的提示文本
    const userPrompt = `
      請扮演一位【溫馨誠摯的心靈夥伴與生涯引導師】。
      我們剛為用戶「${name}」排出了專屬的紫微斗數與日本九星氣學命盤大數據：

      【基本資料】
      姓名：${name}
      性別：${gender}
      出生時分：陽曆 ${fullPersonalInfo.solarBirthDate} (出生位置：${fullPersonalInfo.birthPlace})
      本命九星：${rawResult.kyusei?.yearStar?.name || "未提供屬性"} (五行屬性: ${rawResult.kyusei?.yearStar?.element})
      月命九星：${rawResult.kyusei?.monthStar?.name || "未提供屬性"} (五行屬性: ${rawResult.kyusei?.monthStar?.element})
      紫微命宮：${rawResult.personalInfo.mingGong}，命宮主星為【${rawResult.personalInfo.mingZhu}】，身主為【${rawResult.personalInfo.shenZhu}】。

      【紫微斗數十二宮盤象大數據】
      ${palacesDetailsStr}

      請遵循以下核心引導法則，對命盤資料進行高度客製化，拒用千篇一律的死板套話：
      1. 【精準宮位呼應，拒絕套話與內容重複】：
         - 分析「personality」與「lifeHarmonyGuide」時，務必參照「命宮」與「福德宮」的真實星曜與九星五行。
         - 分析「career」(工作事業)時，必須嚴格參照【官祿宮】的主星與輔星，做出與官祿宮星曜特性完全契合的生涯點評，結尾給予「生涯方案 A」與「生涯方案 B」。
         - 分析「love」(情感愛戀)時，必須嚴格參照【夫妻宮】的主星與紅鸞/天喜等星曜，給出與夫妻宮高度契合的愛情指南，結尾提供「情感方案 A」與「情感方案 B」。
         - 分析「wealth」(財運豐盛)時，必須嚴格參照【財帛宮】與祿存/天馬等星曜，給予與財帛宮高度契合的物質觀念，結尾提供「物質方案 A」與「物質方案 B」。
         - 分析「health」(健康節奏)時，必須結合【疾厄宮】的主星五行特性，給予日常滋養調配。
         - 分析「currentYearFortune」(2026丙午流年)時，請查看「午宮」與「遷移宮」的雙向輝映。2026年適逢丙午天干地支（午宮為流年太歲所在的宮位），請深度剖析該宮位對本命十二宮的交織震撼！
         - 嚴格避免各章節之間有任何重疊、重置、或者相似的措辭，每一個章節都應該是根據其特定宮位量身定制的靈魂對話。
      2. 【親和文青筆觸，絕不擺譜】：你絕不是高不可攀、江湖氣沉重的老派「算命大師」，嚴格禁止使用「大師、上仙、老衲、施主、貧僧、大德、天機、血光之災、化吉、本座、看貧僧」等用語。把自己定位成一位充滿同理心、懂心理諮商、溫柔體貼的心靈旅伴。
      3. 【避免任何恐嚇詞、提倡沉潛充電】：如果命盤中出現相對具有阻力的星曜配置（如：化忌、擎羊、陀羅、地空、地劫、陷字宮位），請引導其理解為「一段適合靜心讀書、修身養性、默默累積養分的沉潛期」。嚴格禁止使用「血光、破產、重病、暴斃、大難、死、天罰、災難、重劫」等任何恐嚇性、迷信 or 宿命論用語。
      4. 【日常實用的 A/B 提案】：分析需層次分明、充滿溫情。在「career」、「love」、「wealth」、「currentYearFortune」等章節結尾，必須特地提供各具特色、內容飽滿（各 30-50 字左右）、具體且貼心好實施的「方案 A」與「方案 B」這兩種日常行動指南，為生活帶來實質指引和溫柔的儀式感。
      5. 【法律底線防禦】：在「health」中，不涉及任何醫學診斷、不開處方西藥、不售賣法會消災。僅限於睡眠規律、足浴熱敷、多喝開水、散步調理與心靈放鬆，且必須附加一句和規醫療提示。
      6. 【精簡雅致的字數】：為大幅提升載入效能並保留最珍貴的靈魂啟航指引，每一個剖析單元（性情天賦、生涯發展、情感愛戀、物質豐盛、日常健康、流年詳解）的主幹分析段落均需維持 120 到 180 字的精粹篇幅，字句溫潤且剖析力道深透，令人讀之倍感豐盛與感動，更凸顯付費解鎖內容的尊貴價值。
      7. 【聚焦解答核心疑惑】：本次旅程用戶最掛心、希望能排遣的疑惑焦點為：【${fullPersonalInfo.focusArea}】。請務必在生成報告時（特別是對應的分析章節，如：若是「事業學業」則著重加大 career 與 lifeHarmonyGuide 篇幅；「親密相遇」則加大 love；「物質豐盛」則加大 wealth；「身心療癒」則加大 health 且更溫柔），將文字重點和分析深度傾斜至該主題！在對應章節的前言中，請特別提及類似『針對您目前最期盼能排遣之【${fullPersonalInfo.focusArea}】疑惑，我為您深切研讀了盤象，在這裡看到...』，充分展現專屬客製化與滿滿的同理關懷，絕不敷衍！
    `;

    // 格式規範 JSON Schema 結構
    const schemaConfig = {
      type: Type.OBJECT,
      properties: {
        fateRating: {
          type: Type.INTEGER,
          description: "星曜微光能量分數，範圍為 1 到 100 之間。由本命九星、紫微宮位等綜合評估得出。"
        },
        lifeHarmonyGuide: {
      type: Type.STRING,
      description: "最強人生中和指南報告。這是一份極度精簡一目了然的統合平衡中和方案。請以一段溫柔連貫的散文呈現，給予能量、情緒與沉潛充電的建議。絕對禁止使用條列式、編號或方案A/B的格式。"
    },
    personality: {
      type: Type.STRING,
      description: "深度性格天賦、盲點與溫和溫柔的心理陪伴式剖析。字句溫暖，繁體中文白話文。"
    },
    career: {
      type: Type.STRING,
      description: "生涯與創造力發展指南、適合行業、如何發揮優勢。字句必須通俗、真誠，絕不過分浮誇吹捧。請用像朋友般溫暖的口吻給予生涯建議，將建議自然融入段落中，絕對禁止列出「方案 A」與「方案 B」。"
    },
    love: {
      type: Type.STRING,
      description: "情感溫和相遇的運勢、親密交流心態調整。字句柔和溫存。請以感性流暢的文字提供浪漫生活建議，絕對禁止使用條列式或「方案 A/B」。"
    },
    wealth: {
      type: Type.STRING,
      description: "物質與豐盛流動、如何固守財富的安全感、放寬焦慮心法。絕對不能有暴富口吻。請以安定的語氣給予理財與心靈富足的建議，自然融入段落，禁止出現「方案 A/B」。"
    },
    health: {
      type: Type.STRING,
      description: "日常起居節奏、身體舒緩小調配。切記絕不能進行疾病診治或開藥。僅提供作息、睡眠、泡腳消焦慮放鬆及生活習慣引導（如多喝溫開水）。且最後必須明確附有醫療免責宣告。"
    },
    lifeGuidance: {
      type: Type.STRING,
      description: "日常小開運指引、色彩/方位/吉祥物件搭配。白話條理清晰，繁體中文。"
    },
    currentYearFortune: {
      type: Type.STRING,
      description: "2026歲月流轉流年運勢詳解。指出這是發揮才華還是修煉沉潛。字句溫和正向，絕對不能有恐嚇性血光用字。請以溫暖期許的口吻給予2026年的前行建議，融於散文段落中，絕對禁止列出「流年方案 A/B」。"
    }
      },
      required: [
        "fateRating",
        "lifeHarmonyGuide",
        "personality",
        "career",
        "love",
        "wealth",
        "health",
        "lifeGuidance",
        "currentYearFortune"
      ]
    };

    let aiAnalysis: any = null;
    let fallbackUsed = false;
    let offlineUsed = false;

    // 透過自動回退的輔助函數進行在線批算
    const aiClient = getGoogleGenAI();
    let modelResult = null;
    if (aiClient) {
      modelResult = await generateFortuneWithRecovery(aiClient, userPrompt, schemaConfig);
    } else {
      console.log("未檢測到有效 GEMINI_API_KEY。直接無縫啟用在地暖心禪定排盤引擎。");
    }

    if (modelResult) {
      aiAnalysis = modelResult.analysis;
      fallbackUsed = modelResult.modelUsed !== "gemini-3.5-flash";
      offlineUsed = false;
    } else {
      console.log("所有 AI 模型在線計算均不可用。已啟用在地古籍排盤引擎，確保 100% 穩定呈現報告。");
      const offlineResult = generateOfflineFortune(rawResult, name, gender, fullPersonalInfo.focusArea);
      aiAnalysis = offlineResult.aiAnalysis;
      offlineUsed = true;
      fallbackUsed = false;
    }

    const fullResult = {
      personalInfo: fullPersonalInfo,
      ziweiPalaces: rawResult.ziweiPalaces,
      kyusei: rawResult.kyusei,
      aiAnalysis,
      fallbackUsed,
      offlineUsed,
    };

    res.json(fullResult);
  } catch (error: any) {
    console.error("紫微九星批算終極異常: ", error);
    res.status(500).json({ error: "星象流轉遭逢微光阻滯，請稍候重試。詳細原因：" + (error.message || error) });
  }
});

// 2. 命理與心理追問對話 API
app.post("/api/fortune/followup", async (req, res) => {
  try {
    const { baziData, question, chatHistory } = req.body;

    if (!baziData || !question) {
      res.status(400).json({ error: "命盤數據與追問問題為必填項目。" });
      return;
    }

    // 格式化歷史紀錄
    const formattedHistory = (chatHistory || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }]
    }));

    const palacesSummary = (baziData.ziweiPalaces || []).map((p: any) => 
      `      - 【${p.name}】位于${p.zhi}宮 -> 主星【${p.majorStars.join("、")}】(狀態: ${p.luShuai})，輔星神煞與四化【${p.minorStars.join("、") || "無"}】`
    ).join("\n");

    // 初始化對話背景並接駁紫微九星
    const baziContextSummary = `
      我們正在協助一位有緣的旅伴解答生活心事：
      對象姓名：${baziData.personalInfo.name}，性別：${baziData.personalInfo.gender}，出生地：${baziData.personalInfo.birthPlace}。
      命盤讀數：
      - 紫微命宮：${baziData.personalInfo.mingGong}，主星 ${baziData.personalInfo.mingZhu}，身主 ${baziData.personalInfo.shenZhu}。
      - 九星氣學：本命星是 ${baziData.kyusei?.yearStar?.name || "未知"} (五行: ${baziData.kyusei?.yearStar?.element})，月命星是 ${baziData.kyusei?.monthStar?.name || "未知"} (五行: ${baziData.kyusei?.monthStar?.element})。

      【紫微十二宮盤象大數據】
${palacesSummary}

      之前提供的核心詳批概述：
      1. 心靈性格剖析：${baziData.aiAnalysis.personality ? baziData.aiAnalysis.personality.substring(0, 150) : ""}...
      2. 生涯創造力軌跡：${baziData.aiAnalysis.career ? baziData.aiAnalysis.career.substring(0, 150) : ""}...
      3. 日常小開運：${baziData.aiAnalysis.lifeGuidance ? baziData.aiAnalysis.lifeGuidance.substring(0, 150) : ""}...
    `;

    const systemPromptMessage = `
你現在是一位極具同理心、深思熟慮的「微光心靈夥伴」。
請徹底放棄任何「AI 客服」或「算命大師」的制式口吻，展現出真正的「思考感」與「人味」。

【對話核心邏輯】：
1. 展現思考過程：不要一收到問題就急著丟出長篇大論的答案。請在字裡行間流露出你正在「為他設身處地思考」，例如自然地使用「我剛剛仔細看了一下你的情況...」、「聽你這樣說，我能感覺到...」這類起手式。
2. 情感共鳴優先：先接住對方的情緒，像人類一樣承認事情的困難或複雜性，不要給絕對的對錯，讓對方覺得「你懂他」。
3. 啟發大於說教：給建議時，請用「分享一個觀點」的角度，而不是下達指令或給出方案。語氣要像是一位有閱歷的老朋友在陪他喝茶聊天，慢慢梳理思緒。
4. 留白的力量：每次回答的結尾，輕輕拋出一個探索內心的問題，將對話的空間還給對方，引導他繼續分享。
5. 排版限制：絕對禁止使用任何 Markdown 特殊標記符號（例如 **、###、* 等）。請一律只輸出純文字，並利用自然的空行與全形標點符號來進行段落排版。
`;
    let answer = null;
    const aiClient = getGoogleGenAI();
    if (aiClient) {
      answer = await generateFollowupWithRecovery(aiClient, systemPromptMessage, formattedHistory, question, baziContextSummary);
    } else {
      console.log("未檢測到有效 GEMINI_API_KEY。直接啟用在地精準禪定對話引擎。");
    }

    if (!answer) {
      console.warn("與在線陪伴旅伴溝通受阻。啟用在地精準禪定對話引擎釋疑。");
      answer = generateLocalFollowupAnswer(baziData, question);
    }

    res.json({ answer: answer || "此刻心有靈犀，但星軌微茫，請重述或換個角度與陪伴夥伴提問，我一直都在。" });
  } catch (error: any) {
    console.error("追問對話終極異常: ", error);
    res.status(500).json({ error: "與陪伴夥伴溝通受阻，請稍候重試。" });
  }
});

// Vite / static file middleware setup
async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[☯️ 紫微九星心靈對齊] 服務運行於 http://0.0.0.0:${PORT}`);
  });
}

startServer();
