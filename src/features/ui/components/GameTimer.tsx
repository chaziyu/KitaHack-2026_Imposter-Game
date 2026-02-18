import { useEffect, useState } from 'react';
import { useGameStore } from '../../../stores/useGameStore';

export const GameTimer = () => {
    const { network, isHost, roomCode } = useGameStore();
    const [endTime, setEndTime] = useState<number | null>(null);
    const [displayTime, setDisplayTime] = useState(600);

    // 1. Subscribe to the TARGET END TIME (not seconds)
    useEffect(() => {
        if (!network) return;
        network.subscribeToTimer((serverEndTime) => {
            setEndTime(serverEndTime);
        });
    }, [network]);

        network.subscribeToTimer((time: number) => {
            setTimeLeft(time);

            // Host checks for timeout victory for Imposters
            if (time <= 0 && isHost && roomCode) {
                import('firebase/database').then(({ ref, set }) => {
                    import('../../../firebaseConfig').then(({ db }) => {
                        // Double check status to avoid spamming
                        // trigger Imposter Win
                        set(ref(db, `rooms/${roomCode}/status`), 'VICTORY_IMPOSTER');
                    });
                });
            }
        };

        // Run immediately
        updateTimer();

        // Run every 100ms for responsiveness (UI updates every second effectively due to ceil)
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [endTime, isHost, roomCode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical = displayTime < 60; // Red alert last minute

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 border-2 ${isCritical ? 'border-red-500 text-red-500 animate-pulse' : 'border-blue-500 text-blue-400'} px-6 py-2 rounded-xl font-mono text-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
            {formatTime(displayTime)}
        </div>
    );
};
