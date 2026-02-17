/**
 * Complete story script for intro and victory animations
 */

export interface StoryScene {
    id: string;
    duration: number; // milliseconds
    background: string; // CSS gradient or color
    visual: string; // Emoji visualization
    text: string;
    narration?: string;
    animation?: string;
}

export const INTRO_SCENES: StoryScene[] = [
    {
        id: 'virus-threat',
        duration: 4000,
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        visual: '🦠💻⚠️',
        text: 'ALERT! A digital virus is threatening Earth\'s critical systems!',
        narration: 'The world\'s infrastructure is under attack...',
        animation: 'shake'
    },
    {
        id: 'professor-gaia-call',
        duration: 4000,
        background: 'linear-gradient(135deg, #1e40af 0%, #312e81 100%)',
        visual: '✨🧙‍♀️📞',
        text: 'Professor Gaia calls upon the world\'s brightest CODERS to fix the crisis!',
        narration: 'Will you answer the call to save humanity?',
        animation: 'sparkle'
    },
    {
        id: 'imposter-warning',
        duration: 4500,
        background: 'linear-gradient(135deg, #7c2d12 0%, #1c1917 100%)',
        visual: '🕵️❓🎭',
        text: 'WARNING: Intelligence reports that one coder among you is a SABOTEUR!',
        narration: 'Trust no one... someone wants the mission to fail...',
        animation: 'shake'
    },
    {
        id: 'dual-mission',
        duration: 4500,
        background: 'linear-gradient(135deg, #059669 0%, #065f46 100%)',
        visual: '🦸‍♀️🔍💻',
        text: 'HEROES: Fix the code and find the saboteur!\nIMPOSTER: Sabotage without getting caught!',
        narration: 'Two missions. One outcome. Who will prevail?',
        animation: 'pulse'
    },
    {
        id: 'adventure-begins',
        duration: 4000,
        background: 'linear-gradient(135deg, #3b82f6 0%, #f59e0b 100%)',
        visual: '🚀🌍🎮',
        text: 'The detective adventure begins NOW! Can you save the world?',
        narration: 'Good luck, agent. The fate of the world is in your hands...',
        animation: 'bounce'
    }
];

export const VICTORY_SCENES: StoryScene[] = [
    {
        id: 'mission-complete',
        duration: 4000,
        background: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
        visual: '⚡♻️💨✨',
        text: 'MISSION COMPLETE! Powers Combined!',
        narration: 'Solar, Recycling, and Air systems are fully operational!',
        animation: 'combine'
    },
    {
        id: 'earth-restored',
        duration: 4000,
        background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
        visual: '🌍💚🦋🏙️',
        text: 'The Earth is Healing! Nature Thrives!',
        narration: 'Clean energy, pure air, and healthy oceans restored!',
        animation: 'bloom'
    },
    {
        id: 'hero-call',
        duration: 5000,
        background: 'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
        visual: '🧙‍♀️🏆🦸‍♂️',
        text: 'You are a true Earth Guardian!',
        narration: 'Gaia: "Thank you! Now go protect the REAL world too!"',
        animation: 'celebration'
    }
];

export interface TutorialStep {
    id: string;
    target: string; // Element ID or class to highlight
    position: 'top' | 'right' | 'bottom' | 'left' | 'center';
    title: string;
    description: string;
    highlight: boolean;
    arrow?: boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        target: 'game-canvas',
        position: 'center',
        title: 'Welcome to the Code Detective Mission! 🕵️',
        description: 'Earth\'s systems are under attack! Work together to fix the code... but beware of the saboteur!',
        highlight: false,
        arrow: false
    },
    // --- NEW CONTROL GUIDE ADDED HERE ---
    {
        id: 'controls',
        target: 'game-canvas',
        position: 'center',
        title: 'How to Move & Play 🎮',
        description: '⌨️ MOVEMENT: Use W, A, S, D keys to walk around.\n\n📍 INTERACT: Simply walk onto any Station Icon to start the task or tutorial automatically!',
        highlight: false,
        arrow: false
    },
    // ------------------------------------
    {
        id: 'academies',
        target: 'academy-stations',
        position: 'right',
        title: 'ACADEMY Stations 📚',
        description: 'Learn coding skills here! Visit these stations to unlock powers that help you complete challenges.',
        highlight: true,
        arrow: true
    },
    {
        id: 'challenges',
        target: 'challenge-stations',
        position: 'right',
        title: 'CHALLENGE Stations 🎯',
        description: 'Fix the broken code here to save Earth! Complete challenges to win... but watch for sabotage!',
        highlight: true,
        arrow: true
    },
    {
        id: 'hint-system',
        target: 'hint-button',
        position: 'bottom',
        title: 'Need Help? Ask Professor Gaia! 💡',
        description: 'Stuck on code? Professor Gaia can help detect bugs and guide you! (Extra helpful in Kids Mode)',
        highlight: true,
        arrow: true // Changed to true to make it more obvious
    },
    {
        id: 'detective-work',
        target: 'task-board',
        position: 'bottom',
        title: 'Detective Work! 🔍',
        description: 'Watch for suspicious behavior! If code suddenly breaks or changes mysteriously, the saboteur might be nearby...',
        highlight: true,
        arrow: false
    },
    {
        id: 'start-journey',
        target: 'academy-solar',
        position: 'right',
        title: 'Start Your Mission! ⚡',
        description: 'Begin with an Academy to learn, then solve challenges! Work together to find the saboteur and save Earth!',
        highlight: true,
        arrow: true
    }
];
