import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, CheckCircle, ArrowLeft } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5175';

const RecuperarContrasenia = () => {
    const [identificador, setIdentificador] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!identificador.trim()) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await fetch(`${API_BASE}/api/auth/recuperar-contrasenia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identificador: identificador.trim() }),
            });
            // Siempre mostrar confirmación (sin revelar si el usuario existe)
            setEnviado(true);
        } catch {
            setError('Error de conexión. Por favor intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-deep transition-colors duration-500">
            <div className="w-full max-w-[350px] space-y-7 animate-fade-up">

                {/* Brand */}
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src="/logo_blanco.png"
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo_negro.png'; }}
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tighter text-text-main">
                            Recuperar contraseña
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium tracking-tight">
                            Departamento de Investigación e Innovación Traversari
                        </p>
                    </div>
                </div>

                {!enviado ? (
                    <div className="space-y-6">
                        <p className="text-[12px] text-text-dim text-center leading-relaxed">
                            Ingresa tu cédula de identidad o correo institucional y te enviaremos 
                            un enlace seguro para recuperar tu contraseña.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="identificador"
                                    className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1"
                                >
                                    Cédula o correo institucional
                                </label>
                                <input
                                    id="identificador"
                                    type="text"
                                    value={identificador}
                                    onChange={(e) => setIdentificador(e.target.value)}
                                    className="input-vercel h-11"
                                    placeholder="0302144159 o nombre@istpet.edu.ec"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-error/5 border border-error/20 text-error text-[10px] font-mono leading-relaxed animate-in fade-in">
                                    {error}
                                </div>
                            )}

                            <div className="pt-2 space-y-3">
                                <button
                                    type="submit"
                                    id="btn-recuperar"
                                    disabled={isSubmitting || !identificador.trim()}
                                    className="btn-vercel-primary w-full h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            <Mail size={14} />
                                            Enviar enlace de recuperación
                                        </span>
                                    )}
                                </button>

                                <Link
                                    to="/auth/login"
                                    className="flex items-center justify-center gap-2 w-full h-10 text-[10px] font-medium text-text-dim hover:text-text-main transition-colors uppercase tracking-widest no-underline"
                                >
                                    <ArrowLeft size={12} />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Pantalla de confirmación */
                    <div className="space-y-6 text-center animate-fade-up">
                        <div className="flex justify-center">
                            <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center border border-border-thin">
                                <CheckCircle size={24} className="text-text-main" strokeWidth={1.5} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-base font-semibold text-text-main tracking-tight">
                                Revisa tu correo institucional
                            </h2>
                            <p className="text-[12px] text-text-dim leading-relaxed">
                                Si tu cédula o correo está registrado en DIITRA, recibirás un enlace 
                                en los próximos minutos.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-border-thin bg-surface/40 space-y-1 text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                                Importante
                            </p>
                            <ul className="text-[11px] text-text-dim space-y-1 mt-2 leading-relaxed list-none p-0">
                                <li>• El enlace expira en <strong className="text-text-main">30 minutos</strong></li>
                                <li>• Es de <strong className="text-text-main">un solo uso</strong></li>
                                <li>• Revisa también tu carpeta de spam</li>
                            </ul>
                        </div>

                        <Link
                            to="/auth/login"
                            className="flex items-center justify-center gap-2 w-full h-10 text-[10px] font-medium text-text-dim hover:text-text-main transition-colors uppercase tracking-widest no-underline"
                        >
                            <ArrowLeft size={12} />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecuperarContrasenia;
