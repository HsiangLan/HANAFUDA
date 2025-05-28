
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Crown, Lightbulb, Target, Play, Shuffle, Archive, CheckCircle, AlertTriangle, User, Bot, ChevronsUpDown, Brain, Trophy, ListChecks, History, BarChart3, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { koiKoiAiOpponentFlow, type AiKoiKoiInput, type AiKoiKoiOutput, type AiYakuInfo } from '@/ai/flows/koi-koi-ai-opponent-flow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { getGlobalLeaderboard, updateUserGlobalScore, type GlobalLeaderboardEntry } from '@/lib/leaderboard';


export interface PlayableCard {
  id: string;
  name: string;
  image: string;
  monthDisplay: string;
  monthValue: number;
  typeDisplay: string;
  cardType: 'hikari' | 'tane' | 'tanzaku-red-poem' | 'tanzaku-blue-poem' | 'tanzaku-plain' | 'kasu' | 'special-sake';
  pointsValue: number; 
  aiHint: string;
  sortOrder: number;
}

export interface YakuDefinition {
  id: string;
  name: string;
  description: string;
  points: number; 
  isTeshi?: boolean;
  isOyaKen?: boolean;
  requiredCardNames?: string[];
  customChecker?: (capturedCards: PlayableCard[], yakuDef: YakuDefinition, allCards: PlayableCard[]) => { achieved: boolean, points: number, contributingCards?: PlayableCard[] };
}

const brightCardNames = ["松上鶴", "櫻上幕簾", "芒上月", "柳間小野道風", "桐上鳳凰"];
const rainManCardName = "柳間小野道風";
const sakeCupCardName = "菊上杯";

// Custom Checkers for Yaku
const checkSanko: YakuDefinition['customChecker'] = (captured) => {
  const capturedBrightNonRainMan = captured.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName && c.cardType === 'hikari');
  const achieved = capturedBrightNonRainMan.length >= 3;
  return { achieved, points: achieved ? 5 : 0, contributingCards: achieved ? capturedBrightNonRainMan.slice(0,3) : [] };
};
const checkShiko: YakuDefinition['customChecker'] = (captured) => {
  const capturedBrightNonRainMan = captured.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName && c.cardType === 'hikari');
  const achieved = capturedBrightNonRainMan.length >= 4;
  return { achieved, points: achieved ? 8 : 0, contributingCards: achieved ? capturedBrightNonRainMan.slice(0,4) : [] };
};
const checkAmeShiko: YakuDefinition['customChecker'] = (captured) => {
  const capturedBright = captured.filter(c => brightCardNames.includes(c.name) && c.cardType === 'hikari');
  const hasRainMan = capturedBright.some(c => c.name === rainManCardName);
  const achieved = capturedBright.length >= 4 && hasRainMan;
  return { achieved, points: achieved ? 7 : 0, contributingCards: achieved ? capturedBright.filter(c => c.cardType === 'hikari') : [] };
};
const checkGoko: YakuDefinition['customChecker'] = (captured) => {
  const achieved = brightCardNames.every(bcn => captured.some(cc => cc.name === bcn && cc.cardType === 'hikari'));
  return { achieved, points: achieved ? 10 : 0, contributingCards: achieved ? captured.filter(c => brightCardNames.includes(c.name) && cc.cardType === 'hikari') : [] };
};
const checkHanamiZake: YakuDefinition['customChecker'] = (captured) => {
  const hasSakuraCurtain = captured.some(c => c.name === "櫻上幕簾" && c.cardType === 'hikari');
  const hasSakeCup = captured.some(c => c.name === sakeCupCardName && (c.cardType === 'special-sake' || c.cardType === 'tane'));
  const achieved = hasSakuraCurtain && hasSakeCup;
  return { achieved, points: achieved ? 5 : 0, contributingCards: achieved ? captured.filter(c => c.name === "櫻上幕簾" || c.name === sakeCupCardName) : [] };
};
const checkTsukimiZake: YakuDefinition['customChecker'] = (captured) => {
  const hasMoon = captured.some(c => c.name === "芒上月" && c.cardType === 'hikari');
  const hasSakeCup = captured.some(c => c.name === sakeCupCardName && (c.cardType === 'special-sake' || c.cardType === 'tane'));
  const achieved = hasMoon && hasSakeCup;
  return { achieved, points: achieved ? 5 : 0, contributingCards: achieved ? captured.filter(c => c.name === "芒上月" || c.name === sakeCupCardName) : [] };
};
const checkTaneYaku: YakuDefinition['customChecker'] = (captured) => {
  const taneCards = captured.filter(c => c.cardType === 'tane' || c.cardType === 'special-sake');
  if (taneCards.length >= 5) {
    const points = 1 + (taneCards.length - 5);
    return { achieved: true, points, contributingCards: taneCards };
  }
  return { achieved: false, points: 0 };
};
const checkTanzakuYaku: YakuDefinition['customChecker'] = (captured) => {
  const tanzakuCards = captured.filter(c => c.cardType === 'tanzaku-red-poem' || c.cardType === 'tanzaku-blue-poem' || c.cardType === 'tanzaku-plain');
  if (tanzakuCards.length >= 5) {
    const points = 1 + (tanzakuCards.length - 5);
    return { achieved: true, points, contributingCards: tanzakuCards };
  }
  return { achieved: false, points: 0 };
};
const checkKasu: YakuDefinition['customChecker'] = (captured) => {
  const kasuCards = captured.filter(c => c.cardType === 'kasu');
  // console.log('[Kasu Check] Captured Kasu Cards:', kasuCards.map(c => c.name), 'Count:', kasuCards.length);
  if (kasuCards.length >= 10) {
    const points = 1 + (kasuCards.length - 10);
    // console.log(`[Kasu Check] Achieved! Points: ${points}`);
    return { achieved: true, points, contributingCards: kasuCards };
  }
  return { achieved: false, points: 0 };
};

// Yaku Definitions
const yakuList: YakuDefinition[] = [
  { id: 'goko', name: '五光 (Gokō)', description: '收集全部五張光牌。', points: 10, customChecker: checkGoko },
  { id: 'shiko', name: '四光 (Shikō)', description: '收集四張光牌（不含柳間小野道風「雨中人」）。', points: 8, customChecker: checkShiko },
  { id: 'ameshiko', name: '雨四光 (Ame-Shikō)', description: '收集四張光牌，且必須包含柳間小野道風「雨中人」。', points: 7, customChecker: checkAmeShiko },
  { id: 'sanko', name: '三光 (Sankō)', description: '收集三張光牌（不含柳間小野道風「雨中人」）。', points: 5, customChecker: checkSanko },
  { id: 'inoshikacho', name: '豬鹿蝶 (Ino-Shika-Chō)', description: '收集代表山豬（荻間豬）、鹿（楓間鹿）和蝴蝶（牡丹上蝶）的三張種牌。', requiredCardNames: ['荻間豬', '楓間鹿', '牡丹上蝶'], points: 5 },
  { id: 'akatan', name: '赤短 (Akatan)', description: '收集所有三張紅色有詩句的短冊牌。', requiredCardNames: ['松上赤短', '梅上赤短', '櫻上赤短'], points: 5 },
  { id: 'aotan', name: '青短 (Aotan)', description: '收集所有三張藍色(紫色)詩句的短冊牌。', requiredCardNames: ['牡丹上青短', '菊上青短', '楓間青短'], points: 5 },
  { id: 'hanami', name: '花見酒 (Hanami-zake)', description: '收集「櫻上幕簾」和「菊上杯」兩張牌。', points: 5, customChecker: checkHanamiZake },
  { id: 'tsukimi', name: '月見酒 (Tsukimi-zake)', description: '收集「芒上月」和「菊上杯」兩張牌。', points: 5, customChecker: checkTsukimiZake },
  { id: 'teshi', name: '手四 (Teshi)', description: '開局手牌有四張相同月份的牌。', points: 6, isTeshi: true },
  { id: 'oyaken', name: '親權 (Oya-ken)', description: '雙方手牌用罄且無人成役時，起始玩家得分。', points: 6, isOyaKen: true },
  { id: 'tane', name: '種 (Tane)', description: '收集任意五張種牌，多一張加1分。', points: 1, customChecker: checkTaneYaku },
  { id: 'tanzaku', name: '短冊 (Tanzaku)', description: '收集任意五張短冊牌，多一張加1分。', points: 1, customChecker: checkTanzakuYaku },
  { id: 'kasu', name: '滓 (Kasu)', description: '收集任意十張滓牌，多一張加1分。', points: 1, customChecker: checkKasu },
].sort((a, b) => b.points - a.points); 

// Generate Full Deck
const generateFullDeck = (): PlayableCard[] => {
  const deck: PlayableCard[] = [];
  const months = [
    { value: 1, name: "一月", display: "松", types: ["光", "短冊", "滓", "滓"], names: ["松上鶴", "松上赤短", "松雜牌1", "松雜牌2"], images: ["松上鶴.jpeg", "松上赤短.jpeg", "松雜牌1.jpeg", "松雜牌2.jpeg"], cardTypes: ["hikari", "tanzaku-red-poem", "kasu", "kasu"], points: [20,5,1,1], aiHints: ["crane sun", "pine ribbon", "pine kasu", "pine kasu"] },
    { value: 2, name: "二月", display: "梅", types: ["種", "短冊", "滓", "滓"], names: ["梅上鶯", "梅上赤短", "梅雜牌1", "梅雜牌2"], images: ["梅上鶯.jpeg", "梅上赤短.jpeg", "梅雜牌1.jpeg", "梅雜牌2.jpeg"], cardTypes: ["tane", "tanzaku-red-poem", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["bush warbler", "plum ribbon", "plum kasu", "plum kasu"] },
    { value: 3, name: "三月", display: "櫻", types: ["光", "短冊", "滓", "滓"], names: ["櫻上幕簾", "櫻上赤短", "櫻雜牌1", "櫻雜牌2"], images: ["櫻上幕簾.jpeg", "櫻上赤短.jpeg", "櫻雜牌1.jpeg", "櫻雜牌2.jpeg"], cardTypes: ["hikari", "tanzaku-red-poem", "kasu", "kasu"], points: [20,5,1,1], aiHints: ["cherry curtain", "cherry ribbon", "cherry kasu", "cherry kasu"] },
    { value: 4, name: "四月", display: "藤", types: ["種", "短冊", "滓", "滓"], names: ["藤上杜鵑", "藤上短冊", "藤雜牌1", "藤雜牌2"], images: ["藤上杜鵑.jpeg", "藤上短冊.jpeg", "藤雜牌1.jpeg", "藤雜牌2.jpeg"], cardTypes: ["tane", "tanzaku-plain", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["cuckoo wisteria", "wisteria ribbon", "wisteria kasu", "wisteria kasu"] },
    { value: 5, name: "五月", display: "菖蒲", types: ["種", "短冊", "滓", "滓"], names: ["菖蒲上八橋", "菖蒲上短冊", "菖蒲雜牌1", "菖蒲雜牌2"], images: ["菖蒲上八橋.jpeg", "菖蒲上短冊.jpeg", "菖蒲雜牌1.jpeg", "菖蒲雜牌2.jpeg"], cardTypes: ["tane", "tanzaku-plain", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["iris bridge", "iris ribbon", "iris kasu", "iris kasu"] },
    { value: 6, name: "六月", display: "牡丹", types: ["種", "短冊", "滓", "滓"], names: ["牡丹上蝶", "牡丹上青短", "牡丹雜牌1", "牡丹雜牌2"], images: ["牡丹上蝶.jpeg", "牡丹上青短.jpeg", "牡丹雜牌1.jpeg", "牡丹雜牌2.jpeg"], cardTypes: ["tane", "tanzaku-blue-poem", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["peony butterflies", "peony ribbon", "peony kasu", "peony kasu"] },
    { value: 7, name: "七月", display: "荻", types: ["種", "短冊", "滓", "滓"], names: ["荻間豬", "荻上短冊", "荻雜牌1", "荻雜牌2"], images: ["荻間豬.jpeg", "荻上短冊.jpeg", "荻雜牌1.jpeg", "荻雜牌2.jpeg"], cardTypes: ["tane", "tanzaku-plain", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["boar clover", "clover ribbon", "clover kasu", "clover kasu"] },
    { value: 8, name: "八月", display: "芒", types: ["光", "種", "滓", "滓"], names: ["芒上月", "芒上雁", "芒雜牌1", "芒雜牌2"], images: ["芒上月.jpeg", "芒上雁.jpeg", "芒雜牌1.jpeg", "芒雜牌2.jpeg"], cardTypes: ["hikari", "tane", "kasu", "kasu"], points: [20,10,1,1], aiHints: ["moon pampas", "geese pampas", "pampas kasu", "pampas kasu"] },
    { value: 9, name: "九月", display: "菊", types: ["種", "短冊", "滓", "滓"], names: ["菊上杯", "菊上青短", "菊雜牌1", "菊雜牌2"], images: ["菊上杯.jpeg", "菊上青短.jpeg", "菊雜牌1.jpeg", "菊雜牌2.jpeg"], cardTypes: ["special-sake", "tanzaku-blue-poem", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["sake cup", "chrysanthemum ribbon", "chrysanthemum kasu", "chrysanthemum kasu"] },
    { value: 10, name: "十月", display: "楓", types: ["種", "短冊", "滓", "滓"], names: ["楓間鹿", "楓間青短", "楓雜牌1", "楓雜牌2"], images: ["楓間鹿.jpeg", "楓間青短.jpeg", "楓雜牌1.jpeg", "楓雜牌2.jpeg"], cardTypes: ["tane", "tanzaku-blue-poem", "kasu", "kasu"], points: [10,5,1,1], aiHints: ["deer maple", "maple ribbon", "maple kasu", "maple kasu"] },
    { value: 11, name: "十一月", display: "柳", types: ["光", "種", "短冊", "滓"], names: ["柳間小野道風", "柳上燕", "柳間短冊", "柳雜牌"], images: ["柳間小野道風.jpeg", "柳上燕.jpeg", "柳間短冊.jpeg", "柳雜牌.jpeg"], cardTypes: ["hikari", "tane", "tanzaku-plain", "kasu"], points: [20,10,5,1], aiHints: ["rainman willow", "swallow willow", "willow ribbon", "willow kasu thunder"] },
    { value: 12, name: "十二月", display: "桐", types: ["光", "滓", "滓", "滓"], names: ["桐上鳳凰", "桐雜牌1", "桐雜牌2", "桐雜牌3"], images: ["桐上鳳凰.jpeg", "桐雜牌1.jpeg", "桐雜牌2.jpeg", "桐雜牌3.jpeg"], cardTypes: ["hikari", "kasu", "kasu", "kasu"], points: [20,1,1,1], aiHints: ["phoenix paulownia", "paulownia kasu", "paulownia kasu", "paulownia kasu"] },
  ];

  let sortOrderCounter = 1;
  months.forEach(month => {
    month.types.forEach((type, index) => {
      const cardName = month.names[index];
      const imageName = month.images[index];
      const aiHint = month.aiHints[index];
      const cardType = month.cardTypes[index] as PlayableCard['cardType'];
      deck.push({
        id: `${month.display}-${cardType}-${index + 1}-${cardName}`,
        name: cardName,
        image: `/images/hanafuda/${imageName}`,
        monthDisplay: month.name,
        monthValue: month.value,
        typeDisplay: type,
        cardType: cardType,
        pointsValue: month.points[index],
        aiHint: aiHint,
        sortOrder: sortOrderCounter++,
      });
    });
  });
  return deck;
};

const initialPlayerScore = 30;
const conceptualAiScore = 30;

type GamePhase =
  | 'NOT_STARTED'
  | 'DEALING'
  | 'PLAYER_SELECT_HAND_CARD'
  | 'PLAYER_MATCH_HAND_TO_FIELD'
  | 'PLAYER_DRAW_AND_EVAL_DECK_CARD'
  | 'PLAYER_MATCH_DECK_TO_FIELD'
  | 'PLAYER_CHECK_YAKU'
  | 'PLAYER_KOIKOI_DECISION'
  | 'AI_THINKING'
  | 'AI_ACTIONS_COMPLETE' // New phase for AI after its actions, before Yaku check
  | 'AI_CHECK_YAKU'
  | 'ROUND_OVER'
  | 'GAME_OVER';

interface AchievedYakuInfo {
  yaku: YakuDefinition;
  points: number;
  contributingCards?: PlayableCard[];
}

interface RoundSummaryData {
  winnerDisplay: string;
  roundScore: number;
  achievedYaku: { name: string; points: number; contributingCards?: PlayableCard[] }[];
}

interface FinalRoundScoreUpdate {
  playerScoreChange: number;
  nextOya: boolean;
}


export default function PlayAiPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [deck, setDeck] = useState<PlayableCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayableCard[]>([]);
  const [aiHand, setAiHand] = useState<PlayableCard[]>([]);
  const [fieldCards, setFieldCards] = useState<PlayableCard[]>([]);
  const [playerCapturedCards, setPlayerCapturedCards] = useState<PlayableCard[]>([]);
  const [aiCapturedCards, setAiCapturedCards] = useState<PlayableCard[]>([]);

  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [drawnCardForMatching, setDrawnCardForMatching] = useState<PlayableCard | null>(null);

  const [gamePhase, setGamePhase] = useState<GamePhase>('NOT_STARTED');
  const [message, setMessage] = useState("點擊「開始新局」與 AI 對戰。");
  const [isOyaPlayer, setIsOyaPlayer] = useState(true);

  const [playerScore, setPlayerScore] = useState(initialPlayerScore);
  const [roundMultiplier, setRoundMultiplier] = useState(1);

  const [playerCalledKoiKoiThisTurn, setPlayerCalledKoiKoiThisTurn] = useState(false);
  const [aiCalledKoiKoiThisTurn, setAiCalledKoiKoiThisTurn] = useState(false);
  const [playerPointsAtLastKoiKoi, setPlayerPointsAtLastKoiKoi] = useState(0);
  const [aiPointsAtLastKoiKoi, setAiPointsAtLastKoiKoi] = useState(0);

  const [significantYakuForModalDisplay, setSignificantYakuForModalDisplay] = useState<AchievedYakuInfo | null>(null);
  const [isKoiKoiModalOpen, setIsKoiKoiModalOpen] = useState(false);
  const [aiResponseForKoiKoiDecision, setAiResponseForKoiKoiDecision] = useState<AiKoiKoiOutput | null>(null);

  const [isRoundSummaryModalOpen, setIsRoundSummaryModalOpen] = useState(false);
  const [roundSummaryData, setRoundSummaryData] = useState<RoundSummaryData | null>(null);
  const [finalRoundScoreUpdate, setFinalRoundScoreUpdate] = useState<FinalRoundScoreUpdate | null>(null);
  const [oyaKenAppliedThisRound, setOyaKenAppliedThisRound] = useState(false);
  const [shobuCalledBy, setShobuCalledBy] = useState<'player' | 'ai' | null>(null);

  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);

  const roundOverProcessedRef = useRef(false);
  const { toast } = useToast();
  const fullMasterDeck = useMemo(() => generateFullDeck(), []);

  // Authentication listener
  const loadGlobalLeaderboardData = useCallback(async () => {
    setIsLoadingLeaderboard(true);
    try {
        const leaderboardData = await getGlobalLeaderboard();
        setGlobalLeaderboard(leaderboardData);
    } catch (e) {
        console.error("Failed to load leaderboard", e);
        toast({title: "錯誤", description: "無法載入排行榜。", variant: "destructive"});
    }
    setIsLoadingLeaderboard(false);
  }, [toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        loadGlobalLeaderboardData();
      } else {
        setGlobalLeaderboard([]);
        setIsLoadingLeaderboard(false);
      }
    });
    return () => unsubscribe();
  }, [loadGlobalLeaderboardData]);

  const resetFullGame = useCallback(() => {
    console.log("[Function Call] resetFullGame called");
    setPlayerScore(initialPlayerScore);
    setPlayerHand([]);
    setAiHand([]);
    setFieldCards([]);
    setDeck([]);
    setPlayerCapturedCards([]);
    setAiCapturedCards([]);
    setSelectedHandCardId(null);
    setDrawnCardForMatching(null);
    setGamePhase('NOT_STARTED');
    setMessage("遊戲已結束。點擊「開始新局」以開始一場新的對戰。");
    setIsOyaPlayer(true); 
    setRoundMultiplier(1);
    setPlayerCalledKoiKoiThisTurn(false);
    setAiCalledKoiKoiThisTurn(false);
    setPlayerPointsAtLastKoiKoi(0);
    setAiPointsAtLastKoiKoi(0);
    setSignificantYakuForModalDisplay(null);
    setIsKoiKoiModalOpen(false);
    setAiResponseForKoiKoiDecision(null);
    setIsRoundSummaryModalOpen(false);
    setRoundSummaryData(null);
    setFinalRoundScoreUpdate(null);
    setOyaKenAppliedThisRound(false);
    setShobuCalledBy(null);
    roundOverProcessedRef.current = false;
    if (currentUser) loadGlobalLeaderboardData();
  }, [currentUser, loadGlobalLeaderboardData]);


  const startGame = useCallback(() => {
    console.log("[Function Call] startGame called");
    roundOverProcessedRef.current = false;
    setOyaKenAppliedThisRound(false); // Reset for the new round
    setShobuCalledBy(null);
    setGamePhase('DEALING');
    setMessage("正在發牌...");
    const shuffled = shuffleDeck(fullMasterDeck);

    const newPlayerHand = shuffled.slice(0, 8).sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder);
    const newAiHand = shuffled.slice(8, 16).sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder);
    const newFieldCards = shuffled.slice(16, 24).sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder);
    const newDeck = shuffled.slice(24);

    setPlayerHand(newPlayerHand);
    setAiHand(newAiHand);
    setFieldCards(newFieldCards);
    setDeck(newDeck);
    setPlayerCapturedCards([]);
    setAiCapturedCards([]);
    setSelectedHandCardId(null);
    setDrawnCardForMatching(null);

    setRoundMultiplier(1);
    setPlayerCalledKoiKoiThisTurn(false);
    setAiCalledKoiKoiThisTurn(false);
    setPlayerPointsAtLastKoiKoi(0);
    setAiPointsAtLastKoiKoi(0);
    setSignificantYakuForModalDisplay(null);
    setAiResponseForKoiKoiDecision(null);
    // Do not reset roundSummaryData or finalRoundScoreUpdate here if a modal might still be open from previous round
    // setRoundSummaryData(null); 
    // setFinalRoundScoreUpdate(null); 

    const teshiYakuDef = yakuList.find(y => y.id === 'teshi');
    if (!teshiYakuDef) {
        console.error("Teshi Yaku definition not found!");
    } else {
      const teshiPoints = teshiYakuDef.points;
      if (checkForTeshi(newPlayerHand)) {
        toast({ title: "手四！", description: `玩家開局達成手四！` });
        setShobuCalledBy('player'); 
        setRoundSummaryData({ winnerDisplay: "玩家 (手四)", roundScore: teshiPoints, achievedYaku: [{ name: teshiYakuDef.name, points: teshiPoints, contributingCards: newPlayerHand.filter(c => newPlayerHand.filter(c2 => c2.monthValue === c.monthValue).length ===4).slice(0,4) }] });
        setFinalRoundScoreUpdate({ playerScoreChange: teshiPoints, nextOya: true }); 
        setGamePhase('ROUND_OVER');
        // Directly open modal for Teshi since it's an immediate round end
        roundOverProcessedRef.current = true; 
        setIsRoundSummaryModalOpen(true);
        return;
      } else if (checkForTeshi(newAiHand)) {
        toast({ title: "AI 手四！", description: `AI 開局達成手四！` });
        setShobuCalledBy('ai'); 
        setRoundSummaryData({ winnerDisplay: "AI (手四)", roundScore: teshiPoints, achievedYaku: [{ name: teshiYakuDef.name, points: teshiPoints, contributingCards: newAiHand.filter(c => newAiHand.filter(c2 => c2.monthValue === c.monthValue).length ===4).slice(0,4) }] });
        setFinalRoundScoreUpdate({ playerScoreChange: -teshiPoints, nextOya: false }); 
        setGamePhase('ROUND_OVER');
        roundOverProcessedRef.current = true;
        setIsRoundSummaryModalOpen(true);
        return;
      }
    }

    if (isOyaPlayer) {
        setGamePhase('PLAYER_SELECT_HAND_CARD');
        setMessage("您的回合，請從手中選牌。");
    } else {
        setGamePhase('AI_THINKING');
        setMessage("輪到 AI 行動...");
    }
  }, [fullMasterDeck, toast, isOyaPlayer]);

  const shuffleDeck = (deckToShuffle: PlayableCard[]): PlayableCard[] => {
    let shuffled = [...deckToShuffle];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const checkForTeshi = (hand: PlayableCard[]): boolean => {
    const monthCounts: Record<number, number> = {};
    hand.forEach(card => {
      monthCounts[card.monthValue] = (monthCounts[card.monthValue] || 0) + 1;
    });
    return Object.values(monthCounts).some(count => count === 4);
  };

  const getAllAchievedYaku = useCallback((captured: PlayableCard[]): AchievedYakuInfo[] => {
    if (captured.length === 0) return [];
    let achievedYakuResult: AchievedYakuInfo[] = [];
    const sortedYakuListForCheck = [...yakuList].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points; // Primary sort by points desc
        if (a.id === 'kasu' && b.id !== 'kasu') return 1; // kasu has lower priority than other 1 point yaku if points are same
        if (b.id === 'kasu' && a.id !== 'kasu') return -1;
        return (b.requiredCardNames?.length || 0) - (a.requiredCardNames?.length || 0); // Secondary sort by specificity (more cards req higher)
    });


    sortedYakuListForCheck.filter(y => !y.isTeshi && !y.isOyaKen).forEach(yaku => {
        // Check if a more specific version of this yaku type is already achieved
        if (yaku.id === 'sanko' && (achievedYakuResult.some(ay => ay.yaku.id === 'goko' || ay.yaku.id === 'shiko' || ay.yaku.id === 'ameshiko'))) return;
        if ((yaku.id === 'shiko' || yaku.id === 'ameshiko') && achievedYakuResult.some(ay => ay.yaku.id === 'goko')) return;

        let yakuAchieved = false;
        let currentYakuPoints = 0;
        let contributingToThisYaku: PlayableCard[] = [];

        if (yaku.customChecker) {
            const customResult = yaku.customChecker(captured, yaku, fullMasterDeck);
            if (customResult.achieved && customResult.points > 0) {
                yakuAchieved = true;
                currentYakuPoints = customResult.points;
                contributingToThisYaku = customResult.contributingCards || [];
            }
        } else if (yaku.requiredCardNames) {
            const tempContributing: PlayableCard[] = [];
            const achievedByName = yaku.requiredCardNames.every(reqName => {
                const foundCard = captured.find(capCard => capCard.name === reqName);
                if (foundCard) {
                    tempContributing.push(foundCard);
                    return true;
                }
                return false;
            });
            if (achievedByName) {
                yakuAchieved = true;
                currentYakuPoints = yaku.points;
                contributingToThisYaku = tempContributing;
            }
        }

        if (yakuAchieved) {
            achievedYakuResult.push({ yaku, points: currentYakuPoints, contributingCards: contributingToThisYaku });
        }
    });
    return achievedYakuResult;
  }, [fullMasterDeck]);


  const handlePlayCardFromHand = useCallback((handCard: PlayableCard, fieldCardToMatch?: PlayableCard) => {
    setPlayerHand(prev => prev.filter(c => c.id !== handCard.id).sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    let tempFieldCards = [...fieldCards];
    let tempPlayerCapturedCards = [...playerCapturedCards];

    const cardsOfHandCardMonthOnFieldBeforePlay = tempFieldCards.filter(fc => fc.monthValue === handCard.monthValue);

    if (cardsOfHandCardMonthOnFieldBeforePlay.length === 3 && handCard.monthValue === cardsOfHandCardMonthOnFieldBeforePlay[0]?.monthValue) {
        tempPlayerCapturedCards.push(handCard, ...cardsOfHandCardMonthOnFieldBeforePlay);
        tempFieldCards = tempFieldCards.filter(fc => fc.monthValue !== handCard.monthValue);
        toast({ title: "同月四枚取！", description: `您打出 ${handCard.name} 並捕獲了場上所有 ${handCard.monthDisplay} 的牌。` });
    } else if (fieldCardToMatch && fieldCardToMatch.monthValue === handCard.monthValue) { 
        tempPlayerCapturedCards.push(handCard, fieldCardToMatch);
        tempFieldCards = tempFieldCards.filter(c => c.id !== fieldCardToMatch.id);
        toast({ title: "配對成功！", description: `您打出 ${handCard.name} 配對了場上的 ${fieldCardToMatch.name}。` });
    } else { 
      tempFieldCards.push(handCard);
      toast({ title: "放置到場上", description: `您打出 ${handCard.name}，無配對。` });
    }

    setFieldCards(tempFieldCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    setPlayerCapturedCards(tempPlayerCapturedCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    setSelectedHandCardId(null);
    setGamePhase('PLAYER_DRAW_AND_EVAL_DECK_CARD');
    setMessage(playerHand.length -1 === 0 ? "手牌已空，從牌堆抽牌..." : "從牌堆抽牌...");
  }, [fieldCards, playerCapturedCards, toast, playerHand]);

  const handlePlayerDrawnCardAction = useCallback((deckCard: PlayableCard, fieldCardToMatch?: PlayableCard) => {
    setDrawnCardForMatching(null);
    let tempFieldCards = [...fieldCards];
    let tempPlayerCapturedCards = [...playerCapturedCards];

    const cardsOfDrawnCardMonthOnFieldBeforeMatch = tempFieldCards.filter(fc => fc.monthValue === deckCard.monthValue);
    if (cardsOfDrawnCardMonthOnFieldBeforeMatch.length === 3 && deckCard.monthValue === cardsOfDrawnCardMonthOnFieldBeforeMatch[0]?.monthValue) {
        tempPlayerCapturedCards.push(deckCard, ...cardsOfDrawnCardMonthOnFieldBeforeMatch);
        tempFieldCards = tempFieldCards.filter(fc => fc.monthValue !== deckCard.monthValue);
        toast({ title: "抽牌同月四枚取！", description: `您抽到 ${deckCard.name} 並捕獲了場上所有 ${deckCard.monthDisplay} 的牌。` });
    } else if (fieldCardToMatch && fieldCardToMatch.monthValue === deckCard.monthValue) { 
        tempPlayerCapturedCards.push(deckCard, fieldCardToMatch);
        tempFieldCards = tempFieldCards.filter(c => c.id !== fieldCardToMatch.id);
        toast({ title: "抽牌配對成功！", description: `您抽到 ${deckCard.name} 配對了場上的 ${fieldCardToMatch.name}。` });
    } else { 
      tempFieldCards.push(deckCard);
      toast({ title: "抽牌放置到場上", description: `您抽到 ${deckCard.name}，無配對。` });
    }

    setFieldCards(tempFieldCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    setPlayerCapturedCards(tempPlayerCapturedCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    setGamePhase('PLAYER_CHECK_YAKU');
  }, [fieldCards, playerCapturedCards, toast]);

  useEffect(() => {
    if (gamePhase === 'PLAYER_DRAW_AND_EVAL_DECK_CARD') {
      if (deck.length > 0) {
        const currentDeck = [...deck];
        const cardDrawn = currentDeck.shift()!;
        setDeck(currentDeck);

        const cardsOfDrawnCardMonthOnField = fieldCards.filter(fc => fc.monthValue === cardDrawn.monthValue);
        if (cardsOfDrawnCardMonthOnField.length === 3 && cardDrawn.monthValue === cardsOfDrawnCardMonthOnField[0]?.monthValue) {
            handlePlayerDrawnCardAction(cardDrawn, undefined); 
            return;
        }

        setDrawnCardForMatching(cardDrawn);
        const potentialMatchesOnField = fieldCards.filter(fc => fc.monthValue === cardDrawn.monthValue);
        if (potentialMatchesOnField.length > 0) {
          setMessage(`您抽到牌：${cardDrawn.name}。請點擊場上相配的牌，或點擊「放置到場上」。`);
          setGamePhase('PLAYER_MATCH_DECK_TO_FIELD');
        } else {
          handlePlayerDrawnCardAction(cardDrawn, undefined);
        }
      } else {
        setMessage("牌堆已空。");
        setGamePhase('PLAYER_CHECK_YAKU'); 
      }
    }
  }, [gamePhase, deck, fieldCards, handlePlayerDrawnCardAction]);

 useEffect(() => {
    if (gamePhase === 'PLAYER_CHECK_YAKU') {
      const allAchievedPlayerYaku = getAllAchievedYaku(playerCapturedCards);
      const currentTotalPlayerYakuScore = allAchievedPlayerYaku.reduce((sum, item) => sum + item.points, 0);
      console.log(`[PLAYER_CHECK_YAKU] Player Yaku Score: ${currentTotalPlayerYakuScore}, Called Koi: ${playerCalledKoiKoiThisTurn}, Points at last Koi: ${playerPointsAtLastKoiKoi}, Hand Size: ${playerHand.length}`);

      if (playerHand.length === 0 && currentTotalPlayerYakuScore > 0) { // Rule 3: Hand empty AND Yaku formed
          console.log("[PLAYER_CHECK_YAKU] Player hand empty and Yaku formed. Force Shōbu.");
          toast({ title: "手牌用罄成役！", description: `您湊成了 ${currentTotalPlayerYakuScore} 點的役，回合結束。` });
          
          setShobuCalledBy('player');
          setSignificantYakuForModalDisplay(null);
          setRoundSummaryData({
            winnerDisplay: "玩家",
            roundScore: currentTotalPlayerYakuScore * roundMultiplier, 
            achievedYaku: allAchievedPlayerYaku.map(y => ({ name: y.yaku.name, points: y.points, contributingCards: y.contributingCards })) || []
          });
          setFinalRoundScoreUpdate({ playerScoreChange: currentTotalPlayerYakuScore * roundMultiplier, nextOya: true });
          
          setGamePhase('ROUND_OVER');
          // Directly open modal for this scenario
          roundOverProcessedRef.current = true; 
          setIsRoundSummaryModalOpen(true);
          return;
      }
      
      if (currentTotalPlayerYakuScore > 0) {
        setSignificantYakuForModalDisplay(allAchievedPlayerYaku.length > 0 ? allAchievedPlayerYaku.sort((a,b) => b.points - a.points)[0] : null);
        if (playerCalledKoiKoiThisTurn) { 
          if (currentTotalPlayerYakuScore > playerPointsAtLastKoiKoi) { 
            console.log("[PLAYER_CHECK_YAKU] Player Yaku improved after Koi. Opening KoiKoi modal.");
            setIsKoiKoiModalOpen(true);
            setGamePhase('PLAYER_KOIKOI_DECISION');
            setMessage(`您的役點提升！總點數 ${currentTotalPlayerYakuScore}。要喊「來來」嗎？`);
          } else { 
            console.log("[PLAYER_CHECK_YAKU] Player Yaku did not improve after Koi. Passing to AI.");
            toast({ title: "提示", description: "您已喊過「來來」，但此輪役點未提升。輪到 AI 行動。" });
            setGamePhase('AI_THINKING');
            setMessage("輪到 AI 行動...");
          }
        } else { 
          console.log("[PLAYER_CHECK_YAKU] Player formed Yaku. Opening KoiKoi modal.");
          setIsKoiKoiModalOpen(true);
          setGamePhase('PLAYER_KOIKOI_DECISION');
          setMessage(`您湊成了役！總點數 ${currentTotalPlayerYakuScore}。要喊「來來」嗎？`);
        }
      } else { // No Yaku formed by player this turn
        console.log("[PLAYER_CHECK_YAKU] No Yaku formed by player or hand not empty. Passing to AI or ending round.");
        if (playerHand.length === 0 && deck.length === 0) { 
            // All cards played, no yaku from player. Oya-ken or draw might apply.
            // This should now be handled by the ROUND_OVER effect primarily.
            setGamePhase('ROUND_OVER'); 
        } else { 
            // Player has cards or deck has cards, but no Yaku formed this turn.
            setGamePhase('AI_THINKING');
            setMessage("輪到 AI 行動...");
        }
      }
    }
  }, [gamePhase, playerCapturedCards, getAllAchievedYaku, playerHand.length, deck.length, playerCalledKoiKoiThisTurn, playerPointsAtLastKoiKoi, roundMultiplier, toast]);


  const handlePlayerKoiKoi = useCallback((choseKoiKoi: boolean) => {
    setIsKoiKoiModalOpen(false);
    const allAchievedNow = getAllAchievedYaku(playerCapturedCards);
    const currentTotalScore = allAchievedNow.reduce((sum, item) => sum + item.points, 0);
    console.log(`[handlePlayerKoiKoi] Player chose KoiKoi: ${choseKoiKoi}. Current Total Yaku Score: ${currentTotalScore}`);

    if (choseKoiKoi) {
      toast({ title: "來來！", description: "您選擇繼續！" });
      setPlayerCalledKoiKoiThisTurn(true);
      setPlayerPointsAtLastKoiKoi(currentTotalScore); 
      setRoundMultiplier(prev => prev + 1);
      setSignificantYakuForModalDisplay(null); 
      setGamePhase('AI_THINKING');
      setMessage("輪到 AI 行動...");
    } else { // Player chose Shōbu
      console.log("[handlePlayerKoiKoi] Player chose Shōbu.");
      setSignificantYakuForModalDisplay(null); // Clear the yaku that triggered this modal
      const pointsToAward = currentTotalScore * roundMultiplier;

      setShobuCalledBy('player'); // Mark that player ended the round
      setRoundSummaryData({ // Set data for the summary modal
        winnerDisplay: "玩家",
        roundScore: pointsToAward,
        achievedYaku: allAchievedNow.map(y => ({ name: y.yaku.name, points: y.points, contributingCards: y.contributingCards })) || []
      });
      setFinalRoundScoreUpdate({ playerScoreChange: pointsToAward, nextOya: true }); 

      setGamePhase('ROUND_OVER');
      // Open modal directly after Shōbu
      roundOverProcessedRef.current = true;
      setIsRoundSummaryModalOpen(true);
    }
  }, [playerCapturedCards, getAllAchievedYaku, roundMultiplier, toast]);

  const handleAiTurn = useCallback(async () => {
    setMessage("AI 思考中...");
    console.log("[handleAiTurn] AI Turn begins.");

    const currentAiYakuDetails = getAllAchievedYaku(aiCapturedCards);
    const currentAiYakuForInput: AiYakuInfo[] = currentAiYakuDetails.map(y => ({name: y.yaku.name, points: y.points}));
    const currentPlayerYakuDetails = getAllAchievedYaku(playerCapturedCards);
    const currentPlayerYakuForInput: AiYakuInfo[] = currentPlayerYakuDetails.map(y => ({name: y.yaku.name, points: y.points}));

    const aiInput: AiKoiKoiInput = {
      aiHand: aiHand.map(c => ({ name: c.name, monthValue: c.monthValue, cardType: c.cardType })),
      fieldCards: fieldCards.map(c => ({ name: c.name, monthValue: c.monthValue, cardType: c.cardType })),
      aiCapturedCards: aiCapturedCards.map(c => ({ name: c.name, monthValue: c.monthValue, cardType: c.cardType })),
      playerCapturedCards: playerCapturedCards.map(c => ({ name: c.name, monthValue: c.monthValue, cardType: c.cardType })),
      currentDeckSize: deck.length,
      playerScore: playerScore,
      aiScore: conceptualAiScore, 
      currentRoundMultiplier: roundMultiplier,
      playerCalledKoiKoi: playerCalledKoiKoiThisTurn,
      aiCurrentYaku: currentAiYakuForInput,
      playerCurrentYaku: currentPlayerYakuForInput,
    };

    try {
      const aiResponse: AiKoiKoiOutput = await koiKoiAiOpponentFlow(aiInput);
      setAiResponseForKoiKoiDecision(aiResponse); 
      console.log("[handleAiTurn] AI Response:", aiResponse);

      let tempAiHand = [...aiHand];
      let tempFieldCards = [...fieldCards];
      let tempAiCapturedCards = [...aiCapturedCards];
      let tempDeck = [...deck];

      if (aiResponse.aiThoughtProcess) {
          toast({variant: "default", title: "AI 想法", description: aiResponse.aiThoughtProcess, duration: 3000});
      }

      // AI plays card from hand
      if (aiResponse.playCardFromHand && tempAiHand.length > 0) {
        let cardToPlayFromHand = tempAiHand.find(c => c.name === aiResponse.playCardFromHand!.cardName);

        if (!cardToPlayFromHand && tempAiHand.length > 0) { // Fallback if AI suggests invalid card
            console.warn(`[handleAiTurn] AI suggested card '${aiResponse.playCardFromHand.cardName}' not in hand. Playing first card instead.`);
            cardToPlayFromHand = tempAiHand[0];
            aiResponse.playCardFromHand.cardName = cardToPlayFromHand.name; 
            aiResponse.playCardFromHand.matchWithFieldCardName = undefined; // No guaranteed match for fallback
        }
        
        if (cardToPlayFromHand) {
          tempAiHand = tempAiHand.filter(c => c.id !== cardToPlayFromHand!.id);
          const cardsOfPlayedCardMonthOnField = tempFieldCards.filter(fc => fc.monthValue === cardToPlayFromHand!.monthValue);
          
          const isTakeAllFourFromHandAI = cardsOfPlayedCardMonthOnField.length === 3 && 
                                           cardToPlayFromHand!.monthValue === cardsOfPlayedCardMonthOnField[0]?.monthValue;
                                          // AI prompt instructs to omit matchWithFieldCardName for take all four
                                          // || (aiResponse.playCardFromHand.matchWithFieldCardName === undefined && cardsOfPlayedCardMonthOnField.length === 3)

          if (isTakeAllFourFromHandAI) {
            tempAiCapturedCards.push(cardToPlayFromHand!, ...cardsOfPlayedCardMonthOnField);
            tempFieldCards = tempFieldCards.filter(fc => fc.monthValue !== cardToPlayFromHand!.monthValue);
            toast({variant: "default", title:"AI 出牌 (四枚取)", description: `AI 打出 ${cardToPlayFromHand!.name} 並捕獲了場上所有 ${cardToPlayFromHand!.monthDisplay} 的牌。`});
            console.log(`[handleAiTurn] AI plays ${cardToPlayFromHand.name} (Take All Four)`);
          } else { 
            let matchedFieldCard: PlayableCard | undefined = undefined;
            if (aiResponse.playCardFromHand.matchWithFieldCardName) {
                matchedFieldCard = tempFieldCards.find(fc =>
                    fc.name === aiResponse.playCardFromHand!.matchWithFieldCardName &&
                    fc.monthValue === cardToPlayFromHand!.monthValue
                );
            }
            
            // Fallback if AI's specific match is invalid but a match exists
            if (!matchedFieldCard && aiResponse.playCardFromHand.matchWithFieldCardName && cardsOfPlayedCardMonthOnField.length > 0) {
                console.warn(`[handleAiTurn] AI suggested match '${aiResponse.playCardFromHand.matchWithFieldCardName}' for '${cardToPlayFromHand.name}' is invalid or not found. Attempting any valid match.`);
                matchedFieldCard = cardsOfPlayedCardMonthOnField.sort((a,b) => b.pointsValue - a.pointsValue)[0]; // Prioritize higher value if multiple
            }


            if (matchedFieldCard) {
              tempAiCapturedCards.push(cardToPlayFromHand!, matchedFieldCard);
              tempFieldCards = tempFieldCards.filter(c => c.id !== matchedFieldCard!.id);
              toast({variant: "default", title:"AI 出牌", description: `AI 打出 ${cardToPlayFromHand!.name} 配對了 ${matchedFieldCard.name}`});
              console.log(`[handleAiTurn] AI plays ${cardToPlayFromHand.name} matching ${matchedFieldCard.name}`);
            } else { 
              tempFieldCards.push(cardToPlayFromHand!);
              toast({variant: "default", title:"AI 出牌", description: `AI 打出 ${cardToPlayFromHand!.name} 到場上`});
              console.log(`[handleAiTurn] AI plays ${cardToPlayFromHand.name} to field (no match)`);
            }
          }
        }
      } else if (tempAiHand.length > 0) { // AI didn't specify a hand card but has cards
        console.warn("[handleAiTurn] AI did not specify a card to play from hand, but has cards. Playing first card as fallback.");
        let cardToPlayFromHand = tempAiHand[0];
        tempAiHand = tempAiHand.filter(c => c.id !== cardToPlayFromHand!.id);
        // Simplified fallback: just place on field
        tempFieldCards.push(cardToPlayFromHand);
        toast({variant: "default", title:"AI 出牌 (後備)", description: `AI 打出 ${cardToPlayFromHand!.name} 到場上`});
        console.log(`[handleAiTurn] AI plays ${cardToPlayFromHand.name} to field (fallback, no match specified by AI)`);
      }
      setAiHand(tempAiHand.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      let fieldAfterAiHandPlay = [...tempFieldCards].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder);

      // AI draws card from deck
      if (tempDeck.length > 0) {
        const drawnCardByAi = tempDeck.shift()!;
        toast({variant: "default", title:"AI 抽牌", description: `AI 抽到 ${drawnCardByAi.name}`});
        console.log(`[handleAiTurn] AI draws ${drawnCardByAi.name}`);

        const cardsOfDrawnCardMonthOnFieldAfterAiHandPlay = fieldAfterAiHandPlay.filter(fc => fc.monthValue === drawnCardByAi.monthValue);
        
        const isTakeAllFourFromDrawAI = cardsOfDrawnCardMonthOnFieldAfterAiHandPlay.length === 3 && 
                                         drawnCardByAi.monthValue === cardsOfDrawnCardMonthOnFieldAfterAiHandPlay[0]?.monthValue;
                                         // AI prompt instructs to omit for take all four from draw
                                         // || (aiResponse.drawCardAction?.matchWithFieldCardName === undefined && cardsOfDrawnCardMonthOnFieldAfterAiHandPlay.length === 3)

        if (isTakeAllFourFromDrawAI) {
            tempAiCapturedCards.push(drawnCardByAi, ...cardsOfDrawnCardMonthOnFieldAfterAiHandPlay);
            fieldAfterAiHandPlay = fieldAfterAiHandPlay.filter(fc => fc.monthValue !== drawnCardByAi.monthValue);
            toast({variant: "default", title:"AI 抽牌行動 (四枚取)", description: `AI 抽到的 ${drawnCardByAi.name} 並捕獲了場上所有 ${drawnCardByAi.monthDisplay} 的牌。`});
            console.log(`[handleAiTurn] AI drawn card ${drawnCardByAi.name} (Take All Four)`);
        } else { 
            let matchedFieldCardForDraw: PlayableCard | undefined = undefined;
            if (aiResponse.drawCardAction?.matchWithFieldCardName) {
                matchedFieldCardForDraw = fieldAfterAiHandPlay.find(fc =>
                    fc.name === aiResponse.drawCardAction!.matchWithFieldCardName &&
                    fc.monthValue === drawnCardByAi.monthValue
                );
            }
             // Fallback if AI's specific match is invalid but a match exists
            if (!matchedFieldCardForDraw && aiResponse.drawCardAction?.matchWithFieldCardName && cardsOfDrawnCardMonthOnFieldAfterAiHandPlay.length > 0) {
                console.warn(`[handleAiTurn] AI suggested match for drawn card '${aiResponse.drawCardAction.matchWithFieldCardName}' is invalid. Attempting any valid match.`);
                matchedFieldCardForDraw = cardsOfDrawnCardMonthOnFieldAfterAiHandPlay.sort((a,b) => b.pointsValue - a.pointsValue)[0];
            }


            if (matchedFieldCardForDraw) {
                tempAiCapturedCards.push(drawnCardByAi, matchedFieldCardForDraw);
                fieldAfterAiHandPlay = fieldAfterAiHandPlay.filter(c => c.id !== matchedFieldCardForDraw!.id);
                toast({variant: "default", title:"AI 抽牌行動", description: `AI 抽到的 ${drawnCardByAi.name} 配對了 ${matchedFieldCardForDraw.name}`});
                console.log(`[handleAiTurn] AI drawn card ${drawnCardByAi.name} matches ${matchedFieldCardForDraw.name}`);
            } else { 
                fieldAfterAiHandPlay.push(drawnCardByAi);
                toast({variant: "default", title:"AI 抽牌行動", description: `AI 抽到的 ${drawnCardByAi.name} 放置到場上`});
                console.log(`[handleAiTurn] AI drawn card ${drawnCardByAi.name} to field (no match)`);
            }
        }
        setDeck(tempDeck);
      } else { 
        // Deck is empty, no draw action for AI
        console.log("[handleAiTurn] Deck is empty. No draw action for AI.");
      }
      setFieldCards(fieldAfterAiHandPlay.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      setAiCapturedCards(tempAiCapturedCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      setGamePhase('AI_ACTIONS_COMPLETE');

    } catch (error: any) {
      console.error("AI opponent flow error:", error.message || error);
      toast({ variant: "destructive", title: "AI 錯誤", description: "AI 對手處理時發生錯誤。輪到玩家行動。" });
      setAiResponseForKoiKoiDecision(null); 
      setGamePhase('PLAYER_SELECT_HAND_CARD'); // Or some other error recovery phase
      setMessage("AI 處理錯誤。輪到您行動。");
    }
  }, [aiHand, fieldCards, aiCapturedCards, playerCapturedCards, deck, playerScore, roundMultiplier, playerCalledKoiKoiThisTurn, toast, getAllAchievedYaku]);

  useEffect(() => {
    if (gamePhase === 'AI_THINKING') {
      if (aiHand.length === 0 && deck.length === 0) {
        console.log("[Effect AI_THINKING] AI has no cards and deck is empty. Proceeding to ROUND_OVER.");
        setGamePhase('ROUND_OVER');
      } else {
        handleAiTurn();
      }
    }
  }, [gamePhase, aiHand.length, deck.length, handleAiTurn]);

  useEffect(() => {
    if (gamePhase === 'AI_ACTIONS_COMPLETE' && aiResponseForKoiKoiDecision) {
        console.log("[Effect AI_ACTIONS_COMPLETE] AI actions complete. Proceeding to AI_CHECK_YAKU.");
        setGamePhase('AI_CHECK_YAKU');
    } else if (gamePhase === 'AI_ACTIONS_COMPLETE' && !aiResponseForKoiKoiDecision) {
        // This case might happen if AI flow failed and fallback was used, or if AI had no moves.
        console.log("[Effect AI_ACTIONS_COMPLETE] AI actions complete, but no specific AI response for KoiKoi decision (e.g., fallback or no move). Proceeding to AI_CHECK_YAKU.");
        setGamePhase('AI_CHECK_YAKU'); // Still need to check Yaku based on current state
    }
  }, [gamePhase, aiResponseForKoiKoiDecision]);


  useEffect(() => {
    if (gamePhase === 'AI_CHECK_YAKU') { // Removed aiResponseForKoiKoiDecision dependency, decision should be based on current state
      const allAchievedAiYaku = getAllAchievedYaku(aiCapturedCards);
      const currentTotalAiYakuScore = allAchievedAiYaku.reduce((sum, item) => sum + item.points, 0);
      // AI's Koi-Koi decision comes from the LLM response if available, otherwise fallback (e.g., always Shōbu)
      const aiChoosesKoiKoi = aiResponseForKoiKoiDecision?.callKoiKoi ?? false; 
      console.log(`[AI_CHECK_YAKU] AI Yaku Score: ${currentTotalAiYakuScore}, AI Chose KoiKoi (from LLM or fallback): ${aiChoosesKoiKoi}, AI Hand: ${aiHand.length}`);


      if (aiHand.length === 0 && currentTotalAiYakuScore > 0) { // Rule 3 for AI
          console.log("[AI_CHECK_YAKU] AI hand empty and Yaku formed. Force Shōbu.");
          toast({ title: "AI 手牌用罄成役！", description: `AI 湊成了 ${currentTotalAiYakuScore} 點的役，回合結束。` });
          
          setShobuCalledBy('ai');
          setRoundSummaryData({
              winnerDisplay: "AI",
              roundScore: currentTotalAiYakuScore * roundMultiplier,
              achievedYaku: allAchievedAiYaku.map(y => ({name: y.yaku.name, points: y.points, contributingCards: y.contributingCards})) || []
          });
          setFinalRoundScoreUpdate({ playerScoreChange: -(currentTotalAiYakuScore * roundMultiplier), nextOya: false });
          
          setGamePhase('ROUND_OVER');
          roundOverProcessedRef.current = true;
          setIsRoundSummaryModalOpen(true);
          setAiResponseForKoiKoiDecision(null);
          return;
      }

      if (currentTotalAiYakuScore > 0) {
        let decisionMessage = "";
        if (aiCalledKoiKoiThisTurn) { // AI previously called KoiKoi
            if (currentTotalAiYakuScore > aiPointsAtLastKoiKoi) { // Yaku improved
                decisionMessage = `AI 役點提升 (總點數 ${currentTotalAiYakuScore})。AI 決定：${aiChoosesKoiKoi ? '來來' : '勝負'}。`;
                console.log(`[AI_CHECK_YAKU] AI Yaku improved after Koi. AI chose Koi: ${aiChoosesKoiKoi}`);
                 if (aiChoosesKoiKoi) {
                    setAiCalledKoiKoiThisTurn(true); // Already true, but for clarity
                    setAiPointsAtLastKoiKoi(currentTotalAiYakuScore);
                    setRoundMultiplier(prev => prev + 1);
                    setGamePhase('PLAYER_SELECT_HAND_CARD');
                    setMessage("輪到您行動。");
                } else { // AI chose Shōbu
                    setShobuCalledBy('ai');
                    const pointsToAwardToAi = currentTotalAiYakuScore * roundMultiplier;
                    setRoundSummaryData({
                      winnerDisplay: "AI",
                      roundScore: pointsToAwardToAi,
                      achievedYaku: allAchievedAiYaku.map(y => ({name: y.yaku.name, points: y.points, contributingCards: y.contributingCards})) || []
                    });
                    setFinalRoundScoreUpdate({ playerScoreChange: -pointsToAwardToAi, nextOya: false });
                    setGamePhase('ROUND_OVER');
                    roundOverProcessedRef.current = true;
                    setIsRoundSummaryModalOpen(true);
                }
            } else { // Yaku did not improve after Koi
                console.log("[AI_CHECK_YAKU] AI Yaku did not improve after Koi. Passing to Player.");
                toast({title: "提示", description: "AI 已喊過「來來」，但此輪役點未提升。輪到玩家行動。" });
                setGamePhase('PLAYER_SELECT_HAND_CARD');
                setMessage("輪到您行動。");
            }
        } else { // AI formed Yaku for the first time this turn (or after previous Shōbu)
            decisionMessage = `AI 湊成了役 (總點數 ${currentTotalAiYakuScore})。AI 決定：${aiChoosesKoiKoi ? '來來' : '勝負'}。`;
            console.log(`[AI_CHECK_YAKU] AI formed Yaku. AI chose Koi: ${aiChoosesKoiKoi}`);
             if (aiChoosesKoiKoi) {
                setAiCalledKoiKoiThisTurn(true);
                setAiPointsAtLastKoiKoi(currentTotalAiYakuScore);
                setRoundMultiplier(prev => prev + 1);
                setGamePhase('PLAYER_SELECT_HAND_CARD');
                setMessage("輪到您行動。");
            } else { // AI chose Shōbu
                setShobuCalledBy('ai');
                const pointsToAwardToAi = currentTotalAiYakuScore * roundMultiplier;
                 setRoundSummaryData({
                  winnerDisplay: "AI",
                  roundScore: pointsToAwardToAi,
                  achievedYaku: allAchievedAiYaku.map(y => ({name: y.yaku.name, points: y.points, contributingCards: y.contributingCards})) || []
                });
                setFinalRoundScoreUpdate({ playerScoreChange: -pointsToAwardToAi, nextOya: false });
                setGamePhase('ROUND_OVER');
                roundOverProcessedRef.current = true;
                setIsRoundSummaryModalOpen(true);
            }
        }
        toast({title: "AI 行動", description: decisionMessage});
      } else { // No Yaku formed by AI
          console.log("[AI_CHECK_YAKU] No Yaku formed by AI.");
          if (aiHand.length === 0 && deck.length === 0) { // AI hand empty, deck empty, no Yaku
            console.log("[AI_CHECK_YAKU] AI hand and deck empty, no Yaku. Proceeding to ROUND_OVER.");
            setGamePhase('ROUND_OVER');
          } else { // AI turn ends, pass to player
            console.log("[AI_CHECK_YAKU] AI turn ends. Passing to Player.");
            setGamePhase('PLAYER_SELECT_HAND_CARD');
            setMessage("輪到您行動。");
          }
      }
      setAiResponseForKoiKoiDecision(null); // Reset AI response after processing
    }
  }, [gamePhase, aiCapturedCards, getAllAchievedYaku, aiHand.length, deck.length, roundMultiplier, aiCalledKoiKoiThisTurn, aiPointsAtLastKoiKoi, aiResponseForKoiKoiDecision, toast]);


  useEffect(() => {
    // This effect handles the end of a round, calculating final scores and opening the summary modal.
    if (gamePhase === 'ROUND_OVER' && !roundOverProcessedRef.current && !isRoundSummaryModalOpen) {
        console.log(`[Effect ROUND_OVER Executing] shobuCalledBy: ${shobuCalledBy}`);
        let tempRoundSummaryData: RoundSummaryData | null = null;
        let tempFinalRoundScoreUpdate: FinalRoundScoreUpdate | null = null;
        let tempOyaKenAppliedThisRoundPass = false;

        if (shobuCalledBy) { 
            // If Shobu was called, roundSummaryData and finalRoundScoreUpdate were already set.
            // We use those directly.
            console.log(`[Effect ROUND_OVER] Shobu by ${shobuCalledBy}. Using pre-set data.`);
            tempRoundSummaryData = roundSummaryData; 
            tempFinalRoundScoreUpdate = finalRoundScoreUpdate;
            if (!tempRoundSummaryData || !tempFinalRoundScoreUpdate) {
                 console.error("CRITICAL: Shobu was called, but roundSummaryData or finalRoundScoreUpdate is still null. This indicates a logic error in Shobu handling.", 
                 { currentRoundSummary: roundSummaryData, currentFinalUpdate: finalRoundScoreUpdate, shobuCalledBy });
                 // Fallback to prevent crash, though data will be wrong
                 tempRoundSummaryData = tempRoundSummaryData || { winnerDisplay: `錯誤 - ${shobuCalledBy} 計分遺失`, roundScore: 0, achievedYaku: [] };
                 tempFinalRoundScoreUpdate = tempFinalRoundScoreUpdate || { playerScoreChange: 0, nextOya: isOyaPlayer };
            }
        } else { // Natural end of round (no one called Shōbu)
            console.log("[Effect ROUND_OVER Natural] Entering natural end of round logic.");
            // ... (detailed logging as before) ...
            
            let finalPlayerYakuDetails = getAllAchievedYaku(playerCapturedCards);
            let finalAiYakuDetails = getAllAchievedYaku(aiCapturedCards);
            let finalPlayerScoreFromYaku = finalPlayerYakuDetails.reduce((sum, item) => sum + item.points, 0);
            let finalAiScoreFromYaku = finalAiYakuDetails.reduce((sum, item) => sum + item.points, 0);
            
            // Apply Koi-Koi Bust rule (Rule 2 consequence)
            if (playerHand.length === 0 && deck.length === 0) { 
                if (playerCalledKoiKoiThisTurn && finalPlayerScoreFromYaku <= playerPointsAtLastKoiKoi) {
                    toast({ title: "玩家「來來」失敗", description: "玩家喊出「來來」後役點未提升或降低，本回合該役分數為0。" });
                    finalPlayerScoreFromYaku = 0; 
                    finalPlayerYakuDetails = [];
                }
                if (aiCalledKoiKoiThisTurn && finalAiScoreFromYaku <= aiPointsAtLastKoiKoi) {
                    toast({ title: "AI「來來」失敗", description: "AI喊出「來來」後役點未提升或降低，本回合該役分數為0。" });
                    finalAiScoreFromYaku = 0;
                    finalAiYakuDetails = [];
                }
            }
            
            let calculatedPlayerScoreChange = 0;
            let nextOyaIsPlayer = isOyaPlayer; 
            let summaryWinnerDisplay = "平手 (無役)";
            let summaryRoundScore = 0;
            let summaryAchievedYaku: RoundSummaryData['achievedYaku'] = [];

            if (finalPlayerScoreFromYaku > 0 || finalAiScoreFromYaku > 0) {
                if (finalPlayerScoreFromYaku >= finalAiScoreFromYaku) {
                    calculatedPlayerScoreChange = finalPlayerScoreFromYaku * roundMultiplier;
                    nextOyaIsPlayer = true;
                    summaryWinnerDisplay = "玩家";
                    summaryRoundScore = calculatedPlayerScoreChange;
                    summaryAchievedYaku = finalPlayerYakuDetails.map(y => ({name: y.yaku.name, points: y.points, contributingCards: y.contributingCards}));
                } else { 
                    calculatedPlayerScoreChange = -(finalAiScoreFromYaku * roundMultiplier);
                    nextOyaIsPlayer = false;
                    summaryWinnerDisplay = "AI";
                    summaryRoundScore = finalAiScoreFromYaku * roundMultiplier;
                    summaryAchievedYaku = finalAiYakuDetails.map(y => ({name: y.yaku.name, points: y.points, contributingCards: y.contributingCards}));
                }
            } else if ( // Oya-ken condition (Rule 1)
                playerHand.length === 0 &&
                aiHand.length === 0 &&
                deck.length === 0 &&
                !oyaKenAppliedThisRound 
            ) {
                const oyaKenYakuDef = yakuList.find(y => y.id === 'oyaken');
                if (oyaKenYakuDef) {
                    console.log(`[Effect ROUND_OVER Natural] Oya-ken condition met. Current Oya isPlayer: ${isOyaPlayer}`);
                    setOyaKenAppliedThisRound(true); // Set this early to prevent re-trigger if effect re-runs
                    tempOyaKenAppliedThisRoundPass = true; // Mark that Oya-ken applied in this specific pass
                    summaryRoundScore = oyaKenYakuDef.points; 
                    summaryAchievedYaku = [{ name: oyaKenYakuDef.name, points: oyaKenYakuDef.points }];
                    nextOyaIsPlayer = isOyaPlayer; 

                    if (isOyaPlayer) {
                        calculatedPlayerScoreChange = oyaKenYakuDef.points;
                        summaryWinnerDisplay = "玩家 (親權)";
                    } else { 
                        calculatedPlayerScoreChange = -oyaKenYakuDef.points;
                        summaryWinnerDisplay = "AI (親權)";
                    }
                    console.log(`[Effect ROUND_OVER Natural] Oya-ken applied. Winner: ${summaryWinnerDisplay}, Score: ${summaryRoundScore}`);
                } else {
                    console.warn("[Effect ROUND_OVER Natural] Oya-ken Yaku definition not found!");
                }
            } else {
                 console.log("[Effect ROUND_OVER Natural] No Yaku scored, and Oya-ken not applicable or already applied this round.");
                 summaryWinnerDisplay = "平手 (無役)";
            }
            tempRoundSummaryData = { winnerDisplay: summaryWinnerDisplay, roundScore: summaryRoundScore, achievedYaku: summaryAchievedYaku };
            tempFinalRoundScoreUpdate = { playerScoreChange: calculatedPlayerScoreChange, nextOya: nextOyaIsPlayer };
        }

        if (tempRoundSummaryData && tempFinalRoundScoreUpdate) {
            setRoundSummaryData(tempRoundSummaryData);
            setFinalRoundScoreUpdate(tempFinalRoundScoreUpdate);
            // if (tempOyaKenAppliedThisRoundPass) { // This local flag is not needed if setOyaKenAppliedThisRound is called earlier
            //     setOyaKenAppliedThisRound(true); 
            // }
            console.log("[Effect ROUND_OVER] Setting roundOverProcessedRef.current = true");
            roundOverProcessedRef.current = true;
            console.log("[Effect ROUND_OVER] Opening RoundSummaryModal. roundSummaryData for modal:", tempRoundSummaryData);
            setIsRoundSummaryModalOpen(true);
        } else {
             console.warn("[Effect ROUND_OVER] tempRoundSummaryData or tempFinalRoundScoreUpdate is null. Modal not opened. This might indicate an unhandled game end scenario.");
        }
    }
  }, [
    gamePhase, shobuCalledBy, 
    playerHand.length, aiHand.length, deck.length, playerCapturedCards, aiCapturedCards,
    roundMultiplier, playerCalledKoiKoiThisTurn, aiCalledKoiKoiThisTurn,
    playerPointsAtLastKoiKoi, aiPointsAtLastKoiKoi, isOyaPlayer,
    getAllAchievedYaku, 
    // roundSummaryData, // Removed: if shobuCalledBy, we use the current state. If natural end, we calculate new.
    // finalRoundScoreUpdate, // Removed for same reason.
    oyaKenAppliedThisRound, 
    isRoundSummaryModalOpen, toast
  ]);


  const handleProceedAfterRoundSummary = useCallback(() => {
    // This function is called when the "Next Round" or "View Final Results" button is clicked in the summary modal.
    setIsRoundSummaryModalOpen(false); 
    console.log("[Function Call] handleProceedAfterRoundSummary called. finalRoundScoreUpdate:", finalRoundScoreUpdate);

    if (finalRoundScoreUpdate) {
        const newPlayerScore = playerScore + finalRoundScoreUpdate.playerScoreChange;
        setPlayerScore(newPlayerScore);
        setIsOyaPlayer(finalRoundScoreUpdate.nextOya);

        // Reset round-specific states
        setPlayerCalledKoiKoiThisTurn(false);
        setPlayerPointsAtLastKoiKoi(0);
        setAiCalledKoiKoiThisTurn(false);
        setAiPointsAtLastKoiKoi(0);
        setRoundMultiplier(1);
        setSignificantYakuForModalDisplay(null);
        // setOyaKenAppliedThisRound(false); // This is reset in startGame
        
        setRoundSummaryData(null); 
        setFinalRoundScoreUpdate(null); 
        // setShobuCalledBy(null); // This is reset in startGame

        if (newPlayerScore <= 0) {
            setGamePhase('GAME_OVER');
        } else {
            startGame(); // Directly start next game/round
        }
    } else {
        console.warn("handleProceedAfterRoundSummary called but finalRoundScoreUpdate is null. This should not happen if modal was shown with data. Resetting to NOT_STARTED as fallback.");
        resetFullGame(); 
    }
  }, [finalRoundScoreUpdate, playerScore, startGame, resetFullGame]);



  useEffect(() => {
    if (gamePhase === 'GAME_OVER') {
      console.log("[Effect GAME_OVER] Game Over. Player Score:", playerScore);
      if (currentUser) {
         setMessage(`遊戲結束！您的最終分數: ${playerScore}。點擊「結束對戰」以上傳分數。`);
      } else {
         setMessage(`遊戲結束！您的最終分數: ${playerScore}。點擊「結束對戰」以重新開始。`);
      }
    }
  }, [gamePhase, playerScore, currentUser]);

  const handleCardClick = (card: PlayableCard, source: 'hand' | 'field') => {
    if (gamePhase !== 'PLAYER_SELECT_HAND_CARD' && gamePhase !== 'PLAYER_MATCH_HAND_TO_FIELD' && gamePhase !== 'PLAYER_MATCH_DECK_TO_FIELD') return;

    if (gamePhase === 'PLAYER_SELECT_HAND_CARD' && source === 'hand') {
      const cardsOfHandCardMonthOnField = fieldCards.filter(fc => fc.monthValue === card.monthValue);
      if (cardsOfHandCardMonthOnField.length === 3 && card.monthValue === cardsOfHandCardMonthOnField[0]?.monthValue) {
          handlePlayCardFromHand(card, undefined); 
          return;
      }
      setSelectedHandCardId(card.id);
      setMessage(`已選擇：${card.name}。請點擊場上相配的牌，或再次點擊手牌以將其放置到場上。`);
      setGamePhase('PLAYER_MATCH_HAND_TO_FIELD');
    } else if (gamePhase === 'PLAYER_MATCH_HAND_TO_FIELD') {
      const handCard = playerHand.find(c => c.id === selectedHandCardId);
      if (!handCard) return;

      if (source === 'hand' && card.id === selectedHandCardId) { 
        handlePlayCardFromHand(handCard, undefined);
      } else if (source === 'field') { 
        if (card.monthValue === handCard.monthValue) {
          handlePlayCardFromHand(handCard, card);
        } else {
          toast({ title: "月份不匹配", description: "請選擇正確的牌或將手牌放置到場上。", variant: "destructive" });
        }
      }
    } else if (gamePhase === 'PLAYER_MATCH_DECK_TO_FIELD' && source === 'field' && drawnCardForMatching) {
      if (card.monthValue === drawnCardForMatching.monthValue) {
        handlePlayerDrawnCardAction(drawnCardForMatching, card);
      } else {
        toast({ title: "月份不匹配", description: "請選擇正確的牌或點擊「放置到場上」。", variant: "destructive" });
      }
    }
  };

  const handleActionButtonClick = () => {
     if (gamePhase === 'PLAYER_MATCH_DECK_TO_FIELD' && drawnCardForMatching) {
      handlePlayerDrawnCardAction(drawnCardForMatching, undefined);
    } else if (gamePhase === 'NOT_STARTED' || gamePhase === 'GAME_OVER') {
        if (gamePhase === 'GAME_OVER' || (gamePhase === 'NOT_STARTED' && playerScore !== initialPlayerScore && currentUser)) {
            handleEndBattle(playerScore); 
        } else { 
            startGame();
        }
    }
  };

  const getActionButtonText = () => {
    if (gamePhase === 'PLAYER_MATCH_DECK_TO_FIELD' && drawnCardForMatching) return "將抽到的牌放置到場上";
    if (gamePhase === 'NOT_STARTED') {
        return (playerScore !== initialPlayerScore && currentUser) ? "結束對戰 (上傳分數)" : "開始新局";
    }
    if (gamePhase === 'GAME_OVER') return "結束對戰 (上傳分數)";
    return "等待操作";
  };

  const isActionButtonDisabled = (): boolean => {
     return (
        gamePhase !== 'PLAYER_MATCH_DECK_TO_FIELD' &&
        gamePhase !== 'NOT_STARTED' &&
        gamePhase !== 'GAME_OVER'
     ) || (gamePhase === 'PLAYER_MATCH_DECK_TO_FIELD' && !drawnCardForMatching);
  };

  const sortedPlayerCaptured = useMemo(() => [...playerCapturedCards].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder), [playerCapturedCards]);
  const sortedAiCaptured = useMemo(() => [...aiCapturedCards].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder), [aiCapturedCards]);


  useEffect(() => {
    // Handles external close of KoiKoi modal (e.g. ESC key)
    if (!isKoiKoiModalOpen && gamePhase === 'PLAYER_KOIKOI_DECISION' && significantYakuForModalDisplay) {
      console.log("[Effect KoiKoiModal External Close] Player KoiKoi modal closed without decision, defaulting to Shōbu.");
      handlePlayerKoiKoi(false); 
    }
  }, [isKoiKoiModalOpen, gamePhase, significantYakuForModalDisplay, handlePlayerKoiKoi]); 


  const handleEndBattle = useCallback(async (scoreToUploadOverride?: number) => {
    const scoreToUse = scoreToUploadOverride !== undefined ? scoreToUploadOverride : playerScore;
    console.log(`[Function Call] handleEndBattle called. Score to use: ${scoreToUse}`);
    if (currentUser) {
      const success = await updateUserGlobalScore(currentUser, scoreToUse);
      if (success) {
        toast({ title: "分數已更新", description: `您的最高分 ${scoreToUse} 已嘗試更新至全球排行榜。` });
        loadGlobalLeaderboardData(); 
      } else {
        // toast({ title: "提示", description: `目前分數 ${scoreToUse} 未超過您在全球排行榜上的最高記錄，或儲存失敗。` });
      }
    } else {
        toast({ title: "提示", description: "您未登入，無法儲存分數至全球排行榜。" });
    }
    resetFullGame(); 
    setIsRoundSummaryModalOpen(false); 
  }, [playerScore, currentUser, loadGlobalLeaderboardData, resetFullGame, toast]);


  const playerHandCanMatch = useMemo(() => {
    if (gamePhase !== 'PLAYER_SELECT_HAND_CARD') return {};
    const matches: Record<string, boolean> = {};
    playerHand.forEach(handCard => {
      if (fieldCards.some(fieldCard => fieldCard.monthValue === handCard.monthValue) ||
          (fieldCards.filter(fc => fc.monthValue === handCard.monthValue).length === 3)) {
        matches[handCard.id] = true;
      }
    });
    return matches;
  }, [playerHand, fieldCards, gamePhase]);


  return (
    <div className="container mx-auto py-4 px-2 md:px-4 max-w-10xl">
      <Card className="w-full shadow-xl border-primary/10">
        <CardHeader className="text-center relative">
          <Brain className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">花札 AI 對戰</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            與 AI 進行一場刺激的「こいこい」對決！
          </CardDescription>
          <div className="absolute top-4 right-4 flex flex-col items-end space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <User className="mr-1 h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-600">玩家分數: {playerScore}</span>
              {isOyaPlayer && gamePhase !== 'NOT_STARTED' && gamePhase !== 'GAME_OVER' && <Crown className="ml-1 h-5 w-5 text-yellow-500" title="起始玩家 (Oya)" />}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Bot className="mr-1 h-5 w-5 text-secondary" />
               <span className="font-semibold text-secondary">AI</span>
               {!isOyaPlayer && gamePhase !== 'NOT_STARTED' && gamePhase !== 'GAME_OVER' && <Crown className="ml-1 h-5 w-5 text-yellow-500" title="起始玩家 (Oya)" />}
            </div>
             {roundMultiplier > 1 && gamePhase !== 'NOT_STARTED' && gamePhase !== 'ROUND_OVER' && gamePhase !== 'GAME_OVER' && (
                <p className="text-sm font-bold text-purple-600">當前倍率: x{roundMultiplier}</p>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 border border-dashed border-border rounded-lg bg-muted/30 text-center min-h-[50px] flex items-center justify-center">
            <p className="text-foreground font-medium">{message}</p>
            {drawnCardForMatching && gamePhase === 'PLAYER_MATCH_DECK_TO_FIELD' && (
                <div className="ml-4">
                    <p className="text-xs text-muted-foreground">您抽到的牌:</p>
                    <div className="inline-block border-2 border-accent p-0.5 rounded-md bg-background shadow-sm">
                        <div className="aspect-[2/3] relative w-12 h-18 mx-auto" title={drawnCardForMatching.name}>
                            <Image src={drawnCardForMatching.image} alt={drawnCardForMatching.name} fill style={{ objectFit: "contain" }} className="rounded" data-ai-hint={drawnCardForMatching.aiHint}/>
                        </div>
                        <p className="text-[10px] text-center mt-0.5 text-muted-foreground truncate w-12">{drawnCardForMatching.name}</p>
                    </div>
                </div>
            )}
          </div>

          {/* AI Area */}
          <div className="space-y-2 p-3 border rounded-md bg-secondary/10">
            <h3 className="text-lg font-semibold text-secondary flex items-center"><Bot className="mr-2"/>AI 區域 (剩餘手牌: {aiHand.length}, 牌堆: {deck.length})</h3>
            <ScrollArea className="h-[90px] w-full p-1 bg-background/30 rounded shadow-inner">
              {sortedAiCaptured.length > 0 ? (
                <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-18 xl:grid-cols-20 2xl:grid-cols-24 gap-1">
                  {sortedAiCaptured.map(card => (
                    <div key={card.id} className="flex flex-col items-center" title={card.name}>
                       <div className="aspect-[2/3] relative w-full">
                         <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded opacity-90" data-ai-hint={card.aiHint}/>
                       </div>
                       <p className="text-[10px] text-muted-foreground text-center truncate w-full mt-0.5 leading-tight">{card.name}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground p-3 text-center text-xs">AI 尚未捕獲任何牌。</p>}
            </ScrollArea>
          </div>

          <Separator />

          {/* Field Cards */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground flex items-center"><ChevronsUpDown className="mr-2"/>場上的牌 ({fieldCards.length} 張):</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-2 bg-muted/20 rounded-md shadow-inner min-h-[100px] items-start">
              {fieldCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card, 'field')}
                  disabled={gamePhase !== 'PLAYER_MATCH_HAND_TO_FIELD' && gamePhase !== 'PLAYER_MATCH_DECK_TO_FIELD'}
                  className={cn(
                      "flex flex-col items-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent rounded shadow-sm p-1 bg-background hover:bg-accent/10",
                      (gamePhase === 'PLAYER_MATCH_HAND_TO_FIELD' && selectedHandCardId && playerHand.find(hc => hc.id === selectedHandCardId)?.monthValue === card.monthValue) && "ring-2 ring-green-500 scale-105",
                      (gamePhase === 'PLAYER_MATCH_DECK_TO_FIELD' && drawnCardForMatching?.monthValue === card.monthValue) && "ring-2 ring-blue-500 scale-105",
                      (gamePhase !== 'PLAYER_MATCH_HAND_TO_FIELD' && gamePhase !== 'PLAYER_MATCH_DECK_TO_FIELD') && "opacity-70 cursor-not-allowed"
                  )}
                  title={card.name}
                >
                  <div className="aspect-[2/3] relative w-full">
                    <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded" data-ai-hint={card.aiHint}/>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center truncate w-full mt-0.5 leading-tight">{card.name}</p>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Player Area */}
          <div className="space-y-2 p-3 border rounded-md bg-primary/5">
            <h3 className="text-lg font-semibold text-primary flex items-center"><User className="mr-2"/>您的區域 (手牌: {playerHand.length})</h3>
             <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 p-2 bg-muted/20 rounded-md shadow-inner min-h-[100px] items-start">
              {playerHand.map(card => {
                  const canMatchThisCard = playerHandCanMatch[card.id];
                  return (
                    <button
                    key={card.id}
                    onClick={() => handleCardClick(card, 'hand')}
                    disabled={gamePhase !== 'PLAYER_SELECT_HAND_CARD' && (gamePhase !== 'PLAYER_MATCH_HAND_TO_FIELD' || card.id !== selectedHandCardId)}
                    className={cn(
                        "flex flex-col items-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent rounded shadow-sm p-1 bg-background hover:bg-accent/10",
                        selectedHandCardId === card.id && gamePhase === 'PLAYER_MATCH_HAND_TO_FIELD' && "ring-4 ring-primary scale-110",
                        canMatchThisCard && gamePhase === 'PLAYER_SELECT_HAND_CARD' && "ring-2 ring-green-500",
                        (gamePhase !== 'PLAYER_SELECT_HAND_CARD' && (gamePhase !== 'PLAYER_MATCH_HAND_TO_FIELD' || card.id !== selectedHandCardId)) && "opacity-70 cursor-not-allowed"
                    )}
                    title={card.name}
                    >
                      <div className="aspect-[2/3] relative w-full">
                        <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded" data-ai-hint={card.aiHint}/>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center truncate w-full mt-0.5 leading-tight">{card.name}</p>
                    </button>
                  );
                })}
            </div>
            <h4 className="text-md font-semibold text-primary mt-3 mb-1"><Archive className="inline mr-1 h-4 w-4" /> 您已捕獲的牌 ({sortedPlayerCaptured.length} 張):</h4>
            <ScrollArea className="h-[90px] w-full p-1 bg-background/30 rounded shadow-inner">
                {sortedPlayerCaptured.length > 0 ? (
                  <div className="grid grid-cols-10 sm:grid-cols-12 md:grid-cols-15 lg:grid-cols-18 xl:grid-cols-20 2xl:grid-cols-24 gap-1">
                    {sortedPlayerCaptured.map(card => (
                        <div key={card.id} className="flex flex-col items-center" title={card.name}>
                           <div className="aspect-[2/3] relative w-full">
                             <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded opacity-90" data-ai-hint={card.aiHint}/>
                           </div>
                           <p className="text-[10px] text-muted-foreground text-center truncate w-full mt-0.5 leading-tight">{card.name}</p>
                        </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground p-3 text-center text-xs">您尚未捕獲任何牌。</p>}
            </ScrollArea>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 border-t">
          {(gamePhase === 'NOT_STARTED' || gamePhase === 'GAME_OVER') ? (
            <>
                <Button size="lg" onClick={startGame} className="bg-green-600 hover:bg-green-700 text-white">
                <Play className="mr-2 h-5 w-5" /> {gamePhase === 'GAME_OVER' ? '開始新對戰' : '開始新局'}
                </Button>
                {(gamePhase === 'GAME_OVER' || (gamePhase === 'NOT_STARTED' && playerScore !== initialPlayerScore && currentUser)) && (
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleEndBattle(playerScore)}
                        className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive-foreground"
                    >
                        <History className="mr-2 h-4 w-4" /> 結束對戰 (上傳分數)
                    </Button>
                )}
            </>
          ) : (
             <Button
                size="lg"
                onClick={handleActionButtonClick}
                disabled={isActionButtonDisabled()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Lightbulb className="mr-2 h-5 w-5" /> {getActionButtonText()}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Koi-Koi Decision Modal */}
      <Dialog
        open={isKoiKoiModalOpen}
        onOpenChange={setIsKoiKoiModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center">
              <Target className="mr-2 h-5 w-5" /> 役已達成！
            </DialogTitle>
            <DialogDescription>
              {significantYakuForModalDisplay && significantYakuForModalDisplay.yaku ?
                `您湊成了 ${significantYakuForModalDisplay.yaku.name} (${significantYakuForModalDisplay.points}點)！`
                : "您湊成了役！"}
              <br/>
              當前所有已達成役總點數為: {getAllAchievedYaku(playerCapturedCards).reduce((sum,item)=>sum+item.points,0) || 0}。
              <br/>
              當前倍率: x{roundMultiplier}。
              <br/>
              您要喊「來來」(Koi-Koi) 繼續此局，還是「勝負」(Shōbu) 結束並計分？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => handlePlayerKoiKoi(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
              來來 (Koi-Koi)
            </Button>
            <Button onClick={() => handlePlayerKoiKoi(false)} className="bg-red-500 hover:bg-red-600 text-white">
              勝負 (Shōbu)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Round Summary Modal */}
      <Dialog open={isRoundSummaryModalOpen} onOpenChange={setIsRoundSummaryModalOpen}>
        <DialogContent className="sm:max-w-md">
          {console.log("[Render RoundSummaryModal] Open:", isRoundSummaryModalOpen, "Data:", JSON.stringify(roundSummaryData))}
          <DialogHeader>
            <DialogTitle className="text-accent flex items-center">
              <Trophy className="mr-2 h-6 w-6" /> 本回合結果
            </DialogTitle>
            {roundSummaryData && (
              <DialogDescription className="pt-2 space-y-2">
                <div className="text-lg font-semibold text-foreground">
                  {roundSummaryData.winnerDisplay.includes("玩家") ? "恭喜您，本回合獲勝！" :
                   roundSummaryData.winnerDisplay.includes("AI") ? "可惜，本回合由 AI 獲勝。" :
                   roundSummaryData.winnerDisplay === "平手 (無役)" ? "本回合平手，無人成役。" :
                   roundSummaryData.winnerDisplay === "平手 (同分)" ? "本回合平手，雙方同分。" :
                   roundSummaryData.winnerDisplay.includes("親權") ? `本回合由 ${roundSummaryData.winnerDisplay} 贏得親權。` :
                   roundSummaryData.winnerDisplay
                  }
                </div>
                {roundSummaryData.roundScore > 0 && (
                  <div className="text-foreground">
                    {roundSummaryData.winnerDisplay.includes("玩家") ? "您" : (roundSummaryData.winnerDisplay.includes("AI") ? "AI" : roundSummaryData.winnerDisplay)} 獲得 {roundSummaryData.roundScore} 分。
                    {finalRoundScoreUpdate && ` (您的總分: ${playerScore + finalRoundScoreUpdate.playerScoreChange})`}
                  </div>
                )}
                 {roundSummaryData.achievedYaku && roundSummaryData.achievedYaku.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-foreground mb-1 flex items-center"><ListChecks className="mr-2 h-5 w-5 text-muted-foreground"/>達成的役：</h4>
                    <ScrollArea className="max-h-[150px] pr-3 border rounded-md p-2 bg-muted/20">
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {roundSummaryData.achievedYaku.map((yakuItem, index) => (
                            <li key={index}>
                            {yakuItem.name} ({yakuItem.points} 點)
                            {yakuItem.contributingCards && yakuItem.contributingCards.length > 0 && (
                                <span className="text-xs block ml-2">
                                (包含: {yakuItem.contributingCards.map(c => c.name).join(', ')})
                                </span>
                            )}
                            </li>
                        ))}
                        </ul>
                    </ScrollArea>
                  </div>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="mt-4 sm:justify-between">
            <Button
                variant="outline"
                onClick={() => {
                  const scoreForThisBattleEnd = playerScore + (finalRoundScoreUpdate?.playerScoreChange || 0);
                  handleEndBattle(scoreForThisBattleEnd);
                }}
                className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive-foreground"
                >
                <History className="mr-2 h-4 w-4" /> 結束對戰
            </Button>
            <Button
                onClick={() => {
                    handleProceedAfterRoundSummary();
                }}
                className="w-full sm:w-auto bg-primary hover:bg-primary/80 text-primary-foreground mt-2 sm:mt-0"
               >
                 {(playerScore + (finalRoundScoreUpdate?.playerScoreChange || 0)) <= 0 ? "查看最終結果" : "下一局"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global Leaderboard Section */}
      <Card className="mt-8 w-full shadow-lg border-accent/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-accent flex items-center">
            <BarChart3 className="mr-3 h-7 w-7" /> 全球排行榜
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            與所有玩家一較高下！(分數儲存於 Firebase Firestore)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingLeaderboard ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="ml-3 text-muted-foreground">載入排行榜中...</p>
            </div>
          ) : globalLeaderboard.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px] text-center">排名</TableHead>
                  <TableHead>玩家</TableHead>
                  <TableHead className="text-right">最高分</TableHead>
                  <TableHead className="text-right">記錄日期</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {globalLeaderboard.map((entry, index) => (
                  <TableRow key={entry.userId || index}>
                    <TableCell className="font-medium text-center">{index + 1}</TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell className="text-right">{entry.score}</TableCell>
                    <TableCell className="text-right">{entry.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              排行榜尚無記錄。完成一場對戰來記錄您的分數！
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    
