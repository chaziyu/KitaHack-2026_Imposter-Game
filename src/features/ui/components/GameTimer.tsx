import { useEffect, useState } from 'react';
import { useGameStore } from '../../../stores/useGameStore';

export const GameTimer = () => {
    const { network, isHost, roomCode } = useGameStore();
    const [endTime, setEndTime] = useState<number | null>(null);
    const [displayTime, setDisplayTime] = useState(600);

    // 1. Subscribe to the TARGET END TIME from the server
    useEffect(() => {
        if (!network) return;
        const unsub = network.subscribeToTimer((serverEndTime: number) => {
            setEndTime(serverEndTime);
        });
        return () => unsub?.();
    }, [network]);

    // 2. Run a local countdown interval against the server end time
    useEffect(() => {
        if (endTime === null) return;

        const updateTimer = () => {
            const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setDisplayTime(remaining);

            // Host triggers Imposter Win on timeout
            if (remaining <= 0 && isHost && roomCode) {
                import('firebase/database').then(({ ref, set }) => {
                    import('../../../firebaseConfig').then(({ db }) => {
                        set(ref(db, `rooms/${roomCode}/status`), 'VICTORY_IMPOSTER');
                    });
                });
            }
        };

        // Run immediately then every 100ms
        updateTimer();
        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [endTime, isHost, roomCode]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isCritical = displayTime < 60;

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-black/80 border-2 ${isCritical ? 'border-red-500 text-red-500 animate-pulse' : 'border-blue-500 text-blue-400'} px-6 py-2 rounded-xl font-mono text-2xl shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
            {formatTime(displayTime)}
        </div>
    );
};
