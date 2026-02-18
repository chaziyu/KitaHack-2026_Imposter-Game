import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { signInWithName, subscribeToAuthState, signOut } from '../services/AuthService';
import { loadUserProgress, saveUserProgress } from '../services/UserProgressSyncService';

/**
 * Authentication Store
 * Manages user authentication state
 */

interface AuthStore {
    user: User | null;
    displayName: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (displayName: string) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    displayName: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    login: async (displayName: string) => {
        set({ isLoading: true, error: null });
        try {
            const user = await signInWithName(displayName);
            set({
                user,
                displayName: user.displayName,
                isAuthenticated: true,
                isLoading: false,
                error: null
            });

            // Load user progress from Firebase after successful login
            const savedProgress = await loadUserProgress(user.uid);
            if (savedProgress) {
                // Import and update player progress store
                const { usePlayerProgress } = await import('../stores/usePlayerProgress');
                usePlayerProgress.getState().loadFromCloud(savedProgress);
            }
        } catch (error: unknown) {
            set({
                error: (error as Error).message || 'Login failed',
                isLoading: false
            });
            throw error;
        }
    },

    logout: async () => {
        try {
            // Save progress before logout
            const user = get().user;
            if (user) {
                const { usePlayerProgress } = await import('../stores/usePlayerProgress');
                const progress = usePlayerProgress.getState();
                await saveUserProgress(user.uid, {
                    hasSeenIntro: progress.hasSeenIntro,
                    hasCompletedTutorial: progress.hasCompletedTutorial,
                    hasSeenVictory: progress.hasSeenVictory,
                    completedChallenges: progress.completedChallenges,
                    achievements: progress.achievements,
                    totalImpact: progress.totalImpact,
                    currentTutorialStep: progress.currentTutorialStep,
                    tutorialCompleted: progress.tutorialCompleted,
                    firstPlayedAt: progress.firstPlayedAt || Date.now(),
                    lastPlayedAt: Date.now()
                });
            }

            await signOut();
            set({
                user: null,
                displayName: null,
                isAuthenticated: false,
                error: null
            });
        } catch (error: unknown) {
            set({ error: (error as Error).message || 'Logout failed' });
            throw error;
        }
    },

    initialize: () => {
        subscribeToAuthState((user) => {
            if (user) {
                set({
                    user,
                    displayName: user.displayName,
                    isAuthenticated: true,
                    isLoading: false
                });

                // Load progress when auth state restored
                loadUserProgress(user.uid).then(savedProgress => {
                    if (savedProgress) {
                        import('../stores/usePlayerProgress').then(({ usePlayerProgress }) => {
                            usePlayerProgress.getState().loadFromCloud(savedProgress);
                        });
                    }
                });
            } else {
                set({
                    user: null,
                    displayName: null,
                    isAuthenticated: false,
                    isLoading: false
                });
            }
        });
    }
}));
