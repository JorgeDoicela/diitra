import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Search, Loader2, CheckCircle2,
    Building2, GraduationCap, AlertCircle,
    Calendar, Layers, Users, Edit2
} from 'lucide-react';
import api from '../../../../api/axios_config';
import type { Convocatoria, Catalogo } from '../types';

export interface RecipientItem {
    key: string;
    id_usuario?: number;
    id_sigafi?: string;
    nombre_completo: string;
    email: string;
    type: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO';
    departamento?: string;
    carrera?: string;
    cargo_instituto?: string;
    tiene_horas?: boolean;
    horas_investigacion?: number;
}

interface PublishConvocatoriaDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    convocatoria: Convocatoria | null;
    tiposConv: Catalogo[];
    onPublishSuccess: () => void;
    onEdit?: (conv: Convocatoria) => void;
}

type TabCategory = 'CON_HORAS' | 'AUTORIDADES' | 'TODOS_DOCENTES' | 'SELECCIONADOS';

const getInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
    }
    return (parts[0] ? parts[0].slice(0, 2) : 'DI').toUpperCase();
};

export const PublishConvocatoriaDrawer: React.FC<PublishConvocatoriaDrawerProps> = ({
    isOpen,
    onClose,
    convocatoria,
    tiposConv,
    onPublishSuccess,
    onEdit
}) => {
    const [activeTab, setActiveTab] = useState<TabCategory>('CON_HORAS');
    const [allRecipients, setAllRecipients] = useState<RecipientItem[]>([]);
    const [isLoadingPool, setIsLoadingPool] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
    const [departmentsList, setDepartmentsList] = useState<string[]>([]);
    const [isPublishing, setIsPublishing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadRecipientsPool = useCallback(async () => {
        if (!convocatoria) return;
        setIsLoadingPool(true);
        setErrorMessage(null);

        try {
            const [resDocentesConHoras, resDocentesAll, resAdmins] = await Promise.all([
                api.get('/Admin/users', { params: { type: 'DOCENTE', soloConHoras: true, pageSize: '250' } }).catch(() => ({ data: { items: [] } })),
                api.get('/Admin/users', { params: { type: 'DOCENTE', pageSize: '250' } }).catch(() => ({ data: { items: [] } })),
                api.get('/Admin/users', { params: { type: 'ADMINISTRATIVO', pageSize: '250' } }).catch(() => ({ data: { items: [] } }))
            ]);

            const getRecipientKey = (u: any, type: string) => {
                const idSigafi = u.id_sigafi || u.idSigafi || u.id_profesor || u.idProfesor || u.identificacion;
                const idUsuario = u.id_usuario ?? u.idUsuario;
                const email = String(u.email ?? u.email_institucional ?? u.emailInstitucional ?? '').trim().toLowerCase();
                const nombre = String(u.nombre_completo ?? u.nombreCompleto ?? u.nombre ?? '').trim().toLowerCase();
                if (idSigafi) return `${type}-sigafi-${String(idSigafi).trim()}`;
                if (idUsuario) return `${type}-usr-${idUsuario}`;
                if (email) return `${type}-mail-${email}`;
                return `${type}-nom-${nombre}`;
            };

            const mapItem = (u: any, type: RecipientItem['type'], tieneHoras: boolean): RecipientItem => {
                const key = getRecipientKey(u, type);
                const hrs = typeof u.horas_investigacion === 'number' 
                    ? u.horas_investigacion 
                    : typeof u.horasInvestigacion === 'number'
                        ? u.horasInvestigacion
                        : (tieneHoras ? 1 : 0);

                const rawDepto = u.departamento ?? u.carrera ?? '';
                const rawCargo = u.cargo_instituto ?? u.cargoInstituto ?? '';
                const rawCarrera = u.carrera ?? '';
                const email = String(u.email ?? u.email_institucional ?? u.emailInstitucional ?? '').trim();

                return {
                    key,
                    id_usuario: u.id_usuario ?? u.idUsuario,
                    id_sigafi: u.id_sigafi ?? u.idSigafi ?? u.id_profesor ?? u.idProfesor,
                    nombre_completo: String(u.nombre_completo ?? u.nombreCompleto ?? u.nombre ?? 'Sin nombre').trim(),
                    email,
                    type,
                    departamento: rawDepto,
                    carrera: rawCarrera,
                    cargo_instituto: rawCargo,
                    tiene_horas: tieneHoras || hrs > 0,
                    horas_investigacion: hrs
                };
            };

            const rawConHoras: any[] = resDocentesConHoras.data?.items ?? resDocentesConHoras.data ?? [];
            const rawAllDocentes: any[] = resDocentesAll.data?.items ?? resDocentesAll.data ?? [];
            const rawAdmins: any[] = resAdmins.data?.items ?? resAdmins.data ?? [];

            const conHorasKeySet = new Set(rawConHoras.map(u => getRecipientKey(u, 'DOCENTE')));
            const combinedMap = new Map<string, RecipientItem>();

            // 1. Docentes con horas
            rawConHoras.forEach(u => {
                const item = mapItem(u, 'DOCENTE', true);
                if (item.nombre_completo) {
                    combinedMap.set(item.key, item);
                }
            });

            // 2. Todos los docentes
            rawAllDocentes.forEach(u => {
                const key = getRecipientKey(u, 'DOCENTE');
                if (!combinedMap.has(key)) {
                    const item = mapItem(u, 'DOCENTE', conHorasKeySet.has(key));
                    if (item.nombre_completo) {
                        combinedMap.set(key, item);
                    }
                }
            });

            // 3. Autoridades y Administrativos
            rawAdmins.forEach(u => {
                const key = getRecipientKey(u, 'ADMINISTRATIVO');
                if (!combinedMap.has(key)) {
                    const item = mapItem(u, 'ADMINISTRATIVO', false);
                    if (item.nombre_completo) {
                        combinedMap.set(key, item);
                    }
                }
            });

            const pool = Array.from(combinedMap.values());
            setAllRecipients(pool);

            // Extraer departamentos únicos de administrativos
            const depts = Array.from(
                new Set(
                    pool
                        .filter(r => r.type === 'ADMINISTRATIVO' && r.departamento && r.departamento !== 'Sin departamento asignado' && r.departamento !== 'General')
                        .map(r => r.departamento!)
                )
            ).sort((a, b) => a.localeCompare(b));
            setDepartmentsList(depts);

            // Pre-seleccionar por defecto: Docentes con horas + ÚNICAMENTE Rector y Vicerrector/a
            const defaultSelected = new Set<string>();
            pool.forEach(item => {
                if (item.tiene_horas) {
                    defaultSelected.add(item.key);
                } else if (item.type === 'ADMINISTRATIVO') {
                    const cargo = (item.cargo_instituto || '').toLowerCase().trim();
                    const isRectorOrVicerrector = 
                        cargo === 'rector' || cargo === 'rectora' || cargo === 'rector/a' ||
                        cargo === 'vicerrector' || cargo === 'vicerrectora' || cargo === 'vicerrector/a' || 
                        cargo === 'vicerector' || cargo === 'vicerector/a';

                    if (isRectorOrVicerrector) {
                        defaultSelected.add(item.key);
                    }
                }
            });

            // Si nadie tiene horas, pre-seleccionar todo el pool
            if (defaultSelected.size === 0 && pool.length > 0) {
                pool.forEach(item => defaultSelected.add(item.key));
            }

            setSelectedKeys(defaultSelected);
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

    const filteredRecipients = useMemo(() => {
        return allRecipients.filter(item => {
            if (activeTab === 'CON_HORAS' && !item.tiene_horas) return false;
            if (activeTab === 'AUTORIDADES') {
                if (item.type !== 'ADMINISTRATIVO') return false;
                if (selectedDeptFilter && (item.departamento || '').trim().toLowerCase() !== selectedDeptFilter.trim().toLowerCase()) {
                    return false;
                }
            }
            if (activeTab === 'TODOS_DOCENTES' && item.type !== 'DOCENTE') return false;
            if (activeTab === 'SELECCIONADOS' && !selectedKeys.has(item.key)) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = item.nombre_completo.toLowerCase().includes(q);
                const matchEmail = item.email.toLowerCase().includes(q);
                const matchDept = (item.departamento || '').toLowerCase().includes(q);
                const matchCargo = (item.cargo_instituto || '').toLowerCase().includes(q);
                const matchCarrera = (item.carrera || '').toLowerCase().includes(q);
                return matchName || matchEmail || matchDept || matchCargo || matchCarrera;
            }

            return true;
        });
    }, [allRecipients, activeTab, searchQuery, selectedKeys, selectedDeptFilter]);

    const toggleRecipient = (key: string) => {
        const next = new Set(selectedKeys);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        setSelectedKeys(next);
    };

    const handleSelectAllVisible = () => {
        const next = new Set(selectedKeys);
        filteredRecipients.forEach(r => next.add(r.key));
        setSelectedKeys(next);
    };

    const handleDeselectAllVisible = () => {
        const next = new Set(selectedKeys);
        filteredRecipients.forEach(r => next.delete(r.key));
        setSelectedKeys(next);
    };

    const handleConfirmPublish = async () => {
        if (!convocatoria) return;

        const chosenRecipients = allRecipients.filter(r => selectedKeys.has(r.key));
        if (chosenRecipients.length === 0) {
            setErrorMessage('Debes seleccionar al menos un destinatario para publicar.');
            return;
        }

        const uniqueEmails = Array.from(new Set(chosenRecipients.map(r => r.email).filter(e => e && e.includes('@'))));
        const userIds = Array.from(new Set(chosenRecipients.map(r => r.id_usuario).filter((id): id is number => typeof id === 'number' && id > 0)));

        if (uniqueEmails.length === 0 && userIds.length === 0) {
            setErrorMessage('Los destinatarios seleccionados no tienen correos electrónicos válidos registrados.');
            return;
        }

        setIsPublishing(true);
        setErrorMessage(null);

        const payload = {
            destinatariosUserIds: userIds,
            destinatariosEmails: uniqueEmails,
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

    const tipoNombre = tiposConv.find(t => t.id === convocatoria.id_tipo_convocatoria)?.nombre || 'Investigación Institucional';
    const countConHoras = allRecipients.filter(r => r.tiene_horas).length;
    const countAdmins = allRecipients.filter(r => r.type === 'ADMINISTRATIVO').length;
    const countDocentes = allRecipients.filter(r => r.type === 'DOCENTE').length;

    const selectedConHoras = allRecipients.filter(r => r.tiene_horas && selectedKeys.has(r.key)).length;
    const selectedAdmins = allRecipients.filter(r => r.type === 'ADMINISTRATIVO' && selectedKeys.has(r.key)).length;
    const selectedDocentes = allRecipients.filter(r => r.type === 'DOCENTE' && selectedKeys.has(r.key)).length;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-xs cursor-pointer transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Panel Lateral Vercel Geist — Más amplio a la izquierda */}
            <div className="relative w-full max-w-3xl xl:max-w-4xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-10 animate-fade-up shadow-2xl">
                
                {/* Header Superior Sobrio */}
                <div className="flex items-center justify-between px-8 py-4.5 border-b border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                        Difusión de Convocatoria
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Cerrar"
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* Body: Contenido estructurado con equilibrio visual */}
                <div className="flex-1 min-h-0 flex flex-col p-8 space-y-5 overflow-hidden bg-white dark:bg-zinc-950">
                    
                    {errorMessage && (
                        <div className="p-4 rounded-xl border border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400 flex items-start gap-2.5 text-xs animate-fade-in font-medium shrink-0">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Tarjeta de Resumen Bento */}
                    <div className="p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 space-y-4 shrink-0 shadow-xs">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-semibold block mb-1">
                                    Convocatoria
                                </span>
                                <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 leading-snug truncate">
                                    {convocatoria.titulo}
                                </h2>
                            </div>
                            <span className="px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold rounded-md shrink-0">
                                {convocatoria.codigo_convocatoria}
                            </span>
                        </div>

                        {/* Grid de 3 Columnas Clave */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-200/70 dark:border-zinc-800">
                            <div className="space-y-1">
                                <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Layers size={13} className="text-zinc-400" />
                                    <span>Tipo</span>
                                </span>
                                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block">
                                    {tipoNombre}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={13} className="text-zinc-400" />
                                    <span>Apertura</span>
                                </span>
                                <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 block">
                                    {convocatoria.fecha_apertura}
                                </span>
                            </div>

                            <div className="space-y-1">
                                <span className="text-[10.5px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <Calendar size={13} className="text-zinc-400" />
                                    <span>Cierre</span>
                                </span>
                                <span className="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 block">
                                    {convocatoria.fecha_cierre}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Pestañas de Segmentos estilo Vercel */}
                    <div className="space-y-3 shrink-0">
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                            <div className="flex gap-7 -mb-px">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('CON_HORAS')}
                                    className={`pb-2.5 text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap shrink-0 ${
                                        activeTab === 'CON_HORAS'
                                            ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
                                    }`}
                                >
                                    <GraduationCap size={14} />
                                    <span>Con Horas de Investigación</span>
                                    <span className="text-[10.5px] font-mono font-semibold opacity-85">({selectedConHoras}/{countConHoras})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('AUTORIDADES')}
                                    className={`pb-2.5 text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap shrink-0 ${
                                        activeTab === 'AUTORIDADES'
                                            ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
                                    }`}
                                >
                                    <Building2 size={14} />
                                    <span>Administrativos</span>
                                    <span className="text-[10.5px] font-mono font-semibold opacity-85">({selectedAdmins}/{countAdmins})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('TODOS_DOCENTES')}
                                    className={`pb-2.5 text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap shrink-0 ${
                                        activeTab === 'TODOS_DOCENTES'
                                            ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
                                    }`}
                                >
                                    <Users size={14} />
                                    <span>Docentes</span>
                                    <span className="text-[10.5px] font-mono font-semibold opacity-85">({selectedDocentes}/{countDocentes})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setActiveTab('SELECCIONADOS')}
                                    className={`pb-2.5 text-xs transition-colors flex items-center gap-2 cursor-pointer border-b-2 whitespace-nowrap shrink-0 ${
                                        activeTab === 'SELECCIONADOS'
                                            ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white font-bold'
                                            : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 font-medium'
                                    }`}
                                >
                                    <span>Seleccionados</span>
                                    <span className="text-[10.5px] font-mono font-semibold opacity-85">({selectedKeys.size})</span>
                                </button>
                            </div>
                        </div>

                        {/* Barra de Búsqueda y Filtro de Departamento */}
                        <div className="flex flex-col sm:flex-row gap-2.5">
                            <div className="relative flex-1">
                                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
                                    placeholder={activeTab === 'AUTORIDADES' ? "Buscar por nombre, correo, cargo..." : "Buscar por nombre, correo, departamento o carrera..."}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {activeTab === 'AUTORIDADES' && departmentsList.length > 0 && (
                                <div className="sm:w-64">
                                    <select
                                        value={selectedDeptFilter}
                                        onChange={e => setSelectedDeptFilter(e.target.value)}
                                        className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors cursor-pointer font-medium"
                                    >
                                        <option value="">Todos los Departamentos ({departmentsList.length})</option>
                                        {departmentsList.map(dept => (
                                            <option key={dept} value={dept}>
                                                {dept}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Acciones de Selección Rápidas y Transparentes */}
                        <div className="flex items-center justify-between px-1 text-xs">
                            <span className="text-zinc-500 font-medium">
                                Mostrando {filteredRecipients.length} persona{filteredRecipients.length !== 1 ? 's' : ''}
                            </span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleSelectAllVisible}
                                    className="font-semibold text-zinc-900 dark:text-zinc-100 hover:underline cursor-pointer"
                                >
                                    Seleccionar todos
                                </button>
                                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                <button
                                    type="button"
                                    onClick={handleDeselectAllVisible}
                                    className="font-medium text-zinc-500 hover:text-red-600 transition-colors cursor-pointer"
                                >
                                    Deseleccionar todos
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista Contenida y Delimitada de Destinatarios */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-xl border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/60 bg-white dark:bg-zinc-950">
                        {isLoadingPool ? (
                            <div className="h-48 flex flex-col items-center justify-center gap-2 text-zinc-400">
                                <Loader2 size={20} className="animate-spin text-zinc-600 dark:text-zinc-300" />
                                <span className="text-xs font-medium">Cargando nómina institucional...</span>
                            </div>
                        ) : filteredRecipients.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-center p-6 space-y-1 text-zinc-400">
                                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">No se encontraron destinatarios en esta sección.</p>
                                <p className="text-[11px]">Prueba cambiando de pestaña o limpiando el término de búsqueda.</p>
                            </div>
                        ) : (
                            filteredRecipients.map(r => {
                                const isChecked = selectedKeys.has(r.key);
                                const initials = getInitials(r.nombre_completo);

                                return (
                                    <div
                                        key={r.key}
                                        onClick={() => toggleRecipient(r.key)}
                                        className={`px-4 py-3 flex items-center justify-between gap-3.5 text-xs transition-colors cursor-pointer select-none ${
                                            isChecked
                                                ? 'bg-zinc-50/80 dark:bg-zinc-900/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-900/70'
                                                : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => {}}
                                                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 cursor-pointer pointer-events-none accent-zinc-950 dark:accent-zinc-100 shrink-0"
                                            />

                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700 flex items-center justify-center font-mono text-[11px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
                                                {initials}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                        {r.nombre_completo}
                                                    </span>
                                                    {r.tiene_horas && (
                                                        <span className="px-1.5 py-0.2 text-[9px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-md border border-emerald-500/20 shrink-0">
                                                            {r.horas_investigacion ? `${r.horas_investigacion}h I+D` : 'Horas I+D'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                                    <span className="font-mono truncate">{r.email}</span>
                                                    {r.type === 'ADMINISTRATIVO' ? (
                                                        <>
                                                            {r.departamento && r.departamento !== 'Sin departamento asignado' && (
                                                                <>
                                                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                                    <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">{r.departamento}</span>
                                                                </>
                                                            )}
                                                            {r.cargo_instituto && r.cargo_instituto !== 'Personal Institucional' && (
                                                                <>
                                                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                                    <span className="truncate text-zinc-400">{r.cargo_instituto}</span>
                                                                </>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {r.carrera && (
                                                                <>
                                                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                                    <span className="truncate">{r.carrera}</span>
                                                                </>
                                                            )}
                                                            {r.cargo_instituto && (
                                                                <>
                                                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                                    <span className="truncate text-zinc-400">({r.cargo_instituto})</span>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 shrink-0 uppercase tracking-wider">
                                            {r.type}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer Fijo Minimalista */}
                <div className="px-7 py-4 border-t border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isPublishing}
                            className="h-10 px-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-[13px] font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        {onEdit && convocatoria && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onEdit(convocatoria);
                                }}
                                disabled={isPublishing}
                                className="h-10 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-[13px] font-medium hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors cursor-pointer flex items-center gap-2"
                                title="Editar parámetros de la convocatoria"
                            >
                                <Edit2 size={14} />
                                <span>Editar</span>
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={handleConfirmPublish}
                        disabled={isPublishing || selectedKeys.size === 0}
                        className="h-10 px-6 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-[13px] font-medium hover:bg-black dark:hover:bg-zinc-100 active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isPublishing ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span>Publicando y Despachando...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={15} />
                                <span>Publicar a {selectedKeys.size} Persona{selectedKeys.size !== 1 ? 's' : ''}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
