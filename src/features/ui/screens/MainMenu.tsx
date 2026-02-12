import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { db } from '../../firebaseConfig';
import { ref, get, set } from 'firebase/database';
import { FirebaseAdapter } from '../networking/FirebaseAdapter';


export const MainMenu = () => {
    const { setGameState, setRoomCode, setPlayerName, setIsHost, setNetwork, setPlayerId, playerSkin, playerTint } = useGameStore();
    const [name, setName] = useState('');
    const [roomInput, setRoomInput] = useState('');
    const [error, setError] = useState('');
    const [savedSession, setSavedSession] = useState<{ id: string, room: string, name: string, isHost: boolean, skin?: string, tint?: number } | null>(null);

    // 1. Load Session on Startup
    useEffect(() => { // Using explicit useEffect for clarity
        const session = localStorage.getItem('imposter_session');
        if (session) {
            try {
                setSavedSession(JSON.parse(session));
            } catch (e) {
                console.error("Failed to parse session", e);
                localStorage.removeItem('imposter_session');
            }
        }
    }, []);

    const saveSession = (id: string, room: string, name: string, isHost: boolean, skin: string, tint: number) => {
        const session = { id, room, name, isHost, skin, tint };
        localStorage.setItem('imposter_session', JSON.stringify(session));
        setSavedSession(session);
    };

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreateRoom = async () => {
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }

        const code = generateRoomCode();

        // Check if room exists (unlikely collision but good practice)
        const roomRef = ref(db, `rooms/${code}`);
        const snapshot = await get(roomRef);

        if (snapshot.exists()) {
            handleCreateRoom(); // Retry
            return;
        }

        // Create Room in FB (Status only)
        await set(roomRef, {
            status: 'LOBBY',
            host: name,
            createdAt: Date.now()
        });

        // CONNECT NETWORK
        const adapter = new FirebaseAdapter();
        const id = await adapter.connect(code, name, undefined, playerSkin, playerTint);

        // Save Session
        saveSession(id, code, name, true, playerSkin || 'doux', playerTint || 0xffffff);

        // Update Store
        setNetwork(adapter);
        setPlayerId(id);
        setPlayerName(name);
        setRoomCode(code);
        setIsHost(true);
        setGameState('LOBBY');
    };

    const handleJoinRoom = async () => {
        if (!name.trim()) {
            setError('Please enter a name');
            return;
        }
        if (!roomInput.trim() || roomInput.length !== 4) {
            setError('Please enter a valid 4-letter code');
            return;
        }

        const code = roomInput.toUpperCase();
        const roomRef = ref(db, `rooms/${code}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
            setError('Room not found');
            return;
        }

        // CONNECT NETWORK
        const adapter = new FirebaseAdapter();
        const id = await adapter.connect(code, name, undefined, playerSkin, playerTint);

        // Save Session
        saveSession(id, code, name, false, playerSkin || 'doux', playerTint || 0xffffff);

        // Update Store
        setNetwork(adapter);
        setPlayerId(id);
        setPlayerName(name);
        setRoomCode(code);
        setIsHost(false);
        setGameState('LOBBY');
    };

    const handleRejoin = async () => {
        if (!savedSession) return;

        const { id, room, name, isHost, skin, tint } = savedSession;
        console.log(`[Rejoin] Attempting to rejoin ${room} as ${name} (${id})`);

        // 1. Check if room exists
        const roomRef = ref(db, `rooms/${room}`);
        const roomSnapshot = await get(roomRef);
        if (!roomSnapshot.exists()) {
            setError("Room no longer exists!");
            localStorage.removeItem('imposter_session');
            setSavedSession(null);
            return;
        }

        // 2. Check if player exists (optional, but good for validity)
        const playerRef = ref(db, `rooms/${room}/players/${id}`);
        const playerSnapshot = await get(playerRef);

        if (!playerSnapshot.exists()) {
            setError("Player not found in room (maybe kicked?)");
            localStorage.removeItem('imposter_session');
            setSavedSession(null);
            return;
        }

        // 3. Connect (Resume)
        const adapter = new FirebaseAdapter();
        // Pass existing ID to resume session, AND restore skin/tint
        await adapter.connect(room, name, id, skin || 'doux', tint || 0xffffff);

        // 4. Update Store
        setNetwork(adapter);
        setPlayerId(id);
        setPlayerName(name);
        setRoomCode(room);
        setIsHost(isHost);

        // RESTORE CUSTOMIZATION STATE
        useGameStore.getState().setPlayerSkin(skin || 'doux');
        useGameStore.getState().setPlayerTint(tint || 0xffffff);

        // Determine Game State
        const roomData = roomSnapshot.val();
        if (roomData.status === 'PLAYING') {
            setGameState('GAME');
        } else {
            console.log('joining lobby')
            setGameState('LOBBY');
        }
    };



    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-xl">
                <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    IMPOSTER GAME
                </h1>

                {savedSession && (
                    <div className="mb-6 w-full animate-fade-in">
                        <button
                            onClick={handleRejoin}
                            className="w-full bg-yellow-600/90 hover:bg-yellow-500 text-white py-4 rounded-lg font-bold border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] flex flex-col items-center transition-all transform hover:scale-[1.02]"
                        >
                            <span className="text-lg">⚡ REJOIN ROOM {savedSession.room}</span>
                            <span className="text-xs text-yellow-200 font-normal mt-1">as {savedSession.name}</span>
                        </button>
                        <div className="text-center mt-2">
                            <button
                                onClick={() => {
                                    localStorage.removeItem('imposter_session');
                                    setSavedSession(null);
                                }}
                                className="text-gray-500 text-xs hover:text-white underline transition-colors"
                            >
                                Clear Saved Session
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Nickname</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-cyan-500 focus:outline-none text-white placeholder-gray-500"
                            placeholder="Enter your name"
                        />
                    </div>



                    <div className="border-t border-gray-700 pt-6">
                        <button
                            onClick={handleCreateRoom}
                            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded font-bold transition-all transform hover:scale-[1.02] shadow-lg mb-4"
                        >
                            CREATE ROOM
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="h-px bg-gray-700 flex-1"></div>
                        <span className="text-gray-500 text-sm">OR</span>
                        <div className="h-px bg-gray-700 flex-1"></div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={roomInput}
                            onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                            maxLength={4}
                            className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded focus:ring-2 focus:ring-purple-500 focus:outline-none text-white placeholder-gray-500 uppercase tracking-widest text-center font-mono"
                            placeholder="CODE"
                        />
                        <button
                            onClick={handleJoinRoom}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-500 rounded font-bold transition-all text-gray-200"
                        >
                            JOIN
                        </button>
                    </div>
                </div>

                {/* Technical Badges Footer */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <p className="text-center text-gray-500 text-xs mb-3 font-semibold tracking-wider">POWERED BY</p>
                    <div className="flex justify-center gap-4 flex-wrap opacity-70 hover:opacity-100 transition-opacity">
                        <span className="px-2 py-1 bg-gray-900 rounded border border-gray-600 text-[10px] text-cyan-400 flex items-center gap-1">
                            ⚛️ React + Vite
                        </span>
                        <span className="px-2 py-1 bg-gray-900 rounded border border-gray-600 text-[10px] text-yellow-500 flex items-center gap-1">
                            🔥 Firebase
                        </span>
                        <span className="px-2 py-1 bg-gray-900 rounded border border-gray-600 text-[10px] text-blue-400 flex items-center gap-1">
                            ✨ Gemini Pro
                        </span>
                        <span className="px-2 py-1 bg-gray-900 rounded border border-gray-600 text-[10px] text-purple-400 flex items-center gap-1">
                            🎮 Phaser 3
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

