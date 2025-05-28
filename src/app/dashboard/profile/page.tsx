
'use client';

import { useState, useEffect, type ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, BookOpenCheck, ListOrdered, Percent, Loader2, AlertTriangle, Edit3 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Added import for Label
import { auth } from '@/lib/firebase';
import { updateProfile, type User as FirebaseUser } from 'firebase/auth';
import { getUserProgress, type UserProgressData } from '@/lib/user-progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

// Default structure for UserProgressData
const initialUserProgress: UserProgressData = {
  userId: '',
  completedLessons: [],
  quizAttempts: [],
  practicedYaku: [],
  lessonsCompletedCount: 0,
  quizzesTakenCount: 0,
  averageQuizScore: "0%",
};

// Mock user data for profile display - this can be enriched if needed
const defaultUserProfile = {
  name: "花札愛好者",
  email: "player@example.com", // This will be replaced by auth user's email
  joinDate: "2024年1月1日", // This is mock, Firebase user creation time could be used
  profilePicture: "https://placehold.co/150x150.png",
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState(defaultUserProfile);
  const [userProgress, setUserProgress] = useState<UserProgressData>(initialUserProgress);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [newNickname, setNewNickname] = useState('');
  const [isUpdatingNickname, setIsUpdatingNickname] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setUserProfile(prev => ({
          ...prev,
          email: user.email || "N/A",
          name: user.displayName || prev.name, // Use displayName if available
          joinDate: user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('zh-TW') : prev.joinDate,
          profilePicture: user.photoURL || prev.profilePicture,
        }));
        setNewNickname(user.displayName || ''); // 初始化 newNickname
        
        setIsLoading(true);
        setError(null);
        try {
          const progressData = await getUserProgress(user.uid);
          setUserProgress(progressData || initialUserProgress); // Use fetched or default
        } catch (err) {
          console.error("Failed to fetch user progress for profile:", err);
          setError("無法載入您的進度資料，請稍後再試。");
          setUserProgress(initialUserProgress);
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(defaultUserProfile);
        setUserProgress(initialUserProgress);
        setNewNickname('');
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleNicknameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewNickname(e.target.value);
  };

  const handleSaveNickname = async () => {
    if (!currentUser || !newNickname.trim()) {
      toast({ title: "錯誤", description: "暱稱不能為空。", variant: "destructive" });
      return;
    }
    if (newNickname.trim() === (currentUser.displayName || '')) {
      toast({ title: "提示", description: "新暱稱與目前暱稱相同。" });
      return;
    }

    setIsUpdatingNickname(true);
    try {
      await updateProfile(currentUser, { displayName: newNickname.trim() });
      setUserProfile(prev => ({ ...prev, name: newNickname.trim() }));
      // currentUser 本身由 onAuthStateChanged 管理，其 displayName 會在 Firebase 後端更新後，
      // 下次 onAuthStateChanged 事件觸發時或 auth.currentUser 重新獲取時更新。
      // 此處更新 userProfile.name 以立即反映 UI。
      toast({ title: "成功", description: "暱稱已更新！" });
    } catch (error: any) {
      console.error("Error updating nickname:", error);
      toast({ title: "錯誤", description: error.message || "更新暱稱失敗。", variant: "destructive" });
    } finally {
      setIsUpdatingNickname(false);
    }
  };

  if (isLoading && !currentUser) { // Show loading only if current user is not yet determined
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">載入使用者資料中...</p>
      </div>
    );
  }
  
  if (error && !isLoading) { // Display error only if not loading and error exists
     return (
      <Alert variant="destructive" className="max-w-2xl mx-auto">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>錯誤</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!currentUser && !isLoading) { // If not loading and no current user
     return (
      <Alert variant="default" className="max-w-2xl mx-auto bg-accent/10 border-accent text-accent-foreground [&>svg]:text-accent">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>請先登入</AlertTitle>
        <AlertDescription>
          您需要登入才能查看您的個人資料。
          <Button asChild variant="link" className="p-0 h-auto ml-1 text-accent-foreground hover:underline">
            <Link href="/login">前往登入</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // Show loading for progress data if user is determined but progress is still loading
  const isProgressLoading = isLoading && currentUser;


  return (
    <div className="space-y-8">
      <Card className="shadow-xl border-primary/10">
        <CardHeader className="items-center text-center">
          <div className="relative mb-4 h-32 w-32">
            <Image 
              src={userProfile.profilePicture} 
              alt="使用者個人資料圖片" 
              fill
              style={{ objectFit: "cover" }} 
              className="rounded-full"
              sizes="128px"
              data-ai-hint="profile avatar"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">{userProfile.name}</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            {userProfile.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 space-y-6">
          {currentUser && (
            <Card className="bg-muted/20">
              <CardHeader>
                <CardTitle className="text-xl text-secondary flex items-center">
                  <Edit3 className="mr-3 h-6 w-6" />
                  修改暱稱
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nickname" className="text-foreground">新暱稱</Label>
                  <Input
                    id="nickname"
                    type="text"
                    value={newNickname}
                    onChange={handleNicknameChange}
                    placeholder="輸入您的新暱稱"
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleSaveNickname} disabled={isUpdatingNickname} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isUpdatingNickname ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    '儲存暱稱'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {isProgressLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-muted-foreground">載入進度摘要...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard label="加入花札道場日期" value={userProfile.joinDate} />
              <InfoCard label="已完成課程總數" value={userProgress.lessonsCompletedCount.toString()} icon={<BookOpenCheck className="h-5 w-5 text-primary mr-2" />} />
              <InfoCard label="已參加測驗次數" value={userProgress.quizzesTakenCount.toString()} icon={<ListOrdered className="h-5 w-5 text-primary mr-2" />} />
              <InfoCard label="平均測驗分數" value={userProgress.averageQuizScore} icon={<Percent className="h-5 w-5 text-primary mr-2" />} />
            </div>
          )}
          
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-xl text-secondary flex items-center">
                <BookOpenCheck className="mr-3 h-6 w-6" />
                已完成課程 ({userProgress.completedLessons.length})
              </CardTitle>
              <CardDescription>您已完成以下課程：</CardDescription>
            </CardHeader>
            <CardContent>
              {isProgressLoading ? (
                <p className="text-muted-foreground p-4 text-center">載入已完成課程...</p>
              ) : userProgress.completedLessons.length > 0 ? (
                <ul className="space-y-3">
                  {userProgress.completedLessons.map(lesson => (
                    <li key={lesson.id} className="flex justify-between items-center p-3 bg-background rounded-md shadow-sm">
                      <div>
                        <Link href={lesson.lessonPath} className="font-medium text-primary hover:underline">
                          {lesson.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">完成日期：{new Date(lesson.dateCompleted).toLocaleDateString('zh-TW')}</p>
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
              {isProgressLoading ? (
                <p className="text-muted-foreground p-4 text-center">載入測驗紀錄...</p>
              ) : userProgress.quizAttempts.length > 0 ? (
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
                        <p className="text-xs text-muted-foreground text-right">嘗試日期：<br/>{new Date(attempt.dateAttempted).toLocaleDateString('zh-TW')}</p>
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

           <p className="text-center text-muted-foreground mt-8">
            個人化進度追蹤與更多詳細統計功能正在逐步完善中。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

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
