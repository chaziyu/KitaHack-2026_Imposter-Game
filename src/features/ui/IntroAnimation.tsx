import React, { useEffect, useState, useMemo } from 'react';
import { INTRO_SCENES } from '../../shared/StoryContent';
import { usePlayerProgress } from '../../stores/usePlayerProgress';

interface IntroAnimationProps {
    onComplete: () => void;
}

export const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const { markIntroSeen, skipIntro } = usePlayerProgress();

    const currentScene = INTRO_SCENES[currentSceneIndex];
    const isLastScene = currentSceneIndex === INTRO_SCENES.length - 1;

    // Memoize particles to avoid impure render calls
    const particles = useMemo(() => {
        return Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`
        }));
    }, []);

    const handleComplete = React.useCallback(() => {
        markIntroSeen();
        setIsVisible(false);
        onComplete();
    }, [markIntroSeen, onComplete]);

    // Auto-advance to next scene
    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            if (isLastScene) {
                handleComplete();
            } else {
                setCurrentSceneIndex(currentSceneIndex + 1);
            }
        }, currentScene.duration);

        return () => clearTimeout(timer);
    }, [currentSceneIndex, isVisible, currentScene.duration, isLastScene, handleComplete]);

    const handleSkip = () => {
        skipIntro();
        setIsVisible(false);
        onComplete();
    };

    if (!isVisible) return null;

    // Animation styles
    const getAnimationClass = () => {
        switch (currentScene.animation) {
            case 'shake': return 'animate-shake';
            case 'sparkle': return 'animate-sparkle';
            case 'glow': return 'animate-glow';
            case 'pulse': return 'animate-pulse';
            case 'bounce': return 'animate-bounce';
            default: return 'animate-fadeIn';
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden">
            {/* Animated Background */}
            <div
                className="absolute inset-0 transition-all duration-1000"
                style={{ background: currentScene.background }}
            />

            {/* Particle Effects */}
            <div className="absolute inset-0 opacity-30">
                {particles.map((particle) => (
                    <div
                        key={particle.id}
                        className="absolute w-2 h-2 bg-white rounded-full animate-twinkle"
                        style={{
                            left: particle.left,
                            top: particle.top,
                            animationDelay: particle.animationDelay,
                            animationDuration: particle.animationDuration
                        }}
                    />
                ))}
            </div>

            {/* Cinematic letterbox bars */}
            <div className="absolute top-0 left-0 right-0 h-20 bg-black opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-black opacity-90" />

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-8 text-center">
                {/* Visual Elements (Emojis) */}
                <div
                    className={`text-9xl mb-8 ${getAnimationClass()}`}
                    style={{
                        filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))',
                        animation: `${getAnimationClass().replace('animate-', '')} 1.5s ease-out`
                    }}
                >
                    {currentScene.visual}
                </div>

                {/* Main Text */}
                <h2
                    className="text-4xl md:text-5xl font-black text-white mb-6 drop-shadow-2xl leading-tight animate-slideUp"
                    style={{
                        textShadow: '0 0 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(96, 165, 250, 0.5)',
                    }}
                >
                    {currentScene.text}
                </h2>

                {/* Narration */}
                {currentScene.narration && (
                    <p className="text-xl md:text-2xl text-gray-200 italic opacity-90 animate-slideUp" style={{ animationDelay: '0.3s' }}>
                        {currentScene.narration}
                    </p>
                )}
            </div>

            {/* Skip Button */}
            <button
                onClick={handleSkip}
                className="absolute top-24 right-8 bg-black/60 hover:bg-black/80 text-white px-6 py-3 rounded-full transition-all text-sm font-bold backdrop-blur-sm border border-white/20"
            >
                Skip Intro ›
            </button>

            {/* Start Button (last scene only) */}
            {isLastScene && (
                <button
                    onClick={handleComplete}
                    className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 px-12 py-4 rounded-full font-black text-2xl shadow-2xl animate-bounce border-4 border-white/30"
                >
                    Start Adventure! 🚀
                </button>
            )}

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0) rotate(0deg); }
                    25% { transform: translateX(-10px) rotate(-5deg); }
                    75% { transform: translateX(10px) rotate(5deg); }
                }
                @keyframes sparkle {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    50% { transform: scale(1.2) rotate(180deg); }
                }
                @keyframes glow {
                    0%, 100% { 
                        filter: drop-shadow(0 0 20px gold) drop-shadow(0 0 40px rgba(255, 215, 0, 0.5));
                        transform: scale(1);
                    }
                    50% { 
                        filter: drop-shadow(0 0 60px gold) drop-shadow(0 0 80px rgba(255, 215, 0, 0.8));
                        transform: scale(1.1);
                    }
                }
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.5); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .animate-fadeIn {
                    animation: fadeIn 1s ease-out;
                }
                .animate-slideUp {
                    animation: slideUp 0.8s ease-out;
                }
                .animate-shake {
                    animation: shake 0.6s ease-in-out;
                }
                .animate-sparkle {
                    animation: sparkle 1.5s ease-in-out;
                }
                .animate-glow {
                    animation: glow 2s ease-in-out infinite;
                }
                .animate-twinkle {
                    animation: twinkle 3s ease-in-out infinite;
                }
                .animate-pulse {
                    animation: pulse 1.5s ease-in-out;
                }
            `}</style>
        </div>
    );
};
