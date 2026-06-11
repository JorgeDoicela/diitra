import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import api from '../../api/axios_config';
import { buildWorkspacePath } from '../../core/documents/templateUrl';
import {
    Search,
    PlusCircle,
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ClipboardList,
    Activity,
    BarChart3,
    Award,
    ShieldCheck,
    FileDown,
    PenTool,
    Bell,
    ListChecks,
    Gavel,
    Mail,
    Globe,
    GraduationCap,
    TrendingUp,
    Calendar,
    Tag,
    BookOpen,
    ArrowRight,
    Hash,
    Zap,
    Loader2,
    User,
    FolderOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = 'Navegación' | 'Acciones Rápidas' | 'Administración' | 'Configuración'
    | 'Parámetros Normativos'
    | 'Mis Proyectos' | 'Todos los Proyectos' | 'Convocatorias' | 'Usuarios'
    | 'Mis Revisiones' | 'Grupos';

interface SearchItem {
    id: string;
    label: string;
    description?: string;
    category: Category;
    icon: any;
    path?: string;
    action?: () => void;
    shortcut?: string;
    roles?: string[];
    permission?: string;
    keywords?: string[];
    boost?: number;
    /** "live" items come from the backend */
    isLive?: boolean;
    badge?: string;
}

// ─── Fuzzy match engine ───────────────────────────────────────────────────────

function fuzzyMatch(
    text: string,
    query: string
): { score: number; ranges: [number, number][] } | null {
    if (!query) return { score: 0, ranges: [] };
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();
    if (!q) return { score: 0, ranges: [] };

    // 1. Exact substring
    const exactIdx = t.indexOf(q);
    if (exactIdx !== -1) {
        return { score: 100 + (q.length / t.length) * 50, ranges: [[exactIdx, exactIdx + q.length - 1]] };
    }

    // 2. Word-start match
    const qWords = q.split(/\s+/);
    const wordRanges: [number, number][] = [];
    let wordScore = 0;
    let searchOffset = 0;
    let allFound = true;

    for (const qw of qWords) {
        let found = false;
        const tWords = t.split(/\s+/);
        let charOffset = 0;
        for (const tw of tWords) {
            const idx = t.indexOf(tw, charOffset);
            if (tw.startsWith(qw)) {
                wordRanges.push([idx, idx + qw.length - 1]);
                wordScore += 60;
                found = true;
                break;
            }
            charOffset = idx + tw.length + 1;
        }
        if (!found) { allFound = false; break; }
        searchOffset++;
    }
    if (allFound && wordScore > 0) {
        return { score: wordScore + (q.length / t.length) * 20, ranges: wordRanges };
    }

    // 3. Fuzzy sequential
    let qi = 0;
    let score = 0;
    const ranges: [number, number][] = [];
    let rangeStart = -1;
    let consecutive = 0;

    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            if (rangeStart === -1) rangeStart = ti;
            score += 10 + consecutive * 5;
            consecutive++;
            qi++;
        } else {
            if (rangeStart !== -1) { ranges.push([rangeStart, ti - 1]); rangeStart = -1; }
            consecutive = 0;
        }
    }
    if (rangeStart !== -1) ranges.push([rangeStart, t.length - 1]);
    if (qi < q.length) return null;
    return { score: score + (qi / t.length) * 10, ranges };
}

function scoreItem(item: SearchItem, query: string): { score: number; labelRanges: [number, number][] } | null {
    if (!query) return { score: item.boost ?? 0, labelRanges: [] };
    let best: { score: number; labelRanges: [number, number][] } | null = null;

    const tryText = (text: string, mult = 1.0) => {
        const res = fuzzyMatch(text, query);
        if (res && (best === null || res.score * mult > best.score)) {
            best = { score: res.score * mult, labelRanges: res.ranges };
        }
    };

    tryText(item.label, 1.0);
    if (item.description) tryText(item.description, 0.7);
    if (item.keywords) for (const kw of item.keywords) tryText(kw, 0.8);
    if (best && (item.boost ?? 0) > 0) (best as any).score += (item.boost ?? 0) * 3;
    return best;
}

// ─── Highlight ────────────────────────────────────────────────────────────────

const HighlightedText = ({
    text, ranges, className = '', highlightClass = 'text-text-main font-bold',
}: { text: string; ranges: [number, number][]; className?: string; highlightClass?: string }) => {
    if (!ranges || ranges.length === 0) return <span className={className}>{text}</span>;

    const merged = [...ranges].sort((a, b) => a[0] - b[0]);
    const clean: [number, number][] = [];
    for (const r of merged) {
        if (clean.length > 0 && r[0] <= clean[clean.length - 1][1] + 1) {
            clean[clean.length - 1][1] = Math.max(clean[clean.length - 1][1], r[1]);
        } else clean.push([...r]);
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const [start, end] of clean) {
        if (cursor < start) parts.push(<span key={cursor}>{text.slice(cursor, start)}</span>);
        parts.push(<span key={`h${start}`} className={highlightClass}>{text.slice(start, end + 1)}</span>);
        cursor = end + 1;
    }
    if (cursor < text.length) parts.push(<span key={cursor}>{text.slice(cursor)}</span>);
    return <span className={className}>{parts}</span>;
};

// ─── Role filter ──────────────────────────────────────────────────────────────

function useRoleFilter() {
    const { isAdmin, isDocente, isEstudiante, isRevisor, roles, hasPermission } = useAuth();
    return useCallback((item: SearchItem): boolean => {
        if (item.id === 'derechos-arco' && isAdmin) return false;
        if (isAdmin) return true;
        if (item.permission) {
            const [module, op] = item.permission.split(':');
            return hasPermission(module, op);
        }
        if (item.roles) {
            if (item.roles.includes('ANY')) return true;
            const checkRoles = item.roles.map(r => r.toUpperCase());
            if (checkRoles.includes('DIITRA_DOCENTE') && isDocente) return true;
            if (checkRoles.includes('DIITRA_ESTUDIANTE') && isEstudiante) return true;
            if (checkRoles.includes('DIITRA_REVISOR_EXTERNO') && isRevisor) return true;
            return item.roles.some(r => roles.includes(r.toUpperCase()));
        }
        return true;
    }, [isAdmin, isDocente, isEstudiante, isRevisor, roles, hasPermission]);
}

// ─── Static catalog ───────────────────────────────────────────────────────────

function buildStaticItems(navigate: ReturnType<typeof useNavigate>, isAdmin: boolean, isDocente: boolean, isEstudiante: boolean, isRevisor: boolean): SearchItem[] {
    return [
        // ── Navegación ──────────────────────────────────────────────────
        { id: 'dashboard', label: 'Tablero Principal', description: 'Vista general con métricas y actividad reciente', category: 'Navegación', icon: LayoutDashboard, path: '/dashboard', shortcut: 'D', roles: ['ANY'], keywords: ['inicio', 'home', 'panel', 'resumen'], boost: 8 },
        { id: 'investigacion', label: 'Proyectos de investigación', description: 'Repositorio de proyectos de investigación institucionales', category: 'Navegación', icon: ClipboardList, path: '/investigacion', shortcut: 'P', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'], keywords: ['proyectos', 'investigacion', 'research', 'i+d', 'ciencia'], boost: 9 },
        { id: 'mis-proyectos', label: 'Mis Proyectos', description: 'Proyectos en los que participas directamente', category: 'Navegación', icon: ListChecks, path: '/investigacion/mis-proyectos', roles: ['DIITRA_DOCENTE', 'DIITRA_ESTUDIANTE'], keywords: ['mis proyectos', 'colaboraciones', 'expediente'], boost: isDocente || isEstudiante ? 10 : 5 },
        { id: 'convocatorias', label: 'Convocatorias Activas', description: 'Postulaciones abiertas para proyectos de investigación', category: 'Navegación', icon: PenTool, path: '/convocatorias', shortcut: 'G', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'], keywords: ['convocatoria', 'postular', 'aplicar', 'call', 'becas'], boost: 7 },
        { id: 'revisiones', label: 'Revisiones por Pares', description: 'Evaluaciones de proyectos asignadas para revisión académica', category: 'Navegación', icon: ShieldCheck, path: '/revisiones', shortcut: 'R', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE', 'DIITRA_REVISOR_EXTERNO'], keywords: ['revision', 'peer review', 'evaluar', 'pares', 'dictamen'], boost: isRevisor ? 10 : 6 },
        { id: 'notificaciones', label: 'Centro de Notificaciones', description: 'Historial completo de alertas y mensajes del sistema', category: 'Navegación', icon: Bell, path: '/notificaciones', roles: ['ANY'], keywords: ['notificacion', 'alertas', 'mensajes', 'inbox'], boost: 5 },
        { id: 'verificar', label: 'Verificar Documento', description: 'Comprueba la autenticidad con código QR o de verificación', category: 'Navegación', icon: ShieldCheck, path: '/verificacion', roles: ['ANY'], keywords: ['verificar', 'verificacion', 'documento', 'validar', 'hash', 'qr', 'trazabilidad'], boost: 4 },
        { id: 'grupos', label: 'Grupos de Investigación', description: 'Equipos y colectivos de investigadores registrados', category: 'Navegación', icon: Award, path: '/grupos', roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'], keywords: ['grupos', 'equipos', 'colectivos', 'team'], boost: 6 },
        { id: 'derechos-arco', label: 'Derechos ARCO', description: 'Solicitudes de acceso, rectificación, cancelación u oposición', category: 'Navegación', icon: ShieldCheck, path: '/derechos-arco', roles: ['ANY'], keywords: ['arco', 'lopdp', 'datos personales', 'privacidad'], boost: 3 },
        // ── Administración ────────────────────────────────────────────
        { id: 'analiticas', label: 'Analíticas de Investigación', description: 'Métricas CACES, indicadores y producción académica', category: 'Administración', icon: BarChart3, path: '/analiticas', shortcut: 'A', roles: ['DIITRA_ADMIN'], keywords: ['analitica', 'metricas', 'estadisticas', 'caces', 'kpi', 'reporte'], boost: isAdmin ? 9 : 0 },
        { id: 'analiticas-general', label: 'Métricas Generales I+D', description: 'Indicadores y tendencias de producción investigativa', category: 'Administración', icon: TrendingUp, path: '/analiticas?tab=general', roles: ['DIITRA_ADMIN'], keywords: ['metricas', 'generales', 'tendencias'], boost: 4 },
        { id: 'analiticas-caces', label: 'Cumplimiento CACES', description: 'Indicadores de evaluación y acreditación institucional', category: 'Administración', icon: ShieldCheck, path: '/analiticas?tab=caces', roles: ['DIITRA_ADMIN'], keywords: ['caces', 'acreditacion', 'cumplimiento', 'ceaaces'], boost: 5 },
        { id: 'usuarios', label: 'Gestión de Usuarios', description: 'Administrar cuentas de docentes, estudiantes y externos', category: 'Administración', icon: Users, path: '/usuarios', shortcut: 'U', permission: 'USUARIOS:VER', keywords: ['usuarios', 'cuentas', 'personas', 'perfiles'], boost: isAdmin ? 8 : 0 },
        { id: 'usuarios-docentes', label: 'Usuarios: Docentes', description: 'Lista de docentes e investigadores registrados', category: 'Administración', icon: GraduationCap, path: '/usuarios?type=DOCENTE', permission: 'USUARIOS:VER', keywords: ['docentes', 'profesores', 'planta docente'], boost: 3 },
        { id: 'usuarios-estudiantes', label: 'Usuarios: Estudiantes', description: 'Lista de estudiantes colaboradores', category: 'Administración', icon: Users, path: '/usuarios?type=ESTUDIANTE', permission: 'USUARIOS:VER', keywords: ['estudiantes', 'alumnos', 'colaboradores'], boost: 3 },
        { id: 'usuarios-externos', label: 'Usuarios: Externos', description: 'Revisores externos y usuarios fuera de la institución', category: 'Administración', icon: Globe, path: '/usuarios?type=EXTERNO', permission: 'USUARIOS:VER', keywords: ['externos', 'revisores', 'externo'], boost: 3 },
        { id: 'arbitraje', label: 'Arbitraje', description: 'Gestión de conflictos y resolución de revisiones en disputa', category: 'Administración', icon: Gavel, path: '/arbitraje', roles: ['DIITRA_ADMIN'], keywords: ['arbitraje', 'conflicto', 'disputa', 'apelacion'], boost: isAdmin ? 6 : 0 },
        { id: 'auditoria', label: 'Auditoría del Sistema', description: 'Registro de acciones y cambios en el sistema', category: 'Administración', icon: Activity, path: '/auditoria', roles: ['DIITRA_ADMIN'], keywords: ['auditoria', 'logs', 'forense', 'eventos', 'historial'], boost: isAdmin ? 7 : 0 },
        { id: 'lopdp-admin', label: 'Panel LOPDP', description: 'Gestión de consentimientos y cumplimiento de protección de datos', category: 'Administración', icon: ShieldCheck, path: '/admin/lopdp', roles: ['DIITRA_ADMIN'], keywords: ['lopdp', 'proteccion datos', 'consentimiento', 'rgpd'], boost: 4 },
        { id: 'correos', label: 'Correos institucionales', description: 'Administrar y enviar plantillas de correo del sistema', category: 'Administración', icon: Mail, path: '/admin/emails', roles: ['DIITRA_ADMIN'], keywords: ['correos', 'emails', 'plantillas', 'smtp'], boost: 4 },
        // ── Parámetros Normativos ───────────────────────────────────────
        { id: 'parametros-normativos', label: 'Parámetros Normativos', description: 'Líneas de investigación, períodos académicos e indicadores CACES', category: 'Parámetros Normativos', icon: Settings, path: '/parametros-normativos', roles: ['DIITRA_ADMIN'], keywords: ['parametros', 'normativos', 'caces', 'lineas', 'periodos', 'catalogos'], boost: isAdmin ? 6 : 0 },
        { id: 'config-lineas', label: 'Líneas de Investigación', description: 'Administrar líneas y áreas del conocimiento', category: 'Parámetros Normativos', icon: BookOpen, path: '/parametros-normativos?tab=lineas', roles: ['DIITRA_ADMIN'], keywords: ['lineas', 'areas', 'conocimiento', 'tematica'], boost: 3 },
        { id: 'config-periodos', label: 'Períodos Académicos', description: 'Gestionar ciclos y períodos vigentes', category: 'Parámetros Normativos', icon: Calendar, path: '/parametros-normativos?tab=periodos', roles: ['DIITRA_ADMIN'], keywords: ['periodos', 'ciclos', 'semestre', 'calendario'], boost: 3 },
        { id: 'config-productos', label: 'Tipos de Producto', description: 'Categorías de productos de investigación', category: 'Parámetros Normativos', icon: Tag, path: '/parametros-normativos?tab=productos', roles: ['DIITRA_ADMIN'], keywords: ['productos', 'tipos', 'articulos', 'patentes', 'publicaciones'], boost: 3 },
        { id: 'config-dominios', label: 'Dominios Académicos', description: 'Áreas del conocimiento y dominios científicos', category: 'Parámetros Normativos', icon: Globe, path: '/parametros-normativos?tab=dominios', roles: ['DIITRA_ADMIN'], keywords: ['dominios', 'disciplinas', 'ciencias'], boost: 3 },
        { id: 'config-indicadores', label: 'Indicadores CACES', description: 'Configurar métricas de acreditación institucional', category: 'Parámetros Normativos', icon: Activity, path: '/parametros-normativos?tab=indicadores', roles: ['DIITRA_ADMIN'], keywords: ['indicadores', 'caces', 'acreditacion', 'metricas'], boost: 3 },
        { id: 'settings', label: 'Configuración', description: 'Preferencias de cuenta y ajustes personales', category: 'Configuración', icon: Settings, path: '/configuracion', roles: ['ANY'], keywords: ['perfil', 'cuenta', 'preferencias', 'personal', 'configuracion', 'settings'], boost: 4 },
        // ── Acciones Rápidas ──────────────────────────────────────────
        { id: 'new-project', label: 'Nuevo Proyecto de Investigación', description: 'Iniciar postulación para un nuevo proyecto I+D', category: 'Acciones Rápidas', icon: PlusCircle, shortcut: 'N', action: () => navigate(isAdmin ? '/investigacion' : '/investigacion/mis-proyectos'), roles: ['DIITRA_ADMIN', 'DIITRA_DOCENTE'], keywords: ['nuevo', 'crear', 'postular', 'iniciar', 'registrar', 'nueva investigacion'], boost: isDocente ? 10 : 5 },
        { id: 'export-analiticas', label: 'Exportar Reporte PDF', description: 'Descargar reporte completo de analíticas en PDF', category: 'Acciones Rápidas', icon: FileDown, shortcut: 'E', action: () => navigate('/analiticas'), roles: ['DIITRA_ADMIN'], keywords: ['exportar', 'pdf', 'descargar', 'reporte', 'informe'], boost: isAdmin ? 6 : 0 },
        { id: 'logout', label: 'Cerrar Sesión', description: 'Salir de la sesión actual de forma segura', category: 'Acciones Rápidas', icon: LogOut, action: () => navigate('/login'), roles: ['ANY'], keywords: ['salir', 'cerrar sesion', 'logout', 'desconectar'], boost: 0 },
    ];
}

// ─── Live search helpers ──────────────────────────────────────────────────────

function proyectoToItem(p: any, isMyProject: boolean): SearchItem {
    const cat: Category = isMyProject ? 'Mis Proyectos' : 'Todos los Proyectos';
    return {
        id: `proj-${p.uuid}`,
        label: p.titulo || 'Proyecto sin título',
        description: [p.codigo_institucional, p.linea_investigacion, p.estado].filter(Boolean).join(' · '),
        category: cat,
        icon: FolderOpen,
        path: buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid, '', isMyProject ? '/investigacion/mis-proyectos' : '/investigacion'),
        keywords: [p.codigo_institucional || '', p.linea_investigacion || '', p.estado || ''],
        boost: 0,
        isLive: true,
        badge: p.estado,
    };
}

function convocatoriaToItem(c: any): SearchItem {
    const openParam = c.uuid ? `?open=${c.uuid}` : '';
    return {
        id: `conv-${c.id_convocatoria ?? c.uuid ?? Math.random()}`,
        label: c.titulo || c.nombre || 'Convocatoria',
        description: [c.estado, c.periodo_nombre || c.periodo, c.tipo_agenda].filter(Boolean).join(' · '),
        category: 'Convocatorias',
        icon: PenTool,
        path: `/convocatorias${openParam}`,
        keywords: [c.estado || '', c.periodo_nombre || c.periodo || '', c.codigo_convocatoria || ''],
        boost: 0,
        isLive: true,
        badge: c.estado,
    };
}

let _uidCounter = 0;
function usuarioToItem(u: any): SearchItem {
    // Guarantee a unique id even when api returns users without uuid/id_profesor
    const uid = u.user_uuid || u.id_profesor || u.email || `__anon${++_uidCounter}`;
    // Use id_profesor (cedula) as open param — it's searchable directly via the API
    // and works regardless of pagination. Falls back to user_uuid.
    const openId = u.id_profesor || u.user_uuid;
    const openParam = openId ? `&open=${encodeURIComponent(openId)}` : '';
    return {
        id: `user-${uid}`,
        label: u.nombre_completo || 'Usuario',
        description: [u.email, u.carrera, u.type].filter(Boolean).join(' · '),
        category: 'Usuarios',
        icon: User,
        path: `/usuarios?type=${u.type ?? 'DOCENTE'}${openParam}`,
        keywords: [u.email || '', u.carrera || '', u.id_profesor || ''],
        boost: 0,
        isLive: true,
    };
}

function revisionToItem(r: any): SearchItem {
    // Peer reviews navigate directly to their evaluation page
    return {
        id: `rev-${r.uuid}`,
        label: r.proyecto_titulo || 'Revisión sin título',
        description: [r.estado, r.revisor_nombre, r.es_externo ? 'Par Externo' : null].filter(Boolean).join(' · '),
        category: 'Mis Revisiones',
        icon: ShieldCheck,
        path: `/revisiones/${r.uuid}`,
        keywords: [r.proyecto_titulo || '', r.estado || '', r.revisor_nombre || ''],
        boost: r.estado === 'Pendiente' ? 5 : 0,
        isLive: true,
        badge: r.estado,
    };
}

function grupoToItem(g: any): SearchItem {
    // Groups open their side detail drawer via ?open=UUID in GroupsPage
    return {
        id: `grupo-${g.uuid || g.id_grupo}`,
        label: g.nombre || 'Grupo de Investigación',
        description: [g.siglas, g.tipo_grupo, g.nombre_coordinador].filter(Boolean).join(' · '),
        category: 'Grupos',
        icon: Users,
        path: `/grupos?open=${g.uuid}`,
        keywords: [g.nombre || '', g.siglas || '', g.tipo_grupo || '', g.nombre_coordinador || ''],
        boost: 0,
        isLive: true,
        badge: g.estado,
    };
}

// ─── Main component ───────────────────────────────────────────────────────────

export const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLoadingLive, setIsLoadingLive] = useState(false);
    const [liveItems, setLiveItems] = useState<SearchItem[]>([]);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const { isAdmin, isDocente, isEstudiante, isRevisor, roleDisplayName, hasPermission } = useAuth();
    const passesRoleFilter = useRoleFilter();

    const staticItems = React.useMemo(
        () => buildStaticItems(navigate, isAdmin, isDocente, isEstudiante, isRevisor),
        [navigate, isAdmin, isDocente, isEstudiante, isRevisor]
    );

    // Ref keeps the current flatItems list accessible inside useEffect without
    // triggering re-subscriptions every render. Updated synchronously each render.
    const flatItemsRef = useRef<SearchItem[]>([]);

    // ── Live search from backend ──────────────────────────────────────────────

    const fetchLive = useCallback(async (q: string) => {
        if (abortRef.current) abortRef.current.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        setIsLoadingLive(true);
        const results: SearchItem[] = [];
        const ql = q.toLowerCase();
        const matches = (str: string) => !q || str.toLowerCase().includes(ql);

        try {
            const promises: Promise<void>[] = [];

            // Mis proyectos (docente/estudiante/admin)
            promises.push(
                api.get('/projects/my', { signal: ctrl.signal }).then(res => {
                    const data: any[] = Array.isArray(res.data) ? res.data : [];
                    data
                        .filter(p => matches(p.titulo || '') || matches(p.codigo_institucional || ''))
                        .slice(0, 5)
                        .forEach(p => results.push(proyectoToItem(p, true)));
                }).catch(() => {})
            );

            // Todos los proyectos (admin)
            if (isAdmin) {
                promises.push(
                    api.get('/projects', { signal: ctrl.signal }).then(res => {
                        const data: any[] = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
                        data
                            .filter(p => matches(p.titulo || '') || matches(p.codigo_institucional || ''))
                            .slice(0, 5)
                            .forEach(p => {
                                if (!results.some(r => r.id === `proj-${p.uuid}`)) {
                                    results.push(proyectoToItem(p, false));
                                }
                            });
                    }).catch(() => {})
                );
            }

            // Convocatorias
            promises.push(
                api.get('/Convocatorias', { signal: ctrl.signal }).then(res => {
                    const data: any[] = Array.isArray(res.data) ? res.data : [];
                    data
                        .filter(c => matches(c.titulo || '') || matches(c.codigo_convocatoria || '') || matches(c.periodo_nombre || c.periodo || ''))
                        .slice(0, 4)
                        .forEach(c => results.push(convocatoriaToItem(c)));
                }).catch(() => {})
            );

            // Usuarios (admin con permiso) — busca docentes, estudiantes y externos
            if (isAdmin || hasPermission('USUARIOS', 'VER')) {
                const userTypes = ['DOCENTE', 'ESTUDIANTE', 'EXTERNO'];
                userTypes.forEach(type => {
                    promises.push(
                        api.get(`/Admin/users?search=${encodeURIComponent(q)}&type=${type}&page=1&pageSize=3`, { signal: ctrl.signal }).then(res => {
                            const data: any[] = res.data?.items ?? [];
                            data.forEach(u => {
                                if (!results.some(r => r.id === `user-${u.user_uuid || u.id_profesor}`)) {
                                    results.push(usuarioToItem(u));
                                }
                            });
                        }).catch(() => {})
                    );
                });
            }

            // Mis revisiones por pares — solo si el usuario tiene rol revisor
            // (el endpoint /PeerReviews/my devuelve 404 para roles que no tienen revisiones)
            if (isRevisor) {
                promises.push(
                    api.get('/PeerReviews/my', { signal: ctrl.signal }).then(res => {
                        const data: any[] = Array.isArray(res.data) ? res.data : [];
                        data
                            .filter(r => matches(r.proyecto_titulo || '') || matches(r.estado || '') || matches(r.revisor_nombre || ''))
                            .slice(0, 4)
                            .forEach(r => results.push(revisionToItem(r)));
                    }).catch(() => {})
                );
            }

            // Grupos de investigación
            if (q.length >= 2) { // Solo buscar grupos cuando hay query (evitar cargar lista completa)
                promises.push(
                    api.get(`/Groups?search=${encodeURIComponent(q)}`, { signal: ctrl.signal }).then(res => {
                        const data: any[] = Array.isArray(res.data) ? res.data : [];
                        data
                            .slice(0, 4)
                            .forEach(g => results.push(grupoToItem(g)));
                    }).catch(() => {})
                );
            }

            await Promise.allSettled(promises);

            if (!ctrl.signal.aborted) {
                setLiveItems(results);
            }
        } catch {
            // silently ignore aborts
        } finally {
            if (!ctrl.signal.aborted) {
                setIsLoadingLive(false);
            }
        }
    }, [isAdmin, isDocente, isEstudiante, isRevisor, hasPermission]);

    // Debounced live search
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => {
            fetchLive(query);
        }, query ? 300 : 0);
        return () => clearTimeout(timer);
    }, [query, isOpen, fetchLive]);

    // Close → cancel pending request
    useEffect(() => {
        if (!isOpen && abortRef.current) {
            abortRef.current.abort();
            setLiveItems([]);
            setIsLoadingLive(false);
        }
    }, [isOpen]);

    // ── Merged & scored results ───────────────────────────────────────────────

    const scoredItems = React.useMemo(() => {
        const staticFiltered = staticItems.filter(passesRoleFilter);

        if (!query.trim()) {
            // No query: show top static items sorted by boost
            return staticFiltered
                .sort((a, b) => (b.boost ?? 0) - (a.boost ?? 0))
                .map(item => ({ item, score: item.boost ?? 0, labelRanges: [] as [number, number][] }));
        }

        const results: { item: SearchItem; score: number; labelRanges: [number, number][] }[] = [];

        // Score static items
        for (const item of staticFiltered) {
            const res = scoreItem(item, query);
            if (res && res.score > 0) {
                results.push({ item, score: res.score + (item.boost ?? 0) * 0.5, labelRanges: res.labelRanges });
            }
        }

        // Score live items (already pre-filtered by backend)
        for (const item of liveItems) {
            const res = scoreItem(item, query);
            const score = res && res.score > 0 ? res.score : 20; // live items are always somewhat relevant
            results.push({ item, score, labelRanges: res?.labelRanges ?? [] });
        }

        return results.sort((a, b) => b.score - a.score);
    }, [staticItems, passesRoleFilter, query, liveItems]);

    // flatItems must match the visual grouped order so ↑↓ keyboard navigation
    // moves through items exactly as the user sees them on screen.
    // Defined after grouped (below) and synced into flatItemsRef each render.

    // ── Keyboard handler ──────────────────────────────────────────────────────

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setQuery('');
                setSelectedIndex(0);
                setLiveItems([]);
            }
            if (!isOpen) return;
            const items = flatItemsRef.current;
            if (e.key === 'Escape') { setIsOpen(false); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % items.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + items.length) % items.length); }
            else if (e.key === 'Enter') { e.preventDefault(); handleSelect(items[selectedIndex]); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, selectedIndex]);

    useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

    useEffect(() => {
        if (listRef.current) {
            const el = listRef.current.querySelector(`[data-idx="${selectedIndex}"]`) as HTMLElement;
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const handleSelect = (item: SearchItem | undefined) => {
        if (!item) return;
        if (item.path) navigate(item.path);
        else if (item.action) item.action();
        setIsOpen(false);
    };

    if (!isOpen) return null;

    // ── Grouping ──────────────────────────────────────────────────────────────

    const categoryOrder: Category[] = [
        'Mis Proyectos', 'Todos los Proyectos', 'Mis Revisiones', 'Convocatorias', 'Usuarios', 'Grupos',
        'Navegación', 'Acciones Rápidas', 'Administración', 'Configuración',
    ];

    const categoryIcons: Record<string, React.ReactNode> = {
        'Navegación': <Hash size={10} className="opacity-60" />,
        'Acciones Rápidas': <Zap size={10} className="opacity-60" />,
        'Administración': <Settings size={10} className="opacity-60" />,
        'Configuración': <Settings size={10} className="opacity-60" />,
        'Mis Proyectos': <FolderOpen size={10} className="opacity-60" />,
        'Todos los Proyectos': <ClipboardList size={10} className="opacity-60" />,
        'Convocatorias': <PenTool size={10} className="opacity-60" />,
        'Usuarios': <Users size={10} className="opacity-60" />,
        'Mis Revisiones': <ShieldCheck size={10} className="opacity-60" />,
        'Grupos': <Users size={10} className="opacity-60" />,
    };

    const categoryLabels: Record<string, string> = {
        'Mis Proyectos': 'Mis Proyectos',
        'Todos los Proyectos': 'Proyectos del Sistema',
        'Convocatorias': 'Convocatorias',
        'Usuarios': 'Usuarios',
        'Mis Revisiones': 'Mis Revisiones',
        'Grupos': 'Grupos de Investigación',
        'Navegación': 'Navegación',
        'Acciones Rápidas': 'Acciones Rápidas',
        'Administración': 'Administración',
        'Configuración': 'Configuración',
    };

    const grouped = categoryOrder
        .map(cat => ({ cat, items: scoredItems.filter(s => s.item.category === cat) }))
        .filter(g => g.items.length > 0);

    // ↑↓ navigation order = visual grouped order (not score order)
    const flatItems = grouped.flatMap(g => g.items.map(s => s.item));
    // Sync into ref so the keyboard handler always reads the current list
    flatItemsRef.current = flatItems;

    // Badge color
    const getBadgeClass = (badge?: string) => {
        if (!badge) return '';
        const lower = badge.toLowerCase();
        if (lower.includes('aprobado') || lower.includes('finalizado') || lower.includes('activa')) return 'text-[9px] px-1.5 py-0.5 rounded font-mono bg-success/10 text-success border border-success/20';
        if (lower.includes('revisión') || lower.includes('revision') || lower.includes('enviado')) return 'text-[9px] px-1.5 py-0.5 rounded font-mono bg-warning/10 text-warning border border-warning/20';
        if (lower.includes('rechazado') || lower.includes('cerrada')) return 'text-[9px] px-1.5 py-0.5 rounded font-mono bg-error/10 text-error border border-error/20';
        if (lower.includes('ejecución') || lower.includes('ejecucion')) return 'text-[9px] px-1.5 py-0.5 rounded font-mono bg-brand/10 text-brand border border-brand/20';
        return 'text-[9px] px-1.5 py-0.5 rounded font-mono bg-surface text-text-dim border border-border-thin';
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 bg-black/70 backdrop-blur-[3px]"
            onClick={() => setIsOpen(false)}
        >
            <div
                className="w-full max-w-[580px] bg-bg-deep border border-border-thin rounded-xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.7)] animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center px-4 py-3.5 border-b border-border-thin gap-3">
                    {isLoadingLive
                        ? <Loader2 size={15} className="text-text-dim shrink-0 animate-spin" />
                        : <Search size={15} className="text-text-dim shrink-0" />
                    }
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder={`Buscar en DIITRA${roleDisplayName ? ` · ${roleDisplayName}` : ''}…`}
                        className="flex-1 bg-transparent border-none outline-none text-text-main text-[13px] placeholder:text-text-dim/60 font-sans focus:!outline-none focus:!border-none focus:!shadow-none focus-visible:!outline-none focus-visible:!border-none focus-visible:!shadow-none"
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setSelectedIndex(0); setLiveItems([]); inputRef.current?.focus(); }}
                            className="text-text-dim hover:text-text-main transition-colors text-[11px] border-0 bg-transparent cursor-pointer shrink-0"
                        >
                            Limpiar
                        </button>
                    )}
                    <kbd className="text-[10px] bg-surface px-2 py-1 rounded border border-border-thin text-text-dim font-mono shrink-0">ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[62vh] overflow-y-auto overscroll-contain">
                    {scoredItems.length === 0 && !isLoadingLive ? (
                        <div className="px-4 py-12 text-center space-y-2">
                            <Search size={24} className="mx-auto text-text-dim opacity-20" />
                            <p className="text-sm text-text-dim">Sin resultados para <span className="font-semibold text-text-main">"{query}"</span></p>
                            <p className="text-xs text-text-dim/50">Intenta con palabras como "proyecto", "usuarios", "convocatoria", "analíticas"</p>
                        </div>
                    ) : (
                        <div className="p-1.5 space-y-0.5">
                            {grouped.map(({ cat, items: groupItems }) => (
                                <React.Fragment key={cat}>
                                    <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1">
                                        {categoryIcons[cat]}
                                        <span className="text-[9px] font-bold text-text-dim uppercase tracking-[0.12em]">
                                            {categoryLabels[cat] ?? cat}
                                        </span>
                                        <span className="text-[9px] text-text-dim/40 ml-auto">{groupItems.length}</span>
                                    </div>
                                    {groupItems.map(({ item, labelRanges }) => {
                                        const globalIdx = flatItems.indexOf(item);
                                        const isActive = globalIdx === selectedIndex;
                                        return (
                                            <div
                                                key={item.id}
                                                data-idx={globalIdx}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-100 group ${isActive
                                                        ? 'bg-surface-hover text-text-main'
                                                        : 'hover:bg-surface/50 text-text-dim'
                                                    }`}
                                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                                onClick={() => handleSelect(item)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all duration-100 ${isActive
                                                            ? 'bg-bg-deep border border-border-thin shadow-sm text-text-main'
                                                            : 'text-text-dim group-hover:text-text-main'
                                                        }`}>
                                                        <item.icon size={13} strokeWidth={isActive ? 2 : 1.5} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <HighlightedText
                                                                text={item.label}
                                                                ranges={query ? labelRanges : []}
                                                                className={`text-[13px] font-medium truncate transition-colors ${isActive ? 'text-text-main' : ''}`}
                                                                highlightClass="text-text-main font-bold"
                                                            />
                                                            {item.badge && (
                                                                <span className={`shrink-0 ${getBadgeClass(item.badge)}`}>
                                                                    {item.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.description && (
                                                            <span className={`text-[11px] truncate block transition-colors ${isActive ? 'text-text-dim' : 'text-text-dim/50'}`}>
                                                                {item.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                    {item.shortcut && (
                                                        <kbd className={`text-[10px] px-1.5 py-0.5 rounded border font-mono transition-colors ${isActive
                                                                ? 'bg-bg-deep border-border-thin text-text-main'
                                                                : 'bg-bg-deep border-border-thin text-text-dim/40'
                                                            }`}>
                                                            {item.shortcut}
                                                        </kbd>
                                                    )}
                                                    {isActive && <ArrowRight size={12} className="text-text-dim/40" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            ))}

                            {/* Loading skeleton for live results */}
                            {isLoadingLive && query && (
                                <div className="px-3 pt-2.5 pb-1 space-y-1.5">
                                    <div className="flex items-center gap-1.5 pb-1">
                                        <Loader2 size={10} className="animate-spin opacity-40" />
                                        <span className="text-[9px] font-bold text-text-dim/40 uppercase tracking-[0.12em]">Buscando en el sistema…</span>
                                    </div>
                                    {[1, 2].map(i => (
                                        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg animate-pulse">
                                            <div className="w-7 h-7 rounded-md bg-surface shrink-0" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 bg-surface rounded w-3/4" />
                                                <div className="h-2.5 bg-surface rounded w-1/2" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-border-thin flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] text-text-dim/50">
                        <span className="flex items-center gap-1"><kbd className="font-mono">↑↓</kbd> navegar</span>
                        <span className="flex items-center gap-1"><kbd className="font-mono">↵</kbd> abrir</span>
                        <span className="flex items-center gap-1"><kbd className="font-mono">ESC</kbd> cerrar</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isLoadingLive && <Loader2 size={10} className="animate-spin text-text-dim/40" />}
                        <span className="text-[10px] text-text-dim/30 font-mono">
                            {scoredItems.length} resultado{scoredItems.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
