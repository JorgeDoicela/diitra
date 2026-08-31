import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../../../api/axios_config';
import { Users, CheckCircle2, Loader2, Search, ChevronDown, X, UserCheck, Sparkles } from 'lucide-react';
import type { Carrera } from '../emailEngineTypes';

export interface SelectedPerson {
    idUsuario?: number;
    nombre: string;
    email: string;
    tipo: string;
    carrera?: string;
}

export const USER_TYPES = [
    { value: 'DOCENTE', label: 'Docente' },
    { value: 'ADMINISTRATIVO', label: 'Personal Administrativo / Departamentos' },
    { value: 'ESTUDIANTE', label: 'Estudiante' },
    { value: 'EXTERNO', label: 'Árbitro / Colaborador Externo' }
];

export const ROLE_OPTIONS = [
    { value: 'DIITRA_DOCENTE', label: 'Docentes Investigadores' },
    { value: 'DIITRA_ADMIN', label: 'Administradores DIITRA' },
    { value: 'DIITRA_REVISOR_EXTERNO', label: 'Árbitros Externos' },
    { value: 'DIITRA_ESTUDIANTE', label: 'Semilleristas (Estudiantes)' }
];

export const TYPE_BADGE: Record<string, string> = {
    DOCENTE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ADMINISTRATIVO: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    ESTUDIANTE: 'bg-green-500/10 text-green-600 dark:text-green-400',
    EXTERNO: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
};

export interface RecipientPickerProps {
    carreras: Carrera[];
    selected: SelectedPerson[];
    onSelected: (people: SelectedPerson[]) => void;
    broadcastRole: string;
    onBroadcastRole: (role: string) => void;
    broadcastCarreraId: string;
    onBroadcastCarreraId: (id: string) => void;
}

const mapApiUserToPerson = (u: Record<string, unknown>): SelectedPerson => ({
    idUsuario: (u.id_usuario ?? u.idUsuario) as number | undefined,
    nombre: String(u.nombre_completo ?? u.nombreCompleto ?? u.nombre ?? 'Sin nombre').trim(),
    email: String(u.email ?? u.email_institucional ?? '').trim(),
    tipo: String(u.type ?? u.tipo ?? 'DOCENTE'),
    carrera: String(u.departamento ?? u.carrera ?? u.cargo_instituto ?? '').trim()
});

const personKey = (p: SelectedPerson) =>
    p.idUsuario 
        ? `usr-${p.idUsuario}-${p.tipo}` 
        : `name-${p.nombre.toLowerCase().replace(/\s+/g, '-')}-${p.tipo}`;

/** Puede enviarse si tiene correo visible o cuenta DIITRA (idUsuario). */
const canSelectPerson = (p: SelectedPerson) =>
    Boolean(p.email?.includes('@')) || (p.idUsuario != null && p.idUsuario > 0);

export const RecipientPicker: React.FC<RecipientPickerProps> = ({
    carreras, selected, onSelected,
    broadcastRole, onBroadcastRole,
    broadcastCarreraId, onBroadcastCarreraId
}) => {
    const [mode, setMode] = useState<'personas' | 'difusion'>('personas');
    const [query, setQuery] = useState('');
    const [filterType, setFilterType] = useState('DOCENTE');
    const [filterCarreraId, setFilterCarreraId] = useState('');
    const [results, setResults] = useState<SelectedPerson[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const searchUsers = useCallback(async (q: string, type: string, carreraId: string) => {
        setSearching(true);
        setSearchError(null);
        try {
            const typesToFetch = type ? [type] : (['DOCENTE', 'ADMINISTRATIVO', 'ESTUDIANTE', 'EXTERNO'] as const);
            const carreraLabel = carreraId
                ? carreras.find(c => c.idCarrera.toString() === carreraId)?.carrera1
                : '';

            const batches = await Promise.all(
                typesToFetch.map(async t => {
                    const params: Record<string, string> = { pageSize: '50', page: '1', type: t };
                    if (q.trim()) params.search = q.trim();
                    if (carreraLabel) params.carrera = carreraLabel;
                    const res = await api.get('/Admin/users', { params });
                    const raw = res.data?.items ?? res.data ?? [];
                    return (Array.isArray(raw) ? raw : []).map((u: Record<string, unknown>) =>
                        mapApiUserToPerson(u)
                    );
                })
            );

            const seen = new Set<string>();
            const merged: SelectedPerson[] = [];
            for (const batch of batches) {
                for (const p of batch) {
                    const key = personKey(p);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    merged.push(p);
                }
            }

            merged.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
            setResults(merged);
        } catch {
            setResults([]);
            setSearchError('No se pudo cargar personas. Verifique su sesión de administrador.');
        } finally {
            setSearching(false);
        }
    }, [carreras]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
            () => searchUsers(query, filterType, filterCarreraId),
            query.trim() ? 280 : 80
        );
        return () => clearTimeout(debounceRef.current);
    }, [query, filterType, filterCarreraId, searchUsers]);

    const add = (p: SelectedPerson) => {
        if (!canSelectPerson(p)) return;
        const key = personKey(p);
        if (!selected.some(s => personKey(s) === key)) {
            onSelected([...selected, p]);
        }
    };

    const remove = (p: SelectedPerson) => {
        const targetKey = personKey(p);
        onSelected(selected.filter(s => personKey(s) !== targetKey));
    };

    const totalDestinatarios =
        selected.length > 0
            ? `${selected.length} persona${selected.length > 1 ? 's' : ''}`
            : (broadcastRole || broadcastCarreraId)
                ? 'difusión por filtro'
                : 'ninguno';

    return (
        <div className="space-y-3 p-4 bg-surface rounded-xl border border-border-thin shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-main uppercase tracking-widest flex items-center gap-1.5">
                    <Users size={12} className="text-brand" /> Destinatarios
                </span>
                <span className="text-[9px] text-text-dim">
                    {totalDestinatarios}
                </span>
            </div>

            {/* Mode tabs */}
            <div className="flex border border-border-thin rounded-lg p-0.5 bg-bg-deep/50 gap-0.5">
                {(['personas', 'difusion'] as const).map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 text-[9px] font-semibold uppercase tracking-wider py-1.5 rounded-md transition-all cursor-pointer ${mode === m
                                ? 'bg-surface border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                            }`}
                    >
                        {m === 'personas' ? 'Personas específicas' : 'Difusión por filtro'}
                    </button>
                ))}
            </div>

            {/* ── MODO PERSONAS ── */}
            {mode === 'personas' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[8px] font-semibold text-text-dim uppercase tracking-wider">Tipo</label>
                            <select
                                className="input-vercel !py-1.5 text-xs w-full"
                                value={filterType}
                                onChange={e => {
                                    setFilterType(e.target.value);
                                    setIsOpen(true);
                                }}
                            >
                                <option value="">Todos los tipos</option>
                                {USER_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-semibold text-text-dim uppercase tracking-wider">Carrera</label>
                            <select
                                className="input-vercel !py-1.5 text-xs w-full"
                                value={filterCarreraId}
                                onChange={e => {
                                    setFilterCarreraId(e.target.value);
                                    setIsOpen(true);
                                }}
                            >
                                <option value="">Todas</option>
                                {carreras.map(c => (
                                    <option key={c.idCarrera} value={c.idCarrera.toString()}>{c.carrera1}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Buscador y Selector 2-en-1 */}
                    <div className="space-y-1 relative" ref={containerRef}>
                        <label className="text-[8px] font-semibold text-text-dim uppercase tracking-wider">
                            Buscar y seleccionar persona
                        </label>
                        <div className="relative">
                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
                            <input
                                type="text"
                                className="input-vercel !pl-7 !pr-8 !py-2 text-xs w-full cursor-text font-sans"
                                placeholder={searching ? "Cargando..." : "Escriba nombre o correo para buscar..."}
                                value={query}
                                onFocus={() => setIsOpen(true)}
                                onChange={e => {
                                    setQuery(e.target.value);
                                    setIsOpen(true);
                                }}
                            />
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                {searching && (
                                    <Loader2 size={11} className="text-text-dim animate-spin" />
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="text-text-dim hover:text-text-main transition-colors cursor-pointer focus:outline-none"
                                >
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Dropdown flotante 2 en 1 */}
                        {isOpen && (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 divide-y divide-border-thin animate-fade-in">
                                {searchError && (
                                    <div className="p-3 text-[10px] text-error text-center">{searchError}</div>
                                )}
                                {!searchError && results.length === 0 ? (
                                    <div className="p-3 text-[10px] text-text-dim text-center italic">
                                        {searching ? "Buscando..." : "No se encontraron personas con esos filtros"}
                                    </div>
                                ) : (
                                    results.map(p => {
                                        const key = personKey(p);
                                        const alreadyAdded = selected.some(s => personKey(s) === key);
                                        const selectable = canSelectPerson(p);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                disabled={alreadyAdded || !selectable}
                                                onClick={() => {
                                                    add(p);
                                                    setIsOpen(false);
                                                    setQuery(''); // Limpia el buscador para la siguiente selección
                                                }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${alreadyAdded || !selectable
                                                        ? 'opacity-45 cursor-not-allowed'
                                                        : 'hover:bg-brand/5'
                                                    }`}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-brand/15 flex items-center justify-center text-[9px] font-semibold text-brand shrink-0">
                                                    {p.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-xs font-semibold text-text-main truncate">{p.nombre}</div>
                                                    <div className="text-[9px] text-text-dim font-mono truncate">
                                                        {p.email || (p.idUsuario ? 'Correo desde cuenta DIITRA' : 'Sin correo registrado')}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[8px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_BADGE[p.tipo] ?? 'bg-surface text-text-dim'}`}>
                                                        {USER_TYPES.find(t => t.value === p.tipo)?.label ?? p.tipo}
                                                    </span>
                                                    {alreadyAdded && <CheckCircle2 size={12} className="text-success" />}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )}
                    </div>

                    {/* Chips de personas seleccionadas */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {selected.map(p => (
                                <div
                                    key={personKey(p)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border-thin bg-surface text-xs max-w-full"
                                    title={p.email || 'Correo desde cuenta DIITRA'}
                                >
                                    <span className={`text-[8px] font-semibold px-1 rounded-full ${TYPE_BADGE[p.tipo] ?? 'bg-surface text-text-dim'}`}>
                                        {p.tipo.charAt(0)}
                                    </span>
                                    <span className="font-medium text-text-main truncate max-w-[130px]">{p.nombre}</span>
                                    <span className="text-[8px] text-text-dim font-mono truncate hidden sm:block max-w-[120px]">
                                        {p.email}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => remove(p)}
                                        className="text-text-dim hover:text-error transition-colors ml-0.5 cursor-pointer shrink-0"
                                    >
                                        <X size={11} />
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={() => onSelected([])}
                                className="text-[8px] text-text-dim hover:text-error transition-colors px-1 cursor-pointer"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    )}

                </div>
            )}

            {/* ── MODO DIFUSIÓN ── */}
            {mode === 'difusion' && (
                <div className="space-y-3">
                    <p className="text-[9px] text-text-dim leading-relaxed">
                        El correo llegará a <strong>todos los usuarios activos</strong> que cumplan los criterios seleccionados.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider flex items-center gap-1">
                                <UserCheck size={10} /> Por rol
                            </label>
                            <select
                                className="input-vercel !py-2 text-xs"
                                value={broadcastRole}
                                onChange={e => onBroadcastRole(e.target.value)}
                            >
                                <option value="">— Sin filtro de rol —</option>
                                {ROLE_OPTIONS.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-semibold text-text-dim uppercase tracking-wider">Por carrera</label>
                            <select
                                className="input-vercel !py-2 text-xs"
                                value={broadcastCarreraId}
                                onChange={e => onBroadcastCarreraId(e.target.value)}
                            >
                                <option value="">— Todas las carreras —</option>
                                {carreras.map(c => (
                                    <option key={c.idCarrera} value={c.idCarrera.toString()}>{c.carrera1}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {(broadcastRole || broadcastCarreraId) && (
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-brand/5 border border-brand/20 text-[9px] text-brand font-semibold">
                            <Sparkles size={11} />
                            Enviará a todos los usuarios activos
                            {broadcastRole && ` con rol "${ROLE_OPTIONS.find(r => r.value === broadcastRole)?.label ?? broadcastRole}"`}
                            {broadcastRole && broadcastCarreraId && ' y'}
                            {broadcastCarreraId && ` de la carrera "${carreras.find(c => c.idCarrera.toString() === broadcastCarreraId)?.carrera1 ?? broadcastCarreraId}"`}
                            .
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecipientPicker;
