import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { db } from '../../firebaseConfig';
import { ref, onValue, update } from 'firebase/database';
import { runSystemTests } from '../game/GameLogic';

export const CentralTerminal = () => {
    const closeTerminal = useGameStore((state) => state.closeTerminal);
    const [logs, setLogs] = useState<string[]>(["Waiting for input..."]);
    const [status, setStatus] = useState<'IDLE' | 'PASS' | 'FAIL'>('IDLE');
    const [files, setFiles] = useState<any>({});

    // 1. Listen to the latest code changes
    useEffect(() => {
        const filesRef = ref(db, 'gamestate/files');
        return onValue(filesRef, (snapshot) => {
            setFiles(snapshot.val() || {});
        });
    }, []);

    // 2. The "Deploy" Action
    const handleDeploy = () => {
        setLogs(["Compiling..."]);

        // Simulate a slight delay for dramatic effect
        setTimeout(() => {
            const result = runSystemTests(files);
            setLogs(result.logs);
            setStatus(result.success ? 'PASS' : 'FAIL');

            // Update Global Game State (so everyone sees the result!)
            update(ref(db, 'gamestate'), {
                buildStatus: result.success ? 'STABLE' : 'BROKEN',
                lastDeploy: Date.now()
            });
        }, 1000);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="bg-slate-900 border-2 border-blue-500 p-6 w-2/3 rounded-xl shadow-2xl">
                <h2 className="text-blue-400 text-2xl font-bold mb-4 flex justify-between">
                    <span>🚀 PRODUCTION DEPLOYMENT</span>
                    <button onClick={closeTerminal} className="text-gray-500 hover:text-white">✕</button>
                </h2>

                {/* The Logs Screen */}
                <div className="bg-black p-4 h-64 overflow-y-auto font-mono text-sm border border-gray-700 mb-4 rounded">
                    {logs.map((log, i) => (
                        <div key={i} className={log.includes('❌') ? 'text-red-500' : 'text-green-400'}>
                            {log}
                        </div>
                    ))}
                </div>

                {/* Status Indicator */}
                <div className="flex justify-between items-center">
                    <div className={`text-xl font-bold ${status === 'PASS' ? 'text-green-500' : status === 'FAIL' ? 'text-red-500' : 'text-gray-400'
                        }`}>
                        STATUS: {status}
                    </div>

                    <button
                        onClick={handleDeploy}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg transition-transform active:scale-95"
                    >
                        RUN PIPELINE
                    </button>
                </div>
            </div>
        </div>
    );
};