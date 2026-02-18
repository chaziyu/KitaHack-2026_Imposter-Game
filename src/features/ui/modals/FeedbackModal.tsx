import React, { useState } from 'react';
import { useGameStore } from '../../../stores/useGameStore';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
    const { network } = useGameStore();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            if (network && 'submitFeedback' in network) {
                await (network as { submitFeedback: (rating: number, comment: string) => Promise<void> }).submitFeedback(rating, comment);
            } else {
                // console.log('Feedback submitted (simulated):', { rating, comment });
                // Fallback for dev/no-network
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            setSubmitted(true);
            setTimeout(() => {
                onClose();
                setSubmitted(false);
                setRating(0);
                setComment('');
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[200]">
            <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    ✕
                </button>

                {submitted ? (
                    <div className="text-center py-8 animate-fade-in">
                        <div className="text-5xl mb-4">🎉</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
                        <p className="text-gray-400">Your feedback helps us save the planet!</p>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-1 text-center">Rate Your Mission</h2>
                        <p className="text-gray-400 text-sm text-center mb-6">Help us improve the Academy</p>

                        <form onSubmit={handleSubmit}>
                            {/* Star Rating */}
                            <div className="flex justify-center gap-2 mb-6">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        className={`text-4xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-400' : 'text-gray-600'
                                            }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>

                            {/* Comment */}
                            <div className="mb-6">
                                <label className="block text-sm text-gray-400 mb-2">
                                    Why did you choose this rating? (Optional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-cyan-500 focus:outline-none h-24 resize-none placeholder-gray-600"
                                    placeholder="Tell us what you liked or what broke..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={rating === 0 || isSubmitting}
                                className={`w-full py-3 rounded font-bold transition-all ${rating > 0
                                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg transform hover:scale-[1.02]'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};
