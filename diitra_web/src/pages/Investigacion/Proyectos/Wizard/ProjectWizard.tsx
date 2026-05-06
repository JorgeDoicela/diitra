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

    const [formData, setFormData] = useState({
        titulo: '',
        tiempoEjecucion: '',
        lineaInvestigacion: '',
        tipoInvestigacion: '',
        ods: '',
        antecedentes: '',
        descripcionProyecto: '',
        justificacion: '',
        marcoTeorico: '',
        metodologia: ''
    });

    // Simulación de auto-guardado colaborativo (PATCH)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (formData.titulo || formData.antecedentes) {
                handlePartialSave();
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

    const handleGeneratePdf = async () => {
        try {
            const response = await api.post('/projects/generate-pdf', formData, { responseType: 'blob' });
            setPdfBlob(new Blob([response.data], { type: 'application/pdf' }));
        } catch (error) {
            console.error('Error generando PDF', error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-bg-deep/90 flex justify-center items-center p-4">
            <div className="bg-surface w-full max-w-6xl h-[90vh] rounded-xl border border-border-thin flex flex-col shadow-2xl overflow-hidden animate-fade-in">
                
                {/* Header del Workspace */}
                <div className="px-6 py-4 border-b border-border-thin bg-bg-deep flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-text-main tracking-tight uppercase">
                            Espacio de Trabajo: <span className="text-text-dim font-normal normal-case">Proyecto Borrador</span>
                        </h2>
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 border border-bg-deep text-[8px] flex justify-center items-center font-bold text-white">TU</div>
                            <div className="w-6 h-6 rounded-full bg-green-600 border border-bg-deep text-[8px] flex justify-center items-center font-bold text-white">DIR</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-widest font-bold">
                            {isSaving ? (
                                <><Clock size={12} className="animate-spin"/> Guardando...</>
                            ) : (
                                <><CheckCircle size={12} className="text-green-500"/> Guardado {lastSaved}</>
                            )}
                        </div>
                        <button onClick={onClose} className="text-text-dim hover:text-text-main text-[10px] font-bold uppercase tracking-widest">Salir</button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-64 border-r border-border-thin bg-surface p-4 space-y-2">
                        <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'general' ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:bg-bg-deep'}`}>
                            <BookOpen size={16} /> Identificación
                        </button>
                        <button onClick={() => setActiveTab('especificacion')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'especificacion' ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:bg-bg-deep'}`}>
                            <Target size={16} /> Especificación
                        </button>
                        <button onClick={() => setActiveTab('fundamentacion')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'fundamentacion' ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:bg-bg-deep'}`}>
                            <Users size={16} /> Fundamentación
                        </button>
                        <button onClick={() => setActiveTab('cierre')} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'cierre' ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:bg-bg-deep'}`}>
                            <FileText size={16} /> Bandeja de Cierre
                        </button>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 p-8 overflow-y-auto bg-bg-deep">
                        
                        {activeTab === 'general' && (
                            <div className="space-y-6 max-w-3xl animate-fade-in">
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest border-b border-border-thin pb-2">Identificación Básica</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Título del Proyecto</label>
                                    <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Línea de Investigación</label>
                                        <select name="lineaInvestigacion" value={formData.lineaInvestigacion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none">
                                            <option value="">Seleccione...</option>
                                            <option value="Tecnologías de la Información">Tecnologías de la Información</option>
                                            <option value="Desarrollo de Software">Desarrollo de Software</option>
                                            <option value="Inteligencia Artificial">Inteligencia Artificial</option>
                                            <option value="Ciberseguridad">Ciberseguridad</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Tipo de Investigación</label>
                                        <select name="tipoInvestigacion" value={formData.tipoInvestigacion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none">
                                            <option value="">Seleccione...</option>
                                            <option value="Investigación Básica">Investigación Básica</option>
                                            <option value="Investigación Aplicada">Investigación Aplicada</option>
                                            <option value="Desarrollo Tecnológico">Desarrollo Tecnológico</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">ODS Principal</label>
                                        <select name="ods" value={formData.ods} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none">
                                            <option value="">Seleccione...</option>
                                            <option value="ODS 4: Educación de Calidad">ODS 4: Educación de Calidad</option>
                                            <option value="ODS 9: Industria, Innovación e Infraestructura">ODS 9: Industria, Innovación e Infraestructura</option>
                                            <option value="ODS 11: Ciudades y Comunidades Sostenibles">ODS 11: Ciudades y Comunidades Sostenibles</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Tiempo de Ejecución</label>
                                        <input type="text" name="tiempoEjecucion" value={formData.tiempoEjecucion} onChange={handleChange} className="w-full bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'especificacion' && (
                            <div className="space-y-6 max-w-3xl animate-fade-in">
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest border-b border-border-thin pb-2 flex justify-between">
                                    Especificación Técnica
                                </h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Antecedentes</label>
                                    <textarea name="antecedentes" value={formData.antecedentes} onChange={handleChange} className="w-full h-32 bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Descripción del Proyecto</label>
                                    <textarea name="descripcionProyecto" value={formData.descripcionProyecto} onChange={handleChange} className="w-full h-32 bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Justificación</label>
                                    <textarea name="justificacion" value={formData.justificacion} onChange={handleChange} className="w-full h-32 bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'fundamentacion' && (
                            <div className="space-y-6 max-w-3xl animate-fade-in">
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest border-b border-border-thin pb-2">
                                    Fundamentación Científica
                                </h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Marco Teórico</label>
                                    <textarea name="marcoTeorico" value={formData.marcoTeorico} onChange={handleChange} className="w-full h-48 bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-1">Metodología</label>
                                    <textarea name="metodologia" value={formData.metodologia} onChange={handleChange} className="w-full h-48 bg-surface border border-border-thin rounded px-4 py-3 text-sm text-text-main focus:border-text-main outline-none" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'cierre' && (
                            <div className="h-full flex flex-col animate-fade-in">
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest border-b border-border-thin pb-2 mb-6">Generación y Firmas</h3>
                                <div className="flex-1 grid grid-cols-2 gap-8">
                                    <div className="flex flex-col justify-center items-center text-center p-8 border border-border-thin rounded bg-surface">
                                        <FileText size={48} className="text-text-main mb-4" />
                                        <p className="text-sm text-text-dim mb-6">DIITRA Builder generará el protocolo oficial inyectando los datos trabajados en equipo mediante DIITRA CoWork.</p>
                                        <button onClick={handleGeneratePdf} className="bg-text-main text-bg-deep px-6 py-2 rounded text-xs font-bold uppercase tracking-widest hover:opacity-90">
                                            Congelar y Generar PDF
                                        </button>
                                    </div>
                                    <div className="bg-surface border border-border-thin rounded p-4 flex flex-col">
                                        {pdfBlob ? (
                                            <>
                                                <iframe src={URL.createObjectURL(pdfBlob)} className="flex-1 w-full bg-white mb-4 rounded border border-border-thin"></iframe>
                                                <button className="w-full bg-blue-600 text-white px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500 flex items-center justify-center gap-2">
                                                    <Upload size={14}/> Subir Documento Firmado (.pdf)
                                                </button>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-text-dim text-sm">Genera el PDF primero</div>
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
