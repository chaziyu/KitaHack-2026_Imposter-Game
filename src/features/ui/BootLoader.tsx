import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const BootLoader = ({ onComplete }: { onComplete?: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);

    const bootSequence = [
        "> INITIALIZING ECO-SYSTEM KERNEL...",
        "> LOADING SUSTAINABILITY MODULES...",
        "> CONNECTING TO GAIA NETWORK...",
        "> CHECKING ENERGY EFFICIENCY...",
        "> SYSTEM READY."
    ];

    useEffect(() => {
        let currentIndex = 0;

        const interval = setInterval(() => {
            if (currentIndex < bootSequence.length) {
                setLines(prev => [...prev, bootSequence[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 800);
            }
        }, 150); // Add a line every 150ms (Speed up from 600ms)

        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 bg-black z-[999] flex flex-col items-center justify-center font-mono p-10 text-left">
            <div className="w-full max-w-2xl">
                {lines.map((line, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-green-500 text-xl md:text-2xl mb-2"
                    >
                        {line}
                    </motion.div>
                ))}
                <motion.div
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-4 h-8 bg-green-500 inline-block align-middle ml-2"
                />
            </div>
        </div>
    );
};
