import { signInAnonymously, updateProfile, onAuthStateChanged, type User } from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { db, auth } from '../firebaseConfig';

/**
 * Firebase Authentication Service
 * Handles user authentication and profile management
 */

export interface UserProfile {
    uid: string;
    displayName: string;
    createdAt: number;
    lastLoginAt: number;
}

/**
 * Sign in or create account with a display name
 * Uses anonymous auth under the hood with custom display name
 */
export async function signInWithName(displayName: string): Promise<User> {
    try {
        // Sign in anonymously
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        // Update profile with display name
        await updateProfile(user, { displayName });

        // Check if user profile exists in database
        const userProfileRef = ref(db, `userProfiles/${user.uid}`);
        const snapshot = await get(userProfileRef);

        if (!snapshot.exists()) {
            // New user - create profile
            const profile: UserProfile = {
                uid: user.uid,
                displayName,
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            };
            await set(userProfileRef, profile);
            // console.log('Created new user profile:', displayName);
        } else {
            // Existing user - update last login
            await update(userProfileRef, {
                lastLoginAt: Date.now(),
                displayName // Update name if changed
            });
            // console.log('Updated existing user profile:', displayName);
        }

        return user;
    } catch (error) {
        console.error('Sign in failed:', error);
        throw error;
    }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): User | null {
    return auth.currentUser;
}

/**
 * Subscribe to auth state changes
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
    try {
        await auth.signOut();
        // console.log('User signed out');
    } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
    }
}

/**
 * Get user profile from database
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
        const userProfileRef = ref(db, `userProfiles/${uid}`);
        const snapshot = await get(userProfileRef);

        if (snapshot.exists()) {
            return snapshot.val() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error('Failed to get user profile:', error);
        return null;
    }
}
