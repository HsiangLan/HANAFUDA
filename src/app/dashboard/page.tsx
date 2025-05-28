
'use client'; // 確保這是客戶端組件

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookOpen, Target, Gamepad2, ArrowRight, ListChecks } from "lucide-react";
// import Image from "next/image"; // Image component removed

// Firebase 連線測試導入已移除

const featureCards = [
  {
    title: "學習基礎",
    description: "涵蓋花札規則、牌義及基本策略的互動課程。",
    href: "/dashboard/lessons",
    icon: BookOpen,
    // image: "https://placehold.co/600x400.png", // Image property removed
    // aiHint: "hanafuda cards" // AI hint removed
  },
  {
    title: "情境練習",
    description: "透過模擬遊戲情境來測試您的知識，並獲得最佳出牌提示。",
    href: "/dashboard/trainer",
    icon: Target,
    // image: "https://placehold.co/600x400.png", // Image property removed
    // aiHint: "koi-koi game" // AI hint removed
  },
  {
    title: "進度紀錄",
    description: "查看您已完成的課程、測驗成績和其他學習統計數據。",
    href: "/dashboard/progress",
    icon: ListChecks,
    // image: "https://placehold.co/600x400.png", // Image property removed
    // aiHint: "progress chart" // AI hint removed
  },
  {
    title: "實際操作",
    description: "透過嵌入的遊戲來練習您的花札技巧。",
    href: "/dashboard/play",
    icon: Gamepad2,
    // image: "https://placehold.co/600x400.png", // Image property removed
    // aiHint: "game console" // AI hint removed
  },
];

export default function DashboardPage() {
  // Firebase 連線測試的 useEffect 已移除

  return (
    <div className="space-y-8">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">歡迎來到花札道場！</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            您通往花札（こいこい）大師的旅程由此開始。探索課程、練習技巧並遊玩遊戲。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">
            無論您是初學者還是希望精進策略，花札道場都能提供您成功所需的工具。
            使用頂部導覽列或下方的快速連結來瀏覽各個部分。
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4"> {/* Adjusted grid for 4 items */}
        {featureCards.map((feature) => (
          <Card key={feature.title} className="flex flex-col overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
            {/* Image container removed
            <div className="relative h-48 w-full">
              <Image 
                src={feature.image} 
                alt={feature.title} 
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                data-ai-hint={feature.aiHint}
              />
            </div>
            */}
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <feature.icon className="h-8 w-8 text-primary" />
                <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground min-h-[3em]">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                <Link href={feature.href}>
                  前往 {feature.title.split(" ")[0]} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
