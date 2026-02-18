import { db } from '../firebaseConfig';
import { ref, update, get } from 'firebase/database';
import { APP_CONSTANTS } from './AppConstants';

export type SabotageType = 'syntax_error' | 'logic_swap' | 'clear_line' | 'power_cut' | 'seal_doors' | 'lock_terminals';

export interface SabotageResult {
    success: boolean;
    newCode: string;
    description: string;
}

/**
 * Apply syntax error sabotage to code
 * Randomly removes a semicolon or adds a mismatched bracket
 */
export function applySyntaxError(code: string): SabotageResult {
    const lines = code.split('\n');
    const nonEmptyLines = lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.trim().length > 0);

    if (nonEmptyLines.length === 0) {
        return { success: false, newCode: code, description: 'No code to sabotage' };
    }

    const randomLine = nonEmptyLines[Math.floor(Math.random() * nonEmptyLines.length)];
    const lineIndex = randomLine.index;
    const line = randomLine.line;

    // Strategy 1: Remove semicolon if present
    if (line.includes(';')) {
        const sabotaged = line.replace(/;/, '');
        lines[lineIndex] = sabotaged;
        return {
            success: true,
            newCode: lines.join('\n'),
            description: 'Removed semicolon'
        };
    }

    // Strategy 2: Add mismatched bracket
    const bracketType = Math.random() > 0.5 ? '(' : '{';
    lines[lineIndex] = line + bracketType;
    return {
        success: true,
        newCode: lines.join('\n'),
        description: `Added mismatched ${bracketType === '(' ? 'parenthesis' : 'brace'}`
    };
}

/**
 * Apply logic swap sabotage to code
 * Swaps operators like true/false, +/-, </>
 */
export function applyLogicSwap(code: string): SabotageResult {
    const swaps = [
        { from: 'true', to: 'false', desc: 'Swapped true → false' },
        { from: 'false', to: 'true', desc: 'Swapped false → true' },
        { from: ' + ', to: ' - ', desc: 'Swapped + → -' },
        { from: ' - ', to: ' + ', desc: 'Swapped - → +' },
        { from: ' < ', to: ' > ', desc: 'Swapped < → >' },
        { from: ' > ', to: ' < ', desc: 'Swapped > → <' },
        { from: '++', to: '--', desc: 'Swapped ++ → --' },
        { from: '--', to: '++', desc: 'Swapped -- → ++' }
    ];

    // Shuffle swaps to try random order
    const shuffled = swaps.sort(() => Math.random() - 0.5);

    for (const swap of shuffled) {
        if (code.includes(swap.from)) {
            // Only swap first occurrence to be subtle
            const newCode = code.replace(swap.from, swap.to);
            return {
                success: true,
                newCode,
                description: swap.desc
            };
        }
    }

    return { success: false, newCode: code, description: 'No suitable operators to swap' };
}

/**
 * Apply clear line sabotage to code
 * Deletes a random non-empty line
 */
export function applyClearLine(code: string): SabotageResult {
    const lines = code.split('\n');
    const nonEmptyLines = lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.trim().length > 0);

    if (nonEmptyLines.length === 0) {
        return { success: false, newCode: code, description: 'No lines to delete' };
    }

    const randomLine = nonEmptyLines[Math.floor(Math.random() * nonEmptyLines.length)];
    lines.splice(randomLine.index, 1);

    return {
        success: true,
        newCode: lines.join('\n'),
        description: `Deleted line ${randomLine.index + 1}`
    };
}

/**
 * Main sabotage function
 * Applies sabotage and syncs to Firebase
 */
export async function triggerSabotage(
    type: SabotageType,
    targetPlayerId: string,
    roomCode: string,
    fileId?: string
): Promise<SabotageResult> {
    try {
        // Get current code from Firebase (if fileId provided)
        let currentCode = '';
        if (fileId) {
            const fileRef = ref(db, `gamestate/files/${fileId}/content`);
            const snapshot = await get(fileRef);
            currentCode = (snapshot.val() as string) || '';
        } else if (type !== 'power_cut' && type !== 'seal_doors' && type !== 'lock_terminals') {
            return { success: false, newCode: '', description: 'Target file required for this sabotage' };
        }

        // Apply sabotage based on type
        let result: SabotageResult;
        switch (type) {
            case 'syntax_error':
                result = applySyntaxError(currentCode);
                break;
            case 'logic_swap':
                result = applyLogicSwap(currentCode);
                break;
            case 'clear_line':
                result = applyClearLine(currentCode);
                break;
            case 'power_cut':
                // Power cut doesn't modify code, just triggers global state
                result = { success: true, newCode: currentCode, description: 'Power grid cut!' };
                break;
            case 'seal_doors':
                result = { success: true, newCode: currentCode, description: 'Doors sealed!' };
                break;
            case 'lock_terminals':
                result = { success: true, newCode: currentCode, description: 'Terminals locked!' };
                break;
            default:
                return { success: false, newCode: currentCode, description: 'Unknown sabotage type' };
        }

        if (!result.success) {
            return result;
        }

        // Sync sabotaged code to Firebase
        const updates: Record<string, unknown> = {};

        if (type === 'power_cut') {
            updates[`rooms/${roomCode}/gamestate/power`] = {
                status: 'OFF',
                timestamp: Date.now(),
                failureTime: Date.now() + 60000 + 1000, // 60s + 1s buffer
                triggeredBy: targetPlayerId
            };
        } else if (type === 'seal_doors') {
            updates[`rooms/${roomCode}/gamestate/doors`] = {
                status: 'SEALED',
                timestamp: Date.now(),
                endTime: Date.now() + 30000, // 30s duration
                triggeredBy: targetPlayerId
            };
        } else if (type === 'lock_terminals') {
            updates[`rooms/${roomCode}/gamestate/terminals`] = {
                status: 'LOCKED',
                timestamp: Date.now(),
                endTime: Date.now() + 30000, // 30s duration
                triggeredBy: targetPlayerId
            };
        } else {
            updates[`gamestate/files/${fileId}`] = {
                content: result.newCode,
                // Critical: Mark as corrupted so Deploy Terminal detects it!
                isCorrupted: true,
                lastSabotage: {
                    type,
                    timestamp: Date.now(),
                    targetPlayerId
                }
            };
        }

        // Update sabotage cooldown in room
        updates[`rooms/${roomCode}/sabotage`] = {
            lastAction: Date.now(),

            cooldownEnd: Date.now() + APP_CONSTANTS.GAME.SABOTAGE_COOLDOWN
        };

        await update(ref(db), updates);

        // console.log(`[Sabotage] ${type} applied:`, result.description);
        return result;

    } catch (error) {
        console.error('[Sabotage] Error:', error);
        return {
            success: false,
            newCode: '',
            description: 'Failed to apply sabotage'
        };
    }
}

/**
 * Check if sabotage is on cooldown
 */
export async function isSabotageOnCooldown(roomCode: string): Promise<boolean> {
    const cooldownRef = ref(db, `rooms/${roomCode}/sabotage/cooldownEnd`);
    const snapshot = await get(cooldownRef);
    const cooldownEnd = snapshot.val();

    if (!cooldownEnd) return false;

    return Date.now() < cooldownEnd;
}

/**
 * Get remaining cooldown time in seconds
 */
export async function getRemainingCooldown(roomCode: string): Promise<number> {
    const cooldownRef = ref(db, `rooms/${roomCode}/sabotage/cooldownEnd`);
    const snapshot = await get(cooldownRef);
    const cooldownEnd = snapshot.val();

    if (!cooldownEnd) return 0;

    const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000));
    return remaining;
}
