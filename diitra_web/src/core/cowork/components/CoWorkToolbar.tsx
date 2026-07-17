import React, { useState, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    Quote,
    Image as ImageIcon,
    Table,
    Undo,
    Redo,
    BookOpen,
    Quote as QuoteIcon,
    ImagePlus
} from 'lucide-react';
import { ApaReferencesPanel } from './ApaReferencesPanel';

interface CoWorkToolbarProps {
    editor: Editor | null;
    readonly?: boolean;
}

// Tipos de cita APA en texto
type CitationType = 'parenthetical' | 'narrative' | 'et_al';

export const CoWorkToolbar: React.FC<CoWorkToolbarProps> = ({ editor, readonly = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showCitationPanel, setShowCitationPanel] = useState(false);
    const [showReferencesPanel, setShowReferencesPanel] = useState(false);
    const [citationType, setCitationType] = useState<CitationType>('parenthetical');
    const [citationAuthor, setCitationAuthor] = useState('');
    const [citationYear, setCitationYear] = useState('');
    const [citationPage, setCitationPage] = useState('');

    if (!editor || readonly) return null;


    const countTables = (): number => {
        let count = 0;
        editor.state.doc.descendants((node: any) => {
            if (node.type.name === 'table') count++;
        });
        return count;
    };

    const countFigures = (): number => {
        // Busca elementos con clase apa-figure en el HTML actual
        const html = editor.getHTML();
        const matches = html.match(/class="apa-figure"/g);
        return matches ? matches.length : 0;
    };

    // ── Inserción de Tabla APA ────────────────────────────────────────────
    const handleInsertApaTable = () => {
        const nextTableNum = countTables() + 1;
        const htmlContent =
            `<p><strong>Tabla ${nextTableNum}</strong></p>` +
            `<p><em>Título de la Tabla</em></p>` +
            '<table class="apa-table"><thead><tr><th>Cabecera 1</th><th>Cabecera 2</th><th>Cabecera 3</th></tr></thead><tbody><tr><td>Dato 1</td><td>Dato 2</td><td>Dato 3</td></tr><tr><td>Dato 4</td><td>Dato 5</td><td>Dato 6</td></tr></tbody></table>' +
            `<p class="no-indent"><em>Nota.</em> Descripción de los datos presentados.</p><p></p>`;
        editor.chain().focus().insertContent(htmlContent).run();
    };

    // ── Inserción de Figura APA ───────────────────────────────────────────
    const handleInsertApaFigure = () => {
        const nextFigureNum = countFigures() + 1;
        const htmlContent =
            `<div class="apa-figure">` +
            `<p class="no-indent apa-figure-label"><strong>Figura ${nextFigureNum}</strong></p>` +
            `<p class="no-indent apa-figure-title"><em>Título descriptivo de la figura en cursiva.</em></p>` +
            `<p class="no-indent"><em>[Insertar imagen aquí usando el botón de imagen de la barra]</em></p>` +
            `<p class="no-indent apa-figure-note"><em>Nota.</em> Descripción de la fuente o información adicional.</p>` +
            `</div><p></p>`;
        editor.chain().focus().insertContent(htmlContent).run();
    };

    // ── Inserción de Cita en Texto ────────────────────────────────────────
    const handleInsertCitation = () => {
        if (!citationAuthor.trim() || !citationYear.trim()) return;
        const author = citationAuthor.trim();
        const year = citationYear.trim();
        const page = citationPage.trim();
        const pageStr = page ? `, p. ${page}` : '';

        let citationText = '';
        if (citationType === 'parenthetical') {
            citationText = `(${author}, ${year}${pageStr})`;
        } else if (citationType === 'narrative') {
            citationText = `${author} (${year}${pageStr})`;
        } else {
            citationText = `(${author} et al., ${year}${pageStr})`;
        }

        editor.chain().focus().insertContent(`<span class="apa-citation">${citationText}</span> `).run();
        setCitationAuthor('');
        setCitationYear('');
        setCitationPage('');
        setShowCitationPanel(false);
    };

    // ── Subida de imagen ─────────────────────────────────────────────────
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Src = event.target?.result as string;
            if (base64Src) editor.chain().focus().setImage({ src: base64Src }).run();
        };
        reader.readAsDataURL(file);
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    const btn = (isActive: boolean) => `
        p-1.5 rounded transition-all duration-200
        ${isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'text-text-dim hover:text-text-main hover:bg-bg-deep'
        }
    `;

    const headingBtn = (level: 1 | 2 | 3 | 4 | 5, label: string, tooltip: string) => (
        <button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            className={`${btn(editor.isActive('heading', { level }))} px-1.5 text-[10px] font-black tracking-tight`}
            title={tooltip}
        >
            {label}
        </button>
    );

    return (
        <div className="relative">
            <div className="px-4 py-2 border-b border-border-thin bg-surface flex items-center justify-between gap-1.5 overflow-x-auto select-none flex-wrap">
                <div className="flex items-center gap-1">

                    {/* Texto */}
                    <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Negrita (Ctrl+B)"><Bold size={13} /></button>
                    <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="Cursiva (Ctrl+I)"><Italic size={13} /></button>
                    <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Tachado"><Strikethrough size={13} /></button>

                    <div className="w-px h-4 bg-border-thin mx-0.5" />

                    {/* Encabezados APA 7 — 5 niveles */}
                    <span className="text-[8px] font-black text-text-dim uppercase tracking-widest px-1">APA:</span>
                    {headingBtn(1, 'N1', 'Nivel 1 APA — Negrita, centrado')}
                    {headingBtn(2, 'N2', 'Nivel 2 APA — Negrita, izquierda')}
                    {headingBtn(3, 'N3', 'Nivel 3 APA — Negrita cursiva, izquierda')}
                    {headingBtn(4, 'N4', 'Nivel 4 APA — Negrita, sangría, inline')}
                    {headingBtn(5, 'N5', 'Nivel 5 APA — Negrita cursiva, sangría, inline')}

                    <div className="w-px h-4 bg-border-thin mx-0.5" />

                    {/* Listas */}
                    <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Lista con viñetas"><List size={13} /></button>
                    <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Lista numerada"><ListOrdered size={13} /></button>

                    <div className="w-px h-4 bg-border-thin mx-0.5" />

                    {/* Cita directa larga (blockquote) */}
                    <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Cita directa larga APA (>40 palabras)"><Quote size={13} /></button>

                    <div className="w-px h-4 bg-border-thin mx-0.5" />

                    {/* Inserción APA */}
                    <button onClick={handleInsertApaTable} className={btn(editor.isActive('table'))} title="Insertar Tabla APA"><Table size={13} /></button>
                    <button onClick={handleInsertApaFigure} className={btn(false)} title="Insertar Figura APA"><ImagePlus size={13} /></button>
                    <button onClick={triggerFileSelect} className={btn(false)} title="Insertar imagen/evidencia"><ImageIcon size={13} /></button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

                    <div className="w-px h-4 bg-border-thin mx-0.5" />

                    {/* Citas y Referencias */}
                    <button
                        onClick={() => { setShowCitationPanel(p => !p); setShowReferencesPanel(false); }}
                        className={btn(showCitationPanel)}
                        title="Insertar cita en texto APA"
                    >
                        <QuoteIcon size={13} />
                    </button>
                    <button
                        onClick={() => { setShowReferencesPanel(p => !p); setShowCitationPanel(false); }}
                        className={`${btn(showReferencesPanel)} flex items-center gap-1`}
                        title="Gestionar lista de referencias APA"
                    >
                        <BookOpen size={13} />
                        <span className="text-[9px] font-bold hidden sm:inline">Refs.</span>
                    </button>

                    {/* Controles de tabla (contextual) */}
                    {editor.isActive('table') && (
                        <div className="flex items-center gap-1 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-950/30 ml-1">
                            <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mr-0.5">Tabla:</span>
                            <button onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1 py-0.5 rounded text-text-dim hover:text-indigo-500 hover:bg-indigo-100/50 text-[8px] font-bold" title="Añadir fila">+Fila</button>
                            <button onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1 py-0.5 rounded text-text-dim hover:text-indigo-500 hover:bg-indigo-100/50 text-[8px] font-bold" title="Añadir columna">+Col</button>
                            <button onClick={() => editor.chain().focus().deleteRow().run()} className="px-1 py-0.5 rounded text-text-dim hover:text-red-500 hover:bg-red-100/50 text-[8px] font-bold" title="Eliminar fila">-Fila</button>
                            <button onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1 py-0.5 rounded text-text-dim hover:text-red-500 hover:bg-red-100/50 text-[8px] font-bold" title="Eliminar columna">-Col</button>
                            <button onClick={() => editor.chain().focus().deleteTable().run()} className="px-1 py-0.5 rounded text-text-dim hover:text-red-600 hover:bg-red-100/50 text-[8px] font-bold" title="Eliminar tabla">Borrar</button>
                        </div>
                    )}
                </div>

                {/* Historial */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { if (typeof editor.commands.undo === 'function') editor.chain().focus().undo().run(); }}
                        disabled={!editor.can().undo()}
                        className="p-1.5 rounded text-text-dim hover:text-text-main disabled:opacity-30 disabled:pointer-events-none hover:bg-bg-deep transition-all duration-200"
                        title="Deshacer"
                    ><Undo size={13} /></button>
                    <button
                        onClick={() => { if (typeof editor.commands.redo === 'function') editor.chain().focus().redo().run(); }}
                        disabled={!editor.can().redo()}
                        className="p-1.5 rounded text-text-dim hover:text-text-main disabled:opacity-30 disabled:pointer-events-none hover:bg-bg-deep transition-all duration-200"
                        title="Rehacer"
                    ><Redo size={13} /></button>
                </div>
            </div>

            {/* ── Panel de Cita en Texto APA ─────────────────────────────── */}
            {showCitationPanel && (
                <div className="absolute top-full left-0 right-0 z-50 bg-surface border-b border-border-thin shadow-lg p-3 flex flex-wrap items-end gap-2 animate-in slide-in-from-top-1 duration-150">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Tipo de cita</span>
                        <div className="flex gap-1">
                            {(['parenthetical', 'narrative', 'et_al'] as CitationType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setCitationType(type)}
                                    className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${citationType === type ? 'bg-indigo-600 text-white' : 'bg-bg-deep text-text-dim hover:text-text-main'}`}
                                >
                                    {type === 'parenthetical' ? '(Autor, Año)' : type === 'narrative' ? 'Autor (Año)' : '(et al., Año)'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Apellido(s)</label>
                        <input
                            type="text"
                            value={citationAuthor}
                            onChange={e => setCitationAuthor(e.target.value)}
                            placeholder="García" maxLength={80}
                            className="px-2 py-1 text-[11px] border border-border-thin rounded bg-bg-deep text-text-main w-32 focus:outline-none focus:border-indigo-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Año</label>
                        <input
                            type="text"
                            value={citationYear}
                            onChange={e => setCitationYear(e.target.value)}
                            placeholder="2023" maxLength={4}
                            className="px-2 py-1 text-[11px] border border-border-thin rounded bg-bg-deep text-text-main w-16 focus:outline-none focus:border-indigo-400"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[8px] font-bold text-text-dim uppercase tracking-widest">Pág. (opt.)</label>
                        <input
                            type="text"
                            value={citationPage}
                            onChange={e => setCitationPage(e.target.value)}
                            placeholder="45" maxLength={6}
                            className="px-2 py-1 text-[11px] border border-border-thin rounded bg-bg-deep text-text-main w-14 focus:outline-none focus:border-indigo-400"
                        />
                    </div>
                    <div className="flex gap-1.5 items-end">
                        <button
                            onClick={handleInsertCitation}
                            disabled={!citationAuthor.trim() || !citationYear.trim()}
                            className="px-3 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            Insertar
                        </button>
                        <button onClick={() => setShowCitationPanel(false)} className="px-2 py-1.5 text-[10px] font-bold text-text-dim hover:text-text-main transition-colors">
                            Cancelar
                        </button>
                    </div>
                    {citationAuthor && citationYear && (
                        <div className="w-full mt-1 px-2 py-1 bg-bg-deep rounded border border-border-thin text-[11px] text-text-dim font-mono">
                            Vista previa:{' '}
                            <span className="text-text-main font-serif">
                                {citationType === 'parenthetical'
                                    ? `(${citationAuthor}, ${citationYear}${citationPage ? `, p. ${citationPage}` : ''})`
                                    : citationType === 'narrative'
                                    ? `${citationAuthor} (${citationYear}${citationPage ? `, p. ${citationPage}` : ''})`
                                    : `(${citationAuthor} et al., ${citationYear}${citationPage ? `, p. ${citationPage}` : ''})`}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Panel de Referencias ───────────────────────────────────── */}
            {showReferencesPanel && (
                <ApaReferencesPanel
                    editor={editor}
                    onClose={() => setShowReferencesPanel(false)}
                />
            )}
        </div>
    );
};

export default CoWorkToolbar;
