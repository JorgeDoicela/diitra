import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, FileText, Users, Shield, CheckCircle, Clock, ArrowRight, GraduationCap } from 'lucide-react';
import { FullscreenLoader } from '../../../Common/FullscreenLoader';
import { TimedSuccessModal } from '../../../Common/TimedSuccessModal';
import { getDocumentSignatures } from '../../../../services/signaturesService';
import { SignatureBlock } from '../../SignatureBlock';
import { useAuth } from '../../../../api/AuthContext';
import api from '../../../../api/axios_config';

export interface OutputSectionProps {
    title: string;
    projectStatus?: string;
    canSign?: boolean;
    signatureType?: string;
    documentUuid?: string;
    formData: any;
    pdfUrl: string | null;
    isGenerating: boolean;
    isDraftMode: boolean;
    setIsDraftMode: (val: boolean) => void;
    handleGeneratePdf: (blind?: boolean) => Promise<void>;
    isSigning: boolean;
    institutionalPassword: string;
    setInstitutionalPassword: (val: string) => void;
    handleSignDiitra: () => Promise<void>;
    signatureCertFile: File | null;
    setSignatureCertFile: (file: File | null) => void;
    signaturePassword: string;
    setSignaturePassword: (val: string) => void;
    handleSign: () => Promise<void>;
    signatureRefreshTrigger: number;
    isSignedModalOpen?: boolean;
    setIsSignedModalOpen?: (val: boolean) => void;
    signedModalData?: {
        documentTitle?: string;
        rolFirmante?: string;
        fechaFirma?: string;
    } | null;
}

export const OutputSection: React.FC<OutputSectionProps> = ({
    title,
    projectStatus,
    canSign = true,
    signatureType = 'DIITRA',
    documentUuid,
    formData,
    pdfUrl,
    isGenerating,
    isDraftMode,
    setIsDraftMode,
    handleGeneratePdf,
    isSigning,
    institutionalPassword,
    setInstitutionalPassword,
    handleSignDiitra,
    signatureCertFile,
    setSignatureCertFile,
    signaturePassword,
    setSignaturePassword,
    handleSign,
    signatureRefreshTrigger,
    isSignedModalOpen = false,
    setIsSignedModalOpen,
    signedModalData
}) => {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();
    const [signatures, setSignatures] = React.useState<any[]>([]);
    const [isProtocoloSigned, setIsProtocoloSigned] = React.useState<boolean | null>(null);
    const [isPlanSigned, setIsPlanSigned] = React.useState<boolean | null>(null);

    const projectUuid = formData?.EntityUuid || formData?.entityUuid || formData?.Uuid || formData?.uuid;

    React.useEffect(() => {
        let isMounted = true;
        const docId = documentUuid || formData.Uuid || formData.uuid;
        if (docId && !docId.startsWith('temp_')) {
            getDocumentSignatures(docId)
                .then(data => {
                    if (isMounted) {
                        setSignatures(data || []);
                    }
                })
                .catch(() => {
                    if (isMounted) setSignatures([]);
                });
        }
        return () => { isMounted = false; };
    }, [documentUuid, formData.Uuid, formData.uuid, signatureRefreshTrigger]);

    React.useEffect(() => {
        let isMounted = true;
        if (!projectUuid || projectUuid.startsWith('temp_')) return;

        api.get(`/documents/instances/entity/${projectUuid}`)
            .then(res => {
                if (isMounted && Array.isArray(res.data)) {
                    const isDocValidlySigned = (doc: any): boolean => {
                        if (!doc) return false;
                        if (['Aprobado', 'En Ejecución', 'Finalizado'].includes(projectStatus || '')) return true;
                        const hasSignedState = doc.state === 3 || doc.state === 'Signed' || doc.estado === 'Firmado' || doc.is_signed === true || doc.isSigned === true;
                        const hasSignedFile = Boolean(doc.final_pdf_path || doc.finalPdfPath);
                        return hasSignedState || hasSignedFile;
                    };

                    const protoDoc = res.data.find(
                        (d: any) => d.template_code === 'PROTOCOLO_INVESTIGACION' || d.templateCode === 'PROTOCOLO_INVESTIGACION' ||
                                    d.template_code === 'PROTOCOLO_INNOVACION' || d.templateCode === 'PROTOCOLO_INNOVACION'
                    );
                    setIsProtocoloSigned(isDocValidlySigned(protoDoc));

                    const planDoc = res.data.find(
                        (d: any) => d.template_code === 'PLAN_APRENDIZAJE' || d.templateCode === 'PLAN_APRENDIZAJE'
                    );
                    setIsPlanSigned(isDocValidlySigned(planDoc));
                }
            })
            .catch(() => {});

        return () => { isMounted = false; };
    }, [projectUuid, signatureRefreshTrigger]);

    const isEditingOrCorrection = React.useMemo(() => {
        if (!projectStatus) return true;
        const normalized = projectStatus.toLowerCase().trim();
        return (
            normalized === 'borrador' ||
            normalized === 'en edición' ||
            normalized === 'en edicion' ||
            normalized === 'en corrección' ||
            normalized === 'en correccion' ||
            normalized === 'corregir' ||
            normalized === 'con observaciones' ||
            normalized === 'devuelto' ||
            normalized === 'prepropuesta' ||
            normalized === 'prepropuesta rechazada'
        );
    }, [projectStatus]);

    const activeSignatures = signatures.filter(s => s.esValida !== false && s.estado !== 2);
    const isDocumentSigned = activeSignatures.length > 0;
    const isCurrentPlan = title.toLowerCase().includes('plan de aprendizaje');
    const isCurrentProtocolo = title.toLowerCase().includes('protocolo') || title.toLowerCase().includes('formato proyecto');
    const isExpedienteCompleto = (isProtocoloSigned && isPlanSigned) || ['En Revisión', 'Aprobado', 'En Ejecución', 'Finalizado'].includes(projectStatus || '');

    return (
        <div className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col gap-3 md:gap-4 animate-fade-in overflow-y-auto lg:overflow-hidden custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 md:gap-5 flex-1 min-h-0 lg:overflow-hidden p-0.5">
                {/* Panel de Controles Unificado */}
                <div className="col-span-1 lg:col-span-3 bg-bg-deep border border-border-thin rounded-2xl shadow-sm flex flex-col lg:overflow-hidden lg:h-full">
                    {/* Sección 1: Emisión */}
                    <div className="p-5 flex flex-col gap-4 shrink-0">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                            <Settings size={16} className="text-text-dim" /> Emisión
                        </h4>

                        {/* Switch Modo Borrador */}
                        <div className="flex items-center justify-between p-3.5 bg-surface/50 border border-border-thin/80 rounded-xl hover:border-border-hover transition-colors">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-semibold text-text-main">Modo borrador</span>
                                <span className="text-[10px] text-text-dim">Marca de agua de seguridad</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isDraftMode}
                                    onChange={(e) => setIsDraftMode(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-border-thin peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-text-main"></div>
                            </label>
                        </div>

                        {/* Botones de Generación y Vista */}
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => handleGeneratePdf(false)}
                                disabled={isGenerating}
                                className="w-full py-2.5 px-4 btn-vercel-primary text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <FileText size={14} />
                                <span>{isGenerating ? 'Generando...' : 'Generar vista previa'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleGeneratePdf(true)}
                                disabled={isGenerating}
                                className="w-full py-2.5 px-4 btn-vercel-secondary text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Users size={14} />
                                <span>Vista sin identidades</span>
                            </button>
                        </div>
                    </div>

                    <div className="h-[1px] bg-border-thin/60 w-full shrink-0" />

                    {/* Sección 2: Firmas */}
                    <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            {isEditingOrCorrection && signatures.length > 0 && (
                                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5 animate-fade-in">
                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                                        <Clock size={14} /> Documento en Corrección
                                    </p>
                                    <p className="text-[11px] text-text-dim leading-relaxed">
                                        El proyecto fue devuelto para ajustes por el revisor. Una vez completadas las correcciones solicitadas, aplique su firma a continuación para certificar y reenviar el protocolo.
                                    </p>
                                </div>
                            )}

                            {isDocumentSigned ? (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-3 animate-fade-in">
                                    <div className="flex justify-center">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
                                            <CheckCircle size={20} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-text-main">Documento Firmado Oficialmente</p>
                                        <p className="text-xs text-text-dim leading-relaxed">
                                            {isExpedienteCompleto
                                                ? 'El expediente completo cuenta con firmas electrónicas y ha sido remitido a la etapa de Revisión del Administrador.'
                                                : isCurrentProtocolo && isPlanSigned === false
                                                    ? 'Protocolo firmado digitalmente con éxito. Para habilitar la Revisión del Administrador, debe firmar también el Plan de Aprendizaje.'
                                                    : isCurrentPlan && isProtocoloSigned === false
                                                        ? 'Plan de Aprendizaje firmado con éxito. Para habilitar la Revisión del Administrador, debe firmar también el Protocolo de Investigación.'
                                                        : 'Este documento cuenta con firma electrónica oficial y registro inmutable de trazabilidad.'}
                                        </p>
                                    </div>

                                    <div className="pt-1 flex flex-col gap-2">
                                        {/* Si falta el otro documento, dar acceso directo */}
                                        {isCurrentProtocolo && isPlanSigned === false && projectUuid && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}?edit=plan-aprendizaje`);
                                                }}
                                                className="w-full py-2 px-3 btn-vercel-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <GraduationCap size={14} />
                                                <span>Ir al Plan de Aprendizaje</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}

                                        {isCurrentPlan && isProtocoloSigned === false && projectUuid && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    navigate(`/investigacion/workspace/protocolo-investigacion/${projectUuid}?edit=protocolo-investigacion`);
                                                }}
                                                className="w-full py-2 px-3 btn-vercel-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <FileText size={14} />
                                                <span>Ir al Protocolo</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}

                                        {isAdmin && isExpedienteCompleto && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const pId = projectUuid || documentUuid;
                                                    if (pId) navigate(`/investigacion/revision-tecnica/${pId}`);
                                                }}
                                                className="w-full py-2 px-3 bg-text-main hover:bg-text-main/90 text-bg-deep rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <Shield size={14} />
                                                <span>Ir a Revisión Técnica</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                const url = new URL(window.location.href);
                                                url.searchParams.delete('edit');
                                                url.searchParams.delete('section');
                                                navigate(url.pathname);
                                            }}
                                            className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
                                        >
                                            <Settings size={14} />
                                            <span>Ver Proyecto</span>
                                        </button>
                                    </div>
                                </div>
                            ) : !canSign ? (
                                <div className="p-4 bg-surface border border-border-thin rounded-xl text-center space-y-2.5">
                                    <div className="flex justify-center">
                                        <div className="icon-circle icon-circle-warning !p-2">
                                            <Shield size={16} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-text-main">Firma restringida</p>
                                        <p className="text-xs text-text-dim leading-relaxed">
                                            Solo el Administrador / Coordinación de Investigación está autorizado/a para firmar digitalmente este documento.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {(signatureType === 'DIITRA' || signatureType === 'HIBRIDO') && (
                                        <div className="flex flex-col gap-3 p-4 border border-border-thin rounded-2xl bg-surface/30">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Shield size={16} className="text-text-main" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Firma Institucional DIITRA</h4>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-text-dim block">Contraseña Institucional</label>
                                                <p className="text-[9px] text-text-dim">Por seguridad, confirme su contraseña de cuenta para firmar.</p>
                                                <input
                                                    type="password"
                                                    placeholder="Contraseña de tu cuenta"
                                                    value={institutionalPassword}
                                                    onChange={(e) => setInstitutionalPassword(e.target.value)}
                                                    className="w-full bg-surface border border-border-thin rounded-xl px-3 py-2 text-xs focus:border-text-main outline-none transition-all placeholder:text-text-dim/50"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSignDiitra}
                                                disabled={isSigning || !institutionalPassword}
                                                className={`w-full py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${(!institutionalPassword)
                                                        ? 'bg-surface border border-border-thin text-text-dim cursor-not-allowed'
                                                        : 'bg-text-main text-bg-deep hover:bg-text-main/90 shadow-sm'
                                                    }`}
                                            >
                                                {isSigning ? <><Clock size={14} className="animate-spin" /> Firmando...</> : <><Shield size={14} /> Aplicar firma DIITRA</>}
                                            </button>
                                        </div>
                                    )}

                                    {(signatureType === 'ECUADOR_P12' || signatureType === 'HIBRIDO') && (
                                        <div className="flex flex-col gap-3 p-4 border border-border-thin rounded-2xl bg-surface/30">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText size={16} className="text-text-main" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Firma Digital (.p12 / .pfx)</h4>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-text-dim block">Certificado .p12</label>
                                                <label
                                                    className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all gap-1.5 ${signatureCertFile
                                                            ? 'border-green-500/40 bg-green-500/5'
                                                            : 'border-border-thin hover:border-text-main/30 bg-surface'
                                                        }`}
                                                >
                                                    <input
                                                        type="file"
                                                        accept=".p12,.pfx"
                                                        className="sr-only"
                                                        onChange={(e) => setSignatureCertFile(e.target.files?.[0] || null)}
                                                    />
                                                    {signatureCertFile ? (
                                                        <>
                                                            <CheckCircle size={16} className="text-green-500" />
                                                            <span className="text-[10px] font-semibold text-text-main truncate max-w-[160px]">{signatureCertFile.name}</span>
                                                            <span className="text-[9px] text-text-dim">Clic para cambiar</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Shield size={16} className="text-text-dim" />
                                                            <span className="text-[10px] font-semibold text-text-main">Seleccionar .p12 / .pfx</span>
                                                            <span className="text-[9px] text-text-dim">No se guarda en el servidor</span>
                                                        </>
                                                    )}
                                                </label>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-text-dim block">Contraseña del certificado</label>
                                                <input
                                                    type="password"
                                                    placeholder="Contraseña del .p12"
                                                    value={signaturePassword}
                                                    onChange={(e) => setSignaturePassword(e.target.value)}
                                                    className="w-full bg-surface border border-border-thin rounded-xl px-3 py-2 text-xs focus:border-text-main outline-none transition-all placeholder:text-text-dim/50"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleSign}
                                                disabled={isSigning || !signatureCertFile}
                                                className={`w-full py-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${(!signatureCertFile || isSigning)
                                                        ? 'bg-surface border border-border-thin text-text-dim cursor-not-allowed'
                                                        : 'bg-text-main text-bg-deep hover:bg-text-main/90 shadow-sm'
                                                    }`}
                                            >
                                                {isSigning ? <><Clock size={14} className="animate-spin" /> Firmando...</> : <><Shield size={14} /> Aplicar firma electrónica</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-4 border-t border-border-thin pt-4">
                                <SignatureBlock 
                                    documentoUuid={documentUuid || formData.Uuid || formData.uuid || ''} 
                                    refreshTrigger={signatureRefreshTrigger} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Visor de PDF */}
                <div className="col-span-1 lg:col-span-9 bg-bg-deep border border-border-thin rounded-2xl flex flex-col shadow-inner relative overflow-hidden h-[85vh] sm:h-[88vh] min-h-[750px] lg:h-full lg:min-h-0">
                    {isGenerating ? (
                        <FullscreenLoader 
                            fullscreen={false} 
                            message={[
                                "Generando documento...",
                                "Preparando vista previa...",
                                "Compilando plantilla PDF...",
                                "Cargando firmas registradas..."
                            ]} 
                        />
                    ) : pdfUrl ? (
                        <iframe src={pdfUrl} className="flex-1 w-full bg-white rounded-xl border-none shadow-2xl" title={`Vista previa — ${title}`} />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-dim/20 p-8">
                            <FileText size={80} strokeWidth={0.5} className="mb-6 lg:mb-8 md:w-[120px]" />
                            <p className="text-xs md:text-sm font-black uppercase tracking-[0.3em] md:tracking-[0.5em] text-center">Listo para generar</p>
                            <button onClick={() => handleGeneratePdf(false)} className="mt-6 px-6 py-3 bg-text-main text-bg-deep rounded-xl text-[10px] font-black uppercase tracking-widest lg:hidden cursor-pointer">
                                Generar PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Reutilizable de Éxito de Firma */}
            {isSignedModalOpen && setIsSignedModalOpen && (
                <TimedSuccessModal
                    isOpen={isSignedModalOpen}
                    onClose={() => setIsSignedModalOpen(false)}
                    durationMs={4500}
                    title="¡Documento Firmado Exitosamente!"
                    subtitle="Su firma institucional ha sido estampada y certificada en el documento oficial con trazabilidad inmutable."
                    badgeText="Firma Electrónica Certificada"
                    details={[
                        { label: 'Documento', value: signedModalData?.documentTitle || title },
                        { label: 'Rol Firmante', value: signedModalData?.rolFirmante || 'Firmante Autorizado' },
                        { label: 'Fecha y Hora', value: signedModalData?.fechaFirma || new Date().toLocaleString() }
                    ]}
                />
            )}
        </div>
    );
};

export default OutputSection;
