import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, Save, Users, Clock, Settings, BookOpen, Target, Upload } from 'lucide-react';
import api from '../../../../api/axios_config';

interface ProjectWorkspaceProps {
    onClose: () => void;
}

const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [isDraftMode, setIsDraftMode] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [signaturePassword, setSignaturePassword] = useState('');
    const [isSigning, setIsSigning] = useState(false);
    const [auditLogs, setAuditLogs] = useState<{msg: string, type: string}[]>([]);

    const [formData, setFormData] = useState({
        titulo: '',
        tiempo_ejecucion: '',
        linea_investigacion: '',
        tipo_investigacion: '',
        ods: '',
        antecedentes: '',
        descripcion_proyecto: '',
        justificacion: '',
        marco_teorico: '',
        metodologia: ''
    });

    const addAudit = (msg: string, type: string = 'info') => {
        setAuditLogs(prev => [{msg, type}, ...prev].slice(0, 5));
    };

    // Simulación de auto-guardado colaborativo (PATCH)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formData.titulo || formData.antecedentes) {
                handlePartialSave();
                addAudit("Sincronización CoWork: Snapshot incremental guardado", "success");
            }
        }, 1500);
        return () => clearTimeout(timeoutId);
    }, [formData]);

    const handlePartialSave = async () => {
        setIsSaving(true);
        try {
            // PATCH a la API
            // await api.patch('/projects/123/section', formData);
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGeneratePdf = async (blind = false) => {
        setIsGenerating(true);
        addAudit(`Iniciando DIITRA Builder [${blind ? 'Blind' : 'Normal'}]...`);
        try {
            const response = await api.post(
                `/projects/generate-pdf?isDraft=${isDraftMode}&isBlind=${blind}`, 
                formData, 
                { responseType: 'blob' }
            );
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit("PDF Generado: QR de verificación inyectado", "success");
            if (isDraftMode) addAudit("Marca de agua 'BORRADOR' aplicada", "warning");
        } catch (error) {
            addAudit("Error en renderizado de PDF", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSign = async () => {
        if (!signaturePassword) return alert("Ingresa la clave de tu firma (.p12)");
        setIsSigning(true);
        addAudit("Iniciando firma PAdES con iText7 + BouncyCastle...");
        try {
            const response = await api.post(`/projects/sign?password=${signaturePassword}`, {}, { responseType: 'blob' });
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
            addAudit("Documento Firmado Digitalmente (Integridad LTV confirmada)", "success");
        } catch (e) {
            addAudit("Error de firma: Clave incorrecta o certificado inválido", "error");
        } finally {
            setIsSigning(false);
        }
    };

    const handlePublish = () => {
        addAudit("Conectando con DSpace 7 via REST API...");
        setTimeout(() => {
            addAudit("Publicación exitosa: Handle institucional generado", "success");
            alert("Documento publicado exitosamente en el Repositorio Digital.");
        }, 2000);
    };

    return (
        <div className="fixed inset-0 z-50 bg-bg-deep/90 flex justify-center items-center p-4">
            <div className="bg-surface w-full max-w-7xl h-[95vh] rounded-xl border border-border-thin flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                
                {/* Header del Workspace */}
                <div className="px-6 py-4 border-b border-border-thin bg-bg-deep flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-text-main rounded-lg">
                            <Settings size={18} className="text-bg-deep" />
                        </div>
                        <h2 className="text-lg font-bold text-text-main tracking-tight uppercase">
                            DIITRA <span className="text-text-dim font-normal">Builder Workspace</span>
                        </h2>
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Núcleo Activo v4.0.2</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-widest font-bold">
                            {isSaving ? (
                                <><Clock size={12} className="animate-spin text-text-main"/> Sincronizando CoWork...</>
                            ) : (
                                <><CheckCircle size={12} className="text-green-500"/> Estado: Persistido {lastSaved}</>
                            )}
                        </div>
                        <button onClick={onClose} className="px-4 py-2 bg-surface hover:bg-bg-deep border border-border-thin rounded text-[10px] font-bold uppercase tracking-widest text-text-main transition-colors">Cerrar Workspace</button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-72 border-r border-border-thin bg-surface p-6 flex flex-col gap-6">
                        <div className="space-y-1">
                            <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-3 ml-2">Fases de Postulación</p>
                            <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-text-main text-bg-deep shadow-lg' : 'text-text-dim hover:bg-bg-deep'}`}>
                                <BookOpen size={16} /> 01. Identificación
                            </button>
                            <button onClick={() => setActiveTab('especificacion')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'especificacion' ? 'bg-text-main text-bg-deep shadow-lg' : 'text-text-dim hover:bg-bg-deep'}`}>
                                <Target size={16} /> 02. Especificación
                            </button>
                            <button onClick={() => setActiveTab('fundamentacion')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'fundamentacion' ? 'bg-text-main text-bg-deep shadow-lg' : 'text-text-dim hover:bg-bg-deep'}`}>
                                <Users size={16} /> 03. Fundamentación
                            </button>
                            <button onClick={() => setActiveTab('cierre')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'cierre' ? 'bg-text-main text-bg-deep shadow-lg' : 'text-text-dim hover:bg-bg-deep'}`}>
                                <FileText size={16} /> 04. Cierre y Firma
                            </button>
                        </div>

                        <div className="mt-auto border-t border-border-thin pt-6">
                            <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest mb-3">Audit Log (Nucleus)</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                {auditLogs.length === 0 && <p className="text-[9px] italic text-text-dim">Esperando acciones...</p>}
                                {auditLogs.map((log, i) => (
                                    <div key={i} className={`p-2 rounded text-[8px] border ${
                                        log.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                                        log.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                                        log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                        'bg-bg-deep border-border-thin text-text-dim'
                                    }`}>
                                        {log.msg}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 p-10 overflow-y-auto bg-bg-deep">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-8 max-w-4xl animate-fade-in">
                                <div className="flex justify-between items-end border-b border-border-thin pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main uppercase tracking-tight">Identificación de la Propuesta</h3>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest">Fase Inicial - Datos Administrativos</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-bold text-text-main bg-surface px-3 py-1 rounded border border-border-thin">PROY-2026-001</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Título del Proyecto de Investigación / Innovación</label>
                                        <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none transition-all shadow-sm" placeholder="Ej: Implementación de IA para la gestión de residuos..." />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Línea de Investigación SENESCYT</label>
                                            <select name="linea_investigacion" value={formData.linea_investigacion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none">
                                                <option value="">Seleccione...</option>
                                                <option value="Tecnologías de la Información">Tecnologías de la Información</option>
                                                <option value="Desarrollo de Software">Desarrollo de Software</option>
                                                <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                                                <option value="Ciberseguridad">Ciberseguridad</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Área del Conocimiento (CACES)</label>
                                            <select name="tipo_investigacion" value={formData.tipo_investigacion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none">
                                                <option value="">Seleccione...</option>
                                                <option value="Investigación Básica">Investigación Básica</option>
                                                <option value="Investigación Aplicada">Investigación Aplicada</option>
                                                <option value="Desarrollo Tecnológico">Desarrollo Tecnológico</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'especificacion' && (
                            <div className="space-y-8 max-w-4xl animate-fade-in">
                                <div className="flex justify-between items-end border-b border-border-thin pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main uppercase tracking-tight">Especificación Técnica</h3>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest">Fase de Redacción Técnica - DIITRA CoWork Activo</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">DIITRA CoWork: Edición en tiempo real habilitada para este proyecto.</span>
                                </div>
                                <div className="grid grid-cols-1 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Antecedentes y Estado del Arte</label>
                                        <textarea name="antecedentes" value={formData.antecedentes} onChange={handleChange} className="w-full h-40 bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none resize-none shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Descripción Detallada</label>
                                        <textarea name="descripcion_proyecto" value={formData.descripcion_proyecto} onChange={handleChange} className="w-full h-40 bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none resize-none shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'fundamentacion' && (
                            <div className="space-y-8 max-w-4xl animate-fade-in">
                                <div className="flex justify-between items-end border-b border-border-thin pb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main uppercase tracking-tight">Fundamentación Científica</h3>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest">Base Epistemológica y Metodológica</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-8">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Marco Teórico y Referencial</label>
                                        <textarea name="marco_teorico" value={formData.marco_teorico} onChange={handleChange} className="w-full h-64 bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none resize-none shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Metodología de Investigación</label>
                                        <textarea name="metodologia" value={formData.metodologia} onChange={handleChange} className="w-full h-64 bg-surface border border-border-thin rounded-lg px-5 py-4 text-sm text-text-main focus:ring-1 focus:ring-text-main outline-none resize-none shadow-sm" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'cierre' && (
                            <div className="h-full flex flex-col animate-fade-in">
                                <div className="flex justify-between items-end border-b border-border-thin pb-4 mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-text-main uppercase tracking-tight">Cierre, Firma y Publicación</h3>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest">Fase de Integración Enterprise - Nucleus Builder v4.0</p>
                                    </div>
                                </div>
                                
                                <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                                    {/* Panel de Controles (Izquierda) */}
                                    <div className="col-span-5 flex flex-col gap-6 overflow-y-auto pr-2">
                                        {/* Bloque 1: Configuración de Salida */}
                                        <div className="p-6 bg-surface border border-border-thin rounded-xl shadow-sm">
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Settings size={14} className="text-text-main" /> Configuración de Motor
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-bg-deep rounded border border-border-thin">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">Marca de Agua de Seguridad</span>
                                                        <span className="text-[8px] text-text-dim uppercase tracking-tighter italic">Nivel de Confidencialidad: Interno</span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" checked={isDraftMode} onChange={(e) => setIsDraftMode(e.target.checked)} className="sr-only peer" />
                                                        <div className="w-9 h-5 bg-border-thin peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-text-main"></div>
                                                    </label>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button onClick={() => handleGeneratePdf(false)} className="bg-text-main text-bg-deep px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 flex items-center justify-center gap-2">
                                                        <FileText size={14}/> Preview Oficial
                                                    </button>
                                                    <button onClick={() => handleGeneratePdf(true)} className="border border-text-main text-text-main px-4 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-text-main hover:text-bg-deep transition-all flex items-center justify-center gap-2">
                                                        <Users size={14}/> Double-Blind
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bloque 2: Firma Electrónica (FirmaEC Spec) */}
                                        <div className="p-6 bg-surface border border-border-thin rounded-xl shadow-sm">
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <CheckCircle size={14} className="text-text-main" /> Firma Electrónica (.p12)
                                            </h4>
                                            <div className="space-y-4">
                                                <p className="text-[9px] text-text-dim uppercase leading-relaxed">Este módulo utiliza el motor de firma PAdES con sellado de tiempo para asegurar validez jurídica.</p>
                                                <div className="relative">
                                                    <input 
                                                        type="password" 
                                                        placeholder="Contraseña del Certificado" 
                                                        value={signaturePassword}
                                                        onChange={(e) => setSignaturePassword(e.target.value)}
                                                        className="w-full bg-bg-deep border border-border-thin rounded-lg px-4 py-3 text-sm focus:border-text-main outline-none"
                                                    />
                                                </div>
                                                <button 
                                                    onClick={handleSign}
                                                    disabled={!pdfBlob || isSigning}
                                                    className={`w-full py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                                        !pdfBlob ? 'bg-bg-deep text-text-dim cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
                                                    }`}
                                                >
                                                    {isSigning ? <><Clock size={14} className="animate-spin"/> Firmando...</> : <><Save size={14}/> Aplicar Firma Digital</>}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Bloque 3: Repositorio Digital */}
                                        <div className="p-6 bg-surface border border-border-thin rounded-xl shadow-sm border-t-4 border-t-blue-600">
                                            <h4 className="text-[11px] font-bold uppercase tracking-widest mb-2">Repositorio DSpace</h4>
                                            <p className="text-[9px] text-text-dim uppercase mb-4">Exportación automatizada de metadatos CACES/SENESCYT.</p>
                                            <button 
                                                onClick={handlePublish}
                                                disabled={!pdfBlob}
                                                className="w-full border border-blue-600 text-blue-600 py-3 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                            >
                                                <Upload size={14}/> Publicar en Repositorio
                                            </button>
                                        </div>
                                    </div>

                                    {/* Visor de PDF (Derecha) */}
                                    <div className="col-span-7 bg-bg-deep border border-border-thin rounded-xl p-6 flex flex-col shadow-inner relative group">
                                        {isGenerating ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-4">
                                                <div className="w-12 h-12 border-4 border-text-main border-t-transparent rounded-full animate-spin" />
                                                <p className="text-[10px] font-bold text-text-main uppercase tracking-widest">Generando Evidencia Digital...</p>
                                            </div>
                                        ) : pdfBlob ? (
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex justify-between items-center mb-4 bg-surface p-3 rounded-lg border border-border-thin">
                                                    <span className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-2">
                                                        <CheckCircle size={14} /> PDF Listo para Auditoría
                                                    </span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[9px] font-bold text-text-dim uppercase bg-bg-deep px-2 py-1 rounded">ECC-SHA256</span>
                                                        <span className="text-[9px] font-bold text-text-dim uppercase bg-bg-deep px-2 py-1 rounded">iText 7.2.1</span>
                                                    </div>
                                                </div>
                                                <iframe src={URL.createObjectURL(pdfBlob)} className="flex-1 w-full bg-white rounded-lg border border-border-thin shadow-2xl"></iframe>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-text-dim/40">
                                                <FileText size={80} strokeWidth={1} className="mb-6" />
                                                <p className="text-xs font-bold uppercase tracking-[0.3em]">DIITRA BUILDER</p>
                                                <p className="text-[10px] mt-2 italic uppercase tracking-widest">Configura y genera la vista previa</p>
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

export default ProjectWorkspace;
