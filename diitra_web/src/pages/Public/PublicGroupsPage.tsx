import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    Search, Users, ArrowLeft, Layers, Loader2,
    ChevronRight, ArrowRight, Activity, Trash, Camera,
    Calendar, BookOpen, Mail, FileText
} from 'lucide-react';
import api from '../../api/axios_config';
import Header from '../Landing/components/Header';
import Footer from '../Landing/components/Footer';
import { useAuth } from '../../api/AuthContext';

// ─── Types ───────────────────────────────────────────────────────

interface Member {
    idGrupoMiembro: number;
    idUsuario: number;
    nombreCompleto: string;
    rol: string;
    activo: boolean;
    carrera?: string;
    orcidId?: string;
    scopusId?: string;
    googleScholarUrl?: string;
    researchGateUrl?: string;
    especialidad?: string;
    gradoAcademicoMaximo?: string;
}

interface Project {
    uuid: string;
    titulo: string;
    estado: string;
    codigoInstitucional?: string;
    directorNombre?: string;
}

interface Group {
    idGrupo: number;
    uuid: string;
    nombre: string;
    siglas: string;
    tipoGrupo: string;
    nombreCoordinador?: string;
    carreraCoordinador?: string;
    objetivoGeneral?: string;
    mision?: string;
    vision?: string;
    resolucionAprobacion?: string;
    fechaCreacion?: string;
    categoriaConsolidacion?: string;
    lineasNombres?: string[];
    carrerasNombres?: string[];
    miembros?: Member[];
    proyectos?: Project[];
    fotoUrl?: string;
    idCoordinador?: number;
    idProfesorCoordinador?: string;
    idDominio?: number;
    linkWhatsapp?: string;
    telefonoCoordinador?: string;
    lineasIds?: number[];
    carrerasIds?: number[];
}

interface PublicGroupsPageProps {
    currentTheme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────

const formatNombre = (nombre?: string) => {
    if (!nombre) return 'No asignado';
    return nombre.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
};

const formatFecha = (fechaStr?: string) => {
    if (!fechaStr) return 'N/A';
    try {
        const cleanFecha = fechaStr.split('T')[0];
        const [year, month, day] = cleanFecha.split('-');
        return `${day}/${month}/${year}`;
    } catch { return fechaStr; }
};

const estadoColor = (estado: string) => {
    const l = estado.toLowerCase();
    if (l === 'aprobado' || l === 'completado') return 'text-success';
    if (l === 'en ejecución' || l === 'en progreso') return 'text-warning';
    return 'text-text-dim';
};

// ─── Main ─────────────────────────────────────────────────────────

const PublicGroupsPage: React.FC<PublicGroupsPageProps> = ({
    currentTheme = 'dark',
    toggleTheme = () => { }
}) => {
    const { uuid } = useParams<{ uuid?: string }>();
    const navigate = useNavigate();

    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [fetchedUuid, setFetchedUuid] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('todos');
    const [selectedCarrera, setSelectedCarrera] = useState('todas');

    // Estados interactivos estilo Landing Page (para mockups y paneles dinámicos)
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<number>(1);
    const [selectedProjectUuid, setSelectedProjectUuid] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

    const { user, isAdmin, isAuthenticated } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

    // Auto-inicializar las sub-selecciones de los paneles interactivos al cargar el grupo
    useEffect(() => {
        if (selectedGroup) {
            if (selectedGroup.proyectos && selectedGroup.proyectos.length > 0) {
                setSelectedProjectUuid(selectedGroup.proyectos[0].uuid);
            } else {
                setSelectedProjectUuid(null);
            }
            // Estado inicial vacío de miembro para la laptop de perfil
            setSelectedMemberId(null);
            setActiveWorkspaceTab(1);
        }
    }, [selectedGroup]);

    // Referencias y sincronización de scroll para la sección interactiva del editor y miembros
    const workspaceCardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const memberCardRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        if (!uuid || !selectedGroup) return;

        const handleScroll = () => {
            const viewportHeight = window.innerHeight;
            const center = viewportHeight / 2;

            // 1. Sincronización del Editor
            let closestWorkspaceIndex = 0;
            let closestWorkspaceDistance = Infinity;
            for (let idx = 0; idx < 5; idx++) {
                const ref = workspaceCardRefs.current[idx];
                if (ref) {
                    const rect = ref.getBoundingClientRect();
                    const cardCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(cardCenter - center);

                    if (distance < closestWorkspaceDistance) {
                        closestWorkspaceDistance = distance;
                        closestWorkspaceIndex = idx;
                    }
                }
            }
            setActiveWorkspaceTab(closestWorkspaceIndex + 1);

            // 2. Sincronización de Investigadores (Miembros)
            if (selectedGroup.miembros && selectedGroup.miembros.length > 0) {
                let closestMemberIndex = -1; // -1 indica que estamos en la cabecera (ningún miembro seleccionado)
                let closestMemberDistance = Infinity;

                // Medir la distancia de la cabecera general al centro de la pantalla
                const headerRef = document.getElementById('investigadores-header');
                if (headerRef) {
                    const rect = headerRef.getBoundingClientRect();
                    const headerCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(headerCenter - center);
                    if (distance < closestMemberDistance) {
                        closestMemberDistance = distance;
                        closestMemberIndex = -1;
                    }
                }

                selectedGroup.miembros.forEach((_, idx) => {
                    const ref = memberCardRefs.current[idx];
                    if (ref) {
                        const rect = ref.getBoundingClientRect();
                        const cardCenter = rect.top + rect.height / 2;
                        const distance = Math.abs(cardCenter - center);

                        if (distance < closestMemberDistance) {
                            closestMemberDistance = distance;
                            closestMemberIndex = idx;
                        }
                    }
                });

                if (closestMemberIndex === -1) {
                    setSelectedMemberId(null);
                } else {
                    const activeRef = memberCardRefs.current[closestMemberIndex];
                    if (activeRef) {
                        const rect = activeRef.getBoundingClientRect();
                        // Solo actualizamos si la sección está visible en pantalla
                        if (rect.top < viewportHeight && rect.bottom > 0) {
                            setSelectedMemberId(selectedGroup.miembros[closestMemberIndex].idGrupoMiembro);
                        }
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [uuid, selectedGroup]);

    const handleWorkspaceTabClick = (tabId: number) => {
        setActiveWorkspaceTab(tabId);
        const targetRef = workspaceCardRefs.current[tabId - 1];
        if (targetRef) {
            targetRef.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const handleMemberCardClick = (memberId: number, idx: number) => {
        setSelectedMemberId(memberId);
        const targetRef = memberCardRefs.current[idx];
        if (targetRef) {
            targetRef.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    const canEdit = isAuthenticated && (
        isAdmin ||
        (user && selectedGroup && (
            user.id_usuario === selectedGroup.idCoordinador ||
            user.id_referencia === selectedGroup.idProfesorCoordinador
        ))
    );

    const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedGroup) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await api.post('/collaboration/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const newUrl = uploadRes.data.url;

            const currentPhotos = selectedGroup.fotoUrl ? selectedGroup.fotoUrl.split(',') : [];
            const updatedPhotos = [...currentPhotos, newUrl].join(',');

            const payload = {
                nombre: selectedGroup.nombre,
                siglas: selectedGroup.siglas,
                tipo_grupo: selectedGroup.tipoGrupo,
                id_dominio: selectedGroup.idDominio,
                id_coordinador: selectedGroup.idCoordinador,
                id_profesor_coordinador: selectedGroup.idProfesorCoordinador,
                objetivo_general: selectedGroup.objetivoGeneral,
                mision: selectedGroup.mision,
                vision: selectedGroup.vision,
                resolucion_aprobacion: selectedGroup.resolucionAprobacion,
                fecha_creacion: selectedGroup.fechaCreacion,
                categoria_consolidacion: selectedGroup.categoriaConsolidacion,
                link_whatsapp: selectedGroup.linkWhatsapp,
                telefono_coordinador: selectedGroup.telefonoCoordinador,
                lineas_ids: selectedGroup.lineasIds || [],
                carreras_ids: selectedGroup.carrerasIds || [],
                foto_url: updatedPhotos
            };

            await api.put(`/groups/${selectedGroup.uuid}`, payload);
            setSelectedGroup(prev => prev ? { ...prev, fotoUrl: updatedPhotos } : null);
        } catch (error) {
            console.error('Error al subir fotografía:', error);
            alert('No se pudo subir la fotografía.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeletePhoto = async (photoUrlToDelete: string) => {
        if (!selectedGroup) return;
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta fotografía de la galería?')) return;

        setUploading(true);
        try {
            const currentPhotos = selectedGroup.fotoUrl ? selectedGroup.fotoUrl.split(',') : [];
            const updatedPhotos = currentPhotos.filter(url => url !== photoUrlToDelete).join(',');

            const payload = {
                nombre: selectedGroup.nombre,
                siglas: selectedGroup.siglas,
                tipo_grupo: selectedGroup.tipoGrupo,
                id_dominio: selectedGroup.idDominio,
                id_coordinador: selectedGroup.idCoordinador,
                id_profesor_coordinador: selectedGroup.idProfesorCoordinador,
                objetivo_general: selectedGroup.objetivoGeneral,
                mision: selectedGroup.mision,
                vision: selectedGroup.vision,
                resolucion_aprobacion: selectedGroup.resolucionAprobacion,
                fecha_creacion: selectedGroup.fechaCreacion,
                categoria_consolidacion: selectedGroup.categoriaConsolidacion,
                link_whatsapp: selectedGroup.linkWhatsapp,
                telefono_coordinador: selectedGroup.telefonoCoordinador,
                lineas_ids: selectedGroup.lineasIds || [],
                carreras_ids: selectedGroup.carrerasIds || [],
                foto_url: updatedPhotos
            };

            await api.put(`/groups/${selectedGroup.uuid}`, payload);
            setSelectedGroup(prev => prev ? { ...prev, fotoUrl: updatedPhotos } : null);
        } catch (error) {
            console.error('Error al eliminar fotografía:', error);
            alert('No se pudo eliminar la fotografía.');
        } finally {
            setUploading(false);
        }
    };

    const heroRef = useRef<HTMLDivElement>(null);

    const handleHeroMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!heroRef.current) return;
        const rect = heroRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        heroRef.current.style.setProperty('--mouse-x', `${x}px`);
        heroRef.current.style.setProperty('--mouse-y', `${y}px`);
    }, []);

    const fetchGroups = async (search?: string) => {
        setLoading(true);
        try {
            const url = search ? `/groups/public?search=${encodeURIComponent(search)}` : '/groups/public';
            const res = await api.get(url);
            setGroups(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupDetail = async (id: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/groups/public/${id}`);
            setSelectedGroup(res.data || null);
            setFetchedUuid(id);
        } catch (e) {
            console.error(e);
            setSelectedGroup(null);
            setFetchedUuid(id);
        } finally {
            setLoading(false);
        }
    };

    // Cargar detalle del grupo
    useEffect(() => {
        window.scrollTo(0, 0);
        if (uuid) {
            fetchGroupDetail(uuid);
        } else {
            setSelectedGroup(null);
            setFetchedUuid(null);
        }
    }, [uuid]);

    // Buscar grupos del catálogo (debounced)
    useEffect(() => {
        if (uuid) return;
        const t = setTimeout(() => {
            fetchGroups(searchQuery);
        }, 200);
        return () => clearTimeout(t);
    }, [searchQuery, uuid]);

    const uniqueCarreras = Array.from(
        new Set(groups.flatMap(g => g.carrerasNombres || []))
    ).filter(Boolean).sort();

    const filteredGroups = groups.filter(g => {
        const q = searchQuery.toLowerCase();
        const match = g.nombre.toLowerCase().includes(q) ||
            (g.siglas?.toLowerCase().includes(q)) ||
            (g.lineasNombres?.some(l => l.toLowerCase().includes(q)));

        const matchesType = selectedType === 'todos' || g.tipoGrupo.toLowerCase() === selectedType.toLowerCase();
        const matchesCarrera = selectedCarrera === 'todas' || g.carrerasNombres?.includes(selectedCarrera);

        return match && matchesType && matchesCarrera;
    });

    const totalMiembros = groups.reduce((acc, g) => acc + (g.miembros?.length || 0), 0);
    const totalProyectos = groups.reduce((acc, g) => acc + (g.proyectos?.length || 0), 0);

    const lineasStats = (() => {
        const statsMap: { [key: string]: { groupsCount: number, projectsCount: number } } = {};
        groups.forEach(g => {
            (g.lineasNombres || []).forEach(linea => {
                if (!statsMap[linea]) {
                    statsMap[linea] = { groupsCount: 0, projectsCount: 0 };
                }
                statsMap[linea].groupsCount += 1;
                statsMap[linea].projectsCount += (g.proyectos?.length || 0);
            });
        });
        return Object.entries(statsMap)
            .map(([nombre, data]) => ({ nombre, ...data }))
            .sort((a, b) => b.projectsCount - a.projectsCount)
            .slice(0, 4);
    })();

    // ── Determinación de Contenido ──────────────────────────────────
    const isDetailRoute = !!uuid;
    const isDetailLoaded = isDetailRoute && fetchedUuid === uuid;

    let mainContent;

    if (isDetailRoute && (loading || !isDetailLoaded)) {
        mainContent = (
            <main className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
                <Loader2 className="animate-spin text-text-dim/60" size={20} />
            </main>
        );
    } else if (isDetailRoute && isDetailLoaded && !selectedGroup) {
        mainContent = (
            <main className="flex-1 max-w-7xl mx-auto px-6 pt-40 pb-40 text-center min-h-[60vh]">
                <h2 className="text-2xl font-bold mb-3 tracking-tight">Grupo no encontrado</h2>
                <p className="text-text-dim text-xs mb-8">El grupo solicitado no existe o no está disponible públicamente.</p>
                <button onClick={() => navigate('/grupos-investigacion')}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border-thin text-xs font-medium text-text-dim hover:text-text-main transition-colors">
                    <ArrowLeft size={12} /> Volver
                </button>
            </main>
        );
    } else if (uuid && selectedGroup) {
        const miembrosCount = selectedGroup.miembros?.length || 0;
        const proyectosCount = selectedGroup.proyectos?.length || 0;
        const emailContacto = selectedGroup.nombreCoordinador
            ? `${selectedGroup.nombreCoordinador.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ".")}@istpet.edu.ec`
            : "investigacion@istpet.edu.ec";

        mainContent = (
            <main className="max-w-7xl mx-auto px-6 pt-24 pb-24">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 mb-8 animate-fade-up text-xs lg:-ml-24">
                    <button onClick={() => navigate('/grupos-investigacion')}
                        className="flex items-center gap-1.5 text-text-dim hover:text-text-main transition-colors group">
                        <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                        Grupos de Investigación
                    </button>
                    <span className="text-text-dim/30">/</span>
                    <span className="text-text-main/80 font-medium">{selectedGroup.siglas || selectedGroup.nombre}</span>
                </div>

                {/* Cabecera / Hero del Grupo */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-16 animate-fade-up lg:-ml-24 lg:-mr-24">
                    {/* Izquierda (lg:col-span-7): Título y Métricas KPIs */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="space-y-4">
                            <p className="text-[10px] font-mono text-brand uppercase tracking-widest">{selectedGroup.tipoGrupo}</p>
                            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-main leading-[0.95] max-w-2xl">
                                {selectedGroup.nombre}
                            </h1>
                        </div>

                        {/* Fila de Métricas / KPIs */}
                        <div className="flex flex-wrap gap-8 pt-4 border-t border-border-thin/30 select-none">
                            <div className="flex flex-col">
                                <span className="text-3xl font-extrabold text-text-main tracking-tight">{miembrosCount}</span>
                                <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Miembros</span>
                            </div>
                            <div className="flex flex-col border-l border-border-thin/30 pl-8">
                                <span className="text-3xl font-extrabold text-text-main tracking-tight">{proyectosCount}</span>
                                <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Proyectos</span>
                            </div>
                            <div className="flex flex-col border-l border-border-thin/30 pl-8">
                                <span className="text-3xl font-extrabold text-text-main tracking-tight">{selectedGroup.lineasNombres?.length || 0}</span>
                                <span className="text-[9px] font-mono text-text-dim uppercase tracking-wider">Líneas</span>
                            </div>
                        </div>
                    </div>

                    {/* Derecha (lg:col-span-5): Ficha de Datos del Grupo */}
                    <div className="lg:col-span-5">
                        <div className="bento-card static p-6 space-y-6 bg-surface/40 backdrop-blur-md border border-border-thin shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="grid grid-cols-2 gap-4 divide-x divide-border-thin/30">
                                <div className="flex items-start gap-2.5">
                                    <Calendar size={14} className="text-text-dim mt-1 shrink-0" />
                                    <div>
                                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Fundación</p>
                                        <p className="text-sm font-semibold text-text-main">{formatFecha(selectedGroup.fechaCreacion)}</p>
                                    </div>
                                </div>
                                <div className="pl-4 flex items-start gap-2.5">
                                    <Layers size={14} className="text-text-dim mt-1 shrink-0" />
                                    <div>
                                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Categoría</p>
                                        <p className="text-sm font-semibold text-text-main">{selectedGroup.categoriaConsolidacion || 'En Formación'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedGroup.nombreCoordinador && (
                                <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                    <Users size={14} className="text-text-dim mt-1 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Coordinador Principal</p>
                                        <p className="text-sm font-semibold text-text-main truncate">{formatNombre(selectedGroup.nombreCoordinador)}</p>
                                        {selectedGroup.carreraCoordinador && <p className="text-xs text-text-dim mt-0.5">{selectedGroup.carreraCoordinador}</p>}
                                    </div>
                                </div>
                            )}

                            {selectedGroup.resolucionAprobacion && (
                                <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                    <FileText size={14} className="text-text-dim mt-1 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Resolución de Aprobación</p>
                                        <p className="text-xs font-mono text-text-main break-all">{selectedGroup.resolucionAprobacion}</p>
                                    </div>
                                </div>
                            )}

                            {selectedGroup.carrerasNombres && selectedGroup.carrerasNombres.length > 0 && (
                                <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                    <BookOpen size={14} className="text-text-dim mt-1 shrink-0" />
                                    <div>
                                        <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-2">Programas Académicos</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedGroup.carrerasNombres.map((c, i) => (
                                                <span key={i} className="badge-vercel badge-vercel-info text-[9px] font-mono px-2 py-0.5 uppercase tracking-wide">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-border-thin/30 pt-4 flex items-start gap-2.5">
                                <Mail size={14} className="text-text-dim mt-1 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-mono mb-0.5">Contacto Oficial</p>
                                    <a href={`mailto:${emailContacto}`} className="text-xs text-brand hover:underline block truncate font-medium">
                                        {emailContacto}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Banner de Portada Cinematográfica */}
                <div className="w-full h-64 sm:h-96 md:h-[450px] rounded-2xl overflow-hidden bg-surface/30 relative border border-border-thin select-none mb-24 animate-fade-up lg:-ml-24 lg:-mr-24">
                    {selectedGroup.fotoUrl ? (
                        <img src={selectedGroup.fotoUrl.split(',')[0]} alt={selectedGroup.nombre} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full vercel-grid-fade bg-glow flex items-center justify-center relative overflow-hidden bg-surface/10 px-4">
                            {/* Blur Glows Ambientales decorativos */}
                            <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-brand/10 blur-[90px] pointer-events-none" />
                            <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-purple-500/10 blur-[90px] pointer-events-none" />

                            <span className="relative z-10 font-black text-3xl sm:text-5xl md:text-7xl lg:text-8xl tracking-[0.2em] font-mono select-none uppercase bg-clip-text text-transparent bg-gradient-to-b from-text-main to-text-dim/10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.05)] pl-[0.2em] break-all text-center max-w-[90%]">
                                {selectedGroup.siglas || 'ISTPET'}
                            </span>
                        </div>
                    )}
                </div>

                {/* INTERACTIVE WORKSPACE MOCKUP (Objetivo, Misión, Visión, Líneas) */}
                <section className="py-12 md:py-20 relative border-t border-border-thin/30 animate-fade-up lg:-ml-24 lg:-mr-24">
                    <h2 className="text-3xl md:text-[44px] font-bold tracking-tighter leading-[0.95] text-text-main max-w-3xl mb-12">
                        Un espacio de trabajo para el investigador
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
                        {/* Izquierda (col-span-8): Mockup Interactivo del Editor */}
                        <div className="lg:col-span-8 lg:sticky lg:top-[32vh] border border-border-thin rounded-xl bg-surface shadow-md p-6 font-mono text-xs tracking-tight relative overflow-hidden">
                            {/* Window controls */}
                            <div className="flex items-center justify-between border-b border-border-thin pb-3.5 mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full bg-error/50" />
                                    <span className="w-3.5 h-3.5 rounded-full bg-warning/50" />
                                    <span className="w-3.5 h-3.5 rounded-full bg-success/50" />
                                </div>
                                <span className="text-xs text-text-dim font-mono">Workspace://{selectedGroup.siglas || 'grupo'}-investigacion.doc</span>
                                <span className="px-2.5 py-0.5 rounded border border-success/30 bg-success-subtle text-success text-[10px] font-mono">
                                    SINCRONIZADO
                                </span>
                            </div>

                            {/* Editor Layout */}
                            <div className="flex flex-col md:grid md:grid-cols-12 gap-6">
                                {/* Left side inside mockup: Structure selector */}
                                <div className="w-full md:col-span-4 border-b md:border-b-0 md:border-r border-border-thin pb-4 md:pb-0 md:pr-4 space-y-2 text-xs text-text-dim font-sans">
                                    <p className="text-text-main font-semibold mb-3 font-mono text-[10px] tracking-wider uppercase">// ESTRUCTURA</p>

                                    {[
                                        { id: 1, name: '1. Objetivo' },
                                        { id: 2, name: '2. Misión' },
                                        { id: 3, name: '3. Visión' },
                                        { id: 4, name: '4. Líneas' },
                                        { id: 5, name: '5. Convocatorias' },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => handleWorkspaceTabClick(tab.id)}
                                            className={`w-full text-left p-2.5 rounded border flex items-center justify-between cursor-pointer transition-all duration-300 ${activeWorkspaceTab === tab.id
                                                ? 'bg-surface-hover border-border-hover text-text-main font-semibold'
                                                : 'border-transparent text-text-dim hover:text-text-main hover:bg-surface/30'
                                                }`}
                                        >
                                            <span>{tab.name}</span>
                                            {activeWorkspaceTab === tab.id ? (
                                                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                                            ) : (
                                                <span className="w-1.5 h-1.5 rounded-full bg-border-thin/60" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {/* Right side inside mockup: Content output formatted as Notion-like reader */}
                                <div className="w-full md:col-span-8 flex flex-col justify-between min-h-[220px] font-sans relative">
                                    <div className="flex flex-1 gap-2">
                                        <div className="relative flex-1 min-w-0">
                                            {/* Tab 1: Objetivo */}
                                            {activeWorkspaceTab === 1 && (
                                                <div className="space-y-3.5 animate-fade-in font-sans">
                                                    <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                        <FileText size={10} />
                                                        // Meta del Grupo
                                                    </p>
                                                    <h3 className="text-base font-bold text-text-main">Objetivo General</h3>
                                                    <p className="text-text-main text-xs leading-relaxed font-light">
                                                        {selectedGroup.objetivoGeneral || 'El grupo no cuenta con un objetivo general registrado.'}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Tab 2: Misión */}
                                            {activeWorkspaceTab === 2 && (
                                                <div className="space-y-3.5 animate-fade-in font-sans">
                                                    <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                        <FileText size={10} />
                                                        // Propósito
                                                    </p>
                                                    <h3 className="text-base font-bold text-text-main">Misión</h3>
                                                    <p className="text-text-main text-xs leading-relaxed font-light">
                                                        {selectedGroup.mision || 'El grupo no cuenta con una misión registrada.'}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Tab 3: Visión */}
                                            {activeWorkspaceTab === 3 && (
                                                <div className="space-y-3.5 animate-fade-in font-sans">
                                                    <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                        <FileText size={10} />
                                                        // Visión de Futuro
                                                    </p>
                                                    <h3 className="text-base font-bold text-text-main">Visión</h3>
                                                    <p className="text-text-main text-xs leading-relaxed font-light">
                                                        {selectedGroup.vision || 'El grupo no cuenta con una visión registrada.'}
                                                    </p>
                                                </div>
                                            )}
                                            {/* Tab 4: Líneas */}
                                            {activeWorkspaceTab === 4 && (
                                                <div className="space-y-3.5 animate-fade-in font-sans">
                                                    <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                        <FileText size={10} />
                                                        // Especialización
                                                    </p>
                                                    <h3 className="text-base font-bold text-text-main mb-2">Líneas de Investigación</h3>
                                                    {selectedGroup.lineasNombres && selectedGroup.lineasNombres.length > 0 ? (
                                                        <div className="space-y-2 pt-1">
                                                            {selectedGroup.lineasNombres.map((linea, idx) => (
                                                                <div key={idx} className="flex gap-2.5 items-start text-xs font-light">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                                                                    <span className="text-text-main leading-relaxed">{linea}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-text-dim italic text-xs">El grupo no tiene líneas de investigación asociadas.</p>
                                                    )}
                                                </div>
                                            )}
                                            {/* Tab 5: Convocatorias */}
                                            {activeWorkspaceTab === 5 && (
                                                <div className="space-y-3.5 animate-fade-in font-sans">
                                                    <p className="text-[10px] text-brand font-semibold uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-border-thin pb-1.5">
                                                        <FileText size={10} />
                                                        // Vinculación
                                                    </p>
                                                    <h3 className="text-base font-bold text-text-main">Convocatorias y Adscripción</h3>
                                                    <p className="text-text-main text-xs leading-relaxed font-light">
                                                        ¿Te apasiona el desarrollo tecnológico y la investigación aplicada? {selectedGroup.tipoGrupo.toLowerCase() === 'semillero' ? 'Nuestro semillero' : 'Nuestro grupo de investigación'} mantiene abiertas oportunidades para postular en calidad de pasantes, tesistas o asistentes de investigación.
                                                    </p>
                                                    <div className="pt-2 select-none">
                                                        <a href={`mailto:${emailContacto}?subject=${encodeURIComponent(`Postulación a Grupo ${selectedGroup.siglas || ''}`)}`}
                                                            className="inline-flex items-center gap-2 px-3 py-2 rounded bg-brand text-bg-deep font-mono text-[9px] font-bold tracking-wider hover:opacity-90 transition-all shadow-sm">
                                                            POSTULAR AL COORDINADOR <Mail size={10} />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="border-t border-border-thin mt-4 pt-3 flex justify-between items-center text-[10px] text-text-dim font-mono">
                                        <span>DOCUMENTO: {selectedGroup.siglas || 'grupo'}-investigacion.doc</span>
                                        <span>LÍNEAS: {selectedGroup.lineasNombres?.length || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Derecha (lg:col-span-4): Títulos limpios sin cuadros ni descripciones para scroll-spy */}
                        <div className="lg:col-span-4 space-y-[40vh] py-12 font-sans relative lg:pb-[40vh]">
                            {/* Bloque 1: Objetivo */}
                            <div
                                ref={el => { workspaceCardRefs.current[0] = el; }}
                                onClick={() => handleWorkspaceTabClick(1)}
                                className="cursor-pointer select-none"
                                style={{
                                    opacity: activeWorkspaceTab === 1 ? 1 : 0,
                                    transform: `translateY(${activeWorkspaceTab === 1 ? 0 : 12}px)`,
                                    pointerEvents: activeWorkspaceTab === 1 ? 'auto' : 'none',
                                    transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">// 01. Enfoque Principal</p>
                                <h3 className="text-3xl font-black text-text-main leading-none">Objetivo General</h3>
                            </div>

                            {/* Bloque 2: Misión */}
                            <div
                                ref={el => { workspaceCardRefs.current[1] = el; }}
                                onClick={() => handleWorkspaceTabClick(2)}
                                className="cursor-pointer select-none"
                                style={{
                                    opacity: activeWorkspaceTab === 2 ? 1 : 0,
                                    transform: `translateY(${activeWorkspaceTab === 2 ? 0 : 12}px)`,
                                    pointerEvents: activeWorkspaceTab === 2 ? 'auto' : 'none',
                                    transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">// 02. Propósito Actual</p>
                                <h3 className="text-3xl font-black text-text-main leading-none">Misión del Grupo</h3>
                            </div>

                            {/* Bloque 3: Visión */}
                            <div
                                ref={el => { workspaceCardRefs.current[2] = el; }}
                                onClick={() => handleWorkspaceTabClick(3)}
                                className="cursor-pointer select-none"
                                style={{
                                    opacity: activeWorkspaceTab === 3 ? 1 : 0,
                                    transform: `translateY(${activeWorkspaceTab === 3 ? 0 : 12}px)`,
                                    pointerEvents: activeWorkspaceTab === 3 ? 'auto' : 'none',
                                    transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">// 03. Proyección Futura</p>
                                <h3 className="text-3xl font-black text-text-main leading-none">Visión del Grupo</h3>
                            </div>

                            {/* Bloque 4: Líneas */}
                            <div
                                ref={el => { workspaceCardRefs.current[3] = el; }}
                                onClick={() => handleWorkspaceTabClick(4)}
                                className="cursor-pointer select-none"
                                style={{
                                    opacity: activeWorkspaceTab === 4 ? 1 : 0,
                                    transform: `translateY(${activeWorkspaceTab === 4 ? 0 : 12}px)`,
                                    pointerEvents: activeWorkspaceTab === 4 ? 'auto' : 'none',
                                    transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">// 04. Especialidades</p>
                                <h3 className="text-3xl font-black text-text-main leading-none">Líneas de Trabajo</h3>
                            </div>

                            {/* Bloque 5: Convocatorias */}
                            <div
                                ref={el => { workspaceCardRefs.current[4] = el; }}
                                onClick={() => handleWorkspaceTabClick(5)}
                                className="cursor-pointer select-none"
                                style={{
                                    opacity: activeWorkspaceTab === 5 ? 1 : 0,
                                    transform: `translateY(${activeWorkspaceTab === 5 ? 0 : 12}px)`,
                                    pointerEvents: activeWorkspaceTab === 5 ? 'auto' : 'none',
                                    transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                }}
                            >
                                <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-1.5">// 05. Vinculación</p>
                                <h3 className="text-3xl font-black text-text-main leading-none mb-6">Únete al Equipo</h3>
                                <a href={`mailto:${emailContacto}?subject=${encodeURIComponent(`Postulación a Grupo ${selectedGroup.siglas || ''}`)}`}
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand text-bg-deep font-mono text-xs font-bold tracking-wider hover:opacity-90 transition-all select-none shadow-[0_4px_20px_rgba(0,112,243,0.12)]">
                                    SOLICITAR INGRESO <Mail size={12} />
                                </a>
                            </div>
                        </div>

                    </div>
                </section>

                <section className="py-28 relative border-t border-border-thin/30 animate-fade-up lg:-ml-24 lg:-mr-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        {/* Izquierda (lg:col-span-8): Laptop Mockup */}
                        <div className="lg:col-span-8 lg:order-last lg:sticky lg:top-[32vh] border border-border-thin rounded-xl bg-surface shadow-md p-6 font-mono text-xs tracking-tight relative overflow-hidden transition-all duration-300">
                            {/* Window controls */}
                            <div className="flex items-center justify-between border-b border-border-thin pb-3.5 mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="w-3.5 h-3.5 rounded-full bg-error/50" />
                                    <span className="w-3.5 h-3.5 rounded-full bg-warning/50" />
                                    <span className="w-3.5 h-3.5 rounded-full bg-success/50" />
                                </div>
                                <span className="text-xs text-text-dim font-mono">Perfil_Investigador://{selectedGroup.siglas || 'grupo'}</span>
                                <div className="flex items-center gap-1.5 text-[9px] text-success font-mono font-bold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                                    <span>REGISTRO OFICIAL</span>
                                </div>
                            </div>

                            {/* Output Profile inside Laptop Mockup */}
                            {selectedMemberId && selectedGroup.miembros ? (
                    (() => {
                        const m = selectedGroup.miembros.find(mb => mb.idGrupoMiembro === selectedMemberId);
                        if (!m) return null;
                        const initials = (m.nombreCompleto || '').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
                        const isCoord = (m.rol || '').toLowerCase() === 'coordinador';

                        return (
                            <div className="space-y-6 font-sans py-4 flex flex-col md:flex-row gap-6 items-center animate-fade-in">
                                {/* Avatar grande */}
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold border shrink-0 relative overflow-hidden transition-all duration-300 ${isCoord ? 'bg-gradient-to-br from-brand/20 to-purple-500/20 text-brand border-brand/30 shadow-[0_4px_20px_rgba(0,112,243,0.15)]' : 'bg-gradient-to-br from-surface to-surface-hover border-border-thin text-text-main'}`}>
                                    <div className="absolute inset-0 vercel-grid opacity-30" />
                                    <span className="relative z-10 filter drop-shadow-sm font-mono tracking-wider">{initials}</span>
                                </div>

                                {/* Info de perfil */}
                                <div className="flex-1 space-y-3 min-w-0 w-full text-center md:text-left">
                                    <div>
                                        <span className={`badge-vercel text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isCoord ? 'badge-vercel-violet' : 'badge-vercel-neutral'}`}>
                                            {m.rol}
                                        </span>
                                        <h3 className="text-lg font-bold text-text-main leading-snug mt-2">{m.nombreCompleto}</h3>
                                        {m.gradoAcademicoMaximo && (
                                            <p className="text-[10px] text-brand font-bold font-mono tracking-wider uppercase mt-1">
                                                {m.gradoAcademicoMaximo}
                                            </p>
                                        )}
                                        {m.carrera && <p className="text-xs text-text-dim mt-0.5 font-medium">{m.carrera}</p>}
                                        {m.especialidad && (
                                            <p className="text-xs text-text-dim/80 italic mt-2 leading-relaxed">
                                                Especialidad: {m.especialidad}
                                            </p>
                                        )}
                                    </div>

                                    <div className="border-t border-border-thin/40 pt-3.5 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2.5 text-[10px] text-text-dim font-mono items-center">
                                        <span>ESTADO: {m.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                                        <span className="flex items-center gap-1.5 mr-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                            ADSCRITO
                                        </span>

                                        {/* Perfiles Académicos */}
                                        {(m.orcidId || m.googleScholarUrl || m.researchGateUrl || m.scopusId) && (
                                            <div className="flex flex-wrap gap-2.5 justify-center md:justify-start md:border-l md:border-border-thin/40 md:pl-4 py-0.5">
                                                {m.orcidId && (
                                                    <a href={`https://orcid.org/${m.orcidId}`} target="_blank" rel="noopener noreferrer"
                                                        className="text-text-dim hover:text-brand transition-colors font-semibold" title="Perfil ORCID">
                                                        ORCID
                                                    </a>
                                                )}
                                                {m.googleScholarUrl && (
                                                    <a href={m.googleScholarUrl} target="_blank" rel="noopener noreferrer"
                                                        className="text-text-dim hover:text-brand transition-colors font-semibold" title="Perfil Google Scholar">
                                                        Scholar
                                                    </a>
                                                )}
                                                {m.researchGateUrl && (
                                                    <a href={m.researchGateUrl} target="_blank" rel="noopener noreferrer"
                                                        className="text-text-dim hover:text-brand transition-colors font-semibold" title="Perfil ResearchGate">
                                                        ResearchGate
                                                    </a>
                                                )}
                                                {m.scopusId && (
                                                    <a href={`https://www.scopus.com/authid/detail.uri?authorId=${m.scopusId}`} target="_blank" rel="noopener noreferrer"
                                                        className="text-text-dim hover:text-brand transition-colors font-semibold" title="Perfil Scopus">
                                                        Scopus
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="py-12 text-center text-text-dim font-sans text-xs">
                        Selecciona un miembro del equipo para inspeccionar su ficha
                    </div>
                )}
            </div>

                        {/* Derecha (lg:col-span-4): Integrantes e Selector dinámico sin cuadros con scroll-spy */ }
        <div className="lg:col-span-4 lg:order-first space-y-[40vh] font-sans py-12 lg:pb-[40vh]">
            <div
                id="investigadores-header"
                className="transition-all duration-500"
                style={{
                    opacity: selectedMemberId === null ? 1 : 0,
                    transform: `translateY(${selectedMemberId === null ? 0 : -12}px)`,
                    pointerEvents: selectedMemberId === null ? 'auto' : 'none'
                }}
            >
                <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">// Investigadores</p>
                <h2 className="text-3xl md:text-[40px] font-bold tracking-tighter leading-tight text-text-main mt-1">
                    Equipo de Investigación
                </h2>
                <p className="text-text-dim text-xs leading-relaxed mt-3">
                    Coordinadores y profesores investigadores asociados adscritos formalmente a este grupo.
                </p>
            </div>

            {selectedGroup.miembros && selectedGroup.miembros.length > 0 ? (
                <div className="space-y-[40vh] mt-[40vh]">
                    {selectedGroup.miembros.map((miembro, index) => (
                        <div
                            key={miembro.idGrupoMiembro}
                            ref={el => { memberCardRefs.current[index] = el; }}
                            onClick={() => handleMemberCardClick(miembro.idGrupoMiembro, index)}
                            className="cursor-pointer select-none"
                            style={{
                                opacity: selectedMemberId === miembro.idGrupoMiembro ? 1 : 0,
                                transform: `translateY(${selectedMemberId === miembro.idGrupoMiembro ? 0 : 12}px)`,
                                pointerEvents: selectedMemberId === miembro.idGrupoMiembro ? 'auto' : 'none',
                                transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                            }}
                        >
                            <p className="text-[9px] font-mono text-brand uppercase tracking-widest mb-2.5">// 0{index + 1}. {miembro.rol}</p>
                            <h3 className="text-3xl font-black text-text-main leading-tight">{miembro.nombreCompleto}</h3>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-text-dim text-xs italic">El grupo no tiene miembros registrados.</p>
            )}
        </div>
                    </div>
                </section>

                {/* INTERACTIVE PROJECTS MOCKUP (CACES / Evidencias) */}
                <section className="py-28 relative border-t border-border-thin/30 animate-fade-up lg:-ml-24 lg:-mr-24">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Izquierda (lg:col-span-4): Textos e Selector interactivo */}
            <div className="lg:col-span-4 lg:order-last space-y-6 font-sans">
                <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">// Portafolio de Proyectos</p>
                <h2 className="text-3xl md:text-[40px] font-bold tracking-tighter leading-tight text-text-main">
                    Proyectos Vinculados
                </h2>
                <p className="text-text-dim text-xs leading-relaxed">
                    Proyectos y líneas de desarrollo tecnológico liderados por los investigadores de este grupo en el periodo vigente.
                </p>

                {selectedGroup.proyectos && selectedGroup.proyectos.length > 0 ? (
                    <div className="space-y-2 pt-2 max-h-[300px] overflow-y-auto pr-1">
                        {selectedGroup.proyectos.map((proyecto) => (
                            <button
                                key={proyecto.uuid}
                                onClick={() => setSelectedProjectUuid(proyecto.uuid)}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-2.5 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.01)] ${selectedProjectUuid === proyecto.uuid
                                    ? 'bg-surface border-border-hover text-text-main font-medium'
                                    : 'border-border-thin/40 bg-surface/5 text-text-dim hover:text-text-main hover:bg-surface/20'
                                    }`}
                            >
                                <div className="flex flex-col gap-1.5 w-full">
                                    <div className="flex justify-between items-center gap-3">
                                        <span className="text-[9px] font-mono font-semibold text-brand uppercase tracking-wider">
                                            {proyecto.codigoInstitucional || 'S/N - CÓDIGO'}
                                        </span>
                                        <span className={`text-[8px] font-mono shrink-0 font-semibold px-2 py-0.5 rounded-full border border-border-thin/45 uppercase tracking-wide ${estadoColor(proyecto.estado)}`}>
                                            {proyecto.estado}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold leading-snug line-clamp-1 text-text-main">
                                        {proyecto.titulo}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-text-dim text-xs italic">El grupo no tiene proyectos asociados.</p>
                )}
            </div>

            {/* Derecha (lg:col-span-8): Mockup Window de CACES */}
            <div className="lg:col-span-8 lg:order-first flex flex-col items-center justify-center overflow-visible laptop-container">
                <style>{`
                    .laptop-container {
                        perspective: 1200px;
                        width: 100%;
                        max-width: 740px;
                        margin: 0 auto;
                        overflow: visible;
                    }
                    .laptop-lid {
                        background: #0a0a0a;
                        border: 12px solid #0a0a0a;
                        border-bottom: 2px solid #0a0a0a;
                        border-radius: 18px 18px 0 0;
                        box-shadow:
                            inset 0 1px 1px rgba(255, 255, 255, 0.08),
                            inset 0 -1px 1px rgba(0, 0, 0, 0.9);
                        position: relative;
                        z-index: 2;
                    }
                    [data-theme="light"] .laptop-lid {
                        background: #121212;
                        border-color: #121212;
                        border-bottom-color: #121212;
                        box-shadow:
                            inset 0 1px 1px rgba(255, 255, 255, 0.1),
                            inset 0 -1px 1px rgba(0, 0, 0, 0.85);
                    }
                    .laptop-screen-glass {
                        background: #000000;
                        border-radius: 8px 8px 0 0;
                        padding: 3px;
                        position: relative;
                        overflow: hidden;
                        aspect-ratio: 16/10;
                        display: flex;
                        flex-direction: column;
                    }
                    .laptop-camera {
                        position: absolute;
                        top: 6px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 5px;
                        height: 5px;
                        background: #111;
                        border-radius: 50%;
                        border: 0.5px solid #333;
                        z-index: 10;
                    }
                    .laptop-camera::after {
                        content: '';
                        position: absolute;
                        top: 1.5px;
                        left: 1.5px;
                        width: 2px;
                        height: 2px;
                        background: #0070f3;
                        border-radius: 50%;
                        opacity: 0.65;
                    }
                    .laptop-display {
                        flex: 1;
                        background: #050505;
                        position: relative;
                        overflow: hidden;
                        border-radius: 5px;
                        border: 1px solid #111;
                    }
                    [data-theme="light"] .laptop-display {
                        background: #fafafa;
                        border-color: #eaeaea;
                    }
                    .laptop-screen-glare {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 200%;
                        height: 100%;
                        background: linear-gradient(
                            125deg,
                            rgba(255, 255, 255, 0.05) 0%,
                            rgba(255, 255, 255, 0.02) 25%,
                            rgba(255, 255, 255, 0) 50%
                        );
                        transform: rotate(-10deg) translateY(-20%);
                        pointer-events: none;
                        z-index: 8;
                    }
                    .laptop-base-wrapper {
                        position: relative;
                        width: 114%;
                        margin-left: -7%;
                        z-index: 3;
                    }
                    .laptop-base {
                        height: 14px;
                        background: linear-gradient(to bottom, #1f1f1f 0%, #121212 25%, #0a0a0a 70%, #050505 100%);
                        border-radius: 2px 2px 10px 10px;
                        box-shadow:
                            inset 0 1px 0 rgba(255, 255, 255, 0.1),
                            inset 0 -1px 2px rgba(0, 0, 0, 0.9);
                        position: relative;
                    }
                    [data-theme="light"] .laptop-base {
                        background: linear-gradient(to bottom, #2b2b2b 0%, #1c1c1c 25%, #141414 70%, #0d0d0d 100%);
                        box-shadow:
                            inset 0 1px 0 rgba(255, 255, 255, 0.15),
                            inset 0 -1px 2px rgba(0, 0, 0, 0.8);
                    }
                    .laptop-notch {
                        position: absolute;
                        top: 0;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 86px;
                        height: 5px;
                        background: #050505;
                        border-radius: 0 0 5px 5px;
                    }
                    [data-theme="light"] .laptop-notch {
                        background: #0d0d0d;
                    }
                    .screen-transition {
                        animation: screenFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }
                    @keyframes screenFadeIn {
                        from {
                            opacity: 0.9;
                            transform: scale(0.99);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                `}</style>

                <div className="laptop-lid w-full">
                    <div className="laptop-screen-glass">
                        <div className="laptop-camera" />
                        <div className="laptop-screen-glare" />
                        <div className="laptop-display p-6 flex flex-col justify-between select-none relative overflow-y-auto">
                            <div>
                                {/* Window controls */}
                                <div className="flex items-center justify-between border-b border-border-thin/40 pb-3 mb-5 text-[10px] font-mono">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full bg-error/50" />
                                        <span className="w-3 h-3 rounded-full bg-warning/50" />
                                        <span className="w-3 h-3 rounded-full bg-success/50" />
                                    </div>
                                    <span className="text-text-dim">Ficha_Proyecto_{selectedGroup.siglas || 'ISTPET'}.exe</span>
                                    <span className="text-brand uppercase">SIIES</span>
                                </div>

                                {/* CACES Interface output */}
                                {selectedProjectUuid && selectedGroup.proyectos ? (
                                    (() => {
                                        const proj = selectedGroup.proyectos.find(p => p.uuid === selectedProjectUuid);
                                        if (!proj) return null;
                                        const isComplete = (proj.estado || '').toLowerCase() === 'aprobado' || (proj.estado || '').toLowerCase() === 'completado';
                                        const isExecuting = (proj.estado || '').toLowerCase() === 'en ejecución' || (proj.estado || '').toLowerCase() === 'en progreso';

                                        const pct = isComplete ? 100 : isExecuting ? 50 : 15;
                                        const lbl = isComplete ? 'CUMPLIDO' : isExecuting ? 'EN EJECUCIÓN' : 'PLANIFICADO';
                                        const pctText = isComplete ? '100%' : 'Fase Activa';

                                        return (
                                            <div className="space-y-6 font-sans">
                                                <div className="space-y-2 border-b border-border-thin/40 pb-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] text-text-dim uppercase font-mono tracking-wider">// DETALLE CIENTÍFICO</span>
                                                        {proj.codigoInstitucional && <span className="text-[10px] text-text-dim font-mono">{proj.codigoInstitucional}</span>}
                                                    </div>
                                                    <h4 className="text-sm font-semibold text-text-main leading-snug">{proj.titulo}</h4>
                                                    {proj.directorNombre && (
                                                        <p className="text-xs text-text-dim mt-1">Director: <strong className="text-text-main font-medium">{proj.directorNombre}</strong></p>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-xs items-center">
                                                            <span className="text-text-main font-semibold font-mono flex items-center gap-1.5">
                                                                <Activity size={12} className="text-brand" />
                                                                // Fase de Avance
                                                            </span>
                                                            <span className={`font-bold font-mono text-[11px] px-2 py-0.5 rounded-full border ${isComplete ? 'text-success bg-success/5 border-success/15' : isExecuting ? 'text-warning bg-warning/5 border-warning/15' : 'text-brand bg-brand/5 border-brand/15'}`}>{pctText} — {lbl}</span>
                                                        </div>
                                                        <div className="w-full h-2.5 bg-surface-hover border border-border-thin rounded-full overflow-hidden p-[2px]">
                                                            <div className="h-full rounded-full bg-gradient-to-r from-brand to-success transition-all duration-700" style={{ width: `${pct}%` }} />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="border border-border-thin rounded p-3 bg-surface/50 flex justify-between items-center text-xs font-mono">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-text-main font-mono text-[10px]">Proyecto_{proj.codigoInstitucional || proj.uuid.substring(0, 8)}.pdf</span>
                                                    </div>
                                                    <button disabled className="text-[10px] border border-border-thin bg-surface px-2.5 py-1 rounded font-bold font-mono text-text-main select-none">
                                                        REGISTRADO
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="py-12 text-center text-text-dim font-sans text-xs">
                                        Selecciona un proyecto para auditar evidencias
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="laptop-base-wrapper">
                    <div className="laptop-base">
                        <div className="laptop-notch" />
                    </div>
                </div>
            </div>
        </div>
    </section>

                {/* GALERÍA DE ACTIVIDADES (Ancho completo) */}
                <section className="py-28 relative border-t border-border-thin/30 space-y-8 animate-fade-up lg:-ml-24 lg:-mr-24">
                    <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono text-text-dim uppercase tracking-widest">// Galería de Actividades</h2>
            {canEdit && (
                <label className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border-thin text-xs font-medium text-text-main hover:border-border-hover cursor-pointer transition-colors select-none font-sans">
                    <Camera size={13} />
                    {uploading ? 'Subiendo...' : 'Añadir foto'}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadPhoto}
                        disabled={uploading}
                        className="hidden"
                    />
                </label>
            )}
        </div>

{
    selectedGroup.fotoUrl ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {selectedGroup.fotoUrl.split(',').filter(Boolean).map((photoUrl, index) => (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-surface group/photo border border-border-thin/30 cursor-pointer" onClick={() => setActivePhotoUrl(photoUrl)}>
                    <img
                        src={photoUrl}
                        alt={`Galería ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    {canEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePhoto(photoUrl);
                            }}
                            className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-bg-deep/80 hover:bg-red-500/10 hover:text-red-500 text-text-dim opacity-0 group-hover/photo:opacity-100 transition-all border border-border-thin/40"
                            title="Eliminar fotografía"
                        >
                            <Trash size={12} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    ) : (
    <div className="text-center py-16 rounded-2xl border border-dashed border-border-thin bg-surface/10 backdrop-blur-sm font-sans flex flex-col items-center justify-center gap-3">
        <div className="p-4 rounded-full bg-surface-hover border border-border-thin/80 text-text-dim/40">
            <Camera size={24} className="stroke-[1.5]" />
        </div>
        <div>
            <p className="text-xs font-semibold text-text-main mb-0.5">Galería sin imágenes</p>
            <p className="text-[10px] text-text-dim">El grupo aún no tiene fotografías registradas.</p>
            {canEdit && <p className="text-[9px] text-brand font-medium mt-2">Haz clic en "Añadir foto" en la esquina superior para ilustrar el portafolio.</p>}
        </div>
    </div>
)
}
                </section >

    {/* Modal Lightbox */ }
{
    activePhotoUrl && (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-sm transition-all duration-300"
            onClick={() => setActivePhotoUrl(null)}
        >
            <button
                onClick={() => setActivePhotoUrl(null)}
                className="absolute top-6 right-6 px-4 py-2 rounded-lg bg-surface/80 hover:bg-surface border border-border-thin text-xs text-text-main transition-colors font-mono select-none"
            >
                CERRAR
            </button>
            <div className="max-w-[90vw] max-h-[85vh] overflow-hidden rounded-xl border border-border-thin shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <img src={activePhotoUrl} alt="Visualización de galería" className="w-full h-full object-contain max-h-[80vh]" />
            </div>
        </div>
    )
}
            </main >
        );
    } else {
    mainContent = (
        <main className="max-w-7xl mx-auto px-6 pt-24 pb-40 space-y-32">
            {/* HERO */}
            <section
                ref={heroRef}
                onMouseMove={handleHeroMouseMove}
                className="min-h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-7.5rem)] flex flex-col justify-between pt-4 pb-2 relative group"
            >
                {/* Cursor glow sutil */}
                <div className="absolute pointer-events-none rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{
                    left: 'var(--mouse-x)',
                    top: 'var(--mouse-y)',
                    width: '500px',
                    height: '500px',
                    transform: 'translate(-50%, -50%)',
                    background: currentTheme === 'dark'
                        ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)'
                        : 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 65%)',
                    zIndex: 0,
                }} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto relative z-10">
                    {/* Texto izquierda */}
                    <div className="lg:col-span-5 space-y-7 animate-fade-up lg:-ml-24">
                        <div className="text-[10px] font-mono text-text-dim uppercase tracking-widest">
                            Tecnológico Traversari — ISTPET
                        </div>
                        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[72px] font-normal text-text-main tracking-tighter leading-[0.85]">
                            Grupos de <br />Investigación
                        </h1>
                        <p className="text-text-dim text-sm leading-relaxed max-w-sm">
                            Equipos académicos que generan conocimiento, desarrollan tecnología e impulsan la innovación en el Instituto Superior Tecnológico Traversari.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <a href="#catalogo"
                                className="flex items-center justify-center gap-2 bg-text-main text-bg-deep px-6 py-3 rounded-md text-[11px] font-semibold uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-sm">
                                Ver grupos <ArrowRight size={12} />
                            </a>
                            <a href="#impacto"
                                className="flex items-center justify-center gap-2 bg-transparent text-text-main px-6 py-3 rounded-md border border-border-thin text-[11px] font-semibold uppercase tracking-widest hover:bg-surface-hover/40 hover:border-border-hover transition-all">
                                Sobre la investigación
                            </a>
                        </div>
                    </div>

                    {/* Bloque derecha */}
                    <div className="lg:col-span-7 lg:pl-12 animate-fade-up" style={{ animationDelay: '100ms' }}>
                        <div className="bento-card static bg-surface/20 backdrop-blur-sm overflow-hidden border border-border-thin shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                            <div className="grid grid-cols-3 divide-x divide-border-thin/30 border-b border-border-thin/50">
                                {[
                                    { label: 'Grupos activos', value: groups.length > 0 ? groups.length : '—' },
                                    { label: 'Investigadores', value: totalMiembros > 0 ? totalMiembros : '—' },
                                    { label: 'Proyectos', value: totalProyectos > 0 ? totalProyectos : '—' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="px-6 py-8 text-center bg-surface/10">
                                        <div className="text-3xl font-extrabold text-text-main tabular-nums mb-1 tracking-tight">{value}</div>
                                        <div className="text-[10px] text-text-dim uppercase tracking-wider font-mono">{label}</div>
                                    </div>
                                ))}
                            </div>

                            {groups.length > 0 && (
                                (() => {
                                    const featuredProjects = groups
                                        .flatMap(g => (g.proyectos || []).map(p => ({ ...p, grupoSiglas: g.siglas, grupoUuid: g.uuid })))
                                                        .slice(0, 3);
                                    
                                    if (featuredProjects.length === 0) return null;

                                    return (
                                        <div className="divide-y divide-border-thin/30 bg-surface/5">
                                            <div className="px-6 py-3.5 bg-surface/10 flex items-center justify-between">
                                                <span className="text-[10px] font-mono text-text-dim uppercase tracking-widest">// Proyectos Destacados</span>
                                                <span className="text-[9px] font-mono text-brand uppercase tracking-widest">Actividad</span>
                                            </div>
                                            {featuredProjects.map((p) => (
                                                <Link key={p.uuid}
                                                    to={`/grupos-investigacion/${p.grupoUuid}`}
                                                    className="flex items-center justify-between px-6 py-4 hover:bg-surface-hover/30 transition-all cursor-pointer group/destacado">
                                                    <div className="min-w-0 pr-4">
                                                        <p className="text-sm font-semibold text-text-main leading-snug truncate group-hover/destacado:text-brand transition-colors">{p.titulo}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border border-border-thin/30 uppercase tracking-wider text-brand bg-brand/5">
                                                                {p.grupoSiglas || 'PROYECTO'}
                                                            </span>
                                                            <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full border border-border-thin/30 uppercase tracking-wider ${estadoColor(p.estado)} bg-surface/15`}>
                                                                {p.estado}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-text-dim/40 group-hover/destacado:text-text-main group-hover/destacado:translate-x-0.5 transition-all shrink-0" />
                                                </Link>
                                            ))}
                                            <div className="px-6 py-4 border-t border-border-thin/30 bg-surface/10">
                                                <a href="#catalogo" className="text-xs text-brand font-medium hover:underline transition-colors flex items-center gap-1.5 w-fit">
                                                    Explorar todos los grupos y proyectos <ArrowRight size={12} />
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}

                            {loading && groups.length === 0 && (
                                <div className="px-6 py-10 flex items-center gap-2 text-text-dim justify-center bg-surface/5">
                                    <Loader2 size={14} className="animate-spin text-brand" />
                                    <span className="text-xs font-medium font-mono">Sincronizando catálogo...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ticker logos institucionales */}
                <div className="w-full pt-12 pb-4 flex flex-wrap justify-center lg:justify-between items-center gap-x-8 gap-y-5 text-black dark:text-white select-none lg:-ml-24 lg:-mr-24 relative z-10">
                    {[
                        <span key="se" className="font-sans font-extrabold tracking-tight text-[14px]">SENESCYT</span>,
                        <span key="ces" className="font-serif font-bold italic tracking-wide text-[16px]">CES</span>,
                        <span key="ca" className="font-mono font-bold tracking-tighter text-[12px]">CACES</span>,
                        <span key="sn" className="font-sans font-light tracking-[0.10em] text-[14px]">SENA<strong className="font-bold">DI</strong></span>,
                        <span key="si" className="font-sans font-black tracking-tight text-[14px]">SIIES</span>,
                        <span key="ds" className="font-sans font-bold tracking-tight text-[14px]">DSPACE</span>,
                    ].map((el, i) => (
                        <div key={i} className="opacity-60 hover:opacity-100 transition-opacity">{el}</div>
                    ))}
                </div>
            </section>

            {/* CATÁLOGO */}
            <section id="catalogo" className="scroll-mt-24 space-y-10 lg:-ml-24 lg:-mr-24">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <h2 className="text-3xl md:text-[40px] font-bold tracking-tighter text-text-main">
                        Catálogo
                    </h2>
                    <div className="flex items-center gap-1 p-1 bg-surface border border-border-thin rounded-lg w-fit">
                        {[['todos', 'Todos'], ['investigación', 'Investigación'], ['semillero', 'Semilleros']].map(([val, lbl]) => (
                            <button key={val} onClick={() => setSelectedType(val)}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${selectedType === val ? 'bg-text-main text-bg-deep' : 'text-text-dim hover:text-text-main'}`}>
                                {lbl}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Buscador + Filtro de Carrera */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-3xl">
                    <div className="relative flex-1 border border-border-thin rounded-lg bg-surface/20 focus-within:border-brand/40 focus-within:shadow-[0_0_15px_rgba(0,112,243,0.03)] transition-all duration-300">
                        <div className="flex items-center px-4 py-2.5">
                            <Search size={14} className="mr-3 text-text-dim shrink-0" />
                            <input type="text"
                                className="w-full bg-transparent text-sm text-text-main placeholder-text-dim focus:outline-none"
                                placeholder="Buscar grupos o líneas de investigación..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {uniqueCarreras.length > 0 && (
                        <div className="relative border border-border-thin rounded-lg bg-surface/20 focus-within:border-brand/40 transition-all duration-300 min-w-[220px] flex items-center pr-3">
                            <select
                                value={selectedCarrera}
                                onChange={e => setSelectedCarrera(e.target.value)}
                                className="w-full bg-transparent text-sm text-text-main px-4 py-2.5 outline-none cursor-pointer appearance-none z-10"
                            >
                                <option value="todas" className="bg-bg-deep text-text-main">Todas las carreras</option>
                                {uniqueCarreras.map(c => (
                                    <option key={c} value={c} className="bg-bg-deep text-text-main">{c}</option>
                                ))}
                            </select>
                            <ChevronRight size={14} className="text-text-dim/50 rotate-90 shrink-0 pointer-events-none absolute right-3" />
                        </div>
                    )}
                </div>

                {/* Grid */}
                {loading && groups.length === 0 ? (
                    <div className="flex items-center gap-3 py-16 text-text-dim">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Cargando grupos de investigación...</span>
                    </div>
                ) : filteredGroups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-up">
                        {filteredGroups.map((grupo, idx) => (
                            <Link key={grupo.uuid}
                                to={`/grupos-investigacion/${grupo.uuid}`}
                                className="bento-card p-5 cursor-pointer flex flex-col justify-between"
                                style={{ animationDelay: `${idx * 40}ms` }}>
                                <div>
                                    {/* Banner de grupo (Foto o Gradiente de Siglas) */}
                                    <div className="h-32 w-full rounded-lg overflow-hidden mb-5 bg-surface/30 relative border border-border-thin/30 select-none">
                                        {grupo.fotoUrl ? (
                                            <img src={grupo.fotoUrl.split(',')[0]} alt={grupo.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full vercel-grid bg-surface/40 flex items-center justify-center relative overflow-hidden transition-colors duration-500">
                                                {/* Glow sutil en el fondo del placeholder */}
                                                <div className="absolute inset-0 bg-radial-gradient from-brand/5 via-transparent to-transparent pointer-events-none" />
                                                <span className="relative z-10 text-text-dim/30 font-black text-xl tracking-widest font-mono uppercase filter drop-shadow-sm">{grupo.siglas || 'ISTPET'}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mb-3.5">
                                        <span className={`badge-vercel text-[8px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${grupo.tipoGrupo.toLowerCase() === 'semillero' ? 'badge-vercel-violet' : 'badge-vercel-info'}`}>
                                            {grupo.tipoGrupo}
                                        </span>
                                        {grupo.siglas && <span className="text-[10px] font-mono text-text-dim/60 font-semibold">{grupo.siglas}</span>}
                                    </div>
                                    <h3 className="text-[15px] font-bold text-text-main leading-snug mb-2 group-hover:text-brand transition-colors">
                                        {grupo.nombre}
                                    </h3>
                                    <p className="text-text-dim text-xs leading-relaxed line-clamp-2 mb-4">
                                        {grupo.mision || grupo.objetivoGeneral || 'Investigación aplicada y desarrollo de soluciones técnicas en el ISTPET.'}
                                    </p>

                                    {/* Líneas de investigación del grupo */}
                                    {grupo.lineasNombres && grupo.lineasNombres.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-6">
                                            {grupo.lineasNombres.slice(0, 2).map((l, i) => (
                                                <span key={i} className="badge-vercel badge-vercel-neutral text-[9px] font-mono px-2 py-0.5">
                                                    {l}
                                                </span>
                                            ))}
                                            {grupo.lineasNombres.length > 2 && (
                                                <span className="badge-vercel badge-vercel-neutral text-[9px] font-mono px-2 py-0.5 text-text-dim/50">+{grupo.lineasNombres.length - 2}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-text-dim border-t border-border-thin/40 pt-4 mt-auto">
                                    <span className="truncate max-w-[160px] font-semibold text-text-main/80">{formatNombre(grupo.nombreCoordinador)}</span>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="font-medium">{grupo.miembros?.length || 0} miembros</span>
                                        <ChevronRight size={12} className="text-text-dim/40 group-hover:text-text-main group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-text-dim">
                        <p className="text-sm">No se encontraron grupos que coincidan con tu búsqueda o filtros.</p>
                    </div>
                )}
            </section>

            {/* IMPACTO */}
            <section id="impacto" className="scroll-mt-24 border-t border-border-thin/40 pt-24 lg:-ml-24 lg:-mr-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                    <div className="lg:col-span-5 space-y-8">
                        <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">Investigación aplicada</p>
                        <h2 className="text-3xl md:text-[44px] font-bold tracking-tighter text-text-main leading-tight">
                            Transformación a través del conocimiento
                        </h2>
                        <p className="text-text-dim text-sm leading-relaxed">
                            Los grupos del ISTPET se organizan en torno a líneas de investigación que responden a las necesidades productivas y sociales del Ecuador, generando patentes, publicaciones científicas y soluciones tecnológicas de aplicación real.
                        </p>
                        <div className="space-y-6 pt-2">
                            {[
                                { title: 'Acreditación CACES', desc: 'Cumplimiento del modelo de evaluación para institutos tecnológicos en I+D+i.' },
                                { title: 'Ecosistemas tecnológicos', desc: 'Proyectos en ciberseguridad, energías renovables, desarrollo de software y biotecnología.' },
                                { title: 'Propiedad intelectual', desc: 'Registro de patentes y derechos de autor a través del SENADI.' },
                            ].map(({ title, desc }) => (
                                <div key={title}>
                                    <h4 className="text-sm font-semibold text-text-main mb-1">{title}</h4>
                                    <p className="text-xs text-text-dim leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Panel derecha */}
                    <div className="lg:col-span-7 bento-card static bg-surface/10 divide-y divide-border-thin/50 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                        <div className="px-6 py-4 flex items-center justify-between bg-surface/20">
                            <span className="text-xs font-mono text-text-dim uppercase tracking-wider">// Líneas de Investigación</span>
                            <span className="badge-vercel badge-vercel-success text-[9px] font-mono uppercase tracking-wide">Ecosistema</span>
                        </div>
                        {lineasStats.map((linea) => {
                            const pct = Math.min(100, (linea.projectsCount / Math.max(1, totalProyectos)) * 100);
                            return (
                                <div key={linea.nombre} className="px-6 py-5 hover:bg-surface/30 transition-all cursor-default group/impacto">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="text-sm font-semibold text-text-main truncate max-w-[70%] group-hover/impacto:text-brand transition-colors">{linea.nombre}</span>
                                        <span className="text-xs font-mono font-medium text-text-dim">
                                            {linea.projectsCount} {linea.projectsCount === 1 ? 'proyecto' : 'proyectos'} · {linea.groupsCount} {linea.groupsCount === 1 ? 'grupo' : 'grupos'}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-surface-hover border border-border-thin rounded-full overflow-hidden p-[1px]">
                                        <div className="h-full bg-gradient-to-r from-brand/60 to-brand rounded-full transition-all duration-700" style={{ width: `${Math.max(8, pct)}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {groups.length === 0 && (
                            <div className="px-6 py-8 text-sm text-text-dim flex items-center gap-2 justify-center font-mono">
                                <Loader2 size={12} className="animate-spin text-brand" /> Sincronizando datos...
                            </div>
                        )}
                        <div className="px-6 py-4 text-xs font-semibold text-text-dim bg-surface/15 font-mono">
                            {totalProyectos} PROYECTOS REGISTRADOS EN {groups.length} GRUPOS ACTIVOS
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

return (
    <div className="min-h-screen bg-bg-deep text-text-main font-sans selection:bg-selection-bg selection:text-selection-fg relative overflow-x-clip theme-transition">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none -z-20" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-bg-deep to-bg-deep -z-10" />
        <Header currentTheme={currentTheme} toggleTheme={toggleTheme} />
        {mainContent}
        <Footer currentTheme={currentTheme} />
    </div>
);
};

export default PublicGroupsPage;
