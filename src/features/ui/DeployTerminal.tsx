import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerProgress } from '../../stores/usePlayerProgress';
import { motion, AnimatePresence } from 'framer-motion';

export const DeployTerminal = () => {
    const { network, roomCode } = useGameStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isDeploying, setIsDeploying] = useState(false);

    const handleDeploy = () => {
        if (!network || !roomCode) return;
        setIsDeploying(true);

        // Simulate "Integration Test"
        setTimeout(() => {
            // Fetch latest data from gamestate/files (Source of Truth)
            import('firebase/database').then(({ ref, get, set }) => {
                import('../../firebaseConfig').then(({ db }) => {
                    get(ref(db, `gamestate/files`)).then((fileSnap) => {
                        const files = fileSnap.val() || {};
                        const fileEntries = Object.entries(files);

                        // Sync Local Progress with Global State
                        // If a file is PASSED in global state, mark it complete locally
                        // This fixes the "0/3" bug if someone else completed it
                        const { completeChallenge } = usePlayerProgress.getState();

                        // Count how many files are actually passing (Real or Fake)
                        const passedFiles = fileEntries.filter(([id, f]: [string, any]) => {
                            const isPassing = f.testStatus === 'PASS';
                            if (isPassing) {
                                completeChallenge(id); // SYNC LOCAL STATE
                            }
                            return isPassing;
                        });

                        const passedCount = passedFiles.length;

                        // Dynamic Total (based on actual files in DB, or fallback to 3)
                        const totalChallenges = fileEntries.length > 0 ? fileEntries.length : 3;

                        // Check for Corruption (Imposter Sabotage) within the PASSED files
                        // A file is only dangerous if it's "Passing" but Corrupted.
                        const corruptedFiles = passedFiles.filter(([_, f]: [string, any]) => f.isCorrupted);

                        if (passedCount < totalChallenges) {
                            network.sendNotification(`❌ DEPLOYMENT FAILED! ${totalChallenges - passedCount} modules incomplete. -30s Penalty!`, "error");
                            network.applyTimerPenalty(30);
                        } else if (corruptedFiles.length > 0) {
                            // ALL Passed, BUT Corruption Detected!
                            network.sendNotification(`❌ DEPLOYMENT FAILED! Critical system corruption detected. -30s Penalty!`, "error");
                            network.applyTimerPenalty(30);
                        } else {
                            // ALL Passed AND Clean
                            network.sendNotification("🚀 DEPLOYMENT SUCCESSFUL! SYSTEM STABLE.", "success");
                            set(ref(db, `rooms/${roomCode}/status`), 'VICTORY_CREW');
                        }

                        setIsDeploying(false);
                        setIsOpen(false);
                    });
                });
            });
        }, 3000); // 3s "Deploying" animation
    };

    return (
        <>
            {/* Trigger Button (Always visible near bottom-right or spawn) */}
            <div className="fixed bottom-32 right-4 z-40">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-full shadow-lg border-2 border-blue-400 animate-pulse flex items-center gap-2"
                >
                    <span className="text-2xl">🚀</span> DEPLOY
                </button>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border-2 border-blue-500 p-8 rounded-xl max-w-md w-full text-center shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white"
                            >
                                ✕
                            </button>

                            <h2 className="text-3xl font-black text-blue-400 mb-2">DEPLOY TO PRODUCTION</h2>
                            <p className="text-gray-300 mb-6">
                                Run integration tests and deploy the codebase?
                                <br />
                                <span className="text-red-400 text-sm">Warning: Failure will result in a 30s penalty.</span>
                            </p>

                            {isDeploying ? (
                                <div className="space-y-4">
                                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 animate-[width_3s_ease-in-out_forwards]" style={{ width: '100%' }}></div>
                                    </div>
                                    <p className="text-blue-300 font-mono animate-pulse">Running Integration Tests...</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleDeploy}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded text-xl shadow-lg border border-blue-400 transition-transform transform hover:scale-105"
                                >
                                    CONFIRM DEPLOYMENT
                                </button>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
