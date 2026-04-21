import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import 'quill/dist/quill.snow.css';
import { useCollaboration } from '../../hooks/shared/useCollaboration';

Quill.register('modules/cursors', QuillCursors);

interface Props {
    documentId: string;
    title: string;
}

const CollaborativeEditor: React.FC<Props> = ({ documentId, title }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<Quill | null>(null);
    const [quillReady, setQuillReady] = useState<Quill | null>(null);
    
    // El nombre real debería venir del AuthContext, por ahora usamos el temporal
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
        <div className="flex flex-col w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in duration-500">
            {/* Cabecera de Colaboración */}
            <div className="bg-[#0f172a] p-5 flex justify-between items-center text-white border-b border-slate-800">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight text-slate-100">{title}</h2>
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 animate-pulse'}`}></div>
                             <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em]">
                                {isConnected ? 'Motor CRDT Conectado' : 'Estableciendo Enlace...'}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {connectedUsers.map((user, i) => (
                            <div 
                                key={i} 
                                className="w-9 h-9 rounded-full border-2 border-[#0f172a] bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-300 ring-2 ring-indigo-500/10 transition-transform hover:scale-110 hover:z-10 cursor-help"
                                title={user}
                            >
                                {user.charAt(0)}
                            </div>
                        ))}
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-xl shadow-indigo-500/25 active:scale-95">
                        Guardar Cambios
                    </button>
                </div>
            </div>

            {/* Espacio de Trabajo */}
            <div className="flex-1 bg-slate-100/50 overflow-y-auto p-10 custom-quill-container">
                <div className="max-w-5xl mx-auto bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-sm min-h-[1200px]">
                    <div ref={editorRef} />
                </div>
            </div>

            {/* Status Bar */}
            <div className="bg-white px-6 py-2.5 border-t border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tecnología Yjs + SignalR</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium">Usuario Activo:</span>
                    <span className="text-[10px] text-indigo-600 font-black">{userName}</span>
                </div>
            </div>

            <style>{`
                .custom-quill-container .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid #f1f5f9;
                    background: #ffffff;
                    padding: 12px 50px;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                }
                .custom-quill-container .ql-container {
                    border: none;
                    font-size: 1.15rem;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                }
                .custom-quill-container .ql-editor {
                    padding: 3cm 2.5cm;
                    min-height: 1200px;
                    line-height: 1.8;
                    color: #1e293b;
                }
                
                /* Tu propio resaltado (Local) */
                .ql-editor ::selection {
                    background-color: rgba(99, 102, 241, 0.2) !important;
                }

                /* Estilos de Cursores Remotos (quill-cursors) */
                .ql-cursor {
                    transition: all 0.1s ease-out;
                }
                .ql-cursor-flag {
                    border-radius: 4px !important;
                    padding: 2px 8px !important;
                    font-weight: 700 !important;
                    font-size: 11px !important;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
                }
                .ql-cursor-name {
                    font-family: 'Inter', sans-serif !important;
                }
            `}</style>
        </div>
    );
};

export default CollaborativeEditor;
