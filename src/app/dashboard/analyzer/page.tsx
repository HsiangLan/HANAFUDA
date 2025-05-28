
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2 } from "lucide-react"; // Or another relevant icon

export default function AnalyzerPage() {
  return (
    <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-[calc(100vh-12rem)]">
      <Card className="w-full max-w-lg text-center shadow-xl border-border/50">
        <CardHeader>
          <Wand2 className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <CardTitle className="text-2xl font-bold text-muted-foreground">牌局分析器</CardTitle>
          <CardDescription className="text-md text-muted-foreground pt-2">
            此「AI 牌局分析」功能先前已被移除。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            我們正在重新評估和改進我們的 AI 功能，敬請期待未來的更新。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
