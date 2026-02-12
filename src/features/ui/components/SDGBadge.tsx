interface SDGBadgeProps {
    goal: number;
    size?: 'small' | 'medium' | 'large';
    showTooltip?: boolean;
}

const SDG_INFO: Record<number, { name: string; color: string; icon: string }> = {
    3: {
        name: 'Good Health and Well-Being',
        color: 'bg-green-600',
        icon: '❤️'
    },
    4: {
        name: 'Quality Education',
        color: 'bg-red-600',
        icon: '📚'
    },
    6: {
        name: 'Clean Water and Sanitation',
        color: 'bg-cyan-500',
        icon: '💧'
    },
    7: {
        name: 'Affordable and Clean Energy',
        color: 'bg-yellow-500',
        icon: '⚡'
    },
    9: {
        name: 'Industry, Innovation and Infrastructure',
        color: 'bg-orange-600',
        icon: '🏗️'
    },
    11: {
        name: 'Sustainable Cities and Communities',
        color: 'bg-orange-500',
        icon: '🏙️'
    },
    12: {
        name: 'Responsible Consumption and Production',
        color: 'bg-yellow-600',
        icon: '♻️'
    },
    13: {
        name: 'Climate Action',
        color: 'bg-green-700',
        icon: '🌍'
    },
    15: {
        name: 'Life on Land',
        color: 'bg-lime-600',
        icon: '🌳'
    }
};

export const SDGBadge = ({ goal, size = 'medium', showTooltip = true }: SDGBadgeProps) => {
    const sdg = SDG_INFO[goal];

    if (!sdg) return null;

    const sizeClasses = {
        small: 'w-8 h-8 text-xs',
        medium: 'w-12 h-12 text-sm',
        large: 'w-16 h-16 text-base'
    };

    const iconSizes = {
        small: 'text-base',
        medium: 'text-xl',
        large: 'text-2xl'
    };

    return (
        <div className="relative group">
            <div className={`${sdg.color} ${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold text-white shadow-lg border-2 border-white/20 hover:scale-110 transition-transform cursor-pointer`}>
                <div className="flex flex-col items-center justify-center">
                    <div className={iconSizes[size]}>{sdg.icon}</div>
                    <div className="text-[10px] font-black">SDG {goal}</div>
                </div>
            </div>

            {showTooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 animate-fade-in">
                    <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl border border-gray-700 whitespace-nowrap text-xs">
                        <div className="font-bold">SDG {goal}</div>
                        <div className="text-gray-300">{sdg.name}</div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
};

interface SDGBadgeGroupProps {
    goals: number[];
    size?: 'small' | 'medium' | 'large';
}

export const SDGBadgeGroup = ({ goals, size = 'small' }: SDGBadgeGroupProps) => {
    return (
        <div className="flex gap-2 items-center">
            {goals.map(goal => (
                <SDGBadge key={goal} goal={goal} size={size} />
            ))}
        </div>
    );
};
