import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, ChevronRight } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';

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

    // Consentimientos State
    const [consents, setConsents] = useState<ConsentimientoData[]>([]);
    const [isLoadingConsents, setIsLoadingConsents] = useState(false);
    const [detailConsent, setDetailConsent] = useState<ConsentimientoData | null>(null);

    useEffect(() => {
        fetchConsents();
    }, []);

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

    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <ShieldCheck size={12} className="text-brand" />
                    <span>Administración LOPDP</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Panel de Control LOPDP</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Audite el registro histórico de consentimientos otorgados bajo la normativa de protección de datos personales.
                </p>
            </header>

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
                                        <th className="py-3 px-4">Navegador</th>
                                        <th className="py-3 px-4 text-right">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-thin/40 text-xs">
                                    {consents.map(consent => (
                                        <tr 
                                            key={consent.id_consentimiento} 
                                            className="hover:bg-surface-hover/30 transition-colors cursor-pointer"
                                            onClick={() => setDetailConsent(consent)}
                                        >
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

            {detailConsent && (
                <div className="fixed inset-0 z-[9999] flex justify-end">
                    <div 
                        className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                        onClick={() => setDetailConsent(null)}
                    />
                    <div className="relative w-full max-w-md h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden">
                        <div className="modal-header">
                            <div className="flex items-center gap-3">
                                <div className="icon-circle icon-circle-brand">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-text-main tracking-tight">Detalle de Consentimiento</h3>
                                    <p className="section-label text-text-dim">Auditoría LOPDP</p>
                                </div>
                            </div>
                            <button onClick={() => setDetailConsent(null)} className="text-text-dim hover:text-text-main transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-main">Información del Usuario</label>
                                <div className="divider-vercel !my-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-text-dim">Nombre Completo</p>
                                    <p className="text-sm font-semibold text-text-main">{detailConsent.nombre_usuario}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-text-dim">ID Usuario</p>
                                    <p className="text-xs font-semibold text-text-main font-mono">{detailConsent.id_usuario}</p>
                                </div>
                            </div>

                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-main">Detalles del Registro</label>
                                <div className="divider-vercel !my-0" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-text-dim">Política / Versión</p>
                                        <span className="inline-block font-mono text-[11px] bg-surface-hover/50 px-2 py-0.5 rounded border border-border-thin">
                                            {detailConsent.version_politica}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-text-dim">Canal de Registro</p>
                                        <p className="text-xs font-semibold text-text-main">{detailConsent.canal}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <p className="text-[10px] uppercase font-bold text-text-dim">Fecha y Hora</p>
                                        <p className="text-xs font-semibold text-text-main font-mono">
                                            {new Date(detailConsent.fecha_consentimiento).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-text-dim">Dirección IP</p>
                                        <p className="text-xs font-semibold text-text-main font-mono">{detailConsent.ip_direccion || 'N/D'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-text-dim">Estado</p>
                                        <div>
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${detailConsent.estado === 'Otorgado' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'}`}>
                                                {detailConsent.estado}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bento-card static p-4 space-y-3">
                                <label className="section-label text-text-main">Firma Digital del Navegador</label>
                                <div className="divider-vercel !my-0" />
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-text-dim">Identificador de Transacción (UUID)</p>
                                    <p className="text-xs font-mono text-text-main break-all bg-surface-hover/50 p-2 rounded border border-border-thin">{detailConsent.uuid}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-text-dim">User Agent (Navegador y OS)</p>
                                    <p className="text-xs text-text-dim leading-relaxed bg-surface-hover/30 p-2 rounded border border-border-thin break-words">
                                        {detailConsent.user_agent || 'No Registrado'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setDetailConsent(null)} className="btn-vercel-secondary w-full justify-center">Cerrar Detalle</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LopdpAdminPage;
