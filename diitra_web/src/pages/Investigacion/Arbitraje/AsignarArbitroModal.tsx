import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, UserCheck, Award, AlertCircle, Loader2, CalendarDays, ChevronDown } from 'lucide-react';
import {
    searchRevisores, asignarArbitro
} from '../../../services/peerReviewService';
import type { RevisorDisponibleDto, ArbitrajeProyectoDto } from '../../../services/peerReviewService';

interface Props {
    proyecto: ArbitrajeProyectoDto;
    onClose: () => void;
    onSuccess: () => void;
}

const AsignarArbitroModal: React.FC<Props> = ({ proyecto, onClose, onSuccess }) => {
    const [query, setQuery] = useState('');
    const [soloExternos, setSoloExternos] = useState(false);
    const [revisores, setRevisores] = useState<RevisorDisponibleDto[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [revisorSeleccionado, setRevisorSeleccionado] = useState<RevisorDisponibleDto | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [fechaLimite, setFechaLimite] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 21);
        return d.toISOString().slice(0, 10);
    });
    const [esDobleCiego, setEsDobleCiego] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState('');

    const dropdownRef = useRef<HTMLDivElement>(null);

    const buscar = useCallback(async () => {
        setBuscando(true);
        try {
            const result = await searchRevisores(query, soloExternos, proyecto.proyecto_uuid);
            setRevisores(result);
        } catch {
            setRevisores([]);
        } finally {
            setBuscando(false);
        }
    }, [query, soloExternos, proyecto.proyecto_uuid]);

    useEffect(() => {
        if (query === '') {
            buscar();
        } else {
            const timer = setTimeout(buscar, 400);
            return () => clearTimeout(timer);
        }
    }, [query, buscar]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
            <div className="modal-card !max-w-2xl animate-fade-up">
                {/* Header */}
                <div className="modal-header">
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

                <div className="modal-body space-y-6">
                    {/* Buscador / Selector */}
                    <div>
                        <label className="section-label mb-2 block">
                            <Search size={10} /> Seleccionar Árbitro
                        </label>
                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full flex items-center justify-between px-3 py-2 bg-surface hover:bg-surface-hover border border-border-thin hover:border-border-hover rounded-lg text-sm text-left transition-all duration-200"
                            >
                                {revisorSeleccionado ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-text-main text-bg-deep text-[8px] font-bold flex items-center justify-center">
                                            {revisorSeleccionado.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <span className="font-semibold text-text-main">
                                            {revisorSeleccionado.nombre_completo}
                                        </span>
                                        {revisorSeleccionado.es_externo && (
                                            <span className="text-[8px] uppercase tracking-widest text-warning font-bold px-1.5 py-0.5 rounded bg-warning-subtle border border-warning/20">
                                                Externo
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-text-dim">Buscar y seleccionar un árbitro...</span>
                                )}
                                <ChevronDown size={16} className={`text-text-dim transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-text-main' : ''}`} />
                            </button>

                            {isDropdownOpen && (
                                <div className="relative mt-2 p-2.5 bg-bg-deep/40 border border-border-thin rounded-lg shadow-inner animate-scale-up">
                                    {/* Input de búsqueda interno */}
                                    <div className="flex gap-2 mb-2">
                                        <div className="relative flex-1">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                            <input
                                                type="text"
                                                className="input-vercel !pl-9"
                                                placeholder="Escribe el nombre o cédula para filtrar..."
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 px-3 py-2 bg-bg-deep rounded-md border border-border-thin cursor-pointer hover:bg-surface-hover transition-colors text-xs text-text-dim whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="accent-text-main"
                                                checked={soloExternos}
                                                onChange={(e) => setSoloExternos(e.target.checked)}
                                            />
                                            Solo Externos
                                        </label>
                                    </div>

                                    {/* Listado filtrado */}
                                    <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                                        {buscando ? (
                                            <div className="flex items-center gap-2 text-text-dim text-xs py-6 justify-center">
                                                <Loader2 size={14} className="animate-spin text-text-main" /> Buscando...
                                            </div>
                                        ) : revisores.length === 0 ? (
                                            <div className="text-center py-8 text-text-dim text-xs font-bold uppercase tracking-widest">
                                                Sin resultados
                                            </div>
                                        ) : (
                                            revisores.map((rev) => (
                                                <button
                                                    key={rev.id_usuario}
                                                    type="button"
                                                    onClick={() => {
                                                        setRevisorSeleccionado(rev);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left p-2.5 rounded-md transition-all flex items-center justify-between ${
                                                        revisorSeleccionado?.id_usuario === rev.id_usuario
                                                            ? 'bg-surface-hover border border-text-main/20 text-text-main font-semibold'
                                                            : 'hover:bg-surface-hover text-text-dim hover:text-text-main'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={`w-6 h-6 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0
                                                            ${revisorSeleccionado?.id_usuario === rev.id_usuario ? 'bg-text-main text-bg-deep' : 'bg-bg-deep text-text-main'}`}
                                                        >
                                                            {rev.nombre_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </div>
                                                        <div className="truncate">
                                                            <p className="text-xs font-semibold leading-tight text-text-main">{rev.nombre_completo}</p>
                                                            <p className="text-[10px] text-text-dim truncate mt-0.5">{rev.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 flex items-center gap-2">
                                                        {rev.especialidad && (
                                                            <span className="text-[9px] bg-bg-deep text-text-dim px-1.5 py-0.5 rounded border border-border-thin truncate max-w-[100px]">
                                                                {rev.especialidad}
                                                            </span>
                                                        )}
                                                        {rev.revisiones_activas > 0 && (
                                                            <span className="text-[9px] text-warning font-bold bg-warning-subtle border border-warning/20 px-1 py-0.5 rounded">
                                                                {rev.revisiones_activas} act.
                                                            </span>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Árbitro seleccionado — detalles */}
                    {revisorSeleccionado && (
                        <div className="p-4 rounded-lg border border-text-main/20 bg-surface/30 space-y-4">
                            <div className="flex items-center gap-2">
                                <UserCheck size={14} className="text-text-main" />
                                <span className="text-xs font-bold text-text-main uppercase tracking-wider">Árbitro Seleccionado</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Nombre</p>
                                    <p className="text-sm font-semibold text-text-main">{revisorSeleccionado.nombre_completo}</p>
                                </div>
                                {revisorSeleccionado.especialidad && (
                                    <div>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Especialidad</p>
                                        <p className="text-sm text-text-main">{revisorSeleccionado.especialidad}</p>
                                    </div>
                                )}
                                {revisorSeleccionado.email && (
                                    <div>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Email</p>
                                        <p className="text-sm text-text-dim">{revisorSeleccionado.email}</p>
                                    </div>
                                )}
                                {revisorSeleccionado.orcid_id && (
                                    <div>
                                        <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">ORCID</p>
                                        <p className="text-sm font-mono text-text-main">{revisorSeleccionado.orcid_id}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="divider-vercel" />

                    {/* Configuración */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="section-label mb-2 block">
                                <CalendarDays size={10} /> Fecha Límite de Evaluación
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
                    </div>

                    {!esDobleCiego && (
                        <div className="flex items-start gap-2 p-3 rounded-lg border border-warning/30 bg-warning/5">
                            <AlertCircle size={14} className="text-warning shrink-0 mt-0.5" />
                            <p className="text-xs text-text-dim">
                                <span className="font-bold text-text-main">Advertencia:</span> La modalidad de revisión sin ciego
                                puede comprometer la objetividad del proceso y no es recomendada por el CACES.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-xs">
                            <AlertCircle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-vercel-secondary">Cancelar</button>
                    <button
                        onClick={handleAsignar}
                        disabled={!revisorSeleccionado || enviando}
                        className="btn-vercel-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {enviando ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
                        Asignar Árbitro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AsignarArbitroModal;
// Trigger refresh of TS server diagnostics

