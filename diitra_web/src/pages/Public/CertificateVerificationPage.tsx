import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificatesService, type CertificateVerificationDto } from '../../services/certificatesService';
import { Award, CheckCircle2, XCircle, ShieldCheck, Download, Calendar, User, FileText, ArrowLeft, Loader2 } from 'lucide-react';

export const CertificateVerificationPage: React.FC = () => {
    const { uuid } = useParams<{ uuid: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CertificateVerificationDto | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!uuid) {
            setError('Código de verificación no especificado.');
            setLoading(false);
            return;
        }

        certificatesService.verifyCertificate(uuid)
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error al verificar certificado:", err);
                setError('El certificado o código escaneado no es válido o no existe en la base de datos oficial de DIITRA.');
                setLoading(false);
            });
    }, [uuid]);

    const isVerified = data?.is_valid ?? data?.isValid ?? false;

    return (
        <div className="min-h-screen bg-bg-deep text-text-primary flex flex-col justify-center items-center p-4 md:p-8 font-sans relative overflow-hidden">
            {/* Elementos Decorativos de Fondo */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl w-full bg-bg-surface border border-border-default rounded-2xl p-6 md:p-10 shadow-2xl relative z-10 backdrop-blur-md">
                {/* Header Institucional */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-6 mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-text-primary">Instituto Superior Tecnológico DIITRA</h1>
                            <p className="text-xs text-text-muted">Portal Público de Validación Trazable de Documentos (LOPDP)</p>
                        </div>
                    </div>
                    <Link to="/" className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Inicio
                    </Link>
                </div>

                {loading ? (
                    <div className="py-16 text-center flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-sm text-text-muted">Consultando la integridad del certificado en blockchain/BD local...</p>
                    </div>
                ) : error || !isVerified ? (
                    <div className="py-10 text-center space-y-4">
                        <div className="w-16 h-16 bg-status-danger/10 border border-status-danger/30 text-status-danger rounded-full flex items-center justify-center mx-auto">
                            <XCircle className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-status-danger">Certificado No Válido o Inexistente</h2>
                        <p className="text-sm text-text-secondary max-w-md mx-auto">
                            {error || 'El documento consultado no ha sido emitido por el Instituto Superior Tecnológico DIITRA o ha sido revocada su firma institucional.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Estado Válido */}
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-4 text-emerald-400">
                            <CheckCircle2 className="w-8 h-8 shrink-0" />
                            <div>
                                <h2 className="text-base font-semibold text-emerald-300">Certificado Auténtico y Verificado</h2>
                                <p className="text-xs text-emerald-400/80">Documento registrado con trazabilidad UUID legal e integridad verificada.</p>
                            </div>
                        </div>

                        {/* Detalles del Certificado */}
                        <div className="bg-bg-subtle/50 rounded-xl p-5 border border-border-subtle space-y-4">
                            <div className="flex items-start justify-between border-b border-border-subtle/50 pb-3">
                                <div>
                                    <span className="text-xs text-text-muted uppercase tracking-wider block font-semibold mb-1">Destinatario Otorgado</span>
                                    <span className="text-lg font-bold text-text-primary flex items-center gap-2">
                                        <User className="w-4 h-4 text-primary" />
                                        {data?.recipient_name}
                                    </span>
                                </div>
                                <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                                    {data?.recipient_role || 'Participante'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-text-muted block mb-1 flex items-center gap-1">
                                        <FileText className="w-3.5 h-3.5 text-text-muted" /> Título / Tipo de Documento
                                    </span>
                                    <span className="font-medium text-text-secondary">{data?.title || data?.certificate_type}</span>
                                </div>

                                <div>
                                    <span className="text-xs text-text-muted block mb-1 flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-text-muted" /> Fecha de Emisión Oficial
                                    </span>
                                    <span className="font-medium text-text-secondary">
                                        {data?.issue_date ? new Date(data.issue_date).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Reciente'}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-border-subtle/50">
                                <span className="text-xs text-text-muted block mb-1 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Código Único de Trazabilidad UUID
                                </span>
                                <code className="text-xs bg-bg-deep px-3 py-1.5 rounded-lg border border-border-subtle font-mono text-text-primary block break-all">
                                    {data?.traceability_code}
                                </code>
                            </div>
                        </div>

                        {/* Botón Descarga */}
                        <div className="pt-2">
                            <a
                                href={certificatesService.getDownloadUrl(uuid!)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-primary/25"
                            >
                                <Download className="w-4 h-4" />
                                <span>Descargar Certificado Oficial en PDF</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificateVerificationPage;
