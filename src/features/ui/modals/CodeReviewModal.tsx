import { useEffect } from 'react';

interface CodeReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    rating: number;
    feedback: string;
    tip: string;
    isLoading?: boolean;
}

export const CodeReviewModal = ({ isOpen, onClose, rating, feedback, tip, isLoading }: CodeReviewModalProps) => {
    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-purple-500/50 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 animate-scale-up">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl border-b-2 border-purple-400/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-5xl">🎓</span>
                            <div>
                                <h2 className="text-white font-black text-2xl tracking-tight">Professor Gaia's Review</h2>
                                <p className="text-purple-200 text-sm">AI Code Analysis & Feedback</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                <span className="absolute inset-0 flex items-center justify-center text-3xl">🧠</span>
                            </div>
                            <p className="text-cyan-400 text-lg font-semibold animate-pulse">Professor Gaia is analyzing your code...</p>
                            <p className="text-gray-400 text-sm">Evaluating efficiency, style, and environmental impact</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Rating Stars */}
                            <div className="flex items-center justify-center gap-2 pb-4 border-b border-gray-700">
                                <span className="text-gray-400 text-sm font-semibold mr-2">Code Quality:</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <span
                                            key={i}
                                            className={`text-3xl transition-all ${i <= rating
                                                ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                                                : 'text-gray-700'
                                                }`}
                                        >
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="text-white font-bold text-xl ml-2">{rating}/5</span>
                            </div>

                            {/* Feedback */}
                            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 p-6 rounded-xl border border-green-500/30">
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl flex-shrink-0">💬</span>
                                    <div>
                                        <p className="text-green-400 font-bold text-sm mb-1 uppercase tracking-wide">Feedback</p>
                                        <p className="text-gray-200 text-base leading-relaxed italic">"{feedback}"</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pro Tip */}
                            <div className="bg-gradient-to-br from-blue-900/40 to-cyan-900/30 p-6 rounded-xl border border-blue-500/40">
                                <div className="flex items-start gap-3">
                                    <span className="text-3xl flex-shrink-0">💡</span>
                                    <div>
                                        <p className="text-blue-300 font-bold text-sm mb-1 uppercase tracking-wide">Pro Tip for Next Time</p>
                                        <p className="text-gray-200 text-base leading-relaxed">{tip}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="text-center pt-4">
                                <p className="text-gray-500 text-xs">
                                    Keep coding green! 🌍 Every optimization helps save the planet. ✨
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLoading && (
                    <div className="bg-gray-800/50 p-4 rounded-b-2xl border-t border-gray-700">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-purple-500/50"
                        >
                            Got it! Thanks Professor Gaia 🙏
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
