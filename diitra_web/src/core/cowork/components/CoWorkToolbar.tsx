import React, { useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { 
    Bold, 
    Italic, 
    Strikethrough, 
    Heading1, 
    Heading2, 
    Heading3, 
    List, 
    ListOrdered, 
    Quote, 
    Code, 
    Image as ImageIcon, 
    Undo, 
    Redo,
    HelpCircle
} from 'lucide-react';

interface CoWorkToolbarProps {
    editor: Editor | null;
    readonly?: boolean;
}

export const CoWorkToolbar: React.FC<CoWorkToolbarProps> = ({ editor, readonly = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!editor || readonly) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Src = event.target?.result as string;
            if (base64Src) {
                editor.chain().focus().setImage({ src: base64Src }).run();
            }
        };
        reader.readAsDataURL(file);
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const buttonClass = (isActive: boolean) => `
        p-1.5 rounded transition-all duration-200 
        ${isActive 
            ? 'bg-indigo-600 text-white shadow-sm' 
            : 'text-text-dim hover:text-text-main hover:bg-bg-deep'
        }
    `;

    return (
        <div className="px-5 py-2.5 border-b border-border-thin bg-surface flex items-center justify-between gap-2 overflow-x-auto select-none">
            <div className="flex items-center gap-1.5">
                {/* Texto básico */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={buttonClass(editor.isActive('bold'))}
                    title="Negrita (Ctrl+B)"
                >
                    <Bold size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={buttonClass(editor.isActive('italic'))}
                    title="Cursiva (Ctrl+I)"
                >
                    <Italic size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={buttonClass(editor.isActive('strike'))}
                    title="Tachado"
                >
                    <Strikethrough size={14} />
                </button>

                <div className="w-px h-5 bg-border-thin mx-1" />

                {/* Encabezados */}
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 1 }))}
                    title="Título Grande"
                >
                    <Heading1 size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 2 }))}
                    title="Título Mediano"
                >
                    <Heading2 size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={buttonClass(editor.isActive('heading', { level: 3 }))}
                    title="Título Pequeño"
                >
                    <Heading3 size={14} />
                </button>

                <div className="w-px h-5 bg-border-thin mx-1" />

                {/* Listas */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={buttonClass(editor.isActive('bulletList'))}
                    title="Lista con Viñetas"
                >
                    <List size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={buttonClass(editor.isActive('orderedList'))}
                    title="Lista Numerada"
                >
                    <ListOrdered size={14} />
                </button>

                <div className="w-px h-5 bg-border-thin mx-1" />

                {/* Formatos Especiales */}
                <button
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={buttonClass(editor.isActive('blockquote'))}
                    title="Cita"
                >
                    <Quote size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={buttonClass(editor.isActive('codeBlock'))}
                    title="Bloque de Código"
                >
                    <Code size={14} />
                </button>

                <div className="w-px h-5 bg-border-thin mx-1" />

                {/* Evidencias (Imágenes CACES) */}
                <button
                    onClick={triggerFileSelect}
                    className={buttonClass(false)}
                    title="Insertar Evidencia (Foto/Imagen)"
                >
                    <ImageIcon size={14} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />
            </div>

            {/* Historial y Ayuda */}
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-1.5 rounded text-text-dim hover:text-text-main disabled:opacity-30 disabled:pointer-events-none hover:bg-bg-deep transition-all duration-200"
                    title="Deshacer"
                >
                    <Undo size={14} />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-1.5 rounded text-text-dim hover:text-text-main disabled:opacity-30 disabled:pointer-events-none hover:bg-bg-deep transition-all duration-200"
                    title="Rehacer"
                >
                    <Redo size={14} />
                </button>
                <div className="w-px h-5 bg-border-thin mx-0.5" />
                <div className="flex items-center gap-1 text-[10px] text-text-dim select-none" title="Los cambios se sincronizan y guardan automáticamente">
                    <HelpCircle size={12} />
                    <span className="hidden sm:inline font-medium uppercase tracking-wider">Guardado Auto</span>
                </div>
            </div>
        </div>
    );
};

export default CoWorkToolbar;
