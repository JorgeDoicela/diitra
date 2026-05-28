import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import HardBreak from '@tiptap/extension-hard-break';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import CodeBlock from '@tiptap/extension-code-block';
import Collaboration from '@tiptap/extension-collaboration';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';

export interface CoWorkExtensionsConfig {
    ydoc: Y.Doc | null;
    awareness: awarenessProtocol.Awareness | null;
    placeholder?: string;
    field?: string;
}

export function buildCoWorkExtensions(config: CoWorkExtensionsConfig) {
    const extensions: any[] = [
        // Reemplazo de StarterKit por componentes individuales para evitar 
        // la inclusión automática de extensiones de historia conflictivas.
        Document,
        Paragraph,
        Text,
        Bold,
        Italic,
        Strike,
        Code,
        Heading.configure({ levels: [1, 2, 3] }),
        BulletList,
        OrderedList,
        ListItem,
        Blockquote,
        HardBreak,
        HorizontalRule,
        CodeBlock,
        
        Placeholder.configure({
            placeholder: config.placeholder ?? 'Comienza a escribir tu propuesta académica...',
            emptyEditorClass: 'is-editor-empty',
        }),
        Image.configure({
            inline: true,
            allowBase64: false, // Desactivado intencionalmente para forzar la arquitectura Upload-on-Paste (alto rendimiento)
        }),
    ];

    if (config.ydoc) {
        extensions.push(
            Collaboration.configure({ 
                document: config.ydoc,
                field: config.field || 'default'
            })
        );
    }

    return extensions;
}
