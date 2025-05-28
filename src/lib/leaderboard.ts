
'use client';

import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export interface GlobalLeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  date: string; // This will be Firestore Timestamp converted to string for display
}

const GLOBAL_LEADERBOARD_COLLECTION = 'globalLeaderboard';
const MAX_GLOBAL_LEADERBOARD_ENTRIES = 10;

export async function getGlobalLeaderboard(): Promise<GlobalLeaderboardEntry[]> {
  try {
    const leaderboardCol = collection(db, GLOBAL_LEADERBOARD_COLLECTION);
    const q = query(leaderboardCol, orderBy('score', 'desc'), limit(MAX_GLOBAL_LEADERBOARD_ENTRIES));
    const querySnapshot = await getDocs(q);
    const leaderboard: GlobalLeaderboardEntry[] = [];
    querySnapshot.forEach((docEntry) => {
      const data = docEntry.data();
      leaderboard.push({
        userId: docEntry.id,
        userName: data.userName || '匿名玩家',
        score: data.score,
        date: data.lastUpdated instanceof Timestamp 
              ? data.lastUpdated.toDate().toLocaleDateString('zh-TW') 
              : (data.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString('zh-TW') : new Date().toLocaleDateString('zh-TW')),
      });
    });
    return leaderboard;
  } catch (error) {
    console.error("Error fetching global leaderboard:", error);
    return [];
  }
}

export async function updateUserGlobalScore(currentUser: User | null, newScore: number): Promise<boolean> {
  if (!currentUser) {
    console.warn("User not authenticated, cannot update global score.");
    return false;
  }
  if (newScore <= 0) {
    // console.log(`Score ${newScore} is not high enough (<=0) to be recorded on the global leaderboard.`); // Can be noisy
    return false;
  }

  const userDocRef = doc(db, GLOBAL_LEADERBOARD_COLLECTION, currentUser.uid);

  try {
    const userDocSnap = await getDoc(userDocRef);
    let shouldUpdate = true;

    if (userDocSnap.exists()) {
      const currentData = userDocSnap.data();
      if (currentData.score >= newScore) {
        shouldUpdate = false;
        // console.log(`New score ${newScore} is not higher than the current global high score ${currentData.score} for user ${currentUser.uid}.`);
      }
    }

    if (shouldUpdate) {
      let userNameToSave = '匿名玩家'; // Default
      const displayName = currentUser.displayName;
      const email = currentUser.email;

      if (displayName && displayName.trim() !== '') {
        userNameToSave = displayName.trim();
      } else if (email && email.trim() !== '') {
        userNameToSave = email;
      }

      console.log(`[Leaderboard Save Debug] For User ID: ${currentUser.uid}`);
      console.log(`  - auth.currentUser.displayName: "${displayName}" (type: ${typeof displayName})`);
      console.log(`  - auth.currentUser.email: "${email}" (type: ${typeof email})`);
      console.log(`  - userNameToSave selected: "${userNameToSave}"`);
      console.log(`  - Score to save: ${newScore}`);
      
      await setDoc(userDocRef, {
        userName: userNameToSave,
        score: newScore,
        lastUpdated: serverTimestamp(),
      }, { merge: true });
      console.log(`User's global high score updated/created successfully for ${currentUser.uid} with score: ${newScore}. Name used: "${userNameToSave}".`);
      return true;
    }
    return false; 
  } catch (error) {
    console.error(`Error updating user global score for ${currentUser.uid}:`, error);
    return false;
  }
}

