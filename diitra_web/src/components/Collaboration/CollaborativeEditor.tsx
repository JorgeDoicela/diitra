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
    const cursorsModule = useRef<any>(null);
    const createdCursors = useRef<Set<string>>(new Set());
    
    const [userName] = useState(`Docente_${Math.floor(Math.random() * 1000)}`);
    const [userColor] = useState(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);

    const { lastDelta, sendDelta, updateCursor, lastCursor, isConnected, connectedUsers } = useCollaboration(documentId, userName);

    const sendDeltaRef = useRef(sendDelta);
    const updateCursorRef = useRef(updateCursor);

    useEffect(() => {
        sendDeltaRef.current = sendDelta;
        updateCursorRef.current = updateCursor;
    }, [sendDelta, updateCursor]);

    useEffect(() => {
        if (editorRef.current && !quillInstance.current) {
            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    cursors: {
                        hideDelay: 3000,
                        hideSpeed: 500,
                    },
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'align': [] }],
                        ['clean']
                    ]
                },
                placeholder: 'Comience a redactar el documento técnico...'
            });

            quillInstance.current = quill;
            cursorsModule.current = quill.getModule('cursors');

            quill.on('text-change', (delta, oldDelta, source) => {
                if (source === 'user') {
                    sendDeltaRef.current(delta);
                }
            });

            quill.on('selection-change', (range) => {
                if (range) {
                    updateCursorRef.current({
                        range,
                        name: userName,
                        color: userColor
                    });
                }
            });
        }

        return () => {
            // Limpieza al desmontar para evitar errores de memoria
            if (cursorsModule.current) {
                try {
                    createdCursors.current.forEach(id => {
                        cursorsModule.current.removeCursor(id);
                    });
                    createdCursors.current.clear();
                } catch (e) {}
            }
        };
    }, [userName, userColor]);

    useEffect(() => {
        if (lastDelta && quillInstance.current) {
            quillInstance.current.updateContents(lastDelta, 'silent');
        }
    }, [lastDelta]);

    useEffect(() => {
        if (lastCursor && cursorsModule.current && lastCursor.connectionId !== undefined) {
            try {
                const { connectionId, cursor } = lastCursor;
                if (!cursor || !cursor.range || !cursor.name) return;

                // Solo actuar si el editor está en el DOM
                if (!editorRef.current) return;

                if (!createdCursors.current.has(connectionId)) {
                    cursorsModule.current.createCursor(connectionId, cursor.name, cursor.color);
                    createdCursors.current.add(connectionId);
                }
                
                cursorsModule.current.moveCursor(connectionId, cursor.range);
            } catch (err) {
                // Silenciamos errores internos de la librería
            }
        }
    }, [lastCursor]);

    return (
        <div className="flex flex-col w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-[#0f172a] p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'}`}></div>
                             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                {isConnected ? 'Sincronización Activa' : 'Desconectado'}
                             </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {connectedUsers.map((user, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-slate-700 flex items-center justify-center text-[10px] font-bold" title={user}>
                                {user.charAt(0)}
                            </div>
                        ))}
                    </div>
                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-md text-sm font-medium transition-all">
                        Finalizar Documento
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-slate-50 overflow-y-auto p-8 custom-quill-container">
                <div className="max-w-4xl mx-auto bg-white shadow-xl min-h-[1000px]">
                    <div ref={editorRef} />
                </div>
            </div>

            <div className="bg-slate-100 px-4 py-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                <div className="flex gap-4">
                    <span>SISTEMA DE INVESTIGACIÓN DIITRA</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400">UUID: {documentId}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                    <span className="text-indigo-600 font-bold uppercase">USUARIO: {userName}</span>
                </div>
            </div>

            <style>{`
                .custom-quill-container .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid #e2e8f0;
                    background: #f8fafc;
                    padding: 10px 40px;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                .custom-quill-container .ql-container {
                    border: none;
                    font-size: 1.1rem;
                    color: #334155;
                }
                .custom-quill-container .ql-editor {
                    padding: 2cm;
                    min-height: 1000px;
                }
                .ql-editor p {
                    margin-bottom: 1rem;
                    line-height: 1.8;
                }
                .ql-cursor {
                    z-index: 100;
                }
            `}</style>
        </div>
    );
};

export default CollaborativeEditor;
