import { ref, get, set, update } from 'firebase/database';
import { db } from '../firebaseConfig';
import type { EnvironmentalImpact, Achievement } from '../stores/usePlayerProgress';

/**
 * User Progress Sync Service
 * Syncs user progress to Firebase Realtime Database
 */

export interface CloudUserProgress {
    hasSeenIntro: boolean;
    hasCompletedTutorial: boolean;
    hasSeenVictory: boolean;
    completedChallenges: string[];
    achievements: Achievement[];
    totalImpact: EnvironmentalImpact;
    currentTutorialStep: number;
    tutorialCompleted: boolean;
    firstPlayedAt: number;
    lastPlayedAt: number;
}

/**
 * Load user progress from Firebase
 */
export async function loadUserProgress(userId: string): Promise<CloudUserProgress | null> {
    try {
        const progressRef = ref(db, `userProgress/${userId}`);
        const snapshot = await get(progressRef);

        if (snapshot.exists()) {
            return snapshot.val() as CloudUserProgress;
        }
        return null; // New user, no progress yet
    } catch (error) {
        console.error('Failed to load user progress:', error);
        return null;
    }
}

/**
 * Save complete user progress to Firebase
 */
export async function saveUserProgress(userId: string, progress: CloudUserProgress): Promise<void> {
    try {
        const progressRef = ref(db, `userProgress/${userId}`);
        await set(progressRef, {
            ...progress,
            lastPlayedAt: Date.now()
        });
        // console.log('User progress saved to Firebase');
    } catch (error) {
        console.error('Failed to save user progress:', error);
        throw error;
    }
}

/**
 * Update specific fields in user progress
 */
export async function updateUserProgress(userId: string, updates: Partial<CloudUserProgress>): Promise<void> {
    try {
        const progressRef = ref(db, `userProgress/${userId}`);
        await update(progressRef, {
            ...updates,
            lastPlayedAt: Date.now()
        });
    } catch (error) {
        console.error('Failed to update user progress:', error);
        // Don't throw - allow offline play
    }
}

/**
 * Mark challenge as completed (incremental update)
 */
export async function syncChallengeCompletion(
    userId: string,
    challengeId: string,
    impact: EnvironmentalImpact
): Promise<void> {
    try {
        const progressRef = ref(db, `userProgress/${userId}`);
        const snapshot = await get(progressRef);

        if (snapshot.exists()) {
            const current = snapshot.val() as CloudUserProgress;
            const newCompleted = [...new Set([...current.completedChallenges, challengeId])];

            await update(progressRef, {
                completedChallenges: newCompleted,
                totalImpact: impact,
                lastPlayedAt: Date.now()
            });
        }
    } catch (error) {
        console.error('Failed to sync challenge completion:', error);
    }
}
