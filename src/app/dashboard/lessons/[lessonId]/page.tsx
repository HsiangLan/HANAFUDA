
import { getLessonById, type Lesson } from '@/lib/data/lessons';
import { LessonContentDisplay } from '@/components/lessons/lesson-content-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Wand2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LessonAiSummaryModal } from '@/components/lessons/lesson-ai-summary-modal';


interface LessonPageParams {
  params: {
    lessonId: string;
  };
}

export default function LessonPage({ params }: LessonPageParams) {
  const lesson = getLessonById(params.lessonId);

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Card className="w-full max-w-lg p-8 shadow-xl">
          <CardTitle className="text-2xl text-destructive mb-4">找不到課程</CardTitle>
          <CardDescription className="text-muted-foreground mb-6">
            抱歉，您尋找的課程不存在或已被移動。
          </CardDescription>
          <Button asChild variant="outline">
            <Link href="/dashboard/lessons">
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回課程列表
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-xl border-primary/10">
        <CardHeader className="border-b border-border">
          <div className="mb-4">
            <Button asChild variant="outline" size="sm" className="text-muted-foreground hover:text-foreground">
              <Link href="/dashboard/lessons">
                <ArrowLeft className="mr-2 h-4 w-4" /> 返回所有課程
              </Link>
            </Button>
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-primary">{lesson.title}</CardTitle>
          <CardDescription className="text-md md:text-lg text-muted-foreground pt-1">
            {lesson.description} (預計時間：{lesson.estimatedTime})
          </CardDescription>
        </CardHeader>
        
        <ScrollArea className="h-[calc(100vh-28rem)] md:h-[calc(100vh-25rem)]">
          <CardContent className="py-6 px-4 md:px-6 space-y-4">
            {lesson.contentBlocks.map((block, index) => (
              <LessonContentDisplay key={index} block={block} />
            ))}
          </CardContent>
        </ScrollArea>
        
        <CardFooter className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
           <LessonAiSummaryModal 
              lessonId={lesson.id} 
              lessonTitle={lesson.title}
              triggerButton={
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground w-full sm:w-auto">
                  <Wand2 className="mr-2 h-4 w-4" /> AI 課程摘要
                </Button>
              }
            />
           {lesson.quizId && (
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto">
              <Link href={`/dashboard/lessons/${lesson.id}/quiz`}>
                <ClipboardCheck className="mr-2 h-5 w-5" /> 開始測驗
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

// This function is needed for Next.js to know which paths to pre-render if using generateStaticParams.
// For dynamic fetching, it's not strictly necessary for `dev` but good practice for `build`.
// import { getAllLessons } from '@/lib/data/lessons';
// export async function generateStaticParams() {
//   const lessons = getAllLessons();
//   return lessons.map((lesson) => ({
//     lessonId: lesson.id,
//   }));
// }
