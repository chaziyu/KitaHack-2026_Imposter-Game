import { useState } from 'react';
import { triggerSabotage, type SabotageType } from '../../utils/SabotageSystem';
import { useSabotageCooldown } from '../../hooks/useSabotageCooldown';

interface SabotageMenuProps {
    roomCode: string;
    playerId: string;
    targetFileId?: string;
    onSabotageComplete?: () => void;
}

export const SabotageMenu = ({ roomCode, playerId, targetFileId, onSabotageComplete }: SabotageMenuProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSabotaging, setIsSabotaging] = useState(false);
    const { canSabotage, cooldownRemaining } = useSabotageCooldown(roomCode);

    const handleSabotage = async (type: SabotageType, name: string) => {
        if (!canSabotage || isSabotaging) return;

        // If it's a code sabotage but we don't have a target file, we can't do it
        if (!['power_cut', 'seal_doors', 'lock_terminals'].includes(type) && !targetFileId) {
            console.warn(`[SabotageMenu] ${name} requires a target file!`);
            return;
        }

        setIsSabotaging(true);
        setIsOpen(false);

        const result = await triggerSabotage(type, playerId, roomCode, targetFileId || '');

        if (result.success) {
            // console.log(`[SabotageMenu] ${name} successful:`, result.description);
            onSabotageComplete?.();
        } else {
            console.warn(`[SabotageMenu] ${name} failed:`, result.description);
        }

        setIsSabotaging(false);
    };

    return (
        <div className="fixed bottom-6 right-28 z-50 flex flex-col items-end pointer-events-auto">
            {/* Floating Sabotage Button */}
            <button
                className={`
                    w-16 h-16 rounded-full border-4 shadow-xl flex items-center justify-center text-3xl transition-all duration-300
                    ${!canSabotage || isSabotaging
                        ? 'bg-gray-700 border-gray-600 grayscale cursor-not-allowed scale-90'
                        : 'bg-red-600 border-red-900 hover:bg-red-500 hover:scale-110 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse'
                    }
                    ${isOpen ? 'rotate-45' : 'rotate-0'}
                `}
                onClick={() => canSabotage && setIsOpen(!isOpen)}
                disabled={!canSabotage || isSabotaging}
                title={canSabotage ? 'Sabotage' : `Cooldown: ${cooldownRemaining}s`}
            >
                {isSabotaging ? '⏳' : '🔪'}
                {!canSabotage && (
                    <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-full border border-gray-500">
                        {cooldownRemaining}s
                    </span>
                )}
            </button>

            {/* Sabotage Options Menu */}
            {isOpen && canSabotage && (
                <div className="absolute bottom-20 right-0 w-80 bg-gray-900/95 backdrop-blur-md rounded-xl border-2 border-red-500/50 shadow-2xl p-4 animate-slide-up origin-bottom-right">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                        <span className="text-red-500 font-black text-xl italic tracking-wider flex items-center gap-2">
                            🕵️ SABOTAGE
                        </span>
                        <button
                            className="text-gray-400 hover:text-white transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            ✖
                        </button>
                    </div>

                    <div className="space-y-3">
                        <SabotageOption
                            icon="⚠️"
                            title="Syntax Error"
                            desc="Break their code structure"
                            onClick={() => handleSabotage('syntax_error', 'Syntax Error')}
                        />
                        <SabotageOption
                            icon="🔄"
                            title="Logic Swap"
                            desc="Reverse their boolean logic"
                            onClick={() => handleSabotage('logic_swap', 'Logic Swap')}
                        />
                        <SabotageOption
                            icon="🗑️"
                            title="Clear Line"
                            desc="Delete a random line"
                            onClick={() => handleSabotage('clear_line', 'Clear Line')}
                        />
                        <SabotageOption
                            icon="⚡"
                            title="Power Cut"
                            desc="Blackout the station"
                            isUltimate
                            onClick={() => handleSabotage('power_cut', 'Power Cut')}
                        />

                        <SabotageOption
                            icon="🔒"
                            title="Lock Terminals"
                            desc="Prevent coding for 30s"
                            isUltimate
                            onClick={() => handleSabotage('lock_terminals', 'Lock Terminals')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

interface SabotageOptionProps {
    icon: string;
    title: string;
    desc: string;
    onClick: () => void;
    isUltimate?: boolean;
}

const SabotageOption = ({ icon, title, desc, onClick, isUltimate }: SabotageOptionProps) => (
    <button
        className={`
            w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group text-left
            ${isUltimate
                ? 'bg-red-900/30 border-red-500/50 hover:bg-red-900/50 hover:border-red-400'
                : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-500'
            }
        `}
        onClick={onClick}
    >
        <div className="text-2xl group-hover:scale-110 transition-transform">{icon}</div>
        <div className="flex-1">
            <div className={`font-bold text-sm ${isUltimate ? 'text-red-400' : 'text-gray-200'}`}>{title}</div>
            <div className="text-xs text-gray-500 group-hover:text-gray-400">{desc}</div>
        </div>
    </button>
);
