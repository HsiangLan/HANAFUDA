
export interface LessonContentBlock {
  type: 'text' | 'image' | 'video' | 'heading' | 'subheading' | 'list' | 'ordered-list';
  value: string | string[]; // string for text, image src, video embed src, heading text; string[] for list items
  aiHint?: string; // Added for images
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  estimatedTime: string; // e.g., "15 minutes"
  contentBlocks: LessonContentBlock[];
  quizId?: string; // Optional: ID of the quiz associated with this lesson
}

export const lessons: Lesson[] = [
  {
    id: '1',
    title: '花札入門',
    description: '了解花札的歷史以及「こいこい」(Koi-Koi) 的基本規則。',
    estimatedTime: '10 分鐘',
    contentBlocks: [
      { type: 'heading', value: '什麼是花札？' },
      { type: 'text', value: '花札（Hanafuda）是日本的紙牌遊戲。它們比西方的撲克牌小，並擁有一套基於一年中月份的獨特設計系統，每個月份都由一種花卉或植物代表。' },
      { type: 'subheading', value: '牌的花色（月份）' },
      { type: 'text', value: '共有12種花色，代表12個月份。每種花色有4張牌（某些變體中，11月有4張加1張特殊牌，12月有3張加1張特殊牌，但こいこい通常為4張）。' },
      { type: 'list', value: [
          '一月：松 (Matsu)',
          '二月：梅 (Ume)',
          '三月：櫻 (Sakura)',
          '...以此類推，共12個月。'
        ]
      },
      { type: 'heading', value: '「こいこい」(Koi-Koi) 遊戲' },
      { type: 'text', value: '「こいこい」(Koi-Koi) 是一種使用花札進行的熱門紙牌遊戲。目標是組成稱為「役」(yaku) 的特殊牌組以獲得分數。' },
      { type: 'video', value: 'https://www.youtube.com/embed/exampleVideoId1' }, // Placeholder video
    ],
    quizId: 'quiz1',
  },
  {
    id: '2',
    title: '理解牌的種類與役',
    description: '深入了解不同種類的牌（光牌、種牌、短冊牌、粕牌）以及常見的役（計分牌組）。',
    estimatedTime: '20 分鐘',
    contentBlocks: [
      { type: 'heading', value: '牌的類別' },
      { type: 'text', value: '在こいこい中，花札大致可分為以下幾類。以下是各類牌的介紹：' },
      { type: 'subheading', value: '光牌 (Hikari - 光札)' },
      { type: 'text', value: '光牌是價值20點的牌，通常描繪引人注目的風景或強大的符號，是遊戲中分數最高的牌。例如「松上鶴」或「櫻上幕」。' },
      { type: 'subheading', value: '種牌 (Tane - 種札)' },
      { type: 'text', value: '種牌，或稱動物牌，價值10點。它們通常以動物（如山豬、鹿、蝴蝶）或鳥類（如鶯、雁、杜鵑）為特色。這些牌對於組成特定的「役」至關重要。' },
      { type: 'subheading', value: '短冊牌 (Tanzaku - 短冊札)' },
      { type: 'text', value: '短冊牌價值5點，牌面上有長條形的詩箋。短冊分為三種類型：紅色帶字（例如松、梅、櫻的短冊）、紅色無字（「青短」用的藍色/紫色短冊），以及其他不帶字的短冊。' },
      { type: 'subheading', value: '粕牌 (Kasu - カス札)' },
      { type: 'text', value: '粕牌，或稱素牌，每張價值1點。它們是數量最多的牌，通常只描繪月份的植物。雖然單張價值不高，但收集足夠數量可以組成「集粕」役。' },
      { type: 'heading', value: '常見的役（計分牌組）' },
      { type: 'text', value: '湊成役是獲勝的關鍵。以下是一些基本的役：' },
      { type: 'subheading', value: '五光 (Gokō)' },
      { type: 'text', value: '收集全部五張光牌（松上鶴、櫻上幕、芒上月、柳間小野道風、桐上鳳凰）。這是遊戲中分數最高的役之一。' },
      { type: 'subheading', value: '四光 (Shikō)' },
      { type: 'text', value: '收集五張光牌中的任意四張。如果包含柳間小野道風（雨四光），則分數較低。不含柳間小野道風的四光分數較高。' },
      { type: 'subheading', value: '豬鹿蝶 (Ino-Shika-Chō)' },
      { type: 'text', value: '收集代表山豬（萩間豬）、鹿（紅葉間鹿）和蝴蝶（牡丹間蝶）的三張種牌。' },
      { type: 'subheading', value: '赤短 (Akatan - 赤短・詩箋)' },
      { type: 'text', value: '收集所有三張帶有日文詩句的紅色短冊牌（松、梅、櫻的短冊）。' },
      { type: 'text', value: '我們將在進階課程中介紹更多役。' },
    ],
    quizId: 'quiz2',
  },
  {
    id: '3',
    title: '如何玩「こいこい」：遊戲流程',
    description: '從發牌到計分，「こいこい」遊戲的逐步指南。',
    estimatedTime: '25 分鐘',
    contentBlocks: [
      { type: 'heading', value: '遊戲準備' },
      { type: 'text', value: '兩位玩家。決定莊家（親，oya）。每位玩家發8張牌，場上發8張面朝上的牌。剩下的牌形成牌堆。'},
      { type: 'subheading', value: '玩家回合' },
      { type: 'ordered-list', value: [
          '從手中打出一張牌：嘗試與場上同月份的牌配對。如果配對成功，則取走兩張牌。如果沒有配對，則將選擇的牌棄到場上。',
          '從牌堆抽一張牌：翻開牌堆頂部的牌。嘗試與場上的牌配對。如果配對成功，則取走兩張牌。如果沒有配對，則將其加入場上。',
          '檢查是否有役：取牌後，檢查是否湊成了任何役。',
          '喊「こいこい」(Koi-Koi) 或「勝負」(Shōbu)：如果湊成了役，您可以選擇喊「こいこい」（繼續本回合以嘗試獲得更多分數/更高役）或「勝負」（停止本回合並計算您的分數）。',
        ]
      },
      { type: 'heading', value: '計分與獲勝' },
      { type: 'text', value: '根據湊成的役來計分。遊戲通常進行固定回合數，或直到某位玩家達到目標分數為止。' },
    ],
    quizId: 'quiz3',
  },
  {
    id: '4',
    title: '深入役種詳解',
    description: '學習更多特殊役種以及種牌、短冊牌、滓牌的詳細計分方式。',
    estimatedTime: '15 分鐘',
    contentBlocks: [
      { type: 'heading', value: '特殊開局役種' },
      { type: 'subheading', value: '手四 (Teshi - てし)' },
      { type: 'text', value: '開局時，如果玩家手中有四張相同月份的牌，則該玩家立即獲勝，獲得 6 分。此回合直接結束。（部分規則中，如果這四張牌是同一月份的四張粕牌，則不算手四）' },
      { type: 'subheading', value: '喰付 (Kuttsuki - くっつき)' },
      { type: 'text', value: '開局時，如果場上的八張牌中，有四組（即全部八張牌）都是兩兩相同月份的牌，則此局無效，重新洗牌發牌（稱為「流局」）。部分規則中起始玩家可能因此獲得點數，但通常是流局。' },
      { type: 'heading', value: '計數型役種詳解' },
      { type: 'subheading', value: '種牌 (Tane - タネ)' },
      { type: 'text', value: '除了「豬鹿蝶」(5分) 這個特定組合外，收集任意五張種牌即可得 1 分。之後每多收集一張種牌，額外再加 1 分。例如，收集六張種牌得 2 分，七張得 3 分，以此類推。「菊上盃」雖然是種牌，但在計算花見酒、月見酒時有特殊作用，同時也計為一張種牌。' },
      { type: 'subheading', value: '短冊牌 (Tanzaku - 短冊)' },
      { type: 'text', value: '除了「赤短」(5分) 和「青短」(5分) 這兩個特定組合外，收集任意五張短冊牌即可得 1 分。之後每多收集一張短冊牌，額外再加 1 分。例如，收集六張短冊牌得 2 分。如果同時湊齊「赤短」和另外兩張普通短冊，則是「赤短」5 分 + 普通短冊的 1 分（因為總共五張），總共 6 分。' },
      { type: 'list', value: [
          '七短 (Shichi-Tan): 雖然「こいこい」中不常將七短視為獨立的高分役，但如果收集到七張短冊牌，按照「五張短冊1分，之後每多一張加1分」的規則，應為 1 + (7-5) = 3 分。如果這七張中包含赤短或青短，則其分數另外計算並疊加。',
        ]
      },
      { type: 'subheading', value: '滓牌 (Kasu - カス)' },
      { type: 'text', value: '收集任意十張滓牌即可得 1 分。之後每多收集一張滓牌，額外再加 1 分。例如，收集十一張滓牌得 2 分。' },
      { type: 'heading', value: '光牌役的細節補充' },
      { type: 'text', value: '光牌役（五光、四光、雨四光、三光）的點數是固定的，不因多收集光牌而增加。例如，湊齊「三光」後再多拿一張非雨的光牌，會變成「四光」，而不是「三光」點數增加。它們之間是互斥的，只會計算分數最高的那個（例如，湊齊五光，就不再另外計算四光或三光）。' },
      { type: 'subheading', value: '花見酒與月見酒' },
      { type: 'text', value: '「花見酒」（櫻上幕簾 + 菊上盃）和「月見酒」（芒上月 + 菊上盃）都是 5 分的役。如果同時湊齊櫻上幕簾、芒上月和菊上盃，則兩個役都成立，總共 5 + 5 = 10 分。' },
    ],
    quizId: 'quiz4',
  },
  {
    id: '5',
    title: '計分規則與「來來」(Koi-Koi) 的時機策略',
    description: '深入探討「こいこい」的計分細節，以及何時應該喊「來來」或「勝負」。',
    estimatedTime: '20 分鐘',
    contentBlocks: [
      { type: 'heading', value: '役的點數疊加' },
      { type: 'text', value: '在一局遊戲中，如果玩家湊成了多個不同的役，通常這些役的點數是可以疊加計算的。例如，如果湊齊了「豬鹿蝶」(5分) 並且同時有10張「滓牌」(1分)，那麼總點數就是 5 + 1 = 6 分。' },
      { type: 'list', value: [
          '例外情況：某些役之間是互斥的。例如，「五光」成立時，就不再計算「四光」或「三光」的點數，只取「五光」的最高分。',
          '計數型役種（種、短冊、滓）的點數，在滿足基本張數後，每多一張額外加分，這個加分部分也會與其他役疊加。'
        ]
      },
      { type: 'heading', value: '「來來」(Koi-Koi) 的機制' },
      { type: 'text', value: '當玩家在其回合中湊成任何役時，他們面臨一個重要的選擇：喊「來來」(Koi-Koi) 繼續本回合，還是喊「勝負」(Shōbu) 結束本回合並結算當前得分。' },
      { type: 'subheading', value: '喊「來來」(Koi-Koi) 的影響' },
      { type: 'ordered-list', value: [
          '遊戲繼續：回合不會立即結束，輪到對手行動。',
          '得分倍率增加：每喊一次「來來」，本回合最終得分的倍率會增加。通常第一次「來來」後倍率變為 x2，第二次變為 x3，以此類推。部分規則中，7分以上的役直接以更高倍率開始。',
          '目標更高：喊「來來」的目的是希望能湊成更高價值的役，或者疊加更多役來獲得更高的基礎分數，然後再乘以倍率。'
        ]
      },
      { type: 'subheading', value: '「來來損」(Koi-Koi Bust) - 喊了「來來」後的風險' },
      { type: 'text', value: '如果玩家喊了「來來」之後：' },
      { type: 'list', value: [
          '在其後續的回合中，未能湊成任何新的役，或者未能使現有的計數型役（種、短冊、滓）的點數增加。',
          '並且對手也沒有喊「勝負」結束回合。',
          '直到雙方手牌用罄，牌局自然結束。',
          '在這種情況下，該玩家在本回合喊「來來」時所形成的役將不被計分（即所謂的「來來損」）。但如果對手在此期間湊成役並喊「勝負」，則對手正常計分。'
        ]
      },
      { type: 'heading', value: '「來來」或「勝負」的策略考量' },
      { type: 'text', value: '決定何時喊「來來」是「こいこい」中最具策略性的部分之一。需要考慮：' },
      { type: 'list', value: [
          '當前役的點數：如果點數很低（例如1-2分），通常會喊「來來」嘗試獲得更高分。',
          '潛力：手牌和場牌是否還有潛力湊成更高價值的役？',
          '對手的狀態：對手已捕獲的牌是否接近完成大役？如果對手威脅很大，及早「勝負」可能是明智的。',
          '牌堆剩餘牌量：如果牌堆所剩無幾，喊「來來」的風險較高，因為湊新役的機會變小。',
          '當前總比分：如果自己大比分領先，可能選擇穩妥「勝負」；如果落後，則可能需要冒險喊「來來」。',
          '7分役的特殊規則：部分規則中，如果一次湊成的役達到7分或以上，則得分會自動翻倍，無需喊「來來」。玩家仍可選擇「來來」追求更高倍率。'
        ]
      },
      { type: 'text', value: '精通「來來」的時機是成為「こいこい」高手的關鍵。' }
    ],
    quizId: 'quiz5',
  },
  {
    id: '6',
    title: '基礎出牌與防守策略',
    description: '學習如何在輪到自己時做出更明智的出牌選擇，以及如何觀察場面和對手的捕獲牌，進行初步的防守。',
    estimatedTime: '20 分鐘',
    contentBlocks: [
      { type: 'heading', value: '出牌的優先順序' },
      { type: 'text', value: '輪到您出牌時，仔細觀察您的手牌和場上的牌。一般來說，您可以按照以下優先順序來考慮配對：' },
      { type: 'ordered-list', value: [
          '完成自己的役：如果您打出一張牌能立即湊成一個役（或使一個計數型役的點數增加），這通常是最佳選擇。',
          '捕獲高價值牌：光牌和種牌是高價值的牌，即使它們不能立即完成一個役，捕獲它們也能為將來湊役打下基礎，或增加計數型役的張數。',
          '阻止對手成役：觀察對手已經捕獲的牌。如果您能判斷出對手可能正在湊什麼役，並且您手中有能與場上某張對手需要的關鍵牌配對的牌，可以考慮優先打出這張牌來「截胡」。',
          '捕獲普通牌：如果以上情況都不適用，則選擇捕獲任意可配對的牌。'
        ]
      },
      { type: 'heading', value: '手牌選擇策略' },
      { type: 'subheading', value: '手中有多張同月份牌' },
      { type: 'text', value: '如果您手中有兩張或更多相同月份的牌，而場上也有該月份的牌可以配對，您需要決定打出哪一張。考慮以下因素：' },
      { type: 'list', value: [
          '哪張牌的價值較低？通常優先打出價值較低的牌（例如，如果您手中有松光牌和松短冊，而場上有松滓牌，您可以打出松短冊來配對松滓牌，保留價值更高的松光牌）。',
          '哪張牌更不容易被對手利用？如果您打出一張牌後，剩下的手牌或場牌可能給對手送分，請謹慎選擇。'
        ]
      },
      { type: 'subheading', value: '無牌可配對時的棄牌策略' },
      { type: 'text', value: '如果您手中的牌都無法與場上的任何牌配對，您必須選擇一張牌棄到場上。此時的策略是：' },
      { type: 'list', value: [
          '棄掉對自己最沒用的牌：例如，如果您離湊齊某個役還差很遠，而手中的某張牌對該役完全無用，可以優先棄掉它。',
          '避免給對手送大禮：盡量不要棄掉可能會讓對手立即湊成高分役的牌。觀察對手已捕獲的牌，避免棄掉他們可能需要的關鍵月份的牌，尤其是高價值牌。',
          '棄掉月份較「冷門」的牌：如果某個月份的牌大部分已經出現，棄掉該月份的剩餘牌張可能相對安全。'
        ]
      },
      { type: 'heading', value: '觀察與防守' },
      { type: 'text', value: '「こいこい」不僅僅是湊自己的役，有效地防守和干擾對手也同樣重要。' },
      { type: 'list', value: [
          '記住關鍵牌：熟悉哪些牌是組成高分役的關鍵，例如五光、豬鹿蝶、赤短、青短的組成牌。',
          '追蹤對手捕獲的牌：時刻留意對手捕獲了哪些牌。如果他們已經拿到某個役的兩張關鍵牌，您就需要特別小心，避免打出他們需要的第三張。',
          '推測對手意圖：根據對手捕獲的牌的類型（光牌多？短冊多？特定月份的牌多？），嘗試推測他們可能在湊什麼役。',
          '必要時進行拆散：如果您手中有牌可以捕獲場上一張對手極度需要的牌（即使這張牌對您自己當前的役幫助不大），有時也值得出手以阻止對手。'
        ]
      },
    ],
    quizId: 'quiz6',
  },
  {
    id: '7',
    title: '花札的文化與禮儀',
    description: '簡要介紹花札的歷史淵源、不同牌面圖案的文化意義，以及在日本玩花札時一些不成文的禮儀或習慣。',
    estimatedTime: '10 分鐘',
    contentBlocks: [
      { type: 'heading', value: '花札的起源' },
      { type: 'text', value: '花札的歷史可以追溯到16世紀，當時葡萄牙商人將遊戲牌傳入日本。由於日本政府多次禁止賭博和外國紙牌，牌的設計和玩法不斷演變，最終形成了現在我們所知的花札。' },
      { type: 'subheading', value: '月份與花卉的象徵' },
      { type: 'text', value: '花札的每一張牌都與一年中的一個月份相關聯，並以該月份代表性的花卉或植物為圖案。這些圖案不僅美觀，也蘊含著豐富的文化意義和季節感。例如：' },
      { type: 'list', value: [
          '一月「松」：象徵長壽、堅韌和新年。松上的鶴則代表吉祥和長壽。',
          '二月「梅」：象徵初春、高潔和堅忍不拔。梅上的鶯是報春的鳥。',
          '三月「櫻」：日本最具代表性的花卉，象徵美麗、短暫和武士精神。櫻下幕簾常與賞花宴有關。',
          '八月「芒」：中秋時節的植物，月亮是常見的搭配，象徵秋收和團圓。',
          '十二月「桐」：傳說中鳳凰只棲息在梧桐樹上，因此桐與鳳凰常一起出現，象徵吉祥尊貴。'
        ]
      },
      { type: 'heading', value: '遊戲術語簡介' },
      { type: 'text', value: '了解一些基本術語能幫助您更好地融入遊戲：' },
      { type: 'list', value: [
          '親 (Oya)：起始玩家，通常也負責發牌。',
          '子 (Ko)：非起始玩家。',
          '手札 (Tefuda)：手中的牌。',
          '場札 (Ba-fuda)：場上公開的牌。',
          '山札 (Yama-fuda)：牌堆。',
          '役 (Yaku)：計分的牌型組合。',
          'こいこい (Koi-Koi)：湊成役後選擇繼續遊戲的喊話。',
          'しょーぶ (Shōbu)：湊成役後選擇結束回合並計分的喊話。'
        ]
      },
      { type: 'subheading', value: '遊戲禮儀 (非強制性)' },
      { type: 'text', value: '在傳統或較正式的場合，玩花札可能有一些不成文的禮儀：' },
      { type: 'list', value: [
          '保持桌面整潔。',
          '出牌和取牌動作清晰。',
          '避免過度思考或拖延時間。',
          '尊重對手，勝不驕敗不餒。'
        ]
      },
      { type: 'text', value: '花札不僅是一種遊戲，也是體驗日本文化和美學的一種方式。' }
    ],
    // quizId: 'quiz7' // 此課程暫無測驗
  }
];

export function getLessonById(id: string): Lesson | undefined {
  return lessons.find(lesson => lesson.id === id);
}

export function getAllLessons(): Lesson[] {
  return lessons;
}
