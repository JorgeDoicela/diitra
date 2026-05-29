import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, UserCheck, AlertCircle, Loader2, CalendarDays } from 'lucide-react';
import { searchRevisores, asignarArbitro } from '../../../services/peerReviewService';
import type { RevisorDisponibleDto, ArbitrajeProyectoDto } from '../../../services/peerReviewService';
import { formatNombre, getAvatarStyle } from './arbitrajeUtils';

interface Props {
    proyecto: ArbitrajeProyectoDto;
    onClose: () => void;
    onSuccess: () => void;
}

const AsignarArbitroModal: React.FC<Props> = ({ proyecto, onClose, onSuccess }) => {
    const [query, setQuery] = useState('');
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'internos' | 'externos'>('todos');
    const [revisores, setRevisores] = useState<RevisorDisponibleDto[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [revisorSeleccionado, setRevisorSeleccionado] = useState<RevisorDisponibleDto | null>(null);
    const [fechaLimite, setFechaLimite] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 21);
        return d.toISOString().slice(0, 10);
    });
    const [esDobleCiego, setEsDobleCiego] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    const buscar = useCallback(async () => {
        setBuscando(true);
        try {
            const serverSoloExternos = filtroTipo === 'externos';
            const result = await searchRevisores(query, serverSoloExternos, proyecto.proyecto_uuid);
            
            if (filtroTipo === 'internos') {
                setRevisores(result.filter(r => !r.es_externo));
            } else {
                setRevisores(result);
            }
        } catch {
            setRevisores([]);
        } finally {
            setBuscando(false);
        }
    }, [query, filtroTipo, proyecto.proyecto_uuid]);

    useEffect(() => {
        if (query === '') {
            buscar();
        } else {
            const timer = setTimeout(buscar, 400);
            return () => clearTimeout(timer);
        }
    }, [query, buscar]);

    const handleAsignar = async () => {
        if (!revisorSeleccionado) return;
        setEnviando(true);
        setError('');
        try {
            await asignarArbitro({
                project_uuid: proyecto.proyecto_uuid,
                id_revisor: revisorSeleccionado.id_usuario,
                fecha_limite: new Date(fechaLimite + 'T23:59:59').toISOString(),
                es_externo: revisorSeleccionado.es_externo,
                es_doble_ciego: esDobleCiego,
            });
            onSuccess();
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al asignar el árbitro.');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="modal-card !max-w-3xl animate-fade-up">
                {/* Header */}
                <div className="modal-header border-b border-border-thin pb-3">
                    <div>
                        <h3 className="text-xl font-bold tracking-tighter text-text-main uppercase">
                            Asignar Árbitro
                        </h3>
                        <p className="text-[10px] text-text-dim font-mono uppercase tracking-widest mt-0.5 line-clamp-1">
                            {proyecto.proyecto_titulo}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-dim hover:text-text-main transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-3 rounded-md bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
                        <AlertCircle size={13} /> {error}
                    </div>
                )}

                {/* Modal Body with 2 Columns Split Layout */}
                <div className="modal-body grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 min-h-[380px]">
                    {/* LEFT PANEL: Búsqueda y Selección Directa */}
                    <div className="flex flex-col space-y-4">
                        <div>
                            <label className="section-label mb-2 block">
                                <Search size={10} className="inline mr-1" /> Escribe el nombre o cédula para buscar
                            </label>
                            <input
                                type="text"
                                className="input-vercel"
                                placeholder="Escribe para buscar árbitros..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 flex flex-col">
                            <div className="flex bg-bg-deep/40 rounded-lg p-0.5 border border-border-thin/50 gap-0.5 mb-3">
                                {[
                                    { id: 'todos', label: 'Todos' },
                                    { id: 'internos', label: 'Internos' },
                                    { id: 'externos', label: 'Externos' }
                                ].map(tab => {
                                    const active = filtroTipo === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setFiltroTipo(tab.id as any)}
                                            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                                                active
                                                    ? 'bg-surface text-text-main border border-border-thin shadow-sm font-bold'
                                                    : 'text-text-dim border border-transparent hover:text-text-main'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <label className="section-label block mb-2">
                                Árbitros Disponibles ({revisores.length})
                            </label>

                            <div className="flex-1 overflow-y-auto space-y-1 border border-border-thin rounded-lg p-2 bg-bg-deep/10 custom-scrollbar pr-1 max-h-[260px] min-h-[220px]">
                                {buscando ? (
                                    <div className="flex items-center gap-2 text-text-dim text-xs py-12 justify-center">
                                        <Loader2 size={14} className="animate-spin text-text-main" /> Buscando...
                                    </div>
                                ) : revisores.length === 0 ? (
                                    <div className="text-center py-12 text-text-dim text-xs font-bold uppercase tracking-widest">
                                        Sin resultados
                                    </div>
                                ) : (
                                    revisores.map((rev) => {
                                        const isSelected = revisorSeleccionado?.id_usuario === rev.id_usuario;
                                        const avStyle = getAvatarStyle(rev.nombre_completo);
                                        return (
                                            <button
                                                key={rev.id_usuario}
                                                type="button"
                                                onClick={() => setRevisorSeleccionado(rev)}
                                                className={`w-full text-left p-2 rounded-md transition-all flex items-center justify-between border hover:-translate-y-0.5 duration-200 ${
                                                    isSelected
                                                        ? 'bg-surface-hover border-text-main text-text-main font-semibold shadow-inner'
                                                        : 'border-transparent hover:bg-surface-hover text-text-dim hover:text-text-main'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avStyle.bg} border text-[10px] font-bold flex items-center justify-center shrink-0`}>
                                                        {rev.nombre_completo.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-xs font-semibold leading-tight text-text-main">{formatNombre(rev.nombre_completo)}</p>
                                                        <p className="text-[10px] text-text-dim truncate mt-0.5 font-medium">{rev.es_externo && rev.institucion ? `${formatNombre(rev.institucion)} — ` : ''}{rev.email}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 flex items-center gap-1.5">
                                                    {rev.es_externo && (
                                                        <span className="text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1 py-0.5 rounded font-bold uppercase tracking-wider">
                                                            Ext
                                                        </span>
                                                    )}
                                                    {rev.revisiones_activas > 0 && (
                                                        <span className="text-[8px] text-warning font-bold bg-warning-subtle border border-warning/20 px-1 py-0.5 rounded">
                                                            {rev.revisiones_activas} act.
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Configuración, Parámetros y Detalles */}
                    <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-border-thin pt-5 md:pt-0 md:pl-6">
                        {revisorSeleccionado ? (
                            <div className="space-y-4 flex-1 flex flex-col justify-between">
                                {/* Datos del árbitro */}
                                <div className="space-y-2.5 p-3.5 bg-surface rounded-lg border border-border-thin shadow-sm">
                                    <div className="flex items-center gap-2 text-text-main border-b border-border-thin/50 pb-2 mb-1">
                                        <UserCheck size={13} />
                                        <span className="text-xs font-bold uppercase tracking-wider">Árbitro Seleccionado</span>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div>
                                            <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Nombre Completo</p>
                                            <p className="font-semibold text-text-main mt-0.5">{formatNombre(revisorSeleccionado.nombre_completo)}</p>
                                        </div>
                                        {revisorSeleccionado.especialidad && (
                                            <div>
                                                <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Especialidad</p>
                                                <p className="font-semibold text-text-main mt-0.5">{revisorSeleccionado.especialidad}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Correo Electrónico</p>
                                            <p className="font-semibold text-text-dim truncate mt-0.5">{revisorSeleccionado.email}</p>
                                        </div>
                                        {revisorSeleccionado.es_externo && revisorSeleccionado.institucion && (
                                            <div>
                                                <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">Institución de Origen</p>
                                                <p className="font-semibold text-text-main mt-0.5">{formatNombre(revisorSeleccionado.institucion)}</p>
                                            </div>
                                        )}
                                        {revisorSeleccionado.orcid_id && (
                                            <div>
                                                <p className="text-[9px] text-text-dim uppercase tracking-widest font-bold">ORCID iD</p>
                                                <p className="font-mono font-semibold text-text-main mt-0.5">{revisorSeleccionado.orcid_id}</p>
                                            </div>
                                        )}
                                        <div className="pt-1 flex gap-2">
                                            {revisorSeleccionado.es_externo ? (
                                                <span className="text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                                                    Externo CACES
                                                </span>
                                            ) : (
                                                <span className="text-[8px] bg-purple-500/10 text-purple-500 border border-purple-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                                                    Par Interno
                                                </span>
                                            )}
                                            {revisorSeleccionado.revisiones_activas > 0 && (
                                                <span className="text-[8px] bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded font-bold uppercase tracking-widest">
                                                    {revisorSeleccionado.revisiones_activas} Activas
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Inputs */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="section-label mb-2 block">
                                            <CalendarDays size={10} className="inline mr-1" /> Fecha Límite de Evaluación
                                        </label>
                                        <input
                                            type="date"
                                            className="input-vercel"
                                            value={fechaLimite}
                                            min={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => setFechaLimite(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="section-label mb-2 block">
                                            Modalidad de Evaluación
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${esDobleCiego ? 'border-text-main bg-surface' : 'border-border-thin'}`}>
                                            <input
                                                type="checkbox"
                                                className="accent-text-main"
                                                checked={esDobleCiego}
                                                onChange={(e) => setEsDobleCiego(e.target.checked)}
                                            />
                                            <div>
                                                <p className="text-xs font-bold text-text-main">Doble Ciego</p>
                                                <p className="text-[10px] text-text-dim">Identidades ocultadas (recomendado CACES)</p>
                                            </div>
                                        </label>
                                    </div>

                                    {!esDobleCiego && (
                                        <div className="flex items-start gap-2 p-2.5 rounded-lg border border-warning/30 bg-warning/5 animate-fade-in">
                                            <AlertCircle size={14} className="text-warning shrink-0 mt-0.5" />
                                            <p className="text-[9px] text-text-dim leading-relaxed">
                                                <span className="font-bold text-text-main">Advertencia:</span> La modalidad sin ciego no satisface los indicadores CACES.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-text-dim bg-surface/20 border border-dashed border-border-thin rounded-xl my-auto">
                                <UserCheck size={32} className="opacity-30 mb-2.5" />
                                <p className="text-xs font-bold uppercase tracking-wider text-text-main">Configuración de Evaluación</p>
                                <p className="text-[10px] mt-1 max-w-[200px] leading-relaxed">
                                    Selecciona un evaluador disponible del listado de la izquierda para comenzar a configurar su fecha límite y modalidad.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer (Across both panels) */}
                <div className="modal-footer border-t border-border-thin pt-3">
                    <button onClick={onClose} className="btn-vercel-secondary">Cancelar</button>
                    <button
                        onClick={handleAsignar}
                        disabled={!revisorSeleccionado || enviando}
                        className="btn-vercel-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed font-bold font-sans"
                    >
                        {enviando ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                        Asignar Árbitro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AsignarArbitroModal;
// Trigger refresh of TS server diagnostics

