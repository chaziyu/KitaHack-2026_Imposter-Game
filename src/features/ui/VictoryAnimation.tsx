import React, { useState, useEffect } from 'react';
import { VICTORY_SCENES } from '../../shared/StoryContent';
import { usePlayerProgress } from '../../stores/usePlayerProgress';
import { useGameStore } from '../../stores/useGameStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { SDGBadgeGroup } from './SDGBadge';

interface VictoryAnimationProps {
    onClose: () => void;
}

export const VictoryAnimation = ({ onClose }: VictoryAnimationProps) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [showImpactSummary, setShowImpactSummary] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const { totalImpact, achievements, markVictorySeen } = usePlayerProgress();

    // Mark as seen on first load
    useEffect(() => {
        markVictorySeen();
    }, [markVictorySeen]);

    const currentScene = VICTORY_SCENES[currentSceneIndex];
    const isLastScene = currentSceneIndex === VICTORY_SCENES.length - 1;

    // Helper: Skip to Impact Summary
    const handleSkipAll = React.useCallback(() => {
        setShowImpactSummary(true);
        setConfetti(true); // Ensure confetti stays if skipped
    }, []);

    // Helper: Advance to next scene
    const handleNext = React.useCallback(() => {
        if (isLastScene) {
            handleSkipAll();
        } else {
            setCurrentSceneIndex(prev => prev + 1);
        }
    }, [isLastScene, handleSkipAll]);

    // Auto-advance to next scene (Timer)
    useEffect(() => {
        if (showImpactSummary) return;

        const timer = setTimeout(() => {
            handleNext();
        }, currentScene.duration);

        return () => clearTimeout(timer);
    }, [currentSceneIndex, currentScene.duration, showImpactSummary, handleNext]);

    // Keyboard support: Space/Enter = Next, Escape = Skip All
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showImpactSummary) return;

            if (e.code === 'Space' || e.key === 'Enter') {
                e.preventDefault();
                handleNext();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleSkipAll();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showImpactSummary, handleNext, handleSkipAll]);

    // Trigger confetti on celebration scene
    useEffect(() => {
        if (currentScene?.animation === 'confetti' || showImpactSummary) {
            setConfetti(true);
        }
    }, [currentScene, showImpactSummary]);

    if (showImpactSummary) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6">
                <div className="bg-gradient-to-br from-green-900 via-blue-900 to-purple-900 border-4 border-yellow-500 rounded-2xl p-6 md:p-8 max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl animate-fadeIn custom-scrollbar">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl md:text-5xl font-black text-yellow-400 mb-2 animate-bounce leading-tight">
                            🌍  YOUR ENVIRONMENTAL IMPACT  🌍
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300">You made a real difference!</p>
                    </div>

                    {/* Impact Stats */}
                    <div className="space-y-4 mb-6">
                        {/* Solar Impact */}
                        {totalImpact.co2Prevented > 0 && (
                            <div className="bg-gradient-to-r from-yellow-900/40 to-orange-900/40 rounded-lg p-5 border-l-4 border-yellow-500">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">⚡</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-yellow-400">Clean Energy Master</h3>
                                            <SDGBadgeGroup goals={[7, 13]} size="small" />
                                        </div>
                                        <p className="text-gray-200">You optimized solar systems!</p>
                                        <p className="text-green-400 font-bold text-lg mt-1">
                                            🌍 CO₂ Prevented: {totalImpact.co2Prevented} tons/year
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Recycling Impact */}
                        {totalImpact.wasteRecycled > 0 && (
                            <div className="bg-gradient-to-r from-green-900/40 to-teal-900/40 rounded-lg p-5 border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">♻️</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-green-400">Recycling Champion</h3>
                                            <SDGBadgeGroup goals={[12]} size="small" />
                                        </div>
                                        <p className="text-gray-200">You automated waste sorting!</p>
                                        <p className="text-green-400 font-bold text-lg mt-1">
                                            🌊 Waste Diverted: {totalImpact.wasteRecycled} truckloads
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Air Quality Impact */}
                        {totalImpact.peopleProtected > 0 && (
                            <div className="bg-gradient-to-r from-cyan-900/40 to-blue-900/40 rounded-lg p-5 border-l-4 border-cyan-500">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl">💨</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-xl font-bold text-cyan-400">Air Quality Guardian</h3>
                                            <SDGBadgeGroup goals={[13, 3]} size="small" />
                                        </div>
                                        <p className="text-gray-200">You activated air monitoring!</p>
                                        <p className="text-green-400 font-bold text-lg mt-1">
                                            🏙️ People Protected: {(totalImpact.peopleProtected / 1000000000).toFixed(1)} billion
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Achievement */}
                    <div className="bg-gradient-to-r from-purple-900/60 to-pink-900/60 rounded-xl p-4 md:p-6 border-2 border-yellow-500 mb-6">
                        <div className="text-center">
                            <div className="text-4xl md:text-6xl mb-3">🏆</div>
                            <h2 className="text-2xl md:text-3xl font-black text-yellow-400 mb-2">ACHIEVEMENT UNLOCKED!</h2>
                            {achievements.find(a => a.id === 'earth-guardian') && (
                                <>
                                    <p className="text-xl md:text-2xl font-bold text-white mb-1">
                                        {achievements.find(a => a.id === 'earth-guardian')?.icon} Earth's Guardian
                                    </p>
                                    <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                                        {achievements.find(a => a.id === 'earth-guardian')?.description}
                                    </p>
                                </>
                            )}

                            {/* Redemption Badge */}
                            {useGameStore.getState().playerSkin === 'reformed_skin_placeholder' || /* Check role logic here properly */
                                (usePlayerStore.getState().players.find(p => p.id === useGameStore.getState().playerId)?.role as string) === 'reformed' && (
                                    <div className="mt-4 pt-4 border-t border-yellow-500/30">
                                        <p className="text-xl md:text-2xl font-bold text-purple-300 mb-1">
                                            😇 Reformed Hero
                                        </p>
                                        <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                                            You turned a new leaf and helped save the station!
                                        </p>
                                    </div>
                                )}
                        </div>
                    </div>

                    {/* Environmental Message */}
                    <div className="bg-green-900/30 rounded-lg p-5 border border-green-500/50 mb-6">
                        <p className="text-center text-lg text-gray-200 leading-relaxed">
                            💚 <strong className="text-green-400">In the real world,</strong> you can help Earth too!
                            Recycle, save energy, plant trees, and keep coding for good.
                            <strong className="text-green-400"> Every small action matters!</strong> 🌍
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-auto">
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 md:px-8 rounded-lg transition-all shadow-lg text-base md:text-lg"
                        >
                            🔄 Play Again
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-bold py-3 px-6 md:px-8 rounded-lg transition-all shadow-lg text-base md:text-lg"
                        >
                            ✨ Continue Exploring
                        </button>
                    </div>
                </div>

                {/* Confetti */}
                {confetti && (
                    <div className="fixed inset-0 pointer-events-none">
                        {[...Array(100)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-3 h-3 animate-fall"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: '-20px',
                                    backgroundColor: ['#fbbf24', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                                    animationDelay: `${Math.random() * 3}s`,
                                    animationDuration: `${3 + Math.random() * 2}s`
                                }}
                            />
                        ))}
                    </div>
                )}

                <style>{`
                    @keyframes fall {
                        to {
                            transform: translateY(100vh) rotate(360deg);
                            opacity: 0;
                        }
                    }
                    .animate-fall {
                        animation: fall linear forwards;
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.5s ease-out;
                    }
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0, 0, 0, 0.2);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 0, 0.3);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 0, 0.5);
                    }
                `}</style>
            </div>
        );
    }

    // Victory scene animation
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={handleNext}
        >
            {/* Animated Background */}
            <div
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: currentScene.background }}
            />

            {/* Skip Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    handleSkipAll();
                }}
                className="absolute top-8 right-8 z-[210] bg-black/30 hover:bg-black/50 text-white/70 hover:text-white px-6 py-2 rounded-full border border-white/20 transition-all backdrop-blur-sm"
            >
                Skip Animation [Esc]
            </button>

            {/* Advanced Info */}
            <div className="absolute top-8 left-8 z-[210] text-white/50 text-sm hidden md:block">
                Press Space/Enter to advance | Click anywhere
            </div>

            {/* Confetti effect on celebration scene */}
            {confetti && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(100)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-3 h-3 animate-fall"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-20px',
                                backgroundColor: ['#fbbf24', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                                animationDelay: `${Math.random() * 3}s`,
                                animationDuration: `${3 + Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 text-center select-none">
                {/* Visual Elements */}
                <div className="text-7xl md:text-9xl mb-6 md:mb-8 animate-bounce">
                    {currentScene.visual}
                </div>

                {/* Main Text */}
                <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-2xl leading-tight animate-pulse">
                    {currentScene.text}
                </h2>

                {/* Narration */}
                {currentScene.narration && (
                    <p className="text-2xl md:text-3xl text-gray-200 italic opacity-90">
                        {currentScene.narration}
                    </p>
                )}
            </div>

            {/* Progress Indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {VICTORY_SCENES.map((_, index) => (
                    <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSceneIndex
                            ? 'bg-white w-8'
                            : index < currentSceneIndex
                                ? 'bg-white/60'
                                : 'bg-white/20'
                            }`}
                    />
                ))}
            </div>

            <style>{`
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(360deg);
                        opacity: 0;
                    }
                }
                .animate-fall {
                    animation: fall linear forwards;
                }
            `}</style>
        </div>
    );
};

