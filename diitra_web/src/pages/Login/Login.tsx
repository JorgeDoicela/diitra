import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import { Loader2, Lock, Sun, Moon, Key } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres')
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
    currentTheme?: 'dark' | 'light';
    toggleTheme?: () => void;
}

const Login = ({ currentTheme = 'dark', toggleTheme }: LoginProps) => {
    const { login, loginWithMicrosoft } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock Microsoft Login State
    const [showMockModal, setShowMockModal] = useState(false);
    const [mockEmail, setMockEmail] = useState('jorge.doicela@istpet.edu.ec');
    const [mockName, setMockName] = useState('Jorge Doicela');
    const [isMockSubmitting, setIsMockSubmitting] = useState(false);

    // Lockout state
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (location.state?.error) {
            setError(location.state.error);
        }
    }, [location.state]);

    const startLockoutCountdown = (seconds: number) => {
        setLockoutSeconds(seconds);
        if (lockoutRef.current) clearInterval(lockoutRef.current);
        lockoutRef.current = setInterval(() => {
            setLockoutSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(lockoutRef.current!);
                    setError(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Cleanup on unmount
    useEffect(() => () => { if (lockoutRef.current) clearInterval(lockoutRef.current); }, []);

    const formatLockoutTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
    };

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });
    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const onSubmit = async (data: LoginFormValues) => {
        if (lockoutSeconds > 0) return; // Bloquear envío mientras hay lockout
        setIsSubmitting(true);
        setError(null);
        try {
            const user = await login(data);

            // Determinar página de destino si no viene de una ruta específica
            let target = from;
            if (target === '/dashboard') {
                const roles = (user.roles || [user.role] || []).map((r: string) => r.toUpperCase());
                const isAdmin = user.administrador || roles.includes('DIITRA_ADMIN') || roles.includes('ADMIN_SISTEMA');
                const isDocente = roles.includes('DIITRA_DOCENTE') || roles.includes('DOCENTE_INV') || roles.includes('DIRECTOR_INV');

                if (isAdmin) target = '/usuarios';
                else if (isDocente) target = '/investigacion';
            }

            navigate(target, { replace: true });
        } catch (err: any) {
            const status = err.response?.status;
            if (status === 429) {
                // Cuenta bloqueada — mostrar countdown
                const secs: number = err.response?.data?.segundos_restantes ?? err.response?.data?.segundosRestantes ?? 300;
                const msg: string = err.response?.data?.message ?? 'Cuenta bloqueada temporalmente.';
                setError(msg);
                startLockoutCountdown(secs);
            } else {
                setError(err.response?.data?.message || 'Credenciales incorrectas. Verifique su usuario y contraseña.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMicrosoftLogin = () => {
        const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
        const isMockMode = !clientId || clientId.includes('YOUR_') || clientId === 'placeholder';

        if (isMockMode) {
            setShowMockModal(true);
        } else {
            // Redirect to real Microsoft OAuth page
            const redirectUri = window.location.origin + '/auth/microsoft-callback';
            const tenant = import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common';
            const scope = encodeURIComponent('openid profile email');
            const responseMode = 'fragment';
            const state = Math.random().toString(36).substring(2, 15);
            const nonce = Math.random().toString(36).substring(2, 15);

            localStorage.setItem('microsoft_oauth_state', state);
            localStorage.setItem('microsoft_oauth_nonce', nonce);

            const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?` +
                `client_id=${clientId}` +
                `&response_type=id_token` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${scope}` +
                `&response_mode=${responseMode}` +
                `&state=${state}` +
                `&nonce=${nonce}`;

            window.location.href = authUrl;
        }
    };

    const handleMockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mockEmail) return;
        setIsMockSubmitting(true);
        setError(null);
        try {
            const payload = `mock-email:${mockEmail.trim()}:${mockName.trim()}`;
            const user = await loginWithMicrosoft(payload);

            let target = from;
            if (target === '/dashboard') {
                const roles = (user.roles || [user.role] || []).map((r: string) => r.toUpperCase());
                const isAdmin = user.administrador || roles.includes('DIITRA_ADMIN') || roles.includes('ADMIN_SISTEMA');
                const isDocente = roles.includes('DIITRA_DOCENTE') || roles.includes('DOCENTE_INV') || roles.includes('DIRECTOR_INV');

                if (isAdmin) target = '/usuarios';
                else if (isDocente) target = '/investigacion';
            }

            setShowMockModal(false);
            navigate(target, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión con Microsoft (Simulado).');
        } finally {
            setIsMockSubmitting(false);
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
                {/* Brand Logo & Header */}
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'}
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tighter text-text-main">Entrar a DIITRA</h1>
                        <p className="text-[11px] text-text-dim font-medium tracking-tight">Departamento de Investigación e Innovación Traversari</p>
                    </div>
                </div>

                {/* Login Form Card */}
                <div className="space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1" htmlFor="username">
                                Usuario
                            </label>
                            <input
                                {...register('username')}
                                className="input-vercel h-11"
                                placeholder="Cédula de identidad o Correo"
                                autoComplete="username"
                            />
                            {errors.username && <p className="text-[10px] text-error font-mono mt-1 ml-1">{(errors.username as any).message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim" htmlFor="password">
                                    Contraseña
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-[10px] text-text-dim hover:text-text-main transition-colors font-medium"
                                >
                                    {showPassword ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                className="input-vercel h-11"
                                placeholder="Contraseña de SIGAFI"
                                autoComplete="current-password"
                            />
                            <div className="flex justify-end px-1">
                                <Link
                                    to="/auth/recuperar-contrasenia"
                                    className="text-[10px] text-text-dim hover:text-text-main transition-colors font-medium no-underline"
                                    tabIndex={-1}
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                            {errors.password && <p className="text-[10px] text-error font-mono mt-1 ml-1">{(errors.password as any).message}</p>}
                        </div>

                        {/* Error / Lockout display */}
                        {lockoutSeconds > 0 ? (
                            <div className="p-4 rounded-lg bg-error/5 border border-error/30 space-y-2 animate-in fade-in">
                                <div className="flex items-center gap-2 text-error">
                                    <Lock size={14} className="shrink-0" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Cuenta bloqueada temporalmente</span>
                                </div>
                                <p className="text-[9px] text-text-dim leading-relaxed">{error}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[9px] text-text-dim uppercase tracking-widest">Tiempo restante:</span>
                                    <span className="font-mono text-sm font-black text-error tabular-nums">
                                        {formatLockoutTime(lockoutSeconds)}
                                    </span>
                                </div>
                                <div className="w-full bg-border-thin rounded-full h-1 overflow-hidden">
                                    <div
                                        className="h-full bg-error transition-all duration-1000"
                                        style={{ width: `${Math.min(100, (lockoutSeconds / 300) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ) : error ? (
                            <div className="p-3 rounded-md bg-error/5 border border-error/20 text-error text-[10px] font-mono leading-relaxed animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        ) : null}

                        <div className="pt-3 space-y-5">
                            <button
                                type="submit"
                                disabled={isSubmitting || lockoutSeconds > 0}
                                className="btn-vercel-primary w-full h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : lockoutSeconds > 0 ? (
                                    <span className="font-mono">{formatLockoutTime(lockoutSeconds)}</span>
                                ) : (
                                    'Continuar'
                                )}
                            </button>

                            <div className="flex items-center">
                                <div className="flex-1 border-t border-border-thin"></div>
                                <span className="px-3 text-[9px] font-mono text-text-dim uppercase tracking-wider">o</span>
                                <div className="flex-1 border-t border-border-thin"></div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Microsoft Login Button */}
                                <button
                                    type="button"
                                    onClick={handleMicrosoftLogin}
                                    className="w-full h-11 flex items-center justify-center gap-2 bg-surface hover:bg-surface/80 text-text-main border border-border-thin rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow"
                                >
                                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 21 21">
                                        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                                        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                                        <rect x="1" y="11" width="9" height="9" fill="#00A1F1" />
                                        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                                    </svg>
                                    <span>Microsoft</span>
                                </button>

                                {/* Acceso con PIN */}
                                <Link
                                    to="/auth/pin"
                                    className="w-full h-11 flex items-center justify-center gap-2 bg-transparent hover:bg-surface/30 text-text-main border border-border-thin rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-sm hover:shadow no-underline"
                                    title="Ingresar con código PIN de handoff"
                                >
                                    <Key size={13} className="shrink-0 text-text-dim" />
                                    <span>Tengo un PIN</span>
                                </Link>
                            </div>
                        </div>
                    </form>

                    <div className="text-center pt-2">
                        <div className="flex justify-center items-center gap-8 text-[9px] font-mono text-text-dim uppercase tracking-[0.2em]">
                            <Link to="/" className="hover:text-text-main transition-colors no-underline">Inicio</Link>
                            <span>/</span>
                            <a href="#" className="hover:text-text-main transition-colors no-underline">Ayuda</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Microsoft Simulation Mock Modal */}
            {showMockModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-[380px] bg-bg-deep border border-border-thin rounded-2xl p-6 space-y-6 shadow-2xl animate-fade-up relative">
                        <button
                            onClick={() => setShowMockModal(false)}
                            className="absolute top-4 right-4 text-text-dim hover:text-text-main text-sm"
                        >
                            ✕
                        </button>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 shrink-0" viewBox="0 0 21 21">
                                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                                    <rect x="1" y="11" width="9" height="9" fill="#00A1F1" />
                                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                                </svg>
                                <h3 className="text-sm font-bold text-text-main uppercase tracking-wider">Microsoft SSO Simulator</h3>
                            </div>
                            <p className="text-[10px] text-text-dim leading-relaxed">
                                Entorno de Desarrollo: Simula la autenticación OAuth2 de Microsoft utilizando una cuenta del dominio @istpet.edu.ec.
                            </p>
                        </div>

                        <form onSubmit={handleMockSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                                    Nombre a Simular
                                </label>
                                <input
                                    type="text"
                                    value={mockName}
                                    onChange={(e) => setMockName(e.target.value)}
                                    className="input-vercel h-10"
                                    placeholder="Nombre Completo"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-bold uppercase tracking-wider text-text-dim">
                                    Correo Institucional
                                </label>
                                <input
                                    type="email"
                                    value={mockEmail}
                                    onChange={(e) => setMockEmail(e.target.value)}
                                    className="input-vercel h-10"
                                    placeholder="correo@istpet.edu.ec"
                                    required
                                />
                            </div>

                            {/* Predefined Quick Selects */}
                            <div className="space-y-1.5 pt-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-text-dim block">
                                    Selección Rápida
                                </span>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMockEmail('jorge.doicela@istpet.edu.ec');
                                            setMockName('Jorge Doicela');
                                        }}
                                        className="py-1.5 px-2 bg-surface text-text-main border border-border-thin rounded-md text-[9px] font-medium text-left hover:border-border-hover truncate"
                                    >
                                        Jorge Doicela (Docente)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMockEmail('docente.test@istpet.edu.ec');
                                            setMockName('Docente Pruebas');
                                        }}
                                        className="py-1.5 px-2 bg-surface text-text-main border border-border-thin rounded-md text-[9px] font-medium text-left hover:border-border-hover truncate"
                                    >
                                        Docente Pruebas
                                    </button>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isMockSubmitting}
                                    className="btn-vercel-primary w-full h-10 flex items-center justify-center gap-2"
                                >
                                    {isMockSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <span>Iniciar Sesión Simulado</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
