import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react';

interface ObservationConnectorsProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    observations: {
        general?: string;
        carrera?: string;
        titulo?: string;
        descripcion?: string;
        presupuesto?: string;
    };
    hoveredField?: string | null;
}

interface ConnectorLine {
    key: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const ObservationConnectors: React.FC<ObservationConnectorsProps> = ({
    containerRef,
    observations,
    hoveredField
}) => {
    const [lines, setLines] = useState<ConnectorLine[]>([]);

    const updateLines = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        // Solo dibujar en pantallas grandes donde las columnas están una al lado de la otra
        if (window.innerWidth < 1024) {
            setLines([]);
            return;
        }

        const containerRect = container.getBoundingClientRect();
        const activeKeys = ['general', 'carrera', 'titulo', 'descripcion', 'presupuesto'] as const;
        const computedLines: ConnectorLine[] = [];

        for (const key of activeKeys) {
            if (!observations[key]?.trim()) continue;

            const sourceEl = container.querySelector(`[data-field-anchor="${key}"]`);
            const targetEl = container.querySelector(`[data-comment-anchor="${key}"]`);

            if (sourceEl && targetEl) {
                const sRect = sourceEl.getBoundingClientRect();
                const tRect = targetEl.getBoundingClientRect();

                // Punto de origen: borde derecho del campo observado (alineado al centro del label/insignia)
                const x1 = sRect.right - containerRect.left;
                const y1 = (sRect.top + sRect.height / 2) - containerRect.top;

                // Punto de destino: borde izquierdo del comentario (alineado a la altura del punto de viñeta)
                const x2 = tRect.left - containerRect.left;
                const y2 = (tRect.top + 8) - containerRect.top;

                // Solo trazar si el destino está a la derecha del origen
                if (x2 > x1 + 10) {
                    computedLines.push({ key, x1, y1, x2, y2 });
                }
            }
        }

        setLines(computedLines);
    }, [containerRef, observations]);

    useLayoutEffect(() => {
        updateLines();
    }, [updateLines]);

    useEffect(() => {
        const handleResize = () => updateLines();
        const handleScroll = () => updateLines();

        window.addEventListener('resize', handleResize, { passive: true });
        window.addEventListener('scroll', handleScroll, { passive: true });

        // Observador de cambios de tamaño en el contenedor para recalcular ante apertura/cierre de paneles
        let resizeObserver: ResizeObserver | null = null;
        if (containerRef.current && typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => updateLines());
            resizeObserver.observe(containerRef.current);
        }

        const timer = setTimeout(updateLines, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll);
            if (resizeObserver) resizeObserver.disconnect();
            clearTimeout(timer);
        };
    }, [containerRef, updateLines]);

    if (lines.length === 0) return null;

    return (
        <svg
            className="pointer-events-none absolute inset-0 w-full h-full z-20 hidden lg:block overflow-visible"
            aria-hidden="true"
        >
            {lines.map((line) => {
                const isHovered = hoveredField === line.key;
                const dx = Math.max(25, (line.x2 - line.x1) * 0.45);
                const pathData = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${line.x2 - dx} ${line.y2}, ${line.x2} ${line.y2}`;

                return (
                    <g key={line.key} className="transition-all duration-200">
                        {/* Línea conectora bezier */}
                        <path
                            d={pathData}
                            fill="none"
                            stroke={isHovered ? '#ef4444' : 'rgba(239, 68, 68, 0.35)'}
                            strokeWidth={isHovered ? 1.5 : 1}
                            strokeDasharray={isHovered ? 'none' : '4 3'}
                        />

                        {/* Punto de anclaje inicial (en el campo) */}
                        <circle
                            cx={line.x1}
                            cy={line.y1}
                            r={isHovered ? 3 : 2}
                            fill={isHovered ? '#ef4444' : 'rgba(239, 68, 68, 0.5)'}
                        />

                        {/* Punto de anclaje final (en el comentario) */}
                        <circle
                            cx={line.x2}
                            cy={line.y2}
                            r={isHovered ? 3 : 2}
                            fill={isHovered ? '#ef4444' : 'rgba(239, 68, 68, 0.5)'}
                        />
                    </g>
                );
            })}
        </svg>
    );
};
