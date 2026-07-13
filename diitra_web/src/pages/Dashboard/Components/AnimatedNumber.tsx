import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    formatter?: (val: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
    value,
    duration = 1000,
    formatter
}) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const startValue = 0;
        const endValue = value;

        if (endValue === 0) {
            setDisplayValue(0);
            return;
        }

        let animationFrameId: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Ease out quad formula: f(t) = t * (2 - t)
            const easeProgress = progress * (2 - progress);
            
            const current = startValue + easeProgress * (endValue - startValue);
            setDisplayValue(current);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            } else {
                setDisplayValue(endValue);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [value, duration]);

    return <>{formatter ? formatter(displayValue) : Math.round(displayValue)}</>;
};
