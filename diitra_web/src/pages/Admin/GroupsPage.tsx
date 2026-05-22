import React, { useState, useEffect } from 'react';
import { 
    Users, Plus, Search, Edit2, 
    Trash2, CheckCircle, XCircle,
    BookOpen, Shield, Award, Calendar, FileText, Eye,
    UserPlus, UserMinus, GraduationCap, User
} from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';

interface GroupMember {
    id_grupo_miembro: number;
    id_usuario: number;
    nombre_completo: string;
    cedula?: string;
    rol: string;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
}

interface Group {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    id_coordinador: number | null;
    id_profesor_coordinador: string | null;
    nombre_coordinador: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    tipo_grupo: string;
    id_dominio: number | null;
    activo: boolean;
    estado?: string; // "Pendiente", "Aprobado", "Rechazado"
    lineas_ids: number[];
    carreras_ids: number[];
    miembros?: GroupMember[];
}

interface ResearchLine {
    id: number;
    nombre: string;
}



interface Domain {
    id_dominio: number;
    nombre: string;
}

interface Career {
    id_carrera: number;
    carrera1: string;
}

const GroupsPage = () => {
    const { user, isAdmin } = useAuth();
    
    const [groups, setGroups] = useState<Group[]>([]);
    const [lines, setLines] = useState<ResearchLine[]>([]);
    const [dominios, setDominios] = useState<Domain[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // Review states (Admin)
    const [reviewingGroup, setReviewingGroup] = useState<Group | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewResolution, setReviewResolution] = useState('');

    // Member states
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

    // Member Autocomplete States & Search
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
    const [isMemberSearching, setIsMemberSearching] = useState(false);
    const [showMemberResults, setShowMemberResults] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [memberRol, setMemberRol] = useState('Co-Investigador');

    // Form states
    const [formData, setFormData] = useState({
        nombre: '',
        siglas: '',
        tipo_grupo: 'Investigación',
        id_dominio: '',
        id_profesor_coordinador: '',
        objetivo_general: '',
        mision: '',
        vision: '',
        resolucion_aprobacion: '',
        fecha_creacion: '',
        lineas_ids: [] as number[],
        carreras_ids: [] as number[]
    });

    // --- Coordinator Autocomplete States & Search ---
    const [coordSearchQuery, setCoordSearchQuery] = useState('');
    const [coordSearchResults, setCoordSearchResults] = useState<any[]>([]);
    const [isCoordSearching, setIsCoordSearching] = useState(false);
    const [showCoordResults, setShowCoordResults] = useState(false);

    useEffect(() => {
        if (!coordSearchQuery.trim() || coordSearchQuery === (editingGroup?.nombre_coordinador || '')) {
            setCoordSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsCoordSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(coordSearchQuery)}`);
                // Filtrar solo docentes (tipo === 'profesor')
                const teachersOnly = (res.data || []).filter((u: any) => u.tipo === 'profesor');
                setCoordSearchResults(teachersOnly);
                setShowCoordResults(true);
            } catch (err) {
                console.error("Error al buscar docentes coordinadores:", err);
            } finally {
                setIsCoordSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [coordSearchQuery, editingGroup]);

    const handleSelectCoordinator = (teacher: any) => {
        setFormData(prev => ({
            ...prev,
            id_profesor_coordinador: teacher.cedula
        }));
        setCoordSearchQuery(teacher.nombre);
        setShowCoordResults(false);
    };

    useEffect(() => {
        if (!memberSearchQuery.trim()) {
            setMemberSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsMemberSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(memberSearchQuery)}`);
                setMemberSearchResults(res.data || []);
                setShowMemberResults(true);
            } catch (err) {
                console.error("Error al buscar integrantes:", err);
            } finally {
                setIsMemberSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [memberSearchQuery]);

    const handleSelectMember = (member: any) => {
        setSelectedMember(member);
        setMemberSearchQuery(member.nombre);
        setShowMemberResults(false);
        
        if (member.tipo === 'alumno') {
            setMemberRol('Semillerista');
        } else {
            setMemberRol('Co-Investigador');
        }
    };

    const handleAddMember = async () => {
        if (!editingGroup || !selectedMember) return;
        
        try {
            const memberDto = {
                id_usuario: 0,
                cedula: selectedMember.cedula,
                nombre_completo: selectedMember.nombre,
                rol: memberRol,
                activo: true
            };
            
            await api.post(`/Groups/${editingGroup.uuid}/members`, memberDto);
            
            const res = await api.get(`/Groups/${editingGroup.uuid}`);
            const fullGroup = res.data;
            if (fullGroup && fullGroup.miembros) {
                const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                setGroupMembers(activeMembers);
            }
            
            setSelectedMember(null);
            setMemberSearchQuery('');
            setMemberRol('Co-Investigador');
        } catch (error: any) {
            console.error("Error al agregar integrante:", error);
            alert("No se pudo agregar al integrante: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRemoveMember = async (idGrupoMiembro: number) => {
        if (!editingGroup) return;
        if (!window.confirm("¿Está seguro de retirar a este integrante del grupo?")) return;
        
        try {
            await api.delete(`/Groups/members/${idGrupoMiembro}`);
            
            const res = await api.get(`/Groups/${editingGroup.uuid}`);
            const fullGroup = res.data;
            if (fullGroup && fullGroup.miembros) {
                const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                setGroupMembers(activeMembers);
            }
        } catch (error: any) {
            console.error("Error al retirar integrante:", error);
            alert("No se pudo retirar al integrante: " + (error.response?.data?.message || error.message));
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const promises: Promise<any>[] = [
                api.get(`/Groups?search=${search}`),
                api.get('/Convocatorias/catalogos/lineas'),
                api.get('/catalogs/dominios'),
                api.get('/catalogs/carreras')
            ];
            
            const [groupsRes, linesRes, dominiosRes, carrerasRes] = await Promise.all(promises);
            setGroups(groupsRes.data);
            setLines(linesRes.data);
            
            setDominios(dominiosRes.data);
            setCarreras(carrerasRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search, user, isAdmin]);

    const handleOpenModal = async (group: Group | null = null, readOnly = false) => {
        setIsReadOnly(readOnly);
        setCoordSearchResults([]);
        setShowCoordResults(false);
        setGroupMembers([]);
        setSelectedMember(null);
        setMemberSearchQuery('');

        if (group) {
            setEditingGroup(group);
            setFormData({
                nombre: group.nombre,
                siglas: group.siglas || '',
                tipo_grupo: group.tipo_grupo || 'Investigación',
                id_dominio: group.id_dominio?.toString() || '',
                id_profesor_coordinador: group.id_profesor_coordinador || '',
                objetivo_general: group.objetivo_general || '',
                mision: group.mision || '',
                vision: group.vision || '',
                resolucion_aprobacion: group.resolucion_aprobacion || '',
                fecha_creacion: group.fecha_creacion ? group.fecha_creacion.split('T')[0] : '',
                lineas_ids: group.lineas_ids || [],
                carreras_ids: group.carreras_ids || []
            });
            setCoordSearchQuery(group.nombre_coordinador || '');

            try {
                const res = await api.get(`/Groups/${group.uuid}`);
                const fullGroup = res.data;
                if (fullGroup) {
                    setFormData({
                        nombre: fullGroup.nombre,
                        siglas: fullGroup.siglas || '',
                        tipo_grupo: fullGroup.tipo_grupo || 'Investigación',
                        id_dominio: fullGroup.id_dominio?.toString() || '',
                        id_profesor_coordinador: fullGroup.id_profesor_coordinador || '',
                        objetivo_general: fullGroup.objetivo_general || '',
                        mision: fullGroup.mision || '',
                        vision: fullGroup.vision || '',
                        resolucion_aprobacion: fullGroup.resolucion_aprobacion || '',
                        fecha_creacion: fullGroup.fecha_creacion ? fullGroup.fecha_creacion.split('T')[0] : '',
                        lineas_ids: fullGroup.lineas_ids || [],
                        carreras_ids: fullGroup.carreras_ids || []
                    });
                    setCoordSearchQuery(fullGroup.nombre_coordinador || '');
                    
                    if (fullGroup.miembros) {
                        const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                        setGroupMembers(activeMembers);
                    }
                }
            } catch (err) {
                console.error("Error al cargar detalles del grupo:", err);
            }
        } else {
            setEditingGroup(null);
            setFormData({
                nombre: '',
                siglas: '',
                tipo_grupo: 'Investigación',
                id_dominio: '',
                id_profesor_coordinador: '',
                objetivo_general: '',
                mision: '',
                vision: '',
                resolucion_aprobacion: '',
                fecha_creacion: new Date().toISOString().split('T')[0],
                lineas_ids: [],
                carreras_ids: []
            });
            setCoordSearchQuery('');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) {
            setIsModalOpen(false);
            return;
        }
        try {
            const payload = {
                ...formData,
                id_profesor_coordinador: formData.id_profesor_coordinador || null,
                id_dominio: formData.id_dominio ? parseInt(formData.id_dominio) : null
            };

            if (editingGroup) {
                await api.put(`/Groups/${editingGroup.uuid}`, payload);
            } else {
                await api.post('/Groups', payload);
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            console.error('Error saving group:', error);
            const detail = error.response?.data?.detail || error.response?.data?.message || '';
            alert(`Error al guardar el grupo: ${error.message}${detail ? `\n\nDetalle: ${detail}` : ''}`);
        }
    };

    const toggleLine = (id: number) => {
        setFormData(prev => ({
            ...prev,
            lineas_ids: prev.lineas_ids.includes(id) 
                ? prev.lineas_ids.filter(lineId => lineId !== id)
                : [...prev.lineas_ids, id]
        }));
    };

    const toggleCarrera = (id: number) => {
        setFormData(prev => ({
            ...prev,
            carreras_ids: prev.carreras_ids.includes(id) 
                ? prev.carreras_ids.filter(cId => cId !== id)
                : [...prev.carreras_ids, id]
        }));
    };

    const handleDelete = async (uuid: string, name: string) => {
        const confirmMsg = isAdmin 
            ? `¿Está seguro de desactivar el grupo "${name}"?` 
            : `¿Está seguro de eliminar su propuesta de grupo "${name}"?`;
            
        if (!window.confirm(confirmMsg)) return;
        
        try {
            await api.delete(`/Groups/${uuid}`);
            fetchData();
        } catch (error: any) {
            console.error('Error deactivating/deleting group:', error);
            alert('No se pudo procesar la acción: ' + error.message);
        }
    };

    // Review Handlers (Admin)
    const handleOpenReview = (group: Group) => {
        setReviewingGroup(group);
        setReviewResolution('');
        setIsReviewModalOpen(true);
    };

    const handleApprove = async () => {
        if (!reviewingGroup) return;
        if (!reviewResolution.trim()) {
            alert('Por favor ingrese la resolución institucional de aprobación.');
            return;
        }
        try {
            await api.patch(`/Groups/${reviewingGroup.uuid}/review`, {
                aprobado: true,
                resolucion: reviewResolution.trim()
            });
            setIsReviewModalOpen(false);
            setReviewingGroup(null);
            fetchData();
        } catch (error: any) {
            console.error('Error approving group:', error);
            alert('Error al aprobar el grupo: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleReject = async (group: Group) => {
        if (!window.confirm(`¿Está seguro de rechazar la propuesta del grupo "${group.nombre}"?`)) return;
        try {
            await api.patch(`/Groups/${group.uuid}/review`, {
                aprobado: false
            });
            fetchData();
        } catch (error: any) {
            console.error('Error rejecting group:', error);
            alert('Error al rechazar el grupo: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 lg:mb-16 px-2 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-main uppercase tracking-[0.3em]">
                        <Shield size={10} className="text-text-main" />
                        <span>{isAdmin ? 'Administración Institucional' : 'Investigación Académica'}</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">
                        {isAdmin ? 'Grupos de Investigación' : 'Propuestas de Grupos'}
                    </h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        {isAdmin 
                            ? 'Configure las unidades organizativas de I+D+i y sus líneas de acción, y gestione las propuestas de los docentes.'
                            : 'Proponga nuevos grupos de investigación académica o semilleros para la validación y registro institucional.'}
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar grupo o siglas..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-bg-deep border border-border-thin rounded-md pl-10 pr-4 py-2.5 text-xs text-text-main focus:outline-none focus:border-text-main transition-all uppercase tracking-wider font-mono"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenModal()}
                        className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 md:py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-text-main/10"
                    >
                        <Plus size={14} strokeWidth={3} />
                        {isAdmin ? 'Crear Grupo' : 'Proponer Grupo'}
                    </button>
                </div>
            </header>

            <div className="bento-card static overflow-hidden animate-fade-up [animation-delay:200ms]">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                <th className="p-4 font-bold tracking-widest">Grupo / Identidad</th>
                                <th className="p-4 font-bold tracking-widest">Coordinador</th>
                                <th className="p-4 font-bold tracking-widest">Estado / Aprobación</th>
                                <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {groups.map((g) => (
                                <tr key={g.uuid} className="hover:bg-surface/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-text-main/10 border border-text-main/20 flex items-center justify-center text-text-main group-hover:scale-105 transition-transform shrink-0">
                                                <Award size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-text-main tracking-tight uppercase">{g.nombre}</p>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${
                                                        g.tipo_grupo === 'Semillero' 
                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' 
                                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                    }`}>
                                                        {g.tipo_grupo?.toUpperCase() || 'INVESTIGACIÓN'}
                                                    </span>
                                                </div>
                                                <div className="flex gap-2 items-center mt-1">
                                                    <span className="text-[10px] text-text-dim font-mono bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">{g.siglas || 'SIN_SIGLAS'}</span>
                                                    {g.resolucion_aprobacion && (
                                                        <span className="text-[9px] text-text-dim/80 font-bold uppercase tracking-tighter flex items-center gap-1">
                                                            <FileText size={8} /> {g.resolucion_aprobacion}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-surface border border-border-thin flex items-center justify-center text-text-dim shrink-0">
                                                <Users size={12} />
                                            </div>
                                            <span className="text-xs text-text-main font-medium uppercase truncate max-w-[160px]">{g.nombre_coordinador || 'No asignado'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {(!g.estado || g.estado === 'Aprobado') && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-tighter border border-emerald-500/20 w-fit">
                                                    <CheckCircle size={10} strokeWidth={3} /> Aprobado
                                                </span>
                                            )}
                                            {g.estado === 'Pendiente' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-tighter border border-amber-500/20 w-fit animate-pulse">
                                                    <Calendar size={10} strokeWidth={3} /> Pendiente
                                                </span>
                                            )}
                                            {g.estado === 'Rechazado' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-tighter border border-red-500/20 w-fit">
                                                    <XCircle size={10} strokeWidth={3} /> Rechazado
                                                </span>
                                            )}
                                            <span className={`text-[8px] font-mono tracking-wider uppercase ${g.activo ? 'text-green-500/80' : 'text-text-dim/60'}`}>
                                                ● {g.activo ? 'Vigente' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end items-center gap-2 flex-wrap">
                                            {/* Admin Quick Review Actions for Pending proposals */}
                                            {isAdmin && g.estado === 'Pendiente' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleOpenReview(g)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-md text-[9px] font-bold uppercase tracking-wider text-emerald-400 transition-all"
                                                        title="Aprobar Propuesta"
                                                    >
                                                        <CheckCircle size={11} strokeWidth={3} /> Aprobar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleReject(g)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-md text-[9px] font-bold uppercase tracking-wider text-red-400 transition-all"
                                                        title="Rechazar Propuesta"
                                                    >
                                                        <XCircle size={11} strokeWidth={3} /> Rechazar
                                                    </button>
                                                </>
                                            )}

                                            {/* General Actions Logic */}
                                            {isAdmin ? (
                                                <>
                                                    <button 
                                                        onClick={() => handleOpenModal(g, false)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Grupo"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(g.uuid, g.nombre)}
                                                        className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-red-500 transition-all"
                                                        title="Desactivar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                // Teacher Flow
                                                (() => {
                                                    const esCoordinador = g.id_profesor_coordinador === user?.id_referencia;
                                                    const esEditable = esCoordinador;

                                                    if (esEditable) {
                                                        return (
                                                            <>
                                                                <button 
                                                                    onClick={() => handleOpenModal(g, false)}
                                                                    className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-text-main transition-all"
                                                                    title="Editar Propuesta"
                                                                >
                                                                    <Edit2 size={14} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(g.uuid, g.nombre)}
                                                                    className="p-2 hover:bg-surface border border-transparent hover:border-border-thin rounded-md text-text-dim hover:text-red-500 transition-all"
                                                                    title="Eliminar Propuesta"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <button 
                                                                onClick={() => handleOpenModal(g, true)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-surface border border-border-thin rounded-md text-[10px] font-bold uppercase tracking-wider text-text-dim hover:text-text-main transition-all"
                                                                title="Ver Detalles (Solo Lectura)"
                                                            >
                                                                <Eye size={12} /> Ver
                                                            </button>
                                                        );
                                                    }
                                                })()
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {groups.length === 0 && !loading && (
                        <div className="py-20 text-center space-y-4">
                            <Users size={32} className="mx-auto text-text-dim/30" />
                            <p className="text-sm text-text-dim font-medium uppercase tracking-widest">No se encontraron grupos registrados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Creation / Edition / View Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-up">
                        <div className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-text-main/10 rounded-lg text-text-main">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {isReadOnly ? 'Ver Grupo de Investigación' : (editingGroup ? 'Editar Grupo de Investigación' : 'Nuevo Grupo de Investigación')}
                                    </h3>
                                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Configuración administrativa y normativa</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-dim hover:text-text-main p-2">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
                            {!isAdmin && !isReadOnly && (
                                <div className="space-y-3 animate-fade-up">
                                    <div className="bg-text-main/5 border border-text-main/15 rounded-xl p-4 flex items-center gap-3">
                                        <Shield size={16} className="text-text-main shrink-0" />
                                        <p className="text-[11px] text-text-dim uppercase tracking-wider font-bold">
                                            Las propuestas se envían en estado <span className="text-text-main">PENDIENTE</span> para su revisión y requieren aprobación formal del administrador antes de su activación.
                                        </p>
                                    </div>
                                    {editingGroup && editingGroup.estado === 'Aprobado' && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
                                            <Calendar size={16} className="text-amber-400 shrink-0" />
                                            <p className="text-[11px] text-text-dim uppercase tracking-wider font-bold">
                                                <span className="text-amber-400 font-extrabold">¡Atención!</span> Este grupo de investigación ya se encuentra <span className="text-emerald-400 font-extrabold">APROBADO</span>. Si guarda los cambios, su estado volverá a <span className="text-amber-400 font-extrabold">PENDIENTE</span> y requerirá una nueva aprobación del administrador para ser reactivado.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Basic Data */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nombre del Grupo</label>
                                    <input 
                                        required
                                        disabled={isReadOnly}
                                        type="text" 
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="Ej: GRUPO DE INVESTIGACIÓN EN SISTEMAS INTELIGENTES"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Siglas / Acrónimo</label>
                                    <input 
                                        type="text" 
                                        disabled={isReadOnly}
                                        value={formData.siglas}
                                        onChange={(e) => setFormData({...formData, siglas: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-mono disabled:opacity-60 disabled:cursor-not-allowed"
                                        placeholder="GISI"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Tipo de Grupo</label>
                                    <select 
                                        required
                                        disabled={isReadOnly}
                                        value={formData.tipo_grupo}
                                        onChange={(e) => setFormData({...formData, tipo_grupo: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="Investigación">Grupo de Investigación</option>
                                        <option value="Semillero">Semillero de Investigación</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Dominio Académico</label>
                                    <select 
                                        required
                                        disabled={isReadOnly}
                                        value={formData.id_dominio}
                                        onChange={(e) => setFormData({...formData, id_dominio: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Seleccione Dominio...</option>
                                        {dominios.map(d => (
                                            <option key={d.id_dominio} value={d.id_dominio}>{d.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Coordinador Responsable</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                        <input 
                                            required
                                            type="text"
                                            disabled={isReadOnly}
                                            value={coordSearchQuery}
                                            onChange={(e) => {
                                                setCoordSearchQuery(e.target.value);
                                                if (formData.id_profesor_coordinador) {
                                                    setFormData(prev => ({ ...prev, id_profesor_coordinador: '' }));
                                                }
                                            }}
                                            onFocus={() => !isReadOnly && setShowCoordResults(true)}
                                            placeholder="Buscar docente por nombre o cédula..."
                                            className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 pl-10 text-sm text-text-main focus:outline-none transition-all placeholder:text-text-dim/60 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
                                        />
                                        {isCoordSearching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin h-4 w-4 border-2 border-t-transparent border-text-main rounded-full"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Badge */}
                                    {formData.id_profesor_coordinador && (
                                        <div className="mt-1 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[10px] flex justify-between items-center animate-fade-in font-mono text-emerald-400">
                                            <span>Docente Vinculado: C.I. {formData.id_profesor_coordinador}</span>
                                            <span className="text-[8px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase font-bold">Verificado</span>
                                        </div>
                                    )}

                                    {/* Autocomplete Suggestions */}
                                    {!isReadOnly && showCoordResults && coordSearchQuery.trim() && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-48 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                {coordSearchResults.length === 0 ? (
                                                    <div className="p-4 text-center text-xs text-text-dim font-mono">
                                                        No se encontraron docentes con ese nombre/cédula.
                                                    </div>
                                                ) : (
                                                    coordSearchResults.map((selectedUser: any) => (
                                                        <button 
                                                            key={selectedUser.cedula}
                                                            type="button"
                                                            onClick={() => handleSelectCoordinator(selectedUser)}
                                                            className="w-full p-3 flex items-center justify-between hover:bg-surface-hover text-left text-xs transition-colors"
                                                        >
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-text-main text-sm">{selectedUser.nombre}</p>
                                                                <p className="text-text-dim font-mono text-[10px]">C.I. {selectedUser.cedula} | {selectedUser.email}</p>
                                                            </div>
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border bg-text-main/10 border-text-main/20 text-text-main">
                                                                Docente
                                                            </span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* Regulations / Normative */}
                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-bg-deep/30 rounded-2xl border border-border-thin">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={12} /> Resolución de Aprobación
                                    </label>
                                    <input 
                                        type="text" 
                                        disabled={isReadOnly || !isAdmin}
                                        value={formData.resolucion_aprobacion}
                                        onChange={(e) => setFormData({...formData, resolucion_aprobacion: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                                        placeholder={!isAdmin ? "ASIGNADO TRAS APROBACIÓN" : "ACTA-DI-2026-001"}
                                    />
                                    {!isAdmin && (
                                        <p className="text-[8px] text-text-dim/60 uppercase font-bold tracking-wider">
                                            Solo el administrador puede definir este valor tras la aprobación de la propuesta.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Calendar size={12} /> Fecha de Creación / Propuesta
                                    </label>
                                    <input 
                                        type="date" 
                                        disabled={isReadOnly}
                                        value={formData.fecha_creacion}
                                        onChange={(e) => setFormData({...formData, fecha_creacion: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </section>

                            {/* Identity Statements */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Objetivo General</label>
                                    <textarea 
                                        rows={3}
                                        disabled={isReadOnly}
                                        value={formData.objetivo_general}
                                        onChange={(e) => setFormData({...formData, objetivo_general: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Misión</label>
                                        <textarea 
                                            rows={3}
                                            disabled={isReadOnly}
                                            value={formData.mision}
                                            onChange={(e) => setFormData({...formData, mision: e.target.value})}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Visión</label>
                                        <textarea 
                                            rows={3}
                                            disabled={isReadOnly}
                                            value={formData.vision}
                                            onChange={(e) => setFormData({...formData, vision: e.target.value})}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Careers */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Users size={12} /> Carreras / Programas Académicos
                                    </label>
                                    <span className="text-[9px] font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {formData.carreras_ids.length} seleccionadas
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {carreras.map(career => (
                                        <div 
                                            key={career.id_carrera}
                                            onClick={() => !isReadOnly && toggleCarrera(career.id_carrera)}
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                                                isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                            } ${
                                                formData.carreras_ids.includes(career.id_carrera)
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                            }`}
                                        >
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${
                                                formData.carreras_ids.includes(career.id_carrera) ? 'border-blue-500 bg-blue-500' : 'border-border-thin'
                                            }`}>
                                                {formData.carreras_ids.includes(career.id_carrera) && <CheckCircle size={8} className="text-bg-deep" />}
                                            </div>
                                            <span className="text-[9px] font-bold uppercase truncate">{career.carrera1}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Research Lines */}
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={12} /> Líneas de Investigación Institucionales
                                    </label>
                                    <span className="text-[9px] font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                        {formData.lineas_ids.length} seleccionadas
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {lines.map(line => (
                                        <div 
                                            key={line.id}
                                            onClick={() => !isReadOnly && toggleLine(line.id)}
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                                                isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                            } ${
                                                formData.lineas_ids.includes(line.id)
                                                    ? 'bg-text-main/10 border-text-main text-text-main'
                                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                formData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                                            }`}>
                                                {formData.lineas_ids.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Bento Section: Group Members */}
                            {editingGroup ? (
                                <section className="p-6 bg-surface rounded-2xl border border-border-thin space-y-6 animate-fade-up">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-thin">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-text-main uppercase tracking-widest">
                                                <Users size={12} />
                                                <span>Integrantes del Grupo de Investigación</span>
                                            </div>
                                            <p className="text-[10px] text-text-dim uppercase font-bold">Docentes con horas vigentes y Estudiantes matriculados</p>
                                        </div>
                                        <span className="text-[9px] font-bold text-text-main bg-text-main/10 border border-text-main/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                            {groupMembers.length} Miembros Activos
                                        </span>
                                    </div>

                                    {/* Members Grid (Bento Style) */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {groupMembers.map((member) => {
                                            const isStudent = member.rol?.toLowerCase().includes("semillerista") || member.rol?.toLowerCase().includes("estudiante");
                                            return (
                                                <div 
                                                    key={member.id_grupo_miembro} 
                                                    className="p-4 bg-bg-deep/40 rounded-xl border border-border-thin hover:border-border-thin/80 hover:bg-bg-deep/60 transition-all flex justify-between items-center group/member"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                            isStudent 
                                                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                        }`}>
                                                            {isStudent ? <GraduationCap size={16} /> : <User size={16} />}
                                                        </div>
                                                        <div className="min-w-0 space-y-0.5">
                                                            <p className="text-xs font-extrabold text-text-main uppercase truncate max-w-[200px]" title={member.nombre_completo}>
                                                                {member.nombre_completo}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[8px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                                    C.I. {member.cedula || 'S/D'}
                                                                </span>
                                                                <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full ${
                                                                    isStudent
                                                                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                                                }`}>
                                                                    {member.rol}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Delete action button */}
                                                    {!isReadOnly && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                            className="p-1.5 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-text-dim hover:text-red-500 opacity-0 group-hover/member:opacity-100 focus:opacity-100 transition-all shrink-0"
                                                            title="Dar de baja miembro"
                                                        >
                                                            <UserMinus size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {groupMembers.length === 0 && (
                                            <div className="col-span-2 py-8 text-center bg-bg-deep/20 rounded-xl border border-dashed border-border-thin space-y-2">
                                                <Users size={20} className="mx-auto text-text-dim/40" />
                                                <p className="text-[10px] text-text-dim font-black uppercase tracking-widest">No hay integrantes registrados en este grupo</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Member form (Bento Card within) */}
                                    {!isReadOnly && (
                                        <div className="p-4 bg-bg-deep/30 rounded-xl border border-border-thin space-y-4">
                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-text-main uppercase tracking-wider">
                                                <UserPlus size={12} className="text-text-main" />
                                                <span>Vincular Nuevo Integrante (Docente o Estudiante)</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                                {/* Autocomplete Input */}
                                                <div className="md:col-span-6 space-y-1.5 relative">
                                                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscador Académico</label>
                                                    <div className="relative">
                                                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                                        <input 
                                                            type="text"
                                                            value={memberSearchQuery}
                                                            onChange={(e) => {
                                                                setMemberSearchQuery(e.target.value);
                                                                if (selectedMember) {
                                                                    setSelectedMember(null);
                                                                }
                                                            }}
                                                            onFocus={() => setShowMemberResults(true)}
                                                            placeholder="Ingrese nombre o cédula..."
                                                            className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-2.5 pl-9 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/60 font-medium"
                                                        />
                                                        {isMemberSearching && (
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-text-main rounded-full"></div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Selected Member Verification Badge */}
                                                    {selectedMember && (
                                                        <div className="mt-1 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[9px] flex justify-between items-center font-mono text-emerald-400">
                                                            <span>Persona: {selectedMember.nombre}</span>
                                                            <span className="text-[7px] bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 uppercase font-bold tracking-widest">{selectedMember.tipo === 'alumno' ? 'Estudiante' : 'Docente'}</span>
                                                        </div>
                                                    )}

                                                    {/* Autocomplete Suggestions Panel */}
                                                    {showMemberResults && memberSearchQuery.trim() && (
                                                        <>
                                                            <div className="fixed inset-0 z-20" onClick={() => setShowMemberResults(false)}></div>
                                                            <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-40 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                                {memberSearchResults.length === 0 ? (
                                                                    <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                        Sin coincidencias en el periodo activo.
                                                                    </div>
                                                                ) : (
                                                                    memberSearchResults.map((userResult: any) => (
                                                                        <button 
                                                                            key={userResult.cedula}
                                                                            type="button"
                                                                            onClick={() => handleSelectMember(userResult)}
                                                                            className="w-full p-2.5 flex items-center justify-between hover:bg-surface-hover text-left text-xs transition-colors"
                                                                        >
                                                                            <div className="space-y-0.5">
                                                                                <p className="font-bold text-text-main text-xs uppercase">{userResult.nombre}</p>
                                                                                <p className="text-text-dim font-mono text-[9px]">C.I. {userResult.cedula} | {userResult.email}</p>
                                                                            </div>
                                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border ${
                                                                                userResult.tipo === 'alumno' 
                                                                                    ? 'bg-blue-500/15 border-blue-500/25 text-blue-400' 
                                                                                    : 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                                                                            }`}>
                                                                                {userResult.tipo === 'alumno' ? 'Estudiante' : 'Docente'}
                                                                            </span>
                                                                        </button>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Role Selector dropdown */}
                                                <div className="md:col-span-4 space-y-1.5">
                                                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                                    <select
                                                        value={memberRol}
                                                        onChange={(e) => setMemberRol(e.target.value)}
                                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none focus:border-text-main transition-all appearance-none font-medium"
                                                    >
                                                        {selectedMember?.tipo === 'alumno' ? (
                                                            <>
                                                                <option value="Semillerista">Semillerista de Apoyo</option>
                                                                <option value="Co-Investigador (Estudiante)">Co-Investigador Estudiantil</option>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <option value="Co-Investigador">Co-Investigador</option>
                                                                <option value="Investigador Principal">Investigador Principal</option>
                                                                <option value="Asesor Externo">Asesor Científico Externo</option>
                                                            </>
                                                        )}
                                                    </select>
                                                </div>

                                                {/* Action Button */}
                                                <div className="md:col-span-2">
                                                    <button
                                                        type="button"
                                                        onClick={handleAddMember}
                                                        disabled={!selectedMember}
                                                        className="w-full bg-text-main text-bg-deep disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 font-bold px-3 py-2.5 rounded-lg text-[9px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                                    >
                                                        <Plus size={12} strokeWidth={3} />
                                                        Agregar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </section>
                            ) : (
                                <section className="p-6 bg-surface rounded-2xl border border-dashed border-border-thin flex flex-col items-center justify-center text-center space-y-2 animate-fade-up">
                                    <Users size={24} className="text-text-dim/40" />
                                    <p className="text-[10px] text-text-dim font-black uppercase tracking-widest">Gestión de Miembros Integrantes</p>
                                    <p className="text-[9px] text-text-dim/80 max-w-sm uppercase font-bold tracking-wider leading-relaxed">
                                        Los integrantes (docentes investigadores y estudiantes semilleristas) podrán ser agregados y vinculados al grupo una vez guardada e instituida formalmente la propuesta.
                                    </p>
                                </section>
                            )}
                        </form>

                        <div className="p-6 border-t border-border-thin bg-bg-deep/50 flex justify-end gap-4">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-all"
                            >
                                {isReadOnly ? 'Cerrar' : 'Cancelar'}
                            </button>
                            {!isReadOnly && (
                                <button 
                                    onClick={handleSubmit}
                                    className="bg-text-main text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-text-main/10 animate-fade-in"
                                >
                                    {editingGroup ? 'Guardar Cambios' : 'Proponer Grupo'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Resolution & Review Dialog */}
            {isReviewModalOpen && reviewingGroup && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg-deep/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-scale-up">
                        <div className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <CheckCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        Aprobar Grupo de Investigación
                                    </h3>
                                    <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Oficialización de Propuesta Académica</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsReviewModalOpen(false); setReviewingGroup(null); }} className="text-text-dim hover:text-text-main p-2">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <p className="text-xs text-text-dim font-medium leading-relaxed">
                                    Está a punto de aprobar el grupo <span className="text-text-main font-bold uppercase">"{reviewingGroup.nombre}"</span> propuesto por el docente <span className="text-text-main font-bold uppercase">{reviewingGroup.nombre_coordinador}</span>.
                                </p>
                                <p className="text-xs text-text-dim font-medium leading-relaxed">
                                    Para registrar formalmente este grupo en el instituto, ingrese el identificador de la Resolución de Aprobación institucional:
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                    <FileText size={12} /> Resolución de Aprobación
                                </label>
                                <input 
                                    required
                                    type="text" 
                                    value={reviewResolution}
                                    onChange={(e) => setReviewResolution(e.target.value)}
                                    className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all uppercase font-mono tracking-wider"
                                    placeholder="Ej: ACTA-DI-2026-004"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-border-thin bg-bg-deep/50 flex justify-end gap-4">
                            <button 
                                onClick={() => { setIsReviewModalOpen(false); setReviewingGroup(null); }}
                                className="px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleApprove}
                                className="bg-emerald-500 text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-400 transition-all font-black"
                            >
                                Confirmar y Aprobar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
};

export default GroupsPage;
