import { useEffect, useRef } from 'react';

export const CyberBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        // Particles
        const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];
        const particleCount = 50;

        const colors = ['#0ea5e9', '#10b981', '#6366f1']; // Sky, Emerald, Indigo

        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: Math.random() * 2 + 1,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }

        // Animation Loop
        let animationFrameId: number;

        const animate = () => {
            ctx.fillStyle = 'rgba(17, 24, 39, 0.2)'; // Trail effect
            ctx.fillRect(0, 0, width, height);

            // Draw Grid
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            const offset = (Date.now() / 50) % gridSize;

            for (let x = 0; x < width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x + offset, 0);
                ctx.lineTo(x + offset, height);
                ctx.stroke();
            }

            // Draw Particles
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[-1]"
            style={{ opacity: 0.8 }}
        />
    );
};
