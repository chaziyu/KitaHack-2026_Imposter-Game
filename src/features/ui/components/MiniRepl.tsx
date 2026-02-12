import { useState, useRef, useEffect } from 'react';

interface MiniReplProps {
    prompt: string;
    expectedOutput?: string; // If checking output
    expectedCode?: string;   // If checking exact code
    onSuccess: () => void;
    placeholder?: string;
}

export const MiniRepl = ({ prompt, expectedOutput, expectedCode, onSuccess, placeholder = "Type code here..." }: MiniReplProps) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'SUCCESS' | 'ERROR'>('IDLE');
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleRun = () => {
        if (!input.trim()) return;

        // Simple validation logic for prototype
        let isCorrect = false;
        let result = "";

        // 1. Check exact code match (if provided)
        if (expectedCode) {
            if (input.replace(/\s+/g, '') === expectedCode.replace(/\s+/g, '')) {
                isCorrect = true;
            }
        }

        // 2. Check output (simulated evaluation)
        // Check for simple math
        if (!isCorrect && expectedOutput) {
            try {
                // eslint-disable-next-line no-eval
                const evalResult = eval(input);
                // Note: eval is dangerous in prod, but ok for this local prototype scope with safe inputs
                if (String(evalResult) === expectedOutput) {
                    isCorrect = true;
                    result = String(evalResult);
                } else {
                    result = String(evalResult);
                }
            } catch (e) {
                result = "Error: Invalid Syntax";
            }
        }

        // Special case handling for "print" simulation since eval key-values usually return undefined
        if (input.startsWith('print(') || input.startsWith('console.log(')) {
            const match = input.match(/\((.*?)\)/);
            if (match) {
                const content = match[1].replace(/["']/g, ''); // strip quotes
                if (content === expectedOutput) {
                    isCorrect = true;
                    result = content;
                } else {
                    result = content;
                }

                // Handle math inside print, e.g. print(5+10)
                if (!isCorrect) {
                    try {
                        // eslint-disable-next-line no-eval
                        const evalMath = eval(match[1]);
                        if (String(evalMath) === expectedOutput) {
                            isCorrect = true;
                            result = String(evalMath);
                        }
                    } catch (e) { /* ignore */ }
                }
            }
        }


        // Fallback for assignment checks
        if (expectedCode && !isCorrect) {
            // For "a = 5", eval returns 5.
            // If expectedCode is 'a = 5', and user typed 'a=5', we handled it in step 1.
            // If user typed 'a =  5', regex handled it.
        }

        if (isCorrect) {
            setStatus('SUCCESS');
            setOutput(result || "✅ Correct!");
            setTimeout(onSuccess, 1000); // Auto-advance after 1s
        } else {
            setStatus('ERROR');
            setOutput(result ? `Output: ${result} (Expected: ${expectedOutput})` : "❌ Try again!");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRun();
        }
    };

    return (
        <div className="bg-black/80 rounded-lg p-4 font-mono text-sm border-2 border-gray-700 w-full max-w-lg mx-auto shadow-xl">
            <div className="flex gap-2 mb-2 text-cyan-400 border-b border-gray-800 pb-2">
                <span className="text-yellow-500">➜</span>
                <span className="font-bold">MISSION TASK:</span>
                <span>{prompt}</span>
            </div>

            <div className="relative">
                <div className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">{'>'}</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            setStatus('IDLE');
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={`bg-transparent border-none outline-none flex-1 text-white placeholder-gray-600 ${status === 'ERROR' ? 'animate-shake' : ''
                            }`}
                        autoComplete="off"
                    />
                    <button
                        onClick={handleRun}
                        className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition-colors"
                    >
                        RUN
                    </button>
                </div>
            </div>

            {output && (
                <div className={`mt-3 p-2 rounded ${status === 'SUCCESS' ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-red-900/30 text-red-300 border border-red-700'
                    }`}>
                    {output}
                </div>
            )}

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    );
};
