import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
            const response = await api.get(`/documents/verify/${verifyCode}`);
            setResult(response.data);
        } catch (err: any) {
            setError(err.response?.status === 404 ? "El código de trazabilidad no es válido o el documento no ha sido emitido oficialmente." : "Error de conexión con el nodo de integridad DIITRA.");
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
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 px-2 animate-fade-up gap-6 md:gap-0">
                <div className="space-y-2">
                    <div className="section-label text-brand">
                        <ShieldCheck size={10} />
                        <span>Verificador Documental</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold text-text-main tracking-tighter uppercase leading-none">Verificación Forense</h2>
                    <p className="text-xs md:text-sm text-text-dim max-w-lg font-medium leading-relaxed">
                        Ingrese el código de trazabilidad impreso en el documento o escaneado vía QR para validar su autenticidad y estado legal ante el CACES.
                    </p>
                </div>
            </header>

            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up [animation-delay:100ms] px-2">
                {!result && !loading && (
                    <div className="lg:col-span-5 bento-card p-8 md:p-10 text-center">
                        <div className="flex justify-center mb-6 text-brand">
                            <ShieldCheck size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-text-main tracking-tighter mb-2">Consultar Autenticidad</h3>
                        <p className="text-sm text-text-dim mb-8">Ingrese el código de verificación impreso en el documento oficial</p>
                        <input
                            type="text"
                            placeholder="Ej: TRC-2024-XXXX-XXXX"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify(inputCode)}
                            className="input-vercel !text-center !text-xl !py-4 !font-mono"
                        />
                        <button
                            onClick={() => handleVerify(inputCode)}
                            className="btn-brand mt-6 w-full"
                        >
                            Validar Documento
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="lg:col-span-5 flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-brand" size={32} />
                        <p className="section-label text-text-dim">Consultando Nodo de Integridad...</p>
                    </div>
                )}

                {error && (
                    <div className="lg:col-span-5 bento-card !bg-error-subtle !border-error/30 p-8 md:p-10 text-center animate-fade-in">
                        <ShieldAlert size={32} className="text-error mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-text-main mb-2">Validación Fallida</h3>
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
<div className="lg:col-span-5 bento-card p-8 md:p-10 overflow-hidden animate-fade-in">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border-thin">
                            <ShieldCheck size={32} className="text-success shrink-0" />
                            <div>
                                <h3 className="text-xl font-bold tracking-tighter text-text-main">Documento Auténtico</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <div className="badge-vercel badge-vercel-success">
                                        <span className="dot dot-success" />
                                        Integridad SHA-256 Verificada
                                    </div>
                                    <div className="badge-vercel badge-vercel-success bg-brand/10 border-brand/20 text-brand-light">
                                        <span className="dot bg-brand animate-pulse" />
                                        Firma Digital PAdES Activa
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-6">
                            <div>
                                <label className="section-label text-text-dim mb-1">
                                    <FileText size={12}/> Tipo de Documento
                                </label>
                                <p className="text-sm font-bold text-text-main">{result.template_name || result.templateName || 'Protocolo de Investigación'}</p>
                            </div>
                            <div>
                                <label className="section-label text-text-dim mb-1">
                                    <User size={12}/> Emitido por
                                </label>
                                <p className="text-sm font-bold text-text-main">{result.generated_by || result.generatedBy || 'Sistema DIITRA'}</p>
                            </div>
                            <div>
                                <label className="section-label text-text-dim mb-1">
                                    <Calendar size={12}/> Fecha de Emisión
                                </label>
                                <p className="text-sm font-bold text-text-main">
                                    {new Date(result.generated_at || result.generatedAt).toLocaleDateString()} - {new Date(result.generated_at || result.generatedAt).toLocaleTimeString()}
                                </p>
                            </div>
                            <div>
                                <label className="section-label text-text-dim mb-1">
                                    <ShieldCheck size={12}/> Hash de Integridad
                                </label>
                                <p className="text-[10px] font-mono break-all text-text-dim">{result.file_hash || result.fileHash || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => { setResult(null); setInputCode(''); }}
                                className="btn-vercel-secondary w-full"
                            >
                                Verificar otro documento
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <footer className="mt-16 px-2 pb-8">
                <p className="section-label">Tecnológico Traversari - Sistema DIITRA</p>
            </footer>
        </main>
    );
};

export default VerifyDocument;
