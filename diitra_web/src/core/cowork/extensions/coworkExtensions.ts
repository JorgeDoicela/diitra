// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Tiptap Extensions Bundle
//
// Configura las extensiones de Tiptap necesarias para la colaboración.
// Se separa en su propio archivo para que sea fácil agregar nuevas
// extensiones (tablas, imágenes, comentarios) sin tocar el editor.
// ═══════════════════════════════════════════════════════════════════

import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import { Extension } from '@tiptap/core';
import { yCursorPlugin } from 'y-prosemirror';
import type * as Y from 'yjs';
import type * as awarenessProtocol from 'y-protocols/awareness';

/**
 * Custom Collaboration Cursor Extension
 * 
 * Bypasses the standard Tiptap extension which has issues with v2/v3 mismatches
 * and provider detection. Directly uses the ProseMirror yCursorPlugin.
 */
const CustomCollaborationCursor = Extension.create({
    name: 'collaborationCursor',

    addOptions() {
        return {
            awareness: null as awarenessProtocol.Awareness | null,
            render: undefined,
            selectionRender: undefined,
        }
    },

    addProseMirrorPlugins() {
        console.log('[DIITRA CoWork] CustomCollaborationCursor - options.awareness:', this.options.awareness);
        if (this.options.awareness) {
            console.log('[DIITRA CoWork] awareness.doc:', (this.options.awareness as any).doc);
            console.log('[DIITRA CoWork] awareness instanceof Awareness:', this.options.awareness instanceof awarenessProtocol.Awareness);
        }

        if (!this.options.awareness || !(this.options.awareness as any).doc) {
            console.warn('[DIITRA CoWork] CollaborationCursor initialized without awareness or missing doc');
            return [];
        }

        return [
            yCursorPlugin(this.options.awareness, {
                cursorBuilder: this.options.render,
                cursorStateField: 'user',
                getSelection: this.options.selectionRender,
            }),
        ];
    },
});

export interface CoWorkExtensionsConfig {
    ydoc: Y.Doc;
    awareness: awarenessProtocol.Awareness;
    placeholder?: string;
}

/**
 * Construye el array de extensiones Tiptap listas para la colaboración.
 */
export function buildCoWorkExtensions(config: CoWorkExtensionsConfig) {
    return [
        StarterKit.configure({
            history: false,
        }),

        Collaboration.configure({
            document: config.ydoc,
        }),

        CustomCollaborationCursor.configure({
            awareness: config.awareness,
        }),
        
        Placeholder.configure({
            placeholder: config.placeholder ?? 'Comienza a escribir tu propuesta académica...',
            emptyEditorClass: 'is-editor-empty',
        }),
    ];
}
