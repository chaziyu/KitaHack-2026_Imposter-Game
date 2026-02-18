import { create } from 'zustand';
import { addToGlobalImpact } from '../services/GlobalImpactService';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: number;
}

export interface EnvironmentalImpact {
    co2Prevented: number; // tons
    wasteRecycled: number; // truckloads
    peopleProtected: number;
    sdgsContributed: number[];
}

interface PlayerProgress {
    // First-time flags
    hasSeenIntro: boolean;
    hasCompletedTutorial: boolean;
    hasSeenVictory: boolean;

    // Challenge completion
    completedChallenges: string[];

    // Achievement tracking
    achievements: Achievement[];
    totalImpact: EnvironmentalImpact;

    // Tutorial progress
    currentTutorialStep: number;
    tutorialCompleted: boolean;

    // Timestamps
    firstPlayedAt?: number;
    lastPlayedAt?: number;

    // Actions
    markIntroSeen: () => void;
    skipIntro: () => void;
    completeTutorial: () => void;
    setTutorialStep: (step: number) => void;
    uncompleteChallenge: (challengeId: string) => void;
    completeChallenge: (challengeId: string) => void;
    unlockAchievement: (achievement: Achievement) => void;
    addImpact: (impact: Partial<EnvironmentalImpact>) => void;
    markVictorySeen: () => void;
    resetProgress: () => void;
    loadFromCloud: (cloudData: any) => void; // Sync from Firebase

    // Computed getters
    isAllChallengesComplete: () => boolean;
    shouldShowIntro: () => boolean;
    shouldShowTutorial: () => boolean;
    shouldShowVictory: () => boolean;
    getCompletionPercentage: () => number;
}

const TOTAL_CHALLENGES = 3;

const initialState = {
    hasSeenIntro: false,
    hasCompletedTutorial: false,
    completedChallenges: [],
    achievements: [],
    totalImpact: {
        co2Prevented: 0,
        wasteRecycled: 0,
        peopleProtected: 0,
        sdgsContributed: []
    },
    currentTutorialStep: 0,
    tutorialCompleted: false,
    hasSeenVictory: false,
    firstPlayedAt: Date.now(),
    lastPlayedAt: Date.now()
};

export const usePlayerProgress = create<PlayerProgress>((set, get) => ({
    ...initialState,

    markIntroSeen: () => set({
        hasSeenIntro: true,
        lastPlayedAt: Date.now()
    }),

    skipIntro: () => set({
        hasSeenIntro: true,
        lastPlayedAt: Date.now()
    }),

    completeTutorial: () => set({
        hasCompletedTutorial: true,
        tutorialCompleted: true,
        currentTutorialStep: -1,
        lastPlayedAt: Date.now()
    }),

    setTutorialStep: (step: number) => set({
        currentTutorialStep: step,
        lastPlayedAt: Date.now()
    }),

    uncompleteChallenge: (challengeId: string) => {
        const state = get();
        if (!state.completedChallenges.includes(challengeId)) {
            return;
        }

        const newCompleted = state.completedChallenges.filter(id => id !== challengeId);

        // Update local state
        set({
            completedChallenges: newCompleted,
            lastPlayedAt: Date.now()
        });

        // console.log(`[Progress] Challenge ${challengeId} un-completed due to sabotage/failure.`);
    },

    completeChallenge: (challengeId: string) => {
        const state = get();
        if (state.completedChallenges.includes(challengeId)) {
            return; // Already completed
        }

        const newCompleted = [...state.completedChallenges, challengeId];

        // Add environmental impact based on challenge
        let impact: Partial<EnvironmentalImpact> = {};
        let sdgs: number[] = [];

        switch (challengeId) {
            case 'file_sum':
                impact = { co2Prevented: 2 };
                sdgs = [7, 13];
                break;
            case 'file_loop':
                impact = { wasteRecycled: 5 };
                sdgs = [12];
                break;
            case 'file_cpp_hello':
                impact = { peopleProtected: 1000000000 }; // 1 billion
                sdgs = [13, 3];
                break;
        }

        // Update local state
        set({
            completedChallenges: newCompleted,
            totalImpact: {
                co2Prevented: state.totalImpact.co2Prevented + (impact.co2Prevented || 0),
                wasteRecycled: state.totalImpact.wasteRecycled + (impact.wasteRecycled || 0),
                peopleProtected: state.totalImpact.peopleProtected + (impact.peopleProtected || 0),
                sdgsContributed: [...new Set([...state.totalImpact.sdgsContributed, ...sdgs])]
            },
            lastPlayedAt: Date.now()
        });

        // Sync to global Firebase database (async, fire and forget)
        addToGlobalImpact({
            co2Prevented: impact.co2Prevented,
            wasteRecycled: impact.wasteRecycled,
            peopleProtected: impact.peopleProtected,
            challengesCompleted: 1
        }).catch(err => {
            console.error('Failed to sync global impact to Firebase:', err);
            // Don't block user experience if sync fails
        });

        // Sync user progress to Firebase (if authenticated)
        import('./useAuthStore').then(({ useAuthStore }) => {
            const user = useAuthStore.getState().user;
            if (user) {
                import('../services/UserProgressSyncService').then(({ updateUserProgress }) => {
                    const state = get();
                    updateUserProgress(user.uid, {
                        completedChallenges: state.completedChallenges,
                        totalImpact: state.totalImpact,
                        lastPlayedAt: Date.now()
                    } as any).catch(err => {
                        console.error('Failed to sync user progress:', err);
                    });
                });
            }
        });

        // Auto-unlock achievement when all challenges complete
        if (newCompleted.length === TOTAL_CHALLENGES) {
            get().unlockAchievement({
                id: 'earth-guardian',
                name: "Earth's Guardian",
                description: "Mastered all three powers and saved the world!",
                icon: '🌍🛡️',
                unlockedAt: Date.now()
            });
        }
    },

    unlockAchievement: (achievement: Achievement) => {
        const state = get();
        if (state.achievements.some(a => a.id === achievement.id)) {
            return; // Already unlocked
        }

        set({
            achievements: [...state.achievements, {
                ...achievement,
                unlockedAt: achievement.unlockedAt || Date.now()
            }],
            lastPlayedAt: Date.now()
        });
    },

    addImpact: (impact: Partial<EnvironmentalImpact>) => {
        const state = get();
        set({
            totalImpact: {
                co2Prevented: state.totalImpact.co2Prevented + (impact.co2Prevented || 0),
                wasteRecycled: state.totalImpact.wasteRecycled + (impact.wasteRecycled || 0),
                peopleProtected: state.totalImpact.peopleProtected + (impact.peopleProtected || 0),
                sdgsContributed: impact.sdgsContributed
                    ? [...new Set([...state.totalImpact.sdgsContributed, ...impact.sdgsContributed])]
                    : state.totalImpact.sdgsContributed
            },
            lastPlayedAt: Date.now()
        });
    },

    markVictorySeen: () => set({
        hasSeenVictory: true,
        lastPlayedAt: Date.now()
    }),

    resetProgress: () => set({
        ...initialState,
        firstPlayedAt: Date.now(),
        lastPlayedAt: Date.now()
    }),

    loadFromCloud: (cloudData: any) => {
        // Sync Firebase data to local state
        set({
            hasSeenIntro: cloudData.hasSeenIntro || false,
            hasCompletedTutorial: cloudData.hasCompletedTutorial || false,
            hasSeenVictory: cloudData.hasSeenVictory || false,
            completedChallenges: cloudData.completedChallenges || [],
            achievements: cloudData.achievements || [],
            totalImpact: {
                ...initialState.totalImpact,
                ...(cloudData.totalImpact || {})
            },
            currentTutorialStep: cloudData.currentTutorialStep || 0,
            tutorialCompleted: cloudData.tutorialCompleted || false,
            firstPlayedAt: cloudData.firstPlayedAt || Date.now(),
            lastPlayedAt: cloudData.lastPlayedAt || Date.now()
        });
        // console.log('Loaded progress from Firebase');
    },

    // Computed
    isAllChallengesComplete: () => {
        return get().completedChallenges.length >= TOTAL_CHALLENGES;
    },

    shouldShowIntro: () => {
        return !get().hasSeenIntro;
    },

    shouldShowTutorial: () => {
        const state = get();
        return state.hasSeenIntro && !state.hasCompletedTutorial;
    },

    shouldShowVictory: () => {
        const state = get();
        return state.isAllChallengesComplete() && state.hasSeenIntro && !state.hasSeenVictory;
    },

    getCompletionPercentage: () => {
        const completed = get().completedChallenges.length;
        return Math.round((completed / TOTAL_CHALLENGES) * 100);
    }
})
);
