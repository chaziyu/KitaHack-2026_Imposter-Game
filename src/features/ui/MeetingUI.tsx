import React, { useState, useEffect, useCallback } from 'react';
import type { PlayerState } from '../networking/NetworkInterface';

interface MeetingOutcome {
    ejectedId: string | null;
    wasImposter: boolean;
    reason: 'VOTE_SKIP' | 'VOTE_TIE' | 'VOTE_EJECT';
}
import { useMeetingStore } from '../../stores/useMeetingStore';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { LEVEL_1_PROBLEMS } from '../../shared/ProblemData';
import { ref, update } from 'firebase/database';
import { db } from '../../firebaseConfig';
import { APP_CONSTANTS } from '../../utils/AppConstants';

declare global {
    interface Window {
        monaco: {
            Range: new (startLine: number, startCol: number, endLine: number, endCol: number) => unknown;
        };
    }
}


export const MeetingUI = () => {
    const { status, meetingEndTime, presenterId, highlightedLine, chatMessages, votes, result, outcome } = useMeetingStore();
    const { network, playerId, isHost, roomCode } = useGameStore();
    const { players } = usePlayerStore();

    const [selectedFile] = useState<string>(Object.keys(LEVEL_1_PROBLEMS)[0]);
    const selectedFileRef = React.useRef(selectedFile);
    const [timeLeft, setTimeLeft] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [hasVoted, setHasVoted] = useState(false);

    // Guard: prevent handleMeetingEnd from firing more than once per meeting
    const hasEndedRef = React.useRef(false);

    // Reset the guard when meeting goes back to IDLE
    useEffect(() => {
        if (status === 'IDLE') {
            hasEndedRef.current = false;
        }
    }, [status]);

    // Editor Ref
    const editorRef = React.useRef<any>(null);
    const decorationsRef = React.useRef<string[]>([]);

    useEffect(() => {
        selectedFileRef.current = selectedFile;
    }, [selectedFile]);

    // Host Logic: Calculate Results
    const handleMeetingEnd = React.useCallback(async () => {
        if (!roomCode) return;
        if (hasEndedRef.current) return; // Already ended — prevent double-fire
        hasEndedRef.current = true;

        const voteCounts: Record<string, number> = {};
        let skipCount = 0;

        Object.values(votes).forEach(votedId => {
            if (votedId === 'skip') skipCount++;
            else voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
        });

        // 2. Determine Result
        let maxVotes = 0;
        let candidate: string | null = null;
        let isTie = false;

        // First pass: find max votes
        Object.values(voteCounts).forEach((count) => {
            if (count > maxVotes) {
                maxVotes = count;
            }
        });

        // Second pass: check for ties and get candidate
        const candidatesWithMaxVotes: string[] = [];
        Object.entries(voteCounts).forEach(([id, count]) => {
            if (count === maxVotes) {
                candidatesWithMaxVotes.push(id);
            }
        });

        if (candidatesWithMaxVotes.length > 1) {
            isTie = true;
            candidate = null;
        } else if (candidatesWithMaxVotes.length === 1) {
            candidate = candidatesWithMaxVotes[0];
            isTie = false;
        }

        // 3. Apply Result
        let finalResultMsg = "";
        const outcomeState: {
            ejectedId: string | null;
            wasImposter: boolean;
            reason: 'VOTE_TIE' | 'VOTE_SKIP' | 'VOTE_EJECT' | 'TASK_WIN' | 'IMPOSTER_WIN';
        } = {
            ejectedId: null,
            wasImposter: false,
            reason: 'VOTE_SKIP'
        };

        const ejectedPlayer = candidate ? players.find((p: PlayerState) => p.id === candidate) : null;

        // Skip if: skip votes are higher than max, OR there's a tie, OR no valid candidate
        if (skipCount > maxVotes || isTie || !candidate) {
            outcomeState.reason = isTie ? 'VOTE_TIE' : 'VOTE_SKIP';
            outcomeState.ejectedId = null;

            if (skipCount > maxVotes) {
                finalResultMsg = `Vote Skipped (Skip votes won with ${skipCount} votes).`;
            } else if (isTie) {
                finalResultMsg = `Vote Skipped (Tie between ${candidatesWithMaxVotes.length} players with ${maxVotes} votes each).`;
            } else {
                finalResultMsg = `Vote Skipped (No votes cast).`;
            }
        } else if (ejectedPlayer) {
            outcomeState.ejectedId = ejectedPlayer.id;
            outcomeState.wasImposter = ejectedPlayer.role === 'imposter';
            outcomeState.reason = 'VOTE_EJECT';

            // Redemption Arc: If Imposter, they become Reformed
            if (ejectedPlayer.role === 'imposter') {
                finalResultMsg = `${ejectedPlayer.name} was the Imposter! They are JAILED for 60s.`;
            } else {
                finalResultMsg = `${ejectedPlayer.name} was NOT the Imposter. They are JAILED for 60s.`;
            }
        }

        // Add Vote Summary to message
        const voteSummary = Object.entries(voteCounts)
            .map(([id, count]) => {
                const name = players.find((p: PlayerState) => p.id === id)?.name || "Unknown";
                return `${name}: ${count}`;
            })
            .join(", ") + (skipCount > 0 ? ` (Skip: ${skipCount})` : "");

        const fullResultMsg = `${finalResultMsg}\n\nVotes:\n${voteSummary}`;

        // 4. Update Firebase
        const globalUpdates: Record<string, unknown> = {};
        if (ejectedPlayer && outcomeState.ejectedId) {
            // JAIL LOGIC (Instead of Eject/Kill)
            const jailTime = APP_CONSTANTS.GAME.JAIL_TIME;
            globalUpdates[`rooms/${roomCode}/players/${ejectedPlayer.id}/status`] = 'jailed';
            globalUpdates[`rooms/${roomCode}/players/${ejectedPlayer.id}/jailEndTime`] = Date.now() + jailTime;
        }

        update(ref(db), globalUpdates);
        update(ref(db, `rooms/${roomCode}/meeting`), {
            status: 'RESULTS',
            result: fullResultMsg,
            outcome: outcomeState
        });

        // No auto-close - user must manually close
    }, [roomCode, votes, players]);

    // Timer Logic
    useEffect(() => {
        if (status === 'IDLE') {
            setTimeLeft(0);
            return;
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((meetingEndTime - Date.now()) / 1000));
            setTimeLeft(remaining);

            // Host checks for end of meeting
            if (isHost && remaining === 0 && status === 'DISCUSSION') {
                handleMeetingEnd();
            }
        }, 100);

        return () => clearInterval(interval);
    }, [status, meetingEndTime, isHost, handleMeetingEnd]);

    // Check if I voted
    useEffect(() => {
        if (playerId && votes[playerId]) {
            setHasVoted(true);
        } else {
            setHasVoted(false);
        }
    }, [votes, playerId]);

    // Host Logic: Auto-End when everyone voted
    useEffect(() => {
        if (!isHost || status !== 'DISCUSSION') return;

        const alivePlayers = players.filter(p => p.isAlive);
        const voteCount = Object.keys(votes).length;

        // If everyone alive has voted (and there's at least one player), end it.
        if (alivePlayers.length > 0 && voteCount >= alivePlayers.length) {
            handleMeetingEnd();
        }
    }, [votes, players, isHost, status, handleMeetingEnd]);


    const handleCloseResults = React.useCallback(() => {
        if (!roomCode || !isHost) return;
        update(ref(db, `rooms/${roomCode}/meeting`), {
            status: 'IDLE',
            votes: {},
            highlightedLine: null,
            result: null,
            outcome: null
        });
    }, [roomCode, isHost]);

    const handleVote = React.useCallback((candidateId: string) => {
        if (hasVoted || !network || status !== 'DISCUSSION') return;
        network.vote(playerId!, candidateId);
    }, [hasVoted, network, status, playerId]);

    // Blame Code Highlighting (Same as before)
    useEffect(() => {
        if (!editorRef.current || !window.monaco) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        if (highlightedLine !== null && highlightedLine.fileId === selectedFile) {
            decorationsRef.current = model.deltaDecorations(decorationsRef.current, [{
                range: new window.monaco.Range(highlightedLine.line, 1, highlightedLine.line, 1),
                options: { isWholeLine: true, className: 'blame-line-highlight', glyphMarginClassName: 'blame-glyph' }
            }]);
            editorRef.current.revealLineInCenter(highlightedLine.line);
        } else {
            decorationsRef.current = model.deltaDecorations(decorationsRef.current, []);
        }
    }, [highlightedLine, selectedFile]);

    const handleSendChat = React.useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!chatInput.trim() || !network) return;

        // Find my name from store
        const myName = players.find(p => p.id === playerId)?.name || "Unknown";
        network.sendChatMessage(chatInput.trim(), myName);
        setChatInput('');
    }, [chatInput, network, players, playerId]);

    // Trigger Meeting (Emergency Button)
    const handleStartMeeting = React.useCallback(() => {
        if (network && playerId) {
            network.startMeeting(playerId);
        }
    }, [network, playerId]);

    // --- RENDER ---

    // 1. IDLE (Show Button)
    if (status === 'IDLE') {
        return (
            <button
                onClick={handleStartMeeting} // NOW REAL TRIGGER
                className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 text-white rounded-full shadow-xl z-50 hover:bg-red-500 transition-all hover:scale-110 border-4 border-red-800 flex items-center justify-center text-3xl"
                title="EMERGENCY MEETING"
            >
                🚨
            </button>
        )
    }

    // 2. ACTIVE MEETING (Overlay)
    const currentFileContent = LEVEL_1_PROBLEMS[selectedFile]?.content || "// File not found";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-50 bg-gray-900/95 flex flex-col"
            >
                {/* Header */}
                <div className="bg-red-900/40 border-b-4 border-red-600 p-4 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                    <div className="z-10 flex items-center gap-4">
                        <h1 className="text-4xl font-black text-white italic tracking-widest shadow-black drop-shadow-lg">
                            EMERGENCY MEETING
                        </h1>
                        <div className="bg-black/50 px-3 py-1 rounded text-red-400 font-mono">
                            Status: {status}
                        </div>
                    </div>
                    <div className="z-10 text-5xl font-mono text-white font-bold">
                        {timeLeft}s
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* LEFT: VOTING AREA */}
                    <div className="w-1/2 p-8 overflow-y-auto bg-gray-800/50 flex flex-col gap-4">
                        <h2 className="text-2xl font-bold text-center mb-4 text-gray-300">WHO IS THE IMPOSTER?</h2>

                        <div className="grid grid-cols-2 gap-4">
                            {players.map(player => {
                                const isMe = player.id === playerId;
                                const hasPlayerVoted = Object.keys(votes).includes(player.id);
                                const myVote = votes[playerId!] === player.id;

                                return (
                                    <button
                                        key={player.id}
                                        disabled={hasVoted || !player.isAlive} // Dead men tell no tales
                                        onClick={() => handleVote(player.id)}
                                        className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-4
                                            ${!player.isAlive ? 'opacity-50 grayscale border-gray-700 bg-gray-900 cursor-not-allowed' :
                                                hasVoted ? 'border-gray-600 bg-gray-800 cursor-default' :
                                                    'border-gray-500 bg-gray-700 hover:border-red-500 hover:bg-red-900/20 active:scale-95 cursor-pointer'}
                                            ${myVote ? 'border-green-500 ring-2 ring-green-500/50' : ''}
                                        `}
                                    >
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full border-2 border-white/20 bg-gray-900 relative">
                                            {/* Sprite preview could go here */}
                                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xl" style={{ color: player.color }}>
                                                {player.name.charAt(0)}
                                            </div>
                                        </div>

                                        <div className="text-left flex-1">
                                            <div className="font-bold text-lg">{player.name} {isMe && "(YOU)"}</div>
                                            <div className="text-xs text-gray-400">
                                                {player.isAlive ? (hasPlayerVoted ? "Voted" : "Thinking...") : "DEAD"}
                                            </div>
                                        </div>

                                        {/* Status Indicators */}
                                        {hasPlayerVoted && player.isAlive && (
                                            <div className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs font-bold">
                                                VOTED
                                            </div>
                                        )}
                                        {!player.isAlive && (
                                            <div className="bg-red-900/50 text-red-500 px-2 py-1 rounded text-xs font-bold">
                                                DEAD
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Skip Button */}
                        <div className="mt-auto pt-4 border-t border-gray-700">
                            <button
                                disabled={hasVoted}
                                onClick={() => handleVote('skip')}
                                className={`w-full py-4 rounded-xl font-bold text-xl transition-all
                                    ${hasVoted ? 'bg-gray-700 text-gray-500 cursor-default' : 'bg-gray-600 hover:bg-gray-500 text-white hover:scale-[1.02]'}
                                `}
                            >
                                SKIP VOTE 💨
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: EVIDENCE & CHAT */}
                    <div className="w-1/2 flex flex-col border-l border-gray-700 bg-gray-900">
                        {/* Tabs */}
                        <div className="flex bg-gray-800 border-b border-gray-700">
                            <div className="px-6 py-3 font-bold text-cyan-400 border-b-2 border-cyan-400">
                                EVIDENCE (CODE)
                            </div>
                            <div className="px-6 py-3 font-bold text-gray-500 hover:text-gray-300 cursor-pointer">
                                CHAT
                            </div>
                        </div>

                        {/* Editor View */}
                        <div className="flex-1 relative bg-[#1e1e1e]">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                language={LEVEL_1_PROBLEMS[selectedFile]?.language || 'javascript'}
                                theme="vs-dark"
                                value={currentFileContent}
                                options={{
                                    readOnly: true,
                                    domReadOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    lineHeight: 18,
                                    renderLineHighlight: 'all'
                                }}
                                onMount={(editor, monaco) => {
                                    editorRef.current = editor;
                                    window.monaco = monaco;
                                    // Click to Highlight Logic
                                    editor.onMouseDown((e) => {
                                        const target = e.target as { type: number; position: { lineNumber: number } | null };
                                        if (network?.playerId === presenterId && [2, 3, 4, 6, 7].includes(target.type) && target.position) {
                                            network.highlightLine(selectedFile, target.position.lineNumber);
                                        }
                                    });
                                }}
                            />

                            {/* Chat Overlay (Bottom) */}
                            <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gray-900/90 border-t border-gray-700 flex flex-col">
                                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                    {chatMessages.map(msg => (
                                        <div key={msg.id} className="text-sm">
                                            <span className="font-bold text-cyan-400">{msg.playerName}: </span>
                                            <span className="text-gray-300">{msg.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleSendChat} className="p-2 border-t border-gray-700 flex gap-2">
                                    <input
                                        value={chatInput}
                                        onChange={e => setChatInput(e.target.value)}
                                        className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                                        placeholder="Discuss..."
                                    />
                                    <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded text-white font-bold">SEND</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESULTS OVERLAY */}
                {status === 'RESULTS' && (
                    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center animate-fadeIn p-8 text-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="max-w-2xl w-full bg-gray-800 border-4 border-red-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-white to-red-600 animate-pulse"></div>

                            {/* Close Button - Only for host */}
                            {isHost && (
                                <button
                                    onClick={handleCloseResults}
                                    className="absolute top-4 right-4 w-10 h-10 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xl transition-all hover:scale-110 z-10"
                                    title="Close Results"
                                >
                                    ✕
                                </button>
                            )}

                            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight whitespace-pre-wrap">
                                {result?.split('\n\n')[0] || "VOTING COMPLETE"}
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                {players.filter(p => p.isAlive || votes[p.id]).map(p => {
                                    const voteTargetId = votes[p.id];
                                    const voteTargetName = voteTargetId === 'skip' ? '💨 Skipped' :
                                        players.find(target => target.id === voteTargetId)?.name || '...';

                                    return (
                                        <div key={p.id} className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-white/5">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold" style={{ backgroundColor: p.color + '22', color: p.color }}>
                                                {p.name.charAt(0)}
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <div className="text-sm font-bold text-gray-300 truncate">{p.name}</div>
                                                <div className="text-xs text-cyan-400 font-mono">voted for: {voteTargetName}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="text-xl text-gray-400 font-mono mb-4 whitespace-pre-wrap">
                                {result?.split('\n\n')[1]}
                            </div>

                            {votes[playerId!] && (() => {
                                const myVotedPlayerId = votes[playerId!];

                                // Skip vote
                                if (myVotedPlayerId === 'skip') {
                                    return (
                                        <div className="text-2xl font-black italic p-4 rounded-xl mb-4 bg-gray-900/20 text-gray-400 border border-gray-400/50">
                                            PLAYED IT SAFE 💨
                                        </div>
                                    );
                                }

                                // 3. Use Outcome Object for Feedback (Reliable)
                                const { outcome } = useMeetingStore.getState(); // or use hook directly if subscribed

                                // If I voted for someone
                                if (outcome && outcome.ejectedId) {
                                    // Did I vote for the ejected person?
                                    if (myVotedPlayerId === outcome.ejectedId) {
                                        // Was it a good vote? (They were imposter)
                                        if (outcome.wasImposter) {
                                            return (
                                                <div className="bg-green-900/20 text-green-500 border border-green-500/50 text-2xl font-black italic p-4 rounded-xl mb-4">
                                                    CORRECT VOTE! ✅
                                                </div>
                                            );
                                        } else {
                                            return (
                                                <div className="bg-red-900/20 text-red-500 border border-red-500/50 text-2xl font-black italic p-4 rounded-xl mb-4">
                                                    INCORRECT VOTE! ❌
                                                </div>
                                            );
                                        }
                                    } else {
                                        // I voted for someone else (not the ejected person)
                                        return (
                                            <div className="bg-gray-900/20 text-gray-500 border border-gray-500/50 text-xl font-bold p-4 rounded-xl mb-4">
                                                Result: {outcome.wasImposter ? "Imposter Caught" : "Innocent Ejected"}
                                            </div>
                                        );
                                    }
                                } else if (outcome?.reason === 'VOTE_SKIP' || outcome?.reason === 'VOTE_TIE') {
                                    return (
                                        <div className="bg-gray-900/20 text-gray-400 border border-gray-400/50 text-xl font-bold p-4 rounded-xl mb-4">
                                            No one was ejected.
                                        </div>
                                    );
                                }

                                return null;
                            })()}

                            {!isHost && (
                                <div className="text-lg text-gray-500 font-bold tracking-widest">
                                    Waiting for host to continue...
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
