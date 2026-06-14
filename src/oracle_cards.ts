/**
 * 微光小庵 - 心靈一籤每日能量卡資料
 */

export interface OracleCard {
  id: number;
  title: string;
  keyword: string;
  star: string;
  blessing: string;
  advice: string;
  element: "木" | "火" | "土" | "金" | "水";
  colorName: string;
  colorBg: string;
}

export const ORACLE_CARDS: OracleCard[] = [
  {
    id: 1,
    title: "溫火烹茶",
    keyword: "沈澱 · 蘊蓄",
    star: "天府守垣",
    blessing: "「莫急於將冷水燒開，溫火烹煮的茶，方能香氣綿長。」",
    advice: "今天給自己十五分鐘什麼都不做的空白。手握一杯溫水、深呼吸三次，放下對『效率』的過度索求，在安靜中穩紮穩打。",
    element: "土",
    colorName: "琥珀暖黃",
    colorBg: "bg-[#F7F2E8] border-[#DFD5C6] text-[#8C7A6B]"
  },
  {
    id: 2,
    title: "月映空谷",
    keyword: "清朗 · 觀照",
    star: "太陰朗照",
    blessing: "「空谷之中並非無一物，而是容納了月光的溫柔，和解了四周的風噪。」",
    advice: "若當前有些許焦慮，閉上眼睛聽聽環境裡的聲音。接受這份短暫的迷茫，像月光包容夜空一樣，溫柔地與當下的自己言和。",
    element: "水",
    colorName: "月白冷青",
    colorBg: "bg-[#F0F4F8] border-[#D0DFEB] text-[#556E84]"
  },
  {
    id: 3,
    title: "新筍破土",
    keyword: "生旺 · 突破",
    star: "天機化科",
    blessing: "「細雨過後的竹林，正悄悄蓄積刺穿岩石、直衝雲際的青綠能量。」",
    advice: "不要小看任何微小的改變或新念頭。今天非常適合開啟一個小習慣（如閱讀三頁書、記一個單字），新生的力量正在你的指尖凝聚。",
    element: "木",
    colorName: "竹葉新綠",
    colorBg: "bg-[#EFF6EE] border-[#CDDFCB] text-[#52734D]"
  },
  {
    id: 4,
    title: "爐中守火",
    keyword: "微光 · 恆常",
    star: "太陽守照",
    blessing: "「無須成為炫目的禮花，只需做一爐冬日寒夜裡，永不熄滅、溫熱如初的炭火。」",
    advice: "關注生活最單純的秩序——按時吃飯、安穩入睡、拍拍雙肩。用你的日常定力，給身邊人傳遞一份默默卻無可取代的依靠。",
    element: "火",
    colorName: "硃砂微紅",
    colorBg: "bg-[#FDF2EE] border-[#EAD0C3] text-[#A66C52]"
  },
  {
    id: 5,
    title: "石中藏玉",
    keyword: "斂翼 · 琢磨",
    star: "武曲入廟",
    blessing: "「最堅實的心志，往往安放在最不起眼的粗礪頑石之中，靜待歲月打磨。」",
    advice: "低調、踏實是今天的制勝關鍵。默默做好手中細碎的常規工作，不慕虛名、不與人爭一時口舌，時間終會為你開出潤澤之花。",
    element: "金",
    colorName: "玄冰灰曜",
    colorBg: "bg-[#F3F4F6] border-[#DCDFE6] text-[#6B7280]"
  },
  {
    id: 6,
    title: "幽蘭獨芳",
    keyword: "自在 · 自足",
    star: "天同恬淡",
    blessing: "「哪怕無人踏足深林，幽蘭也依然悠閒自得地吐露芬芳。花開，只為取悅自己。」",
    advice: "今晚買一束鮮花放在案頭，或者做一件單純讓自己感到快樂的小手工。你的價值，不取決於外界任何人的評價與回饋。",
    element: "木",
    colorName: "幽谷蒼碧",
    colorBg: "bg-[#EAF0EC] border-[#CBD8D0] text-[#4A6455]"
  },
  {
    id: 7,
    title: "流泉繞石",
    keyword: "隨順 · 變通",
    star: "天府化祿",
    blessing: "「溪水遇到堅不可摧的磐石，從不硬碰。盈盈繞行，依舊歡歌奔向遠方。」",
    advice: "遇到阻礙或計劃變動時，不要較勁、不要自責。退一步，尋求更有彈性的折衷方案，順應命運的流速，反而能走得更加寬廣舒適。",
    element: "水",
    colorName: "碧潭湖青",
    colorBg: "bg-[#EDF6F6] border-[#CCE0E1] text-[#4F7E81]"
  },
  {
    id: 8,
    title: "秋葉安息",
    keyword: "接納 · 釋懷",
    star: "天梁自守",
    blessing: "「枯葉在泥土中安息，絕非終結，而是為了繁花在來年春天重新相擁而鋪下的溫床。」",
    advice: "是時候把那些過期的記憶、無法強求的關係釋放了。做一次房間大掃除，扔掉堆積的雜物，當空間騰乾淨了，光亮自然會湧進來。",
    element: "金",
    colorName: "銀杏枯黃",
    colorBg: "bg-[#FAF7EE] border-[#EAE2CA] text-[#867540]"
  },
  {
    id: 9,
    title: "星光指路",
    keyword: "信念 · 啟明星",
    star: "紫微極星",
    blessing: "「當黑夜黑到最深處時，抬頭望，那一顆指路的北極星便會格外耀眼、永恆恆定。」",
    advice: "尋回你的內在核心。寫下三件你最在乎、最渴望秉持的做事原則。只要方向是清晰的，暫時的曲折路途都不足為懼，勇敢邁步吧。",
    element: "土",
    colorName: "紫極帝鄉",
    colorBg: "bg-[#F6F0F8] border-[#DFD1E8] text-[#735A88]"
  }
];
