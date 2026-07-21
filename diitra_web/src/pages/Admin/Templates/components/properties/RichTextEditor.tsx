import React, { useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Placeholder } from '@tiptap/extension-placeholder';
import {
    Bold, Italic, Underline as UnderlineIcon,
    List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Table as TableIcon, Trash2, Plus
} from 'lucide-react';
import type { DocumentBlock } from '../types';

interface Props {
    block: DocumentBlock;
    fieldKey: 'html';
    placeholder?: string;
    onUpdateConfig: (blockId: string, key: string, value: any) => void;
}

const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
}> = ({ onClick, active, title, children }) => (
    <button
        type="button"
        title={title}
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        className={`p-1.5 rounded transition-all text-xs ${
            active
                ? 'bg-text-main text-bg-deep'
                : 'text-text-dim hover:bg-surface-hover hover:text-text-main'
        }`}
    >
        {children}
    </button>
);

export const RichTextEditor: React.FC<Props> = ({ block, fieldKey, placeholder, onUpdateConfig }) => {
    const extensions = React.useMemo(() => [
        StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        Placeholder.configure({ placeholder: placeholder ?? 'Escribe el contenido aquí. Usa las herramientas para dar formato.' }),
    ], [placeholder]);

    const editor = useEditor({
        extensions,
        content: block.config[fieldKey] || '',
        onUpdate({ editor }) {
            onUpdateConfig(block.id, fieldKey, editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'tiptap-editor prose prose-sm max-w-none focus:outline-none min-h-[140px] text-text-main text-xs leading-relaxed',
            },
        },
    });

    // Sincronizar si el bloque activo cambia externamente
    useEffect(() => {
        if (!editor) return;
        const incoming = block.config[fieldKey] || '';
        if (editor.getHTML() !== incoming) {
            editor.commands.setContent(incoming, false);
        }
    }, [block.id]);

    const insertVariable = useCallback((varToken: string) => {
        editor?.chain().focus().insertContent(varToken).run();
    }, [editor]);

    const VARIABLES = [
        { token: '{{titulo}}', label: 'Título del Proyecto' },
        { token: '{{carrera}}', label: 'Carrera' },
        { token: '{{director_proyecto}}', label: 'Director' },
        { token: '{{periodo}}', label: 'Período Académico' },
        { token: '{{fecha_inicio}}', label: 'Fecha Inicio' },
        { token: '{{fecha_fin}}', label: 'Fecha Fin' },
        { token: '{{programa}}', label: 'Programa' },
        { token: '{{linea_investigacion}}', label: 'Línea de Investigación' },
    ];

    if (!editor) return null;

    return (
        <div className="space-y-2">
            {/* Toolbar principal */}
            <div className="flex flex-wrap gap-0.5 p-1 bg-surface border border-border-thin rounded-md">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita">
                    <Bold className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva">
                    <Italic className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado">
                    <UnderlineIcon className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border-thin/30 mx-1 self-center" />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista viñeta">
                    <List className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">
                    <ListOrdered className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border-thin/30 mx-1 self-center" />

                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Alinear izquierda">
                    <AlignLeft className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar">
                    <AlignCenter className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Alinear derecha">
                    <AlignRight className="w-3.5 h-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justificar">
                    <AlignJustify className="w-3.5 h-3.5" />
                </ToolbarButton>

                <div className="w-px h-5 bg-border-thin/30 mx-1 self-center" />

                {/* Tabla interna */}
                <ToolbarButton
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insertar tabla"
                >
                    <TableIcon className="w-3.5 h-3.5" />
                </ToolbarButton>
                {editor.isActive('table') && (
                    <>
                        <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Añadir columna">
                            <Plus className="w-3 h-3" />
                            <span className="text-[8px] ml-0.5">Col</span>
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Añadir fila">
                            <Plus className="w-3 h-3" />
                            <span className="text-[8px] ml-0.5">Fila</span>
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Eliminar tabla">
                            <Trash2 className="w-3 h-3" />
                        </ToolbarButton>
                    </>
                )}
            </div>

            {/* Área de edición */}
            <div className="border border-border-thin rounded-md bg-surface p-2 min-h-[140px] cursor-text rich-text-editor-area">
                <EditorContent editor={editor} />
            </div>

            {/* Variables dinámicas */}
            <div>
                <p className="text-[9px] font-black text-text-dim uppercase tracking-wider mb-1.5">
                    Insertar Variable Dinámica
                </p>
                <div className="flex flex-wrap gap-1">
                    {VARIABLES.map(v => (
                        <button
                            key={v.token}
                            type="button"
                            onClick={() => insertVariable(v.token)}
                            title={v.label}
                            className="px-1.5 py-0.5 rounded-md bg-surface-hover hover:bg-surface border border-border-thin text-text-main text-[9px] font-mono transition-all cursor-pointer"
                        >
                            {v.token}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
