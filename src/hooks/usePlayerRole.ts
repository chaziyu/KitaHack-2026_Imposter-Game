import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { ref, onValue } from 'firebase/database';

/**
 * Custom hook to get the current player's role
 * @param roomCode - The current room code
 * @param playerId - The current player ID
 * @returns The player's role or null
 */
export function usePlayerRole(
    roomCode: string | null,
    playerId: string | null
): 'hero' | 'imposter' | 'reformed' | null {
    const [role, setRole] = useState<'hero' | 'imposter' | 'reformed' | null>(null);

    useEffect(() => {
        if (!roomCode || !playerId) {
            // Avoid synchronous state update warning
            const timer = setTimeout(() => setRole(null), 0);
            return () => clearTimeout(timer);
        }

        const roleRef = ref(db, `rooms/${roomCode}/players/${playerId}/role`);
        const unsubscribe = onValue(roleRef, (snapshot) => {
            const roleValue = snapshot.val();
            setRole(roleValue || null);
        });

        return () => unsubscribe();
    }, [roomCode, playerId]);

    return role;
}
