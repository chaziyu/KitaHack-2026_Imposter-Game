import React, { useEffect, useState } from 'react';

interface SDGPopupProps {
    sdgId: number;
    title: string;
    description: string;
    onClose: () => void;
}

export const SDGPopup: React.FC<SDGPopupProps> = ({ sdgId, title, description, onClose }) => {
    const [visible, setVisible] = useState(false);

    const handleClose = React.useCallback(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for animation
    }, [onClose]);

    useEffect(() => {
        // Animate in
        setTimeout(() => setVisible(true), 100);

        // Auto close after 5 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, [handleClose]);

    const getSDGColor = (id: number) => {
        const colors: Record<number, string> = {
            1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
            6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
            11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
            16: '#00689D', 17: '#19486A'
        };
        return colors[id] || '#000000';
    };

    return (
        <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden max-w-sm border-2" style={{ borderColor: getSDGColor(sdgId) }}>
                {/* Header */}
                <div className="p-4 text-white flex items-center gap-3" style={{ backgroundColor: getSDGColor(sdgId) }}>
                    <div className="bg-white/20 p-2 rounded text-2xl font-bold w-12 h-12 flex items-center justify-center">
                        {sdgId}
                    </div>
                    <div>
                        <p className="text-xs uppercase font-bold tracking-wider opacity-90">Goal Contributed!</p>
                        <h3 className="font-bold leading-tight">{title}</h3>
                    </div>
                    <button onClick={handleClose} className="ml-auto text-white/80 hover:text-white">✕</button>
                </div>

                {/* Body */}
                <div className="p-4 bg-gray-50">
                    <p className="text-gray-800 text-sm">{description}</p>
                    <div className="mt-3 flex justify-end">
                        <span className="text-[10px] text-gray-500 font-mono">UN SUSTAINABLE DEVELOPMENT GOALS</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
