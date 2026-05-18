import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
        <div className="min-h-screen bg-[#000] text-white flex flex-col font-sans">
            {/* Header Minimalista */}
            <header className="p-8 flex justify-between items-center border-b border-white/5 bg-white/2 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#0070f3] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.4)]">
                        <ShieldCheck size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tighter uppercase leading-none">DIITRA <span className="text-white/40 font-light text-sm">Integrity</span></h1>
                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Validador de Trazabilidad Institucional</p>
                    </div>
                </div>
                <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Volver al Portal</Link>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
                {!result && !loading && (
                    <div className="w-full max-w-xl animate-fade-in text-center">
                        <div className="mb-12">
                            <h2 className="text-4xl font-black tracking-tighter mb-4">Verificación Forense</h2>
                            <p className="text-white/60 text-sm leading-relaxed">Ingrese el código de trazabilidad impreso en el documento o escaneado vía QR para validar su autenticidad y estado legal ante el CACES.</p>
                        </div>
                        
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="Ej: TRC-2024-XXXX-XXXX"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-xl font-mono text-center focus:border-[#0070f3] focus:bg-white/10 outline-none transition-all"
                            />
                            <button 
                                onClick={() => handleVerify(inputCode)}
                                className="mt-6 w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#0070f3] hover:text-white transition-all shadow-xl"
                            >
                                Validar Documento
                            </button>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex flex-col items-center gap-6 animate-pulse">
                        <Loader2 size={60} className="text-[#0070f3] animate-spin" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">Consultando Nodo de Integridad...</p>
                    </div>
                )}

                {error && (
                    <div className="w-full max-w-xl p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center animate-fade-in">
                        <ShieldAlert size={48} className="text-red-500 mx-auto mb-6" />
                        <h3 className="text-xl font-black mb-2">Validación Fallida</h3>
                        <p className="text-sm text-white/60 mb-8">{error}</p>
                        <button onClick={() => {setResult(null); setError(null);}} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors underline">Intentar con otro código</button>
                    </div>
                )}

                {result && (
                    <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden animate-fade-in shadow-2xl">
                        <div className="p-10 bg-green-500/10 border-b border-white/5 flex items-center gap-6">
                            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                                <ShieldCheck size={32} className="text-black" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tighter">Documento Auténtico</h3>
                                <p className="text-[10px] font-black uppercase text-green-500 tracking-widest mt-1">Integridad SHA-256 Verificada</p>
                            </div>
                        </div>

                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 flex items-center gap-2"><FileText size={12}/> Tipo de Documento</p>
                                    <p className="text-sm font-bold">{result.template_name || result.templateName || 'Protocolo de Investigación'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 flex items-center gap-2"><User size={12}/> Emitido por</p>
                                    <p className="text-sm font-bold">{result.generated_by || result.generatedBy || 'Sistema DIITRA'}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 flex items-center gap-2"><Calendar size={12}/> Fecha de Emisión</p>
                                    <p className="text-sm font-bold">
                                        {new Date(result.generated_at || result.generatedAt).toLocaleDateString()} - {new Date(result.generated_at || result.generatedAt).toLocaleTimeString()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-2 flex items-center gap-2"><ShieldCheck size={12}/> Hash de Integridad</p>
                                    <p className="text-[10px] font-mono break-all text-white/60">{result.file_hash || result.fileHash || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white/2 border-t border-white/5 flex justify-center">
                             <button onClick={() => {setResult(null); setInputCode('');}} className="px-8 py-3 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Verificar otro documento</button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="p-12 text-center">
                <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.5em]">DIITRA Trust Architecture • IST Traversari • Quito, Ecuador</p>
            </footer>
        </div>
    );
};

export default VerifyDocument;
