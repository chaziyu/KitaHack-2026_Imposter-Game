import { useEffect, useState } from 'react';

interface RoleRevealModalProps {
    playerRole: 'hero' | 'imposter' | 'reformed';
    onClose: () => void;
}

export const RoleRevealModal = ({ playerRole, onClose }: RoleRevealModalProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation on mount
        setTimeout(() => setIsVisible(true), 100);
    }, []);

    const isHero = playerRole === 'hero';
    const isReformed = playerRole === 'reformed';

    const getThemeClasses = () => {
        if (isHero) return 'bg-gradient-to-br from-blue-900 via-blue-800 to-amber-500 border-amber-400';
        if (isReformed) return 'bg-gradient-to-br from-blue-900 via-blue-800 to-amber-500 border-amber-400'; // Same as Hero for now, maybe different?
        return 'bg-gradient-to-br from-orange-900 via-red-800 to-stone-900 border-red-800';
    };

    const getIconAnimation = () => {
        if (isHero) return 'animate-hero-glow';
        if (isReformed) return 'animate-hero-glow';
        return 'animate-imposter-pulse';
    };

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className={`
                    max-w-xl w-[90%] p-12 rounded-[20px] text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)] border-[3px]
                    transition-all duration-400 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]
                    ${isVisible ? 'scale-100 opacity-100' : 'scale-80 opacity-0'}
                    ${getThemeClasses()}
                `}
                onClick={(e) => e.stopPropagation()}
            >
                <div>
                    {/* Icon Display */}
                    <div className={`text-[8rem] mb-4 leading-none inline-block ${getIconAnimation()}`}>
                        {isHero ? '🦸‍♀️' : isReformed ? '😇' : '🕵️'}
                    </div>

                    {/* Role Title */}
                    <h1 className="text-5xl font-black mb-4 drop-shadow-lg tracking-widest uppercase">
                        {isHero ? 'YOU ARE A HERO!' : isReformed ? 'YOU ARE REFORMED!' : 'YOU ARE THE IMPOSTER!'}
                    </h1>

                    {/* Role Description */}
                    <p className="text-2xl mb-6 font-medium opacity-95">
                        {isHero
                            ? 'Fix the code and find the saboteur before it\'s too late!'
                            : isReformed
                                ? 'You have turned a new leaf! Help the heroes win!'
                                : 'Sabotage the mission without getting caught!'}
                    </p>

                    {/* Additional Icons */}
                    <div className="text-4xl mb-8 tracking-[0.5rem]">
                        {isHero ? '🔍💻✨' : isReformed ? '🛠️🤝✨' : '🎭💀🔥'}
                    </div>

                    {/* Objectives */}
                    <div className="bg-black/30 p-6 rounded-xl mb-8 backdrop-blur-sm text-left inline-block w-full">
                        <h3 className="text-2xl font-bold mb-4 text-center">Your Mission:</h3>
                        <ul className="list-none p-0 m-0 space-y-2">
                            {(isHero ? [
                                'Complete coding challenges',
                                'Watch for suspicious behavior',
                                'Vote to eject the imposter'
                            ] : [
                                'Pretend to fix the code',
                                'Use sabotage actions discreetly',
                                'Avoid getting caught!'
                            ]).map((objective, i) => (
                                <li key={i} className="text-lg font-medium flex items-center">
                                    <span className="font-bold mr-2">✓</span> {objective}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Close Button */}
                    <button
                        className="
                            bg-gradient-to-br from-emerald-600 to-emerald-500 text-white border-none py-4 px-12 text-xl font-black rounded-xl 
                            cursor-pointer transition-all duration-300 uppercase tracking-wider shadow-[0_4px_15px_rgba(5,150,105,0.4)]
                            hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(5,150,105,0.6)] active:translate-y-0
                        "
                        onClick={onClose}
                    >
                        START MISSION
                    </button>
                </div>
            </div>
        </div>
    );
};
