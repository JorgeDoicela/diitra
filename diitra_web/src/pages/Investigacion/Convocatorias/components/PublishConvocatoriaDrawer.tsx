import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Send, Users, ShieldCheck, Calendar, Search, Loader2, CheckCircle2,
    Building2, GraduationCap, UserCheck, AlertCircle, UserMinus, Plus
} from 'lucide-react';
import api from '../../../../api/axios_config';
import type { Convocatoria, Catalogo } from '../types';

export interface PublishRecipient {
    id_usuario?: number;
    nombre_completo: string;
    email: string;
    type: string;
    departamento?: string;
    carrera?: string;
    cargo_instituto?: string;
}

interface PublishConvocatoriaDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    convocatoria: Convocatoria | null;
    tiposConv: Catalogo[];
    onPublishSuccess: () => void;
}

export const PublishConvocatoriaDrawer: React.FC<PublishConvocatoriaDrawerProps> = ({
    isOpen,
    onClose,
    convocatoria,
    tiposConv,
    onPublishSuccess
}) => {
    // Segments
    const [incluirDocentesConHoras, setIncluirDocentesConHoras] = useState(true);
    const [incluirAutoridades, setIncluirAutoridades] = useState(true);
    const [incluirTodosDocentes, setIncluirTodosDocentes] = useState(false);

    // Custom individual recipients
    const [customRecipients, setCustomRecipients] = useState<PublishRecipient[]>([]);

    // Search state for ad-hoc users
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PublishRecipient[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Sending state
    const [isPublishing, setIsPublishing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Click outside search results
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search users
    const searchUsers = useCallback(async (q: string) => {
        if (!q.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const res = await api.get('/Admin/users', {
                params: {
                    search: q.trim(),
                    pageSize: '25',
                    page: '1'
                }
            });
            const raw = res.data?.items ?? res.data ?? [];
            const mapped: PublishRecipient[] = (Array.isArray(raw) ? raw : []).map((u: any) => ({
                id_usuario: u.id_usuario ?? u.idUsuario,
                nombre_completo: String(u.nombre_completo ?? u.nombreCompleto ?? u.nombre ?? 'Sin nombre').trim(),
                email: String(u.email ?? u.email_institucional ?? '').trim(),
                type: String(u.type ?? u.tipo ?? 'DOCENTE'),
                departamento: u.departamento ?? u.cargo_instituto,
                carrera: u.carrera,
                cargo_instituto: u.cargo_instituto
            })).filter(u => Boolean(u.email && u.email.includes('@')));
            setSearchResults(mapped);
        } catch {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            searchUsers(searchQuery);
        }, 250);
        return () => clearTimeout(debounceTimerRef.current);
    }, [searchQuery, searchUsers]);

    if (!isOpen || !convocatoria) return null;

    const handleAddRecipient = (rec: PublishRecipient) => {
        if (!customRecipients.some(r => r.email.toLowerCase() === rec.email.toLowerCase())) {
            setCustomRecipients([...customRecipients, rec]);
        }
        setSearchQuery('');
        setIsSearchOpen(false);
    };

    const handleRemoveRecipient = (email: string) => {
        setCustomRecipients(customRecipients.filter(r => r.email.toLowerCase() !== email.toLowerCase()));
    };

    const handleConfirmPublish = async () => {
        setIsPublishing(true);
        setErrorMessage(null);

        const payload = {
            destinatariosUserIds: customRecipients.map(r => r.id_usuario).filter((id): id is number => typeof id === 'number' && id > 0),
            destinatariosEmails: customRecipients.map(r => r.email).filter(Boolean),
            incluirDocentesConHoras,
            incluirAutoridadesYDepartamentos: incluirAutoridades,
            incluirTodosDocentes
        };

        try {
            await api.post(`/Convocatorias/${convocatoria.uuid}/publish`, payload);
            onPublishSuccess();
            onClose();
        } catch (err: any) {
            setErrorMessage(err.response?.data?.message || 'Ocurrió un error al publicar la convocatoria.');
        } finally {
            setIsPublishing(false);
        }
    };

    const tipoNombre = tiposConv.find(t => t.id === convocatoria.id_tipo_convocatoria)?.nombre || 'General';

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-start">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-bg-deep/80 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
            />

            {/* Side Drawer Panel */}
            <div className="relative w-full max-w-xl h-full bg-surface border-r border-border-thin flex flex-col z-10 animate-fade-up shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="modal-header border-b border-border-thin bg-surface px-6 py-5 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge-vercel !text-[9px] font-mono uppercase tracking-widest">
                                {convocatoria.codigo_convocatoria}
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-brand flex items-center gap-1">
                                <Send size={11} /> Difusión Oficial
                            </span>
                        </div>
                        <h3 className="text-lg font-bold tracking-tight text-text-main">
                            Publicar y Difundir Convocatoria
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="modal-body flex-1 overflow-y-auto p-6 space-y-6">
                    {errorMessage && (
                        <div className="p-3.5 rounded-xl border border-error/25 bg-error/5 text-error flex items-start gap-2.5 text-xs animate-fade-in font-medium">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Summary Card */}
                    <div className="p-4 bg-bg-deep/40 rounded-xl border border-border-thin space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-bold text-text-main leading-snug">
                                {convocatoria.titulo}
                            </h4>
                            <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-brand/10 text-brand rounded border border-brand/20 shrink-0">
                                {tipoNombre}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-text-dim font-medium uppercase tracking-tight pt-1 border-t border-border-thin/50">
                            <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-text-dim" /> Apertura: <strong className="text-text-main font-mono">{convocatoria.fecha_apertura}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-error" /> Cierre: <strong className="text-error font-mono">{convocatoria.fecha_cierre}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Section 1: Audience Segments (Smart Toggles) */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                            <Users size={12} className="text-brand" /> Segmentación Institucional Automática
                        </label>

                        <div className="space-y-2">
                            {/* Toggle 1: Docentes con Horas */}
                            <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                incluirDocentesConHoras
                                    ? 'bg-brand/[0.04] border-brand/40 text-text-main'
                                    : 'bg-surface border-border-thin text-text-dim hover:border-zinc-400'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={incluirDocentesConHoras}
                                    onChange={e => setIncluirDocentesConHoras(e.target.checked)}
                                    className="mt-0.5 rounded text-brand focus:ring-0 cursor-pointer"
                                />
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <GraduationCap size={13} className="text-brand" />
                                        <span className="text-xs font-bold">Docentes con Horas de Investigación (SIGAFI)</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Profesores con carga horaria aprobada para actividades de investigación y proyectos en el periodo.
                                    </p>
                                </div>
                            </label>

                            {/* Toggle 2: Autoridades y Departamentos */}
                            <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                incluirAutoridades
                                    ? 'bg-purple-500/[0.04] border-purple-500/40 text-text-main'
                                    : 'bg-surface border-border-thin text-text-dim hover:border-zinc-400'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={incluirAutoridades}
                                    onChange={e => setIncluirAutoridades(e.target.checked)}
                                    className="mt-0.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                                />
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={13} className="text-purple-600 dark:text-purple-400" />
                                        <span className="text-xs font-bold">Autoridades y Departamentos Clave</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Rectorado, Vicerrectorado Académico, Dirección de Comunicación y Coordinación de Investigación.
                                    </p>
                                </div>
                            </label>

                            {/* Toggle 3: Todos los Docentes */}
                            <label className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                incluirTodosDocentes
                                    ? 'bg-blue-500/[0.04] border-blue-500/40 text-text-main'
                                    : 'bg-surface border-border-thin text-text-dim hover:border-zinc-400'
                            }`}>
                                <input
                                    type="checkbox"
                                    checked={incluirTodosDocentes}
                                    onChange={e => setIncluirTodosDocentes(e.target.checked)}
                                    className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                                />
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-1.5">
                                        <UserCheck size={13} className="text-blue-600 dark:text-blue-400" />
                                        <span className="text-xs font-bold">Toda la Planta Docente Activa</span>
                                    </div>
                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Difusión masiva a todos los docentes titulares y contratados registrados en el sistema.
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Section 2: Ad-hoc recipient search and list */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <Plus size={12} className="text-brand" /> Añadir Destinatarios Específicos
                            </label>
                            {customRecipients.length > 0 && (
                                <span className="text-[9px] font-mono text-text-dim font-bold">
                                    {customRecipients.length} adicional{customRecipients.length > 1 ? 'es' : ''}
                                </span>
                            )}
                        </div>

                        {/* Search Input 2-in-1 */}
                        <div className="relative" ref={searchContainerRef}>
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                                type="text"
                                className="input-vercel !pl-8 !py-2 text-xs w-full font-sans"
                                placeholder="Escriba nombre, correo o departamento..."
                                value={searchQuery}
                                onFocus={() => setIsSearchOpen(true)}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    setIsSearchOpen(true);
                                }}
                            />
                            {isSearching && (
                                <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim animate-spin" />
                            )}

                            {/* Dropdown search results */}
                            {isSearchOpen && searchResults.length > 0 && (
                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-xl shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-1 animate-fade-in">
                                    {searchResults.map(r => (
                                        <button
                                            key={r.email}
                                            type="button"
                                            onClick={() => handleAddRecipient(r)}
                                            className="w-full text-left p-2 rounded-lg hover:bg-surface-hover flex items-center justify-between text-xs transition-colors cursor-pointer group"
                                        >
                                            <div className="min-w-0 pr-2">
                                                <p className="font-bold text-text-main group-hover:text-brand transition-colors truncate">
                                                    {r.nombre_completo}
                                                </p>
                                                <p className="text-[10px] text-text-dim font-mono truncate">
                                                    {r.email} {r.departamento ? `• ${r.departamento}` : ''}
                                                </p>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-bg-deep text-text-dim group-hover:bg-brand/10 group-hover:text-brand transition-colors shrink-0">
                                                Añadir
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Custom Recipients Chips */}
                        {customRecipients.length > 0 && (
                            <div className="space-y-1.5 max-h-48 overflow-y-auto p-1">
                                {customRecipients.map(r => (
                                    <div
                                        key={r.email}
                                        className="flex items-center justify-between p-2 rounded-lg bg-bg-deep/40 border border-border-thin text-xs"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <span className="font-bold text-text-main text-[11px] block truncate">
                                                {r.nombre_completo}
                                            </span>
                                            <span className="text-[9px] font-mono text-text-dim truncate block">
                                                {r.email} {r.departamento ? `• ${r.departamento}` : ''}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveRecipient(r.email)}
                                            className="p-1 text-text-dim hover:text-error hover:bg-error/10 rounded transition-colors cursor-pointer shrink-0"
                                            title="Remover"
                                        >
                                            <UserMinus size={13} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="modal-footer border-t border-border-thin bg-surface p-5 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPublishing}
                        className="btn-vercel-secondary text-xs"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmPublish}
                        disabled={isPublishing || (!incluirDocentesConHoras && !incluirAutoridades && !incluirTodosDocentes && customRecipients.length === 0)}
                        className="btn-vercel-primary text-xs"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                Publicando y Despachando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={14} />
                                Publicar y Enviar Comunicados
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
