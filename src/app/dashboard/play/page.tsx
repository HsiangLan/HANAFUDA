
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Gamepad2 } from "lucide-react";

export default function PlayPage() {
  return (
    <div className="flex flex-col flex-1"> {/* Ensures this page container takes available vertical space */}
      <Card className="flex-1 flex flex-col shadow-xl border-primary/10 overflow-hidden"> {/* Card itself takes available space and manages children with flex */}
        <CardHeader className="text-center pb-4">
          <Gamepad2 className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold text-primary">實際操作 - 花札遊戲</CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            透過嵌入的遊戲來練習您的花札技巧。
          </CardDescription>
        </CardHeader>
        {/* CardContent will ensure its child (the game container) is centered and manages its own aspect ratio */}
        <CardContent className="flex-1 flex items-center justify-center p-1 md:p-2"> 
          {/* This div will control the aspect ratio of the game. w-full makes it take parent width. */}
          {/* aspect-video gives it a 16:9 ratio. max-w-5xl prevents it becoming overly wide. */}
          {/* Added a slight background to see the container's boundaries if needed */}
          <div className="w-full max-w-5xl aspect-video overflow-hidden rounded-md shadow-inner bg-black/5"> 
            <iframe
              src="https://www.crazygames.com/embed/hanafuda-flash"
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="gamepad *;"
              title="花札 Flash 遊戲"
            ></iframe>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
