
export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  hint: string;
  explanation: string; // Explanation for the correct answer
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  questions: Question[];
}

export const quizzes: Quiz[] = [
  {
    id: 'quiz1',
    lessonId: '1',
    title: '花札入門測驗',
    questions: [
      {
        id: 'q1_1',
        text: '「花札」翻譯成中文是什麼意思？',
        options: ['動物牌', '花牌', '月亮牌', '詩歌牌'],
        correctAnswerIndex: 1,
        hint: '想想牌上的主要設計元素。',
        explanation: '「花札」(Hanafuda) 字面意思是「花牌」，反映了它們的花卉圖案。'
      },
      {
        id: 'q1_2',
        text: '用於「こいこい」的花札牌組通常有多少種花色（月份）？',
        options: ['10', '12', '14', '16'],
        correctAnswerIndex: 1,
        hint: '它對應一年中的月份數量。',
        explanation: '一副花札有12種花色，每種代表一年中的一個月份。'
      },
      {
        id: 'q1_3',
        text: '「こいこい」遊戲的主要目標是什麼？',
        options: ['收集最多的牌', '配對顏色', '湊成「役」（計分牌組）', '先出完手中的所有牌'],
        correctAnswerIndex: 2,
        hint: '它涉及創建特定的牌組。',
        explanation: '「こいこい」的主要目標是湊成「役」，即特殊的計分牌組。'
      },
    ],
  },
  {
    id: 'quiz2',
    lessonId: '2',
    title: '牌的種類與役測驗',
    questions: [
      {
        id: 'q2_1',
        text: '哪種類別的牌通常單張分數最高？',
        options: ['粕牌/素牌 (Kasu)', '短冊牌 (Tanzaku)', '種牌 (Tane)', '光牌 (Hikari)'],
        correctAnswerIndex: 3,
        hint: '這些牌通常描繪重要的風景。',
        explanation: '光牌 (Hikari) 通常每張價值20點，是單張分數最高的牌。'
      },
      {
        id: 'q2_2',
        text: '「豬鹿蝶」(Ino-Shika-Chō) 是指什麼？',
        options: ['一組特定的三張光牌', '一組特定的三張種牌（山豬、鹿、蝴蝶）', '收集所有短冊牌', '一種粕牌'],
        correctAnswerIndex: 1,
        hint: '這個名字本身就暗示了涉及的動物。',
        explanation: '「豬鹿蝶」是通過收集山豬、鹿和蝴蝶這三張種牌而形成的役。'
      },
      {
        id: 'q2_3',
        text: '「粕」(Kasu) 牌（粕牌/素牌）通常每張值多少點？',
        options: ['0 點', '1 點', '5 點', '10 點'],
        correctAnswerIndex: 1,
        hint: '它們是最常見的牌種類型。',
        explanation: '粕牌 (Kasu) 通常每張值1點，用於湊成某些役的張數，例如「集粕」役（10張粕牌）。'
      },
    ],
  },
  {
    id: 'quiz3',
    lessonId: '3',
    title: '「こいこい」遊戲流程測驗',
    questions: [
      {
        id: 'q3_1',
        text: '在「こいこい」遊戲開始時，每位玩家和場上各發多少張牌？',
        options: ['玩家6張，場上6張', '玩家8張，場上8張', '玩家10張，場上10張', '玩家7張，場上7張'],
        correctAnswerIndex: 1,
        hint: '兩者數量相同。',
        explanation: '在「こいこい」中，每位玩家發8張牌，場上也發8張面朝上的牌。'
      },
      {
        id: 'q3_2',
        text: '如果玩家湊成了役，他們有哪些選擇？',
        options: ['必須結束該回合並計分', '可以喊「こいこい」（繼續）或「勝負」（停止並計分）', '必須棄掉該役', '必須再抽兩張牌'],
        correctAnswerIndex: 1,
        hint: '「こいこい」這個詞本身就是其中一個選項。',
        explanation: '湊成役後，玩家可以選擇喊「こいこい」以繼續該回合爭取更多分數，或喊「勝負」結束該回合並獲得當前分數。'
      },
    ],
  },
  {
    id: 'quiz4',
    lessonId: '4',
    title: '深入役種詳解測驗',
    questions: [
      {
        id: 'q4_1',
        text: '開局手牌有四張相同月份的牌，稱為什麼役？',
        options: ['豬鹿蝶', '手四', '五光', '喰付'],
        correctAnswerIndex: 1,
        hint: '這個役與開局的手牌直接相關。',
        explanation: '開局手牌有四張相同月份的牌稱為「手四」(Teshi)。'
      },
      {
        id: 'q4_2',
        text: '收集任意五張「種牌」(Tane) 可以得到幾分？',
        options: ['1 分', '3 分', '5 分', '不算役'],
        correctAnswerIndex: 0,
        hint: '這是計數型役種的基本分數。',
        explanation: '收集任意五張種牌即可得 1 分。之後每多收集一張種牌，額外再加 1 分。'
      }
    ],
  },
  {
    id: 'quiz5',
    lessonId: '5',
    title: '計分與「來來」策略測驗',
    questions: [
      {
        id: 'q5_1',
        text: '如果玩家喊了「來來」(Koi-Koi) 後，在本回合剩餘時間內未能湊成任何新的役或提升原有役的點數，並且牌局自然結束，會發生什麼情況？',
        options: [
          '玩家獲得喊「來來」時役的點數',
          '玩家獲得喊「來來」時役的點數並乘以倍率',
          '玩家本回合無法透過該役得分（來來損）',
          '對手直接獲勝'
        ],
        correctAnswerIndex: 2,
        hint: '這是喊「來來」的主要風險之一。',
        explanation: '如果玩家喊了「來來」後，直到回合結束都未能湊成新的役或提升原有役的點數，則該玩家在本回合無法透過之前宣告的役得分，這稱為「來來損」。'
      },
    ]
  },
  {
    id: 'quiz6',
    lessonId: '6',
    title: '基礎出牌與防守策略測驗',
    questions: [
      {
        id: 'q6_1',
        text: '當手中有多張同月份的牌可以與場牌配對時，通常應優先打出哪張？',
        options: ['價值最高的牌', '價值最低的牌', '隨機一張', '不打出，等待更好機會'],
        correctAnswerIndex: 1,
        hint: '考慮保留更有價值的牌以湊成更大的役。',
        explanation: '通常優先打出價值較低的牌來進行配對，這樣可以保留手中價值更高的牌，以便將來湊成更高分的役。'
      },
    ],
  }
];

export function getQuizById(id: string): Quiz | undefined {
  return quizzes.find(quiz => quiz.id === id);
}

export function getQuizByLessonId(lessonId: string): Quiz | undefined {
  return quizzes.find(quiz => quiz.lessonId === lessonId);
}
