import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { db } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { PlanetDashboard } from './PlanetDashboard';
import { RoleRevealModal } from './RoleRevealModal';
import { assignRoles, syncRolesToFirebase, getPlayerRole } from '../../utils/RoleManager';
import { LEVEL_1_PROBLEMS } from '../../shared/ProblemData';

import { usePlayerStore } from '../../stores/usePlayerStore';
// // import { FirebaseAdapter } from '../../features/networking/FirebaseAdapter'; <--- MOVED TO COMMENT OR REMOVED
import type { PlayerState } from '../../features/networking/NetworkInterface';

export const LobbyScreen = () => {
    const {
        roomCode, playerId, isHost,
        playerSkin, playerTint,
        setGameState, network
    } = useGameStore();

    // Local state for UI
    const [players, setLocalPlayers] = useState<PlayerState[]>([]);
    const { setPlayers: setGlobalPlayers } = usePlayerStore();

    // Services
    // Use the shared network adapter from the store
    // const [adapter] = useState(() => new FirebaseAdapter()); <--- REMOVED

    // Sync network players
    useEffect(() => {
        if (!roomCode || !network) return;

        network.subscribeToPlayers((updatedPlayers: PlayerState[]) => {
            setLocalPlayers(updatedPlayers);
            setGlobalPlayers(updatedPlayers);
        });
    }, [roomCode, network, setGlobalPlayers]);

    const [showRoleReveal, setShowRoleReveal] = useState(false);
    const [playerRole, setPlayerRole] = useState<'hero' | 'imposter' | 'reformed' | null>(null);
    const [assignmentError, setAssignmentError] = useState<string | null>(null);

    // Sync Customization to LocalStorage
    useEffect(() => {
        const session = localStorage.getItem('imposter_session');
        if (session) {
            try {
                const data = JSON.parse(session);
                // Only write if changed to avoid unnecessary writes
                if (data.skin !== (playerSkin || 'doux') || data.tint !== (playerTint || 0xffffff)) {
                    data.skin = playerSkin || 'doux';
                    data.tint = playerTint || 0xffffff;
                    localStorage.setItem('imposter_session', JSON.stringify(data));
                }
            } catch (e) {
                console.error("Failed to update session", e);
            }
        }
    }, [playerSkin, playerTint]);

    useEffect(() => {
        if (!roomCode) {
            console.warn("[Lobby] Missing roomCode", { roomCode });
            return;
        }

        console.log(`[Lobby] Subscribing to rooms/${roomCode}`);

        // Listen for Game Start
        const statusRef = ref(db, `rooms/${roomCode}/status`);
        const unsubStatus = onValue(statusRef, async (snapshot) => {
            const val = snapshot.val();
            console.log("[Lobby] Status update:", val);
            if (val === 'PLAYING') {
                console.log("[Lobby] Status is PLAYING, fetching role and switching state...");

                // Fetch the player's role from Firebase
                if (playerId && roomCode) {
                    try {
                        const role = await getPlayerRole(roomCode, playerId);
                        if (role) {
                            setPlayerRole(role);
                            setShowRoleReveal(true);
                        }
                    } catch (error) {
                        console.error("[Lobby] Failed to fetch player role:", error);
                    }
                }
            }
        });

        return () => {
            unsubStatus();
        };
    }, [roomCode, setGameState, playerId]);

    const handleStartGame = async () => {
        if (!roomCode) return;

        setAssignmentError(null);

        console.log("[Lobby] handleStartGame called. Players:", players.length, players);

        // Validate minimum players
        if (players.length < 3) {
            console.warn("[Lobby] Not enough players:", players.length);
            setAssignmentError(`Need at least 3 players to start Imposter Mode! (Current: ${players.length})`);
            return;
        }

        console.log("[Lobby] Host starting game...");

        try {
            // 1. Assign roles
            const playerIds = players.map(p => p.id);
            const roleAssignments = assignRoles(playerIds);

            // 2. Sync roles to Firebase
            await syncRolesToFirebase(roomCode, roleAssignments);

            // 3. Set status to PLAYING, Initialize Timer, and Reset Level
            await update(ref(db, `rooms/${roomCode}`), {
                status: 'PLAYING',
                gamestate: {
                    timer: {
                        endTime: Date.now() + 600000 // 10 minutes
                    },
                    files: LEVEL_1_PROBLEMS // Reset environment
                }
            });

            console.log("[Lobby] Roles assigned and game started successfully");
        } catch (error) {
            console.error("[Lobby] Error starting game:", error);
            if (error instanceof Error) {
                setAssignmentError(error.message);
            }
        }
    };

    const handleRoleRevealClose = () => {
        setShowRoleReveal(false);
        setGameState('GAME');
    };

    const copyCode = () => {
        if (roomCode) navigator.clipboard.writeText(roomCode);
    };

    return (
        <div className="h-screen bg-gray-900 overflow-y-auto">
            <div className="flex flex-col items-center text-white p-4">
                <div className="w-full max-w-6xl space-y-8 my-8">

                    {/* START GAME Button (Top Position - Always Visible for Host) */}
                    {isHost && (
                        <div className="bg-gradient-to-r from-green-700 to-emerald-700 rounded-xl p-6 shadow-2xl border-2 border-green-400 animate-pulse">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                                        <span className="text-3xl">👑</span>
                                        YOU ARE THE HOST
                                    </h2>
                                    <p className="text-green-100 text-sm mt-1">Ready to start the mission? Click below!</p>
                                </div>
                            </div>
                            <button
                                onClick={handleStartGame}
                                className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded-lg font-black text-2xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 border-2 border-green-300"
                            >
                                <span className="text-3xl">🚀</span>
                                START GAME
                                <span className="text-3xl">🚀</span>
                            </button>
                            {assignmentError && (
                                <div className="mt-4 bg-red-600/20 border-2 border-red-500 rounded-lg p-3 text-red-200 text-center font-bold">
                                    ⚠️ {assignmentError}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Non-Host Message */}
                    {!isHost && (
                        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
                            <div className="text-center text-gray-400 animate-pulse flex items-center justify-center gap-2">
                                <span className="text-2xl">⏳</span>
                                <span className="text-lg">Waiting for host to start the game...</span>
                            </div>
                        </div>
                    )}

                    {/* 1. Global Impact Dashboard (New Phase 3) */}
                    <PlanetDashboard />

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Left Column: Lobby Details */}
                        <div className="flex-1 w-full bg-gray-800 p-8 rounded-lg shadow-xl">
                            <div className="flex justify-between items-center mb-8">
                                <h1 className="text-3xl font-bold text-cyan-400">LOBBY</h1>
                                <div className="flex items-center gap-4 bg-gray-700 px-4 py-2 rounded">
                                    <span className="text-gray-400">ROOM CODE:</span>
                                    <span className="text-2xl font-mono tracking-widest font-bold">{roomCode}</span>
                                    <button
                                        onClick={copyCode}
                                        className="ml-2 text-sm bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded transition"
                                    >
                                        COPY
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-700/50 p-4 rounded mb-8">
                                <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2">PLAYERS ({players.length})</h2>
                                <ul className="space-y-2">
                                    {players.map((p) => (
                                        <li key={p.id} className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }}></div>
                                            <span className={p.id === playerId ? "text-yellow-400 font-bold" : "text-gray-300"}>
                                                {p.name} {p.id === playerId && "(YOU)"}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Right Column: Customization */}
                        <div className="w-full md:w-96 bg-gray-800 p-8 rounded-lg shadow-xl flex-shrink-0">
                            <h2 className="text-xl font-bold mb-4 border-b border-gray-600 pb-2 w-full text-center">CUSTOMIZE</h2>

                            <div className="flex flex-col gap-4 w-full">
                                {/* Preview Area */}
                                <div className="flex justify-center mb-2">
                                    <div className="relative w-24 h-24 bg-gray-800 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                                        <div className="relative w-[96px] h-[96px]">
                                            <style>{`
                                            @keyframes sprite-play {
                                                from { background-position-x: 0; }
                                                to { background-position-x: -400%; }
                                            }
                                            @keyframes mask-play {
                                                from { -webkit-mask-position-x: 0; mask-position-x: 0; }
                                                to { -webkit-mask-position-x: -400%; mask-position-x: -400%; }
                                            }
                                            .pixelated {
                                                image-rendering: pixelated;
                                            }
                                        `}</style>

                                            {/* Base Sprite */}
                                            <div
                                                className="absolute inset-0 pixelated"
                                                style={{
                                                    backgroundImage: `url('assets/sprites/DinoSprites - ${useGameStore.getState().playerSkin || 'doux'}.png')`,
                                                    backgroundSize: '2400% 100%',
                                                    animation: 'sprite-play 0.8s steps(4) infinite'
                                                }}
                                            />

                                            {/* Tint Overlay (Masked) */}
                                            <div
                                                className="absolute inset-0 pixelated mix-blend-multiply"
                                                style={{
                                                    backgroundColor: '#' + (useGameStore.getState().playerTint || 0xffffff).toString(16).padStart(6, '0'),
                                                    WebkitMaskImage: `url('assets/sprites/DinoSprites - ${useGameStore.getState().playerSkin || 'doux'}.png')`,
                                                    maskImage: `url('assets/sprites/DinoSprites - ${useGameStore.getState().playerSkin || 'doux'}.png')`,
                                                    WebkitMaskSize: '2400% 100%',
                                                    maskSize: '2400% 100%',
                                                    animation: 'mask-play 0.8s steps(4) infinite'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Skin Selector */}
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={() => {
                                            const skins = ['doux', 'mort', 'tard', 'vita'];
                                            const currentSkin = useGameStore.getState().playerSkin || 'doux';
                                            const currentIndex = skins.indexOf(currentSkin);
                                            const nextIndex = (currentIndex - 1 + skins.length) % skins.length;
                                            const nextSkin = skins[nextIndex];

                                            useGameStore.getState().setPlayerSkin(nextSkin);
                                            network?.updatePlayerCustomization(nextSkin, useGameStore.getState().playerTint || 0xffffff);
                                        }}
                                        className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition hover:scale-110"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>

                                    <button
                                        onClick={() => {
                                            const skins = ['doux', 'mort', 'tard', 'vita'];
                                            const currentSkin = useGameStore.getState().playerSkin || 'doux';
                                            const currentIndex = skins.indexOf(currentSkin);
                                            const nextIndex = (currentIndex + 1) % skins.length;
                                            const nextSkin = skins[nextIndex];

                                            useGameStore.getState().setPlayerSkin(nextSkin);
                                            network?.updatePlayerCustomization(nextSkin, useGameStore.getState().playerTint || 0xffffff);
                                        }}
                                        className="p-2 rounded-full bg-gray-600 hover:bg-gray-500 text-white transition hover:scale-110"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Tint Picker */}
                                <div className="flex justify-center gap-2 flex-wrap p-2 bg-gray-800/50 rounded-lg">
                                    {/* NO TINT */}
                                    <button
                                        onClick={() => {
                                            useGameStore.getState().setPlayerTint(0xffffff);
                                            network?.updatePlayerCustomization(useGameStore.getState().playerSkin || 'doux', 0xffffff);
                                        }}
                                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center bg-white ${useGameStore.getState().playerTint === 0xffffff || !useGameStore.getState().playerTint
                                            ? 'border-cyan-400 scale-110 shadow-lg'
                                            : 'border-gray-400 hover:scale-105'
                                            }`}
                                    >
                                        <span className="text-gray-500 text-[10px] font-bold">X</span>
                                    </button>

                                    {/* Colors */}
                                    {[0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff].map((tint) => (
                                        <button
                                            key={tint}
                                            onClick={() => {
                                                useGameStore.getState().setPlayerTint(tint);
                                                network?.updatePlayerCustomization(useGameStore.getState().playerSkin || 'doux', tint);
                                            }}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${useGameStore.getState().playerTint === tint
                                                ? 'border-white scale-125 shadow-md'
                                                : 'border-transparent hover:scale-110'
                                                }`}
                                            style={{ backgroundColor: '#' + tint.toString(16).padStart(6, '0') }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Reveal Modal */}
            {showRoleReveal && playerRole && (
                <RoleRevealModal
                    playerRole={playerRole}
                    onClose={handleRoleRevealClose}
                />
            )}
        </div>
    );
};
