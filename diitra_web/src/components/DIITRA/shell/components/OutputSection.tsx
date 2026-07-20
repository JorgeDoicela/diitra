import React from 'react';
import { Settings, FileText, Users, Shield, CheckCircle, Clock } from 'lucide-react';
import { FullscreenLoader } from '../../Common/FullscreenLoader';
import { SignatureBlock } from '../SignatureBlock';

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
    signatureRefreshTrigger
}) => {
    return (
        <div className="flex-1 p-3 md:p-5 lg:p-6 flex flex-col gap-3 md:gap-4 animate-fade-in overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 flex-1 overflow-y-auto lg:overflow-hidden p-1">
                {/* Panel de Controles Unificado */}
                <div className="col-span-1 lg:col-span-3 bg-bg-deep border border-border-thin rounded-2xl shadow-sm flex flex-col lg:overflow-hidden lg:h-full">
                    {/* Sección 1: Emisión */}
                    <div className="p-5 flex flex-col gap-4 shrink-0">
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-text-dim flex items-center gap-2">
                            <Settings size={16} className="text-text-dim" /> Emisión
                        </h4>
                        <div className="space-y-4">
                            {/* Switch sin tarjeta contenedora - Vercel Style */}
                            <div className="flex items-center justify-between py-1">
                                <div>
                                    <p className="text-sm font-semibold text-text-main">Modo borrador</p>
                                    <p className="text-xs text-text-dim">Marca de agua de seguridad</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={isDraftMode} onChange={(e) => setIsDraftMode(e.target.checked)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-border-thin peer-focus:outline-none rounded-full peer peer-checked:bg-text-main after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                                </label>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                                <button onClick={() => handleGeneratePdf(false)} className="w-full bg-text-main hover:bg-text-main/90 text-bg-deep px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                                    <FileText size={15} /> Generar vista previa
                                </button>
                                <button onClick={() => handleGeneratePdf(true)} className="w-full border border-border-thin bg-transparent hover:bg-surface text-text-main/80 hover:text-text-main px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer">
                                    <Users size={15} /> Vista sin identidades
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border-thin shrink-0" />
                    {/* Sección 2: Firma Electrónica */}
                    <div className="p-5 flex-1 flex flex-col gap-4 min-h-0 lg:overflow-y-auto custom-scrollbar relative">
                        {isSigning ? (
                            <FullscreenLoader 
                                fullscreen={false} 
                                message={[
                                    "Verificando credenciales...",
                                    "Aplicando firma electrónica...",
                                    "Estampando sello institucional...",
                                    "Regenerando documento PDF..."
                                ]} 
                            />
                        ) : (
                            <div className="flex flex-col gap-4">
                            {projectStatus === 'Enviado' || projectStatus === 'Aprobado' || projectStatus === 'En Ejecución' ? (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center space-y-2.5">
                                    <div className="flex justify-center">
                                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                            <CheckCircle size={20} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-text-main">Documento Firmado</p>
                                        <p className="text-xs text-text-dim leading-relaxed">
                                            Este documento ya ha sido firmado y emitido oficialmente en estado <span className="text-green-500 font-bold">"{projectStatus}"</span>.
                                        </p>
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
                                            Solo el Director de Proyecto está autorizado para firmar digitalmente este protocolo.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-5">
                                    {(signatureType === 'DIITRA' || signatureType === 'HIBRIDO') && (
                                        /* Firma Institucional DIITRA (Sello + Trazo) */
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
                                        /* Upload-on-demand: el certificado se adjunta en el momento de firmar */
                                        <div className="flex flex-col gap-3 p-4 border border-border-thin rounded-2xl bg-surface/30">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText size={16} className="text-text-main" />
                                                <h4 className="text-xs font-black uppercase tracking-wider text-text-main">Firma Digital (.p12 / .pfx)</h4>
                                            </div>
                                            {/* Dropzone certificado .p12 */}
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

                                            {/* Contraseña */}
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
                        )}
                    </div>
                </div>

                {/* Visor de PDF */}
                <div className="col-span-1 lg:col-span-9 bg-bg-deep border border-border-thin rounded-2xl flex flex-col shadow-inner relative overflow-hidden min-h-[500px]">
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
        </div>
    );
};
