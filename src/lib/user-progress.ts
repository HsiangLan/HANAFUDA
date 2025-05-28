
'use client';

import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment, writeBatch } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface YakuPracticeStats {
  id: string; // e.g., 'inoshikacho'
  name: string; // e.g., '豬鹿蝶 (Ino-Shika-Chō)'
  attempts: number;
  successes: number;
  lastAttempted: string; // ISO date string
  practicePath: string; // e.g., "/dashboard/trainer"
}

export interface QuizAttempt {
  lessonId: string;
  quizId: string;
  quizTitle: string;
  score: string; // e.g., "3/3 (100%)"
  totalQuestions: number;
  correctAnswers: number;
  dateAttempted: string; // ISO date string
  quizPath: string; // e.g., "/dashboard/lessons/1/quiz"
}

export interface CompletedLessonInfo {
  id: string;
  title: string;
  dateCompleted: string; // ISO date string
  lessonPath: string;
}

export interface UserProgressData {
  userId: string;
  completedLessons: CompletedLessonInfo[];
  quizAttempts: QuizAttempt[];
  practicedYaku: YakuPracticeStats[];
  lessonsCompletedCount: number;
  quizzesTakenCount: number;
  averageQuizScore: string; // e.g., "89%"
  // lastLogin?: string; // ISO date string
}

const defaultUserProgress = (userId: string): UserProgressData => ({
  userId,
  completedLessons: [],
  quizAttempts: [],
  practicedYaku: [],
  lessonsCompletedCount: 0,
  quizzesTakenCount: 0,
  averageQuizScore: "0%",
});

export async function getUserProgress(userId: string): Promise<UserProgressData> {
  if (!userId) {
    console.error("getUserProgress: userId is required.");
    // Return default structure for guest or if userId is somehow missing
    return defaultUserProgress("guest"); 
  }
  const userProgressRef = doc(db, 'userProgress', userId);
  const docSnap = await getDoc(userProgressRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProgressData;
  } else {
    // If no progress doc exists, create and return a default one
    const newProgress = defaultUserProgress(userId);
    try {
      await setDoc(userProgressRef, newProgress);
      return newProgress;
    } catch (error) {
      console.error("Error creating new user progress document:", error);
      return defaultUserProgress(userId); // Return default if creation fails
    }
  }
}

function calculateAverageScore(quizAttempts: QuizAttempt[]): string {
  if (!quizAttempts || quizAttempts.length === 0) {
    return "0%";
  }
  let totalCorrect = 0;
  let totalPossible = 0;
  quizAttempts.forEach(attempt => {
    totalCorrect += attempt.correctAnswers;
    totalPossible += attempt.totalQuestions;
  });
  if (totalPossible === 0) return "0%";
  const average = Math.round((totalCorrect / totalPossible) * 100);
  return `${average}%`;
}

export async function recordQuizAttempt(userId: string, attempt: QuizAttempt): Promise<void> {
  if (!userId) {
    console.error("recordQuizAttempt: userId is required.");
    return;
  }
  const userProgressRef = doc(db, 'userProgress', userId);
  
  try {
    const userProgressDoc = await getDoc(userProgressRef);
    let newAverageScore = attempt.score.split(" ")[1]?.replace(/[()%]/g, "") + "%" || "0%";

    if (userProgressDoc.exists()) {
      const currentData = userProgressDoc.data() as UserProgressData;
      const updatedAttempts = [...currentData.quizAttempts, attempt];
      newAverageScore = calculateAverageScore(updatedAttempts);

      await updateDoc(userProgressRef, {
        quizAttempts: arrayUnion(attempt), // Adds if unique, consider if multiple attempts of same quiz need specific handling
        quizzesTakenCount: increment(1),
        averageQuizScore: newAverageScore,
      });
    } else {
      const newProgress = defaultUserProgress(userId);
      newProgress.quizAttempts.push(attempt);
      newProgress.quizzesTakenCount = 1;
      newProgress.averageQuizScore = calculateAverageScore(newProgress.quizAttempts);
      await setDoc(userProgressRef, newProgress);
    }
  } catch (error) {
    console.error("Error recording quiz attempt:", error);
  }
}

export async function recordYakuPractice(userId: string, yakuId: string, yakuName: string, practicePath: string, success: boolean): Promise<void> {
  if (!userId) {
    console.error("recordYakuPractice: userId is required.");
    return;
  }
  const userProgressRef = doc(db, 'userProgress', userId);
  const now = new Date().toISOString();

  try {
    const userProgressDoc = await getDoc(userProgressRef);
    let practicedYakuArray: YakuPracticeStats[] = [];

    if (userProgressDoc.exists()) {
      practicedYakuArray = (userProgressDoc.data()?.practicedYaku as YakuPracticeStats[]) || [];
      let yakuEntry = practicedYakuArray.find(y => y.id === yakuId);

      if (yakuEntry) {
        yakuEntry.attempts += 1;
        if (success) {
          yakuEntry.successes += 1;
        }
        yakuEntry.lastAttempted = now;
      } else {
        yakuEntry = { id: yakuId, name: yakuName, attempts: 1, successes: success ? 1 : 0, lastAttempted: now, practicePath };
        practicedYakuArray.push(yakuEntry);
      }
      await updateDoc(userProgressRef, { practicedYaku: practicedYakuArray });
    } else {
      const newProgress = defaultUserProgress(userId);
      const yakuEntry: YakuPracticeStats = { id: yakuId, name: yakuName, attempts: 1, successes: success ? 1 : 0, lastAttempted: now, practicePath };
      newProgress.practicedYaku.push(yakuEntry);
      await setDoc(userProgressRef, newProgress);
    }
  } catch (error) {
    console.error("Error recording yaku practice:", error);
  }
}

// Placeholder for lesson completion - to be implemented when there's a clear trigger
export async function recordCompletedLesson(userId: string, lessonId: string, lessonTitle: string, lessonPath: string): Promise<void> {
  if (!userId) {
    console.error("recordCompletedLesson: userId is required.");
    return;
  }
  const userProgressRef = doc(db, 'userProgress', userId);
  const now = new Date().toISOString();
  const newLessonCompletion: CompletedLessonInfo = { id: lessonId, title: lessonTitle, dateCompleted: now, lessonPath };

  try {
    const userProgressDoc = await getDoc(userProgressRef);
    if (userProgressDoc.exists()) {
      const currentData = userProgressDoc.data() as UserProgressData;
      // Avoid duplicate entries for the same lesson
      if (!currentData.completedLessons.find(l => l.id === lessonId)) {
        await updateDoc(userProgressRef, {
          completedLessons: arrayUnion(newLessonCompletion),
          lessonsCompletedCount: increment(1),
        });
      }
    } else {
      const newProgress = defaultUserProgress(userId);
      newProgress.completedLessons.push(newLessonCompletion);
      newProgress.lessonsCompletedCount = 1;
      await setDoc(userProgressRef, newProgress);
    }
  } catch (error) {
    console.error("Error recording completed lesson:", error);
  }
}
