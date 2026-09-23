import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { CopyMode } from '../types/promptClipboard.types';

interface PromptContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onSelectMode: (mode: CopyMode) => void;
    hasInstructions?: boolean;
    hasContent?: boolean;
    role?: 'author' | 'reviewer';
}

export const PromptContextMenu: React.FC<PromptContextMenuProps> = ({
    x,
    y,
    onClose,
    onSelectMode,
    hasInstructions = true,
    hasContent = true,
    role = 'author'
}) => {
    const isReviewer = role === 'reviewer';
    const menuRef = useRef<HTMLDivElement>(null);

    // Posición ajustada: empieza en las coordenadas del click y se corrige tras el primer paint
    // para que el menú nunca se salga de los límites de la ventana
    const [adjustedPos, setAdjustedPos] = useState({ left: x, top: y });

    useLayoutEffect(() => {
        if (!menuRef.current) return;
        const { width, height } = menuRef.current.getBoundingClientRect();
        setAdjustedPos({
            left: Math.max(8, Math.min(x, window.innerWidth - width - 8)),
            top:  Math.max(8, Math.min(y, window.innerHeight - height - 8)),
        });
    }, [x, y]);

    // Cerrar al dar click fuera o presionar Escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('mousedown', handleClickOutside, true);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousedown', handleClickOutside, true);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const adjustedStyle: React.CSSProperties = {
        position: 'fixed',
        left: adjustedPos.left,
        top: adjustedPos.top,
        zIndex: 999999
    };

    const content = (
        <div
            ref={menuRef}
            style={adjustedStyle}
            onContextMenu={(e) => e.preventDefault()}
            className="w-64 bg-surface border border-border-thin rounded-xl shadow-2xl p-1.5 animate-fade-in text-xs select-none backdrop-blur-md"
        >
            <div className="px-2.5 py-1.5 text-[9.5px] font-mono font-bold text-text-dim uppercase tracking-wider border-b border-border-thin/50 mb-1">
                {isReviewer ? 'Auditoría y Revisión IA' : 'Asistente de Portapapeles'}
            </div>

            {/* Opción 1: Estructurado Completo / Auditoría */}
            <button
                type="button"
                onClick={() => { onSelectMode('structured'); onClose(); }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors flex flex-col gap-0.5 group"
            >
                <span className="font-semibold text-text-main group-hover:text-brand transition-colors">
                    {isReviewer ? 'Copiar para Auditar Sección con IA' : 'Copiar con Criterios Técnicos'}
                </span>
                <span className="text-[10px] text-text-dim leading-tight">
                    {isReviewer ? 'Criterios normativos + contenido para evaluación IA' : 'Instrucciones normativas + borrador actual'}
                </span>
            </button>

            {/* Opción 2: Solo contenido */}
            {hasContent && (
                <button
                    type="button"
                    onClick={() => { onSelectMode('clean_content'); onClose(); }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors flex flex-col gap-0.5 group"
                >
                    <span className="font-medium text-text-main group-hover:text-brand transition-colors">
                        {isReviewer ? 'Copiar Solo Contenido' : 'Copiar Solo Redacción'}
                    </span>
                    <span className="text-[10px] text-text-dim leading-tight">
                        {isReviewer ? 'Texto plano limpio para cotejo externo' : 'Texto plano limpio de etiquetas'}
                    </span>
                </button>
            )}

            {/* Opción 3: Solo instrucciones / criterios normativos */}
            {hasInstructions && (
                <button
                    type="button"
                    onClick={() => { onSelectMode('instructions'); onClose(); }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-surface-hover transition-colors flex flex-col gap-0.5 group"
                >
                    <span className="font-medium text-text-main group-hover:text-brand transition-colors">
                        {isReviewer ? 'Copiar Criterios y Normativa' : 'Copiar Solo Instrucciones'}
                    </span>
                    <span className="text-[10px] text-text-dim leading-tight">
                        {isReviewer ? 'Guía institucional y requisitos CACES' : 'Guía y requisitos de acreditación'}
                    </span>
                </button>
            )}

            {/* Opciones Globales */}
            <div className="border-t border-border-thin/50 my-1 pt-1 space-y-0.5">
                <button
                    type="button"
                    onClick={() => { onSelectMode('project_summary'); onClose(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-colors flex items-center justify-between text-[11px] text-text-dim hover:text-text-main"
                >
                    <span>Resumen General del Proyecto</span>
                    <span className="text-[9px] font-mono text-text-dim">Meta</span>
                </button>
                <button
                    type="button"
                    onClick={() => { onSelectMode('full_document'); onClose(); }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-surface-hover transition-colors flex items-center justify-between text-[11px] text-text-dim hover:text-text-main"
                >
                    <span>{isReviewer ? 'Copiar Protocolo Completo (Dictamen)' : 'Copiar Documento Completo'}</span>
                    <span className="text-[9px] font-mono text-text-dim">{isReviewer ? 'Dictamen' : 'Todo'}</span>
                </button>
            </div>
        </div>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(content, document.body);
};
