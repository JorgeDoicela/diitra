import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, UserCheck, AlertCircle, Loader2, CalendarDays, Check, X, Search, Users, ShieldCheck, GraduationCap, UserPlus } from 'lucide-react';
import { searchRevisores, asignarArbitro } from '../../../services/peerReviewService';
import type { RevisorDisponibleDto, ArbitrajeProyectoDto } from '../../../services/peerReviewService';
import { formatNombre } from './arbitrajeUtils';
import ModalRevisorExterno from './ModalRevisorExterno';

const formatCarrera = (text?: string) => {
    if (!text) return '';
    return text.toLowerCase()
        .replace(/(^\w|\s\w)/g, m => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, m => m.toLowerCase());
};

const highlightText = (text: string | null | undefined, search: string) => {
    if (!text) return '';
    if (!search.trim()) return <>{text}</>;
    
    try {
        const escapedSearch = search.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        const parts = text.split(regex);
        
        return (
            <>
                {parts.map((part, i) => 
                    regex.test(part) ? (
                        <mark key={i} className="bg-brand/20 text-brand font-semibold px-0.5 rounded-sm">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    } catch (e) {
        return <>{text}</>;
    }
};

interface Props {
    proyecto: ArbitrajeProyectoDto;
    onClose: () => void;
    onSuccess: () => void;
}

const AsignarArbitroModal: React.FC<Props> = ({ proyecto, onClose, onSuccess }) => {
    const [query, setQuery] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'internos' | 'externos'>('todos');
    const [filtroCarrera, setFiltroCarrera] = useState<string>('');
    const [showCrearExterno, setShowCrearExterno] = useState(false);
    const [rawRevisores, setRawRevisores] = useState<RevisorDisponibleDto[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [revisoresSeleccionados, setRevisoresSeleccionados] = useState<RevisorDisponibleDto[]>([]);
    const [fechaLimite, setFechaLimite] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 21);
        return d.toISOString().slice(0, 10);
    });
    const [esDobleCiego, setEsDobleCiego] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');
    const [autoExtendDeadlines, setAutoExtendDeadlines] = useState(proyecto.auto_extend_deadlines ?? false);
    const [autoExtendDays, setAutoExtendDays] = useState(proyecto.auto_extend_days ?? 7);

    const buscar = useCallback(async () => {
        setBuscando(true);
        try {
            const serverSoloExternos = filtroTipo === 'externos';
            const data = await searchRevisores(query, serverSoloExternos);
            setRawRevisores(data);
        } catch {
            setRawRevisores([]);
        } finally {
            setBuscando(false);
        }
    }, [query, filtroTipo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            buscar();
        }, 200);
        return () => clearTimeout(timer);
    }, [buscar]);

    useEffect(() => {
        if (filtroTipo === 'externos') {
            setFiltroCarrera('');
        }
    }, [filtroTipo]);

    // Extraer carreras disponibles de forma dinámica
    const carrerasDisponibles = useMemo(() => {
        const map = new Map<string, number>();
        rawRevisores.forEach(r => {
            if (!r.es_externo && r.carrera) {
                r.carrera.split(',').forEach(c => {
                    const trimmed = c.trim();
                    if (trimmed && trimmed.toLowerCase() !== 'docente') {
                        map.set(trimmed, (map.get(trimmed) || 0) + 1);
                    }
                });
            }
        });
        return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [rawRevisores]);

    // Filtrar revisores por tipo y carrera
    const revisores = useMemo(() => {
        return rawRevisores.filter(r => {
            if (filtroTipo === 'internos' && r.es_externo) return false;
            if (filtroTipo === 'externos' && !r.es_externo) return false;
            if (filtroCarrera && !r.es_externo) {
                if (!r.carrera || !r.carrera.toLowerCase().includes(filtroCarrera.toLowerCase())) {
                    return false;
                }
            }
            return true;
        });
    }, [rawRevisores, filtroTipo, filtroCarrera]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const toggleRevisor = (revisor: RevisorDisponibleDto) => {
        setRevisoresSeleccionados(prev => {
            const exists = prev.some(r => r.id_usuario === revisor.id_usuario);
            if (exists) {
                return prev.filter(r => r.id_usuario !== revisor.id_usuario);
            } else {
                return [...prev, revisor];
            }
        });
    };

    const removeSelected = (id_usuario: number) => {
        setRevisoresSeleccionados(prev => prev.filter(r => r.id_usuario !== id_usuario));
    };

    const handleAsignar = async () => {
        if (revisoresSeleccionados.length === 0) return;
        setEnviando(true);
        setError('');
        try {
            for (const rev of revisoresSeleccionados) {
                await asignarArbitro({
                    project_uuid: proyecto.proyecto_uuid,
                    id_revisor: rev.id_usuario,
                    fecha_limite: fechaLimite,
                    es_doble_ciego: esDobleCiego,
                    es_externo: rev.es_externo,
                    auto_extend_deadlines: autoExtendDeadlines,
                    auto_extend_days: autoExtendDays,
                });
            }
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al asignar los evaluadores.');
        } finally {
            setEnviando(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-4xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden shadow-2xl">
                
                {/* Header */}
                <div className="modal-header border-b border-border-thin">
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="icon-circle icon-circle-brand shrink-0">
                            <UserCheck size={18} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold tracking-tight text-text-main">
                                Asignar Evaluador
                            </h3>
                            <p className="section-label text-text-dim mt-0.5 truncate">
                                {proyecto.proyecto_titulo}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-text-dim hover:text-text-main transition-colors p-1.5 rounded-md hover:bg-surface-hover shrink-0 cursor-pointer"
                        title="Cerrar panel"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Drawer Body with 2 Columns Split Layout */}
                <div className="flex-1 overflow-hidden p-6 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
                    
                    {/* LEFT PANEL: Búsqueda y Selección Directa */}
                    <div className="flex flex-col h-full min-h-0">
                        
                        {/* Tabs Vercel */}
                        <div className="tabs-vercel !mb-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setFiltroTipo('todos')}
                                className={`tab-vercel-item ${filtroTipo === 'todos' ? 'active' : ''}`}
                            >
                                Todos
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroTipo('internos')}
                                className={`tab-vercel-item ${filtroTipo === 'internos' ? 'active' : ''}`}
                            >
                                Internos
                            </button>
                            <button
                                type="button"
                                onClick={() => setFiltroTipo('externos')}
                                className={`tab-vercel-item ${filtroTipo === 'externos' ? 'active' : ''}`}
                            >
                                Externos
                            </button>
                        </div>

                        {/* Search and Career Filter Bars */}
                        <div className="space-y-2 mb-3 shrink-0">
                            {/* Search bar */}
                            <div className="relative">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                                <input
                                    type="text"
                                    className="input-vercel !pl-8 w-full"
                                    placeholder="Buscar por nombre, cédula o institución..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Career Filter Dropdown */}
                            {filtroTipo !== 'externos' && carrerasDisponibles.length > 0 && (
                                <div className="flex items-center gap-2 animate-fade-in">
                                    <div className="relative flex-1">
                                        <GraduationCap size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim pointer-events-none" />
                                        <select
                                            value={filtroCarrera}
                                            onChange={(e) => setFiltroCarrera(e.target.value)}
                                            className="input-vercel !pl-8 !py-1.5 w-full text-xs font-sans bg-surface appearance-none cursor-pointer"
                                        >
                                            <option value="">Todas las carreras ({carrerasDisponibles.length})</option>
                                            {carrerasDisponibles.map(([carrera, count]) => (
                                                <option key={carrera} value={carrera}>
                                                    {formatCarrera(carrera)} ({count})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {filtroCarrera && (
                                        <button
                                            type="button"
                                            onClick={() => setFiltroCarrera('')}
                                            className="btn-vercel-secondary !py-1.5 !px-2.5 text-xs text-text-dim hover:text-error flex items-center gap-1 shrink-0"
                                            title="Limpiar filtro de carrera"
                                        >
                                            <X size={12} />
                                            <span>Limpiar</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between mb-2 shrink-0">
                            <p className="section-label">
                                <Users size={10} />
                                <span>Evaluadores Disponibles ({revisores.length})</span>
                            </p>
                            {filtroTipo === 'externos' && (
                                <button
                                    type="button"
                                    onClick={() => setShowCrearExterno(true)}
                                    className="btn-vercel-secondary !py-1 !px-2 text-[10px] flex items-center gap-1 shrink-0"
                                >
                                    <UserPlus size={11} />
                                    <span>+ Registrar Externo</span>
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 border border-border-thin rounded-xl p-2.5 bg-bg-deep/20 custom-scrollbar pr-1.5 min-h-0">
                            {buscando ? (
                                <div className="flex items-center gap-2 text-text-dim text-xs py-16 justify-center">
                                    <Loader2 size={14} className="animate-spin text-text-main" />
                                    <span>Buscando evaluadores...</span>
                                </div>
                            ) : revisores.length === 0 ? (
                                <div className="text-center py-16 text-text-dim text-xs space-y-3">
                                    <p className="font-semibold uppercase tracking-widest">Sin evaluadores encontrados</p>
                                    {filtroTipo === 'externos' && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCrearExterno(true)}
                                            className="btn-vercel-primary !py-1.5 !px-3 text-xs mx-auto flex items-center gap-1.5"
                                        >
                                            <UserPlus size={13} />
                                            <span>Registrar Revisor Externo</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                revisores.map((rev) => {
                                    const isSelected = revisoresSeleccionados.some(r => r.id_usuario === rev.id_usuario);
                                    return (
                                        <div
                                            key={rev.id_usuario}
                                            onClick={() => toggleRevisor(rev)}
                                            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                                                isSelected
                                                    ? 'bg-surface border-border-hover shadow-xs'
                                                    : 'bg-surface/60 border-border-thin hover:border-border-hover hover:bg-surface'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                {/* Checkbox Vercel */}
                                                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected ? 'bg-text-main border-text-main text-bg-deep' : 'border-border-thin bg-surface'
                                                }`}>
                                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                                </div>

                                                {/* Avatar Geist */}
                                                <div className="w-8 h-8 rounded-full border border-border-thin bg-surface flex items-center justify-center font-mono text-[11px] font-semibold text-text-main shrink-0 shadow-2xs">
                                                    {rev.nombre_completo.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>

                                                <div className="truncate">
                                                    <p className="text-xs font-medium text-text-main leading-snug truncate">
                                                        {highlightText(formatNombre(rev.nombre_completo), query)}
                                                    </p>
                                                    <p className="text-[10px] text-text-dim truncate mt-0.5 font-mono">
                                                        {rev.es_externo && rev.institucion ? (
                                                            <>{highlightText(formatNombre(rev.institucion), query)} — </>
                                                        ) : rev.carrera ? (
                                                            <>{highlightText(rev.carrera.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase()).replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, m => m.toLowerCase()), query)} — </>
                                                        ) : ''}
                                                        {highlightText(rev.email, query)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0 flex items-center gap-1.5">
                                                {rev.es_externo ? (
                                                    <span className="badge-vercel badge-vercel-info">
                                                        Externo
                                                    </span>
                                                ) : (
                                                    <span className="badge-vercel badge-vercel-neutral">
                                                        Interno
                                                    </span>
                                                )}
                                                {rev.revisiones_activas > 0 && (
                                                    <span className="badge-vercel badge-vercel-warning">
                                                        {rev.revisiones_activas} act.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Configuración, Parámetros y Detalles */}
                    <div className="flex flex-col h-full min-h-0 border-t md:border-t-0 md:border-l border-border-thin pt-5 md:pt-0 md:pl-6 overflow-y-auto custom-scrollbar">
                        {revisoresSeleccionados.length > 0 ? (
                            <div className="space-y-4 flex-1 flex flex-col justify-between min-h-0">
                                
                                {/* Selected reviewers list */}
                                <div className="bento-card static p-4 space-y-3">
                                    <p className="section-label">
                                        <UserCheck size={10} />
                                        <span>Evaluadores Seleccionados ({revisoresSeleccionados.length})</span>
                                    </p>
                                    <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                        {revisoresSeleccionados.map((rev) => (
                                            <div
                                                key={rev.id_usuario}
                                                onClick={() => removeSelected(rev.id_usuario)}
                                                className="group p-2.5 rounded-lg border border-border-thin bg-surface hover:border-error/40 hover:bg-error/5 flex items-center justify-between gap-2 shadow-2xs cursor-pointer transition-all select-none"
                                                title="Clic para remover de la selección"
                                            >
                                                <div className="min-w-0 pr-2 flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-xs font-semibold text-text-main group-hover:text-error transition-colors truncate leading-tight">
                                                            {formatNombre(rev.nombre_completo)}
                                                        </span>
                                                        <span className={rev.es_externo ? "badge-vercel badge-vercel-info" : "badge-vercel badge-vercel-neutral"}>
                                                            {rev.es_externo ? 'Externo' : 'Interno'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-text-dim block truncate font-mono">
                                                        {rev.es_externo ? `Par Externo · ${rev.email}` : `${rev.carrera ? rev.carrera.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase()).replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, m => m.toLowerCase()) : 'Docente'} · ${rev.email}`}
                                                    </span>
                                                </div>
                                                <div
                                                    className="text-text-dim group-hover:text-error group-hover:bg-error/15 transition-colors p-1.5 rounded-md shrink-0 flex items-center justify-center"
                                                >
                                                    <X size={13} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Form settings */}
                                <div className="space-y-4">
                                    
                                    {/* Fecha límite */}
                                    <div className="bento-card static p-4 space-y-2">
                                        <label className="section-label">
                                            <CalendarDays size={10} />
                                            <span>Fecha Límite de Dictamen</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input-vercel w-full font-mono text-xs"
                                            value={fechaLimite}
                                            min={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => setFechaLimite(e.target.value)}
                                        />
                                    </div>

                                    {/* Modalidad Doble Ciego */}
                                    <div 
                                        className="bento-card static p-4 space-y-3 cursor-pointer select-none transition-all hover:border-border-hover"
                                        onClick={() => setEsDobleCiego(!esDobleCiego)}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold text-text-main flex items-center gap-1.5">
                                                    <ShieldCheck size={14} className="text-brand" />
                                                    <span>Evaluación Anónima (Doble Ciego)</span>
                                                </p>
                                                <p className="text-[11px] text-text-dim mt-0.5">
                                                    Identidades ocultadas entre autor y evaluadores (Recomendado CACES I5)
                                                </p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                                                esDobleCiego ? 'bg-text-main border-text-main text-bg-deep' : 'border-border-thin bg-surface'
                                            }`}>
                                                {esDobleCiego && <Check size={10} strokeWidth={3} />}
                                            </div>
                                        </div>

                                        {!esDobleCiego && (
                                            <div className="callout-vercel callout-vercel-warning mt-2" onClick={(e) => e.stopPropagation()}>
                                                <AlertCircle size={14} className="shrink-0" />
                                                <div>
                                                    <p className="callout-vercel-title">Advertencia CACES</p>
                                                    <p className="callout-vercel-body">La modalidad sin ciego no satisface los estándares de acreditación CACES I5.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Auto-extender plazos */}
                                    <div 
                                        className="bento-card static p-4 cursor-pointer select-none transition-all hover:border-border-hover"
                                        onClick={() => setAutoExtendDeadlines(!autoExtendDeadlines)}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-text-main">Auto-extender plazos</p>
                                                <p className="text-[11px] text-text-dim mt-0.5">Prórroga automática al expirar el plazo</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 shrink-0">
                                                {autoExtendDeadlines && (
                                                    <div 
                                                        className="flex items-center gap-1.5 animate-fade-in"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={30}
                                                            className="input-vercel !w-16 !py-1 text-center font-mono text-xs"
                                                            value={autoExtendDays}
                                                            onChange={(e) => setAutoExtendDays(parseInt(e.target.value) || 7)}
                                                            title="Número de días de prórroga"
                                                        />
                                                        <span className="text-[11px] text-text-dim font-mono select-none">días</span>
                                                    </div>
                                                )}

                                                <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors ${
                                                    autoExtendDeadlines ? 'bg-text-main border-text-main text-bg-deep' : 'border-border-thin bg-surface'
                                                }`}>
                                                    {autoExtendDeadlines && <Check size={10} strokeWidth={3} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bento-card static flex-1 flex flex-col items-center justify-center text-center p-8 border-dashed">
                                <UserCheck size={32} className="opacity-25 mb-3 text-text-dim" />
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-main">
                                    Configuración de Evaluación
                                </p>
                                <p className="text-[11px] text-text-dim mt-1.5 max-w-[220px] leading-relaxed">
                                    Selecciona uno o más evaluadores disponibles del listado izquierdo para configurar sus plazos y modalidad.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-t border-border-thin bg-surface p-4 flex items-center justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="btn-vercel-secondary">
                        Cancelar
                    </button>
                    <button
                        onClick={handleAsignar}
                        disabled={revisoresSeleccionados.length === 0 || enviando}
                        className="btn-vercel-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {enviando ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                        <span>{revisoresSeleccionados.length > 1 ? `Asignar ${revisoresSeleccionados.length} Evaluadores` : 'Asignar Evaluador'}</span>
                    </button>
                </div>
            </div>

            {showCrearExterno && (
                <ModalRevisorExterno
                    onClose={() => setShowCrearExterno(false)}
                    onSuccess={() => {
                        setShowCrearExterno(false);
                        buscar();
                    }}
                />
            )}
        </div>,
        document.body
    );
};

export default AsignarArbitroModal;
// Trigger refresh of TS server diagnostics

