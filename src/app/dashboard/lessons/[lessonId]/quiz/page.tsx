
import { getQuizByLessonId } from '@/lib/data/quizzes';
import { getLessonById } from '@/lib/data/lessons';
import { QuizComponent } from '@/components/lessons/quiz-component';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface QuizPageParams {
  params: {
    lessonId: string;
  };
}

export default function LessonQuizPage({ params }: QuizPageParams) {
  const quiz = getQuizByLessonId(params.lessonId);
  const lesson = getLessonById(params.lessonId);

  if (!quiz || !lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <Card className="w-full max-w-lg p-8 shadow-xl">
          <CardTitle className="text-2xl text-destructive mb-4">找不到測驗</CardTitle>
          <CardDescription className="text-muted-foreground mb-6">
            抱歉，此課程的測驗不存在或尚未開放。
          </CardDescription>
          <Button asChild variant="outline">
            <Link href={`/dashboard/lessons/${params.lessonId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" /> 返回課程
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
       <div className="mb-6">
        <Button asChild variant="outline" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href={`/dashboard/lessons/${params.lessonId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回 "{lesson.title}"
          </Link>
        </Button>
      </div>
      <QuizComponent quiz={quiz} />
    </div>
  );
}
