// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Editor Component (v2.0 — correct origin detection)
// ═══════════════════════════════════════════════════════════════════

import React, { useContext } from 'react';
import * as Y from 'yjs';
import { useEditor, EditorContent } from '@tiptap/react';
import api from '../../../api/axios_config';
import { buildCoWorkExtensions } from '../extensions/coworkExtensions';
import type { CoWorkHandle } from '../types';
import { RemoteCursors } from './RemoteCursors';
import { CoWorkToolbar } from './CoWorkToolbar';
import { DocumentDataContext, DocumentMetadataContext, SectionGuardContext, SectionLockContext } from '../../documents/context/DocumentDataContext';
import { coworkLog } from '../utils/log';
import {
    Loader2,
    EyeOff,
    Lock
} from 'lucide-react';

interface CoWorkEditorProps {
    cowork: CoWorkHandle;
    field?: string;
    onChange?: (html: string, meta?: { source?: 'local' | 'remote' }) => void;
    placeholder?: string;
    readonly?: boolean;
    className?: string;
}

interface InnerCoWorkEditorProps extends CoWorkEditorProps {
    useCollaboration: boolean;
    dbValue: string | undefined;
}

export const CoWorkEditor: React.FC<CoWorkEditorProps> = (props) => {
    const parentFormData = useContext(DocumentDataContext);
    const guardContext = useContext(SectionGuardContext);
    const field = props.field || 'default';
    const dbValue = parentFormData ? parentFormData[field] : undefined;

    const isLoaded = props.cowork.session.lastSyncedAt !== null || props.cowork.session.error !== null;
    if (!props.cowork.ydoc || !props.cowork.awareness || !isLoaded) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-bg-deep rounded-lg border border-border-thin">
                <Loader2 className="animate-spin text-text-main mb-4" size={24} />
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Inicializando editor colaborativo...</span>
            </div>
        );
    }

    const isReadOnlyMode = props.readonly || guardContext.readOnly || props.cowork.session.readOnly;
    
    // Evitar conflicto de constructor en Yjs si la clave ya fue registrada con un tipo diferente (ej. Y.Text)
    const ydoc = props.cowork.ydoc;
    const sharedType = ydoc.share.get(field);
    if (sharedType && !(sharedType instanceof Y.XmlFragment)) {
        console.warn(`[CoWorkEditor] Conflicto de constructor detectado para '${field}'. Tipo actual: ${sharedType.constructor.name}. Recreando como Y.XmlFragment.`);
        ydoc.share.delete(field);
    }
    
    const xmlFragment = ydoc.getXmlFragment(field);
    const hasYjsContent = xmlFragment.length > 0;
    const useCollaboration = !isReadOnlyMode || hasYjsContent;
    const editorKey = `${field}_collab_${useCollaboration}`;

    return (
        <InnerCoWorkEditor
            key={editorKey}
            useCollaboration={useCollaboration}
            dbValue={dbValue}
            {...props}
            readonly={isReadOnlyMode}
        />
    );
};

const extractImageUrls = (html: string): string[] => {
    const urls: string[] = [];
    const regex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        urls.push(match[1]);
    }
    return urls;
};

const InnerCoWorkEditor: React.FC<InnerCoWorkEditorProps> = ({
    cowork,
    field = 'default',
    onChange,
    placeholder,
    readonly = false,
    className = '',
    useCollaboration,
    dbValue,
}) => {
    const ydoc = cowork.ydoc!;
    const awareness = cowork.awareness!;
    const { readOnlyReason } = useContext(DocumentMetadataContext);
    const lockContext = useContext(SectionLockContext);
    const isGlobalReadOnly = lockContext?.readOnly === true;

    const onChangeRef = React.useRef(onChange);
    const coworkRef = React.useRef(cowork);
    const fieldRef = React.useRef(field);
    const knownImagesRef = React.useRef<string[]>([]);
    const lastTrWasRemoteRef = React.useRef(false);
    const lastSelectionSendRef = React.useRef<number>(0);
    const selectionTimeoutRef = React.useRef<any>(null);
    const seededRef = React.useRef(false);

    React.useEffect(() => {
        onChangeRef.current = onChange;
        coworkRef.current = cowork;
        fieldRef.current = field;
    });

    React.useEffect(() => {
        return () => {
            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
            }
        };
    }, []);

    const extensions = React.useMemo(() => {
        return buildCoWorkExtensions({
            ydoc: useCollaboration ? ydoc : null,
            awareness: useCollaboration ? awareness : null,
            placeholder,
            field
        });
    }, [useCollaboration, ydoc, awareness, placeholder, field]);

    const editor = useEditor({
        extensions,
        content: dbValue,
        editorProps: {
            attributes: { class: 'focus:outline-none' },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;
                let handled = false;
                for (const item of Array.from(items)) {
                    if (item.type.indexOf('image') === 0) {
                        handled = true;
                        const file = item.getAsFile();
                        if (file) {
                            const formData = new FormData();
                            formData.append('file', file);
                            api.post('/collaboration/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                                .then(res => {
                                    const url = res.data.url;
                                    const { schema } = view.state;
                                    const node = schema.nodes.image.create({ src: url });
                                    view.dispatch(view.state.tr.replaceSelectionWith(node));
                                }).catch(err => console.error('[DIITRA] Error subiendo imagen al pegar', err));
                        }
                    }
                }
                return handled;
            },
            handleDrop: (view, event) => {
                const files = event.dataTransfer?.files;
                if (!files || files.length === 0) return false;
                let handled = false;
                for (const file of Array.from(files)) {
                    if (file.type.indexOf('image') === 0) {
                        handled = true;
                        const formData = new FormData();
                        formData.append('file', file);
                        event.preventDefault();
                        api.post('/collaboration/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
                            .then(res => {
                                const url = res.data.url;
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                if (coordinates) {
                                    const { schema } = view.state;
                                    const node = schema.nodes.image.create({ src: url });
                                    view.dispatch(view.state.tr.insert(coordinates.pos, node));
                                }
                            }).catch(err => console.error('[DIITRA] Error subiendo imagen al soltar', err));
                    }
                }
                return handled;
            }
        },
        onSelectionUpdate: ({ editor }) => {
            const { anchor, head } = editor.state.selection;
            const currentField = fieldRef.current;
            const now = Date.now();
            const delay = 30; // ms de throttle para no saturar la red con mensajes WebSocket (30ms = ~33 FPS, prácticamente instantáneo)
            const elapsed = now - lastSelectionSendRef.current;

            if (selectionTimeoutRef.current) {
                clearTimeout(selectionTimeoutRef.current);
                selectionTimeoutRef.current = null;
            }

            const send = () => {
                lastSelectionSendRef.current = Date.now();
                setTimeout(() => {
                    if (coworkRef.current.awareness) {
                        coworkRef.current.awareness.setLocalStateField(`anchor_${currentField}`, anchor);
                        coworkRef.current.awareness.setLocalStateField(`head_${currentField}`, head);
                    }
                }, 0);
            };

            if (elapsed >= delay) {
                send();
            } else {
                selectionTimeoutRef.current = setTimeout(send, delay - elapsed);
            }
        },
        onFocus: () => {
            const currentField = fieldRef.current;
            setTimeout(() => {
                if (coworkRef.current.awareness) {
                    coworkRef.current.awareness.setLocalStateField('focusedField', currentField);
                }
            }, 0);
        },
        onBlur: () => {
            const currentField = fieldRef.current;
            setTimeout(() => {
                if (coworkRef.current.awareness) {
                    const state = coworkRef.current.awareness.getLocalState();
                    if (state?.focusedField === currentField) {
                        coworkRef.current.awareness.setLocalStateField('focusedField', null);
                    }
                }
            }, 0);
        },
        onTransaction: ({ transaction }) => { lastTrWasRemoteRef.current = transaction.getMeta('y-sync$') != null; },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            const source: 'local' | 'remote' = lastTrWasRemoteRef.current ? 'remote' : 'local';
            const currentImages = extractImageUrls(html);
            if (source === 'local') {
                const deletedImages = knownImagesRef.current.filter(url => !currentImages.includes(url));
                for (const imageUrl of deletedImages) {
                    if (imageUrl.startsWith('/api/storage/cowork_images/')) {
                        api.delete(`/collaboration/delete-image?url=${encodeURIComponent(imageUrl)}`)
                            .then(() => coworkLog(`[CoWorkEditor] Imagen eliminada del servidor: ${imageUrl}`))
                            .catch(err => console.error('[DIITRA] Error al eliminar imagen de la base de datos:', err));
                    }
                }
            }
            knownImagesRef.current = currentImages;
            coworkLog(`[CoWorkEditor] onUpdate field='${fieldRef.current}' source=${source} len=${html.length}`);
            const currentOnChange = onChangeRef.current;
            if (currentOnChange) setTimeout(() => currentOnChange(html, { source }), 0);
            if (source === 'local') {
                const json = JSON.stringify(editor.getJSON());
                coworkRef.current.submitFinalContent(html, json, fieldRef.current);
            }
        }
    }, [extensions]);

    React.useEffect(() => {
        if (!editor || !useCollaboration) return;
        const isReadOnlyMode = readonly || cowork.session.readOnly;
        if (isReadOnlyMode) return;

        const xmlFragment = ydoc.getXmlFragment(field);

        // Limpieza automática si Yjs heredó fragmentos duplicados de sesiones anteriores
        if (dbValue && dbValue.trim() !== '') {
            const cleanDb = dbValue.trim();
            const currentHtml = editor.getHTML();
            const normDb = cleanDb.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const normEditor = currentHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

            if (normDb.length >= 3 && normEditor.length > normDb.length) {
                const parts = normEditor.split(normDb).map(p => p.trim()).filter(Boolean);
                const isDuplicatedSeed = parts.length === 0;

                if (isDuplicatedSeed) {
                    coworkLog(`[CoWorkEditor:${field}] Detección de contenido duplicado. Limpiando Yjs a versión semilla única.`);
                    seededRef.current = true;
                    ydoc.transact(() => {
                        xmlFragment.delete(0, xmlFragment.length);
                    }, 'local-dedup');
                    editor.commands.setContent(dbValue, { emitUpdate: false });
                }
            }
        }
    }, [editor, useCollaboration, ydoc, field, dbValue, readonly, cowork.session.readOnly]);

    const isEditable = !readonly && !cowork.session.readOnly;
    React.useEffect(() => {
        if (editor) editor.setEditable(isEditable);
    }, [editor, isEditable]);

    const { session } = cowork;

    return (
        <div className={`flex flex-col w-full h-full bg-surface rounded-lg border border-border-thin overflow-hidden ${className}`}>
            <CoWorkToolbar editor={editor} readonly={readonly || session.readOnly} />

            {session.isBlindMode && (
                <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-amber-500 text-[10px] font-semibold tracking-wide uppercase select-none">
                    <EyeOff size={13} className="shrink-0 animate-pulse text-amber-400" />
                    <span>Evaluacion anonima activa: las identidades del autor y del revisor estan ocultas segun normativa CACES.</span>
                </div>
            )}

            {session.isOversightObserver && !readonly && !isGlobalReadOnly && (
                <div className="px-5 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase select-none">
                    <Lock size={13} className="shrink-0 text-indigo-400" />
                    <span>Modo supervision: estas observando este documento como administrador.</span>
                </div>
            )}

            {(readonly || session.readOnly) && (!session.isOversightObserver || readonly) && !isGlobalReadOnly && (
                <div className="px-5 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase select-none">
                    <Lock size={13} className="shrink-0 text-indigo-400" />
                    <span>
                        {readOnlyReason === 'state' ? 'Documento bloqueado: ya fue firmado digitalmente y no puede modificarse.'
                        : readOnlyReason === 'review' ? 'Modo lectura: estas visualizando este documento en modo de revision.'
                        : readOnlyReason === 'membership' ? 'Modo lectura: no tienes permisos de escritura en este proyecto.'
                        : 'Documento en modo de solo lectura.'}
                    </span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 sm:p-8 bg-bg-deep">
                <div className="w-full max-w-[95%] mx-auto bg-white rounded-sm shadow-sm min-h-[600px] border border-border-thin relative">
                    {editor && cowork.awareness && (
                        <>
                            <EditorContent editor={editor} className="cowork-editor-content" />
                            <RemoteCursors editor={editor} awareness={cowork.awareness} field={field} />
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .cowork-editor-content .ProseMirror {
                    padding: 1.5cm 1rem; min-height: 600px;
                    font-family: 'Times New Roman', Times, Georgia, serif;
                    font-size: 12pt; line-height: 2; color: #111; outline: none; text-align: left;
                }
                @media (min-width: 640px) {
                    .cowork-editor-content .ProseMirror { padding: 2.54cm 2.54cm; }
                }
                .cowork-editor-content .ProseMirror p { margin: 0; text-indent: 1.27cm; }
                .cowork-editor-content .ProseMirror p.no-indent,
                .cowork-editor-content .ProseMirror .apa-note p,
                .cowork-editor-content .ProseMirror .apa-figure-note p,
                .cowork-editor-content .ProseMirror .apa-references p { text-indent: 0; }

                /* APA 7 Headings */
                .cowork-editor-content .ProseMirror h1 {
                    font-size: 12pt; font-weight: 700; font-style: normal; text-align: center;
                    margin: 0; padding: 0; line-height: 2; text-indent: 0;
                }
                .cowork-editor-content .ProseMirror h2 {
                    font-size: 12pt; font-weight: 700; font-style: normal; text-align: left;
                    margin: 0; padding: 0; line-height: 2; text-indent: 0;
                }
                .cowork-editor-content .ProseMirror h3 {
                    font-size: 12pt; font-weight: 700; font-style: italic; text-align: left;
                    margin: 0; padding: 0; line-height: 2; text-indent: 0;
                }
                .cowork-editor-content .ProseMirror h4 {
                    font-size: 12pt; font-weight: 700; font-style: normal; text-align: left;
                    margin: 0; padding: 0; line-height: 2; text-indent: 1.27cm; display: block;
                }
                .cowork-editor-content .ProseMirror h4::after { content: '.'; }
                .cowork-editor-content .ProseMirror h5 {
                    font-size: 12pt; font-weight: 700; font-style: italic; text-align: left;
                    margin: 0; padding: 0; line-height: 2; text-indent: 1.27cm; display: block;
                }
                .cowork-editor-content .ProseMirror h5::after { content: '.'; }

                .cowork-editor-content .ProseMirror ul,
                .cowork-editor-content .ProseMirror ol { padding-left: 1.27cm; margin: 0; }
                .cowork-editor-content .ProseMirror li { text-indent: 0; }
                .cowork-editor-content .ProseMirror strong { font-weight: 700; }
                .cowork-editor-content .ProseMirror em { font-style: italic; }

                /* Cita directa larga APA (>40 palabras) */
                .cowork-editor-content .ProseMirror blockquote {
                    margin: 0; padding-left: 1.27cm; border-left: none;
                    font-style: normal; line-height: 2; text-indent: 0;
                }

                /* Figura APA */
                .cowork-editor-content .ProseMirror .apa-figure { margin: 1rem 0; text-align: left; }
                .cowork-editor-content .ProseMirror .apa-figure-label {
                    font-weight: 700; font-style: normal; text-indent: 0; display: block; line-height: 2;
                }
                .cowork-editor-content .ProseMirror .apa-figure-title {
                    font-style: italic; text-indent: 0; display: block; line-height: 2; margin-bottom: 0.25rem;
                }
                .cowork-editor-content .ProseMirror .apa-figure-note {
                    font-size: 10pt; line-height: 2; text-indent: 0; margin-top: 0.25rem;
                }

                /* Referencias APA (sangria francesa) */
                .cowork-editor-content .ProseMirror .apa-references-title {
                    font-size: 12pt; font-weight: 700; text-align: center;
                    text-indent: 0; display: block; line-height: 2;
                }
                .cowork-editor-content .ProseMirror .apa-reference-entry {
                    padding-left: 1.27cm; text-indent: -1.27cm; line-height: 2; margin-bottom: 0;
                }

                /* Placeholder */
                .cowork-editor-content .ProseMirror.is-editor-empty:first-child::before,
                .cowork-editor-content .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    color: #aaa; pointer-events: none; float: left; height: 0; font-style: italic; text-indent: 0;
                }

                /* Gapcursor */
                .cowork-editor-content .ProseMirror .ProseMirror-gapcursor { display: none; pointer-events: none; position: absolute; }
                .cowork-editor-content .ProseMirror .ProseMirror-gapcursor::after {
                    content: ""; display: block; position: absolute; top: -2px; left: 0;
                    width: 2px; height: 1.2em; background-color: #6366f1;
                    animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
                }
                @keyframes ProseMirror-cursor-blink { to { visibility: hidden; } }

                /* Tablas genericas */
                .cowork-editor-content .ProseMirror table {
                    border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0.5rem 0; overflow: hidden;
                }
                .cowork-editor-content .ProseMirror table tr { height: auto !important; }
                .cowork-editor-content .ProseMirror table td,
                .cowork-editor-content .ProseMirror table th {
                    min-width: 1em; border: 1px dashed #e2e8f0; padding: 6px 10px;
                    line-height: 1.4; font-size: 0.9rem; vertical-align: middle;
                    box-sizing: border-box; position: relative; height: auto !important;
                }
                .cowork-editor-content .ProseMirror table th { font-weight: bold; text-align: left; background-color: rgba(0,0,0,0.02); }

                /* Tablas APA */
                .cowork-editor-content .ProseMirror table.apa-table { border-collapse: collapse; border: none !important; }
                .cowork-editor-content .ProseMirror table.apa-table td,
                .cowork-editor-content .ProseMirror table.apa-table th {
                    border: none !important; border-bottom: 1px solid rgba(0,0,0,0.08) !important;
                }
                .cowork-editor-content .ProseMirror table.apa-table tr:first-child th,
                .cowork-editor-content .ProseMirror table.apa-table tr:first-child td {
                    border-top: 2px solid #111 !important; border-bottom: 1.5px solid #111 !important;
                }
                .cowork-editor-content .ProseMirror table.apa-table tr:last-child td { border-bottom: 2px solid #111 !important; }
                .cowork-editor-content .ProseMirror table.apa-table td,
                .cowork-editor-content .ProseMirror table.apa-table th { border-left: none !important; border-right: none !important; }

                /* Redimensionamiento de columnas */
                .cowork-editor-content .ProseMirror .column-resize-handle {
                    position: absolute; right: -2px; top: 0; bottom: -2px;
                    width: 4px; background-color: #6366f1; pointer-events: none; z-index: 20;
                }
                .cowork-editor-content .ProseMirror .resize-cursor { cursor: ew-resize; }
            `}</style>
        </div>
    );
};

export default CoWorkEditor;
