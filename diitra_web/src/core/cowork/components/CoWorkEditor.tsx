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

import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { buildCoWorkExtensions } from '../extensions/coworkExtensions';
import type { CoWorkHandle, CoWorkUser } from '../types';
import { RemoteCursors } from './RemoteCursors';
import { CheckCircle2, Loader2, Users, Wifi, WifiOff } from 'lucide-react';

interface CoWorkEditorProps {
    /** Handle retornado por useCoWork — contiene ydoc, awareness y sesión */
    cowork: CoWorkHandle;
    /** Texto de guía visible cuando el editor está vacío */
    placeholder?: string;
    /** Modo solo lectura (para revisores en evaluación doble ciego) */
    readonly?: boolean;
    /** Clase CSS adicional para el contenedor del editor */
    className?: string;
}

export const CoWorkEditor: React.FC<CoWorkEditorProps> = ({
    cowork,
    placeholder,
    readonly = false,
    className = '',
}) => {
    // Memorizar las extensiones para evitar re-creaciones del editor innecesarias
    const extensions = React.useMemo(() => {
        return buildCoWorkExtensions({
            ydoc: cowork.ydoc,
            awareness: cowork.awareness,
            placeholder,
        });
    }, [cowork.ydoc, cowork.awareness, placeholder]);

    const editor = useEditor({
        extensions,
        editable: !readonly && !cowork.session.readOnly,
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
        },
        // Sincronizar selección completa (posición y resaltado)
        onSelectionUpdate: ({ editor }) => {
            const { anchor, head } = editor.state.selection;
            // Usar setTimeout para evitar el error "Cannot update a component while rendering"
            setTimeout(() => {
                if (cowork.awareness) {
                    cowork.awareness.setLocalStateField('anchor', anchor);
                    cowork.awareness.setLocalStateField('head', head);
                }
            }, 0);
        },
        // Sincronizar instantánea HTML/JSON con el servidor (para el DIITRA Builder)
        onUpdate: ({ editor }) => {
            // Usamos un pequeño debounce implícito o solo enviamos si hay cambios reales
            // Para nivel enterprise, el servidor necesita el HTML legible
            const html = editor.getHTML();
            const json = JSON.stringify(editor.getJSON());
            cowork.submitFinalContent(html, json);
        }
    }, [extensions]); // Re-inicializar si las extensiones cambian críticamente

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
                                DIITRA CoWork — En línea
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
                                Conectando al motor...
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

            {/* ── Área del Editor ── */}
            <div className="flex-1 overflow-y-auto p-8 bg-bg-deep">
                <div className="max-w-4xl mx-auto bg-white rounded-sm shadow-sm min-h-[600px] border border-border-thin relative">
                    {editor && cowork.awareness && (
                        <>
                            <EditorContent
                                editor={editor}
                                className="cowork-editor-content"
                            />
                            <RemoteCursors 
                                editor={editor} 
                                awareness={cowork.awareness} 
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
