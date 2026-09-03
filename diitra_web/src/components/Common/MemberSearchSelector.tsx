import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, X, Briefcase, GraduationCap, Globe, Check, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios_config';

export interface SelectedMemberResult {
    id_usuario: number;
    cedula: string;
    nombre_completo: string;
    email: string;
    tipo: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO';
    carrera?: string;
    departamento?: string;
    cargo_instituto?: string;
    horas_investigacion?: number;
    horas_asignadas?: number;
    es_graduado?: boolean;
    es_instituto?: boolean;
    rol: string;
    telefono: string;
}

interface MemberSearchSelectorProps {
    onAddMember?: (member: SelectedMemberResult) => void;
    existingCedulas?: string[];
    allowedTypes?: ('DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO')[];
    defaultType?: 'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO';
    title?: string;
    subtitle?: string;
    excludeCoordinatorCedula?: string;
    isCoordinatorSelectorOnly?: boolean;
    onSelectCoordinator?: (member: SelectedMemberResult) => void;
    selectedCoordinatorCedula?: string;
    soloConHorasDocentes?: boolean;
    estadoEstudiante?: string;
    variant?: 'card' | 'embedded';
}

export const formatNombre = (nombre: string | null | undefined) => {
    if (!nombre) return '';
    return nombre
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

export const MemberSearchSelector: React.FC<MemberSearchSelectorProps> = ({
    onAddMember = () => {},
    existingCedulas = [],
    allowedTypes = ['DOCENTE', 'ADMINISTRATIVO', 'ESTUDIANTE', 'EXTERNO'],
    defaultType = 'DOCENTE',
    title = 'Añadir Integrante al Grupo',
    subtitle = 'Busque y seleccione personal docente, administrativo, estudiantes o colaboradores externos.',
    excludeCoordinatorCedula,
    isCoordinatorSelectorOnly = false,
    onSelectCoordinator,
    selectedCoordinatorCedula,
    soloConHorasDocentes = false,
    estadoEstudiante = 'TODOS',
    variant = 'card'
}) => {
    const [selectedType, setSelectedType] = useState<'DOCENTE' | 'ADMINISTRATIVO' | 'ESTUDIANTE' | 'EXTERNO'>(defaultType);
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [memberRole, setMemberRole] = useState<string>('Co-Investigador');
    const [memberPhone, setMemberPhone] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Ajustar el rol por defecto cuando cambia el tipo de candidato seleccionado
    const getSuggestedRoles = (type: string) => {
        switch (type) {
            case 'DOCENTE':
                return ['Co-Investigador', 'Director de Proyecto', 'Investigador Principal', 'Colaborador Docente'];
            case 'ADMINISTRATIVO':
                return ['Personal de Apoyo Técnico', 'Gestor Administrativo', 'Co-Investigador Técnico'];
            case 'ESTUDIANTE':
                return ['Semillerista', 'Auxiliar de Investigación', 'Investigador Egresado/Graduado'];
            case 'EXTERNO':
                return ['Investigador Asociado', 'Asesor Científico', 'Evaluador Externo'];
            default:
                return ['Co-Investigador', 'Semillerista', 'Personal de Apoyo'];
        }
    };

    const isEmbedded = variant === 'embedded';

    // Petición debounced hacia /api/Admin/users (inmediata si es embedded)
    useEffect(() => {
        if (!isEmbedded && (!showDropdown || !searchQuery.trim())) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        const delay = isEmbedded && !searchQuery.trim() ? 0 : 250;
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const params = new URLSearchParams({
                    search: searchQuery.trim(),
                    type: selectedType,
                    page: '1',
                    pageSize: isEmbedded ? '50' : '20',
                    soloConHoras: (selectedType === 'DOCENTE' && soloConHorasDocentes) ? 'true' : 'false',
                    estadoEstudiante: selectedType === 'ESTUDIANTE' ? estadoEstudiante : 'TODOS',
                    origenEstudiante: 'TODOS'
                });

                const res = await api.get(`/Admin/users?${params.toString()}`);
                const items: any[] = res.data?.items || [];
                setResults(items);
            } catch (err) {
                console.error('[MemberSearchSelector] Error buscando personal:', err);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, delay);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedType, showDropdown, soloConHorasDocentes, estadoEstudiante, isEmbedded]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectCandidate = (candidate: any) => {
        const cedula = (candidate.id_profesor || candidate.id_sigafi || '').trim();

        if (isCoordinatorSelectorOnly) {
            if (onSelectCoordinator) {
                onSelectCoordinator({
                    id_usuario: candidate.id_usuario || 0,
                    cedula,
                    nombre_completo: candidate.nombre_completo || candidate.nombre || '',
                    email: candidate.email || '',
                    tipo: candidate.type || selectedType,
                    carrera: candidate.carrera,
                    departamento: candidate.departamento,
                    cargo_instituto: candidate.cargo_instituto,
                    horas_investigacion: candidate.horas_investigacion,
                    horas_asignadas: candidate.horas_asignadas,
                    rol: 'Coordinador',
                    telefono: candidate.telefono || ''
                });
            }
            setShowDropdown(false);
            setSearchQuery('');
            return;
        }

        if (excludeCoordinatorCedula && cedula === excludeCoordinatorCedula.trim()) {
            setStatusMessage({ type: 'error', text: 'Esta persona ya es el Coordinador Responsable del grupo.' });
            return;
        }

        if (existingCedulas.some(c => c.trim() === cedula)) {
            setStatusMessage({ type: 'error', text: 'Esta persona ya está registrada como integrante del grupo.' });
            return;
        }

        setSelectedCandidate(candidate);
        const roles = getSuggestedRoles(candidate.type || selectedType);
        setMemberRole(roles[0]);
        setShowDropdown(false);
        setStatusMessage(null);
    };

    const handleConfirmAdd = () => {
        if (!selectedCandidate) return;
        const cedula = (selectedCandidate.id_profesor || selectedCandidate.id_sigafi || '').trim();

        const newMember: SelectedMemberResult = {
            id_usuario: selectedCandidate.id_usuario || 0,
            cedula,
            nombre_completo: selectedCandidate.nombre_completo || selectedCandidate.nombre || '',
            email: selectedCandidate.email || '',
            tipo: selectedCandidate.type || selectedType,
            carrera: selectedCandidate.carrera,
            departamento: selectedCandidate.departamento,
            cargo_instituto: selectedCandidate.cargo_instituto,
            horas_investigacion: selectedCandidate.horas_investigacion,
            horas_asignadas: selectedCandidate.horas_asignadas,
            es_graduado: selectedCandidate.es_graduado,
            es_instituto: selectedCandidate.es_instituto,
            rol: memberRole,
            telefono: memberPhone.trim()
        };

        onAddMember(newMember);

        // Reset
        setSelectedCandidate(null);
        setSearchQuery('');
        setMemberPhone('');
        setStatusMessage({ type: 'success', text: `Integrante "${formatNombre(newMember.nombre_completo)}" añadido con éxito.` });
        setTimeout(() => setStatusMessage(null), 3000);
    };

    return (
        <div ref={containerRef} className={variant === 'embedded' ? 'space-y-4' : 'p-4 bg-surface rounded-2xl border border-border-thin space-y-4'}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h5 className="text-[11px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                        <UserPlus size={13} className="text-text-main" /> {title}
                    </h5>
                    <p className="text-[10px] text-text-dim mt-0.5">{subtitle}</p>
                </div>

                {/* Tabs de tipo de personal */}
                {allowedTypes.length > 1 && !selectedCandidate && (
                    <div className="bg-bg-deep border border-border-thin p-0.5 rounded-lg flex shrink-0">
                        {allowedTypes.includes('DOCENTE') && (
                            <button
                                type="button"
                                onClick={() => { setSelectedType('DOCENTE'); setResults([]); }}
                                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    selectedType === 'DOCENTE' ? 'bg-surface text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'
                                }`}
                            >
                                Docentes
                            </button>
                        )}
                        {allowedTypes.includes('ESTUDIANTE') && (
                            <button
                                type="button"
                                onClick={() => { setSelectedType('ESTUDIANTE'); setResults([]); }}
                                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    selectedType === 'ESTUDIANTE' ? 'bg-surface text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'
                                }`}
                            >
                                Estudiantes
                            </button>
                        )}
                        {allowedTypes.includes('ADMINISTRATIVO') && (
                            <button
                                type="button"
                                onClick={() => { setSelectedType('ADMINISTRATIVO'); setResults([]); }}
                                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    selectedType === 'ADMINISTRATIVO' ? 'bg-surface text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'
                                }`}
                            >
                                Administrativos
                            </button>
                        )}
                        {allowedTypes.includes('EXTERNO') && (
                            <button
                                type="button"
                                onClick={() => { setSelectedType('EXTERNO'); setResults([]); }}
                                className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    selectedType === 'EXTERNO' ? 'bg-surface text-text-main shadow-xs' : 'text-text-dim hover:text-text-main'
                                }`}
                            >
                                Externos
                            </button>
                        )}
                    </div>
                )}
            </div>

            {statusMessage && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    statusMessage.type === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}>
                    {statusMessage.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {!selectedCandidate ? (
                <div className="relative">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/60" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder={`Buscar ${selectedType.toLowerCase()} por nombre o cédula...`}
                            className="input-vercel !pl-9 !pr-4 !py-2.5 !text-xs w-full uppercase placeholder:normal-case font-medium"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main cursor-pointer"
                            >
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Lista embebida directa para Drawers/Paneles */}
                    {isEmbedded ? (
                        <div className="space-y-2 mt-4">
                            <div className="flex items-center justify-between px-1">
                                <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                                    {selectedType === 'DOCENTE' ? 'Docentes con Horas de Investigación' : 'Estudiantes Matriculados'} ({results.length})
                                </p>
                                {isSearching && (
                                    <span className="text-[10px] text-text-dim flex items-center gap-1.5 animate-pulse">
                                        <Loader2 size={11} className="animate-spin" /> Actualizando...
                                    </span>
                                )}
                            </div>

                            {isSearching && results.length === 0 ? (
                                <div className="p-8 text-center text-xs text-text-dim border border-border-thin rounded-xl bg-surface/50">
                                    <Loader2 size={18} className="animate-spin mx-auto mb-2 text-text-main" />
                                    <span>Cargando nómina institucional...</span>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="p-8 text-center text-xs text-text-dim border border-dashed border-border-thin rounded-xl bg-surface/50 space-y-1">
                                    <p className="font-bold uppercase tracking-wider text-text-main">Sin resultados</p>
                                    <p className="text-[11px]">
                                        {selectedType === 'DOCENTE'
                                            ? 'No se encontraron docentes con horas de investigación asignadas en el período activo.'
                                            : 'No se encontraron estudiantes con matrícula activa en el período actual.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto custom-scrollbar pr-1">
                                    {results.map((candidate: any) => {
                                        const cedula = (candidate.id_profesor || candidate.id_sigafi || '').trim();
                                        const isAlreadyMember = existingCedulas.includes(cedula) || (excludeCoordinatorCedula && excludeCoordinatorCedula.trim() === cedula);
                                        const isSelectedCoord = selectedCoordinatorCedula && selectedCoordinatorCedula.trim() === cedula;

                                        return (
                                            <div
                                                key={cedula}
                                                onClick={() => {
                                                    if (isAlreadyMember && !isSelectedCoord) return;
                                                    handleSelectCandidate(candidate);
                                                }}
                                                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 select-none ${
                                                    isAlreadyMember && !isSelectedCoord
                                                        ? 'opacity-40 bg-bg-deep/40 border-border-thin cursor-not-allowed'
                                                        : 'bg-surface border-border-thin hover:border-border-hover hover:bg-surface-hover cursor-pointer shadow-2xs'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-bg-deep border border-border-thin flex items-center justify-center text-xs font-bold text-text-main shrink-0">
                                                        {(candidate.nombre_completo || candidate.nombre || 'IN').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 truncate">
                                                        <p className="font-semibold text-text-main text-xs truncate">
                                                            {formatNombre(candidate.nombre_completo || candidate.nombre)}
                                                        </p>
                                                        <p className="text-text-dim font-mono text-[10px] truncate mt-0.5">
                                                            C.I. {cedula} &bull; {candidate.departamento || candidate.carrera || candidate.cargo_instituto || 'Personal Institucional'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-2">
                                                    {candidate.horas_investigacion !== undefined && candidate.horas_investigacion > 0 && (
                                                        <span className="badge-vercel badge-vercel-success text-[9px] px-2 py-0.5 font-mono">
                                                            {candidate.horas_investigacion}h Distributivo
                                                        </span>
                                                    )}
                                                    {candidate.type === 'ESTUDIANTE' && candidate.es_graduado === false && (
                                                        <span className="badge-vercel badge-vercel-info text-[9px] px-2 py-0.5">
                                                            Matriculado
                                                        </span>
                                                    )}
                                                    {isAlreadyMember && (
                                                        <span className="badge-vercel badge-vercel-neutral text-[9px]">
                                                            En el equipo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Menú de resultados flotante para modo card standalone */
                        showDropdown && searchQuery.trim().length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-xl p-1.5 shadow-2xl max-h-[220px] overflow-y-auto z-40 custom-scrollbar">
                                {isSearching ? (
                                    <div className="p-4 text-center text-xs text-text-dim font-mono animate-pulse">
                                        Buscando en {selectedType.toLowerCase()}s...
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-text-dim font-mono">
                                        No se encontraron {selectedType.toLowerCase()}s que coincidan con la búsqueda.
                                    </div>
                                ) : (
                                    results.map((candidate: any) => {
                                        const cedula = (candidate.id_profesor || candidate.id_sigafi || '').trim();
                                        const isAlreadyMember = existingCedulas.includes(cedula) || (excludeCoordinatorCedula && excludeCoordinatorCedula.trim() === cedula);
                                        const isSelectedCoord = selectedCoordinatorCedula && selectedCoordinatorCedula.trim() === cedula;

                                        return (
                                            <button
                                                key={cedula}
                                                type="button"
                                                onClick={() => handleSelectCandidate(candidate)}
                                                disabled={isAlreadyMember && !isSelectedCoord}
                                                className={`w-full text-left p-2.5 rounded-lg transition-colors flex justify-between items-center gap-2 cursor-pointer ${
                                                    isAlreadyMember && !isSelectedCoord
                                                        ? 'opacity-40 bg-bg-deep/20 cursor-not-allowed'
                                                        : isSelectedCoord
                                                        ? 'bg-brand/10 border border-brand/30'
                                                        : 'hover:bg-bg-deep/60'
                                                }`}
                                            >
                                                <div className="space-y-0.5 min-w-0">
                                                    <p className="font-semibold text-text-main text-xs flex items-center gap-2 truncate">
                                                        <span>{formatNombre(candidate.nombre_completo || candidate.nombre)}</span>
                                                        {candidate.horas_investigacion !== undefined && candidate.horas_investigacion > 0 && (
                                                            <span className="badge-vercel badge-vercel-success text-[9px] px-1.5 py-0.5">
                                                                {candidate.horas_investigacion}h SIGAFI
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-text-dim font-mono text-[10px] truncate">
                                                        C.I. {cedula} &bull; {candidate.departamento || candidate.carrera || candidate.cargo_instituto || 'Personal Institucional'}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-1">
                                                    {candidate.type === 'DOCENTE' && (
                                                        <span className="badge-vercel badge-vercel-violet text-[9px] uppercase">
                                                            Docente
                                                        </span>
                                                    )}
                                                    {candidate.type === 'ADMINISTRATIVO' && (
                                                        <span className="badge-vercel badge-vercel-neutral text-[9px] uppercase">
                                                            Admin
                                                        </span>
                                                    )}
                                                    {candidate.type === 'ESTUDIANTE' && (
                                                        <span className="badge-vercel badge-vercel-info text-[9px] uppercase">
                                                            Alumno
                                                        </span>
                                                    )}
                                                    {candidate.type === 'EXTERNO' && (
                                                        <span className="badge-vercel badge-vercel-warning text-[9px] uppercase">
                                                            Externo
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        )
                    )}
                </div>
            ) : (
                /* Ficha del candidato seleccionado para configurar rol y teléfono */
                <div className="p-3.5 bg-bg-deep/40 rounded-xl border border-border-thin space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface border border-border-thin flex items-center justify-center text-text-dim">
                                {selectedCandidate.type === 'DOCENTE' ? <GraduationCap size={16} /> :
                                 selectedCandidate.type === 'ADMINISTRATIVO' ? <Briefcase size={16} /> :
                                 selectedCandidate.type === 'EXTERNO' ? <Globe size={16} /> : <GraduationCap size={16} />}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-main">
                                    {formatNombre(selectedCandidate.nombre_completo || selectedCandidate.nombre)}
                                </p>
                                <p className="text-[10px] text-text-dim font-mono">
                                    C.I. {selectedCandidate.id_profesor || selectedCandidate.id_sigafi} &bull; {selectedCandidate.carrera || selectedCandidate.departamento || 'Personal Institucional'}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelectedCandidate(null)}
                            className="btn-vercel-secondary !p-1 text-text-dim hover:text-text-main cursor-pointer"
                            title="Cambiar persona"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-thin/40">
                        <div>
                            <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block mb-1">
                                Rol Funcional en el Grupo
                            </label>
                            <select
                                value={memberRole}
                                onChange={(e) => setMemberRole(e.target.value)}
                                className="input-vercel !py-1.5 !px-2.5 !text-xs w-full font-medium"
                            >
                                {getSuggestedRoles(selectedCandidate.type || selectedType).map((rol) => (
                                    <option key={rol} value={rol}>
                                        {rol}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block mb-1">
                                Teléfono / WhatsApp (Opcional)
                            </label>
                            <input
                                type="tel"
                                value={memberPhone}
                                onChange={(e) => setMemberPhone(e.target.value)}
                                placeholder="Ej: 0991234567"
                                className="input-vercel !py-1.5 !px-2.5 !text-xs w-full font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCandidate(null)}
                            className="btn-vercel-secondary !py-1.5 !px-3 !text-xs cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmAdd}
                            className="btn-brand !py-1.5 !px-4 !text-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <Check size={13} /> Confirmar Integrante
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
