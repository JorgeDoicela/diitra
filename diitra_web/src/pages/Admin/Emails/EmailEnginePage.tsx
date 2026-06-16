import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../../api/axios_config';
import { buildWorkspacePath } from '../../../core/documents/templateUrl';
import { useConfirm } from '../../../api/ConfirmContext';
import {
    Mail, Plus, Edit2, Trash2, Send, History, FileText, CheckCircle2,
    AlertTriangle, Eye, Loader2, ArrowRight,
    Paperclip, X, RefreshCw, Layers, Shield, Sparkles,
    Search, Users, UserCheck, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
    EmailTemplate, EmailHistorial, Carrera, Proyecto, Convocatoria, PeerReview, AttachmentFile
} from './emailEngineTypes';
import {
    AUTO_TOKENS,
    TEMPLATE_RECOMMENDED_CONTEXT,
    applyTokenReplacements,
    buildBodyWithAdditionalMessage,
    buildEmailSendPayload,
    buildTemplateDataForSend,
    getSubjectVariants,
    getPreviewDefaults,
    getTokenLabel,
    mergeTokenReplacements
} from './emailEngineConfig';
import {
    buildExtraDataForPreview,
    clearContextTokenValues,
    renderMasterLayoutPreview,
    resolveActionUrlForPreview,
    stripEmbeddedContextBlocks
} from './emailPreviewLayout';
import DOMPurify from 'dompurify';

const sanitize = (html: string): string =>
    DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });

const mapTemplateToCamelCase = (t: any): EmailTemplate => {
    if (!t) return t;
    return {
        idEmailTemplate: t.id_email_template !== undefined ? t.id_email_template : t.idEmailTemplate,
        uuid: t.uuid,
        codigo: t.codigo,
        nombre: t.nombre,
        descripcion: t.descripcion,
        asunto: t.asunto,
        cuerpoHtml: t.cuerpo_html !== undefined ? t.cuerpo_html : t.cuerpoHtml,
        activo: t.activo === true || t.activo === 1 || t.activo === '1',
        fechaCreado: t.fecha_creado !== undefined ? t.fecha_creado : t.fechaCreado,
        fechaActualizado: t.fecha_actualizado !== undefined ? t.fecha_actualizado : t.fechaActualizado
    };
};

const mapHistorialToCamelCase = (h: any): EmailHistorial => {
    if (!h) return h;
    return {
        idEmailHistorial: h.id_email_historial !== undefined ? h.id_email_historial : h.idEmailHistorial,
        uuid: h.uuid,
        destinatario: h.destinatario,
        idUsuarioDestinatario: h.id_usuario_destinatario !== undefined ? h.id_usuario_destinatario : h.idUsuarioDestinatario,
        nombreDestinatario: h.nombre_destinatario !== undefined ? h.nombre_destinatario : h.nombreDestinatario,
        asunto: h.asunto,
        cuerpo: h.cuerpo,
        estado: h.estado,
        errorMensaje: h.error_mensaje !== undefined ? h.error_mensaje : h.errorMensaje,
        fechaEnvio: h.fecha_envio !== undefined ? h.fecha_envio : h.fechaEnvio,
        adjuntosJson: h.adjuntos_json !== undefined ? h.adjuntos_json : h.adjuntosJson,
        metadataJson: h.metadata_json !== undefined ? h.metadata_json : h.metadataJson
    };
};

const mapConvocatoriaToCamelCase = (c: any): Convocatoria => {
    if (!c) return c;
    return {
        uuid: c.uuid,
        titulo: c.titulo,
        codigoConvocatoria: c.codigo_convocatoria !== undefined ? c.codigo_convocatoria : c.codigoConvocatoria,
        anio: c.anio,
        presupuestoTotal: c.presupuesto_total !== undefined ? c.presupuesto_total : c.presupuestoTotal,
        montoMaximoProyecto: c.monto_maximo_proyecto !== undefined ? c.monto_maximo_proyecto : c.montoMaximoProyecto,
        fechaApertura: c.fecha_apertura !== undefined ? c.fecha_apertura : c.fechaApertura,
        fechaCierre: c.fecha_cierre !== undefined ? c.fecha_cierre : c.fechaCierre,
        urlBases: c.url_bases !== undefined ? c.url_bases : c.urlBases,
        estado: c.estado
    };
};

const mapCarreraToCamelCase = (c: any): Carrera => {
    if (!c) return c;
    return {
        idCarrera: c.id_carrera !== undefined ? c.id_carrera : c.idCarrera,
        carrera1: c.carrera1,
        aliasCarrera: c.alias_carrera !== undefined ? c.alias_carrera : c.aliasCarrera
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// SELECTOR DE DESTINATARIOS
// ─────────────────────────────────────────────────────────────────────────────

interface SelectedPerson {
    idUsuario?: number;
    nombre: string;
    email: string;
    tipo: string;
    carrera?: string;
}

const USER_TYPES = [
    { value: 'DOCENTE', label: 'Docente' },
    { value: 'ESTUDIANTE', label: 'Estudiante' },
    { value: 'EXTERNO', label: 'Árbitro Externo' }
];

const ROLE_OPTIONS = [
    { value: 'DIITRA_DOCENTE', label: 'Docentes Investigadores' },
    { value: 'DIITRA_ADMIN', label: 'Administradores DIITRA' },
    { value: 'DIITRA_REVISOR_EXTERNO', label: 'Árbitros Externos' },
    { value: 'DIITRA_ESTUDIANTE', label: 'Semilleristas (Estudiantes)' }
];

const TYPE_BADGE: Record<string, string> = {
    DOCENTE: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    ESTUDIANTE: 'bg-green-500/10 text-green-600 dark:text-green-400',
    EXTERNO: 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
};

interface RecipientPickerProps {
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
    carrera: String(u.carrera ?? '').trim()
});

const personKey = (p: SelectedPerson) =>
    p.email ? p.email.toLowerCase() : `id-${p.idUsuario ?? p.nombre}`;

/** Puede enviarse si tiene correo visible o cuenta DIITRA (idUsuario). */
const canSelectPerson = (p: SelectedPerson) =>
    Boolean(p.email?.includes('@')) || (p.idUsuario != null && p.idUsuario > 0);

const RecipientPicker: React.FC<RecipientPickerProps> = ({
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
            const typesToFetch = type ? [type] : (['DOCENTE', 'ESTUDIANTE', 'EXTERNO'] as const);
            const carreraLabel = carreraId
                ? carreras.find(c => c.idCarrera.toString() === carreraId)?.carrera1?.toLowerCase()
                : '';

            const batches = await Promise.all(
                typesToFetch.map(async t => {
                    const params: Record<string, string> = { pageSize: '50', page: '1', type: t };
                    if (q.trim()) params.search = q.trim();
                    const res = await api.get('/Admin/users', { params });
                    const raw = res.data?.items ?? res.data ?? [];
                    return (Array.isArray(raw) ? raw : []).map((u: Record<string, unknown>) =>
                        mapApiUserToPerson(u)
                    );
                })
            );

            const seen = new Set<string>();
            let merged: SelectedPerson[] = [];
            for (const batch of batches) {
                for (const p of batch) {
                    const key = personKey(p);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    merged.push(p);
                }
            }

            if (carreraLabel) {
                merged = merged.filter(
                    p => !p.carrera || p.carrera.toLowerCase().includes(carreraLabel)
                );
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
        <div className="space-y-3 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
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
            <div className="flex border border-border-thin rounded-lg p-0.5 bg-surface/30 gap-0.5">
                {(['personas', 'difusion'] as const).map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`flex-1 text-[9px] font-semibold uppercase tracking-wider py-1.5 rounded-md transition-all cursor-pointer ${mode === m
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
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

// ─────────────────────────────────────────────────────────────────────────────
const EmailEnginePage: React.FC = () => {
    const hasAutoSelectedRef = useRef(false);
    const confirm = useConfirm();

    // Tab State: 'send' | 'templates' | 'history'
    const [activeTab, setActiveTab] = useState<'send' | 'templates' | 'history'>('send');

    // Data lists
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [history, setHistory] = useState<EmailHistorial[]>([]);
    const [historyLimit, setHistoryLimit] = useState<number>(100);
    const [carreras, setCarreras] = useState<Carrera[]>([]);
    const [projects, setProjects] = useState<Proyecto[]>([]);
    const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
    const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);

    // Loading & Operation States
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form: Write Email (sin HTML manual — solo plantillas del sistema)
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [subjectVariantId, setSubjectVariantId] = useState<string>('default');
    const [customSubject, setCustomSubject] = useState<string>('');
    const [additionalMessage, setAdditionalMessage] = useState<string>('');
    // Destinatarios: modo personas específicas
    const [selectedPeople, setSelectedPeople] = useState<SelectedPerson[]>([]);
    // Destinatarios: modo difusión por rol/carrera
    const [selectedRole, setSelectedRole] = useState<string>('');
    const [selectedCarreraId, setSelectedCarreraId] = useState<string>('');
    const [contextType, setContextType] = useState<string>('');
    const [selectedEntityUuid, setSelectedEntityUuid] = useState<string>('');
    const [systemAttachments, setSystemAttachments] = useState<Record<string, boolean>>({
        'PROTOCOLO_INVESTIGACION': false,
        'DICTAMEN_ARBITRAJE': false,
        'RUBRICA_DINAMICA': false
    });
    const [emailSubject, setEmailSubject] = useState<string>('');
    const [emailBody, setEmailBody] = useState<string>('');
    const [detectedTokens, setDetectedTokens] = useState<string[]>([]);
    const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
    const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signaturePassword, setSignaturePassword] = useState<string>('');

    // Form: Manage Templates (Modal / Drawer)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [templateForm, setTemplateForm] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        asunto: '',
        cuerpoHtml: '',
        activo: true
    });
    const [templateError, setTemplateError] = useState('');
    const [showTemplateHtmlEditor, setShowTemplateHtmlEditor] = useState(false);

    // History log inspection Drawer
    const [selectedHistoryLog, setSelectedHistoryLog] = useState<EmailHistorial | null>(null);
    const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

    // Fetch initial templates & catalogs
    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [templatesRes, carrerasRes, projectsRes, convocatoriasRes, arbitrajesRes] = await Promise.all([
                api.get<any[]>('/Admin/email-engine/templates'),
                api.get<Carrera[]>('/catalogs/carreras'),
                api.get<Proyecto[]>('/projects'),
                api.get<any[]>('/Convocatorias'),
                api.get<any[]>('/PeerReviews/arbitraje')
            ]);
            setTemplates(templatesRes.data.map(mapTemplateToCamelCase));
            setCarreras(carrerasRes.data.map(mapCarreraToCamelCase));
            setProjects(projectsRes.data);
            setConvocatorias(convocatoriasRes.data.map(mapConvocatoriaToCamelCase));

            const allReviews: PeerReview[] = [];
            if (Array.isArray(arbitrajesRes.data)) {
                arbitrajesRes.data.forEach((p: any) => {
                    const proyectoTitulo = p.proyecto_titulo || p.proyectoTitulo || 'Sin título';
                    if (Array.isArray(p.revisiones)) {
                        p.revisiones.forEach((r: any) => {
                            allReviews.push({
                                uuid: r.uuid,
                                proyectoTitulo: proyectoTitulo,
                                revisorNombre: r.revisor_nombre || r.revisorNombre || 'Revisor Externo',
                                revisorEmail: r.revisor_email || r.revisorEmail || '',
                                estado: r.estado || 'Pendiente',
                                dictamenRevisor: r.dictamen_revisor || r.dictamenRevisor || 'Pendiente',
                                fechaLimite: r.fecha_limite || r.fechaLimite,
                                puntajeTotal: r.puntaje_total || r.puntajeTotal,
                                observacionesGral: r.observaciones_gral || r.observacionesGral,
                                esExterno: r.es_externo ?? r.esExterno,
                                esDobleCiego: r.es_doble_ciego ?? r.esDobleCiego
                            });
                        });
                    }
                });
            }
            setPeerReviews(allReviews);
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error loading catalogs:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const selectedTemplate = useMemo(
        () => templates.find(t => t.idEmailTemplate.toString() === selectedTemplateId),
        [templates, selectedTemplateId]
    );

    const subjectVariants = useMemo(
        () => (selectedTemplate ? getSubjectVariants(selectedTemplate) : []),
        [selectedTemplate]
    );

    const applyTemplate = useCallback((templateId: string) => {
        const t = templates.find(temp => temp.idEmailTemplate.toString() === templateId);
        if (!t) {
            setSelectedTemplateId('');
            setEmailBody('');
            setSubjectVariantId('default');
            setEmailSubject('');
            setCustomSubject('');
            setContextType('');
            setSelectedEntityUuid('');
            return;
        }

        setSelectedTemplateId(templateId);
        setEmailBody(t.cuerpoHtml);

        const variants = getSubjectVariants(t);
        const defaultVariant = variants[0];
        setSubjectVariantId(defaultVariant?.id ?? 'default');
        setEmailSubject(defaultVariant?.asunto ?? t.asunto);
        setCustomSubject('');

        const recommended = TEMPLATE_RECOMMENDED_CONTEXT[t.codigo];
        if (recommended) {
            setContextType(recommended.entityType);
            setSelectedEntityUuid('');
        }
    }, [templates]);

    useEffect(() => {
        const active = templates.filter(t => t.activo);
        if (active.length > 0 && !selectedTemplateId && !hasAutoSelectedRef.current) {
            applyTemplate(active[0].idEmailTemplate.toString());
            hasAutoSelectedRef.current = true;
        }
    }, [templates, selectedTemplateId, applyTemplate]);

    // Load history when active
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async (limit?: number) => {
        const effectiveLimit = limit ?? historyLimit;
        setRefreshing(true);
        try {
            const res = await api.get<any[]>(`/Admin/email-engine/history?limit=${effectiveLimit}`);
            setHistory(res.data.map(mapHistorialToCamelCase));
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error loading email logs:', e);
        } finally {
            setRefreshing(false);
        }
    };

    // Auto-detect variables tokens like [[variable_name]]
    useEffect(() => {
        const text = emailSubject + ' ' + emailBody;
        const regex = /\[\[([a-zA-Z0-9_]+)\]\]/g;
        const found: string[] = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            const token = match[0];
            if (!found.includes(token)) {
                found.push(token);
            }
        }
        setDetectedTokens(found);

        // Retain current values for existing, initialize empty for new
        setTokenValues(prev => {
            const next: Record<string, string> = {};
            found.forEach(tok => {
                next[tok] = prev[tok] !== undefined ? prev[tok] : '';
            });
            return next;
        });
    }, [emailSubject, emailBody]);

    const handleTemplateChange = (templateId: string) => {
        applyTemplate(templateId);
    };

    const handleSubjectVariantChange = (variantId: string) => {
        setSubjectVariantId(variantId);
        if (variantId === 'personalizado') return;
        const variant = subjectVariants.find(v => v.id === variantId);
        if (variant) setEmailSubject(variant.asunto);
    };

    const buildFinalBody = useCallback(
        () => buildBodyWithAdditionalMessage(emailBody, additionalMessage),
        [emailBody, additionalMessage]
    );

    const resolveFinalSubject = useCallback(() => {
        if (subjectVariantId === 'personalizado') return customSubject.trim() || emailSubject;
        return emailSubject;
    }, [subjectVariantId, customSubject, emailSubject]);

    const userFacingTokens = useMemo(() => {
        return detectedTokens.filter(tok => !AUTO_TOKENS.has(tok) && tok !== '[[mensaje_adicional]]');
    }, [detectedTokens]);

    const autoFilledTokens = useMemo(() => {
        return detectedTokens.filter(tok => AUTO_TOKENS.has(tok));
    }, [detectedTokens]);

    // Vaciar tokens de contexto cuando no hay instancia vinculada (ej. ningún proyecto)
    useEffect(() => {
        if (!contextType) return;
        if (selectedEntityUuid) return;
        setTokenValues(prev => clearContextTokenValues(prev, contextType));
    }, [contextType, selectedEntityUuid]);

    // Auto-inject dynamic context values based on entity type and uuid
    useEffect(() => {
        if (!contextType || !selectedEntityUuid) return;

        if (contextType === 'Proyecto') {
            const p = projects.find(proj => proj.uuid === selectedEntityUuid);
            if (p) {
                setTokenValues(prev => ({
                    ...prev,
                    '[[proyecto_titulo]]': p.titulo || '',
                    '[[proyecto_codigo]]': p.codigo_institucional || 'N/A',
                    '[[proyecto_descripcion]]': p.descripcion || 'Sin descripción',
                    '[[proyecto_estado]]': p.estado || 'En Ejecución',
                    '[[linea_investigacion]]': p.linea_investigacion || 'General',
                    '[[proyecto_workspace_url]]': `${window.location.origin}${buildWorkspacePath('PROTOCOLO_INVESTIGACION', p.uuid)}`
                }));
            }
        } else if (contextType === 'Convocatoria') {
            const c = convocatorias.find(conv => conv.uuid === selectedEntityUuid);
            if (c) {
                setTokenValues(prev => ({
                    ...prev,
                    '[[convocatoria_titulo]]': c.titulo || '',
                    '[[convocatoria_codigo]]': c.codigoConvocatoria || 'N/A',
                    '[[convocatoria_anio]]': (c.anio || new Date().getFullYear()).toString(),
                    '[[convocatoria_apertura]]': c.fechaApertura ? c.fechaApertura.split('T')[0] : '',
                    '[[convocatoria_cierre]]': c.fechaCierre ? c.fechaCierre.split('T')[0] : '',
                    '[[convocatoria_presupuesto]]': c.presupuestoTotal ? `$${c.presupuestoTotal.toLocaleString()}` : '$0.00',
                    '[[convocatoria_monto_maximo]]': (c.montoMaximoProyecto ?? c.presupuestoTotal) ? `$${(c.montoMaximoProyecto ?? c.presupuestoTotal)?.toLocaleString()}` : '$0.00',
                    '[[convocatoria_bases_url]]': c.urlBases || '',
                    '[[convocatoria_estado]]': c.estado || 'Borrador'
                }));
            }
        } else if (contextType === 'PeerReview') {
            const r = peerReviews.find(rev => rev.uuid === selectedEntityUuid);
            if (r) {
                setTokenValues(prev => ({
                    ...prev,
                    '[[revisor_nombre]]': r.revisorNombre || 'Revisor Externo',
                    '[[revisor_email]]': r.revisorEmail || '',
                    '[[proyecto_titulo]]': r.proyectoTitulo || 'Sin título',
                    '[[peer_review_dictamen]]': r.dictamenRevisor || 'Pendiente',
                    '[[peer_review_estado]]': r.estado || 'Pendiente',
                    '[[peer_review_fecha_limite]]': r.fechaLimite ? r.fechaLimite.split('T')[0] : '',
                    '[[peer_review_puntaje]]': r.puntajeTotal?.toString() || '0',
                    '[[peer_review_observaciones]]': r.observacionesGral || '',
                    '[[peer_review_tipo]]': r.esExterno ? 'Externo' : 'Interno',
                    '[[peer_review_anonimo]]': r.esDobleCiego ? 'Anónimo' : 'Abierto'
                }));
            }
        }
    }, [contextType, selectedEntityUuid, projects, convocatorias, peerReviews]);

    // Token value change handler
    const handleTokenValChange = (token: string, value: string) => {
        setTokenValues(prev => ({
            ...prev,
            [token]: value
        }));
    };

    const previewReplacements = useMemo(() => {
        const base = mergeTokenReplacements(tokenValues, window.location.origin);
        if (selectedPeople[0]) {
            base['[[destinatario_nombre]]'] = selectedPeople[0].nombre;
            if (selectedPeople[0].email?.includes('@')) {
                base['[[destinatario_email]]'] = selectedPeople[0].email;
            }
        }
        return base;
    }, [tokenValues, selectedPeople]);

    const hasLinkedContext = Boolean(contextType && selectedEntityUuid);

    const parsedPreview = useMemo(() => {
        const origin = window.location.origin;
        const subjectTemplate = resolveFinalSubject();
        const bodyTemplate = buildFinalBody();
        const subject = applyTokenReplacements(subjectTemplate, previewReplacements, 'text');
        let innerBody = applyTokenReplacements(bodyTemplate, previewReplacements, 'html');
        if (!hasLinkedContext) {
            innerBody = stripEmbeddedContextBlocks(innerBody);
        }
        const recipientName =
            previewReplacements['[[destinatario_nombre]]'] ??
            getPreviewDefaults(origin)['[[destinatario_nombre]]'];
        const extraData = hasLinkedContext
            ? buildExtraDataForPreview(previewReplacements)
            : undefined;
        const actionUrl = hasLinkedContext
            ? resolveActionUrlForPreview(previewReplacements, innerBody, origin)
            : resolveActionUrlForPreview(
                { '[[sistema_url]]': origin },
                innerBody,
                origin
            );
        const fullHtml = renderMasterLayoutPreview({
            title: subject || 'Notificación DIITRA',
            recipientName,
            innerBodyHtml: innerBody,
            origin,
            actionUrl,
            extraData
        });
        return { subject, body: innerBody, fullHtml, recipientName };
    }, [
        previewReplacements,
        resolveFinalSubject,
        buildFinalBody,
        hasLinkedContext
    ]);

    // File selection to Base64
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        Array.from(e.target.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const base64String = (event.target.result as string).split(',')[1];
                    setAttachments(prev => [
                        ...prev,
                        {
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            base64: base64String
                        }
                    ]);
                }
            };
            reader.readAsDataURL(file);
        });
        // Reset file input
        e.target.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    // Send Email dispatch handler
    const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);
    const handleSendEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSendResult(null);

        const emailsList = Array.from(new Set(
            selectedPeople.map(p => p.email).filter(e => e.includes('@'))
        ));
        const userIdsList = Array.from(new Set(
            selectedPeople
                .filter(p => p.idUsuario != null && p.idUsuario > 0)
                .map(p => p.idUsuario as number)
        ));

        if (!selectedTemplateId || !selectedTemplate) {
            setSendResult({ success: false, message: 'Seleccione un tipo de comunicación (plantilla) para continuar.' });
            setSending(false);
            return;
        }

        if (emailsList.length === 0 && userIdsList.length === 0 && !selectedRole && !selectedCarreraId) {
            setSendResult({ success: false, message: 'Debe agregar al menos un destinatario o seleccionar un filtro de rol/carrera.' });
            setSending(false);
            return;
        }

        const finalSubject = resolveFinalSubject();
        const finalBody = buildFinalBody();
        if (!finalSubject.trim()) {
            setSendResult({ success: false, message: 'El asunto del correo no puede estar vacío.' });
            setSending(false);
            return;
        }

        let certificateBase64: string | null = null;
        if (signatureFile) {
            certificateBase64 = await new Promise<string | null>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        const base64String = (event.target.result as string).split(',')[1];
                        resolve(base64String);
                    } else {
                        resolve(null);
                    }
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(signatureFile);
            });
        }

        const payload = buildEmailSendPayload({
            templateCodigo: selectedTemplate.codigo,
            destinatariosEmails: emailsList,
            destinatariosUserIds: userIdsList,
            targetRole: selectedRole || null,
            targetCarreraId: selectedCarreraId ? parseInt(selectedCarreraId, 10) : null,
            customSubject: finalSubject,
            customBody: finalBody,
            templateData: buildTemplateDataForSend(tokenValues),
            attachments: [
                ...attachments.map(a => ({
                    nombreArchivo: a.name,
                    base64Content: a.base64,
                    contentType: a.type
                })),
                ...Object.entries(systemAttachments)
                    .filter(([_, active]) => active)
                    .map(([code]) => ({
                        nombreArchivo: `${code.toLowerCase()}_autogenerado.pdf`,
                        rutaArchivo: `SYSTEM:${code}`,
                        contentType: 'application/pdf'
                    }))
            ],
            entityUuid: selectedEntityUuid || null,
            entityType: contextType || null,
            certificateBase64: certificateBase64,
            signaturePassword: signaturePassword || null
        });

        try {
            const res = await api.post('/Admin/email-engine/send', payload);
            setSendResult({ success: true, message: res.data.message || 'Correos enviados con éxito.' });

            // Clean fields upon success
            setSelectedPeople([]);
            setAttachments([]);
            setContextType('');
            setSelectedEntityUuid('');
            setSystemAttachments({
                'PROTOCOLO_INVESTIGACION': false,
                'DICTAMEN_ARBITRAJE': false,
                'RUBRICA_DINAMICA': false
            });
            setSelectedRole('');
            setSelectedCarreraId('');
            setTokenValues({});
            setAdditionalMessage('');
            setSignatureFile(null);
            setSignaturePassword('');
            if (selectedTemplateId) applyTemplate(selectedTemplateId);
        } catch (err: any) {
            console.error('[DIITRA EMAIL ENGINE] Error sending templated email:', err);
            const apiMessage = err.response?.data?.message;
            setSendResult({
                success: false,
                message: apiMessage
                    || (err.response?.status === 400
                        ? 'No se encontraron destinatarios válidos. Verifique los correos ingresados.'
                        : 'Error al despachar el correo. Revise el historial de envíos o la configuración del servidor de correo.')
            });
        } finally {
            setSending(false);
        }
    };

    // CRUD Templates Form Handlers
    const openCreateTemplateModal = () => {
        setEditingTemplate(null);
        setTemplateForm({
            codigo: '',
            nombre: '',
            descripcion: '',
            asunto: '',
            cuerpoHtml: '<p style="color:#444;font-size:14px;line-height:1.6;">Mensaje principal de la plantilla. El diseño institucional (logos y pie de página) se aplica automáticamente al enviar.</p>\n<p style="color:#444;font-size:14px;line-height:1.6;">Puede usar datos dinámicos como [[proyecto_titulo]] o [[convocatoria_titulo]].</p>',
            activo: true
        });
        setTemplateError('');
        setShowTemplateHtmlEditor(false);
        setIsTemplateModalOpen(true);
    };

    const openEditTemplateModal = (t: EmailTemplate) => {
        setEditingTemplate(t);
        setTemplateForm({
            codigo: t.codigo,
            nombre: t.nombre,
            descripcion: t.descripcion || '',
            asunto: t.asunto,
            cuerpoHtml: t.cuerpoHtml,
            activo: t.activo
        });
        setTemplateError('');
        setShowTemplateHtmlEditor(false);
        setIsTemplateModalOpen(true);
    };

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setTemplateError('');
        if (!templateForm.codigo.trim() || !templateForm.nombre.trim() || !templateForm.asunto.trim() || !templateForm.cuerpoHtml.trim()) {
            setTemplateError('Todos los campos marcados con asterisco son obligatorios.');
            return;
        }

        try {
            if (editingTemplate) {
                // Update
                // NOTA: Se usan claves snake_case (id_email_template, cuerpo_html) en el payload para cumplir
                // con la política global de serialización SnakeCaseLower del backend (mapea a EmailTemplateDto).
                const payload = {
                    id_email_template: editingTemplate.idEmailTemplate,
                    uuid: editingTemplate.uuid,
                    codigo: templateForm.codigo.trim(),
                    nombre: templateForm.nombre.trim(),
                    descripcion: templateForm.descripcion.trim(),
                    asunto: templateForm.asunto.trim(),
                    cuerpo_html: templateForm.cuerpoHtml,
                    activo: templateForm.activo
                };
                const res = await api.put<any>(`/Admin/email-engine/templates/${editingTemplate.idEmailTemplate}`, payload);
                const saved = mapTemplateToCamelCase(res.data);
                setTemplates(prev => prev.map(t => t.idEmailTemplate === editingTemplate.idEmailTemplate ? saved : t));
            } else {
                // Create
                // NOTA: Se usan claves snake_case (cuerpo_html) en el payload para cumplir con la política
                // global de serialización SnakeCaseLower del backend.
                const payload = {
                    codigo: templateForm.codigo.trim(),
                    nombre: templateForm.nombre.trim(),
                    descripcion: templateForm.descripcion.trim(),
                    asunto: templateForm.asunto.trim(),
                    cuerpo_html: templateForm.cuerpoHtml,
                    activo: templateForm.activo
                };
                const res = await api.post<any>('/Admin/email-engine/templates', payload);
                const saved = mapTemplateToCamelCase(res.data);
                setTemplates(prev => [saved, ...prev]);
            }
            setIsTemplateModalOpen(false);
        } catch (err: any) {
            console.error('[DIITRA EMAIL ENGINE] Error saving template:', err);
            setTemplateError(err.response?.data || 'Error al guardar la plantilla. Asegúrese de que el código no esté duplicado.');
        }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!await confirm({
            title: "Eliminar Plantilla",
            message: "¿Está seguro de eliminar esta plantilla de correo de forma permanente?",
            confirmText: "Eliminar",
            cancelText: "Cancelar",
            variant: "destructive"
        })) return;
        try {
            await api.delete(`/Admin/email-engine/templates/${id}`);
            setTemplates(prev => prev.filter(t => t.idEmailTemplate !== id));
        } catch (e) {
            console.error('[DIITRA EMAIL ENGINE] Error deleting template:', e);
            alert('No se pudo eliminar la plantilla.');
        }
    };

    // Helper for history status badges
    const getStatusBadge = (state: string) => {
        switch (state.toUpperCase()) {
            case 'ENVIADO':
                return 'badge-vercel-success';
            case 'FALLIDO':
                return 'badge-vercel-error';
            default:
                return 'badge-vercel-warning';
        }
    };

    const getStatusDot = (state: string) => {
        switch (state.toUpperCase()) {
            case 'ENVIADO':
                return 'dot-success';
            case 'FALLIDO':
                return 'dot-error';
            default:
                return 'dot-neutral';
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto">
                {/* Brand Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 animate-fade-up">
                    <div className="space-y-2">
                        <div className="section-label text-brand">
                            <Mail size={10} strokeWidth={2} />
                            <span>Comunicaciones de Investigación</span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight leading-none">
                            Correos DIITRA
                        </h2>
                        <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                            Comunicaciones guiadas por plantillas del sistema: el contenido se arma automáticamente según el contexto que seleccione.
                        </p>
                    </div>

                    {/* Tabs Control */}
                    <div className="flex border border-border-thin bg-surface rounded-lg p-1 select-none">
                        <button
                            onClick={() => setActiveTab('send')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'send'
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <Send size={12} />
                            Redactar
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'templates'
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <Layers size={12} />
                            Plantillas
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-all cursor-pointer ${activeTab === 'history'
                                ? 'bg-bg-deep border border-border-thin text-text-main shadow-sm'
                                : 'text-text-dim hover:text-text-main'
                                }`}
                        >
                            <History size={12} />
                            Historial
                        </button>
                    </div>
                </header>

                {/* Loading state indicator */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-brand" size={32} />
                    </div>
                )}

                {!loading && (
                    <div className="animate-fade-up [animation-delay:100ms]">
                        {/* TAB 1: REDACTAR CORREO */}
                        {activeTab === 'send' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Form Panel */}
                                <div className="bento-card static p-6 space-y-6">
                                    <h3 className="text-base font-semibold text-text-main uppercase tracking-tight pb-3 border-b border-border-thin flex items-center gap-2">
                                        <Send size={16} className="text-brand" /> Asistente de Envío
                                    </h3>

                                    <form onSubmit={handleSendEmail} className="space-y-6">
                                        {/* Tipo de comunicación */}
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                                                Tipo de comunicación *
                                            </label>
                                            <select
                                                className="input-vercel text-sm"
                                                value={selectedTemplateId}
                                                onChange={e => handleTemplateChange(e.target.value)}
                                            >
                                                <option value="">— Ninguno / Seleccione qué desea notificar —</option>
                                                {templates.filter(t => t.activo).map(t => (
                                                    <option key={t.idEmailTemplate} value={t.idEmailTemplate.toString()}>
                                                        {t.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedTemplate?.descripcion && (
                                                <p className="text-[10px] text-text-dim leading-relaxed p-3 bg-brand/5 border border-brand/20 rounded-lg">
                                                    {selectedTemplate.descripcion}
                                                </p>
                                            )}
                                        </div>

                                        {/* Selector inteligente de destinatarios */}
                                        <RecipientPicker
                                            carreras={carreras}
                                            selected={selectedPeople}
                                            onSelected={setSelectedPeople}
                                            broadcastRole={selectedRole}
                                            onBroadcastRole={setSelectedRole}
                                            broadcastCarreraId={selectedCarreraId}
                                            onBroadcastCarreraId={setSelectedCarreraId}
                                        />

                                        {/* Dual System Context Selection */}
                                        <div className="space-y-4 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Vincular al sistema</span>
                                                <span className="text-[9px] font-mono text-brand font-semibold flex items-center gap-1">
                                                    <Sparkles size={10} /> Datos automáticos
                                                </span>
                                            </div>
                                            {selectedTemplate && TEMPLATE_RECOMMENDED_CONTEXT[selectedTemplate.codigo] && (
                                                <p className="text-[9px] text-text-dim leading-relaxed -mt-2">
                                                    {TEMPLATE_RECOMMENDED_CONTEXT[selectedTemplate.codigo].hint}
                                                </p>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Entity Type Select */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Tipo de Entidad</label>
                                                    <select
                                                        className="input-vercel !py-2 text-xs"
                                                        value={contextType}
                                                        onChange={e => {
                                                            setContextType(e.target.value);
                                                            setSelectedEntityUuid('');
                                                        }}
                                                    >
                                                        <option value="">-- Sin Contexto --</option>
                                                        <option value="Proyecto">Proyecto de Investigación</option>
                                                        <option value="Convocatoria">Convocatoria Oficial</option>
                                                        <option value="PeerReview">Evaluación de Pares (Arbitraje)</option>
                                                    </select>
                                                </div>

                                                {/* Instance Select */}
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Instancia del Sistema</label>
                                                    <select
                                                        className="input-vercel !py-2 text-xs"
                                                        disabled={!contextType}
                                                        value={selectedEntityUuid}
                                                        onChange={e => setSelectedEntityUuid(e.target.value)}
                                                    >
                                                        <option value="">
                                                            {contextType === 'Proyecto'
                                                                ? '— Ningún proyecto (sin detalles) —'
                                                                : contextType === 'Convocatoria'
                                                                    ? '— Ninguna convocatoria —'
                                                                    : contextType === 'PeerReview'
                                                                        ? '— Ninguna evaluación —'
                                                                        : '— Sin instancia —'}
                                                        </option>
                                                        {contextType === 'Proyecto' && projects.map(p => (
                                                            <option key={p.uuid} value={p.uuid}>
                                                                {p.codigo_institucional ? `[${p.codigo_institucional}] ` : ''}{p.titulo}
                                                            </option>
                                                        ))}
                                                        {contextType === 'Convocatoria' && convocatorias.map(c => (
                                                            <option key={c.uuid} value={c.uuid}>
                                                                {c.codigoConvocatoria ? `[${c.codigoConvocatoria}] ` : ''}{c.titulo}
                                                            </option>
                                                        ))}
                                                        {contextType === 'PeerReview' && peerReviews.map(r => (
                                                            <option key={r.uuid} value={r.uuid}>
                                                                [{r.estado.toUpperCase()}] {r.proyectoTitulo.substring(0, 30)}... ({r.revisorNombre})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Asunto — variantes predefinidas */}
                                        <div className="space-y-3 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                                            <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                                                Título del correo (asunto)
                                            </label>
                                            <select
                                                className="input-vercel text-sm"
                                                value={subjectVariantId}
                                                onChange={e => handleSubjectVariantChange(e.target.value)}
                                                disabled={!selectedTemplate}
                                            >
                                                {subjectVariants.map(v => (
                                                    <option key={v.id} value={v.id}>{v.label}</option>
                                                ))}
                                                <option value="personalizado">Escribir asunto personalizado…</option>
                                            </select>
                                            {subjectVariantId === 'personalizado' ? (
                                                <input
                                                    type="text"
                                                    className="input-vercel text-sm"
                                                    value={customSubject}
                                                    onChange={e => setCustomSubject(e.target.value)}
                                                    placeholder="Ej: DIITRA — Comunicado institucional"
                                                />
                                            ) : (
                                                <p className="text-[10px] text-text-main bg-surface/50 p-2 rounded-lg border border-border-thin leading-relaxed">
                                                    {parsedPreview.subject || '—'}
                                                </p>
                                            )}
                                        </div>

                                        {/* Nota adicional en texto plano */}
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                                                Nota adicional (opcional)
                                            </label>
                                            <textarea
                                                rows={3}
                                                className="input-vercel text-sm leading-relaxed"
                                                value={additionalMessage}
                                                onChange={e => setAdditionalMessage(e.target.value)}
                                                placeholder="Texto breve que se agregará al mensaje institucional. No necesita formato especial."
                                            />
                                        </div>

                                        {/* Datos automáticos del sistema */}
                                        {autoFilledTokens.length > 0 && (
                                            <div className="space-y-2 p-3 rounded-xl border border-border-thin bg-success-subtle/30">
                                                <span className="text-[9px] font-black text-success uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={11} /> Se completan solos al enviar
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {autoFilledTokens.map(tok => (
                                                        <span key={tok} className="text-[8px] px-2 py-0.5 rounded-full bg-surface border border-border-thin text-text-dim">
                                                            {getTokenLabel(tok)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Campos editables con etiquetas en español */}
                                        {userFacingTokens.length > 0 && (
                                            <div className="space-y-4 p-4 bg-warning/5 border border-warning/20 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <Layers size={14} className="text-warning" />
                                                    <h5 className="text-[10px] font-black text-warning uppercase tracking-widest">
                                                        Datos del mensaje ({userFacingTokens.length})
                                                    </h5>
                                                </div>
                                                <p className="text-[9px] text-text-dim leading-relaxed">
                                                    Revise o complete estos campos. Si eligió un proyecto, convocatoria o revisión arriba, muchos se llenan automáticamente.
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {userFacingTokens.map(tok => {
                                                        const meta = { label: getTokenLabel(tok) };
                                                        const filled = Boolean(tokenValues[tok]?.trim());
                                                        return (
                                                            <div key={tok} className="space-y-1">
                                                                <span className="text-[10px] font-bold text-text-main flex items-center gap-1">
                                                                    {meta.label}
                                                                    {filled && contextType && (
                                                                        <span className="text-[8px] text-success font-normal">✓ auto</span>
                                                                    )}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    className="input-vercel !py-1.5 text-xs bg-bg-deep border-border-thin focus:border-warning font-sans"
                                                                    value={tokenValues[tok] || ''}
                                                                    onChange={e => handleTokenValChange(tok, e.target.value)}
                                                                    placeholder={`Ingrese ${meta.label.toLowerCase()}`}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Documentos del Sistema Checkboxes */}
                                        <div className="space-y-3 p-4 bg-bg-deep/40 rounded-xl border border-border-thin">
                                            <div className="flex items-center justify-between border-b border-border-thin pb-2">
                                                <span className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                                                    <FileText size={12} className="text-brand" /> Documentos del Sistema (PDF Autogenerado)
                                                </span>
                                                <span className="text-[8px] font-mono text-brand font-semibold uppercase tracking-wider">Generación al Vuelo</span>
                                            </div>
                                            <div className="space-y-2.5 pt-1">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="sys-protocolo"
                                                        disabled={!selectedEntityUuid}
                                                        checked={systemAttachments['PROTOCOLO_INVESTIGACION']}
                                                        onChange={e => setSystemAttachments(prev => ({ ...prev, 'PROTOCOLO_INVESTIGACION': e.target.checked }))}
                                                        className="rounded border-border-thin text-brand focus:ring-brand shrink-0 cursor-pointer disabled:opacity-50"
                                                    />
                                                    <label htmlFor="sys-protocolo" className={`text-xs font-bold select-none cursor-pointer ${!selectedEntityUuid ? 'text-text-dim/40' : 'text-text-main hover:text-brand transition-colors'} flex items-center gap-1.5`}>
                                                        Generar Ficha / Protocolo de Investigación
                                                        {!selectedEntityUuid && <span className="text-[9px] text-text-dim font-normal italic">(Requiere seleccionar un contexto)</span>}
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="sys-dictamen"
                                                        disabled={!selectedEntityUuid}
                                                        checked={systemAttachments['DICTAMEN_ARBITRAJE']}
                                                        onChange={e => setSystemAttachments(prev => ({ ...prev, 'DICTAMEN_ARBITRAJE': e.target.checked }))}
                                                        className="rounded border-border-thin text-brand focus:ring-brand shrink-0 cursor-pointer disabled:opacity-50"
                                                    />
                                                    <label htmlFor="sys-dictamen" className={`text-xs font-bold select-none cursor-pointer ${!selectedEntityUuid ? 'text-text-dim/40' : 'text-text-main hover:text-brand transition-colors'} flex items-center gap-1.5`}>
                                                        Generar Acta de Dictamen de Arbitraje CACES
                                                        {!selectedEntityUuid && <span className="text-[9px] text-text-dim font-normal italic">(Requiere seleccionar un contexto)</span>}
                                                    </label>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id="sys-rubrica"
                                                        disabled={!selectedEntityUuid}
                                                        checked={systemAttachments['RUBRICA_DINAMICA']}
                                                        onChange={e => setSystemAttachments(prev => ({ ...prev, 'RUBRICA_DINAMICA': e.target.checked }))}
                                                        className="rounded border-border-thin text-brand focus:ring-brand shrink-0 cursor-pointer disabled:opacity-50"
                                                    />
                                                    <label htmlFor="sys-rubrica" className={`text-xs font-bold select-none cursor-pointer ${!selectedEntityUuid ? 'text-text-dim/40' : 'text-text-main hover:text-brand transition-colors'} flex items-center gap-1.5`}>
                                                        Generar Rúbrica de Evaluación Dinámica
                                                        {!selectedEntityUuid && <span className="text-[9px] text-text-dim font-normal italic">(Requiere seleccionar un contexto)</span>}
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Firma Electrónica (.p12) para adjuntos del sistema (DIITRA Builder Style) */}
                                            {Object.values(systemAttachments).some(v => v) && (
                                                <div className="mt-4 pt-3 border-t border-border-thin space-y-3 animate-fade-in">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1">
                                                            <Shield size={11} className="text-brand" /> Firma Electrónica (.p12)
                                                        </span>
                                                        <span className="text-[8px] text-text-dim uppercase tracking-wider">Opcional para Actas/Rúbricas</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Archivo de Firma (.p12)</label>
                                                            <input
                                                                type="file"
                                                                accept=".p12,.pfx"
                                                                onChange={e => setSignatureFile(e.target.files?.[0] || null)}
                                                                className="w-full text-xs text-text-dim file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[8px] file:font-black file:uppercase file:tracking-widest file:bg-bg-deep file:text-text-main hover:file:opacity-85 file:cursor-pointer border border-border-thin rounded p-1.5 bg-bg-deep/20"
                                                            />
                                                            {signatureFile && (
                                                                <span className="text-[8px] text-brand block mt-0.5 truncate">
                                                                    ✓ {signatureFile.name} ({(signatureFile.size / 1024).toFixed(1)} KB)
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Contraseña de la Firma</label>
                                                            <input
                                                                type="password"
                                                                placeholder="Clave de Certificado"
                                                                value={signaturePassword}
                                                                onChange={e => setSignaturePassword(e.target.value)}
                                                                className="input-vercel !py-1.5 text-xs font-sans"
                                                            />
                                                        </div>
                                                    </div>

                                                    <p className="text-[8px] text-text-dim/80 leading-relaxed italic">
                                                        * Al cargar tu firma y clave, los PDFs autogenerados se sellarán digitalmente antes de enviarse. Usa la clave <strong className="font-mono text-brand">diitra2026</strong> para bypass / demo en servidor.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Attachments Section */}
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider flex items-center justify-between">
                                                <span>Archivos Adjuntos</span>
                                                <label className="text-[10px] text-brand font-bold uppercase tracking-wider cursor-pointer hover:underline flex items-center gap-1">
                                                    <Paperclip size={12} />
                                                    Agregar Archivos
                                                    <input
                                                        type="file"
                                                        multiple
                                                        className="hidden"
                                                        onChange={handleFileChange}
                                                    />
                                                </label>
                                            </label>

                                            {attachments.length > 0 ? (
                                                <div className="divide-y divide-border-thin border border-border-thin rounded-xl overflow-hidden bg-bg-deep/40">
                                                    {attachments.map((file, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 text-xs">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <FileText size={15} className="text-text-dim shrink-0" />
                                                                <span className="font-mono text-xs truncate text-text-main">{file.name}</span>
                                                                <span className="text-[9px] text-text-dim/60 font-mono">
                                                                    ({(file.size / 1024).toFixed(1)} KB)
                                                                </span>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachment(idx)}
                                                                className="p-1 rounded-lg text-text-dim hover:text-error hover:bg-error-subtle transition-all cursor-pointer"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 border border-dashed border-border-thin rounded-xl bg-bg-deep/10">
                                                    <Paperclip size={18} className="mx-auto text-text-dim/30 mb-1" />
                                                    <span className="text-[10px] text-text-dim uppercase font-bold tracking-wider">Sin archivos adjuntos</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Status Alert Banner */}
                                        {sendResult && (
                                            <div className={`p-4 rounded-xl border flex items-start gap-3 ${sendResult.success
                                                ? 'bg-success-subtle border-success/30 text-success'
                                                : 'bg-error-subtle border-error/30 text-error'
                                                }`}>
                                                {sendResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                                                <div className="space-y-1">
                                                    <h5 className="text-xs font-bold uppercase tracking-tight">
                                                        {sendResult.success ? 'Despacho Exitoso' : 'Error en Emisión'}
                                                    </h5>
                                                    <p className="text-[11px] leading-relaxed text-text-main">{sendResult.message}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit button */}
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className="btn-vercel-primary w-full py-3 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sending ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={14} />
                                                    <span>Enviando correos...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={14} />
                                                    <span>Despachar Correos</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>

                                {/* Preview Panel — simulación Outlook + plantilla maestra */}
                                <div className="space-y-3">
                                    <h4 className="text-[11px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-2 ml-1">
                                        <Eye size={13} /> Vista previa (como lo verá el destinatario)
                                    </h4>

                                    <div className="rounded-xl border border-[#d1d1d1] overflow-hidden shadow-md bg-white min-h-[520px] flex flex-col">
                                        {/* Barra superior estilo Outlook */}
                                        <div className="bg-[#f0f0f0] border-b border-[#d1d1d1] px-4 py-3 flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-[#0078d4] text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
                                                    DI
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-[#242424] truncate">
                                                        DIITRA Investigación
                                                    </div>
                                                    <div className="text-xs text-[#616161] mt-0.5 truncate">
                                                        Para: <span className="font-medium text-[#242424]">{parsedPreview.recipientName}</span>
                                                        {previewReplacements['[[destinatario_email]]'] && (
                                                            <span className="text-[#616161]"> &lt;{previewReplacements['[[destinatario_email]]']}&gt;</span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-semibold text-[#242424] mt-1.5 truncate">
                                                        {parsedPreview.subject || '(Sin asunto)'}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-[#616161] shrink-0 whitespace-nowrap">
                                                {format(new Date(), "EEE dd/MM/yyyy HH:mm", { locale: es })}
                                            </span>
                                        </div>

                                        {/* Cuerpo del correo con plantilla maestra */}
                                        <div className="flex-1 bg-[#fafafa] min-h-[420px]">
                                            {parsedPreview.fullHtml ? (
                                                <iframe
                                                    title="Vista previa del correo institucional"
                                                    srcDoc={parsedPreview.fullHtml}
                                                    className="w-full h-[min(72vh,640px)] border-0 bg-[#fafafa]"
                                                    sandbox="allow-scripts"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                                    <Mail size={32} className="stroke-1 opacity-40 mb-2" />
                                                    <span className="text-xs">Seleccione un tipo de comunicación</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: GESTIÓN DE PLANTILLAS */}
                        {activeTab === 'templates' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Plantillas del Sistema</h3>
                                    <button
                                        onClick={openCreateTemplateModal}
                                        className="btn-vercel-primary text-xs !py-2 flex items-center gap-2 cursor-pointer"
                                    >
                                        <Plus size={14} /> Nueva Plantilla
                                    </button>
                                </div>

                                <div className="bento-card static overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[800px]">
                                            <thead>
                                                <tr className="bg-surface/50 border-b border-border-thin">
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/4">Nombre / Código</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/3">Descripción</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/4">Asunto</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-24">Estado</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase text-right w-24">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-thin">
                                                {templates.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-12 text-center text-text-dim">
                                                            No se encontraron plantillas. Registre una para comenzar.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    templates.map(t => (
                                                        <tr key={t.idEmailTemplate} className="hover:bg-surface/20 transition-all">
                                                            <td className="p-4">
                                                                <div className="font-bold text-text-main text-xs">{t.nombre}</div>
                                                                <div className="text-[10px] font-mono text-brand mt-0.5">{t.codigo}</div>
                                                            </td>
                                                            <td className="p-4 text-xs text-text-dim leading-relaxed">
                                                                {t.descripcion || '—'}
                                                            </td>
                                                            <td className="p-4 text-xs font-mono text-text-main truncate max-w-xs" title={t.asunto}>
                                                                {t.asunto}
                                                            </td>
                                                            <td className="p-4">
                                                                <span className={`status-tag ${t.activo ? 'badge-vercel-success' : 'badge-vercel-neutral'}`}>
                                                                    {t.activo ? 'Activa' : 'Inactiva'}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => openEditTemplateModal(t)}
                                                                        className="p-1.5 rounded-lg border border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover/50 transition-all cursor-pointer"
                                                                        title="Editar Plantilla"
                                                                    >
                                                                        <Edit2 size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteTemplate(t.idEmailTemplate)}
                                                                        className="p-1.5 rounded-lg border border-border-thin text-text-dim hover:text-error hover:bg-error-subtle transition-all cursor-pointer"
                                                                        title="Eliminar Plantilla"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: HISTORIAL DE ENVÍOS */}
                        {activeTab === 'history' && (
                            <div className="space-y-6">
                                <div className="flex flex-wrap justify-between items-center gap-3">
                                    <h3 className="text-sm font-bold text-text-main uppercase tracking-widest flex items-center gap-2">
                                        Registro de auditoría LOPDP
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 border border-border-thin rounded-lg px-3 py-1.5 bg-surface/30">
                                            <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Mostrar:</span>
                                            {[50, 100, 250, 500].map(n => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => {
                                                        setHistoryLimit(n);
                                                        fetchHistory(n);
                                                    }}
                                                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${historyLimit === n ? 'bg-brand text-white' : 'text-text-dim hover:text-text-main'}`}
                                                >
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => fetchHistory()}
                                            disabled={refreshing}
                                            className="btn-vercel-secondary text-xs !py-2 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                        >
                                            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                                            Refrescar
                                        </button>
                                    </div>
                                </div>

                                <div className="bento-card static overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[900px]">
                                            <thead>
                                                <tr className="bg-surface/50 border-b border-border-thin">
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/5">Fecha y Hora</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/4">Destinatario</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/3">Asunto</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-28">Estado</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-20">Adjuntos</th>
                                                    <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase text-right w-20">Inspección</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border-thin">
                                                {refreshing && history.length === 0 ? (
                                                    Array.from({ length: 5 }).map((_, i) => (
                                                        <tr key={i} className="animate-pulse">
                                                            <td colSpan={6} className="p-4"><div className="h-4 bg-surface rounded w-full" /></td>
                                                        </tr>
                                                    ))
                                                ) : history.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-12 text-center text-text-dim">
                                                            No se registran envíos en el historial de correos.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    history.map(log => {
                                                        let attCount = 0;
                                                        try {
                                                            if (log.adjuntosJson) {
                                                                const parsed = JSON.parse(log.adjuntosJson);
                                                                if (Array.isArray(parsed)) attCount = parsed.length;
                                                            }
                                                        } catch { }

                                                        return (
                                                            <tr
                                                                key={log.idEmailHistorial}
                                                                onClick={() => {
                                                                    setSelectedHistoryLog(log);
                                                                    setIsHistoryDrawerOpen(true);
                                                                }}
                                                                className="group hover:bg-surface/30 transition-all cursor-pointer"
                                                            >
                                                                <td className="p-4 whitespace-nowrap">
                                                                    <div className="text-[11px] font-mono text-text-main">
                                                                        {log.fechaEnvio ? format(new Date(log.fechaEnvio), "dd MMM yyyy, HH:mm:ss", { locale: es }) : '—'}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="text-xs font-bold text-text-main">{log.nombreDestinatario || 'Externo / Desconocido'}</div>
                                                                    <div className="text-[10px] font-mono text-text-dim mt-0.5 truncate max-w-xs">{log.destinatario}</div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <div className="text-xs font-semibold text-text-main truncate max-w-sm" title={log.asunto}>
                                                                        {log.asunto}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 whitespace-nowrap">
                                                                    <span className={`status-tag ${getStatusBadge(log.estado)}`}>
                                                                        <span className={`dot ${getStatusDot(log.estado)}`} />
                                                                        {log.estado}
                                                                    </span>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    {attCount > 0 ? (
                                                                        <span className="badge-vercel badge-vercel-info text-[9px] font-mono font-bold">
                                                                            {attCount} adj.
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-text-dim/30 text-xs">—</span>
                                                                    )}
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <button className="p-2 rounded border border-border-thin text-text-dim group-hover:text-text-main group-hover:border-border-hover transition-all cursor-pointer">
                                                                        <ArrowRight size={13} />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL: CREAR/EDITAR PLANTILLA */}
            {isTemplateModalOpen && (
                <div className="modal-overlay !z-50 animate-fade-in">
                    <div className="modal-card animate-fade-up max-w-3xl w-full">
                        <header className="modal-header">
                            <h4 className="font-bold text-text-main text-base uppercase tracking-wider">
                                {editingTemplate ? 'Editar Plantilla de Email' : 'Crear Nueva Plantilla de Email'}
                            </h4>
                            <button
                                onClick={() => setIsTemplateModalOpen(false)}
                                className="text-text-dim hover:text-text-main transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </header>

                        <form onSubmit={handleSaveTemplate}>
                            <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
                                {templateError && (
                                    <div className="badge-vercel-error !rounded-xl !p-3 text-xs">
                                        <AlertTriangle size={14} className="shrink-0" />
                                        <span>{templateError}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Codigo */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Código Único *</label>
                                        <input
                                            type="text"
                                            disabled={editingTemplate !== null}
                                            className="input-vercel text-xs font-mono uppercase"
                                            placeholder="EJ: ALERTA_CRONOGRAMA"
                                            value={templateForm.codigo}
                                            onChange={e => setTemplateForm(prev => ({ ...prev, codigo: e.target.value }))}
                                        />
                                        <span className="text-[8px] text-text-dim block">Código interno del sistema. No se puede cambiar al editar.</span>
                                    </div>

                                    {/* Nombre */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Nombre de la Plantilla *</label>
                                        <input
                                            type="text"
                                            className="input-vercel text-xs font-sans"
                                            placeholder="Ej: Notificación de Hito Vencido"
                                            value={templateForm.nombre}
                                            onChange={e => setTemplateForm(prev => ({ ...prev, nombre: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                {/* Descripcion */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Descripción del propósito</label>
                                    <input
                                        type="text"
                                        className="input-vercel text-xs font-sans"
                                        placeholder="Ej: Se envía automáticamente a los docentes cuando se aproxima la fecha límite de un informe de avance."
                                        value={templateForm.descripcion}
                                        onChange={e => setTemplateForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                    />
                                </div>

                                {/* Asunto */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Asunto del correo predeterminado *</label>
                                    <input
                                        type="text"
                                        className="input-vercel text-xs font-semibold"
                                        placeholder="Ej: Alerta: Entrega pendiente en el proyecto [[proyecto_titulo]]"
                                        value={templateForm.asunto}
                                        onChange={e => setTemplateForm(prev => ({ ...prev, asunto: e.target.value }))}
                                    />
                                    <span className="text-[8px] text-text-dim block">Puede usar tokens de inyección como [[proyecto_titulo]]</span>
                                </div>

                                {/* Cuerpo Html — solo administradores técnicos */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                                            Diseño del correo (HTML interno) *
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplateHtmlEditor(v => !v)}
                                            className="text-[9px] font-bold text-brand uppercase tracking-wider hover:underline cursor-pointer"
                                        >
                                            {showTemplateHtmlEditor ? 'Ocultar editor' : 'Mostrar editor avanzado'}
                                        </button>
                                    </div>
                                    <p className="text-[8px] text-text-dim leading-relaxed">
                                        Solo el contenido central (párrafos, tablas, botones). El encabezado SISTEMA DIITRA con logos y el pie LOPDP los agrega el sistema al enviar.
                                    </p>
                                    {showTemplateHtmlEditor && (
                                        <textarea
                                            rows={12}
                                            className="input-vercel font-mono text-xs leading-relaxed"
                                            placeholder="<div style='...'>...</div>"
                                            value={templateForm.cuerpoHtml}
                                            onChange={e => setTemplateForm(prev => ({ ...prev, cuerpoHtml: e.target.value }))}
                                        />
                                    )}
                                    {!showTemplateHtmlEditor && templateForm.cuerpoHtml && (
                                        <p className="text-[9px] text-text-dim italic p-2 border border-dashed border-border-thin rounded-lg">
                                            Plantilla HTML configurada ({templateForm.cuerpoHtml.length} caracteres). Use el editor avanzado para modificarla.
                                        </p>
                                    )}
                                    <div className="space-y-2 mt-2 select-none">
                                        {[
                                            { label: 'Globales', tokens: ['[[destinatario_nombre]]', '[[destinatario_email]]', '[[anio_actual]]', '[[institucion_nombre]]', '[[sistema_url]]'] },
                                            { label: 'Proyecto', tokens: ['[[proyecto_titulo]]', '[[proyecto_codigo]]', '[[proyecto_descripcion]]', '[[proyecto_estado]]', '[[proyecto_director]]', '[[proyecto_director_email]]', '[[linea_investigacion]]', '[[proyecto_sublinea]]', '[[proyecto_workspace_url]]'] },
                                            { label: 'Convocatoria', tokens: ['[[convocatoria_titulo]]', '[[convocatoria_codigo]]', '[[convocatoria_anio]]', '[[convocatoria_apertura]]', '[[convocatoria_cierre]]', '[[convocatoria_presupuesto]]', '[[convocatoria_monto_maximo]]', '[[convocatoria_bases_url]]', '[[convocatoria_estado]]'] },
                                            { label: 'PeerReview', tokens: ['[[revisor_nombre]]', '[[revisor_email]]', '[[peer_review_dictamen]]', '[[peer_review_estado]]', '[[peer_review_fecha_limite]]', '[[peer_review_puntaje]]', '[[peer_review_observaciones]]', '[[peer_review_tipo]]', '[[peer_review_anonimo]]'] }
                                        ].map(group => (
                                            <div key={group.label}>
                                                <span className="text-[8px] font-black text-text-dim uppercase tracking-widest block mb-1">{group.label}:</span>
                                                <div className="flex flex-wrap gap-1">
                                                    {group.tokens.map(tok => (
                                                        <button
                                                            key={tok}
                                                            type="button"
                                                            onClick={() => setTemplateForm(prev => ({ ...prev, cuerpoHtml: prev.cuerpoHtml + tok }))}
                                                            className="px-1.5 py-0.5 rounded border border-border-thin bg-surface text-[8px] font-mono text-text-dim hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
                                                        >
                                                            {tok}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Activo */}
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="activo-chk"
                                        checked={templateForm.activo}
                                        onChange={e => setTemplateForm(prev => ({ ...prev, activo: e.target.checked }))}
                                        className="rounded border-border-thin text-brand focus:ring-brand shrink-0"
                                    />
                                    <label htmlFor="activo-chk" className="text-xs font-bold text-text-main select-none cursor-pointer">
                                        Plantilla activa disponible para envío
                                    </label>
                                </div>
                            </div>

                            <footer className="modal-footer">
                                <button
                                    type="button"
                                    onClick={() => setIsTemplateModalOpen(false)}
                                    className="btn-vercel-secondary py-2 text-xs uppercase"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-vercel-primary py-2 text-xs uppercase cursor-pointer"
                                >
                                    Guardar Plantilla
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            {/* DRAWER: DETALLE INSPECCIÓN DE ENVÍO */}
            {isHistoryDrawerOpen && selectedHistoryLog && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div
                        className="absolute inset-0 bg-black/70 cursor-pointer animate-fade-in"
                        onClick={() => setIsHistoryDrawerOpen(false)}
                    />
                    <div className="relative w-full max-w-2xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <header className="modal-header">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold tracking-tighter text-text-main uppercase">Bitácora de Despacho</h3>
                                <p className="text-[10px] font-mono text-text-dim uppercase tracking-widest">ID Log: {selectedHistoryLog.uuid}</p>
                            </div>
                            <button onClick={() => setIsHistoryDrawerOpen(false)} className="text-text-dim hover:text-text-main transition-colors cursor-pointer">
                                <X size={18} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-2">Fecha y Hora</label>
                                    <div className="text-xs font-bold text-text-main">
                                        {format(new Date(selectedHistoryLog.fechaEnvio), "dd/MM/yyyy", { locale: es })}
                                    </div>
                                    <div className="text-[10px] text-text-dim mt-1 font-mono">
                                        {format(new Date(selectedHistoryLog.fechaEnvio), "HH:mm:ss.SSS")}
                                    </div>
                                </div>
                                <div className="bento-card static p-4">
                                    <label className="section-label text-text-dim mb-2">Estado del servidor de correo</label>
                                    <span className={`status-tag ${getStatusBadge(selectedHistoryLog.estado)}`}>
                                        <span className={`dot ${getStatusDot(selectedHistoryLog.estado)}`} />
                                        {selectedHistoryLog.estado}
                                    </span>
                                </div>
                            </div>

                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-dim">Destinatario</label>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                                        {selectedHistoryLog.nombreDestinatario ? selectedHistoryLog.nombreDestinatario.substring(0, 2).toUpperCase() : 'EX'}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-text-main">
                                            {selectedHistoryLog.nombreDestinatario || 'Destinatario Externo'}
                                        </div>
                                        <div className="text-xs text-text-dim font-mono mt-1">
                                            {selectedHistoryLog.destinatario}
                                        </div>
                                        {selectedHistoryLog.idUsuarioDestinatario && (
                                            <span className="inline-block mt-2 badge-vercel badge-vercel-neutral text-[9px] font-mono">
                                                ID Usuario: {selectedHistoryLog.idUsuarioDestinatario}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Attachments list if any */}
                            {selectedHistoryLog.adjuntosJson && (
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Adjuntos Registrados</label>
                                    <div className="divide-y divide-border-thin border border-border-thin rounded-xl overflow-hidden bg-bg-deep/40 p-1.5 space-y-1">
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(selectedHistoryLog.adjuntosJson);
                                                if (Array.isArray(parsed) && parsed.length > 0) {
                                                    return parsed.map((att: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-2 p-2 text-xs">
                                                            <FileText size={14} className="text-text-dim shrink-0" />
                                                            <span className="font-mono text-xs truncate text-text-main">{att.nombre}</span>
                                                            <span className="text-[10px] text-text-dim/60 font-mono">({att.ruta || 'Base64'})</span>
                                                        </div>
                                                    ));
                                                }
                                            } catch { }
                                            return <span className="text-[10px] text-text-dim italic p-2 block">Ninguno</span>;
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Error trace if failed */}
                            {selectedHistoryLog.errorMensaje && (
                                <div className="space-y-2">
                                    <label className="section-label text-error">Detalle del error de envío</label>
                                    <pre className="text-[10px] font-mono bg-error-subtle border border-error/20 p-4 rounded-xl text-error leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                        {selectedHistoryLog.errorMensaje}
                                    </pre>
                                </div>
                            )}

                            {/* Sent content HTML preview */}
                            <div className="space-y-2">
                                <label className="section-label text-text-dim">Contenido HTML Enviado</label>
                                <div className="bento-card static p-4 bg-white text-black rounded-xl max-h-96 overflow-y-auto border border-border-thin">
                                    <div
                                        dangerouslySetInnerHTML={{ __html: sanitize(selectedHistoryLog.cuerpo) }}
                                        className="prose prose-sm text-black max-w-none font-sans"
                                    />
                                </div>
                            </div>
                        </div>

                        <footer className="p-4 bg-surface/50 border-t border-border-thin text-right">
                            <button
                                onClick={() => setIsHistoryDrawerOpen(false)}
                                className="btn-vercel-secondary text-xs uppercase py-2 cursor-pointer"
                            >
                                Cerrar Inspección
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </main>
    );
};

export default EmailEnginePage;
