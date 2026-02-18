import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { db } from '../../firebaseConfig';
import { ref, onValue, set, update } from 'firebase/database';
import { executeCode } from '../game/CodeRunner';
import { LEVEL_1_PROBLEMS } from '../../shared/ProblemData';
import Editor from '@monaco-editor/react';
import { ChallengeAnimation } from './ChallengeAnimation';
import { SDGBadgeGroup } from './SDGBadge';
import { MentorChat } from './MentorChat';
import { usePlayerProgress } from '../../stores/usePlayerProgress';
import { aiChallengeService } from '../../services/AIChallengeService';
import { SDGPopup } from './SDGPopup';
import { CodeReviewModal } from './CodeReviewModal';
import { GreenCoderScoreModal } from './GreenCoderScoreModal';
import type { GreenCoderScore } from '../../types/ai-levels';

import { usePlayerRole } from '../../hooks/usePlayerRole';
import toast, { Toaster } from 'react-hot-toast';

export const CodeEditor = () => {
    const { activeFileId, closeTerminal, roomCode, playerId, network } = useGameStore();
    const { completeChallenge, completedChallenges } = usePlayerProgress();
    const [code, setCode] = useState('');
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus] = useState<'PENDING' | 'PASS' | 'FAIL'>('PENDING');
    const [showGlitchEffect, setShowGlitchEffect] = useState(false);
    const previousCodeRef = useRef('');

    // Get player's role
    const playerRole = usePlayerRole(roomCode, playerId);

    // AI Review State
    const [aiFeedback, setAiFeedback] = useState<{ rating: number, feedback: string, tip: string } | null>(null);
    const [isReviewing, setIsReviewing] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);

    // Green Coder Score State
    const [greenScore, setGreenScore] = useState<GreenCoderScore | null>(null);
    const [showGreenScoreModal, setShowGreenScoreModal] = useState(false);

    // SDG Popup State
    const [completedSdg, setCompletedSdg] = useState<number | null>(null);

    // Mentor Chat state
    const [showMentorChat, setShowMentorChat] = useState(false);

    // Get problem definition
    const problem = activeFileId ? LEVEL_1_PROBLEMS[activeFileId] : null;
    const filename = problem ? problem.name : 'Loading...';
    const language = problem ? problem.language : 'javascript'; // Default to JS if unknown

    // 1. Subscribe to the specific file in Firebase
    useEffect(() => {
        if (!activeFileId) return;

        const fileRef = ref(db, `gamestate/files/${activeFileId}`);

        // Listen for changes (from other players!)
        const unsubscribe = onValue(fileRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setStatus(data.testStatus || 'PENDING');

                // Detect sabotage
                const newCode = data.content || '';
                const wasSabotaged = data.lastSabotage &&
                    data.lastSabotage.timestamp > Date.now() - 3000; // Last 3 seconds

                if (wasSabotaged && playerRole === 'hero') {
                    // Show glitch effect and notification
                    setShowGlitchEffect(true);
                    setTimeout(() => setShowGlitchEffect(false), 1000);

                    toast.error('⚠️ ALERT: Code Sabotaged! Fix it quickly!', {
                        duration: 4000,
                        icon: '🚨',
                        style: {
                            background: '#7f1d1d',
                            color: '#fff',
                            fontWeight: 'bold'
                        }
                    });
                }

                // Only update local text if we aren't currently typing
                if (document.activeElement?.tagName !== 'TEXTAREA') {
                    setCode(newCode);
                    previousCodeRef.current = newCode;
                }
            }
        });

        return () => unsubscribe();
    }, [activeFileId, playerRole]);

    // Listen for ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeTerminal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closeTerminal]);

    // 2. Handle Typing (Auto-Save to Firebase)
    const handleEditorChange = (value: string | undefined) => {
        if (value === undefined) return;

        setCode(value);
        // Write to Firebase instantly
        if (activeFileId) {
            set(ref(db, `gamestate/files/${activeFileId}/content`), value);
        }
    };

    // 3. Run Code via Piston
    const handleRun = async () => {
        if (!problem || !activeFileId) return;

        setIsRunning(true);
        setOutput("Running...");
        setLastError(null); // Clear previous errors
        setAiFeedback(null); // Clear previous feedback

        // Execute against the problem's expected output
        const result = await executeCode(problem.language, code, problem.expectedOutput);

        setOutput(result.output);
        setIsRunning(false);

        // Update Status in Firebase
        let newStatus: 'PASS' | 'FAIL' = result.success ? 'PASS' : 'FAIL';
        let isCorrupted = false;

        // IMPOSTER MECHANIC: Deceptive Save
        if (playerRole === 'imposter') {
            if (!result.success) {
                // If code is broken, Imposters can "Fake" a pass
                newStatus = 'PASS';
                isCorrupted = true;
                toast.success('😈 SABOTAGE SUCCESSFUL: System incorrectly reports stability.', {
                    icon: '😈',
                    style: { background: '#4a0404', color: '#ffaaaa' }
                });
            } else {
                toast('You fixed it? Preventing sabotage...', { icon: '🤔' });
            }
        } else {
            // Hero Logic (Standard)
            if (result.success && activeFileId) {
                completeChallenge(activeFileId);
                // Sync to team challenges in multiplayer (for heroes only)
                if (roomCode && network) {
                    network.syncTeamChallengeCompletion(activeFileId);
                }
                // Trigger SDG Popup (Visual Celebration)
                if (problem.sdgGoals && problem.sdgGoals.length > 0) {
                    setCompletedSdg(problem.sdgGoals[0]);
                }
            } else {
                if (result.output.toLowerCase().includes('error')) {
                    setLastError(result.output);
                }
            }
        }

        setStatus(newStatus); // Update local UI

        // Firebase Update
        update(ref(db, `gamestate/files/${activeFileId}`), {
            testStatus: newStatus,
            isCorrupted: isCorrupted
        });

        // BACKGROUND PRE-FETCH: If Hero passes, silently trigger Green Coder analysis
        if (newStatus === 'PASS' && playerRole === 'hero' && activeFileId && problem) {
            // Non-blocking trigger
            (async () => {
                try {
                    const solution = problem.solutionCode || "";
                    const greenResult = await aiChallengeService.getGreenCoderScore(
                        code,
                        problem.description,
                        solution,
                        problem.language
                    );
                    if (greenResult.success && greenResult.score) {
                        setGreenScore(greenResult.score);
                        lastReviewedCodeRef.current = code;
                    }
                } catch (e) {
                    console.warn("Background analysis failed:", e);
                }
            })();
        }
    };

    // Open Mentor Chat
    const handleOpenMentorChat = () => {
        setShowMentorChat(true);
    };

    // Request AI Green Code Analysis
    const handleRequestReview = async () => {
        if (!activeFileId || !problem || code.length < 10) return;

        // Caching: Avoid redundant calls if code hasn't changed
        if (code === lastReviewedCodeRef.current && greenScore) {
            setShowGreenScoreModal(true);
            return;
        }

        setIsReviewing(true);
        setGreenScore(null);
        setAiFeedback(null);

        try {
            // Priority: Try Green Coder Analysis first (The "Impact" Feature)
            const solution = problem.solutionCode || "";
            const greenResult = await aiChallengeService.getGreenCoderScore(
                code,
                problem.description,
                solution,
                problem.language
            );

            if (greenResult.success && greenResult.score) {
                setGreenScore(greenResult.score);
                lastReviewedCodeRef.current = code; // Update cache
                setShowGreenScoreModal(true);
            } else {
                // Fallback to standard review if Green Coder fails
                const review = await aiChallengeService.submitForReview(activeFileId, code);
                if (review.success) {
                    setAiFeedback({
                        rating: review.rating,
                        feedback: review.feedback,
                        tip: review.tip
                    });
                    lastReviewedCodeRef.current = code; // Update cache
                    setShowReviewModal(true);
                }
            }
        } catch (error) {
            console.error("Review failed:", error);
            toast.error("Could not analyze code impact.");
        } finally {
            setIsReviewing(false);
        }
    };


    // State for Error Decoder
    const [lastError, setLastError] = useState<string | null>(null);
    const lastReviewedCodeRef = useRef<string>('');

    // Monaco Editor OnMount - Register Eco-Lens
    const handleEditorDidMount = (_editor: any, monaco: any) => {
        // Register the Eco-Lens Hover Provider
        monaco.languages.registerHoverProvider('javascript', {
            provideHover: function (model: any, position: any) {
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const keywords: Record<string, string> = {
                    'for': '🔄 **LOOPS = RECYCLING ROBOTS**\n\nJust like sorting 100 bottles one by one is hard, loops let us automate the process! One loop can sort millions of items automatically.',
                    'while': '🔄 **LOOPS = PERPETUAL ENERGY**\n\nKeeps running as long as a condition is true, like a solar panel generating power while the sun is shining! ☀️',
                    'if': '🤔 **DECISIONS = SMART SENSORS**\n\nLike a pollution sensor deciding: "IF air is dirty, turn on the fans!"',
                    'else': '🛤️ **ALTERNATIVES = BACKUP POWER**\n\n"ELSE, stay in standby mode." It gives our code a backup plan!',
                    'var': '📦 **VARIABLES = CONTAINERS**\n\nThink of this like a recycling bin. We put data inside to use it later!',
                    'let': '📦 **VARIABLES = REUSABLE CONTAINERS**\n\nA box we can empty and fill with something new later!',
                    'const': '🔒 **CONSTANTS = PERMANENT FOUNDATIONS**\n\nLike the foundation of a wind turbine - it shouldn\'t change once it\'s built!',
                    'function': '⚙️ **FUNCTIONS = FACTORIES**\n\nA special machine that takes ingredients (inputs) and makes something new (outputs)!',
                    'return': '📤 **RETURN = DELIVERY**\n\nSending the finished product out of the factory!',
                    'print': '📢 **PRINT = PUBLIC ANNOUNCEMENT**\n\nBroadcasting a message to the world!',
                    'console': '🖥️ **CONSOLE = MISSION CONTROL**\n\nThe dashboard where we see what\'s happening in our system.',
                    'log': '📝 **LOG = CAPTAIN\'S LOG**\n\nRecording an event in the ship\'s records.'
                };

                if (keywords[word.word]) {
                    return {
                        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                        contents: [
                            { value: '**🌍 ECO-LENS**' },
                            { value: keywords[word.word] }
                        ]
                    };
                }
                return null;
            }
        });

        // Similarly for Python if we switch languages
        monaco.languages.registerHoverProvider('python', {
            provideHover: function (model: any, position: any) {
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const keywords: Record<string, string> = {
                    'for': '🔄 **LOOPS = RECYCLING ROBOTS**\n\nJust like sorting 100 bottles one by one is hard, loops let us automate the process! One loop can sort millions of items automatically.',
                    'while': '🔄 **LOOPS = PERPETUAL ENERGY**\n\nKeeps running as long as a condition is true, like a solar panel generating power while the sun is shining! ☀️',
                    'def': '⚙️ **DEF = BUILD MACHINE**\n\nDefining a new machine (function) that allows us to do a specific task repeatedly.',
                    'print': '📢 **PRINT = BROADCAST**\n\nSending a signal to the monitoring station!',
                    'if': '🤔 **DECISIONS = SMART SENSORS**\n\nLike a pollution sensor deciding: "IF air is dirty, turn on the fans!"',
                };
                if (keywords[word.word]) {
                    return {
                        range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn),
                        contents: [
                            { value: '**🌍 ECO-LENS**' },
                            { value: keywords[word.word] }
                        ]
                    };
                }
                return null;
            }
        });
    };

    // Calculate task progress
    const totalChallenges = Object.keys(LEVEL_1_PROBLEMS).length;
    const completedCount = completedChallenges.length;
    const progressPercent = Math.round((completedCount / totalChallenges) * 100);

    return (
        <div className={`absolute inset-0 flex items-center justify-center bg-black/80 z-50 p-10 ${showGlitchEffect ? 'glitch-effect' : ''}`}>
            <Toaster position="top-center" />
            <div className="bg-[#1e1e1e] w-full h-full max-w-6xl border border-gray-600 flex flex-col shadow-2xl relative">

                {/* Header (VS Code Style) */}
                <div className="bg-[#252526] p-2 flex justify-between items-center border-b border-black">
                    <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-sans px-4 bg-[#1e1e1e] py-1 border-t border-blue-500">
                            {filename}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${status === 'PASS' ? 'bg-green-900/50 text-green-300 border-green-700' :
                            status === 'FAIL' ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-yellow-900/50 text-yellow-300 border-yellow-700'
                            }`}>
                            {status}
                        </span>
                        {problem && problem.sdgGoals && (
                            <div className="ml-2">
                                <SDGBadgeGroup goals={problem.sdgGoals} size="small" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 items-center">
                        {/* Task Progress for Heroes */}
                        {playerRole === 'hero' && (
                            <div className="px-3 py-1 bg-blue-900/50 border border-blue-700 rounded text-xs flex items-center gap-2">
                                <span className="text-blue-300 font-bold">Progress:</span>
                                <span className="text-white">{completedCount}/{totalChallenges}</span>
                                <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>
                        )}
                        <button
                            onClick={handleRequestReview}
                            disabled={isReviewing || status !== 'PASS'}
                            className={`px-3 py-1 text-xs rounded flex items-center gap-1 transition-colors ${status === 'PASS' && !isReviewing
                                ? 'bg-teal-600 hover:bg-teal-500 text-white'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                            title={status !== 'PASS' ? 'Pass the challenge first!' : 'Analyze Environmental Impact'}
                        >
                            {isReviewing ? '⏳ Analyzing...' : '🌱 Check Green Score'}
                        </button>
                        <button
                            onClick={handleOpenMentorChat}
                            className="px-3 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded flex items-center gap-1 transition-colors"
                        >
                            💬 Chat with Professor Gaia
                        </button>
                        <button
                            onClick={handleRun}
                            disabled={isRunning}
                            className={`px-3 py-0.5 text-xs text-white ${isRunning ? 'bg-gray-600' : 'bg-green-700 hover:bg-green-600'} rounded`}
                        >
                            {isRunning ? 'Running...' : '▶ RUN'}
                        </button>
                        <button onClick={closeTerminal} className="text-gray-400 hover:text-white px-2">✖</button>
                    </div>
                </div>

                {/* Environmental Context Panel */}
                {problem && (
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 border-b border-gray-700">
                        <div className="flex gap-4 items-start">
                            <div className="flex-[1.5]">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-blue-400 text-[10px] font-bold tracking-wider underline decoration-blue-500/50">🌍 THE SCENARIO</span>
                                </div>
                                <p className="text-gray-300 text-xs leading-relaxed font-medium">{problem.storyContext}</p>
                            </div>

                            <div className="flex-1 border-l border-gray-700 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-green-400 text-[10px] font-bold tracking-wider underline decoration-green-500/50">🎯 LEARNING GOALS</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {problem.concepts.map((concept, i) => (
                                        <span key={i} className="text-[10px] bg-green-900/30 text-green-300 px-1.5 py-0.5 rounded border border-green-700/50">
                                            {concept}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-[1.2] border-l border-gray-700 pl-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-yellow-400 text-[10px] font-bold tracking-wider underline decoration-yellow-500/50">📝 YOUR MISSION</span>
                                </div>
                                <div className="text-gray-300 text-[10px] leading-tight space-y-1">
                                    {problem.detailedInstructions.split('\n')
                                        .filter(line => line.trim() && !line.includes('🎯 Your Mission:') && !line.includes('💡 Think:'))
                                        .map((line, i) => (
                                            <div key={i} className="flex gap-1">
                                                <span>•</span>
                                                <span>{line.replace(/^\d+\.\s*/, '').trim()}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 flex gap-2">
                            <div className="flex-1 bg-teal-900/20 rounded px-2 py-1.5 border-l-2 border-teal-500 flex items-center gap-2">
                                <span className="text-teal-400 text-[10px] font-bold whitespace-nowrap">✨ IMPACT:</span>
                                <span className="text-gray-300 text-[10px] italic line-clamp-1">{problem.environmentalImpact}</span>
                            </div>
                            {problem.failureConsequence && (
                                <div className="flex-1 bg-red-900/20 rounded px-2 py-1.5 border-l-2 border-red-500 flex items-center gap-2">
                                    <span className="text-red-400 text-[10px] font-bold whitespace-nowrap">⚠️ STAKES:</span>
                                    <span className="text-red-200 text-[10px] italic line-clamp-1">{problem.failureConsequence}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden flex">
                    {/* Code Editor - Left Side */}
                    <div className="flex-1 min-w-0">
                        <Editor
                            key={activeFileId} // Force remount on file change
                            height="100%"
                            language={language}
                            path={`file:///${filename}`} // Absolute path helps Monaco
                            theme="vs-dark"
                            value={code}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>

                    {/* Animation Panel - Right Side */}
                    <div className="w-96 flex-shrink-0 flex flex-col">
                        <div className="flex-1">
                            <ChallengeAnimation challengeId={activeFileId || ''} status={status} output={output} />
                        </div>

                        {/* Removed inline AI Review Panel - now using modal */}
                    </div>
                </div>

                {/* Output Console */}
                <div className="h-32 bg-[#1e1e1e] border-t border-gray-700 p-2 font-mono text-sm overflow-auto">
                    <div className="text-gray-500 text-xs mb-1">TERMINAL OUTPUT:</div>
                    <pre className={`${output.includes('❌') ? 'text-red-400' : 'text-gray-300'}`}>
                        {output || "Ready to execute."}
                    </pre>
                </div>

                {/* Footer */}
                <div className="bg-[#007acc] text-white text-xs p-1 px-4 flex justify-between">
                    <span>{language.toUpperCase()}</span>
                    <span>Ln {code.split('\n').length}, Col 1</span>
                </div>
            </div>

            {/* AI Mentor Chat */}
            <MentorChat
                isOpen={showMentorChat}
                onClose={() => {
                    setShowMentorChat(false);
                    setLastError(null);
                }}
                challengeId={activeFileId || undefined}
                challengeDescription={problem?.description}
                currentCode={code}
                initialError={lastError || undefined}
            />

            {/* SDG Achievement Popup */}
            {
                completedSdg && problem && (
                    <SDGPopup
                        sdgId={completedSdg}
                        title="Goal Progress!"
                        description={`Great work! Your code for ${problem.name} contributed to this global goal.`}
                        onClose={() => setCompletedSdg(null)}
                    />
                )
            }

            {/* Code Review Modal */}
            <CodeReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                rating={aiFeedback?.rating || 0}
                feedback={aiFeedback?.feedback || ''}
                tip={aiFeedback?.tip || ''}
                isLoading={isReviewing}
            />

            {/* Green Coder Score Modal (The Impact Feature) */}
            {
                greenScore && problem && (
                    <GreenCoderScoreModal
                        isVisible={showGreenScoreModal}
                        onClose={() => setShowGreenScoreModal(false)}
                        score={greenScore}
                        stakes={{
                            success: problem.successReward || "Optimization Complete!",
                            failure: problem.failureConsequence || "Needs Optimization."
                        }}
                    />
                )
            }



            {/* Glitch Effect CSS */}
            <style>{`
                @keyframes glitch {
                    0% { transform: translate(0); }
                    20% { transform: translate(-2px, 2px); }
                    40% { transform: translate(-2px, -2px); }
                    60% { transform: translate(2px, 2px); }
                    80% { transform: translate(2px, -2px); }
                    100% { transform: translate(0); }
                }
                
                .glitch-effect {
                    animation: glitch 0.3s infinite;
                }
                
                .glitch-effect::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(220, 38, 38, 0.1);
                    pointer-events: none;
                    z-index: 1;
                }
            `}</style>
        </div >
    );
};
