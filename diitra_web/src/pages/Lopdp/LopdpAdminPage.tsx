import React, { useState, useEffect } from 'react';
import { ShieldCheck, FileText, Lock, CheckCircle2, Loader2, Paperclip } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';

interface ArcoRequest {
    id_solicitud_arco: number;
    uuid: string;
    id_usuario: number;
    nombre_usuario: string;
    tipo_solicitud: string;
    detalle_solicitud: string;
    fecha_solicitud: string;
    fecha_limite_resolucion: string;
    estado: string;
    resolucion_detalle?: string;
    fecha_resolucion?: string;
    documento_resolucion_path?: string;
    evidencia_path?: string;
}

interface ConsentimientoData {
    id_consentimiento: number;
    uuid: string;
    id_usuario: number;
    nombre_usuario: string;
    version_politica: string;
    canal: string;
    fecha_consentimiento: string;
    ip_direccion?: string;
    user_agent?: string;
    estado: string;
}

const LopdpAdminPage: React.FC = () => {
    const { addToast } = useNotifications();

    const [adminSubTab, setAdminSubTab] = useState<'arco' | 'consents'>('arco');

    // Admin ARCO State
    const [allArcoRequests, setAllArcoRequests] = useState<ArcoRequest[]>([]);
    const [isLoadingAllArco, setIsLoadingAllArco] = useState(false);
    const [selectedArco, setSelectedArco] = useState<ArcoRequest | null>(null);
    const [resolutionText, setResolutionText] = useState('');
    const [resolutionStatus, setResolutionStatus] = useState('Aprobado');
    const [isResolvingArco, setIsResolvingArco] = useState(false);

    // Consentimientos State
    const [consents, setConsents] = useState<ConsentimientoData[]>([]);
    const [isLoadingConsents, setIsLoadingConsents] = useState(false);

    useEffect(() => {
        if (adminSubTab === 'arco') {
            fetchAllArcoRequests();
        } else if (adminSubTab === 'consents') {
            fetchConsents();
        }
    }, [adminSubTab]);

    const fetchAllArcoRequests = async () => {
        setIsLoadingAllArco(true);
        try {
            const res = await api.get('/lopdp/arco/todas');
            setAllArcoRequests(res.data);
        } catch (err) {
            console.error('Error fetching all ARCO requests:', err);
            addToast('Error', 'No se pudieron cargar las peticiones ARCO del instituto.', 'error');
        } finally {
            setIsLoadingAllArco(false);
        }
    };

    const fetchConsents = async () => {
        setIsLoadingConsents(true);
        try {
            const res = await api.get('/lopdp/consentimientos');
            setConsents(res.data);
        } catch (err) {
            console.error('Error fetching consents:', err);
            addToast('Error', 'No se pudieron cargar los consentimientos.', 'error');
        } finally {
            setIsLoadingConsents(false);
        }
    };

    const getEvidenceUrl = (path: string) => {
        const base = api.defaults.baseURL || '/api';
        return `${base}/storage/${path}`;
    };

    const handleResolveArco = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedArco) return;
        if (!resolutionText.trim()) {
            addToast('Validación', 'La resolución es requerida.', 'warning');
            return;
        }

        setIsResolvingArco(true);
        try {
            await api.post('/lopdp/arco/resolver', {
                id_solicitud_arco: selectedArco.id_solicitud_arco,
                resolucion_detalle: resolutionText,
                estado: resolutionStatus
            });
            addToast('Resolución Guardada', 'La solicitud ARCO ha sido respondida.', 'success');
            setSelectedArco(null);
            setResolutionText('');
            fetchAllArcoRequests();
        } catch (err) {
            console.error('Error resolving ARCO:', err);
            addToast('Error', 'No se pudo guardar la resolución.', 'error');
        } finally {
            setIsResolvingArco(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Aprobado':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'Rechazado':
                return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
            case 'En_Analisis':
                return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
            default:
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <ShieldCheck size={12} className="text-brand" />
                    <span>Administración LOPDP</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Panel de Control LOPDP</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Gestione las peticiones ARCO presentadas por los usuarios y audite el registro histórico de consentimientos otorgados bajo la normativa de protección de datos personales.
                </p>
            </header>

            {/* Navigation Tabs */}
            <div className="flex border-b border-border-thin gap-1">
                <button
                    onClick={() => setAdminSubTab('arco')}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${adminSubTab === 'arco' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                >
                    Peticiones ARCO
                </button>
                <button
                    onClick={() => setAdminSubTab('consents')}
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${adminSubTab === 'consents' ? 'border-brand text-text-main' : 'border-transparent text-text-dim hover:text-text-main'}`}
                >
                    Consentimientos Registrados
                </button>
            </div>

            {adminSubTab === 'arco' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Request selector & list */}
                    <div className="lg:col-span-2 bento-card static p-6 space-y-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <FileText size={16} />
                            Peticiones ARCO del Instituto
                        </h2>

                        {isLoadingAllArco ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin text-brand" size={24} />
                            </div>
                        ) : allArcoRequests.length === 0 ? (
                            <div className="py-16 text-center text-text-dim space-y-2">
                                <CheckCircle2 className="mx-auto opacity-20 text-emerald-500" size={32} />
                                <p className="text-xs uppercase font-semibold tracking-widest">Sin solicitudes registradas</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {allArcoRequests.map(req => (
                                    <div
                                        key={req.id_solicitud_arco}
                                        onClick={() => setSelectedArco(req)}
                                        className={`p-4 bg-surface border rounded-xl space-y-2 cursor-pointer transition-all hover:border-brand/40 ${selectedArco?.id_solicitud_arco === req.id_solicitud_arco ? 'border-brand ring-1 ring-brand' : 'border-border-thin'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-text-main">{req.nombre_usuario}</span>
                                                    <span className="text-[10px] text-text-dim">({req.tipo_solicitud})</span>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold border ${getStatusStyle(req.estado)}`}>
                                                {req.estado.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-text-dim leading-relaxed line-clamp-2">{req.detalle_solicitud}</p>
                                        <div className="flex items-center justify-between text-[9px] text-text-dim font-mono">
                                            <span>SLA Límite: {req.fecha_limite_resolucion}</span>
                                            {req.evidencia_path && (
                                                <span className="flex items-center gap-0.5 text-brand font-semibold">
                                                    <Paperclip size={10} />
                                                    Con evidencia
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Resolution Form */}
                    <div className="bento-card static p-6 space-y-6 h-fit">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <Lock size={16} />
                            Resolución LOPDP
                        </h2>

                        {selectedArco ? (
                            <form onSubmit={handleResolveArco} className="space-y-4">
                                <div className="p-3 bg-surface border border-border-thin rounded-lg space-y-2">
                                    <div className="text-[10px] text-text-dim uppercase font-semibold tracking-wider">Solicitud Seleccionada</div>
                                    <div className="text-xs font-semibold text-text-main">{selectedArco.nombre_usuario}</div>
                                    <div className="text-xs text-text-dim font-semibold">Derecho de {selectedArco.tipo_solicitud}</div>
                                    <p className="text-xs text-text-dim italic leading-normal">"{selectedArco.detalle_solicitud}"</p>
                                    
                                    {selectedArco.evidencia_path && (
                                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-border-thin/40 text-[10px]">
                                            <Paperclip size={12} className="text-brand shrink-0" />
                                            <span className="text-text-dim">Evidencia:</span>
                                            <a
                                                href={getEvidenceUrl(selectedArco.evidencia_path)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-brand hover:underline font-semibold flex items-center gap-0.5"
                                            >
                                                Ver Documento Adjunto
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Dictamen Legal / Respuesta</label>
                                    <textarea
                                        rows={4}
                                        required
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                        placeholder="Ingrese el detalle legal de la resolución para responder al titular..."
                                        value={resolutionText}
                                        onChange={e => setResolutionText(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Resolución</label>
                                    <select
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                        value={resolutionStatus}
                                        onChange={e => setResolutionStatus(e.target.value)}
                                    >
                                        <option value="Aprobado">Aprobado (Otorga la petición)</option>
                                        <option value="Rechazado">Rechazado (Niega la petición con justificación legal)</option>
                                        <option value="En_Analisis">En Análisis (Extender plazo)</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedArco(null)}
                                        className="btn-vercel-secondary text-xs flex-1 justify-center"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isResolvingArco}
                                        className="btn-vercel-primary text-xs flex-1 justify-center"
                                    >
                                        {isResolvingArco && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                        Guardar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="py-16 text-center text-text-dim text-xs font-semibold">
                                Seleccione una solicitud de la lista para resolverla.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="bento-card static p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <ShieldCheck size={16} />
                            Registro de Consentimientos LOPDP
                        </h2>
                        <span className="text-xs text-text-dim font-medium bg-surface px-3 py-1 rounded-full border border-border-thin">
                            Total: {consents.length}
                        </span>
                    </div>

                    {isLoadingConsents ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="animate-spin text-brand" size={24} />
                        </div>
                    ) : consents.length === 0 ? (
                        <div className="py-16 text-center text-text-dim space-y-2">
                            <ShieldCheck className="mx-auto opacity-20" size={32} />
                            <p className="text-xs uppercase font-semibold tracking-widest">No hay consentimientos registrados</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-thin text-[10px] font-semibold uppercase tracking-wider text-text-dim">
                                        <th className="py-3 px-4">Usuario</th>
                                        <th className="py-3 px-4">Política / Versión</th>
                                        <th className="py-3 px-4">Canal</th>
                                        <th className="py-3 px-4">Fecha</th>
                                        <th className="py-3 px-4">Dirección IP</th>
                                        <th className="py-3 px-4">User Agent</th>
                                        <th className="py-3 px-4 text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin/40 text-xs">
                                    {consents.map(consent => (
                                        <tr key={consent.id_consentimiento} className="hover:bg-surface-hover/30 transition-colors">
                                            <td className="py-3.5 px-4 font-semibold text-text-main">
                                                {consent.nombre_usuario}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="font-mono text-[11px] bg-surface-hover/50 px-2 py-0.5 rounded border border-border-thin">
                                                    {consent.version_politica}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-text-dim">{consent.canal}</td>
                                            <td className="py-3.5 px-4 text-text-dim font-mono text-[11px]">
                                                {new Date(consent.fecha_consentimiento).toLocaleString()}
                                            </td>
                                            <td className="py-3.5 px-4 text-text-dim font-mono text-[11px]">
                                                {consent.ip_direccion || 'N/D'}
                                            </td>
                                            <td className="py-3.5 px-4 text-text-dim max-w-xs truncate" title={consent.user_agent}>
                                                {consent.user_agent || 'N/D'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${consent.estado === 'Otorgado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                                                    {consent.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LopdpAdminPage;
