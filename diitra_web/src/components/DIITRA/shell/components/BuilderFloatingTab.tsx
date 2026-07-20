import React from 'react';
import { FileText, MessageSquare } from 'lucide-react';

export interface BuilderFloatingTabProps {
    position: 'left' | 'right';
    topPercent: number;
    xOffset: number;
    isDragging: boolean;
    isOnline?: boolean;
    onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
    onTouchStart: (e: React.MouseEvent | React.TouchEvent) => void;
}

export const BuilderFloatingTab: React.FC<BuilderFloatingTabProps> = ({
    position,
    topPercent,
    xOffset,
    isDragging,
    isOnline = true,
    onMouseDown,
    onTouchStart
}) => {
    const isLeft = position === 'left';

    return (
        <button
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
            style={{
                top: `${topPercent}%`,
                transform: `translateY(-50%) translateX(${isLeft ? `${xOffset}px` : `-${xOffset}px`})`,
                transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
            className={`absolute ${isLeft ? 'left-0' : 'right-0'} z-[60] bg-surface hover:bg-bg-deep border border-border-thin text-text-dim hover:text-text-main py-8 px-2.5 shadow-xl flex flex-col items-center gap-2.5 transition-all duration-200 animate-fade-in group cursor-grab active:cursor-grabbing ${
                isDragging || xOffset > 5
                    ? 'rounded-full scale-[1.05] shadow-2xl border-text-main text-text-main bg-bg-deep'
                    : isLeft ? 'rounded-r-xl border-l-0' : 'rounded-l-xl border-r-0'
            }`}
            title={isLeft ? 'Mostrar navegación del documento' : 'Mostrar actividad del equipo'}
        >
            {isLeft ? (
                <>
                    <FileText size={15} />
                    <span className="[writing-mode:vertical-lr] rotate-180 text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Nav</span>
                </>
            ) : (
                <>
                    <MessageSquare size={15} className={isOnline ? 'animate-pulse' : ''} />
                    <span className="[writing-mode:vertical-lr] text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">Chat</span>
                </>
            )}
        </button>
    );
};
