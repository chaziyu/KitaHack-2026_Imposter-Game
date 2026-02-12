import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { motion } from 'framer-motion';

export const RedemptionScreen = () => {
    const { playerId, network } = useGameStore();
    const { players } = usePlayerStore();

    // Check if I am reformed
    const myPlayer = players.find(p => p.id === playerId);
    if (!myPlayer || myPlayer.status !== 'reformed') return null;

    const handleHighlightError = () => {
        // Logic to help heroes: Insert a "HINT" in the global chat or highlight a line
        // Now using global notifications
        network?.sendNotification("💡 REFORMED HINT: Creating functions without calling them is useless!", "info");
        // Or trigger a specific visual aid
    };

    return (
        <div className="fixed bottom-4 left-4 z-50">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-purple-900/90 border-2 border-purple-500 p-4 rounded-xl shadow-2xl max-w-sm"
            >
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">😇</span>
                    <div>
                        <h3 className="font-bold text-purple-200">REDEEMED</h3>
                        <p className="text-xs text-purple-300">Help the team to win!</p>
                    </div>
                </div>

                <button
                    onClick={handleHighlightError}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded shadow transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                    <span>🔍</span> REVEAL BUG
                </button>
            </motion.div>
        </div>
    );
};
