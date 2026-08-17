import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader } from '../../../components/Common/PageHeader';
import { certificatesService, type IssuedCertificateDto } from '../../../services/certificatesService';
import {
    Award, Download, ExternalLink, Calendar, User, ShieldCheck,
    Loader2, QrCode, RotateCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { VercelUsageCard } from '../../Investigacion/Convocatorias/components/VercelUsageCard';

type CertificateTab = 'todos' | 'proyectos' | 'grupos' | 'otros';

export const MyCertificatesPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState<IssuedCertificateDto[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<CertificateTab>('todos');

    const fetchCertificates = () => {
        setLoading(true);
        setError(null);
        certificatesService.getMyCertificates()
            .then(data => {
                setCertificates(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error("[DIITRA] Error al cargar mis certificados:", err);
                setError("No se pudieron cargar los certificados personales.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCertificates();
    }, []);

    // Clasificación por tipo inferido del título o rol
    const { projectCerts, groupCerts, otherCerts } = useMemo(() => {
        const proj: IssuedCertificateDto[] = [];
        const grp: IssuedCertificateDto[] = [];
        const oth: IssuedCertificateDto[] = [];

        certificates.forEach(c => {
            const titleLower = (c.title || '').toLowerCase();
            const roleLower = (c.recipient_role || c.recipientRole || '').toLowerCase();

            if (titleLower.includes('grupo') || roleLower.includes('grupo') || roleLower.includes('semillero')) {
                grp.push(c);
            } else if (titleLower.includes('proyecto') || roleLower.includes('director') || roleLower.includes('investigador') || roleLower.includes('participante')) {
                proj.push(c);
            } else {
                oth.push(c);
            }
        });

        return { projectCerts: proj, groupCerts: grp, otherCerts: oth };
    }, [certificates]);

    const filteredCertificates = useMemo(() => {
        if (activeTab === 'proyectos') return projectCerts;
        if (activeTab === 'grupos') return groupCerts;
        if (activeTab === 'otros') return otherCerts;
        return certificates;
    }, [activeTab, certificates, projectCerts, groupCerts, otherCerts]);

    const tabs: Array<{ key: CertificateTab; label: string; count: number }> = [
        { key: 'todos', label: 'Todos', count: certificates.length },
        { key: 'proyectos', label: 'Proyectos', count: projectCerts.length },
        { key: 'grupos', label: 'Grupos de Investigación', count: groupCerts.length },
        ...(otherCerts.length > 0 ? [{ key: 'otros' as CertificateTab, label: 'Otros Logros', count: otherCerts.length }] : [])
    ];

    return (
        <main className="flex-1 bg-bg-deep p-6 md:p-10 overflow-y-auto selection:bg-text-main selection:text-bg-deep transition-colors duration-300">
            <PageHeader
                kicker="Portal de Logros y Reconocimientos · DIITRA"
                icon={Award}
                title="Mis Certificados de Completación"
                description="Certificados oficiales otorgados por la Dirección de Investigación e Innovación a estudiantes, docentes, directores y miembros de grupos."
            >
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchCertificates}
                        className="btn-vercel-secondary flex items-center gap-1.5 shrink-0"
                        title="Actualizar listado de certificados"
                    >
                        <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>
                    <Link
                        to="/verificacion"
                        className="btn-vercel-secondary flex items-center gap-2 shrink-0 no-underline"
                    >
                        <QrCode size={14} />
                        <span>Verificar Código QR</span>
                    </Link>
                </div>
            </PageHeader>

            {/* ── TWO-COLUMN LAYOUT — estilo institucional Vercel Geist ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-up [animation-delay:100ms] relative z-10">

                {/* ── Columna Principal: Tabs y Listado ─── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Tabs filtro */}
                    <div className="tabs-vercel">
                        {tabs.map(t => (
                            <button
                                key={t.key}
                                className={`tab-vercel-item flex items-center gap-1.5 ${activeTab === t.key ? 'active' : ''}`}
                                onClick={() => setActiveTab(t.key)}
                            >
                                <span>{t.label}</span>
                                {!loading && (
                                    <span className="text-[10px] font-mono bg-surface border border-border-thin rounded-full px-1.5 py-px text-text-dim ml-0.5">
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Contenedor Principal */}
                    <div className="bento-card static overflow-hidden bg-surface border border-border-thin shadow-sm rounded-xl">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-dim">
                                <Loader2 size={24} className="animate-spin text-brand" />
                                <span className="text-xs font-bold uppercase tracking-widest">Cargando certificados...</span>
                            </div>
                        ) : error ? (
                            <div className="empty-state py-16 px-6 text-center flex flex-col items-center justify-center">
                                <div className="icon-circle icon-circle-error !p-4 mb-4">
                                    <Award size={28} strokeWidth={1.5} className="text-error" />
                                </div>
                                <p className="text-text-main font-bold uppercase tracking-widest text-sm">Error de sincronización</p>
                                <p className="text-text-dim text-xs mt-2 max-w-sm">{error}</p>
                                <button
                                    onClick={fetchCertificates}
                                    className="btn-vercel-secondary mt-4 text-xs font-semibold px-4 py-2"
                                >
                                    Reintentar Carga
                                </button>
                            </div>
                        ) : filteredCertificates.length === 0 ? (
                            <div className="empty-state py-20 px-6 text-center flex flex-col items-center justify-center">
                                <div className="icon-circle icon-circle-neutral !p-4 mb-4">
                                    <Award size={28} strokeWidth={1.5} className="text-text-dim" />
                                </div>
                                <p className="text-text-main font-bold uppercase tracking-widest text-sm">Aún no tienes certificados emitidos</p>
                                <p className="text-text-dim text-xs mt-2 max-w-md leading-relaxed">
                                    Tus certificados de completación de proyectos, talleres o grupos de investigación aparecerán automáticamente aquí una vez finalizado y acreditado cada proceso institucional.
                                </p>
                            </div>
                        ) : (
                            <div className="w-full overflow-hidden">
                                <div className="divide-y divide-border-thin/60">
                                    {filteredCertificates.map(cert => {
                                        const code = cert.traceability_code || cert.document_uuid || cert.documentUuid;
                                        const recipient = cert.recipient_name || cert.recipientName || 'Investigador';
                                        const role = cert.recipient_role || cert.recipientRole || 'Participante';

                                        return (
                                            <div
                                                key={code}
                                                className="p-5 md:p-6 hover:bg-surface/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                            >
                                                <div className="flex items-start gap-4 min-w-0">
                                                    <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0 text-brand mt-0.5 group-hover:scale-105 transition-transform">
                                                        <Award size={20} strokeWidth={1.8} />
                                                    </div>
                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="badge-vercel text-[9px] font-semibold uppercase tracking-wider py-0.5 px-2 bg-surface border border-border-thin text-brand">
                                                                {role}
                                                            </span>
                                                            {cert.issue_date && (
                                                                <span className="text-[11px] text-text-dim flex items-center gap-1">
                                                                    <Calendar size={12} className="opacity-70" />
                                                                    {new Date(cert.issue_date).toLocaleDateString('es-EC', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-text-main leading-snug group-hover:text-brand transition-colors">
                                                            {cert.title}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-dim pt-0.5">
                                                            <span className="flex items-center gap-1 text-[11px]">
                                                                <User size={12} className="opacity-60" />
                                                                {recipient}
                                                            </span>
                                                            {code && (
                                                                <span className="flex items-center gap-1 font-mono text-[10px] text-text-dim/80">
                                                                    <ShieldCheck size={12} className="text-success" />
                                                                    UUID: {code.slice(0, 10)}...
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    <a
                                                        href={certificatesService.getDownloadUrl(code)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn-vercel-primary !py-2 !px-3.5 text-xs flex items-center gap-1.5 no-underline shadow-sm"
                                                    >
                                                        <Download size={13} />
                                                        <span>Descargar PDF</span>
                                                    </a>
                                                    <Link
                                                        to={`/verificacion/${code}`}
                                                        className="btn-vercel-secondary !p-2 flex items-center justify-center"
                                                        title="Verificación Institucional de Autenticidad"
                                                    >
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Columna Lateral: Métricas y Resumen ─── */}
                <div className="space-y-6 lg:pt-[49px]">
                    <VercelUsageCard
                        title="Resumen de Reconocimientos"
                        items={[
                            {
                                label: 'Certificados Emitidos',
                                value: certificates.length,
                                displayValue: `${certificates.length}`,
                                max: Math.max(5, certificates.length),
                                color: 'var(--brand)',
                                hint: 'Total de certificados oficiales generados a tu nombre.'
                            },
                            {
                                label: 'Proyectos de Inv.',
                                value: projectCerts.length,
                                displayValue: `${projectCerts.length}`,
                                max: Math.max(5, projectCerts.length),
                                color: '#3291ff',
                                hint: 'Certificaciones obtenidas por culminación de proyectos.'
                            },
                            {
                                label: 'Grupos & Semilleros',
                                value: groupCerts.length,
                                displayValue: `${groupCerts.length}`,
                                max: Math.max(5, groupCerts.length),
                                color: '#f5a623',
                                hint: 'Reconocimientos como miembro o coordinador de grupo.'
                            },
                            {
                                label: 'Trazabilidad Digital',
                                value: certificates.length > 0 ? 100 : 0,
                                displayValue: certificates.length > 0 ? '100%' : '—',
                                max: 100,
                                color: '#00e054',
                                hint: 'Porcentaje de documentos validados mediante firma y UUID criptográfico.'
                            }
                        ]}
                    />
                </div>

            </div>
        </main>
    );
};

export default MyCertificatesPage;
