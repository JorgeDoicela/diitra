import React, { useState, useEffect } from 'react';
import { PenTool, Calendar, DollarSign, ExternalLink, Filter, Search, ChevronRight, Award, Clock } from 'lucide-react';
import api from '../../../api/axios_config';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Convocatoria {
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

    useEffect(() => {
        const fetchConvocatorias = async () => {
            try {
                const response = await api.get('/Convocatorias');
                // Filtrar solo las abiertas o cerradas recientemente
                setConvocatorias(response.data.filter((c: any) => c.estado === 'Abierta'));
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
                            className="group relative bg-surface/30 border border-border-thin rounded-[2.5rem] p-8 hover:bg-surface/50 hover:border-text-main transition-all duration-500 overflow-hidden"
                        >
                            {/* Decorative Background Icon */}
                            <PenTool size={120} className="absolute -right-10 -bottom-10 text-text-main opacity-[0.02] group-hover:opacity-[0.05] transition-all duration-700 group-hover:-rotate-12" />

                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 bg-text-main/10 text-text-main text-[9px] font-black uppercase tracking-widest rounded-lg">
                                        {c.codigo_convocatoria}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-500 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                        Abierta
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
                                            {format(new Date(c.fecha_cierre), 'dd MMM, yyyy', { locale: es })}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-text-dim uppercase tracking-widest">
                                            <DollarSign size={10} /> Max. Proyecto
                                        </div>
                                        <p className="text-xs font-black text-text-main uppercase italic">
                                            ${c.monto_maximo_proyecto.toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 flex items-center gap-4">
                                    <button className="flex-1 bg-text-main text-bg-deep py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-text-main/10">
                                        Postular Ahora
                                    </button>
                                    <a 
                                        href={c.url_bases} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
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
        </div>
    );
};

export default PublicConvocatoriasPage;
