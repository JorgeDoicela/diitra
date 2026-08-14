import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../../components/Common/PageHeader';
import { certificatesService, type IssuedCertificateDto } from '../../../services/certificatesService';
import { Award, Download, ExternalLink, Calendar, User, ShieldCheck, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyCertificatesPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [certificates, setCertificates] = useState<IssuedCertificateDto[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        certificatesService.getMyCertificates()
            .then(data => {
                setCertificates(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error al cargar mis certificados:", err);
                setError("No se pudieron cargar los certificados personales.");
                setLoading(false);
            });
    }, []);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:px-10 md:py-8 flex flex-col h-full overflow-y-auto">
            <PageHeader
                kicker="Portal de Logros y Reconocimientos"
                icon={Award}
                title="Mis Certificados de Completación"
                description="Certificados oficiales otorgados por la Dirección de Investigación e Innovación a estudiantes, docentes, directores y miembros de grupos."
            />

            {loading ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-text-muted">Cargando tu historial de reconocimientos e insignias...</p>
                </div>
            ) : error ? (
                <div className="bg-status-danger/10 border border-status-danger/30 rounded-xl p-6 text-center text-status-danger my-8">
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            ) : certificates.length === 0 ? (
                <div className="bg-bg-surface border border-border-default rounded-2xl p-12 text-center my-8 max-w-xl mx-auto space-y-4">
                    <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-2xl flex items-center justify-center mx-auto">
                        <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">Aún no tienes certificados emitidos</h3>
                    <p className="text-sm text-text-secondary">
                        Tus certificados de completación de proyectos, talleres o grupos de investigación aparecerán automáticamente aquí una vez finalizado cada proceso.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
                    {certificates.map(cert => {
                        const code = cert.traceability_code || cert.document_uuid || cert.documentUuid;
                        const recipient = cert.recipient_name || cert.recipientName || 'Investigador';
                        const role = cert.recipient_role || cert.recipientRole || 'Participante';

                        return (
                            <div key={code} className="bg-bg-surface border border-border-default hover:border-primary/50 rounded-2xl p-6 transition-all duration-200 shadow-md hover:shadow-lg flex flex-col justify-between group">
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                                            {role}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="text-base font-bold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                                            {cert.title}
                                        </h4>
                                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                                            <User className="w-3.5 h-3.5 text-text-muted" /> {recipient}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-border-subtle/50 space-y-2 text-xs">
                                        <div className="flex items-center justify-between text-text-muted">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" /> Fecha
                                            </span>
                                            <span className="font-medium text-text-secondary">
                                                {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString('es-EC') : 'Reciente'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-text-muted">
                                            <span className="flex items-center gap-1">
                                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Trazabilidad UUID
                                            </span>
                                            <code className="font-mono text-text-primary text-[10px] bg-bg-subtle px-1.5 py-0.5 rounded">
                                                {code?.slice(0, 8)}...
                                            </code>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-5 mt-4 border-t border-border-subtle flex items-center space-x-2">
                                    <a
                                        href={certificatesService.getDownloadUrl(code)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2.5 px-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Descargar PDF
                                    </a>

                                    <Link
                                        to={`/verificacion/${code}`}
                                        className="p-2.5 bg-bg-subtle hover:bg-bg-subtle/80 text-text-secondary border border-border-subtle rounded-xl text-xs font-medium flex items-center justify-center transition-colors"
                                        title="Verificación Institucional de Autenticidad"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
};

export default MyCertificatesPage;
