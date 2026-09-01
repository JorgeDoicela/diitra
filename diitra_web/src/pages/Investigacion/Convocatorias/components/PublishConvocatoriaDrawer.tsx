import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Users, Calendar, Search, Loader2, CheckCircle2,
    Building2, GraduationCap, AlertCircle, Layers, CheckSquare, Square
} from 'lucide-react';
import api from '../../../../api/axios_config';
import type { Convocatoria, Catalogo } from '../types';

export interface RecipientItem {
    id_usuario?: number;
    nombre_completo: string;
    email: string;
    type: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO';
    departamento?: string;
    carrera?: string;
    cargo_instituto?: string;
    tiene_horas?: boolean;
}

interface PublishConvocatoriaDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    convocatoria: Convocatoria | null;
    tiposConv: Catalogo[];
    onPublishSuccess: () => void;
}

type TabCategory = 'CON_HORAS' | 'AUTORIDADES' | 'TODOS_DOCENTES' | 'SELECCIONADOS';

export const PublishConvocatoriaDrawer: React.FC<PublishConvocatoriaDrawerProps> = ({
    isOpen,
    onClose,
    convocatoria,
    tiposConv,
    onPublishSuccess
}) => {
    // Current Active Tab
    const [activeTab, setActiveTab] = useState<TabCategory>('CON_HORAS');

    // Loaded recipients pool
    const [allRecipients, setAllRecipients] = useState<RecipientItem[]>([]);
    const [isLoadingPool, setIsLoadingPool] = useState(false);

    // Selected Emails Set (100% Granular Control)
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

    // Search filter
    const [searchQuery, setSearchQuery] = useState('');

    // Submission state
    const [isPublishing, setIsPublishing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Load pool from backend when drawer opens
    const loadRecipientsPool = useCallback(async () => {
        if (!convocatoria) return;
        setIsLoadingPool(true);
        setErrorMessage(null);

        try {
            const [resDocentesConHoras, resDocentesAll, resAdmins] = await Promise.all([
                api.get('/Admin/users', { params: { type: 'DOCENTE', soloConHoras: true, pageSize: '150' } }).catch(() => ({ data: { items: [] } })),
                api.get('/Admin/users', { params: { type: 'DOCENTE', pageSize: '150' } }).catch(() => ({ data: { items: [] } })),
                api.get('/Admin/users', { params: { type: 'ADMINISTRATIVO', pageSize: '150' } }).catch(() => ({ data: { items: [] } }))
            ]);

            const mapItem = (u: any, type: RecipientItem['type'], tieneHoras: boolean): RecipientItem => ({
                id_usuario: u.id_usuario ?? u.idUsuario,
                nombre_completo: String(u.nombre_completo ?? u.nombreCompleto ?? u.nombre ?? 'Sin nombre').trim(),
                email: String(u.email ?? u.email_institucional ?? '').trim(),
                type,
                departamento: u.departamento ?? u.cargo_instituto ?? 'General',
                carrera: u.carrera,
                cargo_instituto: u.cargo_instituto,
                tiene_horas: tieneHoras
            });

            const rawConHoras = resDocentesConHoras.data?.items ?? resDocentesConHoras.data ?? [];
            const rawAllDocentes = resDocentesAll.data?.items ?? resDocentesAll.data ?? [];
            const rawAdmins = resAdmins.data?.items ?? resAdmins.data ?? [];

            const conHorasEmails = new Set(rawConHoras.map((u: any) => String(u.email ?? u.email_institucional ?? '').trim().toLowerCase()));

            const combinedMap = new Map<string, RecipientItem>();

            rawConHoras.forEach((u: any) => {
                const item = mapItem(u, 'DOCENTE', true);
                if (item.email && item.email.includes('@')) {
                    combinedMap.set(item.email.toLowerCase(), item);
                }
            });

            rawAllDocentes.forEach((u: any) => {
                const item = mapItem(u, 'DOCENTE', conHorasEmails.has(String(u.email ?? u.email_institucional ?? '').trim().toLowerCase()));
                if (item.email && item.email.includes('@') && !combinedMap.has(item.email.toLowerCase())) {
                    combinedMap.set(item.email.toLowerCase(), item);
                }
            });

            rawAdmins.forEach((u: any) => {
                const item = mapItem(u, 'ADMINISTRATIVO', false);
                if (item.email && item.email.includes('@') && !combinedMap.has(item.email.toLowerCase())) {
                    combinedMap.set(item.email.toLowerCase(), item);
                }
            });

            const pool = Array.from(combinedMap.values());
            setAllRecipients(pool);

            // Pre-seleccionar por defecto: Docentes con horas + Autoridades clave
            const defaultSelected = new Set<string>();
            pool.forEach(item => {
                if (item.tiene_horas) {
                    defaultSelected.add(item.email.toLowerCase());
                } else if (item.type === 'ADMINISTRATIVO') {
                    const deptoLower = (item.departamento || '').toLowerCase();
                    if (deptoLower.includes('rector') || deptoLower.includes('vicerrector') || deptoLower.includes('comunicaci') || deptoLower.includes('investiga')) {
                        defaultSelected.add(item.email.toLowerCase());
                    }
                }
            });

            // Si ningún docente tiene horas en el periodo, pre-seleccionar todos los docentes por defecto
            if (defaultSelected.size === 0 && pool.length > 0) {
                pool.forEach(item => defaultSelected.add(item.email.toLowerCase()));
            }

            setSelectedEmails(defaultSelected);
        } catch {
            setErrorMessage('No se pudieron cargar los destinatarios institucionales.');
        } finally {
            setIsLoadingPool(false);
        }
    }, [convocatoria]);

    useEffect(() => {
        if (isOpen) {
            loadRecipientsPool();
        }
    }, [isOpen, loadRecipientsPool]);

    // Filter recipients based on activeTab and search query
    const filteredRecipients = useMemo(() => {
        return allRecipients.filter(item => {
            // Category Tab Filter
            if (activeTab === 'CON_HORAS' && !item.tiene_horas) return false;
            if (activeTab === 'AUTORIDADES' && item.type !== 'ADMINISTRATIVO') return false;
            if (activeTab === 'TODOS_DOCENTES' && item.type !== 'DOCENTE') return false;
            if (activeTab === 'SELECCIONADOS' && !selectedEmails.has(item.email.toLowerCase())) return false;

            // Search Query Filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = item.nombre_completo.toLowerCase().includes(q);
                const matchEmail = item.email.toLowerCase().includes(q);
                const matchDept = (item.departamento || '').toLowerCase().includes(q);
                return matchName || matchEmail || matchDept;
            }

            return true;
        });
    }, [allRecipients, activeTab, searchQuery, selectedEmails]);

    const toggleRecipient = (email: string) => {
        const next = new Set(selectedEmails);
        const lower = email.toLowerCase();
        if (next.has(lower)) {
            next.delete(lower);
        } else {
            next.add(lower);
        }
        setSelectedEmails(next);
    };

    const handleSelectAllVisible = () => {
        const next = new Set(selectedEmails);
        filteredRecipients.forEach(r => next.add(r.email.toLowerCase()));
        setSelectedEmails(next);
    };

    const handleDeselectAllVisible = () => {
        const next = new Set(selectedEmails);
        filteredRecipients.forEach(r => next.delete(r.email.toLowerCase()));
        setSelectedEmails(next);
    };

    const handleConfirmPublish = async () => {
        if (selectedEmails.size === 0) {
            setErrorMessage('Debes seleccionar al menos un destinatario para publicar.');
            return;
        }

        if (!convocatoria) return;

        setIsPublishing(true);
        setErrorMessage(null);

        const chosenRecipients = allRecipients.filter(r => selectedEmails.has(r.email.toLowerCase()));

        const payload = {
            destinatariosUserIds: chosenRecipients.map(r => r.id_usuario).filter((id): id is number => typeof id === 'number' && id > 0),
            destinatariosEmails: chosenRecipients.map(r => r.email).filter(Boolean),
            incluirDocentesConHoras: false,
            incluirAutoridadesYDepartamentos: false,
            incluirTodosDocentes: false
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

    if (!isOpen || !convocatoria) return null;

    const tipoNombre = tiposConv.find(t => t.id === convocatoria.id_tipo_convocatoria)?.nombre || 'Estándar';

    const countConHoras = allRecipients.filter(r => r.tiene_horas).length;
    const countAdmins = allRecipients.filter(r => r.type === 'ADMINISTRATIVO').length;
    const countDocentes = allRecipients.filter(r => r.type === 'DOCENTE').length;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer"
                onClick={onClose}
            />

            {/* Side Drawer Panel */}
            <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-border-thin bg-surface">
                    <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-bg-deep text-text-dim border border-border-thin text-[10px] font-mono uppercase rounded-md">
                            {convocatoria.codigo_convocatoria}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-text-main">
                            <span className="dot dot-pulse dot-brand" />
                            <span>Difusión de Convocatoria</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-text-dim hover:text-text-main hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-surface">
                    {errorMessage && (
                        <div className="p-4 rounded-xl border border-error/25 bg-error/5 text-error flex items-start gap-2.5 text-xs animate-fade-in font-medium">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold tracking-tight text-text-main leading-tight font-sans">
                            {convocatoria.titulo}
                        </h2>
                    </div>

                    {/* Bento Cards: Dates & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} /> Fecha de Apertura
                            </div>
                            <div className="text-sm font-bold text-text-main font-mono">
                                {convocatoria.fecha_apertura}
                            </div>
                        </div>

                        <div className="bento-card static p-5 space-y-1.5">
                            <div className="text-[10px] font-bold text-error uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={12} /> Fecha de Cierre (Límite)
                            </div>
                            <div className="text-sm font-bold text-error font-mono">
                                {convocatoria.fecha_cierre}
                            </div>
                        </div>

                        <div className="bento-card static p-5 space-y-1.5 col-span-2">
                            <div className="text-[10px] font-bold text-brand uppercase tracking-widest flex items-center gap-1.5">
                                <Layers size={12} /> Tipo de Convocatoria
                            </div>
                            <div className="text-sm font-bold text-text-main">
                                {tipoNombre}
                            </div>
                        </div>
                    </div>

                    {/* Section: Recipients Control Panel */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                <Users size={12} /> Destinatarios del Comunicado
                            </h4>
                            <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-brand/10 text-brand border border-brand/20">
                                {selectedEmails.size} seleccionados
                            </span>
                        </div>

                        {/* Category Tabs */}
                        <div className="flex flex-wrap gap-2 border-b border-border-thin pb-3">
                            <button
                                type="button"
                                onClick={() => setActiveTab('CON_HORAS')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'CON_HORAS'
                                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                                        : 'bg-bg-deep text-text-dim hover:text-text-main'
                                }`}
                            >
                                <GraduationCap size={13} />
                                Con Horas ({countConHoras})
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('AUTORIDADES')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'AUTORIDADES'
                                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                                        : 'bg-bg-deep text-text-dim hover:text-text-main'
                                }`}
                            >
                                <Building2 size={13} />
                                Autoridades ({countAdmins})
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('TODOS_DOCENTES')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'TODOS_DOCENTES'
                                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                                        : 'bg-bg-deep text-text-dim hover:text-text-main'
                                }`}
                            >
                                Docentes ({countDocentes})
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('SELECCIONADOS')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'SELECCIONADOS'
                                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                                        : 'bg-bg-deep text-text-dim hover:text-text-main'
                                }`}
                            >
                                Confirmados ({selectedEmails.size})
                            </button>
                        </div>

                        {/* Search and Bulk Actions */}
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-dim" />
                                <input
                                    type="text"
                                    className="input-vercel !pl-9 !py-2 text-xs w-full font-sans"
                                    placeholder="Buscar por nombre, correo o departamento..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleSelectAllVisible}
                                className="p-2 text-[11px] font-bold text-text-dim hover:text-text-main border border-border-thin rounded-lg hover:bg-surface-hover transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                title="Seleccionar visibles"
                            >
                                <CheckSquare size={13} /> Todos
                            </button>

                            <button
                                type="button"
                                onClick={handleDeselectAllVisible}
                                className="p-2 text-[11px] font-bold text-text-dim hover:text-error border border-border-thin rounded-lg hover:bg-surface-hover transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                title="Deseleccionar visibles"
                            >
                                <Square size={13} /> Ninguno
                            </button>
                        </div>

                        {/* Interactive Recipients List */}
                        <div className="bento-card static p-2 max-h-72 overflow-y-auto space-y-1">
                            {isLoadingPool ? (
                                <div className="py-12 flex flex-col items-center justify-center gap-2 text-text-dim">
                                    <Loader2 size={20} className="animate-spin text-brand" />
                                    <span className="text-xs font-medium">Cargando nómina institucional...</span>
                                </div>
                            ) : filteredRecipients.length === 0 ? (
                                <div className="py-8 text-center text-xs text-text-dim space-y-1">
                                    <p className="font-bold text-text-main">No se encontraron personas en este filtro.</p>
                                    <p className="text-[11px]">Cambia de pestaña o ajusta el término de búsqueda.</p>
                                </div>
                            ) : (
                                filteredRecipients.map(r => {
                                    const isChecked = selectedEmails.has(r.email.toLowerCase());
                                    return (
                                        <div
                                            key={r.email}
                                            onClick={() => toggleRecipient(r.email)}
                                            className={`p-2.5 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer select-none ${
                                                isChecked
                                                    ? 'bg-brand/[0.05] border border-brand/20'
                                                    : 'hover:bg-surface-hover border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {}} // Handled by parent div onClick
                                                    className="rounded border-border-thin text-brand focus:ring-0 cursor-pointer pointer-events-none"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-text-main truncate">
                                                            {r.nombre_completo}
                                                        </span>
                                                        {r.tiene_horas && (
                                                            <span className="px-1.5 py-0.2 text-[8px] font-mono font-bold bg-brand/10 text-brand rounded border border-brand/20 shrink-0">
                                                                Horas I+D
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-mono text-text-dim truncate block">
                                                        {r.email} {r.departamento ? `• ${r.departamento}` : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            <span className="badge-vercel !text-[8px] font-bold uppercase tracking-wider shrink-0">
                                                {r.type}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-border-thin bg-surface flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isPublishing}
                        className="btn-vercel-secondary flex-1"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmPublish}
                        disabled={isPublishing || selectedEmails.size === 0}
                        className="btn-vercel-primary flex-1 justify-center flex items-center gap-2"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Publicando y Despachando...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Publicar a {selectedEmails.size} Destinatario{selectedEmails.size !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
