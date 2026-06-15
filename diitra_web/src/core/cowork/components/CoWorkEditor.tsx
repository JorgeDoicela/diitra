// ═══════════════════════════════════════════════════════════════════
// DIITRA CoWork — Editor Component
//
// Componente de React que renderiza el editor Tiptap colaborativo.
// Consume un CoWorkHandle (del hook useCoWork) para conectarse
// al estado compartido del documento.
//
// Uso:
// ────
// const cowork = useCoWork({ documentId, user });
// <CoWorkEditor cowork={cowork} placeholder="Escribe tu metodología..." />
// ═══════════════════════════════════════════════════════════════════

import React, { useContext } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import api from '../../../api/axios_config';
import { buildCoWorkExtensions } from '../extensions/coworkExtensions';
import type { CoWorkHandle, CoWorkUser } from '../types';
import { RemoteCursors } from './RemoteCursors';
import { CoWorkToolbar } from './CoWorkToolbar';
import { DocumentDataContext } from '../../documents/context/DocumentDataContext';
import { 
    CheckCircle2, 
    Loader2, 
    Users, 
    Wifi, 
    WifiOff, 
    EyeOff, 
    Lock 
} from 'lucide-react';

interface CoWorkEditorProps {
    /** Handle retornado por useCoWork — contiene ydoc, awareness y sesión */
    cowork: CoWorkHandle;
    /** Llave de fragmento Yjs a la cual se unirá este editor (ej. 'Antecedentes') */
    field?: string;
    /** Callback para extraer el HTML puro generado por Tiptap (para guardado agnóstico) */
    onChange?: (html: string) => void;
    /** Texto de guía visible cuando el editor está vacío */
    placeholder?: string;
    /** Modo solo lectura (para revisores en evaluación doble ciego) */
    readonly?: boolean;
    /** Clase CSS adicional para el contenedor del editor */
    className?: string;
}

interface InnerCoWorkEditorProps extends CoWorkEditorProps {
    useCollaboration: boolean;
    dbValue: string | undefined;
}

export const CoWorkEditor: React.FC<CoWorkEditorProps> = (props) => {
    const parentFormData = useContext(DocumentDataContext);
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

    const isReadOnlyMode = props.readonly || props.cowork.session.readOnly;
    const xmlFragment = props.cowork.ydoc.getXmlFragment(field);
    const hasYjsContent = xmlFragment.length > 0;
    const useCollaboration = !isReadOnlyMode || hasYjsContent;

    const editorKey = `${field}_collab_${useCollaboration}`;
    
    return (
        <InnerCoWorkEditor 
            key={editorKey} 
            useCollaboration={useCollaboration} 
            dbValue={dbValue} 
            {...props} 
        />
    );
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

    // Guardar referencias a callbacks e inputs volátiles para evitar la destrucción/re-creación de Tiptap
    const onChangeRef = React.useRef(onChange);
    const coworkRef = React.useRef(cowork);
    const fieldRef = React.useRef(field);

    React.useEffect(() => {
        onChangeRef.current = onChange;
        coworkRef.current = cowork;
        fieldRef.current = field;
    });

    // Memorizar las extensiones para evitar re-creaciones del editor innecesarias
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
        content: useCollaboration ? undefined : dbValue,
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
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
                            
                            // Subida asíncrona (Upload-on-Paste)
                            api.post('/collaboration/upload', formData, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                            }).then(res => {
                                const url = res.data.url;
                                const { schema } = view.state;
                                const node = schema.nodes.image.create({ src: url });
                                const tr = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(tr);
                            }).catch(err => {
                                console.error('[DIITRA] Error subiendo imagen al pegar', err);
                            });
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
                        
                        // Evitar que el navegador abra la imagen
                        event.preventDefault();
                        
                        api.post('/collaboration/upload', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        }).then(res => {
                            const url = res.data.url;
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                            if (coordinates) {
                                const { schema } = view.state;
                                const node = schema.nodes.image.create({ src: url });
                                const tr = view.state.tr.insert(coordinates.pos, node);
                                view.dispatch(tr);
                            }
                        }).catch(err => {
                            console.error('[DIITRA] Error subiendo imagen al soltar', err);
                        });
                    }
                }
                return handled;
            }
        },
        // Sincronizar selección completa (posición y resaltado) aislada por campo
        onSelectionUpdate: ({ editor }) => {
            const { anchor, head } = editor.state.selection;
            const currentField = fieldRef.current;
            // Usar setTimeout para evitar el error "Cannot update a component while rendering"
            setTimeout(() => {
                if (coworkRef.current.awareness) {
                    coworkRef.current.awareness.setLocalStateField(`anchor_${currentField}`, anchor);
                    coworkRef.current.awareness.setLocalStateField(`head_${currentField}`, head);
                }
            }, 0);
        },
        // Registrar qué campo está enfocado activamente por este cliente
        onFocus: () => {
            const currentField = fieldRef.current;
            setTimeout(() => {
                if (coworkRef.current.awareness) {
                    coworkRef.current.awareness.setLocalStateField('focusedField', currentField);
                }
            }, 0);
        },
        // Limpiar el campo enfocado al perder foco
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
        // Notificar cambios al formulario contenedor o usar fallback de SignalR (retrocompatibilidad)
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            console.log(`[DIITRA] CoWorkEditor: onUpdate en campo '${fieldRef.current}'. Longitud HTML: ${html.length}`);
            const currentOnChange = onChangeRef.current;
            if (currentOnChange) {
                // Modo Moderno: Delegar al formulario centralizador de React
                setTimeout(() => currentOnChange(html), 0);
            }
            
            // SIEMPRE registrar en el snapshot de SignalR (retrocompatibilidad y soporte PDF/Rubrica)
            // Pasamos el nombre del campo para que se almacene bajo {docId}_{fieldName}
            // en inv_cowork_documentos, permitiendo que PeerReviewService recupere
            // justificacion y metodologia de forma independiente.
            const json = JSON.stringify(editor.getJSON());
            coworkRef.current.submitFinalContent(html, json, fieldRef.current);
        }
    }, [extensions]); // El editor se instancia UNA SOLA VEZ y permanece estable en memoria

    // Auto-poblar Yjs con el contenido de la base de datos si Yjs está vacío
    React.useEffect(() => {
        if (!editor || !useCollaboration) return;

        const xmlFragment = ydoc.getXmlFragment(field);
        const isYjsEmpty = xmlFragment.length === 0;

        if (isYjsEmpty && dbValue && dbValue.trim() !== '') {
            const isReadOnlyMode = readonly || cowork.session.readOnly;
            if (!isReadOnlyMode) {
                console.log(`[DIITRA] CoWorkEditor: Yjs para '${field}' está vacío. Inicializando Yjs con valor de BD:`, dbValue.substring(0, 100));
                editor.commands.setContent(dbValue, { emitUpdate: false });
            }
        }
    }, [editor, useCollaboration, ydoc, field, dbValue, readonly, cowork.session.readOnly]);

    // Sincronizar estado de Edición/Solo Lectura de forma dinámica sin destruir el editor
    const isEditable = !readonly && !cowork.session.readOnly;
    React.useEffect(() => {
        if (editor) {
            editor.setEditable(isEditable);
        }
    }, [editor, isEditable]);

    const { session } = cowork;

    return (
        <div className={`flex flex-col w-full h-full bg-surface rounded-lg border border-border-thin overflow-hidden ${className}`}>
            {/* ── Barra de Estado de Colaboración ── */}
            <div className="px-5 py-3 border-b border-border-thin bg-bg-deep flex items-center justify-between">
                {/* Estado de conexión */}
                <div className="flex items-center gap-2">
                    {session.isConnected ? (
                        <>
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <Wifi size={11} className="text-green-500" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-green-500">
                                Colaboración en línea
                            </span>
                        </>
                    ) : session.error ? (
                        <>
                            <WifiOff size={11} className="text-red-400" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-400">
                                Sin conexión — Modo local
                            </span>
                        </>
                    ) : (
                        <>
                            <Loader2 size={11} className="animate-spin text-text-dim" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-text-dim">
                                Conectando...
                            </span>
                        </>
                    )}
                </div>

                {/* Colaboradores activos */}
                <div className="flex items-center gap-4">
                    {session.isSyncing && (
                        <div className="flex items-center gap-1.5">
                            <Loader2 size={10} className="animate-spin text-text-dim" />
                            <span className="text-[9px] text-text-dim uppercase tracking-widest">Guardando...</span>
                        </div>
                    )}
                    {session.lastSyncedAt && !session.isSyncing && (
                        <div className="flex items-center gap-1">
                            <CheckCircle2 size={10} className="text-green-500" />
                            <span className="text-[9px] text-text-dim uppercase tracking-widest">
                                {session.lastSyncedAt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}

                    {session.connectedUsers.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {session.connectedUsers.slice(0, 5).map((user: CoWorkUser, idx: number) => (
                                    <div
                                        key={`${user.id}-${idx}`}
                                        className="w-6 h-6 rounded-full border border-bg-deep flex items-center justify-center text-[9px] font-bold text-white transition-transform hover:-translate-y-0.5 cursor-help"
                                        style={{ backgroundColor: user.color }}
                                        title={`${user.name} (${user.role})`}
                                    >
                                        {user.initials}
                                    </div>
                                ))}
                                {session.connectedUsers.length > 5 && (
                                    <div className="w-6 h-6 rounded-full border border-bg-deep bg-surface flex items-center justify-center text-[9px] font-bold text-text-dim">
                                        +{session.connectedUsers.length - 5}
                                    </div>
                                )}
                            </div>
                            <span className="text-[9px] text-text-dim uppercase tracking-widest flex items-center gap-1">
                                <Users size={9} />{session.connectedUsers.length}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Barra de Herramientas CoWork (Word/Google Docs style) ── */}
            <CoWorkToolbar 
                editor={editor} 
                readonly={readonly || session.readOnly} 
            />

            {/* ── Banners CACES / SENESCYT de Cumplimiento ── */}
            {session.isBlindMode && (
                <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-amber-500 text-[10px] font-semibold tracking-wide uppercase select-none">
                    <EyeOff size={13} className="shrink-0 animate-pulse text-amber-400" />
                    <span>Evaluación anónima activa: las identidades del autor y del revisor están ocultas según normativa CACES.</span>
                </div>
            )}

            {(readonly || session.readOnly) && (
                <div className="px-5 py-2.5 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2 text-indigo-400 text-[10px] font-semibold tracking-wide uppercase select-none">
                    <Lock size={13} className="shrink-0 text-indigo-400" />
                    <span>Documento bloqueado: ya fue firmado digitalmente y no puede modificarse.</span>
                </div>
            )}

            {/* ── Área del Editor ── */}
            <div className="flex-1 overflow-y-auto p-8 bg-bg-deep">
                <div className="w-full max-w-[95%] mx-auto bg-white rounded-sm shadow-sm min-h-[600px] border border-border-thin relative">
                    {editor && cowork.awareness && (
                        <>
                            <EditorContent
                                editor={editor}
                                className="cowork-editor-content"
                            />
                            <RemoteCursors 
                                editor={editor} 
                                awareness={cowork.awareness} 
                                field={field}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* ── Estilos del editor (separados para no contaminar los estilos globales) ── */}
            <style>{`
                .cowork-editor-content .ProseMirror {
                    padding: 2.5cm 2cm;
                    min-height: 600px;
                    font-size: 1rem;
                    line-height: 1.7;
                    color: #111;
                    outline: none;
                }

                .cowork-editor-content .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
                .cowork-editor-content .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
                .cowork-editor-content .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 1rem 0 0.5rem; }
                .cowork-editor-content .ProseMirror p { margin-bottom: 0.75rem; }
                .cowork-editor-content .ProseMirror ul,
                .cowork-editor-content .ProseMirror ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
                .cowork-editor-content .ProseMirror strong { font-weight: 700; }
                .cowork-editor-content .ProseMirror em { font-style: italic; }

                /* Placeholder text */
                .cowork-editor-content .ProseMirror.is-editor-empty:first-child::before,
                .cowork-editor-content .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    color: #aaa;
                    pointer-events: none;
                    float: left;
                    height: 0;
                    font-style: italic;
                }
            `}</style>
        </div>
    );
};

export default CoWorkEditor;
