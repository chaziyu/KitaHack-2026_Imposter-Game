import { useState, useEffect, useRef } from 'react';
import { chatWithMentor, type ChatMessage, hintRateLimiter } from '../../services/GoogleAIService';

interface MentorChatProps {
    isOpen: boolean;
    onClose: () => void;
    challengeId?: string;
    challengeDescription?: string;
    currentCode?: string;
    initialError?: string;
}

const QUICK_QUESTIONS = [
    "How do I start this challenge? 🤔",
    "I'm stuck, can you help? 😅",
    "Show me an example please! 📝",
    "What does this error mean? ❓"
];

export const MentorChat = ({ isOpen, onClose, challengeId, challengeDescription, currentCode, initialError }: MentorChatProps) => {
    const [messages, setMessages] = useState<ChatMessage[]>(() => [{
        id: '1',
        role: 'mentor',
        content: "Hello, young hero! 🌍 I'm Professor Gaia, your AI mentor. How can I help you master your coding powers today?",
        timestamp: Date.now()
    }]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim() || isLoading) return;

        // Check rate limiting
        if (!hintRateLimiter.canRequest()) {
            const remaining = hintRateLimiter.getTimeRemaining();
            setError(`Please wait ${remaining} seconds before asking again 🕐`);
            setTimeout(() => setError(''), 3000);
            return;
        }

        // Add user message
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setError('');

        // Get mentor response
        const response = await chatWithMentor({
            message: messageText,
            challengeId,
            challengeDescription,
            currentCode,
            conversationHistory: messages // Note: This uses messages from closure, might be stale if calling rapidly?
            // Better to pass the new list, but for now this matches original logic.
        });

        setIsLoading(false);

        if (response.success) {
            const mentorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'mentor',
                content: response.message,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, mentorMessage]);
            hintRateLimiter.recordRequest();
        } else {
            setError(response.error || 'Professor Gaia encountered an error. Try again!');
        }
    };

    // Handle Initial Error (Auto-trigger explanation)
    useEffect(() => {
        if (isOpen && initialError) {
            const explainError = async () => {
                /* 
                   Refactoring: Let's simply trigger `sendMessage` with the error text.
                */
                sendMessage(`I got this error: \n${initialError}\n\nCan you explain what it means and how to fix it?`);
            };
            explainError();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialError]); // Only run when opening with an error

    const handleSend = () => {
        sendMessage(inputMessage);
    };

    const handleQuickQuestion = (question: string) => {
        sendMessage(question);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-gradient-to-br from-purple-900 to-blue-900 border-4 border-yellow-500 rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 flex items-center justify-between rounded-t-xl border-b-4 border-yellow-500">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-2xl border-2 border-white">
                            🧙‍♀️
                        </div>
                        <div>
                            <h2 className="text-white font-black text-xl">Professor Gaia</h2>
                            <p className="text-yellow-100 text-xs">AI Mentor • Guardian of Earth</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                                {/* Avatar */}
                                {msg.role === 'mentor' && (
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm border border-white">
                                            🧙‍♀️
                                        </div>
                                        <span className="text-xs text-gray-300">Professor Gaia</span>
                                    </div>
                                )}

                                {/* Message Bubble */}
                                <div
                                    className={`rounded-2xl p-4 ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>

                                {msg.role === 'user' && (
                                    <div className="text-xs text-gray-400 mt-1 text-right">You</div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-[80%]">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm border border-white">
                                        🧙‍♀️
                                    </div>
                                    <span className="text-xs text-gray-300">Professor Gaia is thinking...</span>
                                </div>
                                <div className="bg-gray-800 rounded-2xl rounded-bl-none p-4 border border-gray-700">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions (only shown at start) */}
                {messages.length === 1 && !isLoading && (
                    <div className="px-4 pb-2">
                        <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
                        <div className="grid grid-cols-2 gap-2">
                            {QUICK_QUESTIONS.map((question, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickQuestion(question)}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 px-3 rounded-lg transition-colors text-left border border-gray-700"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="mx-4 mb-2 bg-red-900/50 border border-red-700 rounded-lg p-2 text-red-300 text-sm">
                        {error}
                    </div>
                )}

                {/* Input Area */}
                <div className="bg-gray-800/50 p-4 border-t-2 border-gray-700 rounded-b-xl">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask Professor Gaia anything..."
                            disabled={isLoading}
                            className="flex-1 bg-gray-900 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 border border-gray-700 disabled:opacity-50"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputMessage.trim() || isLoading}
                            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 font-bold px-6 py-3 rounded-lg transition-all shadow-lg disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <span>Send</span>
                            <span className="text-lg">📨</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Press Enter to send • Shift+Enter for new line</p>
                </div>
            </div>
        </div>
    );
};
