import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Eye, EyeOff, AlertTriangle, ArrowLeft, ShieldCheck, Copy, CheckCheck, Sun, Moon } from 'lucide-react';

const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
const API_BASE = (apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase) || window.location.origin;

type Estado = 'validando' | 'valido' | 'hash_inaccesible' | 'invalido';

interface VerContraseniaProps {
    currentTheme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

const VerContrasenia = ({ currentTheme = 'dark', toggleTheme }: VerContraseniaProps) => {
    const theme = currentTheme;
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [estado, setEstado] = useState<Estado>('validando');
    const [nombre, setNombre] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [copiado, setCopiado] = useState(false);
    const [mensajeError, setMensajeError] = useState('');

    useEffect(() => {
        if (!token) {
            setEstado('invalido');
            setMensajeError('No se encontró un token de recuperación en el enlace.');
            return;
        }
        validarToken(token);
    }, [token]);

    const validarToken = async (tok: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/auth/ver-contrasenia`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tok }),
            });

            const data = await res.json();

            if (!res.ok) {
                setEstado('invalido');
                setMensajeError(data.message ?? 'El enlace ha expirado o ya fue utilizado.');
                return;
            }

            setNombre(data.nombre ?? '');

            if (data.esHashInaccesible) {
                setEstado('hash_inaccesible');
            } else {
                setPassword(data.password ?? '');
                setEstado('valido');
            }
        } catch {
            setEstado('invalido');
            setMensajeError('Error de conexión. Por favor intenta nuevamente.');
        }
    };

    const copiarPassword = () => {
        navigator.clipboard.writeText(password);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-deep transition-colors duration-500 relative">
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

            <div className="w-full max-w-[380px] space-y-7 animate-fade-up">

                {/* Brand */}
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src={theme === 'dark' ? `${import.meta.env.BASE_URL}logo_blanco.png` : `${import.meta.env.BASE_URL}logo_negro.png`}
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tighter text-text-main">
                            Recuperación de contraseña
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium tracking-tight">
                            Departamento de Investigación e Innovación Traversari
                        </p>
                    </div>
                </div>

                {/* Estado: Validando */}
                {estado === 'validando' && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-text-dim" />
                        <p className="text-[12px] text-text-dim">Verificando enlace de seguridad...</p>
                    </div>
                )}

                {/* Estado: Contraseña disponible */}
                {estado === 'valido' && (
                    <div className="space-y-5 animate-fade-up">
                        <div className="flex items-center gap-3 p-4 rounded-lg border border-border-thin bg-surface/40">
                            <ShieldCheck size={18} className="text-text-main shrink-0" strokeWidth={1.5} />
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">
                                    Identidad verificada
                                </p>
                                <p className="text-[12px] text-text-main font-medium mt-0.5">
                                    {nombre}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-text-dim ml-1">
                                Tu contraseña de acceso
                            </label>
                            <div className="relative">
                                <input
                                    id="campo-password"
                                    type={mostrarPassword ? 'text' : 'password'}
                                    value={password}
                                    readOnly
                                    className="input-vercel h-11 pr-20 font-mono tracking-widest select-all"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setMostrarPassword(!mostrarPassword)}
                                        className="p-1.5 text-text-dim hover:text-text-main transition-colors"
                                        title={mostrarPassword ? 'Ocultar' : 'Mostrar'}
                                    >
                                        {mostrarPassword
                                            ? <EyeOff size={14} />
                                            : <Eye size={14} />
                                        }
                                    </button>
                                    <button
                                        type="button"
                                        onClick={copiarPassword}
                                        className="p-1.5 text-text-dim hover:text-text-main transition-colors"
                                        title="Copiar contraseña"
                                    >
                                        {copiado ? <CheckCheck size={14} className="text-text-main" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                            {copiado && (
                                <p className="text-[10px] text-text-dim font-mono ml-1 animate-in fade-in">
                                    ✓ Copiado al portapapeles
                                </p>
                            )}
                        </div>

                        <div className="p-4 rounded-lg border border-border-thin bg-surface/40 space-y-1">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">
                                Este enlace ya fue utilizado
                            </p>
                            <p className="text-[11px] text-text-dim leading-relaxed mt-1">
                                Por seguridad, este enlace expira después de ser consultado. 
                                Guarda tu contraseña en un lugar seguro.
                            </p>
                        </div>

                        <Link
                            to="/auth/login"
                            className="btn-vercel-primary w-full h-11 flex items-center justify-center gap-2 no-underline text-[11px] uppercase tracking-widest font-semibold"
                        >
                            Ir al inicio de sesión
                        </Link>
                    </div>
                )}

                {/* Estado: Hash inaccesible */}
                {estado === 'hash_inaccesible' && (
                    <div className="space-y-5 animate-fade-up">
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-border-thin bg-surface/40">
                            <AlertTriangle size={18} className="text-text-dim shrink-0 mt-0.5" strokeWidth={1.5} />
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">
                                    Contraseña encriptada
                                </p>
                                <p className="text-[12px] text-text-dim leading-relaxed">
                                    Tu contraseña está almacenada con encriptación avanzada en el sistema 
                                    institucional y no puede ser recuperada automáticamente.
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg border border-border-thin bg-surface/20 space-y-2">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-dim">
                                ¿Qué puedo hacer?
                            </p>
                            <ul className="text-[11px] text-text-dim space-y-1.5 leading-relaxed list-none p-0">
                                <li>• Contacta al administrador de SIGAFI de tu institución</li>
                                <li>• Solicita el restablecimiento de contraseña en la Dirección de Sistemas</li>
                                <li>• Intenta con tu contraseña de SIGAFI habitual</li>
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

                {/* Estado: Token inválido/expirado */}
                {estado === 'invalido' && (
                    <div className="space-y-5 animate-fade-up">
                        <div className="flex items-start gap-3 p-4 rounded-lg border border-error/30 bg-error/5">
                            <AlertTriangle size={18} className="text-error shrink-0 mt-0.5" strokeWidth={1.5} />
                            <div className="space-y-1">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-error">
                                    Enlace inválido o expirado
                                </p>
                                <p className="text-[12px] text-text-dim leading-relaxed">
                                    {mensajeError}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Link
                                to="/auth/recuperar-contrasenia"
                                className="btn-vercel-primary w-full h-11 flex items-center justify-center gap-2 no-underline text-[11px] uppercase tracking-widest font-semibold"
                            >
                                Solicitar nuevo enlace
                            </Link>

                            <Link
                                to="/auth/login"
                                className="flex items-center justify-center gap-2 w-full h-10 text-[10px] font-medium text-text-dim hover:text-text-main transition-colors uppercase tracking-widest no-underline"
                            >
                                <ArrowLeft size={12} />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerContrasenia;
