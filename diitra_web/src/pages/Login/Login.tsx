import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import { Lock, User, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();
    const from = (location.state as any)?.from?.pathname || '/dashboard';

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await login(data);
            navigate(from, { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-glow">
            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface border border-border mb-4">
                        <Lock className="w-8 h-8 text-accent" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">DIITRA</h1>
                    <p className="text-text-dim mt-2">Sistema de Gestión de Investigación e Innovación</p>
                </div>

                <div className="bento-card p-8 space-y-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                                Usuario (Cédula)
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 h-4 w-4 text-text-dim" />
                                <input
                                    {...register('username', { required: 'Usuario es requerido' })}
                                    className="flex h-10 w-full rounded-md border border-border bg-transparent px-10 py-2 text-sm ring-offset-bg file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ingrese su cédula"
                                />
                            </div>
                            {errors.username && <p className="text-xs text-red-500">{(errors.username as any).message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-text-dim" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password', { required: 'Contraseña es requerida' })}
                                    className="flex h-10 w-full rounded-md border border-border bg-transparent px-10 py-12 text-sm ring-offset-bg file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-text-dim hover:text-fg transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{(errors.password as any).message}</p>}
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-vercel-primary w-full flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-2 text-text-dim">
                                Acceso Institucional
                            </span>
                        </div>
                    </div>

                    <div className="text-center text-xs text-text-dim">
                        <p>Plataforma exclusiva para personal de investigación.</p>
                        <p className="mt-1">© 2024 Departamento de Investigación e Innovación</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
