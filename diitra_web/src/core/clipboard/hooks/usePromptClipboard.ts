import { useState, useCallback } from 'react';
import type { CopyMode, PromptClipboardContextData } from '../types/promptClipboard.types';
import { buildClipboardPayload } from '../utils/promptClipboardEngine';

export const usePromptClipboard = () => {
    const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

    const copyToClipboard = useCallback(async (
        mode: CopyMode,
        contextData: PromptClipboardContextData,
        globalFormData?: Record<string, unknown>
    ): Promise<boolean> => {
        try {
            const textToCopy = buildClipboardPayload(mode, contextData, globalFormData);
            
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                // Fallback para entornos antiguos o sin HTTPS
                const textArea = document.createElement('textarea');
                textArea.value = textToCopy;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }

            const isReviewer = contextData.role === 'reviewer';
            const label = 
                mode === 'structured'     ? (isReviewer ? 'Copiado para auditoría técnica con IA' : 'Copiado con criterios institucionales') :
                mode === 'clean_content'  ? 'Contenido copiado' :
                mode === 'instructions'   ? (isReviewer ? 'Criterios normativos copiados' : 'Instrucciones copiadas') :
                mode === 'full_document'  ? (isReviewer ? 'Protocolo completo copiado para dictamen' : 'Documento completo copiado') :
                                           'Resumen del proyecto copiado';

            setCopiedMessage(label);
            setTimeout(() => setCopiedMessage(null), 2500);
            return true;
        } catch (err) {
            console.error('[PromptClipboard] Error al copiar al portapapeles:', err);
            return false;
        }
    }, []);

    return {
        copyToClipboard,
        copiedMessage
    };
};
