import { motion } from 'framer-motion';
import { useGameStore } from '../../stores/useGameStore';
import type { PlayerState } from '../networking/NetworkInterface';

interface VictoryScreenProps {
    status: 'VICTORY_CREW' | 'VICTORY_IMPOSTER';
    players: PlayerState[];
    teamChallengesCompleted: number;
    onReturnToLobby?: () => void;
    onLeaveGame?: () => void;
    onContinuePlaying?: () => void;
}

export const VictoryScreen = ({ status, players, teamChallengesCompleted, onReturnToLobby, onLeaveGame, onContinuePlaying }: VictoryScreenProps) => {
    const { isHost } = useGameStore();
    const isHeroesWin = status === 'VICTORY_CREW';



    let winReason = '';
    if (isHeroesWin) {
        if (teamChallengesCompleted >= 3) {
            winReason = 'All challenges completed!';
        } else {
            winReason = 'All imposters voted out!';
        }
    } else {
        winReason = 'The station has been compromised!';
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-[100]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`max-w-4xl w-full mx-4 rounded-3xl p-8 shadow-2xl border-4 ${isHeroesWin
                    ? 'bg-gradient-to-br from-blue-900 to-green-900 border-green-500'
                    : 'bg-gradient-to-br from-red-900 to-gray-900 border-red-500'
                    }`}
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ y: -50 }}
                        animate={{ y: 0 }}
                        className="text-6xl font-black text-white mb-4"
                    >
                        {isHeroesWin ? '🎉 HEROES WIN! 🎉' : '😈 IMPOSTERS WIN! 😈'}
                    </motion.h1>
                    <motion.p
                        initial={{ y: -30 }}
                        animate={{ y: 0 }}
                        className="text-2xl text-gray-200 font-bold"
                    >
                        {winReason}
                    </motion.p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* Challenges Completed */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                        <div className="text-gray-300 text-sm mb-1">Challenges Completed</div>
                        <div className="text-4xl font-black text-white">{teamChallengesCompleted}/3</div>
                    </div>

                    {/* Players Alive */}
                    <div className="bg-black/30 rounded-xl p-4 border border-white/20">
                        <div className="text-gray-300 text-sm mb-1">Players Alive</div>
                        <div className="text-4xl font-black text-white">
                            {players.filter(p => p.isAlive).length}/{players.length}
                        </div>
                    </div>
                </div>

                {/* Player Reveal */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">🔍 Player Roles Revealed</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className={`p-3 rounded-lg border-2 ${player.role === 'imposter' || player.role === 'reformed'
                                    ? 'bg-red-900/30 border-red-500'
                                    : 'bg-blue-900/30 border-blue-500'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-white font-bold">{player.name}</span>
                                    <span className={`text-sm font-bold px-2 py-1 rounded ${player.role === 'imposter' || player.role === 'reformed'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-blue-600 text-white'
                                        }`}>
                                        {player.role === 'reformed' ? '😇 REFORMED' :
                                            player.role === 'imposter' ? '😈 IMPOSTER' : '🦸 HERO'}
                                    </span>
                                </div>
                                {!player.isAlive && (
                                    <div className="text-xs text-gray-400 mt-1">💀 Ejected</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                    {isHost && onReturnToLobby && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onReturnToLobby}
                            className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl transition-colors"
                        >
                            🔄 Return to Lobby
                        </motion.button>
                    )}

                    {onContinuePlaying && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onContinuePlaying}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl transition-colors"
                        >
                            ▶️ Continue Playing
                        </motion.button>
                    )}

                    {onLeaveGame && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onLeaveGame}
                            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold text-lg rounded-xl transition-colors"
                        >
                            👋 Leave Game
                        </motion.button>
                    )}
                </div>
            </motion.div >
        </div >
    );
};
