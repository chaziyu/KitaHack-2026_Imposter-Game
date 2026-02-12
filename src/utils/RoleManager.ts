import { db } from '../firebaseConfig';
import { ref, update, get } from 'firebase/database';

export interface RoleAssignment {
    playerId: string;
    role: 'hero' | 'imposter' | 'reformed';
}

/**
 * Assigns roles to players for Imposter Mode.
 * Randomly selects 1 Imposter and assigns the rest as Heroes.
 * 
 * @param playerIds - Array of player IDs in the game
 * @returns Array of role assignments
 * @throws Error if fewer than 3 players
 */
export function assignRoles(playerIds: string[]): RoleAssignment[] {
    if (playerIds.length < 3) {
        throw new Error('Imposter Mode requires at least 3 players');
    }

    // Randomly select one imposter
    const imposterIndex = Math.floor(Math.random() * playerIds.length);

    return playerIds.map((playerId, index) => ({
        playerId,
        role: index === imposterIndex ? 'imposter' : 'hero'
    }));
}

/**
 * Syncs role assignments to Firebase.
 * Updates each player's role in rooms/{roomCode}/players/{playerId}
 * 
 * @param roomCode - The room code
 * @param roleAssignments - Array of role assignments
 */
export async function syncRolesToFirebase(
    roomCode: string,
    roleAssignments: RoleAssignment[]
): Promise<void> {
    const updates: Record<string, string | boolean> = {};

    for (const { playerId, role } of roleAssignments) {
        updates[`rooms/${roomCode}/players/${playerId}/role`] = role;
        updates[`rooms/${roomCode}/players/${playerId}/isAlive`] = true;
        updates[`rooms/${roomCode}/players/${playerId}/status`] = 'active';
    }

    await update(ref(db), updates);
    console.log('[RoleManager] Roles synced to Firebase:', roleAssignments);
}

/**
 * Retrieves a player's role from Firebase.
 * 
 * @param roomCode - The room code
 * @param playerId - The player ID
 * @returns The player's role, or null if not found
 */
export async function getPlayerRole(
    roomCode: string,
    playerId: string
): Promise<'hero' | 'imposter' | 'reformed' | null> {
    const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}/role`);
    const snapshot = await get(playerRef);

    if (snapshot.exists()) {
        return snapshot.val() as 'hero' | 'imposter' | 'reformed';
    }

    return null;
}
