import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import 'quill/dist/quill.snow.css';
import { useCollaboration } from '../../hooks/shared/useCollaboration';
import { FileEdit, Users, Save, Shield, CheckCircle2, Loader2 } from 'lucide-react';

Quill.register('modules/cursors', QuillCursors);

interface Props {
    documentId: string;
    title: string;
}

const CollaborativeEditor: React.FC<Props> = ({ documentId, title }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<Quill | null>(null);
    const [quillReady, setQuillReady] = useState<Quill | null>(null);
    
    const [userName] = useState(`Docente_${Math.floor(Math.random() * 1000)}`);
    const { isConnected, connectedUsers } = useCollaboration(documentId, userName, quillReady);

    useEffect(() => {
        if (editorRef.current && !quillInstance.current) {
            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    cursors: true,
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['clean']
                    ]
                },
                placeholder: 'Comience a escribir su propuesta académica...'
            });

            quillInstance.current = quill;
            setQuillReady(quill);
        }
    }, []);

    return (
        <div className="flex flex-col w-full h-full bg-surface rounded-lg border border-border-thin overflow-hidden transition-all duration-300">
            {/* Cabecera de Colaboración (Vercel Style) */}
            <div className="bg-surface p-4 flex justify-between items-center border-b border-border-thin">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-bg-deep border border-border-thin flex items-center justify-center text-text-main">
                        <FileEdit size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-text-main">{title}</h2>
                        <div className="flex items-center gap-2">
                             {isConnected ? (
                                 <div className="flex items-center gap-1.5">
                                     <div className="w-1.5 h-1.5 rounded-full bg-text-main animate-pulse" />
                                     <span className="text-[9px] text-text-dim uppercase font-bold tracking-[0.2em]">Sincronización Activa</span>
                                 </div>
                             ) : (
                                 <div className="flex items-center gap-1.5">
                                     <Loader2 size={10} className="animate-spin text-text-dim" />
                                     <span className="text-[9px] text-text-dim uppercase font-bold tracking-[0.2em]">Conectando Motor...</span>
                                 </div>
                             )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {connectedUsers.map((user, i) => (
                                <div 
                                    key={i} 
                                    className="w-8 h-8 rounded-full border border-bg-deep bg-surface flex items-center justify-center text-[10px] font-bold text-text-main ring-1 ring-border-thin transition-transform hover:translate-y-[-2px] cursor-help"
                                    title={user}
                                >
                                    {user.charAt(0)}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] text-text-dim uppercase font-bold tracking-tighter flex items-center gap-1">
                                <Users size={10} />
                                {connectedUsers.length} en línea
                            </span>
                        </div>
                    </div>
                    
                    <button className="btn-vercel-primary flex items-center gap-2 text-[11px] py-1.5">
                        <Save size={14} />
                        <span>Publicar</span>
                    </button>
                </div>
            </div>

            {/* Espacio de Trabajo */}
            <div className="flex-1 bg-bg-deep overflow-y-auto p-8 custom-quill-container">
                <div className="max-w-4xl mx-auto bg-white dark:bg-[#fafafa] rounded-sm shadow-sm min-h-[1100px] border border-border-thin transition-colors">
                    <div ref={editorRef} />
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-surface px-6 py-2 border-t border-border-thin flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Shield size={12} className="text-text-dim" />
                        <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">DIITRA Secure Protocol</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={10} className="text-text-main" />
                        <span className="text-[9px] text-text-dim font-medium uppercase tracking-tighter">Entorno de Producción</span>
                    </div>
                    <div className="h-3 w-[1px] bg-border-thin" />
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] text-text-dim uppercase">Sesión:</span>
                        <span className="text-[9px] text-text-main font-bold font-mono tracking-tighter bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">{userName}</span>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-quill-container .ql-toolbar {
                    border: none !important;
                    border-bottom: 1px solid var(--border) !important;
                    background: var(--surface) !important;
                    padding: 8px 32px !important;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    display: flex;
                    justify-content: center;
                    gap: 4px;
                }
                .custom-quill-container .ql-container {
                    border: none !important;
                    font-size: 1rem;
                    font-family: var(--font-sans);
                }
                .custom-quill-container .ql-editor {
                    padding: 2.5cm 2cm;
                    min-height: 1100px;
                    line-height: 1.6;
                    color: #111111; /* Siempre oscuro para legibilidad sobre fondo blanco */
                }
                
                /* Iconos de la barra de herramientas en modo oscuro */
                .custom-quill-container .ql-stroke { stroke: var(--text-dim); }
                .custom-quill-container .ql-fill { fill: var(--text-dim); }
                .custom-quill-container .ql-picker { color: var(--text-dim); }
                
                .custom-quill-container .ql-editor.ql-blank::before {
                    color: #888;
                    font-style: normal;
                    font-size: 0.9rem;
                    left: 2cm;
                }

                /* Estilos de Cursores Remotos */
                .ql-cursor {
                    transition: all 0.1s ease-out;
                }
                .ql-cursor-flag {
                    border-radius: 2px !important;
                    padding: 2px 6px !important;
                    font-weight: 600 !important;
                    font-size: 10px !important;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
                    border: 1px solid rgba(255,255,255,0.2) !important;
                }
                .ql-cursor-name {
                    font-family: var(--font-mono) !important;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                /* Personalización de la barra de desplazamiento */
                .custom-quill-container::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-quill-container::-webkit-scrollbar-track {
                    background: var(--bg);
                }
                .custom-quill-container::-webkit-scrollbar-thumb {
                    background: var(--border);
                    border-radius: 10px;
                }
                .custom-quill-container::-webkit-scrollbar-thumb:hover {
                    background: var(--text-dim);
                }
            `}</style>
        </div>
    );
};

export default CollaborativeEditor;
