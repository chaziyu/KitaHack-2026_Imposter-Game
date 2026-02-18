import React, { useEffect } from 'react';
import { db } from '../../firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { usePlayerProgress } from '../../stores/usePlayerProgress';
import toast from 'react-hot-toast';

export const ChallengeMonitor = () => {
    const completedChallenges = usePlayerProgress(state => state.completedChallenges);
    const uncompleteChallenge = usePlayerProgress(state => state.uncompleteChallenge);
    // Use a ref so the onValue callback always reads the latest value without re-subscribing
    const completedRef = React.useRef(completedChallenges);
    React.useEffect(() => { completedRef.current = completedChallenges; }, [completedChallenges]);

    useEffect(() => {
        const filesRef = ref(db, 'gamestate/files');

        const unsubscribe = onValue(filesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            Object.entries(data).forEach(([fileId, fileData]) => {
                const fd = fileData as { testStatus?: string };
                const status = fd.testStatus || 'PENDING';

                // If file is failing/broken but we have it marked as completed -> Revert it!
                if (status !== 'PASS' && completedRef.current.includes(fileId)) {
                    console.log(`[ChallengeMonitor] Detected regression in ${fileId}. Un-completing.`);
                    uncompleteChallenge(fileId);

                    toast('⚠️ SABOTAGE DETECTED: Progress Lost!', {
                        icon: '📉',
                        style: {
                            background: '#7f1d1d',
                            color: '#fff',
                            fontWeight: 'bold'
                        }
                    });
                }
            });
        });

        return () => unsubscribe();
    }, []); // Empty deps: subscribe once, use ref for latest completedChallenges

    return null; // Headless component
};
