import { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Search, Edit2,
    Trash2, CheckCircle, XCircle, AlertTriangle,
    Shield, Calendar, FileText,
    Mic, Loader2, Eye, ChevronRight
} from 'lucide-react';
import api from '../../api/axios_config';
import { useAuth } from '../../api/AuthContext';
import { AudioBubblePlayer } from './components/AudioBubblePlayer';
import { CareerLinkageModal } from './components/CareerLinkageModal';
import { GroupFormDrawer } from './components/GroupFormDrawer';
import { GroupDetailDrawer } from './components/GroupDetailDrawer';

export interface GroupMember {
    id_grupo_miembro: number;
    id_usuario: number;
    nombre_completo: string;
    cedula?: string;
    rol: string;
    activo: boolean;
    fecha_inicio?: string;
    fecha_fin?: string;
    carrera?: string;
}

export interface Group {
    id_grupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    id_coordinador: number | null;
    id_profesor_coordinador: string | null;
    nombre_coordinador: string;
    carrera_coordinador?: string;
    objetivo_general: string;
    mision: string;
    vision: string;
    resolucion_aprobacion: string;
    fecha_creacion: string;
    tipo_grupo: string;
    id_dominio: number | null;
    categoria_consolidacion?: string;
    activo: boolean;
    estado?: string; // "Pendiente", "Aprobado", "Rechazado"
    lineas_ids: number[];
    carreras_ids: number[];
    miembros?: GroupMember[];
}

export interface ResearchLine {
    id: number;
    nombre: string;
}

export interface Domain {
    id_dominio: number;
    nombre: string;
}

export interface Career {
    id_carrera: number;
    carrera1: string;
}

const formatUserDetails = (u: any) => {
    if (!u) return '';
    const parts = [`C.I. ${u.cedula || 'S/D'}`];
    if (u.email && u.email.trim() !== '' && u.email !== 'S/D') {
        parts.push(u.email);
    }
    if (u.carrera && u.carrera.trim() !== '' && u.carrera !== 'S/D') {
        const formattedCarrera = u.carrera
            .toLowerCase()
            .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())
            .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m: string) => m.toLowerCase());
        parts.push(formattedCarrera);
    }
    return parts.join(' | ');
};

const formatCareerName = (name: string) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase())
        .replace(/\b(De|En|Y|La|El|Los|Las|Con|Para)\b/g, (m: string) => m.toLowerCase());
};

const GroupsPage = () => {
    const { user, isAdmin } = useAuth();

    const [groups, setGroups] = useState<Group[]>([]);
    const [lines, setLines] = useState<ResearchLine[]>([]);
    const [dominios, setDominios] = useState<Domain[]>([]);
    const [carreras, setCarreras] = useState<Career[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [pendingDraft, setPendingDraft] = useState<{
        type: 'new' | 'edit';
        uuid?: string;
        groupName: string;
        timestamp: number;
    } | null>(null);

    // Detail drawer trigger
    const [detailGroup, setDetailGroup] = useState<Group | null>(null);

    // Review states (Admin)
    const [reviewingGroup, setReviewingGroup] = useState<Group | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewResolution, setReviewResolution] = useState('');
    const [rejectObservations, setRejectObservations] = useState('');
    const [isReviewRejecting, setIsReviewRejecting] = useState(false);
    const [sendingFeedback, setSendingFeedback] = useState(false);

    // Audio recording state & refs for Admin Rejection Review
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    // Custom Confirmation Dialog State
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void | Promise<void>;
        type: 'danger' | 'warning' | 'info' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        type: 'warning'
    });

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

            if (detailGroup) {
                const updated = groupsRes.data.find((g: Group) => g.uuid === detailGroup.uuid);
                if (updated) {
                    setDetailGroup(prev => prev ? { ...prev, ...updated } : updated);
                }
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [search]);

    useEffect(() => {
        const metaStr = localStorage.getItem('groups_draft_metadata');
        if (metaStr) {
            try {
                setPendingDraft(JSON.parse(metaStr));
            } catch (e) {
                console.error("Error reading draft metadata", e);
            }
        }
    }, []);

    const handleRestoreDraft = () => {
        if (!pendingDraft) return;

        if (pendingDraft.type === 'new') {
            setEditingGroup(null);
            setIsReadOnly(false);
            setIsModalOpen(true);
        } else if (pendingDraft.type === 'edit' && pendingDraft.uuid) {
            const group = groups.find(g => g.uuid === pendingDraft.uuid);
            if (group) {
                setEditingGroup(group);
                setIsReadOnly(false);
                setIsModalOpen(true);
            } else {
                alert("No se pudo encontrar el grupo original en la lista. Es posible que haya sido eliminado o no tenga permisos.");
            }
        }
    };

    const handleDiscardDraft = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Descartar Borrador',
            message: '¿Está seguro de descartar el borrador guardado? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => {
                localStorage.removeItem('groups_draft_metadata');
                localStorage.removeItem('new_group_form_draft');
                if (pendingDraft?.type === 'edit' && pendingDraft.uuid) {
                    localStorage.removeItem(`edit_group_form_draft_${pendingDraft.uuid}`);
                }
                setPendingDraft(null);
            }
        });
    };

    const handleOpenModal = (group?: Group, readOnly = false) => {
        setIsReadOnly(readOnly);
        setEditingGroup(group || null);
        setIsModalOpen(true);
    };

    const handleDelete = (uuid: string, name: string) => {
        const title = isAdmin ? 'Desactivar Grupo' : 'Eliminar Propuesta';
        const confirmMsg = isAdmin
            ? `¿Está seguro de desactivar el grupo "${name}"?`
            : `¿Está seguro de eliminar su propuesta de grupo "${name}"?`;

        setConfirmDialog({
            isOpen: true,
            title,
            message: confirmMsg,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/Groups/${uuid}`);
                    fetchData();
                } catch (error: any) {
                    console.error('Error deactivating/deleting group:', error);
                    alert('No se pudo procesar la acción: ' + error.message);
                }
            }
        });
    };

    // Voice recorder helpers for Admin Rejection Review
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Error starting voice recorder:", err);
            alert("No se pudo acceder al micrófono. Verifique los permisos.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const handleOpenReview = (group: Group) => {
        setReviewingGroup(group);
        setReviewResolution('');
        setRejectObservations('');
        setAudioBlob(null);
        setAudioUrl('');
        setIsReviewRejecting(false);
        setIsReviewModalOpen(true);
    };

    const handleApprove = async () => {
        if (!reviewResolution.trim()) {
            alert("Debe especificar el número de resolución de aprobación.");
            return;
        }
        if (!reviewingGroup) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirmar Aprobación',
            message: `¿Está seguro de aprobar formalmente el grupo "${reviewingGroup.nombre}" bajo la resolución ${reviewResolution}?`,
            type: 'success',
            onConfirm: async () => {
                try {
                    await api.post(`/Groups/${reviewingGroup.uuid}/review`, {
                        aprobado: true,
                        resolucionAprobacion: reviewResolution.trim(),
                        observaciones: `Aprobado bajo resolución oficial ${reviewResolution.trim()}`
                    });
                    setIsReviewModalOpen(false);
                    setReviewingGroup(null);
                    fetchData();
                } catch (err: any) {
                    console.error("Error al aprobar grupo:", err);
                    alert("Error: " + (err.response?.data?.message || err.message));
                }
            }
        });
    };

    const handleRejectReview = async () => {
        if (!rejectObservations.trim() && !audioBlob) {
            alert("Debe ingresar observaciones escritas o grabar retroalimentación de voz explicando los motivos del rechazo.");
            return;
        }
        if (!reviewingGroup) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Confirmar Rechazo',
            message: `¿Está seguro de rechazar la propuesta del grupo "${reviewingGroup.nombre}"? Se devolverá al docente para correcciones.`,
            type: 'danger',
            onConfirm: async () => {
                setSendingFeedback(true);
                try {
                    let contentStr = rejectObservations.trim();

                    if (audioBlob) {
                        const formDataObj = new FormData();
                        formDataObj.append('file', audioBlob, `audio_reject_${Date.now()}.webm`);
                        const uploadRes = await api.post('/collaboration/upload', formDataObj, {
                            headers: { 'Content-Type': 'multipart/form-data' }
                        });

                        const payload = {
                            type: 'audio',
                            audioUrl: uploadRes.data.url,
                            text: rejectObservations.trim() || 'Retroalimentación de voz del evaluador'
                        };
                        contentStr = JSON.stringify(payload);
                    }

                    await api.post(`/Groups/${reviewingGroup.uuid}/review`, {
                        aprobado: false,
                        resolucionAprobacion: '',
                        observaciones: contentStr
                    });

                    setIsReviewModalOpen(false);
                    setReviewingGroup(null);
                    fetchData();
                } catch (err: any) {
                    console.error("Error al rechazar grupo:", err);
                    alert("Error: " + (err.response?.data?.message || err.message));
                } finally {
                    setSendingFeedback(false);
                }
            }
        });
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto custom-scrollbar">
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 lg:mb-12 animate-fade-up gap-8 lg:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-text-main">
                        <Users size={10} strokeWidth={2} />
                        <span>Investigación y Desarrollo</span>
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Grupos de Investigación</h2>
                    <p className="text-xs lg:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Administración centralizada de grupos institucionales, semilleros y líneas de vinculación tecnológica.
                    </p>
                </div>

                <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                    <div className="relative group w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-hover:text-text-main transition-colors" size={14} />
                        <input
                            type="text"
                            placeholder="Buscar grupos por nombre, siglas..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-vercel !pl-10 !py-2.5 !text-xs uppercase tracking-wider font-mono placeholder:!lowercase"
                        />
                    </div>
                    <button
                        onClick={() => handleOpenModal(undefined, false)}
                        className="btn-brand flex items-center justify-center gap-2 text-xs font-bold"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Proponer Grupo
                    </button>
                </div>
            </header>

            {pendingDraft && (
                <div className="bento-card static p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up mb-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand/5 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-brand via-brand/40 to-transparent" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                            <FileText size={18} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Borrador Detectado</h4>
                                <span className="badge-vercel badge-vercel-info text-[8px] font-bold uppercase py-0 px-2 leading-none shrink-0 font-mono">
                                    No Guardado
                                </span>
                            </div>
                            <p className="text-[10px] text-text-dim uppercase font-bold leading-none">
                                Tienes un borrador sin guardar de: <span className="text-text-main font-black">"{pendingDraft.groupName}"</span>
                            </p>
                            <p className="text-[8px] text-text-dim/60 font-semibold uppercase tracking-wider font-mono">
                                Guardado automáticamente el {new Date(pendingDraft.timestamp).toLocaleDateString()} a las {new Date(pendingDraft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 w-full md:w-auto relative z-10 shrink-0">
                        <button
                            onClick={handleRestoreDraft}
                            className="btn-brand flex-1 md:flex-none !py-2.5 flex items-center justify-center gap-1.5"
                        >
                            Restaurar Borrador
                        </button>
                        <button
                            onClick={handleDiscardDraft}
                            className="btn-vercel-secondary flex-1 md:flex-none !py-2.5 flex items-center justify-center gap-1.5"
                        >
                            Descartar
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <div className="bento-card static overflow-hidden animate-fade-up">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                    <th className="p-4 font-bold tracking-widest">Grupo</th>
                                    <th className="p-4 font-bold tracking-widest">Coordinador</th>
                                    <th className="p-4 font-bold tracking-widest">Vinculación</th>
                                    <th className="p-4 font-bold tracking-widest">Estado</th>
                                    <th className="p-4 font-bold tracking-widest text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-thin">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2 py-4">
                                                <Loader2 className="animate-spin text-text-main h-6 w-6" />
                                                <span className="text-[10px] font-bold text-text-dim uppercase tracking-widest">Cargando grupos...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : groups.length === 0 ? (
                                    <tr>
                                        <td colSpan={5}>
                                            <div className="empty-state py-20 text-center space-y-3">
                                                <Users size={32} className="mx-auto text-text-dim/30" />
                                                <p className="text-text-dim font-bold uppercase tracking-widest text-xs">No se encontraron grupos registrados</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : groups.map((g) => (
                                    <tr
                                        key={g.id_grupo}
                                        onClick={() => setDetailGroup(g)}
                                        className="hover:bg-surface/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-text-main tracking-tight uppercase group-hover:text-brand transition-colors">
                                                    {g.nombre}
                                                </h4>
                                                <div className="flex gap-2">
                                                    <span className="text-[9px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                        {g.siglas || 'SIN SIGLAS'}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim/80">
                                                        {g.tipo_grupo}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-xs font-bold text-text-main uppercase">{g.nombre_coordinador || 'No asignado'}</p>
                                            {g.carrera_coordinador && (
                                                <p className="text-[9px] text-text-dim uppercase font-semibold mt-0.5">{formatCareerName(g.carrera_coordinador)}</p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-text-dim font-mono uppercase">
                                                    {g.lineas_ids?.length || 0} Líneas de Inv.
                                                </p>
                                                <p className="text-[10px] text-text-dim font-mono uppercase">
                                                    {g.carreras_ids?.length || 0} Carreras Vinculadas
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 items-start">
                                                {g.estado === 'Aprobado' && (
                                                    <span className="badge-vercel badge-vercel-success">
                                                        <CheckCircle size={10} /> Aprobado
                                                    </span>
                                                )}
                                                {g.estado === 'Pendiente' && (
                                                    <span className="badge-vercel badge-vercel-warning">
                                                        <Calendar size={10} /> Pendiente
                                                    </span>
                                                )}
                                                {g.estado === 'Rechazado' && (
                                                    <span className="badge-vercel badge-vercel-error">
                                                        <XCircle size={10} /> Rechazado
                                                    </span>
                                                )}
                                                <p className={`text-[8px] font-mono tracking-wider uppercase ${g.activo ? 'text-success' : 'text-text-dim/60'}`}>
                                                    ● {g.activo ? 'Vigente' : 'Inactivo'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => handleOpenModal(g, true)}
                                                    className="p-1.5 rounded hover:bg-surface text-text-dim hover:text-text-main transition-all"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                {(isAdmin || (g.id_profesor_coordinador === user?.id_referencia && g.estado !== 'Pendiente' && g.estado !== 'Aprobado')) && (
                                                    <button
                                                        onClick={() => handleOpenModal(g, false)}
                                                        className="p-1.5 rounded hover:bg-surface text-text-dim hover:text-text-main transition-all"
                                                        title="Editar Grupo"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                )}
                                                {(isAdmin || (g.id_profesor_coordinador === user?.id_referencia && g.estado !== 'Pendiente' && g.estado !== 'Aprobado')) && (
                                                    <button
                                                        onClick={() => handleDelete(g.uuid, g.nombre)}
                                                        className="p-1.5 rounded hover:bg-red-500/10 text-text-dim hover:text-red-500 transition-all"
                                                        title={isAdmin ? "Desactivar" : "Eliminar"}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Admin Resolution & Review Drawer */}
            {isReviewModalOpen && reviewingGroup && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => { setIsReviewModalOpen(false); setReviewingGroup(null); }}
                    />
                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                        <div className="modal-header shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`icon-circle ${isReviewRejecting ? 'icon-circle-error' : 'icon-circle-success'}`}>
                                    {isReviewRejecting ? <XCircle size={20} /> : <CheckCircle size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        Evaluar Propuesta de Grupo
                                    </h3>
                                    <p className="section-label text-text-dim">Revisión y Aprobación Normativa Institucional</p>
                                </div>
                            </div>
                            <button onClick={() => { setIsReviewModalOpen(false); setReviewingGroup(null); }} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Evaluation Mode Toggle tabs */}
                        <div className="flex border-b border-border-thin bg-surface-hover/20 shrink-0">
                            <button
                                onClick={() => setIsReviewRejecting(false)}
                                className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                                    !isReviewRejecting
                                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                        : 'border-transparent text-text-dim hover:text-text-main'
                                }`}
                            >
                                <CheckCircle size={14} />
                                <span>Aprobar Propuesta</span>
                            </button>
                            <button
                                onClick={() => setIsReviewRejecting(true)}
                                className={`flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                                    isReviewRejecting
                                        ? 'border-red-500 text-red-400 bg-red-500/5'
                                        : 'border-transparent text-text-dim hover:text-text-main'
                                }`}
                            >
                                <XCircle size={14} />
                                <span>Rechazar Propuesta</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-bg-deep/30 border border-border-thin rounded-2xl p-4 space-y-2">
                                <span className="text-[8px] font-black uppercase text-text-dim tracking-widest block">Propuesta Bajo Revisión</span>
                                <h4 className="text-sm font-bold text-text-main uppercase">{reviewingGroup.nombre}</h4>
                                <div className="flex gap-2 text-[9px] font-mono text-text-dim font-bold uppercase">
                                    <span>Siglas: {reviewingGroup.siglas || 'S/S'}</span>
                                    <span>|</span>
                                    <span>Coordinador: {reviewingGroup.nombre_coordinador}</span>
                                </div>
                            </div>

                            {!isReviewRejecting ? (
                                /* APPROVAL VIEW */
                                <div className="space-y-6 animate-fade-up">
                                    <div className="space-y-2 text-xs text-text-dim leading-relaxed">
                                        <p>
                                            Confirmar la aprobación activará el estado del grupo de investigación a <span className="text-emerald-400 font-extrabold">APROBADO</span>, habilitándolo para vincular proyectos y convocatorias institucionales.
                                        </p>
                                        <p>
                                            Defina el identificador de la Resolución de Aprobación del Consejo de Investigación o Dirección:
                                        </p>
                                    </div>

                                    <div className="bento-card static p-5 space-y-3">
                                        <label className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={12} className="text-emerald-400" /> Resolución de Aprobación Oficial
                                        </label>
                                        <div className="divider-vercel !my-0" />
                                        <input
                                            required
                                            type="text"
                                            value={reviewResolution}
                                            onChange={(e) => setReviewResolution(e.target.value)}
                                            className="w-full bg-bg-deep border border-border-thin focus:border-emerald-500 rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 uppercase font-mono font-medium"
                                            placeholder="Ej: ACTA-DI-2026-008"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* REJECTION VIEW */
                                <div className="space-y-6 animate-fade-up">
                                    <div className="space-y-2 text-xs text-text-dim leading-relaxed">
                                        <p>
                                            Rechazar la propuesta devolverá el grupo al estado <span className="text-red-400 font-extrabold">RECHAZADO</span>. 
                                            El equipo proponente recibirá una notificación y podrá editar la propuesta para adaptarla a sus observaciones.
                                        </p>
                                        <p>
                                            Proporcione los motivos de manera profesional. Puede escribir los detalles y/o **grabar una explicación verbal** (audio explicativo) para mayor claridad:
                                        </p>
                                    </div>

                                    {/* Text Observations */}
                                    <div className="bento-card static p-5 space-y-3">
                                        <label className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                            <FileText size={12} className="text-red-400" /> Observaciones Escritas
                                        </label>
                                        <div className="divider-vercel !my-0" />
                                        <textarea
                                            rows={4}
                                            value={rejectObservations}
                                            onChange={(e) => setRejectObservations(e.target.value)}
                                            className="w-full bg-bg-deep border border-border-thin focus:border-red-500 rounded-lg p-3 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 font-medium"
                                            placeholder="Describa los aspectos a corregir o completar (ej: replantear la visión, reestructurar los semilleristas)..."
                                        />
                                    </div>

                                    {/* Professional Audio Rejection Recorder */}
                                    <div className="bento-card static p-5 space-y-4">
                                        <label className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-2">
                                            <Mic size={12} className="text-red-400" /> Retroalimentación de Audio (Voz)
                                        </label>
                                        <div className="divider-vercel !my-0" />

                                        {isRecording ? (
                                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex flex-col items-center gap-4 justify-center animate-pulse">
                                                <div className="flex items-center gap-3">
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                    </span>
                                                    <span className="text-xs font-black uppercase text-red-400 tracking-wider font-mono">
                                                        GRABANDO RETROALIMENTACIÓN DE VOZ ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                                    </span>
                                                </div>

                                                {/* Equalizer animation */}
                                                <div className="flex items-end gap-1 h-8 justify-center w-full">
                                                    {Array.from({ length: 14 }).map((_, i) => (
                                                        <span 
                                                            key={i} 
                                                            className="w-1 bg-red-500 rounded-full animate-bounce" 
                                                            style={{ 
                                                                height: '100%', 
                                                                animationDelay: `${i * 100}ms`, 
                                                                animationDuration: '0.6s' 
                                                            }} 
                                                        />
                                                    ))}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg transition-all shadow-lg active:scale-95"
                                                >
                                                    Detener Grabación
                                                </button>
                                            </div>
                                        ) : audioUrl ? (
                                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 items-center justify-center animate-fade-in">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle size={14} className="text-emerald-400" />
                                                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider font-mono">GRABACIÓN LISTA PARA SER ENVIADA</span>
                                                </div>
                                                <AudioBubblePlayer src={audioUrl} />
                                                <button
                                                    type="button"
                                                    onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                                    className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/40 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                                >
                                                    Descartar y Grabar de Nuevo
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="py-6 border border-dashed border-border-thin rounded-xl bg-bg-deep/20 flex flex-col items-center justify-center gap-3">
                                                <Mic size={24} className="text-text-dim/40" />
                                                <div className="text-center space-y-1">
                                                    <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">¿Desea agregar comentarios de voz?</p>
                                                    <p className="text-[8px] text-text-dim max-w-[280px] uppercase font-mono">El equipo docente apreciará una explicación verbal detallada sobre el rechazo.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="px-5 py-2.5 bg-text-main text-bg-deep font-bold text-[9px] uppercase tracking-widest rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 shadow-md"
                                                >
                                                    <Mic size={12} strokeWidth={2.5} /> Grabar Comentarios de Voz
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer shrink-0">
                            <button
                                onClick={() => { setIsReviewModalOpen(false); setReviewingGroup(null); }}
                                className="btn-vercel-secondary"
                            >
                                Cancelar
                            </button>
                            
                            {!isReviewRejecting ? (
                                <button
                                    onClick={handleApprove}
                                    className="btn-vercel-primary flex items-center gap-2"
                                >
                                    <CheckCircle size={14} /> Confirmar y Aprobar
                                </button>
                            ) : (
                                <button
                                    disabled={sendingFeedback || (!rejectObservations.trim() && !audioBlob)}
                                    onClick={handleRejectReview}
                                    className="px-6 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[10px] uppercase tracking-widest rounded-md transition-all flex items-center gap-2 shadow-lg shadow-red-500/10"
                                >
                                    {sendingFeedback ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                                    Confirmar y Rechazar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmDialog.isOpen && (
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div className="modal-card animate-scale-up max-w-md">
                        <div className="modal-header !py-4">
                            <div className="flex items-center gap-3">
                                <div className={`icon-circle ${
                                    confirmDialog.type === 'danger' ? 'icon-circle-error' :
                                    confirmDialog.type === 'warning' ? 'icon-circle-warning' :
                                    confirmDialog.type === 'success' ? 'icon-circle-success' :
                                    'icon-circle-info'
                                }`}>
                                    {confirmDialog.type === 'danger' && <XCircle size={18} />}
                                    {confirmDialog.type === 'warning' && <AlertTriangle size={18} />}
                                    {confirmDialog.type === 'success' && <CheckCircle size={18} />}
                                    {confirmDialog.type === 'info' && <Shield size={18} />}
                                </div>
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">
                                    {confirmDialog.title}
                                </h3>
                            </div>
                        </div>
                        <div className="modal-body py-6">
                            <p className="text-xs text-text-dim leading-relaxed font-medium uppercase">
                                {confirmDialog.message}
                            </p>
                        </div>
                        <div className="modal-footer bg-surface/50 !py-3">
                            <button
                                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                                className="btn-vercel-secondary !py-2"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                                    await confirmDialog.onConfirm();
                                }}
                                className={`!py-2 ${
                                    confirmDialog.type === 'danger' ? 'bg-error hover:opacity-90 border border-error text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                                    confirmDialog.type === 'warning' ? 'bg-warning hover:opacity-90 border border-warning text-white font-bold text-[10px] uppercase tracking-widest px-5 rounded-md transition-all' :
                                    'btn-vercel-primary'
                                }`}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Components Rendered Modally */}
            <GroupFormDrawer
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingGroup={editingGroup}
                isReadOnly={isReadOnly}
                isAdmin={isAdmin}
                dominios={dominios}
                carreras={carreras}
                lines={lines}
                fetchData={fetchData}
                setConfirmDialog={setConfirmDialog}
                formatUserDetails={formatUserDetails}
                formatCareerName={formatCareerName}
                setIsCareerModalOpen={setIsCareerModalOpen}
                onDraftCleared={() => setPendingDraft(null)}
            />

            <GroupDetailDrawer
                isOpen={!!detailGroup}
                onClose={() => setDetailGroup(null)}
                detailGroup={detailGroup}
                setDetailGroup={setDetailGroup}
                isAdmin={isAdmin}
                user={user}
                dominios={dominios}
                carreras={carreras}
                lines={lines}
                formatCareerName={formatCareerName}
                handleOpenModal={(group, ro) => {
                    setEditingGroup(group);
                    setIsReadOnly(ro);
                    setIsModalOpen(true);
                }}
                handleOpenReview={handleOpenReview}
            />

            <CareerLinkageModal
                isOpen={isCareerModalOpen}
                onClose={() => setIsCareerModalOpen(false)}
                formData={{ id_profesor_coordinador: editingGroup?.id_profesor_coordinador || detailGroup?.id_profesor_coordinador }}
                selectedCoordName={editingGroup?.nombre_coordinador || detailGroup?.nombre_coordinador || ''}
                selectedCoordCareer={editingGroup?.carrera_coordinador || detailGroup?.carrera_coordinador || ''}
                groupMembers={editingGroup?.miembros || detailGroup?.miembros || []}
                formatCareerName={formatCareerName}
            />
        </main>
    );
};

export default GroupsPage;
