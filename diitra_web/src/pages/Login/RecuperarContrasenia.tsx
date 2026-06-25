import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle, ArrowLeft, Sun, Moon } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE = (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin;

interface RecuperarContraseniaProps {
    currentTheme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

const RecuperarContrasenia = ({ currentTheme = 'dark', toggleTheme }: RecuperarContraseniaProps) => {
    const theme = currentTheme;
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
            setEnviado(true);
        } catch {
            setError('Error de conexión. Por favor intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-deep transition-colors duration-500 overflow-hidden relative">
            {/* Theme Toggle Button */}
            {toggleTheme && (
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 text-text-dim hover:text-text-main transition-all duration-300 z-30 cursor-pointer"
                    title={currentTheme === 'dark' ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                >
                    {currentTheme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
                </button>
            )}

            <div className="w-full max-w-[350px] space-y-7 relative z-20 animate-fade-up">

                {/* Brand — igual que Login */}
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src={theme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tighter text-text-main">
                            Recuperar contraseña
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium tracking-tight">
                            Departamento de Investigación e Innovación Traversari
                        </p>
                    </div>
                </div>

                {!enviado ? (
                    <div className="space-y-6">
                        <p className="text-[12px] text-text-dim text-center leading-relaxed px-1">
                            Ingresa tu cédula o correo institucional y recibirás un enlace seguro para ver tu contraseña.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label
                                    htmlFor="identificador"
                                    className="text-[10px] font-semibold uppercase tracking-widest text-text-dim ml-1"
                                >
                                    Cédula o correo institucional
                                </label>
                                <input
                                    id="identificador"
                                    type="text"
                                    value={identificador}
                                    onChange={(e) => setIdentificador(e.target.value)}
                                    className="input-vercel h-11"
                                    placeholder="1777**** o nombre@istpet.edu.ec"
                                    autoComplete="username"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-md bg-error/5 border border-error/20 text-error text-[10px] font-mono leading-relaxed animate-in fade-in slide-in-from-top-1">
                                    {error}
                                </div>
                            )}

                            <div className="pt-4 space-y-3">
                                <button
                                    type="submit"
                                    id="btn-recuperar"
                                    disabled={isSubmitting || !identificador.trim()}
                                    className="btn-vercel-primary w-full h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : 'Enviar enlace de recuperación'
                                    }
                                </button>

                                <Link
                                    to="/auth/login"
                                    className="flex items-center justify-center gap-1.5 w-full h-10 text-[9px] font-mono text-text-dim hover:text-text-main transition-colors uppercase tracking-[0.2em] no-underline"
                                >
                                    <ArrowLeft size={11} />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* Confirmación */
                    <div className="space-y-6 text-center animate-fade-up">
                        <div className="flex justify-center">
                            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center border border-border-thin">
                                <CheckCircle size={20} className="text-text-main" strokeWidth={1.5} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-text-main tracking-tight">
                                Revisa tu correo institucional
                            </h2>
                            <p className="text-[12px] text-text-dim leading-relaxed">
                                Si tu cédula o correo está registrado en DIITRA, recibirás un enlace en los próximos minutos.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-border-thin bg-surface/40 space-y-1 text-left">
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-text-dim">Importante</p>
                            <ul className="text-[11px] text-text-dim space-y-1 mt-1.5 leading-relaxed list-none p-0">
                                <li>· El enlace expira en <strong className="text-text-main">30 minutos</strong></li>
                                <li>· Es de <strong className="text-text-main">un solo uso</strong></li>
                                <li>· Revisa también la carpeta de spam</li>
                            </ul>
                        </div>

                        <Link
                            to="/auth/login"
                            className="flex items-center justify-center gap-1.5 w-full h-10 text-[9px] font-mono text-text-dim hover:text-text-main transition-colors uppercase tracking-[0.2em] no-underline"
                        >
                            <ArrowLeft size={11} />
                            Volver al inicio de sesión
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecuperarContrasenia;
