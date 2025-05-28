
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ListChecks, BookOpenCheck, ListOrdered, Percent, AlertTriangle, Target, Repeat, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { getUserProgress, type UserProgressData, type CompletedLessonInfo, type QuizAttempt, type YakuPracticeStats } from '@/lib/user-progress';

// Default structure for UserProgressData if none is found or on error
const initialUserProgress: UserProgressData = {
  userId: '',
  completedLessons: [],
  quizAttempts: [],
  practicedYaku: [],
  lessonsCompletedCount: 0,
  quizzesTakenCount: 0,
  averageQuizScore: "0%",
};

interface InfoCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

function InfoCard({ label, value, icon }: InfoCardProps) {
  return (
    <Card className="bg-muted/30 p-4">
      <div className="flex items-center mb-1">
        {icon}
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-semibold text-primary ml-1">{value}</p>
    </Card>
  );
}

export default function ProgressPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgressData>(initialUserProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsLoading(true);
        setError(null);
        try {
          const progressData = await getUserProgress(user.uid);
          setUserProgress(progressData || initialUserProgress);
        } catch (err) {
          console.error("Failed to fetch user progress:", err);
          setError("無法載入您的進度資料，請稍後再試。");
          setUserProgress(initialUserProgress);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProgress(initialUserProgress);
        setIsLoading(false);
        // Optionally redirect to login or show a message
      }
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">載入進度中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>錯誤</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!currentUser) {
     return (
      <Alert variant="default" className="max-w-2xl mx-auto bg-accent/10 border-accent text-accent-foreground [&>svg]:text-accent">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>請先登入</AlertTitle>
        <AlertDescription>
          您需要登入才能查看您的學習進度。
          <Button asChild variant="link" className="p-0 h-auto ml-1 text-accent-foreground hover:underline">
            <Link href="/login">前往登入</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-primary/10">
        <CardHeader className="text-center">
          <ListChecks className="mx-auto h-12 w-12 text-primary mb-2" />
          <CardTitle className="text-3xl font-bold text-primary">學習進度</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            追蹤您在花札道場的學習旅程。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard label="已完成課程總數" value={userProgress.lessonsCompletedCount.toString()} icon={<BookOpenCheck className="h-5 w-5 text-primary mr-2" />} />
            <InfoCard label="已參加測驗次數" value={userProgress.quizzesTakenCount.toString()} icon={<ListOrdered className="h-5 w-5 text-primary mr-2" />} />
            <InfoCard label="平均測驗分數" value={userProgress.averageQuizScore} icon={<Percent className="h-5 w-5 text-primary mr-2" />} />
          </div>
          
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-xl text-secondary flex items-center">
                <BookOpenCheck className="mr-3 h-6 w-6" />
                已完成課程 ({userProgress.completedLessons.length})
              </CardTitle>
              <CardDescription>您已完成以下課程：</CardDescription>
            </CardHeader>
            <CardContent>
              {userProgress.completedLessons.length > 0 ? (
                <ul className="space-y-3">
                  {userProgress.completedLessons.map(lesson => (
                    <li key={lesson.id} className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
                      <div>
                        <Link href={lesson.lessonPath} className="font-medium text-primary hover:underline">
                          {lesson.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">完成日期：{new Date(lesson.dateCompleted).toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={lesson.lessonPath}>
                          再次查看
                        </Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">尚未完成任何課程。</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-xl text-secondary flex items-center">
                <ListOrdered className="mr-3 h-6 w-6" />
                測驗紀錄 ({userProgress.quizAttempts.length})
              </CardTitle>
              <CardDescription>您的測驗嘗試記錄如下：</CardDescription>
            </CardHeader>
            <CardContent>
              {userProgress.quizAttempts.length > 0 ? (
                <div className="space-y-3">
                  {userProgress.quizAttempts.map((attempt, index) => (
                    <Card key={index} className="p-3 bg-background shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <Link href={attempt.quizPath} className="font-medium text-primary hover:underline">
                            {attempt.quizTitle}
                          </Link>
                          <p className="text-sm text-foreground">分數：{attempt.score}</p>
                        </div>
                        <p className="text-xs text-muted-foreground text-right">嘗試日期：<br/>{new Date(attempt.dateAttempted).toLocaleDateString()}</p>
                      </div>
                       <Button variant="outline" size="sm" asChild className="mt-2">
                        <Link href={attempt.quizPath}>
                          再次測驗
                        </Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">尚未進行任何測驗。</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-xl text-secondary flex items-center">
                <Target className="mr-3 h-6 w-6" />
                役種練習進度 ({userProgress.practicedYaku.length})
              </CardTitle>
              <CardDescription>您在情境練習中針對特定役種的練習成果：</CardDescription>
            </CardHeader>
            <CardContent>
              {userProgress.practicedYaku.length > 0 ? (
                <div className="space-y-3">
                  {userProgress.practicedYaku.map((yakuPractice) => (
                    <Card key={yakuPractice.id} className="p-4 bg-background shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                        <div className="mb-3 sm:mb-0">
                          <p className="font-medium text-primary text-lg">{yakuPractice.name}</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            <span>嘗試次數：{yakuPractice.attempts}</span>
                            <span>成功次數：{yakuPractice.successes}</span>
                            <span>成功率：{yakuPractice.attempts > 0 ? Math.round((yakuPractice.successes / yakuPractice.attempts) * 100) : 0}%</span>
                            <span>上次練習：{new Date(yakuPractice.lastAttempted).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={yakuPractice.practicePath}>
                            <Repeat className="mr-2 h-4 w-4" /> 再次練習
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">尚未開始任何役種練習。</p>
              )}
               <p className="text-xs text-muted-foreground mt-4">
                提示：「再次練習」會帶您到情境練習頁面，您需要手動選擇對應的役種。
              </p>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
}
