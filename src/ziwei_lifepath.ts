// 1. 在檔案最上方引入我們千辛萬苦裝好的 iztro 引擎
import { astro } from 'iztro';

/**
 * 取代舊的排盤邏輯：使用 iztro 產生精準命盤，並轉換為前端 UI 認識的格式
 * @param birthDate 生日字串，例如 '1996-07-22'
 * @param birthTime 出生時辰（數字），例如 15 代表申時 (15:00-17:00)
 * @param gender 性別，'男' 或 '女'
 */
export function generateZiweiAstrolabe(birthDate: string, birthTime: number, gender: '男' | '女') {
  // 讓保時捷引擎發動，排出絕對精準的星盤（支援繁體中文與閏月自動校正）
  const astrolabe = astro.bySolar(birthDate, birthTime, gender, true, 'zh-TW');

  // 將 iztro 的超詳細資料，翻譯成你前端 12 宮位格子與 calculateSanFangSiZheng 預期的格式
  const formattedPalaces = astrolabe.palaces.map((palace) => {
    return {
      // 這是你原本邏輯最需要的 key，例如："命宮", "兄弟宮"
      name: palace.name, 
      
      // 宮位的基本座標
      earthBranch: palace.earthlyBranch, // 地支：例如 "亥"
      heavenlyStem: palace.heavenlyStem, // 天干：例如 "癸"
      
      // 星曜陣列（將物件轉為純文字陣列，方便前端直接迴圈渲染）
      majorStars: palace.majorStars.map(star => star.name), // 主星：["紫微", "七殺"]
      minorStars: palace.minorStars.map(star => star.name), // 輔星：["文昌", "鈴星"]
      
      // 大限範圍
      decadal: {
        range: `${palace.decadal.range[0]} - ${palace.decadal.range[1]} 歲` 
      },

      // 備用：把 iztro 算出的原始資料整包帶著，以後你要擴充流年或飛星，隨時抓得到
      rawIztroData: palace 
    };
  });

  return formattedPalaces; // 這個陣列就可以直接丟給你的 calculateSanFangSiZheng 運算了！
}