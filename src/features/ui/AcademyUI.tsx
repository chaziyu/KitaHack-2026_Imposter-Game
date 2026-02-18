import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { MiniRepl } from './MiniRepl';
import { SDGBadgeGroup } from './SDGBadge';

interface AcademyLesson {
    id: string;
    title: string;
    tutor: string;
    sdgGoals: number[];
    intro: string;
    storyIntro: string;
    realWorldImpact: string;
    steps: {
        type: 'text' | 'interactive';
        content?: string; // For text, supporting markdown-ish
        title?: string;   // Optional step title
        prompt?: string;  // For interactive
        code?: string;    // Expected code (or just a snippet)
        output?: string;  // Expected output
    }[];
}

const LESSONS: Record<string, AcademyLesson> = {
    'solar': {
        id: 'solar',
        title: '☀️ Solar Power Systems (Variables)',
        tutor: "Professor Sunny",
        sdgGoals: [7, 13],
        intro: "Welcome, future Earth-saver! 🌍",
        storyIntro: "Oh no! A village's lights are going out because they don't have enough clean energy. But YOU can learn the coding skill to help them switch to solar power!",
        realWorldImpact: "Did you know? When villages use solar panels instead of fossil fuels, they stop releasing harmful CO₂ that causes climate change. Your coding skills can really help save the planet!",
        steps: [
            {
                type: 'text',
                title: "Step 1: Understanding Variables",
                content: "Variables are like boxes that hold numbers. We name them so we can use them later!\n\n`let energy = 100;` means we have a box named 'energy' with 100 units inside."
            },
            {
                type: 'interactive',
                title: "Step 2: Try it out!",
                prompt: "Create a variable named 'sun' and give it value 10.",
                code: "let sun = 10",
                output: "10"
            },
            {
                type: 'text',
                title: "Step 3: Variable Changes",
                content: "Variables can change. If clouds block the sun, we might change the value: `energy = 50;`"
            },
            {
                type: 'interactive',
                title: "Step 4: Calculation",
                prompt: "Calculate the total energy: 50 + 50",
                code: "50 + 50",
                output: "100"
            }
        ]
    },
    'waste': {
        id: 'waste',
        title: '♻️ Waste Sorting (Loops)',
        tutor: "Engineer Loop",
        sdgGoals: [12],
        intro: "Hello, Environmental Hero! 🦸",
        storyIntro: "Emergency! Five trucks full of recyclables just arrived at the recycling plant. If we don't sort them quickly, they'll go to the landfill and pollute our Earth! We need YOUR coding powers!",
        realWorldImpact: "True Fact: Recycling plants that use automated sorting can process 100,000 items per hour! This saves forests, reduces ocean plastic, and keeps our planet beautiful.",
        steps: [
            {
                type: 'text',
                title: "Step 1: The Problem",
                content: "Sorting trash item by item is slow. We need **Loops** to do it automatically!\n\nA `for` loop repeats an action."
            },
            {
                type: 'text',
                title: "Step 2: Loop Syntax",
                content: "`for (let i = 0; i < 5; i++)` means 'Do this 5 times'."
            },
            {
                type: 'interactive',
                title: "Step 3: Write a Loop",
                prompt: "Type a simple loop header: for(let i=0; i<3; i++)",
                code: "for(let i=0; i<3; i++)",
            }
        ]
    },
    'oxygen': {
        id: 'oxygen',
        title: '🌳 Reforestation (Functions)',
        tutor: "Scientist Vita",
        sdgGoals: [13, 3],
        intro: "Greetings, Planet Protector! 🛡️",
        storyIntro: "Earth's air is getting polluted! But we have hope - new Bio-Domes that need automated planting systems. Your mission is to program the reforestation drones using FUNCTIONS!",
        realWorldImpact: "Amazing Truth: Reforestation algorithms help drones plant 100,000 trees a day! This restores habitats and cleans the air for everyone.",
        steps: [
            {
                type: 'text',
                title: "Step 1: What is a Function?",
                content: "A **Function** is like a super-command. Instead of giving 10 separate orders, you group them into one named action.\n\nLike saying 'Make Sandwich' instead of 'Get bread, get cheese, put cheese on bread...'"
            },
            {
                type: 'text',
                title: "Step 2: Syntax",
                content: "To create a function:\n`function plantTree() { ... }`\n\nTo use it:\n`plantTree();`"
            },
            {
                type: 'interactive',
                title: "Step 3: Define a Function",
                prompt: "Create a function named 'plant': function plant() {}",
                code: "function plant() {}",
            },
            {
                type: 'interactive',
                title: "Step 4: Use the Function",
                prompt: "Now call your function! Type: plant()",
                code: "plant()",
                output: "Tree planted! 🌳"
            }
        ]
    }
};

export const AcademyUI = () => {
    const { closeTerminal, academyType, openEditor } = useGameStore();
    const [stepIndex, setStepIndex] = useState(0);
    const [isTaskSolved, setIsTaskSolved] = useState(false);

    const activeLesson = academyType ? LESSONS[academyType] : null;
    if (!activeLesson) return null;

    const currentStep = activeLesson.steps[stepIndex];
    const isLastStep = stepIndex === activeLesson.steps.length - 1;

    const handleNext = () => {
        if (stepIndex < activeLesson.steps.length - 1) {
            setStepIndex(stepIndex + 1);
            setIsTaskSolved(false); // Reset for next step
        } else {
            // Finished Academy -> Start Challenge
            closeTerminal();
            // Map academy type to challenge ID
            const challengeMap: Record<string, 'file_sum' | 'file_loop' | 'file_cpp_hello'> = {
                'solar': 'file_sum',
                'waste': 'file_loop',
                'oxygen': 'file_cpp_hello'
            };
            const challengeId = challengeMap[academyType || ''];
            if (challengeId) {
                openEditor(challengeId);
            }
        }
    };

    const handleTaskSuccess = () => {
        setIsTaskSolved(true);
    };

    // Determine if we can proceed
    const canProceed = currentStep.type === 'text' || isTaskSolved;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.3s_ease-out]">
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>

            <div className="max-w-4xl w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700 flex flex-col h-[700px]">

                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-2xl">
                                {activeLesson.id === 'solar' ? '☀️' : activeLesson.id === 'waste' ? '♻️' : '🌳'}
                            </span>
                            <h1 className="text-2xl font-bold text-white tracking-wide">{activeLesson.title}</h1>
                        </div>
                        <div className="flex gap-2 mt-2">
                            {activeLesson.steps.map((_, i) => (
                                <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i <= stepIndex ? 'bg-cyan-400' : 'bg-gray-700'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SDGBadgeGroup goals={activeLesson.sdgGoals} size="small" />
                        <button onClick={closeTerminal} className="text-gray-500 hover:text-white px-3 text-xl">✕</button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">

                    {/* Intro Box (Only on first step) */}
                    {stepIndex === 0 && (
                        <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r mb-4">
                            <h3 className="text-blue-300 font-bold text-lg mb-1">{activeLesson.intro}</h3>
                            <p className="text-gray-300">{activeLesson.storyIntro}</p>
                        </div>
                    )}

                    {/* Step Title */}
                    {currentStep.title && (
                        <h2 className="text-xl font-bold text-cyan-300 border-b border-gray-700 pb-2">
                            {currentStep.title}
                        </h2>
                    )}

                    {/* Text Content */}
                    {currentStep.type === 'text' && (
                        <div className="prose prose-invert prose-lg max-w-none animate-fadeIn">
                            <p className="whitespace-pre-line leading-relaxed text-gray-200">
                                {currentStep.content}
                            </p>
                        </div>
                    )}

                    {/* Interactive Content */}
                    {currentStep.type === 'interactive' && (
                        <div className="animate-slideUp w-full flex flex-col items-center gap-4 bg-black/20 p-6 rounded-xl border border-gray-700">
                            <div className="text-lg text-yellow-300 font-bold mb-2 flex items-center gap-2">
                                🛠️ PRACTICE TIME
                            </div>

                            <MiniRepl
                                prompt={currentStep.prompt || "Solve this!"}
                                expectedCode={currentStep.code}
                                expectedOutput={currentStep.output}
                                onSuccess={handleTaskSuccess}
                            />
                            {isTaskSolved && (
                                <div className="text-green-400 font-bold animate-bounce mt-2">
                                    Great job! You can now proceed.
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Navigation */}
                <div className="bg-gray-900 p-6 border-t border-gray-700 flex justify-between items-center">
                    <button
                        onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
                        disabled={stepIndex === 0}
                        className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition"
                    >
                        ← Previous
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className={`px-8 py-3 rounded-lg font-bold transition-all transform hover:scale-105 ${canProceed
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/50'
                            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isLastStep ? 'START CHALLENGE 🚀' : 'NEXT →'}
                    </button>
                </div>
            </div>
        </div>
    );
};
