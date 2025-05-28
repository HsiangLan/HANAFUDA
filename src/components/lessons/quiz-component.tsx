
'use client';

import { useState, useEffect } from 'react';
import type { Quiz, Question } from '@/lib/data/quizzes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, Award, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { recordQuizAttempt, type QuizAttempt, recordCompletedLesson } from '@/lib/user-progress';
import { useToast } from '@/hooks/use-toast';
import { getLessonById } from '@/lib/data/lessons'; // Import getLessonById

interface QuizComponentProps {
  quiz: Quiz;
}

export function QuizComponent({ quiz }: QuizComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const { toast } = useToast();

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  useEffect(() => {
    resetQuizState();
  }, [quiz]);

  const resetQuizState = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowHint(false);
    setIsAnswerSubmitted(false);
    setIsQuizFinished(false);
    setAnswerFeedback(null);
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;

    setIsAnswerSubmitted(true);
    if (selectedAnswer === currentQuestion.correctAnswerIndex) {
      setScore(prevScore => prevScore + 1);
      setAnswerFeedback('correct');
    } else {
      setAnswerFeedback('incorrect');
    }
  };

  const handleQuizCompletion = async () => {
    const user = auth.currentUser;
    if (user) {
      const percentage = Math.round((score / totalQuestions) * 100);
      const attemptData: QuizAttempt = {
        lessonId: quiz.lessonId,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: `${score}/${totalQuestions} (${percentage}%)`,
        totalQuestions: totalQuestions,
        correctAnswers: score,
        dateAttempted: new Date().toISOString(),
        quizPath: `/dashboard/lessons/${quiz.lessonId}/quiz`,
      };
      try {
        await recordQuizAttempt(user.uid, attemptData);
        toast({ title: "測驗結果已儲存", description: "您的測驗成績已記錄到您的進度中。" });

        // Check if all questions were answered correctly to mark lesson as completed
        if (score === totalQuestions) {
          const lesson = getLessonById(quiz.lessonId);
          if (lesson) {
            await recordCompletedLesson(user.uid, lesson.id, lesson.title, `/dashboard/lessons/${lesson.id}`);
            toast({ title: "課程已完成！", description: `恭喜您完成了課程「${lesson.title}」。` });
          }
        }

      } catch (error) {
        console.error("Error saving quiz attempt or lesson completion:", error);
        toast({ variant: "destructive", title: "儲存失敗", description: "儲存測驗結果或課程完成狀態時發生錯誤。" });
      }
    }
    setIsQuizFinished(true);
  };


  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowHint(false);
    setIsAnswerSubmitted(false);
    setAnswerFeedback(null);
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      handleQuizCompletion();
    }
  };
  
  const handleRestartQuiz = () => {
    resetQuizState();
  };


  if (isQuizFinished) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-2xl border-primary/20">
        <CardHeader className="text-center">
          <Award className="mx-auto h-16 w-16 text-accent mb-4" />
          <CardTitle className="text-3xl font-bold text-primary">測驗完成！</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            您在 {totalQuestions} 題中答對了 {score} 題 ({percentage}%)。
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {percentage >= 80 ? (
            <p className="text-lg text-green-600">表現優異！您已充分理解。</p>
          ) : percentage >= 50 ? (
            <p className="text-lg text-yellow-600">再接再厲！查看解釋以求進步。</p>
          ) : (
            <p className="text-lg text-red-600">繼續練習！複習課程並再試一次。</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
           <Button onClick={handleRestartQuiz} variant="outline" className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" /> 重新開始測驗
          </Button>
          <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            <Link href={`/dashboard/lessons/${quiz.lessonId}`}>
              <ChevronLeft className="mr-2 h-4 w-4" /> 返回課程
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl border-primary/10">
      <CardHeader>
        <div className="flex justify-between items-center mb-2">
          <CardTitle className="text-2xl font-semibold text-primary">{quiz.title}</CardTitle>
          <span className="text-sm text-muted-foreground">第 {currentQuestionIndex + 1} / {totalQuestions} 題</span>
        </div>
        <Progress value={((currentQuestionIndex + 1) / totalQuestions) * 100} className="w-full h-2 [&>div]:bg-accent" />
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-lg font-medium text-foreground min-h-[3em]">{currentQuestion.text}</p>
        
        <RadioGroup
          key={currentQuestion.id} // Ensures RadioGroup resets when question changes
          value={selectedAnswer !== null ? selectedAnswer.toString() : undefined}
          onValueChange={(value) => setSelectedAnswer(parseInt(value))}
          disabled={isAnswerSubmitted}
          className="space-y-3"
        >
          {currentQuestion.options.map((option, index) => (
            <Label
              key={index}
              htmlFor={`option-${currentQuestion.id}-${index}`} // Unique ID for label
              className={`flex items-center space-x-3 p-4 border rounded-md cursor-pointer transition-all
                ${isAnswerSubmitted && index === currentQuestion.correctAnswerIndex ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500' : ''}
                ${isAnswerSubmitted && index !== currentQuestion.correctAnswerIndex && index === selectedAnswer ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500' : ''}
                ${!isAnswerSubmitted && selectedAnswer === index ? 'border-accent ring-2 ring-accent' : 'border-border'}
                ${isAnswerSubmitted ? 'cursor-not-allowed opacity-70' : 'hover:border-accent'}`}
            >
              <RadioGroupItem 
                value={index.toString()} 
                id={`option-${currentQuestion.id}-${index}`} // Unique ID for RadioGroupItem
                className="h-5 w-5" 
                aria-label={`選項 ${index + 1}: ${option}`}
              />
              <span>{option}</span>
            </Label>
          ))}
        </RadioGroup>

        {isAnswerSubmitted && answerFeedback && (
          <Alert variant={answerFeedback === 'correct' ? 'default' : 'destructive'} className={answerFeedback === 'correct' ? "bg-green-500/10 border-green-500 text-green-700 [&>svg]:text-green-700" : "bg-red-500/10 border-red-500 text-red-700 [&>svg]:text-red-700"}>
            {answerFeedback === 'correct' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <AlertTitle className="font-semibold">{answerFeedback === 'correct' ? '答對了！' : '答錯了'}</AlertTitle>
            <AlertDescription>{currentQuestion.explanation}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-between items-center mt-4">
          <Dialog open={showHint} onOpenChange={setShowHint}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isAnswerSubmitted} className="text-accent border-accent hover:bg-accent/10 hover:text-accent">
                <HelpCircle className="mr-2 h-4 w-4" /> 提示
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-primary">提示</DialogTitle>
                <DialogDescription className="text-foreground pt-2">
                  {currentQuestion.hint}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end pt-6 border-t">
        {isAnswerSubmitted ? (
          <Button onClick={handleNextQuestion} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {currentQuestionIndex < totalQuestions - 1 ? '下一題' : '完成測驗'}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleAnswerSubmit} disabled={selectedAnswer === null} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            提交答案
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
