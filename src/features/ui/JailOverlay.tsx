import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { db } from '../../firebaseConfig';
import { ref, update } from 'firebase/database';

export const JailOverlay = () => {
    const { playerId } = useGameStore();
    const { players } = usePlayerStore();
    const [timeLeft, setTimeLeft] = useState(0);

    const me = players.find(p => p.id === playerId);

    useEffect(() => {
        if (!me || me.status !== 'jailed' || !me.jailEndTime) {
            setTimeout(() => setTimeLeft(0), 0);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((me.jailEndTime! - Date.now()) / 1000));
            setTimeLeft(remaining);

            // Self-Release if time is up
            if (remaining <= 0) {
                // Set status back to active
                update(ref(db, `rooms/${useGameStore.getState().roomCode}/players/${playerId}`), {
                    status: 'active',
                    jailEndTime: null
                });
            }

        }, 1000);

        return () => clearInterval(interval);
    }, [me?.status, me?.jailEndTime, playerId]);

    if (!me || me.status !== 'jailed') return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center pointer-events-auto">
            <div className="bg-gray-900 border-4 border-gray-600 p-8 rounded-xl max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
                {/* Bars Effect */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-50">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="w-4 h-full bg-black/60 shadow-[0_0_10px_rgba(0,0,0,0.8)]"></div>
                    ))}
                </div>

                <h1 className="text-6xl font-black text-gray-500 mb-4 animate-pulse">JAILED</h1>
                <p className="text-gray-300 text-xl font-bold mb-8 relative z-10">
                    You have been confined for suspicious behavior.
                </p>

                <div className="text-8xl font-mono font-bold text-red-500 relative z-10">
                    {timeLeft}s
                </div>

                <p className="text-gray-500 mt-8 text-sm relative z-10">
                    Serving time...
                </p>
            </div>
        </div>
    );
};
