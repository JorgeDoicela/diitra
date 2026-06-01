import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import { Loader2, Lock, Sun, Moon } from 'lucide-react';
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
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Lockout state
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
                const secs: number = err.response?.data?.segundosRestantes ?? 300;
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

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-deep transition-colors duration-500 overflow-hidden relative">
            {/* Theme Toggle Button */}
            {toggleTheme && (
                <button
                    onClick={toggleTheme}
                    className="absolute top-6 right-6 p-2 rounded-lg border border-border-thin bg-surface/50 text-text-dim hover:text-text-main hover:border-border-hover transition-all duration-300 z-30 cursor-pointer"
                    title={currentTheme === 'dark' ? 'Activar Modo Claro' : 'Activar Modo Oscuro'}
                >
                    {currentTheme === 'dark' ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
                </button>
            )}
            {/* Background Grid - Very subtle */}


            <div className="w-full max-w-[350px] space-y-10 relative z-20 animate-fade-up">
                {/* Brand Logo & Header */}
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'}
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tighter text-text-main">Entrar a DIITRA</h1>
                        <p className="text-[11px] text-text-dim font-medium tracking-tight">Investigación e Innovación ISTPET</p>
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
                                placeholder="Cédula de identidad"
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

                        <div className="pt-2">
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
                        </div>
                    </form>

                    <div className="text-center pt-4 space-y-4">
                        <p className="text-[10px] text-text-dim font-medium tracking-tight">
                            ¿No tienes acceso? Contacta a la Dirección de Investigación.
                        </p>

                        {/* Acceso para revisores externos */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/auth/pin')}
                                className="border border-border-thin rounded-lg py-2.5 text-[9px] font-bold text-text-dim hover:text-text-main hover:border-border-hover transition-all flex items-center justify-center gap-1.5"
                                title="Ingresar con código PIN de handoff"
                            >
                                <span className="uppercase tracking-widest">Tengo un PIN</span>
                            </button>

                            <button
                                onClick={() => navigate('/auth/magic-resend')}
                                className="border border-border-thin rounded-lg py-2.5 text-[9px] font-bold text-text-dim hover:text-text-main hover:border-border-hover transition-all flex items-center justify-center gap-1.5"
                                title="Solicitar reenvío de enlace de acceso"
                            >
                                <span className="uppercase tracking-widest">Perdí mi Enlace</span>
                            </button>
                        </div>

                        <div className="flex justify-center items-center gap-8 text-[9px] font-mono text-text-dim uppercase tracking-[0.2em]">
                            <button onClick={() => navigate('/')} className="hover:text-text-main transition-colors">Inicio</button>
                            <span>/</span>
                            <a href="#" className="hover:text-text-main transition-colors">Ayuda</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
