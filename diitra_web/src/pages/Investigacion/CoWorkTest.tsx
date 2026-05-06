import React, { useState } from 'react';
import { useCoWork, CoWorkEditor } from '../../core/cowork';
import { Shield, Info, Users, Database } from 'lucide-react';

const CoWorkTestPage: React.FC = () => {
    // Simulamos un ID de documento para la prueba
    const testDocId = "test-document-001";

    // Simulamos datos de usuario que normalmente vendrían del AuthContext (JWT)
    const [mockUser] = useState({
        userUuid: "user-test-123",
        nombreCompleto: "Investigador de Prueba",
        role: "Director de Investigación"
    });

    const cowork = useCoWork({
        documentId: testDocId,
        user: {
            id: mockUser.userUuid,
            name: mockUser.nombreCompleto,
            role: mockUser.role,
            color: '#4f46e9',
            initials: 'IP'
        }
    });

    return (
        <div className="min-h-screen bg-bg-deep p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header de la Prueba */}
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="text-text-main" size={18} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-dim">Ambiente de Pruebas DIITRA</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tighter text-text-main">CoWork Playground</h1>
                        <p className="text-text-dim text-sm mt-1">Validación de colaboración en tiempo real y persistencia Yjs.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-surface border border-border-thin p-3 rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-bg-deep flex items-center justify-center text-text-main">
                                <Database size={16} />
                            </div>
                            <div>
                                <div className="text-[9px] font-bold uppercase text-text-dim">Estado DB</div>
                                <div className="text-[11px] font-mono text-text-main">inv_cowork_documentos</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-8">
                    {/* Panel de Control Lateral */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-surface border border-border-thin p-6 rounded-xl shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-text-main mb-4 flex items-center gap-2">
                                <Info size={14} /> Información
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold text-text-dim uppercase">ID Documento</label>
                                    <div className="text-xs font-mono text-text-main truncate bg-bg-deep p-2 rounded mt-1">{testDocId}</div>
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-text-dim uppercase">Usuario Local</label>
                                    <div className="text-xs text-text-main font-medium bg-bg-deep p-2 rounded mt-1">{mockUser.nombreCompleto}</div>
                                </div>
                                <div className="pt-4 border-t border-border-thin">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-text-dim uppercase font-bold">Colaboradores</span>
                                        <span className="bg-text-main text-bg-deep text-[9px] px-1.5 rounded font-bold">{cowork.session.connectedUsers.length}</span>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {cowork.session.connectedUsers.map(u => (
                                            <div 
                                                key={u.id}
                                                className="w-8 h-8 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                                                style={{ backgroundColor: u.color }}
                                                title={u.name}
                                            >
                                                {u.initials}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-xl">
                            <h4 className="text-[10px] font-bold text-blue-500 uppercase mb-2 tracking-widest">Guía de Prueba</h4>
                            <p className="text-[11px] text-blue-700/80 leading-relaxed italic">
                                "Abre esta misma página en una ventana de incógnito o en otro navegador para ver la magia de la sincronización en vivo."
                            </p>
                        </div>
                    </div>

                    {/* Editor Principal */}
                    <div className="col-span-3">
                        <div className="h-[750px] shadow-2xl relative">
                            <CoWorkEditor 
                                cowork={cowork} 
                                placeholder="Empieza a escribir aquí para probar la persistencia..." 
                            />
                            
                            {/* Marca de Agua de Núcleo */}
                            <div className="absolute bottom-6 right-8 pointer-events-none opacity-20 flex flex-col items-end">
                                <span className="text-[10px] font-black italic tracking-widest text-text-main uppercase">DIITRA CoWork Engine</span>
                                <span className="text-[8px] font-bold text-text-dim">v3.0 ENTERPRISE CORE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CoWorkTestPage;
