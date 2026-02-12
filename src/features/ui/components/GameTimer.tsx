import { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';

export const GameTimer = () => {
    const { network, isHost, roomCode } = useGameStore();
    const [timeLeft, setTimeLeft] = useState(600); // 10 mins default

    useEffect(() => {
        if (!network) return;

        network.subscribeToTimer((time) => {
            setTimeLeft(time);

            // Host checks for timeout victory for Imposters
            if (time <= 0 && isHost && roomCode) {
                import('firebase/database').then(({ ref, set }) => {
                    import('../../firebaseConfig').then(({ db }) => {
                        // Double check status to avoid spamming
                        // trigger Imposter Win
                        set(ref(db, `rooms/${roomCode}/status`), 'VICTORY_IMPOSTER');
                    });
                });
            }
        });
    }, [network, isHost, roomCode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical = timeLeft < 60; // Red alert last minute

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 border-2 ${isCritical ? 'border-red-500 text-red-500 animate-pulse' : 'border-blue-500 text-blue-400'} px-6 py-2 rounded-xl font-mono text-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
            {formatTime(timeLeft)}
        </div>
    );
};
