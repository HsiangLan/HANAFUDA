
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAllLessons, type Lesson } from "@/lib/data/lessons";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
// import Image from "next/image"; // Image component removed

export default function LessonsPage() {
  const lessons = getAllLessons();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary">花札課程</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          從基礎到進階策略，開始您的學習之旅。
        </p>
      </div>

      {lessons.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">目前沒有可用的課程。請稍後再回來查看！</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson: Lesson) => {
            // const firstImageBlock = lesson.contentBlocks.find(b => b.type === 'image'); // Logic for finding image removed
            // const imageUrl = firstImageBlock?.value as string || "https://placehold.co/600x400.png"; // Image URL logic removed
            // const imageAiHint = firstImageBlock?.aiHint || "hanafuda lesson"; // AI hint logic removed
            
            return (
              <Card key={lesson.id} className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg border-accent/30">
                {/* Image container removed
                <div className="relative h-52 w-full">
                   <Image 
                      src={imageUrl} 
                      alt={lesson.title} 
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      data-ai-hint={imageAiHint}
                    />
                </div>
                */}
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-primary">{lesson.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground min-h-[3.5em]">{lesson.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>預計時間：{lesson.estimatedTime}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Link href={`/dashboard/lessons/${lesson.id}`}>
                      開始課程 <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
