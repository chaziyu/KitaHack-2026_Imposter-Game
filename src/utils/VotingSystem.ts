import { db } from '../firebaseConfig';
import { ref, update, get } from 'firebase/database';

export interface VoteResult {
    ejectedId: string | null;
    votes: Record<string, number>;
    isTie: boolean;
}

/**
 * Cast a vote for a player
 */
export async function castVote(
    voterId: string,
    candidateId: string,
    roomCode: string
): Promise<void> {
    await update(ref(db, `rooms/${roomCode}/meeting/votes`), { [voterId]: candidateId });
    // console.log(`[Voting] ${voterId} voted for ${candidateId}`);
}

/**
 * Calculate vote results
 * Returns the player with most votes, or null if tie
 */
export function calculateVotes(votes: Record<string, string>): VoteResult {
    const voteCounts: Record<string, number> = {};

    // Count votes
    Object.values(votes).forEach(candidateId => {
        voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
    });

    // Find max votes
    const maxVotes = Math.max(...Object.values(voteCounts), 0);
    const winners = Object.keys(voteCounts).filter(id => voteCounts[id] === maxVotes);

    return {
        ejectedId: winners.length === 1 ? winners[0] : null,
        votes: voteCounts,
        isTie: winners.length > 1
    };
}

/**
 * Eject a player (set status to ejected)
 */
export async function ejectPlayer(
    playerId: string,
    roomCode: string
): Promise<void> {
    await update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        status: 'ejected',
        isAlive: false
    });
    // console.log(`[Voting] Player ${playerId} ejected`);
}

/**
 * Reform an ejected Imposter
 */
export async function reformPlayer(
    playerId: string,
    roomCode: string
): Promise<void> {
    const playerRef = ref(db, `rooms/${roomCode}/players/${playerId}`);
    const snapshot = await get(playerRef);
    const player = snapshot.val();

    if (player && player.role === 'imposter') {
        await update(playerRef, {
            role: 'reformed',
            status: 'reformed'
        });
        // console.log(`[Voting] Imposter ${playerId} reformed`);
    }
}

/**
 * Start a meeting
 */
export async function startMeeting(
    callerId: string,
    roomCode: string
): Promise<void> {
    await update(ref(db, `rooms/${roomCode}/meeting`), {
        active: true,
        callerId,
        startTime: Date.now(),
        endTime: Date.now() + 30000, // 30 seconds
        votes: {}
    });
}

/**
 * End a meeting and process results
 */
export async function endMeeting(
    roomCode: string
): Promise<VoteResult> {
    const meetingRef = ref(db, `rooms/${roomCode}/meeting`);
    const snapshot = await get(meetingRef);
    const meeting = snapshot.val();

    const result = calculateVotes(meeting.votes || {});

    // Eject player if not a tie
    if (result.ejectedId) {
        await ejectPlayer(result.ejectedId, roomCode);

        // Check if ejected player was imposter - reform them
        const playerRef = ref(db, `rooms/${roomCode}/players/${result.ejectedId}/role`);
        const roleSnapshot = await get(playerRef);
        if (roleSnapshot.val() === 'imposter') {
            await reformPlayer(result.ejectedId, roomCode);
        }
    }

    // Clear meeting state
    await update(meetingRef, {
        active: false,
        callerId: null,
        votes: {},
        result
    });

    return result;
}
