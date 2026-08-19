import React, { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../components/Common/PageHeader';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';
import { ConsentDetailPanel, type ConsentimientoData } from './components/ConsentDetailPanel';

const LopdpAdminPage: React.FC = () => {
    const navigate = useNavigate();
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
            {/* Breadcrumb / Back Button */}
            <div className="flex items-center gap-2 text-xs select-none">
                <button
                    onClick={() => navigate('/auditoria')}
                    className="flex items-center gap-1.5 text-text-dim hover:text-text-main transition-colors group cursor-pointer bg-transparent border-0"
                >
                    <ArrowLeft size={12} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span>Registro de Auditoría</span>
                </button>
                <span className="text-text-dim/30">/</span>
                <span className="text-text-main/80 font-medium">Panel LOPDP</span>
            </div>

            <PageHeader
                kicker="Administración LOPDP"
                icon={ShieldCheck}
                title="Panel de Control LOPDP"
                description="Audite el registro histórico de consentimientos otorgados bajo la normativa de protección de datos personales."
            />

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
                                        className="hover:bg-surface-hover/50 transition-colors cursor-pointer group"
                                        onClick={() => setDetailConsent(consent)}
                                    >
                                        <td className="py-3.5 px-4 font-semibold text-text-main group-hover:text-brand transition-colors">
                                            {consent.nombre_usuario}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="font-mono text-[11px] bg-surface-hover/50 px-2 py-0.5 rounded border border-border-thin text-text-main">
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
                                            <span className={`badge-vercel ${consent.estado === 'Otorgado' ? 'badge-vercel-emerald' : 'badge-vercel-rose'} !py-0.5 !px-2 font-medium`}>
                                                <span className="dot" />
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

            {/* Panel Lateral de Detalle con Portal */}
            <ConsentDetailPanel
                detailConsent={detailConsent}
                onClose={() => setDetailConsent(null)}
            />
        </div>
    );
};

export default LopdpAdminPage;
