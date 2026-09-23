import React, { useState, useRef, useContext, useCallback, useMemo } from 'react';
import type { CopyMode, PromptClipboardContextData } from '../types/promptClipboard.types';
import { usePromptClipboard } from '../hooks/usePromptClipboard';
import { PromptContextMenu } from '../components/PromptContextMenu';
import { DocumentDataContext } from '../../documents/context/DocumentDataContext';

interface BlockClipboardWrapperProps {
    title?: string;
    fieldKey?: string;
    instructions?: string;
    requirementText?: string;
    currentContent?: string | unknown;
    /** Serializador explícito para arrays/objetos complejos. Tiene precedencia sobre la detección automática. */
    contentSerializer?: (data: unknown) => string;
    role?: 'author' | 'reviewer';
    children: React.ReactNode;
    className?: string;
}

export const BlockClipboardWrapper: React.FC<BlockClipboardWrapperProps> = ({
    title,
    fieldKey,
    instructions,
    requirementText,
    currentContent,
    contentSerializer,
    role = 'author',
    children,
    className = ''
}) => {
    const globalFormData = useContext(DocumentDataContext);
    const { copyToClipboard, copiedMessage } = usePromptClipboard();

    const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
    const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Contenido efectivo — fuente única de verdad para hasActualContent y handleSelectMode
    const effectiveContent = useMemo(
        () => currentContent ?? (fieldKey && globalFormData ? globalFormData[fieldKey] : ''),
        [currentContent, fieldKey, globalFormData]
    );

    // Verifica si hay contenido real para habilitar la opción "Copiar Solo Redacción"
    const hasActualContent = useMemo(() => Boolean(
        Array.isArray(effectiveContent)
            ? effectiveContent.length > 0
            : typeof effectiveContent === 'string'
                ? effectiveContent.trim().length > 0
                : Boolean(effectiveContent)
    ), [effectiveContent]);

    // 1. Manejador de Clic Derecho (Desktop)
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuPos({ x: e.clientX, y: e.clientY });
    }, []);

    // 2. Manejador de Long-Press (Móvil / Tablet)
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();
        const touch = e.touches[0];
        touchTimerRef.current = setTimeout(() => {
            setContextMenuPos({ x: touch.clientX, y: touch.clientY });
        }, 550); // 550ms para activación por pulsación larga
    }, []);

    const handleTouchEnd = useCallback(() => {
        if (touchTimerRef.current) {
            clearTimeout(touchTimerRef.current);
            touchTimerRef.current = null;
        }
    }, []);

    // 3. Ejecución del modo seleccionado
    const handleSelectMode = useCallback((mode: CopyMode) => {
        const contextData: PromptClipboardContextData = {
            sectionTitle: title,
            fieldKey,
            instructions,
            requirementText,
            currentContent: effectiveContent,
            contentSerializer,
            role,
        };

        copyToClipboard(mode, contextData, globalFormData);
    }, [title, fieldKey, instructions, requirementText, effectiveContent, contentSerializer, role, globalFormData, copyToClipboard]);

    return (
        <div
            onContextMenu={handleContextMenu}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchEnd}
            className={`relative ${className}`}
        >
            {children}

            {/* Menú Contextual Flotante */}
            {contextMenuPos && (
                <PromptContextMenu
                    x={contextMenuPos.x}
                    y={contextMenuPos.y}
                    onClose={() => setContextMenuPos(null)}
                    onSelectMode={handleSelectMode}
                    hasInstructions={Boolean(instructions || requirementText)}
                    hasContent={hasActualContent}
                    role={role}
                />
            )}

            {/* Toast de confirmación sobrio Vercel Geist */}
            {copiedMessage && (
                <div className="fixed bottom-6 right-6 z-[99999] px-4 py-2 bg-text-main text-bg-deep text-xs font-mono font-medium rounded-lg shadow-xl animate-fade-in border border-border-thin flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{copiedMessage}</span>
                </div>
            )}
        </div>
    );
};
