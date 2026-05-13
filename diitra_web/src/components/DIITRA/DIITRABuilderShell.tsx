import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, FileText, Save, Users, Clock, Settings, BookOpen, Target, Upload, Shield, Wifi, WifiOff, Loader2 } from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { useCoWork } from '../../core/cowork/hooks/useCoWork';
import { coworkUserFromAuth } from '../../core/cowork/utils/coworkUserFromAuth';
import type { CoWorkHandle } from '../../core/cowork/types';
import type { CoWorkUser } from '../../core/cowork/types';

/**
 * DIITRA BUILDER CORE - SHELL UNIVERSAL DE DOCUMENTACIÓN
 * -------------------------------------------------------------------------
 * Este componente es el "Marco Profesional" de la institución. Su responsabilidad
 * es manejar la infraestructura visual y técnica común:
 * 
 * - Renderizado en tiempo real (vía DocumentsController)
 * - Persistencia automática (Auto-save)
 * - Auditoría de Sesión (Audit Log)
 * - Firma Electrónica Certificada (PAdES)
 * - Modos de visualización (Borrador / Doble Ciego)
 * 
 * GUÍA DE REUSABILIDAD:
 * Para crear un nuevo documento, NO modifiques este archivo. 
 * Crea un componente nuevo (ej: ActaWizard.tsx) e invoca a <DIITRABuilderShell> 
 * pasando los campos específicos del nuevo documento como 'children'.
 */

interface BuilderSection {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface DIITRABuilderShellProps {
    title: string;
    subtitle: string;
    templateCode: string;
    sections: BuilderSection[];
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onSave?: (data: any) => Promise<void>;
    onClose: () => void;
    children: (activeTab: string, cowork: CoWorkHandle) => React.ReactNode;
}

const DIITRABuilderShell: React.FC<DIITRABuilderShellProps> = ({
    title,
    subtitle,
    templateCode,
    sections,
    formData,
    setFormData,
    onSave,
    onClose,
    children
}) => {
    const { user } = useAuth();
    
    // Motor CoWork: Sincronización en tiempo real para todos los campos
    const cowork = useCoWork({
        documentId: `${formData.Uuid || 'temp'}_core`,
        user: user ? coworkUserFromAuth({
            userUuid: user.id_referencia,
            nombreCompleto: user.nombre_completo,
            role: user.role
        }) : { id: 'guest', name: 'Invitado', role: 'Visitante', color: '#888', initials: 'IN' },
        enabled: !!formData.Uuid
    });

    const [activeTab, setActiveTab] = useState(sections[0]?.id || 'general');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isDraftMode, setIsDraftMode] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [signaturePassword, setSignaturePassword] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [auditLogs, setAuditLogs] = useState<{msg: string, type: string}[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!pdfBlob) {
            setPdfUrl(null);
            return;
        }
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pdfBlob]);

    const addAudit = (msg: string, type: string = 'info') => {
        setAuditLogs(prev => [{msg, type}, ...prev].slice(0, 8));
    };

    // ── Auto-save inteligente del núcleo (con debounce y dirty-check) ──
    const lastSavedSnapshotRef = useRef<string>('');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formDataRef = useRef(formData);
    const onSaveRef = useRef(onSave);

    useEffect(() => { formDataRef.current = formData; }, [formData]);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    const snapshotForm = (data: any) => {
        try {
            // Excluimos campos efímeros que cambian por render (audit, fecha, etc.)
            const { Uuid, Titulo, Nombre, ...rest } = data;
            return JSON.stringify({ Uuid, Titulo, Nombre, ...rest });
        } catch {
            return '';
        }
    };

    const handleSave = useCallback(async () => {
        const data = formDataRef.current;
        const saveFn = onSaveRef.current;
        if (!saveFn) return;
        const currentSnap = snapshotForm(data);
        // No guardar si no hay cambios desde la última vez
        if (currentSnap === lastSavedSnapshotRef.current) {
            return;
        }
        // No guardar si está vacío y sin UUID
        if (!data.Uuid && !data.Titulo && !data.Nombre) {
            return;
        }
        setIsSaving(true);
        try {
            await saveFn(data);
            lastSavedSnapshotRef.current = currentSnap;
            setLastSaved(new Date().toLocaleTimeString());
            addAudit("Sincronización de estado exitosa", "success");
        } catch (e) {
            addAudit("Fallo de persistencia en el núcleo", "error");
        } finally {
            setIsSaving(false);
        }
    }, []); // Estable: lee siempre de refs

    useEffect(() => {
        const currentSnap = snapshotForm(formData);
        if (currentSnap === lastSavedSnapshotRef.current) {
            return; // Sin cambios, no reiniciar timer
        }
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            handleSave();
        }, 3000);
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [formData]); // Solo reinicia cuando formData cambia realmente

    const handleGeneratePdf = async (blind = false) => {
        setIsGenerating(true);
        addAudit(`Renderizando ${templateCode} [${blind ? 'BLIND' : 'NORMAL'}]...`);
        try {
            const response = await api.post(
                `/documents/render?templateCode=${templateCode}&isDraft=${isDraftMode}&isBlind=${blind}`, 
                formData, 
                { responseType: 'blob' }
            );
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit("PDF Generado exitosamente", "success");
        } catch (error) {
            addAudit("Error de renderizado en el motor Scriban", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSign = async () => {
        if (!signaturePassword) return alert("Ingresa la clave de tu firma (.p12)");
        setIsSigning(true);
        addAudit("Iniciando proceso de firma electrónica PAdES...");
        try {
            const response = await api.post(`/projects/sign?password=${signaturePassword}`, {}, { responseType: 'blob' });
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit("Firma digital aplicada e integrada", "success");
        } catch (e) {
            addAudit("Error de firma: Clave o certificado inválido", "error");
        } finally {
            setIsSigning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-bg-deep/95 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-[1600px] h-[95vh] rounded-2xl border border-border-thin flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in">
                
                {/* Header Universal */}
                <div className="px-8 py-5 border-b border-border-thin bg-bg-deep/50 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="p-3 bg-text-main rounded-xl shadow-lg">
                            <Shield size={20} className="text-bg-deep" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-text-main tracking-tighter uppercase leading-none">
                                DIITRA <span className="text-text-dim font-light">Builder Core</span>
                            </h2>
                            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">Enterprise Document Engine v4.1.0</p>
                        </div>
                        <div className="h-8 w-[1px] bg-border-thin mx-2" />
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Núcleo Activo</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        {/* Indicadores de CoWork */}
                        <div className="flex items-center gap-4 px-4 py-2 bg-bg-deep rounded-xl border border-border-thin">
                            <div className="flex items-center gap-2 pr-4 border-r border-border-thin">
                                {cowork.session.isConnected ? (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">CoWork Online</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">CoWork Offline</span>
                                    </>
                                )}
                            </div>
                            
                            {cowork.session.connectedUsers.length > 0 && (
                                <div className="flex -space-x-2">
                                    {cowork.session.connectedUsers.map((u, i) => (
                                        <div 
                                            key={i} 
                                            className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] font-black text-white shadow-lg cursor-help transition-transform hover:-translate-y-1"
                                            style={{ backgroundColor: u.color }}
                                            title={`${u.name} (${u.role})`}
                                        >
                                            {u.initials}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Estado de Sincronización</span>
                            <div className="flex items-center gap-2 text-[10px] text-text-main font-black uppercase">
                                {isSaving || cowork.session.isSyncing ? (
                                    <><Clock size={12} className="animate-spin"/> Sincronizando...</>
                                ) : (
                                    <><CheckCircle size={12} className="text-green-500"/> {lastSaved ? `Sincronizado ${lastSaved}` : 'Listo'}</>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleSave} className="px-6 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-lg flex items-center gap-2">
                                <Save size={14} /> Guardar
                            </button>
                            <button onClick={onClose} className="px-6 py-2.5 bg-surface hover:bg-bg-deep border border-border-thin rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-main transition-colors">Cerrar</button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-80 border-r border-border-thin bg-surface p-8 flex flex-col gap-8">
                        <div>
                            <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-4 ml-2">Navegación del Documento</p>
                            <div className="space-y-1">
                                {sections.map(section => (
                                    <button 
                                        key={section.id}
                                        onClick={() => setActiveTab(section.id)} 
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === section.id ? 'bg-text-main text-bg-deep shadow-xl translate-x-2' : 'text-text-dim hover:bg-bg-deep hover:text-text-main'}`}
                                    >
                                        {section.icon} {section.label}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setActiveTab('output')} 
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-8 border ${activeTab === 'output' ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' : 'text-blue-500 border-blue-500/20 hover:bg-blue-500/10'}`}
                                >
                                    <FileText size={18} /> Finalizar y Firmar
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <div className="p-5 bg-bg-deep rounded-2xl border border-border-thin">
                                <p className="text-[10px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Clock size={14} className="text-text-dim" /> Auditoría de Sesión
                                </p>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {auditLogs.length === 0 && <p className="text-[9px] italic text-text-dim">Esperando acciones del núcleo...</p>}
                                    {auditLogs.map((log, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className={`w-1 h-auto rounded-full ${
                                                log.type === 'success' ? 'bg-green-500' :
                                                log.type === 'error' ? 'bg-red-500' :
                                                log.type === 'warning' ? 'bg-yellow-500' : 'bg-text-dim/30'
                                            }`} />
                                            <p className={`text-[9px] font-bold uppercase tracking-tight leading-relaxed ${
                                                log.type === 'success' ? 'text-green-500/80' :
                                                log.type === 'error' ? 'text-red-500/80' :
                                                log.type === 'warning' ? 'text-yellow-500/80' : 'text-text-dim'
                                            }`}>
                                                {log.msg}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Editor & Preview Area */}
                    <div className="flex-1 bg-bg-deep overflow-hidden flex">
                        
                        {activeTab !== 'output' ? (
                            <div className="flex-1 p-12 overflow-y-auto custom-scrollbar">
                                <div className="max-w-5xl mx-auto">
                                    <div className="mb-12">
                                        <h3 className="text-2xl font-black text-text-main tracking-tighter uppercase">{title}</h3>
                                        <p className="text-xs text-text-dim font-bold uppercase tracking-[0.2em] mt-1">{subtitle}</p>
                                        <div className="w-20 h-1.5 bg-text-main mt-6 rounded-full" />
                                    </div>
                                    {children(activeTab, cowork)}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 p-12 flex flex-col gap-8 animate-fade-in">
                                <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
                                    {/* Panel de Controles */}
                                    <div className="col-span-4 flex flex-col gap-6 overflow-y-auto pr-4 custom-scrollbar">
                                        <div className="p-8 bg-surface border border-border-thin rounded-2xl shadow-sm">
                                            <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                                <Settings size={18} className="text-text-main" /> Opciones de Emisión
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-bg-deep rounded-xl border border-border-thin">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-tight text-text-main">Modo Borrador</p>
                                                        <p className="text-[8px] text-text-dim uppercase tracking-widest mt-1">Marca de agua de seguridad</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={isDraftMode} onChange={(e) => setIsDraftMode(e.target.checked)} className="sr-only peer" />
                                                        <div className="w-11 h-6 bg-border-thin peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-text-main"></div>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3">
                                                    <button onClick={() => handleGeneratePdf(false)} className="w-full bg-text-main text-bg-deep px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 flex items-center justify-center gap-3 transition-all">
                                                        <FileText size={18}/> Generar Vista Previa
                                                    </button>
                                                    <button onClick={() => handleGeneratePdf(true)} className="w-full border border-text-main/30 text-text-main/60 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-text-main hover:text-bg-deep transition-all flex items-center justify-center gap-3">
                                                        <Users size={18}/> Modo Doble Ciego
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-surface border border-border-thin rounded-2xl shadow-sm border-t-4 border-t-blue-600">
                                            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Firma Digital PAdES</h4>
                                            <p className="text-[9px] text-text-dim uppercase tracking-widest mb-6 leading-relaxed">Sello de integridad institucional conforme a Ley de Comercio Electrónico.</p>
                                            <div className="space-y-4">
                                                <input 
                                                    type="password" 
                                                    placeholder="Contraseña Certificado (.p12)" 
                                                    value={signaturePassword}
                                                    onChange={(e) => setSignaturePassword(e.target.value)}
                                                    className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm focus:border-text-main outline-none transition-all"
                                                />
                                                <button 
                                                    onClick={handleSign}
                                                    disabled={!pdfBlob || isSigning}
                                                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${
                                                        !pdfBlob ? 'bg-bg-deep text-text-dim cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl'
                                                    }`}
                                                >
                                                    {isSigning ? <><Clock size={18} className="animate-spin"/> Firmando...</> : <><Shield size={18}/> Aplicar Firma Digital</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visor de PDF */}
                                    <div className="col-span-8 bg-bg-deep border border-border-thin rounded-2xl p-2 flex flex-col shadow-inner relative overflow-hidden">
                                        {isGenerating ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                                <div className="w-16 h-16 border-4 border-text-main border-t-transparent rounded-full animate-spin shadow-lg" />
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-text-main uppercase tracking-[0.3em]">DIITRA Rendering Engine</p>
                                                    <p className="text-[9px] text-text-dim uppercase tracking-widest mt-2">Construyendo evidencia digital de alta fidelidad...</p>
                                                </div>
                                            </div>
                                        ) : pdfUrl ? (
                                            <iframe src={pdfUrl} className="flex-1 w-full bg-white rounded-xl border-none shadow-2xl"></iframe>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-text-dim/20">
                                                <FileText size={120} strokeWidth={0.5} className="mb-8" />
                                                <p className="text-sm font-black uppercase tracking-[0.5em]">Esperando Emisión</p>
                                                <p className="text-[10px] mt-3 font-bold uppercase tracking-widest">Haz clic en 'Generar Vista Previa' para visualizar</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default DIITRABuilderShell;
