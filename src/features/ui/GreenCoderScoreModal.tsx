import React from 'react';
import type { GreenCoderScore } from '../../types/ai-levels';

interface GreenCoderScoreModalProps {
    score: GreenCoderScore;
    onClose: () => void;
    isVisible: boolean;
    stakes?: {
        success: string;
        failure: string;
    };
}

/**
 * Post-game analysis modal showing Green Coder Score and efficiency metrics
 */
export const GreenCoderScoreModal: React.FC<GreenCoderScoreModalProps> = ({
    score,
    onClose,
    isVisible,
    stakes
}) => {
    if (!isVisible) return null;

    const getScoreColor = (value: number): string => {
        if (value >= 90) return 'text-green-500 border-green-500'; // Excellent
        if (value >= 75) return 'text-green-400 border-green-400'; // Great
        if (value >= 60) return 'text-yellow-400 border-yellow-400'; // Good
        if (value >= 40) return 'text-orange-400 border-orange-400'; // Fair
        return 'text-red-500 border-red-500'; // Needs improvement
    };

    const getScoreLabel = (value: number): string => {
        if (value >= 90) return 'Excellent! 🌟';
        if (value >= 75) return 'Great Work! ⭐';
        if (value >= 60) return 'Good Job! ✨';
        if (value >= 40) return 'Keep Learning! 💪';
        return 'Room to Grow! 🌱';
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 animate-fade-in" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 max-w-2xl w-[90%] max-h-[90vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-white text-3xl font-bold m-0">🌍 Green Coder Analysis</h2>
                    <button
                        className="text-white/60 hover:text-white text-4xl w-8 h-8 flex items-center justify-center transition-colors bg-transparent border-none cursor-pointer"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                {/* Score Display */}
                <div className="text-center mb-8 py-8">
                    <div className={`w-[150px] h-[150px] mx-auto mb-4 rounded-full border-8 flex flex-col items-center justify-center relative animate-scale-up ${getScoreColor(score.green_coder_score)}`}>
                        <div className="text-5xl font-extrabold leading-none">
                            {score.green_coder_score}
                        </div>
                        <div className="text-white/50 text-base">/100</div>
                    </div>
                    <div className="text-white text-xl font-semibold">{getScoreLabel(score.green_coder_score)}</div>
                </div>

                {/* Professor Gaia Message & Narrative Outcome */}
                <div className={`border-2 rounded-xl p-6 mb-8 flex gap-4 items-start ${score.green_coder_score >= 60 ? 'bg-green-400/10 border-green-400/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <div className="text-4xl shrink-0">{score.green_coder_score >= 60 ? '🌍' : '⚠️'}</div>
                    <div className="flex flex-col gap-2">
                        <p className="text-white leading-relaxed m-0 font-medium">{score.professor_gaia_message}</p>
                        {stakes && (
                            <p className={`text-sm m-0 italic ${score.green_coder_score >= 60 ? 'text-green-300' : 'text-red-300'}`}>
                                {score.green_coder_score >= 60 ? stakes.success : stakes.failure}
                            </p>
                        )}
                    </div>
                </div>

                {/* Complexity Analysis */}
                <div className="mb-8">
                    <h3 className="text-white text-xl font-semibold mb-4">⚡ Efficiency Analysis</h3>
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 bg-white/5 p-4 rounded-lg flex flex-col gap-2">
                            <span className="text-white/60 text-sm">Your Solution:</span>
                            <span className="text-yellow-400 text-xl font-bold font-mono">{score.player_complexity}</span>
                        </div>
                        <div className="flex-1 bg-white/5 p-4 rounded-lg flex flex-col gap-2">
                            <span className="text-white/60 text-sm">Optimal:</span>
                            <span className="text-green-500 text-xl font-bold font-mono">{score.optimal_complexity}</span>
                        </div>
                    </div>
                    <p className="text-white/80 leading-relaxed m-0">{score.complexity_comparison}</p>
                </div>

                {/* Environmental Impact */}
                <div className="bg-green-500/10 rounded-xl p-6 mb-8">
                    <h3 className="text-white text-xl font-semibold mb-4">🌱 Environmental Impact</h3>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="text-4xl">⚡</div>
                        <div className="stat-content">
                            <div className="text-yellow-400 text-2xl font-bold">{score.energy_impact.energy_wasted_kwh} kWh</div>
                            <div className="text-white/60 text-sm">Energy Difference</div>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg flex items-center gap-3 mb-4">
                        <div className="text-2xl">🔌</div>
                        <p className="text-white text-base m-0">{score.energy_impact.real_world_equivalent}</p>
                    </div>
                    <div className="mt-4">
                        <div className="inline-block bg-gradient-to-br from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase mb-2 shadow-sm">
                            SDG Impact
                        </div>
                        <p className="text-white/90 m-0 text-base leading-relaxed">{score.energy_impact.sdg_message}</p>
                    </div>
                </div>

                {/* Feedback & Tips */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="bg-white/5 rounded-lg p-5">
                        <h4 className="text-white text-base font-semibold m-0 mb-3">💚 Feedback</h4>
                        <p className="text-white/80 m-0 leading-relaxed">{score.feedback}</p>
                    </div>
                    {score.optimization_tip && (
                        <div className="bg-white/5 rounded-lg p-5">
                            <h4 className="text-white text-base font-semibold m-0 mb-3">💡 Optimization Tip</h4>
                            <p className="text-white/80 m-0 leading-relaxed">{score.optimization_tip}</p>
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <button
                    className="w-full bg-gradient-to-br from-green-400 to-green-500 text-white border-none p-4 rounded-lg text-lg font-bold cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(74,222,128,0.4)]"
                    onClick={onClose}
                >
                    Continue Your Journey 🚀
                </button>
            </div>
        </div>
    );
};
