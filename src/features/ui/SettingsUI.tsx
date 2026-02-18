import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { FeedbackModal } from './modals/FeedbackModal';

export const SettingsUI = () => {
    const { bgmVolume, sfxVolume, setBgmVolume, setSfxVolume } = useGameStore();
    const [isOpen, setIsOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

    return (
        <div className="fixed top-4 left-4 z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full shadow-lg transition ${isOpen ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                title="Settings"
            >
                {isOpen ? '❌' : '⚙️'}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 bg-gray-900 border border-gray-700 p-4 rounded shadow-xl w-64 animate-fade-in">
                    <h3 className="text-white text-sm font-bold mb-4 border-b border-gray-700 pb-2">Audio Settings</h3>

                    <div className="mb-4">
                        <label className="block text-gray-400 text-xs mb-1">Music Volume ({Math.round(bgmVolume * 100)}%)</label>
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={bgmVolume}
                            onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-400 text-xs mb-1">SFX Volume ({Math.round(sfxVolume * 100)}%)</label>
                        <input
                            type="range"
                            min="0" max="1" step="0.05"
                            value={sfxVolume}
                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>

                    <div className="border-t border-gray-700 pt-4">
                        <button
                            onClick={() => {
                                setIsFeedbackOpen(true);
                                setIsOpen(false);
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2"
                        >
                            ⭐ Rate Mission
                        </button>
                    </div>
                </div>
            )}

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
        </div>
    );
};

