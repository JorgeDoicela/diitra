import React, { useState, useEffect, useRef } from 'react';
import {
    Users, Plus, Search, Edit2,
    Trash2, CheckCircle, XCircle, AlertTriangle,
    BookOpen, Shield, Award, Calendar, FileText,
    UserMinus, GraduationCap, User, ChevronRight, Target, ChevronDown,
    MessageSquare, Send, Mic, Play, Pause, Loader2, Volume2, RefreshCw
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
    categoria_consolidacion?: string;
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

const AudioBubblePlayer = ({ src }: { src: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = new Audio(src);
        audioRef.current = audio;

        const onLoadedMetadata = () => setDuration(audio.duration || 0);
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.pause();
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('ended', onEnded);
        };
    }, [src]);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().catch(err => console.error("Error playing audio:", err));
            setIsPlaying(true);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="flex items-center gap-3 bg-bg-deep/80 border border-border-thin rounded-xl p-3 w-64 shrink-0 shadow-lg backdrop-blur-sm">
            <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-full bg-text-main text-bg-deep flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0 focus:outline-none"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
                {/* Simulated equalizer bars */}
                <div className="flex items-end gap-[3px] h-6 justify-center">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const active = isPlaying && currentTime > 0;
                        const played = (currentTime / (duration || 1)) > (i / 20);
                        const height = Math.sin(i * 0.4) * 6 + 10 + (active ? Math.random() * 8 : 0);
                        return (
                            <span
                                key={i}
                                className={`w-[2px] rounded-full transition-all duration-300 ${
                                    played ? 'bg-text-main' : 'bg-text-dim/30'
                                }`}
                                style={{ height: `${height}px` }}
                            />
                        );
                    })}
                </div>
                <div className="flex justify-between text-[8px] font-mono text-text-dim/80 font-bold select-none">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>
        </div>
    );
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
    const [isReadOnly, setIsReadOnly] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // Detail drawer
    const [detailGroup, setDetailGroup] = useState<Group | null>(null);
    const [detailMembers, setDetailMembers] = useState<GroupMember[]>([]);
    const [detailTab, setDetailTab] = useState<'info' | 'feedback'>('info');
    const [feedbackComments, setFeedbackComments] = useState<any[]>([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [newFeedbackText, setNewFeedbackText] = useState('');
    const [sendingFeedback, setSendingFeedback] = useState(false);

    // Contextual field feedback states
    const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
    const [activeFieldName, setActiveFieldName] = useState<string>('');
    const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
    const [highlightedField, setHighlightedField] = useState<string | null>(null);

    // Audio recording state & refs
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string>('');
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);

    // Review states (Admin)
    const [reviewingGroup, setReviewingGroup] = useState<Group | null>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewResolution, setReviewResolution] = useState('');
    const [rejectObservations, setRejectObservations] = useState('');
    const [isReviewRejecting, setIsReviewRejecting] = useState(false); // To toggle between approval & rejection UI inside evaluation drawer

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

    // Member states
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

    // Teacher Autocomplete States & Search
    const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState<any[]>([]);
    const [isTeacherSearching, setIsTeacherSearching] = useState(false);
    const [showTeacherResults, setShowTeacherResults] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
    const [teacherRol, setTeacherRol] = useState('Co-Investigador');

    // Student Autocomplete States & Search
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchResults, setStudentSearchResults] = useState<any[]>([]);
    const [isStudentSearching, setIsStudentSearching] = useState(false);
    const [showStudentResults, setShowStudentResults] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [studentRol, setStudentRol] = useState('Semillerista');

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
        categoria_consolidacion: 'En Formación',
        lineas_ids: [] as number[],
        carreras_ids: [] as number[]
    });

    // --- Coordinator Autocomplete States & Search ---
    const [coordSearchQuery, setCoordSearchQuery] = useState('');
    const [selectedCoordName, setSelectedCoordName] = useState('');
    const [coordSearchResults, setCoordSearchResults] = useState<any[]>([]);
    const [isCoordSearching, setIsCoordSearching] = useState(false);
    const [showCoordResults, setShowCoordResults] = useState(false);

    useEffect(() => {
        if (!showCoordResults) return;

        const delayDebounceFn = setTimeout(async () => {
            setIsCoordSearching(true);
            try {
                const queryParam = (!coordSearchQuery.trim() || coordSearchQuery === (editingGroup?.nombre_coordinador || ''))
                    ? ''
                    : coordSearchQuery;

                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(queryParam)}&tipo=profesor`);
                setCoordSearchResults(res.data || []);
            } catch (err) {
                console.error("Error al buscar docentes coordinadores:", err);
            } finally {
                setIsCoordSearching(false);
            }
        }, coordSearchQuery.trim() ? 300 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [coordSearchQuery, showCoordResults, editingGroup]);

    const handleSelectCoordinator = (teacher: any) => {
        if (groupMembers.some(m => m.cedula === teacher.cedula)) {
            alert("Este docente ya es un integrante del grupo y no puede ser asignado como Coordinador Responsable.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            id_profesor_coordinador: teacher.cedula
        }));
        setSelectedCoordName(teacher.nombre);
        setCoordSearchQuery('');
        setShowCoordResults(false);
    };

    // Autocomplete for Teachers (tipo=profesor)
    useEffect(() => {
        if (!showTeacherResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsTeacherSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(teacherSearchQuery)}&tipo=profesor`);
                setTeacherSearchResults(res.data || []);
            } catch (err) {
                console.error("Error al buscar docentes investigadores:", err);
            } finally {
                setIsTeacherSearching(false);
            }
        }, teacherSearchQuery.trim() ? 300 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [teacherSearchQuery, showTeacherResults]);

    // Autocomplete for Students (tipo=alumno)
    useEffect(() => {
        if (!showStudentResults) return;
        const delayDebounceFn = setTimeout(async () => {
            setIsStudentSearching(true);
            try {
                const res = await api.get(`/catalogs/search-users?q=${encodeURIComponent(studentSearchQuery)}&tipo=alumno`);
                setStudentSearchResults(res.data || []);
            } catch (err) {
                console.error("Error al buscar estudiantes:", err);
            } finally {
                setIsStudentSearching(false);
            }
        }, studentSearchQuery.trim() ? 300 : 0);

        return () => clearTimeout(delayDebounceFn);
    }, [studentSearchQuery, showStudentResults]);

    const handleSelectTeacher = (teacher: any) => {
        setSelectedTeacher(teacher);
        setTeacherSearchQuery(teacher.nombre);
        setShowTeacherResults(false);
        setTeacherRol('Co-Investigador');
    };

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setStudentSearchQuery(student.nombre);
        setShowStudentResults(false);
        setStudentRol('Semillerista');
    };

    const handleAddTeacher = async () => {
        if (!selectedTeacher) return;

        if (selectedTeacher.cedula === formData.id_profesor_coordinador) {
            alert("No se puede agregar al Coordinador Responsable como integrante docente.");
            return;
        }

        const newMember = {
            id_grupo_miembro: Date.now(), // ID temporal para keys de React
            id_usuario: 0,
            cedula: selectedTeacher.cedula,
            nombre_completo: selectedTeacher.nombre,
            rol: teacherRol,
            activo: true
        };

        if (editingGroup) {
            try {
                const memberDto = {
                    id_usuario: 0,
                    cedula: selectedTeacher.cedula,
                    nombre_completo: selectedTeacher.nombre,
                    rol: teacherRol,
                    activo: true
                };

                await api.post(`/Groups/${editingGroup.uuid}/members`, memberDto);

                const res = await api.get(`/Groups/${editingGroup.uuid}`);
                const fullGroup = res.data;
                if (fullGroup && fullGroup.miembros) {
                    const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                    setGroupMembers(activeMembers);
                }
            } catch (error: any) {
                console.error("Error al agregar integrante docente:", error);
                alert("No se pudo agregar al docente: " + (error.response?.data?.message || error.message));
            }
        } else {
            // Manejo local para propuesta de grupo
            if (groupMembers.some(m => m.cedula === selectedTeacher.cedula)) {
                alert("Este docente ya ha sido agregado al grupo.");
                return;
            }
            setGroupMembers(prev => [...prev, newMember as any]);
        }

        setSelectedTeacher(null);
        setTeacherSearchQuery('');
        setTeacherRol('Co-Investigador');
    };

    const handleAddStudent = async () => {
        if (!selectedStudent) return;

        const newMember = {
            id_grupo_miembro: Date.now(), // ID temporal para keys de React
            id_usuario: 0,
            cedula: selectedStudent.cedula,
            nombre_completo: selectedStudent.nombre,
            rol: studentRol,
            activo: true
        };

        if (editingGroup) {
            try {
                const memberDto = {
                    id_usuario: 0,
                    cedula: selectedStudent.cedula,
                    nombre_completo: selectedStudent.nombre,
                    rol: studentRol,
                    activo: true
                };

                await api.post(`/Groups/${editingGroup.uuid}/members`, memberDto);

                const res = await api.get(`/Groups/${editingGroup.uuid}`);
                const fullGroup = res.data;
                if (fullGroup && fullGroup.miembros) {
                    const activeMembers = fullGroup.miembros.filter((m: any) => m.activo);
                    setGroupMembers(activeMembers);
                }
            } catch (error: any) {
                console.error("Error al agregar integrante estudiante:", error);
                alert("No se pudo agregar al estudiante: " + (error.response?.data?.message || error.message));
            }
        } else {
            // Manejo local para propuesta de grupo
            if (groupMembers.some(m => m.cedula === selectedStudent.cedula)) {
                alert("Este estudiante ya ha sido agregado al grupo.");
                return;
            }
            setGroupMembers(prev => [...prev, newMember as any]);
        }

        setSelectedStudent(null);
        setStudentSearchQuery('');
        setStudentRol('Semillerista');
    };

    const handleRemoveMember = async (idGrupoMiembro: number) => {
        if (editingGroup) {
            const reason = window.prompt("Ingrese el motivo por el cual el integrante se retira del grupo (opcional):");
            if (reason === null) return; // Cancelado por el usuario

            try {
                const encodedReason = encodeURIComponent(reason.trim());
                await api.delete(`/Groups/members/${idGrupoMiembro}?reason=${encodedReason}`);

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
        } else {
            // Manejo local para propuesta de grupo
            setGroupMembers(prev => prev.filter(m => m.id_grupo_miembro !== idGrupoMiembro));
        }
    };

    const handleOpenDetail = async (group: Group) => {
        setDetailGroup(group);
        setDetailTab('info');
        fetchFeedbackComments(group.uuid);
        try {
            const res = await api.get(`/Groups/${group.uuid}`);
            const fullGroup = res.data;
            if (fullGroup) {
                setDetailGroup(prev => prev ? { ...prev, ...fullGroup } : fullGroup);
                if (fullGroup.miembros) {
                    setDetailMembers(fullGroup.miembros.filter((m: any) => m.activo));
                } else {
                    setDetailMembers([]);
                }
            }
        } catch (err) {
            console.error("Error loading group detail:", err);
            setDetailMembers([]);
        }
    };

    const fetchFeedbackComments = async (uuid: string) => {
        setLoadingFeedback(true);
        try {
            const res = await api.get(`/collaboration/${uuid}/pulse`);
            if (res.data && res.data.comments) {
                // Comments are loaded in descending order in pulse, reverse for chat chronological flow
                const sorted = [...res.data.comments].reverse();
                setFeedbackComments(sorted);
            } else {
                setFeedbackComments([]);
            }
        } catch (err) {
            console.error("Error al cargar comentarios de retroalimentación:", err);
            setFeedbackComments([]);
        } finally {
            setLoadingFeedback(false);
        }
    };

    // Voice recording helpers for professional feedback
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
                // stop microphone stream tracks to release device
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

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
        if (timerRef.current) clearInterval(timerRef.current);
        setAudioBlob(null);
        setAudioUrl('');
    };

    const handleSendFeedbackMessage = async (groupUuid: string, parentId?: number) => {
        if (!newFeedbackText.trim() && !audioBlob) return;
        setSendingFeedback(true);
        try {
            let contentStr = '';

            if (audioBlob) {
                // Upload audio first
                const formData = new FormData();
                formData.append('file', audioBlob, `audio_feedback_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const payload = {
                    type: 'audio',
                    audioUrl: uploadRes.data.url,
                    text: newFeedbackText.trim() || 'Explicación de audio adjunta'
                };
                contentStr = JSON.stringify(payload);
            } else {
                contentStr = newFeedbackText.trim();
            }

            await api.post('/collaboration/comments', {
                documentoUuid: groupUuid,
                DocumentoUuid: groupUuid,
                documento_uuid: groupUuid,
                contenido: contentStr,
                Contenido: contentStr,
                idPadre: parentId || null,
                IdPadre: parentId || null,
                id_padre: parentId || null
            });

            setNewFeedbackText('');
            setAudioBlob(null);
            setAudioUrl('');
            await fetchFeedbackComments(groupUuid);
        } catch (err: any) {
            console.error("Error al enviar comentario de retroalimentación:", err);
            alert("Error al enviar: " + (err.response?.data?.message || err.message));
        } finally {
            setSendingFeedback(false);
        }
    };

    const parseCommentContent = (contenido: string) => {
        try {
            if (contenido.trim().startsWith('{')) {
                const parsed = JSON.parse(contenido);
                return parsed;
            }
        } catch (e) {}
        return null;
    };

    const getFieldComments = (fieldKey: string) => {
        return feedbackComments.filter(c => {
            const parsed = parseCommentContent(c.contenido);
            return parsed && parsed.type === 'field_feedback' && parsed.field === fieldKey;
        });
    };

    const openFieldFeedbackDrawer = (fieldKey: string, fieldName: string) => {
        setActiveFieldKey(fieldKey);
        setActiveFieldName(fieldName);
        setIsFieldModalOpen(true);
        // Clear any recording states
        setAudioBlob(null);
        setAudioUrl('');
    };

    const handleSendFieldFeedback = async (fieldKey: string, fieldName: string) => {
        if (!newFeedbackText.trim() && !audioBlob) return;
        if (!detailGroup?.uuid) {
            console.error("Error: detailGroup.uuid is undefined or null");
            alert("Error: No se pudo identificar el grupo.");
            return;
        }
        setSendingFeedback(true);
        try {
            let uploadedAudioUrl = '';
            if (audioBlob) {
                const formData = new FormData();
                formData.append('file', audioBlob, `audio_field_${fieldKey}_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedAudioUrl = uploadRes.data.url;
            }

            const payload = {
                type: 'field_feedback',
                field: fieldKey,
                fieldName: fieldName,
                text: newFeedbackText.trim(),
                audioUrl: uploadedAudioUrl
            };
            const contentStr = JSON.stringify(payload);

            await api.post('/collaboration/comments', {
                documentoUuid: detailGroup.uuid,
                DocumentoUuid: detailGroup.uuid,
                documento_uuid: detailGroup.uuid,
                contenido: contentStr,
                Contenido: contentStr
            });

            setNewFeedbackText('');
            setAudioBlob(null);
            setAudioUrl('');
            await fetchFeedbackComments(detailGroup.uuid);
        } catch (err: any) {
            console.error("Error al enviar retroalimentación de campo:", err);
            alert("Error al enviar: " + (err.response?.data?.message || err.message));
        } finally {
            setSendingFeedback(false);
        }
    };

    const renderFieldFeedbackButton = (fieldKey: string, fieldName: string) => {
        const comments = getFieldComments(fieldKey);
        const hasComments = comments.length > 0;
        
        if (!hasComments && !isAdmin) return null;
        
        return (
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    openFieldFeedbackDrawer(fieldKey, fieldName);
                }}
                className={`flex items-center gap-1 p-1.5 rounded-lg transition-all active:scale-95 shrink-0 ${
                    hasComments
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                        : 'text-text-dim/40 hover:text-text-main hover:bg-surface-hover'
                }`}
                title={hasComments ? `Ver ${comments.length} observaciones` : 'Agregar observación contextual'}
            >
                <MessageSquare size={13} className={hasComments ? 'fill-amber-500/10 text-amber-400' : ''} />
                {hasComments && (
                    <span className="text-[8px] font-mono font-bold leading-none bg-amber-500 text-bg-deep px-1 py-0.5 rounded-full">
                        {comments.length}
                    </span>
                )}
            </button>
        );
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

            if (detailGroup) {
                const updated = groupsRes.data.find((g: Group) => g.uuid === detailGroup.uuid);
                if (updated) {
                    setDetailGroup(prev => prev ? { ...prev, ...updated } : updated);
                    try {
                        const detailRes = await api.get(`/Groups/${updated.uuid}`);
                        if (detailRes.data) {
                            setDetailGroup(prev => prev ? { ...prev, ...detailRes.data } : detailRes.data);
                            if (detailRes.data.miembros) {
                                setDetailMembers(detailRes.data.miembros.filter((m: any) => m.activo));
                            }
                        }
                    } catch (err) {
                        console.error("Error loading group detail:", err);
                        setDetailMembers([]);
                    }
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

    const handleOpenModal = async (group?: Group, readOnly = false) => {
        setIsReadOnly(readOnly);
        setTeacherSearchQuery('');
        setTeacherSearchResults([]);
        setSelectedTeacher(null);
        setTeacherRol('Co-Investigador');

        setStudentSearchQuery('');
        setStudentSearchResults([]);
        setSelectedStudent(null);
        setStudentRol('Semillerista');

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
                categoria_consolidacion: group.categoria_consolidacion || 'En Formación',
                lineas_ids: group.lineas_ids || [],
                carreras_ids: group.carreras_ids || []
            });
            setSelectedCoordName(group.nombre_coordinador || '');
            setCoordSearchQuery('');

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
                        categoria_consolidacion: fullGroup.categoria_consolidacion || 'En Formación',
                        lineas_ids: fullGroup.lineas_ids || [],
                        carreras_ids: fullGroup.carreras_ids || []
                    });
                    setSelectedCoordName(fullGroup.nombre_coordinador || '');
                    setCoordSearchQuery('');

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
                categoria_consolidacion: 'En Formación',
                lineas_ids: [],
                carreras_ids: []
            });
            setSelectedCoordName('');
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
                id_dominio: formData.id_dominio ? parseInt(formData.id_dominio) : null,
                miembros: editingGroup ? [] : groupMembers.map(m => ({
                    id_usuario: m.id_usuario || 0,
                    cedula: m.cedula,
                    nombre_completo: m.nombre_completo,
                    rol: m.rol,
                    activo: true
                }))
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

    // Review Handlers (Admin)
    const handleOpenReview = (group: Group, isReject = false) => {
        setReviewingGroup(group);
        setReviewResolution('');
        setRejectObservations('');
        setIsReviewRejecting(isReject);
        setAudioBlob(null);
        setAudioUrl('');
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

            // Post automated comment inside collaboration comments feed
            try {
                await api.post('/collaboration/comments', {
                    documentoUuid: reviewingGroup.uuid,
                    DocumentoUuid: reviewingGroup.uuid,
                    documento_uuid: reviewingGroup.uuid,
                    contenido: `Propuesta de Grupo Aprobada formalmente bajo la resolución institucional: ${reviewResolution.trim()}`,
                    Contenido: `Propuesta de Grupo Aprobada formalmente bajo la resolución institucional: ${reviewResolution.trim()}`
                });
            } catch (e) {
                console.error("Error posting approval feedback comment:", e);
            }

            setIsReviewModalOpen(false);
            setReviewingGroup(null);
            fetchData();
        } catch (error: any) {
            console.error('Error approving group:', error);
            alert('Error al aprobar el grupo: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleRejectReview = async () => {
        if (!reviewingGroup) return;
        if (!rejectObservations.trim() && !audioBlob) {
            alert('Por favor proporcione las razones del rechazo por escrito o grabe un audio explicativo.');
            return;
        }
        setSendingFeedback(true);
        try {
            let contentStr = '';

            if (audioBlob) {
                // Upload audio first
                const formData = new FormData();
                formData.append('file', audioBlob, `audio_rejection_${Date.now()}.webm`);
                const uploadRes = await api.post('/collaboration/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                const payload = {
                    type: 'audio',
                    audioUrl: uploadRes.data.url,
                    text: `Propuesta Rechazada. Observaciones: ${rejectObservations.trim() || 'Explicación verbal adjunta.'}`
                };
                contentStr = JSON.stringify(payload);
            } else {
                contentStr = `Propuesta Rechazada. Observaciones: ${rejectObservations.trim()}`;
            }

            // Post comment in history thread
            await api.post('/collaboration/comments', {
                documentoUuid: reviewingGroup.uuid,
                DocumentoUuid: reviewingGroup.uuid,
                documento_uuid: reviewingGroup.uuid,
                contenido: contentStr,
                Contenido: contentStr
            });

            // Call patch review state to Rejected
            await api.patch(`/Groups/${reviewingGroup.uuid}/review`, {
                aprobado: false
            });

            setIsReviewModalOpen(false);
            setReviewingGroup(null);
            setRejectObservations('');
            setAudioBlob(null);
            setAudioUrl('');
            fetchData();
        } catch (error: any) {
            console.error('Error rejecting group proposal:', error);
            alert('Error al rechazar el grupo: ' + (error.response?.data?.message || error.message));
        } finally {
            setSendingFeedback(false);
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
                                <tr key={g.uuid} className="hover:bg-surface/30 transition-colors group cursor-pointer" onClick={() => handleOpenDetail(g)}>
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded bg-text-main/10 border border-text-main/20 flex items-center justify-center text-text-main group-hover:scale-105 transition-transform shrink-0">
                                                <Award size={18} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-bold text-text-main tracking-tight uppercase">{g.nombre}</p>
                                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${g.tipo_grupo === 'Semillero'
                                                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        }`}>
                                                        {g.tipo_grupo?.toUpperCase() || 'INVESTIGACIÓN'}
                                                    </span>
                                                    {g.categoria_consolidacion && (
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border ${g.categoria_consolidacion === 'Consolidado'
                                                                ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                                                                : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                                            }`}>
                                                            {g.categoria_consolidacion.toUpperCase()}
                                                        </span>
                                                    )}
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
                                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
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
                                                        onClick={() => handleOpenReview(g, true)}
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
                                                    const esEditable = esCoordinador && g.estado !== 'Pendiente' && g.estado !== 'Aprobado';

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
                                                        return null;
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

            {/* Creation / Edition / View Modal/Drawer */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setIsModalOpen(false)}
                    />
                    <div className="relative w-full max-w-3xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">
                                        {isReadOnly ? 'Ver Grupo de Investigación' : (editingGroup ? 'Editar Grupo de Investigación' : 'Nuevo Grupo de Investigación')}
                                    </h3>
                                    <p className="section-label text-text-dim">Configuración administrativa y normativa</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
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
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, siglas: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, tipo_grupo: e.target.value })}
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
                                        onChange={(e) => setFormData({ ...formData, id_dominio: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Seleccione Dominio...</option>
                                        {dominios.map(d => (
                                            <option key={d.id_dominio} value={d.id_dominio}>{d.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Categoría de Consolidación</label>
                                    <select
                                        required
                                        disabled={isReadOnly}
                                        value={formData.categoria_consolidacion}
                                        onChange={(e) => setFormData({ ...formData, categoria_consolidacion: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed font-medium"
                                    >
                                        <option value="En Formación">En Formación (Grupo Inicial / Reciente)</option>
                                        <option value="Consolidado">Consolidado (Producción & Publicaciones Indexadas)</option>
                                    </select>
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Coordinador Responsable</label>

                                    {isReadOnly ? (
                                        <div className="w-full bg-bg-deep/50 border border-border-thin rounded-lg p-3 text-sm text-text-main font-medium flex items-center gap-3">
                                            <User size={16} className="text-text-dim" />
                                            <div>
                                                <p className="font-bold text-text-main text-xs uppercase">{selectedCoordName || 'Sin Coordinador'}</p>
                                                {formData.id_profesor_coordinador && (
                                                    <p className="text-[10px] text-text-dim font-mono">C.I. {formData.id_profesor_coordinador}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {/* Custom Selector Trigger */}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!showCoordResults) {
                                                        setCoordSearchQuery('');
                                                    }
                                                    setShowCoordResults(!showCoordResults);
                                                }}
                                                className={`w-full bg-bg-deep border rounded-lg p-3 text-left transition-all flex items-center justify-between text-xs font-medium focus:outline-none focus:border-text-main ${showCoordResults ? 'border-text-main shadow-lg shadow-text-main/5' : 'border-border-thin hover:border-text-dim'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 truncate">
                                                    <User size={16} className={formData.id_profesor_coordinador ? "text-emerald-400" : "text-text-dim"} />
                                                    <div className="truncate">
                                                        {formData.id_profesor_coordinador ? (
                                                            <>
                                                                <p className="font-bold text-text-main text-xs uppercase truncate">{selectedCoordName}</p>
                                                                <p className="text-[9px] text-emerald-400 font-mono">Verificado | C.I. {formData.id_profesor_coordinador}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-text-dim/60 font-bold uppercase tracking-wider text-[10px]">Seleccionar Coordinador Responsable...</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronDown size={16} className={`text-text-dim transition-transform duration-200 shrink-0 ${showCoordResults ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Search Dropdown Panel */}
                                            {showCoordResults && (
                                                <>
                                                    <div className="fixed inset-0 z-20" onClick={() => setShowCoordResults(false)}></div>
                                                    <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-border-thin rounded-xl shadow-2xl z-30 overflow-hidden flex flex-col backdrop-blur-md animate-fade-in max-h-72">

                                                        {/* Integrated Search Input in Dropdown */}
                                                        <div className="p-3 bg-bg-deep/50 border-b border-border-thin relative flex items-center shrink-0">
                                                            <Search size={14} className="absolute left-6 text-text-dim" />
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={coordSearchQuery}
                                                                onChange={(e) => {
                                                                    setCoordSearchQuery(e.target.value);
                                                                    if (formData.id_profesor_coordinador) {
                                                                        setFormData(prev => ({ ...prev, id_profesor_coordinador: '' }));
                                                                        setSelectedCoordName('');
                                                                    }
                                                                }}
                                                                placeholder="Filtrar docente por nombre o cédula..."
                                                                className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-2.5 pl-10 pr-10 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/60 font-medium font-mono uppercase"
                                                            />
                                                            {isCoordSearching && (
                                                                <div className="absolute right-6">
                                                                    <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-text-main rounded-full"></div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Results List */}
                                                        <div className="overflow-y-auto divide-y divide-border-thin/30 max-h-48 custom-scrollbar">
                                                            {isCoordSearching && coordSearchResults.length === 0 ? (
                                                                <div className="p-5 text-center text-xs text-text-dim font-mono">
                                                                    <div className="animate-spin h-5 w-5 border-2 border-t-transparent border-text-main rounded-full mx-auto mb-2"></div>
                                                                    <span>Buscando docentes...</span>
                                                                </div>
                                                            ) : coordSearchResults.length === 0 && !isCoordSearching ? (
                                                                <div className="p-5 text-center text-xs text-text-dim font-mono uppercase">
                                                                    No se encontraron docentes.
                                                                </div>
                                                            ) : (
                                                                coordSearchResults.map((selectedUser: any) => (
                                                                    <button
                                                                        key={selectedUser.cedula}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            handleSelectCoordinator(selectedUser);
                                                                            setShowCoordResults(false);
                                                                        }}
                                                                        className="w-full p-3 flex items-center justify-between hover:bg-surface-hover text-left transition-colors"
                                                                    >
                                                                        <div className="space-y-1 truncate pr-2">
                                                                            <p className="font-bold text-text-main text-xs uppercase truncate">{selectedUser.nombre}</p>
                                                                            <p className="text-text-dim font-mono text-[9px]">C.I. {selectedUser.cedula} | {selectedUser.email}</p>
                                                                        </div>
                                                                        <span className="px-2 py-0.5 rounded text-[8px] shrink-0 font-extrabold tracking-wider uppercase border bg-text-main/10 border-text-main/20 text-text-main">
                                                                            Docente
                                                                        </span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Bento Section: Group Members */}
                            {true ? (() => {
                                const teachers = groupMembers.filter(member => {
                                    const rolLower = (member.rol || '').toLowerCase();
                                    return !rolLower.includes('semillerista') && !rolLower.includes('estudiante');
                                });

                                const students = groupMembers.filter(member => {
                                    const rolLower = (member.rol || '').toLowerCase();
                                    return rolLower.includes('semillerista') || rolLower.includes('estudiante');
                                });

                                return (
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

                                        {/* Grid separating Docentes and Estudiantes */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Sector 1: Docentes Investigadores */}
                                            <div className="space-y-4 p-5 rounded-2xl bg-bg-deep/20 border border-emerald-500/10 backdrop-blur-sm relative overflow-hidden transition-all hover:border-emerald-500/25">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                                                
                                                <div className="flex justify-between items-center pb-2 border-b border-border-thin">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                                            <User size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Docentes Investigadores</h4>
                                                            <p className="text-[10px] text-text-dim/80 font-bold uppercase tracking-tight">Académicos con horas de investigación</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                                                        {teachers.length} Activos
                                                    </span>
                                                </div>

                                                {/* Form to add teacher */}
                                                {!isReadOnly && (
                                                    <div className="space-y-3 p-3.5 bg-bg-deep/40 rounded-xl border border-border-thin">
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <div className="relative space-y-1">
                                                                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Buscador Docente</label>
                                                                <div className="relative">
                                                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                                                    <input
                                                                        type="text"
                                                                        value={teacherSearchQuery}
                                                                        onChange={(e) => {
                                                                            setTeacherSearchQuery(e.target.value);
                                                                            if (selectedTeacher) {
                                                                                setSelectedTeacher(null);
                                                                            }
                                                                        }}
                                                                        onFocus={() => setShowTeacherResults(true)}
                                                                        placeholder="Buscar docente investigador por nombre o cédula..."
                                                                        className="w-full bg-bg-deep border border-border-thin focus:border-emerald-500 rounded-lg p-2.5 pl-9 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 font-medium"
                                                                    />
                                                                    {isTeacherSearching && (
                                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-emerald-400 rounded-full"></div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {selectedTeacher && (
                                                                    <div className="mt-1.5 px-2.5 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-[9px] flex justify-between items-center font-mono text-emerald-400">
                                                                        <span>Docente: {selectedTeacher.nombre}</span>
                                                                        <span className="text-[7px] bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20 uppercase font-bold tracking-widest">Seleccionado</span>
                                                                    </div>
                                                                )}

                                                                {showTeacherResults && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-20" onClick={() => setShowTeacherResults(false)}></div>
                                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-40 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                                            {teacherSearchResults.length === 0 ? (
                                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                                    No se encontraron docentes con horas vigentes.
                                                                                </div>
                                                                            ) : (
                                                                                teacherSearchResults.map((teacher: any) => (
                                                                                    <button
                                                                                        key={teacher.cedula}
                                                                                        type="button"
                                                                                        onClick={() => handleSelectTeacher(teacher)}
                                                                                        className="w-full p-2.5 flex items-center justify-between hover:bg-surface-hover text-left text-xs transition-colors"
                                                                                    >
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-bold text-text-main text-xs uppercase">{teacher.nombre}</p>
                                                                                            <p className="text-text-dim font-mono text-[9px]">C.I. {teacher.cedula} | {teacher.email || 'S/D'}</p>
                                                                                        </div>
                                                                                        <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border bg-emerald-500/15 border-emerald-500/25 text-emerald-400">
                                                                                            Docente
                                                                                        </span>
                                                                                    </button>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                                <div className="col-span-8 space-y-1">
                                                                    <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                                                    <select
                                                                        value={teacherRol}
                                                                        onChange={(e) => setTeacherRol(e.target.value)}
                                                                        className="w-full bg-bg-deep border border-border-thin focus:border-emerald-500 rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                                                                    >
                                                                        <option value="Co-Investigador">Co-Investigador</option>
                                                                        <option value="Investigador Principal">Investigador Principal</option>
                                                                        <option value="Asesor Externo">Asesor Externo</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-span-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddTeacher}
                                                                        disabled={!selectedTeacher}
                                                                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-bg-deep font-bold px-3 py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                                                    >
                                                                        <Plus size={12} strokeWidth={3} />
                                                                        Vincular
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Teacher List */}
                                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                    {teachers.map((member) => (
                                                        <div
                                                            key={member.id_grupo_miembro}
                                                            className="p-3 bg-bg-deep/40 rounded-xl border border-border-thin hover:border-emerald-500/20 hover:bg-bg-deep/60 transition-all flex justify-between items-center group/member"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                                    <User size={14} />
                                                                </div>
                                                                <div className="min-w-0 space-y-0.5">
                                                                    <p className="text-xs font-extrabold text-text-main uppercase truncate max-w-[200px]" title={member.nombre_completo}>
                                                                        {member.nombre_completo}
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="text-[8px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                                            C.I. {member.cedula || 'S/D'}
                                                                        </span>
                                                                        <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                                            {member.rol}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {!isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                                    className="p-1.5 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-text-dim hover:text-red-500 opacity-0 group-hover/member:opacity-100 focus:opacity-100 transition-all shrink-0"
                                                                    title="Desvincular docente"
                                                                >
                                                                    <UserMinus size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {teachers.length === 0 && (
                                                        <div className="py-6 text-center bg-bg-deep/20 rounded-xl border border-dashed border-border-thin/60 space-y-1.5">
                                                            <Users size={16} className="mx-auto text-text-dim/30" />
                                                            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Sin docentes investigadores</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sector 2: Estudiantes Semilleristas */}
                                            <div className="space-y-4 p-5 rounded-2xl bg-bg-deep/20 border border-blue-500/10 backdrop-blur-sm relative overflow-hidden transition-all hover:border-blue-500/25">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

                                                <div className="flex justify-between items-center pb-2 border-b border-border-thin">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                                            <GraduationCap size={16} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-xs font-black text-text-main uppercase tracking-wider">Estudiantes Semilleristas</h4>
                                                            <p className="text-[10px] text-text-dim/80 font-bold uppercase tracking-tight">Alumnos matriculados en semillero</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                                                        {students.length} Activos
                                                    </span>
                                                </div>

                                                {/* Form to add student */}
                                                {!isReadOnly && (
                                                    <div className="space-y-3 p-3.5 bg-bg-deep/40 rounded-xl border border-border-thin">
                                                        <div className="grid grid-cols-1 gap-3">
                                                            <div className="relative space-y-1">
                                                                <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Buscador Estudiante</label>
                                                                <div className="relative">
                                                                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                                                                    <input
                                                                        type="text"
                                                                        value={studentSearchQuery}
                                                                        onChange={(e) => {
                                                                            setStudentSearchQuery(e.target.value);
                                                                            if (selectedStudent) {
                                                                                setSelectedStudent(null);
                                                                            }
                                                                        }}
                                                                        onFocus={() => setShowStudentResults(true)}
                                                                        placeholder="Buscar estudiante por nombre o cédula..."
                                                                        className="w-full bg-bg-deep border border-border-thin focus:border-blue-500 rounded-lg p-2.5 pl-9 text-xs text-text-main focus:outline-none transition-all placeholder:text-text-dim/50 font-medium"
                                                                    />
                                                                    {isStudentSearching && (
                                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                                            <div className="animate-spin h-3.5 w-3.5 border-2 border-t-transparent border-blue-400 rounded-full"></div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {selectedStudent && (
                                                                    <div className="mt-1.5 px-2.5 py-1 bg-blue-500/5 border border-blue-500/10 rounded-lg text-[9px] flex justify-between items-center font-mono text-blue-400">
                                                                        <span>Estudiante: {selectedStudent.nombre}</span>
                                                                        <span className="text-[7px] bg-blue-500/10 px-1 py-0.2 rounded border border-blue-500/20 uppercase font-bold tracking-widest">Seleccionado</span>
                                                                    </div>
                                                                )}

                                                                {showStudentResults && (
                                                                    <>
                                                                        <div className="fixed inset-0 z-20" onClick={() => setShowStudentResults(false)}></div>
                                                                        <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-xl shadow-2xl max-h-40 overflow-y-auto z-30 divide-y divide-[#222] backdrop-blur-md">
                                                                            {studentSearchResults.length === 0 ? (
                                                                                <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                                                                    No se encontraron estudiantes matriculados.
                                                                                </div>
                                                                            ) : (
                                                                                studentSearchResults.map((student: any) => (
                                                                                    <button
                                                                                        key={student.cedula}
                                                                                        type="button"
                                                                                        onClick={() => handleSelectStudent(student)}
                                                                                        className="w-full p-2.5 flex items-center justify-between hover:bg-surface-hover text-left text-xs transition-colors"
                                                                                    >
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-bold text-text-main text-xs uppercase">{student.nombre}</p>
                                                                                            <p className="text-text-dim font-mono text-[9px]">C.I. {student.cedula} | {student.email || 'S/D'}</p>
                                                                                        </div>
                                                                                        <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border bg-blue-500/15 border-blue-500/25 text-blue-400">
                                                                                            Estudiante
                                                                                        </span>
                                                                                    </button>
                                                                                ))
                                                                            )}
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <div className="grid grid-cols-12 gap-3 items-end">
                                                                <div className="col-span-8 space-y-1">
                                                                    <label className="text-[9px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                                                                    <select
                                                                        value={studentRol}
                                                                        onChange={(e) => setStudentRol(e.target.value)}
                                                                        className="w-full bg-bg-deep border border-border-thin focus:border-blue-500 rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                                                                    >
                                                                        <option value="Semillerista">Semillerista</option>
                                                                        <option value="Co-Investigador (Estudiante)">Co-Investigador (Estudiante)</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-span-4">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddStudent}
                                                                        disabled={!selectedStudent}
                                                                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-bg-deep font-bold px-3 py-2.5 rounded-lg text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                                                                    >
                                                                        <Plus size={12} strokeWidth={3} />
                                                                        Vincular
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Student List */}
                                                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                                    {students.map((member) => (
                                                        <div
                                                            key={member.id_grupo_miembro}
                                                            className="p-3 bg-bg-deep/40 rounded-xl border border-border-thin hover:border-blue-500/20 hover:bg-bg-deep/60 transition-all flex justify-between items-center group/member"
                                                        >
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                                    <GraduationCap size={14} />
                                                                </div>
                                                                <div className="min-w-0 space-y-0.5">
                                                                    <p className="text-xs font-extrabold text-text-main uppercase truncate max-w-[200px]" title={member.nombre_completo}>
                                                                        {member.nombre_completo}
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="text-[8px] font-mono text-text-dim font-bold uppercase tracking-wider bg-bg-deep px-1.5 py-0.5 rounded border border-border-thin">
                                                                            C.I. {member.cedula || 'S/D'}
                                                                        </span>
                                                                        <span className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                                            {member.rol}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {!isReadOnly && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                                                                    className="p-1.5 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-text-dim hover:text-red-500 opacity-0 group-hover/member:opacity-100 focus:opacity-100 transition-all shrink-0"
                                                                    title="Desvincular estudiante"
                                                                >
                                                                    <UserMinus size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {students.length === 0 && (
                                                        <div className="py-6 text-center bg-bg-deep/20 rounded-xl border border-dashed border-border-thin/60 space-y-1.5">
                                                            <GraduationCap size={16} className="mx-auto text-text-dim/30" />
                                                            <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest">Sin estudiantes vinculados</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                );
                            })() : null}

                            {/* Identity Statements */}
                            <section className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Objetivo General</label>
                                    <textarea
                                        rows={3}
                                        disabled={isReadOnly}
                                        value={formData.objetivo_general}
                                        onChange={(e) => setFormData({ ...formData, objetivo_general: e.target.value })}
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
                                            onChange={(e) => setFormData({ ...formData, mision: e.target.value })}
                                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Visión</label>
                                        <textarea
                                            rows={3}
                                            disabled={isReadOnly}
                                            value={formData.vision}
                                            onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
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
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                                } ${formData.carreras_ids.includes(career.id_carrera)
                                                    ? 'bg-blue-500/10 border-blue-500 text-blue-500'
                                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                                }`}
                                        >
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${formData.carreras_ids.includes(career.id_carrera) ? 'border-blue-500 bg-blue-500' : 'border-border-thin'
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
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'
                                                } ${formData.lineas_ids.includes(line.id)
                                                    ? 'bg-text-main/10 border-text-main text-text-main'
                                                    : 'bg-bg-deep/50 border-border-thin text-text-dim hover:border-text-dim/50'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.lineas_ids.includes(line.id) ? 'border-text-main bg-text-main' : 'border-border-thin'
                                                }`}>
                                                {formData.lineas_ids.includes(line.id) && <CheckCircle size={10} className="text-bg-deep" />}
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-tight">{line.nombre}</span>
                                        </div>
                                    ))}
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
                                        onChange={(e) => setFormData({ ...formData, resolucion_aprobacion: e.target.value })}
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
                                        disabled={isReadOnly || !isAdmin}
                                        value={formData.fecha_creacion}
                                        onChange={(e) => setFormData({ ...formData, fecha_creacion: e.target.value })}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </section>
                        </form>

                        <div className="modal-footer">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="btn-vercel-secondary"
                            >
                                {isReadOnly ? 'Cerrar' : 'Cancelar'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    onClick={handleSubmit}
                                    className="btn-vercel-primary flex items-center gap-2"
                                >
                                    {editingGroup ? 'Guardar Cambios' : 'Proponer Grupo'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Right-side Detail Drawer */}
            {detailGroup && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => {
                            setDetailGroup(null);
                            setDetailMembers([]);
                            setIsFieldModalOpen(false);
                            setActiveFieldKey(null);
                        }}
                    />

                    {/* Docked Side Panel for Field Feedback */}
                    {isFieldModalOpen && activeFieldKey && (
                        <div className="relative w-full max-w-[340px] h-full bg-surface border-r border-border-thin flex flex-col z-20 animate-fade-in shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden">
                            <div className="modal-header shrink-0 !py-3 !px-4 bg-bg-deep/40 border-b border-border-thin">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)] shrink-0">
                                        <MessageSquare size={14} />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[10px] font-black text-text-main uppercase tracking-tight truncate leading-none mb-1">Observación Contextual</h4>
                                        <p className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest truncate leading-none">{activeFieldName}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsFieldModalOpen(false);
                                        setActiveFieldKey(null);
                                        setAudioBlob(null);
                                        setAudioUrl('');
                                    }}
                                    className="p-1 hover:bg-surface-hover rounded-lg text-text-dim hover:text-text-main transition-colors shrink-0"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>

                            {/* List of comments for this field */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-deep/5 custom-scrollbar">
                                {(() => {
                                    const comments = getFieldComments(activeFieldKey);
                                    if (comments.length === 0) {
                                        return (
                                            <div className="text-center py-16 opacity-50 flex flex-col items-center justify-center h-full">
                                                <div className="p-3 bg-surface rounded-full border border-border-thin mb-3">
                                                    <MessageSquare size={18} className="text-text-dim" />
                                                </div>
                                                <p className="text-[9px] font-black text-text-main uppercase tracking-wider">Sin observaciones</p>
                                                <p className="text-[8px] text-text-dim mt-1 max-w-[180px] leading-relaxed uppercase font-mono text-center">
                                                    {isAdmin 
                                                        ? "Agregue observaciones por escrito o grabe explicaciones de voz sobre este campo."
                                                        : "No se han registrado observaciones en este campo."
                                                    }
                                                </p>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="space-y-3">
                                            {comments.map((c, i) => {
                                                const parsed = parseCommentContent(c.contenido);
                                                const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');
                                                
                                                return (
                                                    <div
                                                        key={c.idComentario || i}
                                                        className={`flex flex-col max-w-[90%] ${
                                                            isMsgFromAdmin ? 'mr-auto items-start' : 'ml-auto items-end'
                                                        } animate-fade-up`}
                                                    >
                                                        <div className="flex items-center gap-1.5 mb-0.5 px-1">
                                                            <span className={`text-[8px] font-black uppercase tracking-wider ${
                                                                isMsgFromAdmin ? 'text-amber-400' : 'text-emerald-400'
                                                            }`}>
                                                                {c.nombreUsuario}
                                                            </span>
                                                            <span className="text-[7px] text-text-dim font-mono">
                                                                {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>

                                                        <div className={`rounded-xl p-3 border shadow-sm select-text ${
                                                            isMsgFromAdmin
                                                                ? 'bg-surface border-amber-500/10 text-text-main rounded-tl-none'
                                                                : 'bg-text-main text-bg-deep border-transparent rounded-tr-none font-semibold'
                                                        }`}>
                                                            {parsed?.audioUrl && (
                                                                <div className="mb-2">
                                                                    <AudioBubblePlayer src={parsed.audioUrl} />
                                                                </div>
                                                            )}
                                                            {parsed?.text && (
                                                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{parsed.text}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Input area */}
                            <div className="p-3 bg-surface border-t border-border-thin space-y-3 shrink-0">
                                {isRecording ? (
                                    <div className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-xl p-2 animate-pulse">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                                            <span className="text-[8px] font-black uppercase text-red-400 tracking-wider font-mono">
                                                Grabando ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                            </span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={cancelRecording}
                                                className="px-1.5 py-0.5 hover:bg-surface border border-border-thin rounded text-[8px] font-bold uppercase tracking-widest text-text-dim transition-all"
                                            >
                                                x
                                            </button>
                                            <button
                                                type="button"
                                                onClick={stopRecording}
                                                className="px-2 py-0.5 bg-red-500 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md"
                                            >
                                                ok
                                            </button>
                                        </div>
                                    </div>
                                ) : audioUrl ? (
                                    <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-2 animate-fade-in">
                                        <div className="space-y-0.5 min-w-0 flex-1 mr-2">
                                            <span className="text-[7px] font-black uppercase text-emerald-400 tracking-widest block mb-1">Audio grabado</span>
                                            <AudioBubblePlayer src={audioUrl} />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                            className="px-1.5 py-0.5 hover:bg-red-500/10 rounded text-[8px] font-bold uppercase tracking-widest text-red-500 transition-all shrink-0"
                                        >
                                            Descartar
                                        </button>
                                    </div>
                                ) : null}

                                <div className="flex items-end gap-1.5 relative">
                                    <textarea
                                        value={newFeedbackText}
                                        onChange={(e) => setNewFeedbackText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendFieldFeedback(activeFieldKey, activeFieldName);
                                            }
                                        }}
                                        placeholder={isAdmin ? "Observación..." : "Responder..."}
                                        className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-2 pr-12 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-12 transition-all custom-scrollbar placeholder:text-text-dim/60 font-medium"
                                    />

                                    <div className="absolute right-1.5 bottom-1.5 flex gap-0.5">
                                        {!audioUrl && (
                                            <button
                                                type="button"
                                                onClick={startRecording}
                                                className="p-1 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                                title="Grabar Audio Explicativo"
                                            >
                                                <Mic size={12} />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            disabled={sendingFeedback || (!newFeedbackText.trim() && !audioBlob)}
                                            onClick={() => handleSendFieldFeedback(activeFieldKey, activeFieldName)}
                                            className="p-1 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
                                        >
                                            {sendingFeedback ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <Award size={20} />
                                </div>
                                <div
                                    id="field-container-siglas"
                                    className={`transition-all duration-500 rounded-lg px-2 py-1 ${
                                        highlightedField === 'siglas'
                                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                            : ''
                                    }`}
                                >
                                    <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">{detailGroup.nombre}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="section-label text-text-dim">
                                            {detailGroup.tipo_grupo === 'Semillero' ? 'Semillero' : 'Grupo de Investigación'} — {detailGroup.siglas || 'SIN_SIGLAS'}
                                        </p>
                                        {renderFieldFeedbackButton('siglas', 'Siglas del Grupo')}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => { setDetailGroup(null); setDetailMembers([]); }} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* Tab switcher for General Info vs Retroalimentación */}
                        <div className="flex border-b border-border-thin bg-surface-hover/20 shrink-0">
                            <button
                                onClick={() => setDetailTab('info')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 ${
                                    detailTab === 'info'
                                        ? 'border-text-main text-text-main bg-text-main/5'
                                        : 'border-transparent text-text-dim hover:text-text-main'
                                }`}
                            >
                                <Award size={13} />
                                <span>Información General</span>
                            </button>
                            <button
                                onClick={() => setDetailTab('feedback')}
                                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 relative ${
                                    detailTab === 'feedback'
                                        ? 'border-text-main text-text-main bg-text-main/5'
                                        : 'border-transparent text-text-dim hover:text-text-main'
                                }`}
                            >
                                <MessageSquare size={13} />
                                <span>Canal de Retroalimentación</span>
                                {detailGroup.estado === 'Pendiente' && (
                                    <span className="absolute top-2.5 right-4 w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                                )}
                            </button>
                        </div>

                        {detailTab === 'info' ? (
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Status & Type & Consolidation */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">
                                            <Shield size={12} /> Estado
                                        </label>
                                        {(!detailGroup.estado || detailGroup.estado === 'Aprobado') && (
                                            <span className="badge-vercel badge-vercel-success">
                                                <CheckCircle size={10} /> Aprobado
                                            </span>
                                        )}
                                        {detailGroup.estado === 'Pendiente' && (
                                            <span className="badge-vercel badge-vercel-warning">
                                                <Calendar size={10} /> Pendiente
                                            </span>
                                        )}
                                        {detailGroup.estado === 'Rechazado' && (
                                            <span className="badge-vercel badge-vercel-error">
                                                <XCircle size={10} /> Rechazado
                                            </span>
                                        )}
                                        <p className={`text-[8px] font-mono tracking-wider uppercase mt-1 ${detailGroup.activo ? 'text-success' : 'text-text-dim/60'}`}>
                                            ● {detailGroup.activo ? 'Vigente' : 'Inactivo'}
                                        </p>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">
                                            <Award size={12} /> Tipo
                                        </label>
                                        <span className="badge-vercel badge-vercel-brand">
                                            {detailGroup.tipo_grupo || 'Investigación'}
                                        </span>
                                    </div>
                                    <div className="bento-card static p-4">
                                        <label className="section-label text-text-dim mb-2">
                                            <Target size={12} /> Consolidación
                                        </label>
                                        <span className={`badge-vercel border text-center ${
                                            detailGroup.categoria_consolidacion === 'Consolidado'
                                                ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
                                                : 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                        }`}>
                                            {detailGroup.categoria_consolidacion || 'En Formación'}
                                        </span>
                                    </div>
                                </div>

                                {/* Coordinator */}
                                <div 
                                    id="field-container-coordinador"
                                    className={`bento-card static p-4 space-y-3 transition-all duration-500 ${
                                        highlightedField === 'coordinador'
                                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse'
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <label className="section-label text-text-main flex items-center gap-1.5">
                                            <User size={12} /> Coordinador Responsable
                                        </label>
                                        {renderFieldFeedbackButton('coordinador', 'Coordinador Responsable')}
                                    </div>
                                    <div className="divider-vercel !my-0" />
                                    <p className="text-sm font-bold text-text-main uppercase">{detailGroup.nombre_coordinador || 'No asignado'}</p>
                                    {detailGroup.id_profesor_coordinador && (
                                        <p className="text-[10px] font-mono text-text-dim">C.I. {detailGroup.id_profesor_coordinador}</p>
                                    )}
                                </div>

                                {/* Domain */}
                                {detailGroup.id_dominio && (
                                    <div className="bento-card static p-4 space-y-3">
                                        <label className="section-label text-text-main">
                                            <Target size={12} /> Dominio Académico
                                        </label>
                                        <div className="divider-vercel !my-0" />
                                        <p className="text-sm font-bold text-text-main">
                                            {dominios.find(d => d.id_dominio === detailGroup.id_dominio)?.nombre || 'Sin dominio'}
                                        </p>
                                    </div>
                                )}

                                {/* Identity Statements */}
                                <div className="bento-card static p-4 space-y-4">
                                    <label className="section-label text-text-main flex items-center gap-1.5">
                                        <BookOpen size={12} /> Identidad Institucional
                                    </label>
                                    <div className="divider-vercel !my-0" />
                                    {detailGroup.objetivo_general && (
                                        <div 
                                            id="field-container-objetivo"
                                            className={`p-3.5 rounded-xl transition-all duration-500 space-y-1 ${
                                                highlightedField === 'objetivo' 
                                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' 
                                                    : 'bg-bg-deep/10 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="section-label text-text-dim mb-1">Objetivo General</p>
                                                {renderFieldFeedbackButton('objetivo', 'Objetivo General')}
                                            </div>
                                            <p className="text-sm text-text-main leading-relaxed">{detailGroup.objetivo_general}</p>
                                        </div>
                                    )}
                                    {detailGroup.mision && (
                                        <div 
                                            id="field-container-mision"
                                            className={`p-3.5 rounded-xl transition-all duration-500 space-y-1 ${
                                                highlightedField === 'mision' 
                                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' 
                                                    : 'bg-bg-deep/10 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="section-label text-text-dim mb-1">Misión</p>
                                                {renderFieldFeedbackButton('mision', 'Misión')}
                                            </div>
                                            <p className="text-sm text-text-main leading-relaxed">{detailGroup.mision}</p>
                                        </div>
                                    )}
                                    {detailGroup.vision && (
                                        <div 
                                            id="field-container-vision"
                                            className={`p-3.5 rounded-xl transition-all duration-500 space-y-1 ${
                                                highlightedField === 'vision' 
                                                    ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' 
                                                    : 'bg-bg-deep/10 border border-transparent'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className="section-label text-text-dim mb-1">Visión</p>
                                                {renderFieldFeedbackButton('vision', 'Visión')}
                                            </div>
                                            <p className="text-sm text-text-main leading-relaxed">{detailGroup.vision}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Resolution & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    {detailGroup.resolucion_aprobacion && (
                                        <div className="bento-card static p-4">
                                            <label className="section-label text-text-dim mb-2">
                                                <FileText size={12} /> Resolución
                                            </label>
                                            <p className="text-sm font-bold text-text-main font-mono">{detailGroup.resolucion_aprobacion}</p>
                                        </div>
                                    )}
                                    {detailGroup.fecha_creacion && (
                                        <div className="bento-card static p-4">
                                            <label className="section-label text-text-dim mb-2">
                                                <Calendar size={12} /> Fecha de Creación
                                            </label>
                                            <p className="text-sm font-bold text-text-main font-mono">{new Date(detailGroup.fecha_creacion).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Research Lines */}
                                {detailGroup.lineas_ids && detailGroup.lineas_ids.length > 0 && (
                                    <div 
                                        id="field-container-lineas"
                                        className={`bento-card static p-4 space-y-3 transition-all duration-500 ${
                                            highlightedField === 'lineas' 
                                                ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' 
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="section-label text-text-main flex items-center gap-1.5">
                                                <BookOpen size={12} /> Líneas de Investigación
                                            </label>
                                            {renderFieldFeedbackButton('lineas', 'Líneas de Investigación')}
                                        </div>
                                        <div className="divider-vercel !my-0" />
                                        <div className="flex flex-wrap gap-2">
                                            {detailGroup.lineas_ids.map(lineId => {
                                                const line = lines.find(l => l.id === lineId);
                                                return line ? (
                                                    <span key={lineId} className="badge-vercel badge-vercel-brand">{line.nombre}</span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Careers */}
                                {detailGroup.carreras_ids && detailGroup.carreras_ids.length > 0 && (
                                    <div 
                                        id="field-container-carreras"
                                        className={`bento-card static p-4 space-y-3 transition-all duration-500 ${
                                            highlightedField === 'carreras' 
                                                ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' 
                                                : ''
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <label className="section-label text-text-main flex items-center gap-1.5">
                                                <GraduationCap size={12} /> Carreras / Programas
                                            </label>
                                            {renderFieldFeedbackButton('carreras', 'Carreras / Programas')}
                                        </div>
                                        <div className="divider-vercel !my-0" />
                                        <div className="flex flex-wrap gap-2">
                                            {detailGroup.carreras_ids.map(carrId => {
                                                const career = carreras.find(c => c.id_carrera === carrId);
                                                return career ? (
                                                    <span key={carrId} className="badge-vercel badge-vercel-info">{career.carrera1}</span>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Members */}
                                <div 
                                    id="field-container-integrantes"
                                    className={`bento-card static p-4 space-y-4 transition-all duration-500 ${
                                        highlightedField === 'integrantes' 
                                            ? 'ring-2 ring-amber-500/80 bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse' 
                                            : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between pb-2 border-b border-border-thin">
                                        <label className="section-label text-text-main flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px]">
                                            <Users size={12} /> Integrantes del Grupo
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                {detailMembers.length} activos
                                            </span>
                                            {renderFieldFeedbackButton('integrantes', 'Integrantes del Grupo')}
                                        </div>
                                    </div>

                                    {detailMembers.length > 0 ? (() => {
                                        const teachers = detailMembers.filter(member => {
                                            const rolLower = (member.rol || '').toLowerCase();
                                            return !rolLower.includes('semillerista') && !rolLower.includes('estudiante');
                                        });

                                        const students = detailMembers.filter(member => {
                                            const rolLower = (member.rol || '').toLowerCase();
                                            return rolLower.includes('semillerista') || rolLower.includes('estudiante');
                                        });

                                        return (
                                            <div className="space-y-4">
                                                {/* Docentes */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
                                                        <User size={10} />
                                                        <span>Docentes Investigadores ({teachers.length})</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {teachers.map(member => (
                                                            <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-emerald-500/10">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                                                                        <User size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-text-main uppercase truncate" title={member.nombre_completo}>{member.nombre_completo}</p>
                                                                        <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                                                            {member.rol}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {member.cedula && (
                                                                    <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {teachers.length === 0 && (
                                                            <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin docentes investigadores</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Estudiantes */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-blue-400">
                                                        <GraduationCap size={10} />
                                                        <span>Estudiantes Semilleristas ({students.length})</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        {students.map(member => (
                                                            <div key={member.id_grupo_miembro} className="flex items-center justify-between p-2.5 bg-bg-deep/40 rounded-lg border border-blue-500/10">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                                                                        <GraduationCap size={14} />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-bold text-text-main uppercase truncate" title={member.nombre_completo}>{member.nombre_completo}</p>
                                                                        <span className="text-[8px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                                                            {member.rol}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {member.cedula && (
                                                                    <span className="text-[9px] font-mono text-text-dim">C.I. {member.cedula}</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {students.length === 0 && (
                                                            <p className="text-[9px] text-text-dim font-bold uppercase py-2 text-center bg-bg-deep/10 border border-dashed border-border-thin rounded-lg">Sin estudiantes semilleristas</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })() : (
                                        <div className="py-6 text-center">
                                            <Users size={20} className="mx-auto text-text-dim/30 mb-2" />
                                            <p className="text-[10px] text-text-dim font-medium uppercase tracking-widest">Sin integrantes registrados</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col overflow-hidden bg-bg-deep/10 h-full">
                                {/* Hilo de Observaciones */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                                    {loadingFeedback ? (
                                        <div className="flex flex-col items-center justify-center gap-2 py-10 opacity-70 h-full">
                                            <Loader2 size={24} className="animate-spin text-text-main" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-text-dim">Cargando buzón oficial...</span>
                                        </div>
                                    ) : feedbackComments.length === 0 ? (
                                        <div className="text-center py-20 opacity-50 flex flex-col items-center justify-center h-full">
                                            <div className="p-4 bg-surface rounded-full border border-border-thin mb-4">
                                                <MessageSquare size={24} className="text-text-dim" />
                                            </div>
                                            <p className="text-[10px] font-black text-text-dim uppercase tracking-wider">Sin observaciones registradas</p>
                                            <p className="text-[9px] text-text-dim/80 mt-1 max-w-[220px] leading-relaxed uppercase font-mono text-center">
                                                No hay historial en el canal. El evaluador y el equipo pueden iniciar la comunicación aquí.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {feedbackComments.map((c, i) => {
                                                let isAudio = false;
                                                let audioData = null;
                                                let isFieldFeedback = false;
                                                let fieldFeedbackData = null;
                                                try {
                                                    if (c.contenido.startsWith('{')) {
                                                        const parsed = JSON.parse(c.contenido);
                                                        if (parsed.type === 'field_feedback') {
                                                            isFieldFeedback = true;
                                                            fieldFeedbackData = parsed;
                                                        } else if (parsed.type === 'audio') {
                                                            isAudio = true;
                                                            audioData = parsed;
                                                        }
                                                    }
                                                } catch (e) {}

                                                const isMsgFromAdmin = c.usuarioUuid === 'admin' || c.nombreUsuario.toLowerCase().includes('admin') || c.nombreUsuario.toLowerCase().includes('director');

                                                if (isFieldFeedback && fieldFeedbackData) {
                                                    return (
                                                        <div 
                                                            key={c.idComentario || i} 
                                                            className={`flex flex-col w-full max-w-[90%] ${
                                                                isMsgFromAdmin ? 'mr-auto items-start' : 'ml-auto items-end'
                                                            } animate-fade-up`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                                <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                                    isMsgFromAdmin ? 'text-amber-400' : 'text-emerald-400'
                                                                }`}>
                                                                    {c.nombreUsuario} (Retroalimentación de Campo)
                                                                </span>
                                                                <span className="text-[8px] text-text-dim font-mono">
                                                                    {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>

                                                            <div className={`rounded-2xl p-4 border shadow-sm w-full select-text transition-all duration-300 ${
                                                                isMsgFromAdmin
                                                                    ? 'bg-amber-500/5 border-amber-500/20 text-text-main rounded-tl-none hover:border-amber-500/40 shadow-amber-500/5'
                                                                    : 'bg-emerald-500/5 border-emerald-500/20 text-text-main rounded-tr-none hover:border-emerald-500/40 shadow-emerald-500/5'
                                                            }`}>
                                                                <div className="flex items-center justify-between border-b border-border-thin/20 pb-2 mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <AlertTriangle size={12} className={isMsgFromAdmin ? 'text-amber-400' : 'text-emerald-400'} />
                                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                                            isMsgFromAdmin ? 'text-amber-400' : 'text-emerald-400'
                                                                        }`}>
                                                                            Observación: {fieldFeedbackData.fieldName || fieldFeedbackData.field}
                                                                        </span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => {
                                                                            setDetailTab('info');
                                                                            setHighlightedField(fieldFeedbackData.field);
                                                                            setTimeout(() => {
                                                                                const element = document.getElementById(`field-container-${fieldFeedbackData.field}`);
                                                                                if (element) {
                                                                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                }
                                                                            }, 300);
                                                                            setTimeout(() => {
                                                                                setHighlightedField(null);
                                                                            }, 3500);
                                                                        }}
                                                                        className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border transition-all active:scale-95 ${
                                                                            isMsgFromAdmin 
                                                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                                                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                                                        }`}
                                                                    >
                                                                        <span>Ver Sección</span>
                                                                        <ChevronRight size={10} />
                                                                    </button>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {fieldFeedbackData.audioUrl && (
                                                                        <div className="py-1">
                                                                            <AudioBubblePlayer src={fieldFeedbackData.audioUrl} />
                                                                        </div>
                                                                    )}
                                                                    {fieldFeedbackData.text && (
                                                                        <p className="text-xs leading-relaxed font-medium">
                                                                            {fieldFeedbackData.text}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div 
                                                        key={c.idComentario || i} 
                                                        className={`flex flex-col max-w-[85%] ${
                                                            isMsgFromAdmin ? 'mr-auto items-start' : 'ml-auto items-end'
                                                        } animate-fade-up`}
                                                    >
                                                        <div className="flex items-center gap-2 mb-1 px-1">
                                                            <span className={`text-[9px] font-black uppercase tracking-wider ${
                                                                isMsgFromAdmin ? 'text-amber-400' : 'text-emerald-400'
                                                            }`}>
                                                                {c.nombreUsuario}
                                                            </span>
                                                            <span className="text-[8px] text-text-dim font-mono">
                                                                {new Date(c.creadoEn).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className={`rounded-2xl p-4 border shadow-sm select-text ${
                                                            isMsgFromAdmin
                                                                ? 'bg-surface border-amber-500/10 text-text-main rounded-tl-none'
                                                                : 'bg-text-main text-bg-deep border-transparent rounded-tr-none font-semibold'
                                                        }`}>
                                                            {isAudio && audioData ? (
                                                                <div className="space-y-2">
                                                                    <AudioBubblePlayer src={audioData.audioUrl} />
                                                                    {audioData.text && (
                                                                        <p className="text-xs leading-relaxed mt-2 italic border-t border-border-thin/20 pt-2 font-medium">
                                                                            "{audioData.text}"
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs leading-relaxed whitespace-pre-wrap">{c.contenido}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Formulario de Respuesta / Mensaje */}
                                <div className="p-4 bg-surface border-t border-border-thin space-y-3 shrink-0">
                                    {isRecording ? (
                                        <div className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-xl p-3 animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                                                <span className="text-[9px] font-black uppercase text-red-400 tracking-wider font-mono">
                                                    Grabando audio ({Math.floor(recordingTime / 60)}:{(recordingTime % 60) < 10 ? '0' : ''}{recordingTime % 60})
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={cancelRecording}
                                                    className="px-2.5 py-1.5 hover:bg-surface border border-border-thin rounded-lg text-[8px] font-bold uppercase tracking-widest text-text-dim transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all shadow-md"
                                                >
                                                    Detener
                                                </button>
                                            </div>
                                        </div>
                                    ) : audioUrl ? (
                                        <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 animate-fade-in">
                                            <div className="space-y-1">
                                                <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest block mb-1">Audio grabado listo</span>
                                                <AudioBubblePlayer src={audioUrl} />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                                className="px-2.5 py-1.5 hover:bg-red-500/10 rounded-lg text-[8px] font-bold uppercase tracking-widest text-red-500 transition-all"
                                            >
                                                Descartar
                                            </button>
                                        </div>
                                    ) : null}

                                    <div className="flex items-end gap-2 relative">
                                        <textarea
                                            value={newFeedbackText}
                                            onChange={(e) => setNewFeedbackText(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendFeedbackMessage(detailGroup.uuid);
                                                }
                                            }}
                                            placeholder="Escribe un mensaje oficial..."
                                            className="flex-1 bg-bg-deep border border-border-thin rounded-xl p-3 pr-20 text-xs focus:outline-none focus:border-text-main outline-none resize-none h-16 transition-all custom-scrollbar placeholder:text-text-dim/60 font-medium"
                                        />
                                        
                                        <div className="absolute right-2 bottom-2 flex gap-1.5">
                                            {isAdmin && !audioUrl && (
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="p-2 text-text-dim hover:text-red-500 hover:bg-red-500/5 rounded-lg active:scale-95 transition-all"
                                                    title="Grabar Audio Explicativo"
                                                >
                                                    <Mic size={16} />
                                                </button>
                                            )}
                                            
                                            <button
                                                type="button"
                                                disabled={sendingFeedback || (!newFeedbackText.trim() && !audioBlob)}
                                                onClick={() => handleSendFeedbackMessage(detailGroup.uuid)}
                                                className="p-2 bg-text-main hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed text-bg-deep rounded-lg active:scale-95 transition-all shadow-md flex items-center justify-center shrink-0"
                                            >
                                                {sendingFeedback ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-footer shrink-0">
                            <button onClick={() => { setDetailGroup(null); setDetailMembers([]); }} className="btn-vercel-secondary">Cerrar</button>
                            {(isAdmin || (detailGroup.id_profesor_coordinador === user?.id_referencia && detailGroup.estado !== 'Pendiente' && detailGroup.estado !== 'Aprobado')) && (
                                <button
                                    onClick={() => { handleOpenModal(detailGroup, false); setDetailGroup(null); setDetailMembers([]); }}
                                    className="btn-vercel-brand flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> Editar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                <div className="modal-overlay">
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
        </main>
    );
};

export default GroupsPage;
