import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
    username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
    password: z.string().min(4, 'La contraseña debe tener al menos 4 caracteres')
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginProps {
    currentTheme?: 'dark' | 'light';
}

const Login = ({ currentTheme = 'dark' }: LoginProps) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });
    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const onSubmit = async (data: LoginFormValues) => {
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
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-bg-deep transition-colors duration-500 overflow-hidden relative">
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

                        {error && (
                            <div className="p-3 rounded-md bg-error/5 border border-error/20 text-error text-[10px] font-mono leading-relaxed animate-in fade-in slide-in-from-top-1">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-vercel-primary w-full h-11"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Continuar'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center pt-4">
                        <p className="text-[10px] text-text-dim font-medium tracking-tight mb-8">
                            ¿No tienes acceso? Contacta a la Dirección de Investigación.
                        </p>
                        
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
