// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Tiptap Extensions Bundle
//
// Configura las extensiones de Tiptap necesarias para la colaboración.
// Se separa en su propio archivo para que sea fácil agregar nuevas
// extensiones (tablas, imágenes, comentarios) sin tocar el editor.
// ═══════════════════════════════════════════════════════════════════

import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import Placeholder from '@tiptap/extension-placeholder';
import type * as Y from 'yjs';
import type * as awarenessProtocol from 'y-protocols/awareness';

export interface CoWorkExtensionsConfig {
    ydoc: Y.Doc;
    awareness: awarenessProtocol.Awareness;
    placeholder?: string;
}

/**
 * Construye el array de extensiones Tiptap listas para la colaboración.
 * 
 * Incluye:
 *   - StarterKit: negrita, cursiva, listas, encabezados, párrafos
 *   - Collaboration: sincroniza el contenido del editor vía Yjs
 *   - CollaborationCursor: muestra cursores de otros usuarios en tiempo real
 *   - Placeholder: texto de guía cuando el editor está vacío
 */
export function buildCoWorkExtensions(config: CoWorkExtensionsConfig) {
    return [
        StarterKit.configure({
            // Desactivar el historial nativo de Tiptap:
            // Yjs maneja su propio undo/redo distribuido y colaborativo.
            history: false,
        }),

        Collaboration.configure({
            document: config.ydoc,
        }),

        CollaborationCursor.configure({
            provider: {
                awareness: config.awareness,
            },
        }),

        Placeholder.configure({
            placeholder: config.placeholder ?? 'Comienza a escribir tu propuesta académica...',
            emptyEditorClass: 'is-editor-empty',
        }),
    ];
}
