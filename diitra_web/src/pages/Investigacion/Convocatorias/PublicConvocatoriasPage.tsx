import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PenTool, Calendar, DollarSign, ExternalLink, Filter, Search, Award, Clock, X, BookOpen } from 'lucide-react';
import api from '../../../api/axios_config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DocumentEditor from '../Proyectos/Wizard/DocumentEditor';
import { DocumentTemplateRegistry } from '../../../core/documents/registry/DocumentTemplateRegistry';

interface Convocatoria {
    id_convocatoria: number;
    uuid: string;
    titulo: string;
    descripcion: string;
    fecha_apertura: string;
    fecha_cierre: string;
    monto_maximo_proyecto: number;
    url_bases: string;
    estado: string;
    rubrica_nombre?: string;
    codigo_convocatoria: string;
}

const PublicConvocatoriasPage = () => {
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);
    const [preselectedConvocatoriaId, setPreselectedConvocatoriaId] = useState<number | null>(null);
    const [selectedConvocatoria, setSelectedConvocatoria] = useState<Convocatoria | null>(null);

    const handlePostular = (idConvocatoria: number) => {
        setPreselectedConvocatoriaId(idConvocatoria);
        setShowNewProject(true);
    };

    useEffect(() => {
        const fetchConvocatorias = async () => {
            try {
                const response = await api.get('/Convocatorias');
                // Para propósitos de pruebas y desarrollo, permitimos ver convocatorias tanto 'Abierta' como 'Borrador'
                setConvocatorias(response.data.filter((c: any) => c.estado === 'Abierta' || c.estado === 'Borrador'));
            } catch (error) {
                console.error('Error fetching convocatorias:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConvocatorias();
    }, []);

    const filtered = convocatorias.filter(c => 
        c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.codigo_convocatoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500">
            {/* Header Section */}
            <header className="max-w-4xl space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-text-main flex items-center justify-center text-bg-deep shadow-lg shadow-text-main/20">
                        <PenTool size={20} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase italic">Oportunidades de Investigación</h1>
                </div>
                <p className="text-text-dim text-lg leading-relaxed max-w-2xl font-medium">
                    Explora las convocatorias vigentes y postula tus proyectos de investigación e innovación institucional.
                </p>
            </header>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-surface/30 p-4 rounded-3xl border border-border-thin backdrop-blur-sm">
                <div className="relative flex-1 w-full group">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-text-main transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Buscar por título o código..."
                        className="w-full bg-bg-deep/50 border border-border-thin rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-text-main placeholder:text-text-dim/50 focus:outline-none focus:border-text-main transition-all uppercase tracking-widest"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-3 rounded-2xl bg-bg-deep/50 border border-border-thin text-text-dim hover:text-text-main hover:border-text-main transition-all">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* Grid of Convocatorias */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-96 rounded-3xl bg-surface/20 animate-pulse border border-border-thin" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center space-y-6 bg-surface/10 rounded-[3rem] border border-dashed border-border-thin">
                    <div className="w-16 h-16 rounded-full bg-surface mx-auto flex items-center justify-center text-text-dim/20">
                        <PenTool size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">No hay convocatorias activas</h3>
                        <p className="text-[11px] text-text-dim uppercase tracking-[0.2em]">Vuelve pronto para ver nuevas oportunidades</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filtered.map((c) => (
                        <div 
                            key={c.uuid} 
                            onClick={() => setSelectedConvocatoria(c)}
                            className="group relative bg-surface/30 border border-border-thin rounded-[2.5rem] p-8 hover:bg-surface/50 hover:border-text-main transition-all duration-500 overflow-hidden cursor-pointer"
                        >
                            {/* Decorative Background Icon */}
                            <PenTool size={120} className="absolute -right-10 -bottom-10 text-text-main opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 group-hover:-rotate-12" />

                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 bg-text-main/10 text-text-main text-[9px] font-black uppercase tracking-widest rounded-lg">
                                        {c.codigo_convocatoria}
                                    </span>
                                    <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest ${
                                        c.estado === 'Abierta' ? 'text-green-500' : 'text-amber-500'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                            c.estado === 'Abierta' ? 'bg-green-500' : 'bg-amber-500'
                                        }`} />
                                        {c.estado}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-text-main leading-tight group-hover:text-text-main transition-colors line-clamp-2">
                                        {c.titulo}
                                    </h3>
                                    <p className="text-xs text-text-dim leading-relaxed line-clamp-3 font-medium italic">
                                        {c.descripcion}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-dim uppercase tracking-widest">
                                            <Calendar size={10} /> Cierre
                                        </div>
                                        <p className="text-xs font-black text-text-main uppercase italic">
                                            {c.fecha_cierre ? format(new Date(c.fecha_cierre), 'dd MMM, yyyy', { locale: es }) : 'Por definir'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-dim uppercase tracking-widest">
                                            <DollarSign size={10} /> Max. Proyecto
                                        </div>
                                        <p className="text-xs font-black text-text-main uppercase italic">
                                            ${c.monto_maximo_proyecto?.toLocaleString() ?? '0.00'}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 flex items-center gap-4">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePostular(c.id_convocatoria);
                                        }}
                                        className="flex-1 bg-text-main text-bg-deep py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-text-main/10"
                                    >
                                        Postular Ahora
                                    </button>
                                    <a 
                                        href={c.url_bases} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-4 rounded-2xl bg-surface border border-border-thin text-text-dim hover:text-text-main hover:border-text-main transition-all"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info Footer */}
            <footer className="p-8 rounded-[2.5rem] bg-surface/30 border border-border-thin flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-bg-deep flex items-center justify-center text-text-main border border-border-thin">
                        <Award size={28} />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Calidad CACES 2026</h4>
                        <p className="text-[10px] text-text-dim font-medium uppercase tracking-[0.1em] max-w-sm">
                            Todas las propuestas deben alinearse a las Líneas de Investigación institucionales vigentes.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-bg-deep border border-border-thin text-[10px] font-bold text-text-dim uppercase tracking-widest">
                       <Clock size={12} /> Próximo Corte: 15 Dic
                   </div>
                </div>
            </footer>

            {/* Lanzador de nuevo proyecto con Convocatoria preseleccionada */}
            {showNewProject && (
                <DocumentEditor
                    templateCode="PROTOCOLO_INVESTIGACION"
                    initialData={{
                        ...DocumentTemplateRegistry.PROTOCOLO_INVESTIGACION.schema,
                        IdConvocatoria: preselectedConvocatoriaId
                    }}
                    onClose={() => {
                        setShowNewProject(false);
                        setPreselectedConvocatoriaId(null);
                    }}
                />
            )}

            {/* Vercel-style Slide-over Detail Panel */}
            {selectedConvocatoria && createPortal(
                <div className="fixed inset-0 z-[9999] flex justify-end animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
                        onClick={() => setSelectedConvocatoria(null)}
                    />
                    
                    {/* Panel */}
                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300 ease-out">
                        {/* Close button & top bar */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                                    {selectedConvocatoria.codigo_convocatoria}
                                </span>
                                <div className={`flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${
                                    selectedConvocatoria.estado === 'Abierta' ? 'text-green-500' : 'text-amber-500'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                                        selectedConvocatoria.estado === 'Abierta' ? 'bg-green-500' : 'bg-amber-500'
                                    }`} />
                                    {selectedConvocatoria.estado === 'Abierta' ? 'Convocatoria Activa' : `Estado: ${selectedConvocatoria.estado}`}
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedConvocatoria(null)}
                                className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        {/* Contents */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-surface">
                            {/* Title & Description */}
                            <div className="space-y-4">
                                <h2 className="text-3xl font-bold tracking-tight text-text-main leading-tight font-sans">
                                    {selectedConvocatoria.titulo}
                                </h2>
                                <p className="text-sm text-text-dim leading-relaxed font-medium">
                                    {selectedConvocatoria.descripcion}
                                </p>
                            </div>
                            
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-2xl bg-bg-deep/40 border border-border-thin space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} className="text-text-dim" /> Fecha de Apertura
                                    </div>
                                    <div className="text-sm font-bold text-text-main font-mono">
                                        {selectedConvocatoria.fecha_apertura ? format(new Date(selectedConvocatoria.fecha_apertura), 'dd MMM, yyyy', { locale: es }) : 'N/A'}
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-bg-deep/40 border border-border-thin space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Calendar size={12} className="text-red-500/80" /> Fecha de Cierre (Límite)
                                    </div>
                                    <div className="text-sm font-bold text-red-500 font-mono">
                                        {selectedConvocatoria.fecha_cierre ? format(new Date(selectedConvocatoria.fecha_cierre), 'dd MMM, yyyy', { locale: es }) : 'N/A'}
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-bg-deep/40 border border-border-thin space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <DollarSign size={12} className="text-green-500/80" /> Financiamiento Máximo
                                    </div>
                                    <div className="text-sm font-bold text-green-500 font-mono">
                                        ${selectedConvocatoria.monto_maximo_proyecto?.toLocaleString() ?? '0.00'}
                                    </div>
                                </div>
                                <div className="p-5 rounded-2xl bg-bg-deep/40 border border-border-thin space-y-1.5">
                                    <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                        <Award size={12} className="text-text-dim" /> Rúbrica Evaluativa
                                    </div>
                                    <div className="text-sm font-bold text-text-main truncate">
                                        {selectedConvocatoria.rubrica_nombre || 'Rúbrica Estándar ISTPET'}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Academic Alignment Section */}
                            <div className="space-y-4 p-6 rounded-2xl bg-bg-deep/40 border border-border-thin">
                                <div className="flex items-center gap-2 text-xs font-bold text-text-main uppercase tracking-wider">
                                    <BookOpen size={14} className="text-text-main" /> Alineación Académica CACES
                                </div>
                                <p className="text-xs text-text-dim leading-relaxed font-medium">
                                    Esta convocatoria opera bajo el Reglamento de Régimen Académico del **CES** y de la **SENESCYT**. Todos los proyectos presentados pasarán por un proceso de revisión por pares doble ciego y auditoría inmutable de trazabilidad.
                                </p>
                            </div>
                            
                            {/* Requirements List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-text-main uppercase tracking-widest">Requisitos Clave para Postulación</h4>
                                <ul className="space-y-2.5 text-xs text-text-dim">
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span>El equipo debe constar al menos de un Docente Investigador titular del ISTPET.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span>El presupuesto total agregado del proyecto no debe exceder el tope establecido de <strong>${selectedConvocatoria.monto_maximo_proyecto?.toLocaleString()}</strong>.</span>
                                    </li>
                                    <li className="flex items-start gap-2.5">
                                        <span className="w-1.5 h-1.5 bg-text-main rounded-full mt-1.5 shrink-0" />
                                        <span>Subir el protocolo completo de investigación redactado de forma colaborativa.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                            <button 
                                onClick={() => {
                                    handlePostular(selectedConvocatoria.id_convocatoria);
                                    setSelectedConvocatoria(null);
                                }}
                                className="flex-1 bg-text-main text-bg-deep py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-text-main/10"
                            >
                                Iniciar Postulación
                            </button>
                            <a 
                                href={selectedConvocatoria.url_bases} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-6 rounded-xl border border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover flex items-center justify-center transition-all"
                            >
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PublicConvocatoriasPage;
