import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '../../components/Common/PageHeader';
import { ShieldCheck, ShieldAlert, FileText, Calendar, User, Loader2 } from 'lucide-react';
import api from '../../api/axios_config';

const VerifyDocument = () => {
    const { code } = useParams<{ code: string }>();
    const [loading, setLoading] = useState(!!code);
    const [inputCode, setInputCode] = useState(code || '');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleVerify = async (verifyCode: string) => {
        if (!verifyCode) return;
        setLoading(true);
        setError(null);
        try {
            const cleanCode = verifyCode.trim();
            const response = await api.get(`/documents/verify/${cleanCode}`);
            setResult(response.data);
        } catch (err: any) {
            setError(
                err.response?.data?.error || 
                (err.response?.status === 404 
                    ? "El código de verificación o firma no es válido o no ha sido registrado oficialmente." 
                    : "No se pudo conectar con el servicio de verificación. Intente de nuevo.")
            );
            setResult(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (code) handleVerify(code);
    }, [code]);

    return (
        <main className="flex-1 bg-bg-deep p-4 md:p-10 overflow-y-auto">
            <PageHeader
                kicker="Verificador Documental y de Firmas"
                icon={ShieldCheck}
                title="Verificación de autenticidad"
                description="Ingrese el código de trazabilidad de documento o de firma (DFRM) impreso o escaneado vía QR para validar su autenticidad."
            />

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up [animation-delay:100ms]">
                {!result && !loading && (
                    <div className="lg:col-span-5 bento-card static p-8 md:p-10 text-center">
                        <div className="flex justify-center mb-6 text-brand">
                            <ShieldCheck size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-semibold text-text-main tracking-tighter mb-2">Consultar Autenticidad</h3>
                        <p className="text-sm text-text-dim mb-8">Ingrese el código de firma (DFRM-...) o de trazabilidad impreso en el documento</p>
                        <input
                            type="text"
                            placeholder="Ej: DFRM-2026-CBF1A7A8 o TRC-2026-XXXX"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify(inputCode)}
                            className="input-vercel !text-center !text-xl !py-4 !font-mono"
                        />
                        <button
                            onClick={() => handleVerify(inputCode)}
                            className="btn-brand mt-6 w-full"
                        >
                            Validar Documento o Firma
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="lg:col-span-5 flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-brand" size={32} />
                        <p className="section-label text-text-dim">Consultando verificación...</p>
                    </div>
                )}

                {error && (
                    <div className="lg:col-span-5 bento-card static !bg-error-subtle !border-error/30 p-8 md:p-10 text-center animate-fade-in">
                        <ShieldAlert size={32} className="text-error mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-text-main mb-2">Validación Fallida</h3>
                        <p className="text-sm text-text-dim mb-8">{error}</p>
                        <button
                            onClick={() => { setResult(null); setError(null); }}
                            className="btn-vercel-secondary"
                        >
                            Intentar con otro código
                        </button>
                    </div>
                )}

                {result && (
                    <>
                        <div className="lg:col-span-5 bento-card static p-8 md:p-10 overflow-hidden animate-fade-in flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-thin">
                                    <ShieldCheck size={32} className="text-success shrink-0" />
                                    <div>
                                        <h3 className="text-xl font-semibold tracking-tighter text-text-main">
                                            {result.template_code === 'DFRM-VERIFY' || result.templateCode === 'DFRM-VERIFY' 
                                                ? 'Firma Auténtica Registrada' 
                                                : 'Documento Auténtico'}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <div className="badge-vercel badge-vercel-success">
                                                <span className="dot dot-success" />
                                                Integridad verificada
                                            </div>
                                            {result.signatures && result.signatures.length > 0 && (
                                                <div className="badge-vercel badge-vercel-success bg-brand/10 border-brand/20 text-brand-light">
                                                    <span className="dot bg-brand animate-pulse" />
                                                    {result.signatures.length} {result.signatures.length === 1 ? 'Firma activa' : 'Firmas activas'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <FileText size={12} /> Tipo de Documento / Registro
                                        </label>
                                        <p className="text-sm font-semibold text-text-main">{result.template_name || result.templateName || 'Firma Institucional DIITRA'}</p>
                                    </div>
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <User size={12} /> Emitido por / Firmante
                                        </label>
                                        <p className="text-sm font-semibold text-text-main">{result.generated_by || result.generatedBy || 'Sistema DIITRA'}</p>
                                    </div>
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <Calendar size={12} /> Fecha de Registro / Emisión
                                        </label>
                                        <p className="text-sm font-semibold text-text-main">
                                            {new Date(result.generated_at || result.generatedAt).toLocaleDateString()} - {new Date(result.generated_at || result.generatedAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="section-label text-text-dim mb-1">
                                            <ShieldCheck size={12} /> Hash de trazabilidad (SHA-256)
                                        </label>
                                        <p className="text-[10px] font-mono break-all text-text-dim">{result.file_hash || result.fileHash || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => { setResult(null); setInputCode(''); }}
                                    className="btn-vercel-secondary w-full"
                                >
                                    Verificar otro código
                                </button>
                            </div>
                        </div>

                        {result.signatures && result.signatures.length > 0 && (
                            <div className="lg:col-span-7 bento-card static p-8 md:p-10 overflow-hidden animate-fade-in">
                                <h3 className="text-xl font-semibold tracking-tighter text-text-main mb-2">Cadena de Custodia Criptográfica</h3>
                                <p className="text-xs text-text-dim mb-6 leading-relaxed">
                                    DIITRA implementa un modelo de firmas digitales institucionales consecutivas (en cascada). Cada firmante sella el documento en su estado actual, estampando su bloque visual e incorporando la huella digital criptográfica (hash).
                                </p>
                                
                                <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-border-thin">
                                    {result.signatures.map((sig: any, index: number) => {
                                        const firmaCode = sig.firmaCode || sig.firma_code;
                                        const firmanteNombre = sig.firmanteNombre || sig.firmante_nombre;
                                        const firmanteRol = sig.firmanteRol || sig.firmante_rol;
                                        const fechaFirma = sig.fechaFirma || sig.fecha_firma;
                                        const docHash = sig.docHash || sig.doc_hash;
                                        const esValida = sig.esValida !== undefined ? sig.esValida : (sig.es_valida !== undefined ? sig.es_valida : true);
                                        const motivoRevocacion = sig.motivoRevocacion || sig.motivo_revocacion;

                                        return (
                                            <div key={firmaCode || index} className="relative pl-8">
                                                <span className={`absolute left-1 top-1 w-4 h-4 rounded-full border-2 border-bg-deep flex items-center justify-center ${esValida ? 'bg-success' : 'bg-error'}`} />
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-light">
                                                            {index + 1}ª Firma aplicada ({firmaCode})
                                                        </span>
                                                        <h4 className="text-sm font-semibold text-text-main mt-0.5">{firmanteNombre}</h4>
                                                        <p className="text-xs text-text-dim font-medium">{firmanteRol}</p>
                                                    </div>
                                                    <div className="text-left md:text-right shrink-0">
                                                        <span className="text-[10px] text-text-dim block">
                                                            {fechaFirma ? `${new Date(fechaFirma).toLocaleDateString()} - ${new Date(fechaFirma).toLocaleTimeString()}` : ''}
                                                        </span>
                                                        <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded mt-1 ${esValida ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                                                            {esValida ? 'Válida / Activa' : 'Revocada'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {motivoRevocacion && (
                                                    <p className="text-xs text-error mt-1 italic">
                                                        Motivo de revocación: {motivoRevocacion}
                                                    </p>
                                                )}
                                                <div className="mt-2 p-2 bg-bg-deep rounded border border-border-thin">
                                                    <span className="text-[9px] uppercase tracking-wider text-text-dim block font-semibold mb-0.5">Hash del PDF Firmado (SHA-256)</span>
                                                    <span className="text-[9px] font-mono break-all text-text-main">{docHash}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
};

export default VerifyDocument;
