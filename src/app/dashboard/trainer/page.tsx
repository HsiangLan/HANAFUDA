
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Target, Play, Shuffle, Archive, CheckCircle, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { auth } from '@/lib/firebase';
import { recordYakuPractice, type UserProgressData, type YakuPracticeStats } from '@/lib/user-progress';

export interface PlayableCard {
  id: string;
  name: string;
  image: string;
  monthDisplay: string;
  monthValue: number;
  typeDisplay: string;
  aiHint: string;
  sortOrder: number;
}

export interface YakuDefinition {
  id: string;
  name: string;
  description: string;
  requiredCardNames: string[];
  points: number; 
  customChecker?: (capturedCards: PlayableCard[], yakuDef: YakuDefinition) => boolean;
}

const brightCardNames = ["松上鶴", "櫻上幕簾", "芒上月", "柳間小野道風", "桐上鳳凰"];
const rainManCardName = "柳間小野道風";

const checkSanko: YakuDefinition['customChecker'] = (captured) => {
  const capturedBrightNonRainMan = captured.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName);
  return capturedBrightNonRainMan.length >= 3;
};
const checkShiko: YakuDefinition['customChecker'] = (captured) => {
  const capturedBrightNonRainMan = captured.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName);
  return capturedBrightNonRainMan.length >= 4;
};
const checkAmeShiko: YakuDefinition['customChecker'] = (captured) => {
  const capturedBright = captured.filter(c => brightCardNames.includes(c.name));
  const hasRainMan = capturedBright.some(c => c.name === rainManCardName);
  return capturedBright.length >= 4 && hasRainMan;
};
const checkGoko: YakuDefinition['customChecker'] = (captured) => {
  return brightCardNames.every(bcn => captured.some(cc => cc.name === bcn));
};


const yakuList: YakuDefinition[] = [
  { id: 'inoshikacho', name: '豬鹿蝶 (Ino-Shika-Chō)', description: '收集代表山豬（荻間豬）、鹿（楓間鹿）和蝴蝶（牡丹上蝶）的三張種牌。', requiredCardNames: ['荻間豬', '楓間鹿', '牡丹上蝶'], points: 5 },
  { id: 'akatan', name: '赤短 (Akatan - Red Poetry Ribbons)', description: '收集所有三張帶有日文詩句的紅色短冊牌（松上赤短、梅上赤短、櫻上赤短）。', requiredCardNames: ['松上赤短', '梅上赤短', '櫻上赤短'], points: 5 },
  { id: 'aotan', name: '青短 (Aotan - Blue Ribbons)', description: '收集所有三張藍色（或紫色）的短冊牌（牡丹上青短、菊上青短、楓間青短）。', requiredCardNames: ['牡丹上青短', '菊上青短', '楓間青短'], points: 5 },
  { id: 'sanko', name: '三光 (Sankō - Three Bright)', description: '收集三張光牌（不含柳間小野道風「雨中人」）。', requiredCardNames: brightCardNames.filter(name => name !== rainManCardName), points: 5, customChecker: checkSanko },
  { id: 'hanami', name: '花見酒 (Hanami-zake - Flower Viewing Sake)', description: '收集「櫻上幕簾」和「菊上杯」兩張牌。', requiredCardNames: ['櫻上幕簾', '菊上杯'], points: 5 },
  { id: 'tsukimi', name: '月見酒 (Tsukimi-zake - Moon Viewing Sake)', description: '收集「芒上月」和「菊上杯」兩張牌。', requiredCardNames: ['芒上月', '菊上杯'], points: 5 },
  { id: 'ameshiko', name: '雨四光 (Ame-Shikō - Rainy Four Bright)', description: '收集四張光牌，且必須包含柳間小野道風「雨中人」。', requiredCardNames: brightCardNames, points: 7, customChecker: checkAmeShiko },
  { id: 'shiko', name: '四光 (Shikō - Four Bright)', description: '收集四張光牌（不含柳間小野道風「雨中人」）。', requiredCardNames: brightCardNames.filter(name => name !== rainManCardName), points: 8, customChecker: checkShiko },
  { id: 'goko', name: '五光 (Gokō - Five Bright)', description: '收集全部五張光牌。', requiredCardNames: brightCardNames, points: 10, customChecker: checkGoko },
];

const generateFullDeck = (): PlayableCard[] => {
  const deck: PlayableCard[] = [];
  const months = [
    { value: 1, name: "一月", display: "松", types: ["光", "短冊", "滓", "滓"], names: ["松上鶴", "松上赤短", "松雜牌1", "松雜牌2"], images: ["松上鶴.jpeg", "松上赤短.jpeg", "松雜牌1.jpeg", "松雜牌2.jpeg"], aiHints: ["crane sun", "pine ribbon", "pine kasu", "pine kasu"] },
    { value: 2, name: "二月", display: "梅", types: ["種", "短冊", "滓", "滓"], names: ["梅上鶯", "梅上赤短", "梅雜牌1", "梅雜牌2"], images: ["梅上鶯.jpeg", "梅上赤短.jpeg", "梅雜牌1.jpeg", "梅雜牌2.jpeg"], aiHints: ["bush warbler", "plum ribbon", "plum kasu", "plum kasu"] },
    { value: 3, name: "三月", display: "櫻", types: ["光", "短冊", "滓", "滓"], names: ["櫻上幕簾", "櫻上赤短", "櫻雜牌1", "櫻雜牌2"], images: ["櫻上幕簾.jpeg", "櫻上赤短.jpeg", "櫻雜牌1.jpeg", "櫻雜牌2.jpeg"], aiHints: ["cherry curtain", "cherry ribbon", "cherry kasu", "cherry kasu"] },
    { value: 4, name: "四月", display: "藤", types: ["種", "短冊", "滓", "滓"], names: ["藤上杜鵑", "藤上短冊", "藤雜牌1", "藤雜牌2"], images: ["藤上杜鵑.jpeg", "藤上短冊.jpeg", "藤雜牌1.jpeg", "藤雜牌2.jpeg"], aiHints: ["cuckoo wisteria", "wisteria ribbon", "wisteria kasu", "wisteria kasu"] },
    { value: 5, name: "五月", display: "菖蒲", types: ["種", "短冊", "滓", "滓"], names: ["菖蒲上八橋", "菖蒲上短冊", "菖蒲雜牌1", "菖蒲雜牌2"], images: ["菖蒲上八橋.jpeg", "菖蒲上短冊.jpeg", "菖蒲雜牌1.jpeg", "菖蒲雜牌2.jpeg"], aiHints: ["iris bridge", "iris ribbon", "iris kasu", "iris kasu"] },
    { value: 6, name: "六月", display: "牡丹", types: ["種", "短冊", "滓", "滓"], names: ["牡丹上蝶", "牡丹上青短", "牡丹雜牌1", "牡丹雜牌2"], images: ["牡丹上蝶.jpeg", "牡丹上青短.jpeg", "牡丹雜牌1.jpeg", "牡丹雜牌2.jpeg"], aiHints: ["peony butterflies", "peony ribbon", "peony kasu", "peony kasu"] },
    { value: 7, name: "七月", display: "荻", types: ["種", "短冊", "滓", "滓"], names: ["荻間豬", "荻上短冊", "荻雜牌1", "荻雜牌2"], images: ["荻間豬.jpeg", "荻上短冊.jpeg", "荻雜牌1.jpeg", "荻雜牌2.jpeg"], aiHints: ["boar clover", "clover ribbon", "clover kasu", "clover kasu"] },
    { value: 8, name: "八月", display: "芒", types: ["光", "種", "滓", "滓"], names: ["芒上月", "芒上雁", "芒雜牌1", "芒雜牌2"], images: ["芒上月.jpeg", "芒上雁.jpeg", "芒雜牌1.jpeg", "芒雜牌2.jpeg"], aiHints: ["moon pampas", "geese pampas", "pampas kasu", "pampas kasu"] },
    { value: 9, name: "九月", display: "菊", types: ["種", "短冊", "滓", "滓"], names: ["菊上杯", "菊上青短", "菊雜牌1", "菊雜牌2"], images: ["菊上杯.jpeg", "菊上青短.jpeg", "菊雜牌1.jpeg", "菊雜牌2.jpeg"], aiHints: ["sake cup", "chrysanthemum ribbon", "chrysanthemum kasu", "chrysanthemum kasu"] },
    { value: 10, name: "十月", display: "楓", types: ["種", "短冊", "滓", "滓"], names: ["楓間鹿", "楓間青短", "楓雜牌1", "楓雜牌2"], images: ["楓間鹿.jpeg", "楓間青短.jpeg", "楓雜牌1.jpeg", "楓雜牌2.jpeg"], aiHints: ["deer maple", "maple ribbon", "maple kasu", "maple kasu"] },
    { value: 11, name: "十一月", display: "柳", types: ["光", "種", "短冊", "滓"], names: ["柳間小野道風", "柳上燕", "柳間短冊", "柳雜牌1"], images: ["柳間小野道風.jpeg", "柳上燕.jpeg", "柳間短冊.jpeg", "柳雜牌.jpeg"], aiHints: ["rainman willow", "swallow willow", "willow ribbon", "willow kasu thunder"] },
    { value: 12, name: "十二月", display: "桐", types: ["光", "滓", "滓", "滓"], names: ["桐上鳳凰", "桐雜牌1", "桐雜牌2", "桐雜牌3"], images: ["桐上鳳凰.jpeg", "桐雜牌1.jpeg", "桐雜牌2.jpeg", "桐雜牌3.jpeg"], aiHints: ["phoenix paulownia", "paulownia kasu", "paulownia kasu", "paulownia kasu"] },
  ];
  
  let sortOrderCounter = 1;
  months.forEach(month => {
    month.types.forEach((type, index) => {
      const cardName = month.names[index];
      const imageName = month.images[index]; 
      const aiHint = month.aiHints[index];
      deck.push({
        id: `${month.display}-${type}-${index + 1}-${cardName}`, 
        name: cardName, 
        image: `/images/hanafuda/${imageName}`, 
        monthDisplay: month.name,
        monthValue: month.value,
        typeDisplay: type === "滓" ? "粕牌" : (type === "光" ? "光牌" : (type === "種" ? "種牌" : "短冊牌")),
        aiHint: aiHint,
        sortOrder: sortOrderCounter++,
      });
    });
  });
  return deck;
};


type TurnPhase = 'SELECT_HAND_CARD' | 'MATCH_HAND_TO_FIELD' | 'DRAW_AND_EVAL_DECK_CARD' | 'MATCH_DECK_TO_FIELD' | 'YAKU_FORMED' | 'NO_MOVES_LEFT' | 'NOT_STARTED';


export default function TrainerPage() {
  const [deck, setDeck] = useState<PlayableCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayableCard[]>([]);
  const [fieldCards, setFieldCards] = useState<PlayableCard[]>([]);
  const [capturedCards, setCapturedCards] = useState<PlayableCard[]>([]);
  
  const [selectedYakuId, setSelectedYakuId] = useState<string>(yakuList[0]?.id || "");
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [drawnCardForMatching, setDrawnCardForMatching] = useState<PlayableCard | null>(null);
  
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('NOT_STARTED');
  const [message, setMessage] = useState("選擇一個牌型進行練習，然後點擊「開始練習」。");
  const [yakuCompletionMessage, setYakuCompletionMessage] = useState<string | null>(null);
  const [isGameInitialized, setIsGameInitialized] = useState(false);


  const { toast } = useToast();
  const fullMasterDeck = useMemo(() => generateFullDeck(), []);

  const logMove = useCallback((moveDescription: string) => {
    console.log(moveDescription); 
  }, []);
  
  const currentYaku = useMemo(() => {
    return yakuList.find(y => y.id === selectedYakuId);
  }, [selectedYakuId]);


  const checkYaku = useCallback(() => {
    if (!currentYaku) return false;
    
    if (currentYaku.customChecker) {
      return currentYaku.customChecker(capturedCards, currentYaku);
    }

    const achieved = currentYaku.requiredCardNames.every(requiredName =>
      capturedCards.some(capturedCard => capturedCard.name === requiredName)
    );
    return achieved;
  }, [currentYaku, capturedCards]);

  const startGame = useCallback((yakuId: string) => {
    setIsGameInitialized(false);
    setSelectedYakuId(yakuId); 
    setPlayerHand([]);
    setFieldCards([]);
    setCapturedCards([]);
    setSelectedHandCardId(null);
    setDrawnCardForMatching(null);
    setYakuCompletionMessage(null);
    
    const yakuToPractice = yakuList.find(y => y.id === yakuId);

    if (!yakuToPractice) {
      setMessage("錯誤：找不到所選的牌型。");
      setTurnPhase('NOT_STARTED');
      return;
    }

    setMessage(`目標牌型：${yakuToPractice.name}。請湊齊所需的牌。`);
    
    let tempDeckSource = [...fullMasterDeck]; 
    let finalPlayerHand: PlayableCard[] = [];
    let finalFieldCards: PlayableCard[] = [];
    let finalDrawPile: PlayableCard[] = [];

    let targetCardsForYaku: PlayableCard[] = [];
    
    if (yakuToPractice.customChecker) {
        const allCardsCopy = [...fullMasterDeck]; 
        if (yakuToPractice.id === 'sanko') {
            targetCardsForYaku = allCardsCopy.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName).slice(0, 3);
        } else if (yakuToPractice.id === 'shiko') {
            targetCardsForYaku = allCardsCopy.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName).slice(0, 4);
        } else if (yakuToPractice.id === 'ameshiko') {
            const rainMan = allCardsCopy.find(c => c.name === rainManCardName);
            const otherBrights = allCardsCopy.filter(c => brightCardNames.includes(c.name) && c.name !== rainManCardName);
            if (rainMan && otherBrights.length >= 3) {
                 targetCardsForYaku = [rainMan, ...otherBrights.slice(0, 3)];
            } else { 
                targetCardsForYaku = allCardsCopy.filter(c => brightCardNames.includes(c.name)).slice(0,4); 
            }
        } else if (yakuToPractice.id === 'goko') {
            targetCardsForYaku = allCardsCopy.filter(c => brightCardNames.includes(c.name));
        } else { 
             targetCardsForYaku = yakuToPractice.requiredCardNames
                .map(name => allCardsCopy.find(c => c.name === name))
                .filter((card): card is PlayableCard => card !== undefined);
        }
    } else { 
         targetCardsForYaku = yakuToPractice.requiredCardNames
            .map(name => [...fullMasterDeck].find(c => c.name === name)) 
            .filter((card): card is PlayableCard => card !== undefined);
    }

    tempDeckSource = tempDeckSource.filter(c => !targetCardsForYaku.some(tc => tc.id === c.id));
    
    let partnerCards: PlayableCard[] = [];
    targetCardsForYaku.forEach(targetCard => {
        let partner = tempDeckSource.find(c => c.monthValue === targetCard.monthValue && c.id !== targetCard.id);
        if (partner) {
            partnerCards.push(partner);
            tempDeckSource = tempDeckSource.filter(c => c.id !== partner!.id); 
        } else {
            const backupPartner = [...fullMasterDeck].find(c => 
                c.monthValue === targetCard.monthValue && 
                c.id !== targetCard.id && 
                !targetCardsForYaku.some(tc => tc.id === c.id) && 
                !partnerCards.some(pc => pc.id === c.id)
            );
            if (backupPartner) {
                 partnerCards.push(backupPartner);
                 tempDeckSource = tempDeckSource.filter(c => c.id !== backupPartner.id);
            }
        }
    });
    
    const allScenarioCards = [...targetCardsForYaku, ...partnerCards];
    tempDeckSource = [...fullMasterDeck].filter(c => !allScenarioCards.some(sc => sc.id === c.id));
    tempDeckSource.sort((a, b) => a.sortOrder - b.sortOrder);


    targetCardsForYaku.forEach((target, i) => {
        const partner = partnerCards.find(p => p.monthValue === target.monthValue && !finalPlayerHand.some(card=>card.id === p.id) && !finalFieldCards.some(card=>card.id === p.id));
        
        if (i % 2 === 0 && finalPlayerHand.length < 8) { 
            finalPlayerHand.push(target);
            if (partner && finalFieldCards.length < 8) {
                finalFieldCards.push(partner);
            } else if (partner) { 
                 tempDeckSource.unshift(partner); 
            }
        } else if (finalFieldCards.length < 8) { 
            finalFieldCards.push(target);
             if (partner && finalPlayerHand.length < 8) {
                finalPlayerHand.push(partner);
            } else if (partner) {
                 tempDeckSource.unshift(partner);
            }
        } else if (finalPlayerHand.length < 8) { 
            finalPlayerHand.push(target);
            if (partner) tempDeckSource.unshift(partner);
        } else { 
            tempDeckSource.unshift(target);
            if (partner) tempDeckSource.unshift(partner);
        }
        if(partner) partnerCards = partnerCards.filter(p => p.id !== partner!.id); 
    });
    
    tempDeckSource.sort((a, b) => a.sortOrder - b.sortOrder); 

    while (finalPlayerHand.length < 8 && tempDeckSource.length > 0) {
        finalPlayerHand.push(tempDeckSource.shift()!);
    }
    while (finalFieldCards.length < 8 && tempDeckSource.length > 0) {
        finalFieldCards.push(tempDeckSource.shift()!);
    }

    finalDrawPile = tempDeckSource; 

    setPlayerHand(finalPlayerHand.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    setFieldCards(finalFieldCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    setDeck(finalDrawPile); 
    setTurnPhase('SELECT_HAND_CARD');
    
    if (auth.currentUser && yakuToPractice) {
        recordYakuPractice(auth.currentUser.uid, yakuToPractice.id, yakuToPractice.name, "/dashboard/trainer", false); 
    }
    logMove(`練習開始：${yakuToPractice.name}。`);
    
    setTimeout(() => setIsGameInitialized(true), 0);
  }, [fullMasterDeck, logMove]); 


  const proceedToDrawPhase = useCallback(() => {
    if (deck.length > 0) {
      const currentDeck = [...deck];
      const cardDrawn = currentDeck.shift()!;
      setDeck(currentDeck);
      setDrawnCardForMatching(cardDrawn);
      logMove(`玩家抽牌：抽到 '${cardDrawn.name}'。`);
      
      const potentialMatchesOnField = fieldCards.filter(fc => fc.monthValue === cardDrawn.monthValue);
      if (potentialMatchesOnField.length > 0) {
        setMessage(`您抽到牌：${cardDrawn.name}。請點擊場上相配的牌，或點擊「放置到場上」。`);
        setTurnPhase('MATCH_DECK_TO_FIELD');
      } else { 
        setFieldCards(prev => [...prev, cardDrawn].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
        setDrawnCardForMatching(null);
        logMove(`玩家抽牌：抽到的 '${cardDrawn.name}' 無配對，放置到場上。`);
        
        if (checkYaku()) {
          setTurnPhase('YAKU_FORMED');
        } else if (playerHand.length === 0 && deck.length === 0) { 
          setTurnPhase('NO_MOVES_LEFT');
        } else if (playerHand.length === 0 && deck.length > 0) { 
          setTurnPhase('DRAW_AND_EVAL_DECK_CARD'); 
          setMessage("手牌已空，從牌堆抽牌...");
        } else {
          setTurnPhase('SELECT_HAND_CARD'); 
          setMessage("您的回合，請從手中選牌。");
        }
      }
    } else { 
      logMove("玩家回合：牌堆已空，跳過抽牌。");
      if (checkYaku()) {
        setTurnPhase('YAKU_FORMED');
      } else if (playerHand.length === 0) { 
        setTurnPhase('NO_MOVES_LEFT');
      } else {
         // This case should ideally not be hit if NO_MOVES_LEFT covers playerHand empty and deck empty
        setTurnPhase('SELECT_HAND_CARD'); 
        setMessage("您的回合，請從手中選牌。");
      }
    }
  }, [deck, fieldCards, playerHand.length, logMove, checkYaku, setMessage, setDeck, setDrawnCardForMatching, setFieldCards, setTurnPhase, capturedCards, currentYaku]); 

  
  useEffect(() => {
    if (turnPhase === 'DRAW_AND_EVAL_DECK_CARD') {
      proceedToDrawPhase();
    }
  }, [turnPhase, proceedToDrawPhase]);


  const handlePlayCardFromHand = useCallback((handCard: PlayableCard, fieldCardToMatch?: PlayableCard) => {
    const newPlayerHand = playerHand.filter(c => c.id !== handCard.id);
    setPlayerHand(newPlayerHand.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
    
    let newCapturedCards = [...capturedCards];
    if (fieldCardToMatch) {
      setFieldCards(prev => prev.filter(c => c.id !== fieldCardToMatch.id).sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      newCapturedCards = [...newCapturedCards, handCard, fieldCardToMatch];
      setCapturedCards(newCapturedCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      logMove(`玩家：打出 '${handCard.name}' 配對場上的 '${fieldCardToMatch.name}'。捕獲兩張。`);
    } else {
      setFieldCards(prev => [...prev, handCard].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      logMove(`玩家：打出 '${handCard.name}' 到場上 (無配對)。`);
    }
    setSelectedHandCardId(null);
    
    if (currentYaku?.customChecker ? currentYaku.customChecker(newCapturedCards, currentYaku) : currentYaku?.requiredCardNames.every(name => newCapturedCards.some(cc => cc.name === name))) {
        setTurnPhase('YAKU_FORMED');
    } else {
        if (newPlayerHand.length === 0 && deck.length === 0) {
             setTurnPhase('NO_MOVES_LEFT'); 
        } else { 
            setTurnPhase('DRAW_AND_EVAL_DECK_CARD');
            setMessage(newPlayerHand.length === 0 ? "手牌已空，從牌堆抽牌..." : "接下來從牌堆抽牌...");
        }
    }
  }, [logMove, playerHand, deck.length, capturedCards, currentYaku, setPlayerHand, setFieldCards, setCapturedCards, setSelectedHandCardId, setTurnPhase, setMessage]); 


  const handleDrawAndMatch = useCallback((deckCard: PlayableCard, fieldCardToMatch?: PlayableCard) => {
    let newCapturedCards = [...capturedCards];
    if (fieldCardToMatch) {
      setFieldCards(prev => prev.filter(c => c.id !== fieldCardToMatch.id).sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      newCapturedCards = [...newCapturedCards, deckCard, fieldCardToMatch];
      setCapturedCards(newCapturedCards.sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      logMove(`玩家抽牌：抽到的 '${deckCard.name}' 配對場上的 '${fieldCardToMatch.name}'。捕獲兩張。`);
    } else {
      setFieldCards(prev => [...prev, deckCard].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder));
      logMove(`玩家抽牌：抽到的 '${deckCard.name}' 無配對，放置到場上。`);
    }
    setDrawnCardForMatching(null);
    
    if (currentYaku?.customChecker ? currentYaku.customChecker(newCapturedCards, currentYaku) : currentYaku?.requiredCardNames.every(name => newCapturedCards.some(cc => cc.name === name))) {
      setTurnPhase('YAKU_FORMED');
    } else {
      if (playerHand.length === 0 && deck.length === 0) {
         setTurnPhase('NO_MOVES_LEFT'); 
      } else if (playerHand.length === 0 && deck.length > 0) { 
          setTurnPhase('DRAW_AND_EVAL_DECK_CARD'); 
          setMessage("手牌已空，從牌堆抽牌...");
      } else if (playerHand.length > 0) { 
         setTurnPhase('SELECT_HAND_CARD');
         setMessage("您的回合，請從手中選牌。");
      } else { // Should be covered by playerHand.length === 0 && deck.length === 0
          setTurnPhase('NO_MOVES_LEFT');
          setMessage("已無牌可動。");
      }
    }
  }, [playerHand.length, deck.length, logMove, capturedCards, currentYaku, setFieldCards, setCapturedCards, setDrawnCardForMatching, setTurnPhase, setMessage]); 


  useEffect(() => {
    if (turnPhase === 'YAKU_FORMED' && currentYaku) {
      const yakuName = currentYaku.name;
      setYakuCompletionMessage(`恭喜！您已成功湊齊牌型：${yakuName}！`);
      toast({ title: "牌型完成！", description: `您已湊齊 ${yakuName}。` });
      if (auth.currentUser) {
         recordYakuPractice(auth.currentUser.uid, currentYaku.id, currentYaku.name, "/dashboard/trainer", true);
      }
    }
  }, [turnPhase, currentYaku, toast]);
  
  
  useEffect(() => {
    if (isGameInitialized && turnPhase !== 'YAKU_FORMED' && turnPhase !== 'NO_MOVES_LEFT' && playerHand.length === 0 && deck.length === 0) {
        if (!checkYaku()) { // Check Yaku one last time
            setTurnPhase('NO_MOVES_LEFT');
        } else {
            setTurnPhase('YAKU_FORMED'); 
        }
    }
  }, [isGameInitialized, turnPhase, playerHand.length, deck.length, checkYaku, setTurnPhase]);

  
  useEffect(() => {
    if (turnPhase === 'NO_MOVES_LEFT') {
        if (!checkYaku()) { 
            const yakuName = currentYaku?.name || "選定的牌型";
            const failMessage = `練習失敗：您已無牌可出，牌堆也已抽完，但未完成目標牌型「${yakuName}」。`;
            setYakuCompletionMessage(failMessage);
            toast({ title: "練習結束", description: failMessage, variant: "destructive" });
            // Record failed attempt for yaku practice
            if (auth.currentUser && currentYaku) {
                // Note: startGame already records an attempt (as success=false). 
                // This ensures the "lastAttempted" is updated even on failure by running out of cards.
                // recordYakuPractice(auth.currentUser.uid, currentYaku.id, currentYaku.name, "/dashboard/trainer", false); 
            }
        } else {
            // If NO_MOVES_LEFT is reached but Yaku is somehow completed by the very last card placing (without explicit YAKU_FORMED transition)
             const yakuName = currentYaku?.name || "選定的牌型";
             setYakuCompletionMessage(`恭喜！您已成功湊齊牌型：${yakuName}！`);
             toast({ title: "牌型完成！", description: `您已湊齊 ${yakuName}。` });
             if (auth.currentUser && currentYaku) {
                recordYakuPractice(auth.currentUser.uid, currentYaku.id, currentYaku.name, "/dashboard/trainer", true);
             }
        }
    }
  }, [turnPhase, checkYaku, currentYaku, toast, setYakuCompletionMessage]);


  const handleCardClick = (card: PlayableCard, source: 'hand' | 'field') => {
    if (turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED') return;

    if (turnPhase === 'SELECT_HAND_CARD' && source === 'hand') {
      setSelectedHandCardId(card.id);
      setMessage(`已選擇：${card.name}。請點擊場上相配的牌，或再次點擊手牌以將其放置到場上。`);
      setTurnPhase('MATCH_HAND_TO_FIELD');
    } else if (turnPhase === 'MATCH_HAND_TO_FIELD') {
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
    } else if (turnPhase === 'MATCH_DECK_TO_FIELD' && source === 'field' && drawnCardForMatching) {
      if (card.monthValue === drawnCardForMatching.monthValue) {
        handleDrawAndMatch(drawnCardForMatching, card);
      } else {
        toast({ title: "月份不匹配", description: "請選擇正確的牌或點擊「放置到場上」。", variant: "destructive" });
      }
    }
  };
  
  const handleActionButtonClick = () => {
    if (turnPhase === 'MATCH_DECK_TO_FIELD' && drawnCardForMatching) { 
      handleDrawAndMatch(drawnCardForMatching, undefined);
    } else if (turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED') {
       if (selectedYakuId) { 
         startGame(selectedYakuId);
       } else {
         toast({title: "請先選擇牌型", description: "請從下拉選單中選擇一個牌型開始練習。"})
       }
    }
  };
  
  const getActionButtonText = () => {
    if (turnPhase === 'MATCH_DECK_TO_FIELD' && drawnCardForMatching) return "將抽到的牌放置到場上";
    if (turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED') {
        return selectedYakuId ? `開始練習：${currentYaku?.name || '選定牌型'}` : "選擇牌型開始";
    }
    return "等待操作"; 
  };

   const getActionButtonIcon = () => {
    if (turnPhase === 'MATCH_DECK_TO_FIELD' && drawnCardForMatching) return <Archive className="mr-2 h-5 w-5" />;
    if (turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED') return <Play className="mr-2 h-5 w-5" />;
    return <Lightbulb className="mr-2 h-5 w-5" />;
  };
  
  const isActionButtonDisabled = (): boolean => {
     return turnPhase === 'SELECT_HAND_CARD' || 
            turnPhase === 'MATCH_HAND_TO_FIELD' || 
            turnPhase === 'DRAW_AND_EVAL_DECK_CARD' ||
            (turnPhase === 'NOT_STARTED' && !selectedYakuId); 
  };
  
  useEffect(() => {
    if (!selectedYakuId && yakuList.length > 0) {
      setSelectedYakuId(yakuList[0].id);
    }
  }, [selectedYakuId]);

  const sortedCapturedCards = [...capturedCards].sort((a,b) => a.monthValue - b.monthValue || a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6 p-2 md:p-4 max-w-10xl mx-auto">
      <Card className="w-full shadow-xl border-primary/10">
        <CardHeader className="text-center">
          <Target className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">花札情境練習</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            選擇一個目標牌型 (役) 並嘗試湊齊它。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Label htmlFor="yaku-select" className="text-md font-semibold text-secondary whitespace-nowrap">練習目標牌型：</Label>
            <Select
              value={selectedYakuId} 
              onValueChange={(value) => {
                 if (value) { 
                    setSelectedYakuId(value);
                    setTurnPhase('NOT_STARTED'); 
                    setMessage("已選擇新的目標牌型。點擊開始練習。");
                    setYakuCompletionMessage(null);
                    setIsGameInitialized(false); 
                 }
              }}
            >
              <SelectTrigger id="yaku-select" className="w-full sm:w-auto min-w-[250px] bg-muted/30 border-primary/50 text-primary">
                <SelectValue placeholder="選擇一個牌型..." />
              </SelectTrigger>
              <SelectContent>
                {yakuList.map(yaku => (
                  <SelectItem key={yaku.id} value={yaku.id}>
                    {yaku.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentYaku && (
            <Card className="bg-accent/10 border-accent p-4">
              <CardTitle className="text-xl text-accent-foreground mb-1">{currentYaku.name}</CardTitle>
              <CardDescription className="text-sm text-accent-foreground/80">{currentYaku.description}</CardDescription>
              <p className="text-xs text-accent-foreground/70 mt-2">
                需要牌張：{currentYaku.customChecker ? '(依特殊規則判斷)' : currentYaku.requiredCardNames.join('、')}
              </p>
            </Card>
          )}
          
          {yakuCompletionMessage && (
             <div className={`p-4 border rounded-lg text-center min-h-[60px] flex items-center justify-center ${yakuCompletionMessage.includes("恭喜") ? 'border-green-500 bg-green-500/10 text-green-700' : 'border-red-500 bg-red-500/10 text-red-700'}`}>
                {yakuCompletionMessage.includes("恭喜") ? <CheckCircle className="mr-2 h-5 w-5"/> : <AlertTriangle className="mr-2 h-5 w-5"/>}
                <p className="font-semibold">{yakuCompletionMessage}</p>
             </div>
          )}

          {(turnPhase !== 'NOT_STARTED' && turnPhase !== 'YAKU_FORMED' && turnPhase !== 'NO_MOVES_LEFT' && !yakuCompletionMessage) && (
            <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30 text-center min-h-[60px] flex flex-col justify-center items-center">
                <p className="text-foreground font-semibold">{message}</p>
                {drawnCardForMatching && turnPhase === 'MATCH_DECK_TO_FIELD' && (
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground">您抽到的牌:</p>
                        <div className="inline-block border-2 border-accent p-1 rounded-md bg-background shadow-md">
                            <div className="aspect-[2/3] relative w-16 h-24 mx-auto" title={drawnCardForMatching.name}>
                                <Image src={drawnCardForMatching.image} alt={drawnCardForMatching.name} fill style={{ objectFit: "contain" }} className="rounded" data-ai-hint={drawnCardForMatching.aiHint}/>
                            </div>
                            <p className="text-xs text-center mt-1 text-muted-foreground">{drawnCardForMatching.name}</p>
                        </div>
                    </div>
                )}
            </div>
          )}
          
          
          <div className="my-4">
            <h3 className="text-xl font-semibold text-secondary mb-2">場上的牌 ({fieldCards.length} 張):</h3>
            {fieldCards.length > 0 || turnPhase === 'NOT_STARTED' ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-3 bg-background rounded-md shadow-inner min-h-[100px]">
                {fieldCards.map(card => (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card, 'field')}
                    disabled={turnPhase === 'SELECT_HAND_CARD' || turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED' || turnPhase === 'DRAW_AND_EVAL_DECK_CARD'}
                    className={cn(
                        "flex flex-col items-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent rounded shadow p-1",
                        selectedHandCardId && playerHand.find(hc => hc.id === selectedHandCardId)?.monthValue === card.monthValue && turnPhase === 'MATCH_HAND_TO_FIELD' && "ring-2 ring-green-500 scale-105",
                        drawnCardForMatching?.monthValue === card.monthValue && turnPhase === 'MATCH_DECK_TO_FIELD' && "ring-2 ring-blue-500 scale-105",
                        (turnPhase === 'SELECT_HAND_CARD' || turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED' || turnPhase === 'DRAW_AND_EVAL_DECK_CARD') && "opacity-70 cursor-not-allowed"
                    )}
                    title={card.name}
                  >
                    <div className="aspect-[2/3] relative w-full">
                      <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded" data-ai-hint={card.aiHint}/>
                    </div>
                    <p className="text-xs text-muted-foreground text-center truncate w-full mt-1 leading-tight">{card.name}</p>
                  </button>
                ))}
              </div>
            ) : (turnPhase !== 'NOT_STARTED' && <p className="text-muted-foreground p-4 text-center">場上沒有牌。</p>)}
          </div>

          
          <div>
            <h3 className="text-xl font-semibold text-secondary mb-2">您的手牌 ({playerHand.length} 張):</h3>
             {playerHand.length > 0 || turnPhase === 'NOT_STARTED' ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 p-3 bg-background rounded-md shadow-inner min-h-[100px]">
                {playerHand.map(card => (
                    <button
                    key={card.id}
                    onClick={() => handleCardClick(card, 'hand')}
                    disabled={(turnPhase !== 'SELECT_HAND_CARD' && (turnPhase !== 'MATCH_HAND_TO_FIELD' || card.id !== selectedHandCardId)) || turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED' || turnPhase === 'DRAW_AND_EVAL_DECK_CARD' || turnPhase === 'MATCH_DECK_TO_FIELD'}
                    className={cn(
                        "flex flex-col items-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent rounded shadow p-1",
                        selectedHandCardId === card.id && "ring-4 ring-primary scale-110",
                        ((turnPhase !== 'SELECT_HAND_CARD' && (turnPhase !== 'MATCH_HAND_TO_FIELD' || card.id !== selectedHandCardId)) || turnPhase === 'YAKU_FORMED' || turnPhase === 'NO_MOVES_LEFT' || turnPhase === 'NOT_STARTED' || turnPhase === 'DRAW_AND_EVAL_DECK_CARD' || turnPhase === 'MATCH_DECK_TO_FIELD') && "opacity-70 cursor-not-allowed"
                    )}
                    title={card.name}
                    >
                      <div className="aspect-[2/3] relative w-full">
                        <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded" data-ai-hint={card.aiHint}/>
                      </div>
                      <p className="text-xs text-muted-foreground text-center truncate w-full mt-1 leading-tight">{card.name}</p>
                    </button>
                ))}
                </div>
            ) : (turnPhase !== 'NOT_STARTED' && <p className="text-muted-foreground p-4 text-center">手中沒有牌。</p>)}
          </div>
          
          
          <div>
            <h3 className="text-lg font-semibold text-secondary mt-3 mb-1"><Archive className="inline mr-2 h-5 w-5" /> 您已捕獲的牌 ({sortedCapturedCards.length} 張):</h3>
            <ScrollArea className="h-[80px] w-full p-1 bg-muted/20 rounded-md shadow-inner">
                {sortedCapturedCards.length > 0 || turnPhase === 'NOT_STARTED' ? (
                    <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-1">
                    {sortedCapturedCards.map(card => (
                        <div key={card.id} className="flex flex-col items-center" title={card.name}>
                           <div className="aspect-[2/3] relative w-full">
                             <Image src={card.image} alt={card.name} fill style={{ objectFit: "contain" }} className="rounded opacity-90" data-ai-hint={card.aiHint}/>
                           </div>
                           <p className="text-xs text-muted-foreground text-center truncate w-full mt-0.5 leading-tight">{card.name}</p>
                        </div>
                    ))}
                    </div>
                ) : <p className="text-muted-foreground p-3 text-center text-sm">尚未捕獲任何牌。</p>}
            </ScrollArea>
          </div>

          <CardFooter className="flex justify-center pt-8 border-t">
            <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={handleActionButtonClick}
                disabled={isActionButtonDisabled()}
            >
              {getActionButtonIcon()} {getActionButtonText()}
            </Button>
          </CardFooter>

        </CardContent>
      </Card>
    </div>
  );
}

    