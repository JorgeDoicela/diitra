import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { X, Plus, BookOpen } from 'lucide-react';

interface ApaReferencesPanelProps {
    editor: Editor;
    onClose: () => void;
}

type RefType = 'articulo' | 'libro' | 'capitulo' | 'web' | 'tesis';

interface RefFields {
    autores: string;
    anio: string;
    titulo: string;
    revista?: string;
    volumen?: string;
    numero?: string;
    paginas?: string;
    doi?: string;
    editorial?: string;
    ciudad?: string;
    editores?: string;
    tituloLibro?: string;
    url?: string;
    fechaAcceso?: string;
    institucion?: string;
    tipoTesis?: string;
}

const REF_TYPES: { id: RefType; label: string }[] = [
    { id: 'articulo', label: 'Artículo de revista' },
    { id: 'libro', label: 'Libro' },
    { id: 'capitulo', label: 'Capítulo de libro' },
    { id: 'web', label: 'Sitio web / Página' },
    { id: 'tesis', label: 'Tesis / Disertación' },
];

const buildReference = (type: RefType, f: RefFields): string => {
    const autores = f.autores?.trim() || 'Autor, A.';
    const anio = f.anio?.trim() || 's.f.';
    const titulo = f.titulo?.trim() || 'Título';

    switch (type) {
        case 'articulo': {
            const revista = f.revista?.trim() || 'Nombre de la Revista';
            const vol = f.volumen?.trim();
            const num = f.numero?.trim();
            const pags = f.paginas?.trim();
            const doi = f.doi?.trim();
            const volStr = vol ? `<em>${revista}</em>, <em>${vol}</em>` : `<em>${revista}</em>`;
            const numStr = num ? `(${num})` : '';
            const pagsStr = pags ? `, ${pags}` : '';
            const doiStr = doi ? ` https://doi.org/${doi}` : '';
            return `${autores} (${anio}). ${titulo}. ${volStr}${numStr}${pagsStr}.${doiStr}`;
        }
        case 'libro': {
            const editorial = f.editorial?.trim() || 'Editorial';
            return `${autores} (${anio}). <em>${titulo}</em>. ${editorial}.`;
        }
        case 'capitulo': {
            const editores = f.editores?.trim() || 'Editor, E.';
            const tituloLibro = f.tituloLibro?.trim() || 'Título del libro';
            const pags = f.paginas?.trim();
            const pagsStr = pags ? `pp. ${pags}` : '';
            const editorial = f.editorial?.trim() || 'Editorial';
            return `${autores} (${anio}). ${titulo}. En ${editores} (Ed.), <em>${tituloLibro}</em>${pagsStr ? ` (${pagsStr})` : ''}. ${editorial}.`;
        }
        case 'web': {
            const url = f.url?.trim() || 'https://ejemplo.com';
            const fecha = f.fechaAcceso?.trim();
            const fechaStr = fecha ? ` Recuperado el ${fecha}, de` : '';
            return `${autores} (${anio}). <em>${titulo}</em>.${fechaStr} ${url}`;
        }
        case 'tesis': {
            const inst = f.institucion?.trim() || 'Institución';
            const tipo = f.tipoTesis?.trim() || 'Tesis de maestría';
            return `${autores} (${anio}). <em>${titulo}</em> [${tipo}]. ${inst}.`;
        }
    }
};

export const ApaReferencesPanel: React.FC<ApaReferencesPanelProps> = ({ editor, onClose }) => {
    const [refType, setRefType] = useState<RefType>('articulo');
    const [fields, setFields] = useState<RefFields>({
        autores: '',
        anio: '',
        titulo: '',
        revista: '',
        volumen: '',
        numero: '',
        paginas: '',
        doi: '',
        editorial: '',
        editores: '',
        tituloLibro: '',
        url: '',
        fechaAcceso: '',
        institucion: '',
        tipoTesis: 'Tesis de maestría',
    });

    const set = (key: keyof RefFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFields(f => ({ ...f, [key]: e.target.value }));

    const preview = buildReference(refType, fields);

    const handleInsert = () => {
        const refHtml =
            `<div class="apa-references-section">` +
            `<p class="no-indent apa-references-title"><strong>Referencias</strong></p>` +
            `<p class="no-indent apa-reference-entry">${preview}</p>` +
            `</div><p></p>`;

        // Si ya existe una sección de referencias, añadir solo la entrada
        const html = editor.getHTML();
        if (html.includes('apa-references-section')) {
            const singleEntry = `<p class="no-indent apa-reference-entry">${preview}</p>`;
            editor.chain().focus().insertContentAt(editor.state.doc.content.size - 1, singleEntry).run();
        } else {
            editor.chain().focus().insertContent(refHtml).run();
        }
        onClose();
    };

    const inputCls = "w-full px-2 py-1.5 text-[11px] border border-border-thin rounded bg-bg-deep text-text-main focus:outline-none focus:border-indigo-400 transition-colors";
    const labelCls = "text-[9px] font-bold text-text-dim uppercase tracking-widest block mb-0.5";

    const Field = ({ label, fieldKey, placeholder }: { label: string; fieldKey: keyof RefFields; placeholder?: string }) => (
        <div className="flex flex-col">
            <label className={labelCls}>{label}</label>
            <input type="text" value={fields[fieldKey] || ''} onChange={set(fieldKey)} placeholder={placeholder} className={inputCls} />
        </div>
    );

    return (
        <div className="absolute top-full left-0 right-0 z-50 bg-surface border-b border-border-thin shadow-xl animate-in slide-in-from-top-1 duration-150" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-indigo-500" />
                        <span className="text-[11px] font-bold text-text-main">Referencias APA 7</span>
                    </div>
                    <button onClick={onClose} className="p-1 rounded text-text-dim hover:text-text-main hover:bg-bg-deep transition-colors"><X size={14} /></button>
                </div>

                {/* Tipo de referencia */}
                <div className="mb-3">
                    <label className={labelCls}>Tipo de referencia</label>
                    <div className="flex gap-1 flex-wrap">
                        {REF_TYPES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setRefType(t.id)}
                                className={`px-2 py-1 rounded text-[9px] font-bold transition-all ${refType === t.id ? 'bg-indigo-600 text-white' : 'bg-bg-deep text-text-dim hover:text-text-main border border-border-thin'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Campos comunes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    <div className="sm:col-span-2">
                        <Field label="Autores (Apellido, A. A.; Apellido, B. B.)" fieldKey="autores" placeholder="García, J. M.; López, A. P." />
                    </div>
                    <Field label="Año" fieldKey="anio" placeholder="2023" />
                    <div className="sm:col-span-1">
                        <Field label="Título del trabajo" fieldKey="titulo" placeholder="Título del artículo, libro o capítulo" />
                    </div>
                </div>

                {/* Campos específicos por tipo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                    {refType === 'articulo' && (<>
                        <div className="sm:col-span-2"><Field label="Nombre de la revista (en cursiva en la preview)" fieldKey="revista" placeholder="Revista de Investigación" /></div>
                        <Field label="Volumen" fieldKey="volumen" placeholder="12" />
                        <Field label="Número" fieldKey="numero" placeholder="3" />
                        <Field label="Páginas" fieldKey="paginas" placeholder="45-67" />
                        <Field label="DOI (sin https://doi.org/)" fieldKey="doi" placeholder="10.1234/abcde" />
                    </>)}
                    {refType === 'libro' && (<>
                        <div className="sm:col-span-2"><Field label="Editorial" fieldKey="editorial" placeholder="McGraw-Hill" /></div>
                    </>)}
                    {refType === 'capitulo' && (<>
                        <Field label="Editor(es) del libro" fieldKey="editores" placeholder="Rodríguez, C. D." />
                        <div className="sm:col-span-2"><Field label="Título del libro" fieldKey="tituloLibro" placeholder="Título del libro compilado" /></div>
                        <Field label="Páginas del capítulo" fieldKey="paginas" placeholder="45-67" />
                        <Field label="Editorial" fieldKey="editorial" placeholder="Springer" />
                    </>)}
                    {refType === 'web' && (<>
                        <div className="sm:col-span-2"><Field label="URL completa" fieldKey="url" placeholder="https://ejemplo.com/pagina" /></div>
                        <Field label="Fecha de acceso (opt.)" fieldKey="fechaAcceso" placeholder="17 de julio de 2025" />
                    </>)}
                    {refType === 'tesis' && (<>
                        <div className="sm:col-span-2"><Field label="Institución" fieldKey="institucion" placeholder="Universidad Nacional" /></div>
                        <div className="sm:col-span-2 flex flex-col">
                            <label className={labelCls}>Tipo de tesis</label>
                            <select value={fields.tipoTesis} onChange={set('tipoTesis')} className={inputCls}>
                                <option>Tesis de maestría</option>
                                <option>Tesis doctoral</option>
                                <option>Trabajo de fin de grado</option>
                                <option>Disertación doctoral</option>
                            </select>
                        </div>
                    </>)}
                </div>

                {/* Vista previa */}
                <div className="mb-3 p-3 bg-bg-deep rounded border border-border-thin">
                    <label className={`${labelCls} mb-1`}>Vista previa APA 7</label>
                    <p
                        className="text-[11px] text-text-main"
                        style={{ fontFamily: 'Times New Roman, Times, serif', lineHeight: '2', paddingLeft: '1.27cm', textIndent: '-1.27cm' }}
                        dangerouslySetInnerHTML={{ __html: preview }}
                    />
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                    <button
                        onClick={handleInsert}
                        disabled={!fields.autores.trim() || !fields.anio.trim() || !fields.titulo.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                    >
                        <Plus size={12} /> Insertar en documento
                    </button>
                    <button onClick={onClose} className="px-3 py-1.5 text-[10px] font-bold text-text-dim hover:text-text-main transition-colors">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApaReferencesPanel;
