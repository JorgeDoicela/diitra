import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, FileText, Save, Users, Clock, Settings, Shield } from 'lucide-react';
import api from '../../api/axios_config';
import type { CoWorkHandle } from '../../core/cowork/types';

/**
 * DIITRA BUILDER CORE — SHELL UNIVERSAL DE DOCUMENTACIÓN v2.0
 * -------------------------------------------------------------------------
 * Marco profesional e institucional reutilizable para TODOS los tipos de
 * documentos del sistema DIITRA (Protocolos, Rúbricas, Informes, Actas...).
 *
 * PRINCIPIO DE DISEÑO (v2.0 — Inversión de Dependencia):
 * El Shell ya no instancia useCoWork() internamente. Recibe el CoWorkHandle
 * como prop desde el padre. Esto permite:
 *
 *   1. Usar el Shell con colaboración real:
 *      const cowork = useCoWork({ documentId, user });
 *      <DIITRABuilderShell cowork={cowork} ... />
 *
 *   2. Usar el Shell SIN colaboración (documentos del Director, reportes, etc.):
 *      const cowork = createNoOpCoWork();
 *      <DIITRABuilderShell cowork={cowork} ... />
 *
 * GUÍA DE REUSABILIDAD:
 * Para crear un nuevo documento, NO modifiques este archivo.
 * Registra el esquema en DocumentTemplateRegistry y el componente
 * en DocumentComponentRegistry. El DocumentEditor lo ensambla todo.
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
    cowork: CoWorkHandle;                                // ← Inyectado desde el padre (v2.0)
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
    onSave,
    onClose,
    cowork,      // ← Recibido como prop
    children
}) => {
    const [activeTab, setActiveTab]               = useState(sections[0]?.id || 'general');
    const [isSaving, setIsSaving]                 = useState(false);
    const [lastSaved, setLastSaved]               = useState<string | null>(null);
    const [pdfBlob, setPdfBlob]                   = useState<Blob | null>(null);
    const [isDraftMode, setIsDraftMode]           = useState(true);
    const [isGenerating, setIsGenerating]         = useState(false);
    const [signaturePassword, setSignaturePassword] = useState('');
    const [isSigning, setIsSigning]               = useState(false);
    const [auditLogs, setAuditLogs]               = useState<{ msg: string, type: string }[]>([]);
    const [pdfUrl, setPdfUrl]                     = useState<string | null>(null);
    const [showMobileSections, setShowMobileSections] = useState(false);

    // ── Gestión de URL del PDF (revocación de ObjectURL para evitar memory leaks) ──
    useEffect(() => {
        if (!pdfBlob) { setPdfUrl(null); return; }
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pdfBlob]);

    const addAudit = useCallback((msg: string, type: string = 'info') => {
        setAuditLogs(prev => [{ msg, type }, ...prev].slice(0, 8));
    }, []);

    // ── Auto-save inteligente del núcleo (dirty-check + debounce 3s) ──
    const lastSavedSnapshotRef = useRef<string>('');
    const saveTimeoutRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formDataRef          = useRef(formData);
    const onSaveRef            = useRef(onSave);

    useEffect(() => { formDataRef.current = formData; }, [formData]);
    useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

    const snapshotForm = (data: any): string => {
        try {
            const { Uuid, Titulo, Nombre, ...rest } = data;
            return JSON.stringify({ Uuid, Titulo, Nombre, ...rest });
        } catch { return ''; }
    };

    const handleSave = useCallback(async () => {
        const data   = formDataRef.current;
        const saveFn = onSaveRef.current;
        if (!saveFn) return;

        const currentSnap = snapshotForm(data);
        if (currentSnap === lastSavedSnapshotRef.current) return; // Sin cambios
        if (!data.Uuid && !data.Titulo && !data.Nombre) return;   // Formulario vacío

        setIsSaving(true);
        try {
            await saveFn(data);
            lastSavedSnapshotRef.current = currentSnap;
            setLastSaved(new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            addAudit('Sincronización de estado exitosa', 'success');
        } catch {
            addAudit('Fallo de persistencia en el núcleo', 'error');
        } finally {
            setIsSaving(false);
        }
    }, [addAudit]);

    useEffect(() => {
        const currentSnap = snapshotForm(formData);
        if (currentSnap === lastSavedSnapshotRef.current) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => { handleSave(); }, 3000);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [formData, handleSave]);

    // ── Generación de PDF ──
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
            addAudit('PDF Generado exitosamente', 'success');
        } catch {
            addAudit('Error de renderizado en el motor Scriban', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Firma Electrónica PAdES ──
    const handleSign = async () => {
        if (!signaturePassword) return alert('Ingresa la clave de tu firma (.p12)');
        setIsSigning(true);
        addAudit('Iniciando proceso de firma electrónica PAdES...');
        try {
            const response = await api.post(
                `/projects/sign?password=${signaturePassword}`,
                {},
                { responseType: 'blob' }
            );
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit('Firma digital aplicada e integrada', 'success');
        } catch {
            addAudit('Error de firma: Clave o certificado inválido', 'error');
        } finally {
            setIsSigning(false);
        }
    };

    // ── Indicadores de estado del CoWork (memoizados para evitar re-renders) ──
    const isOnline   = cowork.session.isConnected;
    const isSyncing  = isSaving || cowork.session.isSyncing;
    const users      = cowork.session.connectedUsers;

    return (
        <div className="fixed inset-0 z-[100] bg-bg-deep flex justify-center items-center p-0 md:p-0 backdrop-blur-sm">
            <div className="bg-surface w-full h-full flex flex-col shadow-2xl overflow-hidden animate-fade-in">

                {/* ── Header Universal ── */}
                <div className="px-4 md:px-8 py-3 md:py-5 border-b border-border-thin bg-bg-deep/50 flex flex-col lg:flex-row justify-between items-center gap-4 lg:gap-0">
                    <div className="flex items-center justify-between w-full lg:w-auto gap-4 md:gap-6">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="p-2 md:p-3 bg-text-main rounded-xl shadow-lg shrink-0">
                                <Shield size={18} className="text-bg-deep md:w-[20px]" />
                            </div>
                            <div>
                                <h2 className="text-sm md:text-xl font-black text-text-main tracking-tighter uppercase leading-none">
                                    DIITRA <span className="text-text-dim font-light hidden sm:inline">Builder Core</span>
                                </h2>
                                <p className="text-[8px] md:text-[10px] text-text-dim font-bold uppercase tracking-widest mt-1">v2.0.0</p>
                            </div>
                            <div className="h-6 md:h-8 w-[1px] bg-border-thin mx-1 md:mx-2" />
                            <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1 md:py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[7px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">Activo</span>
                            </div>
                        </div>

                        {/* Botones móviles */}
                        <div className="lg:hidden flex items-center gap-2">
                            <button
                                onClick={() => setShowMobileSections(!showMobileSections)}
                                className={`p-2 rounded-lg border transition-all ${showMobileSections ? 'bg-text-main text-bg-deep border-text-main' : 'bg-surface text-text-dim border-border-thin'}`}
                            >
                                <Settings size={18} />
                            </button>
                            <button onClick={onClose} className="p-2 bg-surface border border-border-thin rounded-lg text-text-dim">
                                <Clock size={18} className="rotate-45" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between w-full lg:w-auto gap-4 md:gap-8">
                        {/* ── Indicadores CoWork ── */}
                        <div className="flex items-center gap-2 md:gap-4 px-3 md:px-4 py-1.5 md:py-2 bg-bg-deep rounded-xl border border-border-thin">
                            {/* Estado de conexión */}
                            <div className="flex items-center gap-1.5 md:gap-2 pr-2 md:pr-4 border-r border-border-thin">
                                {isOnline ? (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[7px] md:text-[9px] font-black text-green-500 uppercase tracking-widest">Online</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                        <span className="text-[7px] md:text-[9px] font-black text-red-500 uppercase tracking-widest">Offline</span>
                                    </>
                                )}
                            </div>

                            {/* Avatares de colaboradores conectados */}
                            {users.length > 0 && (
                                <div className="flex -space-x-1.5 md:-space-x-2">
                                    {users.map((u, i) => (
                                        <div
                                            key={`${u.id}-${i}`}
                                            className="w-5 h-5 md:w-7 md:h-7 rounded-full border border-surface flex items-center justify-center text-[7px] md:text-[10px] font-black text-white shadow-lg cursor-help transition-transform hover:-translate-y-1"
                                            style={{ backgroundColor: u.color }}
                                            title={`${u.name} (${u.role})`}
                                        >
                                            {u.initials}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Estado de sincronización */}
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[7px] md:text-[9px] font-bold text-text-dim uppercase tracking-widest mb-1">Sincronización</span>
                            <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] text-text-main font-black uppercase">
                                {isSyncing ? (
                                    <><Clock size={10} className="animate-spin" /> ...</>
                                ) : (
                                    <><CheckCircle size={10} className="text-green-500" /> {lastSaved ? lastSaved : 'Listo'}</>
                                )}
                            </div>
                        </div>

                        {/* Acciones de cabecera */}
                        <div className="flex gap-2 md:gap-3">
                            <button
                                onClick={handleSave}
                                className="flex-1 lg:flex-none px-4 md:px-6 py-2 md:py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-white transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <Save size={12} /> <span className="hidden xs:inline">Guardar</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="hidden lg:flex px-6 py-2.5 bg-surface hover:bg-bg-deep border border-border-thin rounded-lg text-[10px] font-bold uppercase tracking-widest text-text-main transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* ── Sidebar de Navegación ── */}
                    <div className={`
                        ${showMobileSections ? 'fixed inset-0 top-[60px] z-[70] bg-surface' : 'hidden lg:flex'}
                        w-full lg:w-80 border-r border-border-thin bg-surface p-6 md:p-8 flex flex-col gap-6 md:gap-8 overflow-y-auto
                    `}>
                        <div className="flex lg:hidden justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">Navegación</p>
                            <button onClick={() => setShowMobileSections(false)} className="text-text-main font-bold">Cerrar Menú</button>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em] mb-4 lg:ml-2">Navegación del Documento</p>
                            <div className="space-y-1">
                                {sections.map(section => (
                                    <button
                                        key={section.id}
                                        onClick={() => { setActiveTab(section.id); setShowMobileSections(false); }}
                                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === section.id ? 'bg-text-main text-bg-deep shadow-xl lg:translate-x-2' : 'text-text-dim hover:bg-bg-deep hover:text-text-main'}`}
                                    >
                                        {section.icon} {section.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setActiveTab('output'); setShowMobileSections(false); }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all mt-8 border ${activeTab === 'output' ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' : 'text-blue-500 border-blue-500/20 hover:bg-blue-500/10'}`}
                                >
                                    <FileText size={18} /> Finalizar y Firmar
                                </button>
                            </div>
                        </div>

                        {/* ── Auditoría de Sesión ── */}
                        <div className="mt-auto hidden md:block">
                            <div className="p-5 bg-bg-deep rounded-2xl border border-border-thin">
                                <p className="text-[10px] font-black text-text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Clock size={14} className="text-text-dim" /> Auditoría de Sesión
                                </p>
                                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {auditLogs.length === 0 && <p className="text-[9px] italic text-text-dim">Esperando acciones del núcleo...</p>}
                                    {auditLogs.map((log, i) => (
                                        <div key={i} className="flex gap-3">
                                            <div className={`w-1 h-auto rounded-full ${log.type === 'success' ? 'bg-green-500' : log.type === 'error' ? 'bg-red-500' : log.type === 'warning' ? 'bg-yellow-500' : 'bg-text-dim/30'}`} />
                                            <p className={`text-[9px] font-bold uppercase tracking-tight leading-relaxed ${log.type === 'success' ? 'text-green-500/80' : log.type === 'error' ? 'text-red-500/80' : log.type === 'warning' ? 'text-yellow-500/80' : 'text-text-dim'}`}>
                                                {log.msg}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Área Principal: Editor & Visor PDF ── */}
                    <div className="flex-1 bg-bg-deep overflow-hidden flex">
                        {activeTab !== 'output' ? (
                            <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
                                <div className="max-w-5xl mx-auto">
                                    <div className="mb-8 md:mb-12">
                                        <h3 className="text-xl md:text-2xl font-black text-text-main tracking-tighter uppercase">{title}</h3>
                                        <p className="text-[10px] md:text-xs text-text-dim font-bold uppercase tracking-[0.2em] mt-1">{subtitle}</p>
                                        <div className="w-16 md:w-20 h-1 md:h-1.5 bg-text-main mt-4 md:mt-6 rounded-full" />
                                    </div>
                                    {/* El cowork se pasa a los children para que los campos colaborativos lo consuman */}
                                    {children(activeTab, cowork)}
                                </div>
                            </div>
                        ) : (
                            /* ── Panel de Finalización y Firma ── */
                            <div className="flex-1 p-12 flex flex-col gap-8 animate-fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 flex-1 overflow-hidden overflow-y-auto lg:overflow-hidden p-2">
                                    {/* Panel de Controles */}
                                    <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 overflow-y-auto lg:pr-4 custom-scrollbar">
                                        {/* Modo Borrador / Emisión */}
                                        <div className="p-6 md:p-8 bg-surface border border-border-thin rounded-2xl shadow-sm">
                                            <h4 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                                <Settings size={18} className="text-text-main" /> Emisión
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
                                                        <FileText size={18} /> Generar Vista Previa
                                                    </button>
                                                    <button onClick={() => handleGeneratePdf(true)} className="w-full border border-text-main/30 text-text-main/60 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-text-main hover:text-bg-deep transition-all flex items-center justify-center gap-3">
                                                        <Users size={18} /> Modo Doble Ciego
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Firma Digital PAdES */}
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
                                                    className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all ${!pdfBlob ? 'bg-bg-deep text-text-dim cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl'}`}
                                                >
                                                    {isSigning ? <><Clock size={18} className="animate-spin" /> Firmando...</> : <><Shield size={18} /> Aplicar Firma Digital</>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visor de PDF */}
                                    <div className="col-span-1 lg:col-span-8 bg-bg-deep border border-border-thin rounded-2xl p-2 flex flex-col shadow-inner relative overflow-hidden min-h-[500px]">
                                        {isGenerating ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-6">
                                                <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-text-main border-t-transparent rounded-full animate-spin shadow-lg" />
                                                <div className="text-center px-4">
                                                    <p className="text-[10px] md:text-xs font-black text-text-main uppercase tracking-[0.3em]">Rendering Engine</p>
                                                    <p className="text-[8px] md:text-[9px] text-text-dim uppercase tracking-widest mt-2">Construyendo evidencia digital...</p>
                                                </div>
                                            </div>
                                        ) : pdfUrl ? (
                                            <iframe src={pdfUrl} className="flex-1 w-full bg-white rounded-xl border-none shadow-2xl" title={`Vista previa — ${title}`} />
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-text-dim/20 p-8">
                                                <FileText size={80} strokeWidth={0.5} className="mb-6 lg:mb-8 md:w-[120px]" />
                                                <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-center">Esperando Emisión</p>
                                                <button onClick={() => handleGeneratePdf(false)} className="mt-6 px-6 py-3 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest lg:hidden">
                                                    Generar PDF
                                                </button>
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

export default React.memo(DIITRABuilderShell);
