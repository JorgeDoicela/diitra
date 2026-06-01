import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios_config';
import { Loader2, Mail, ArrowRight, AlertTriangle, CheckCircle2, Sun, Moon } from 'lucide-react';

const MagicResend = ({ currentTheme = 'dark', toggleTheme }: { currentTheme?: 'dark' | 'light'; toggleTheme?: () => void }) => {
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setError('Por favor, introduce tu dirección de correo electrónico.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await api.post('/auth/magic-resend', { email: trimmedEmail });
            setSuccess(response.data.message || 'Si existe un arbitraje activo para este correo, recibirás un nuevo enlace en unos momentos.');
            setEmail('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al procesar la solicitud. Intente de nuevo.');
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
            <div className="w-full max-w-[380px] space-y-8 relative z-20 animate-fade-up">
                {/* Logo & Header */}
                <div className="flex flex-col items-center space-y-6">
                    <img 
                        src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'} 
                        alt="DIITRA Logo" 
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tighter text-text-main">
                            Recuperar Acceso
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                            Reenvío de Enlace Mágico · DIITRA
                        </p>
                    </div>
                </div>

                {/* Contexto de uso */}
                <div className="p-3 rounded-xl border border-border-thin bg-surface/50 text-[10px] text-text-dim leading-relaxed space-y-1">
                    <p className="font-bold uppercase tracking-wider text-text-main">¿Cómo funciona?</p>
                    <p>
                        Si no recibiste tu enlace de acceso para evaluador externo, o si tu enlace original 
                        se perdió, ingresa tu correo registrado a continuación. Si tienes un arbitraje 
                        activo, el sistema te enviará un nuevo enlace de forma instantánea.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bento-card static p-8 border border-border-thin bg-surface/30 backdrop-blur-md rounded-2xl shadow-xl space-y-6">
                    <div className="space-y-4 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-text-main">
                            <Mail size={24} />
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            Introduce tu correo electrónico registrado para recibir tu enlace único de acceso.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="evaluador@universidad.edu.ec"
                                className="input-vercel h-11 text-xs"
                                autoComplete="email"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-error/5 border border-error/20 text-error text-[10px] font-mono leading-relaxed flex gap-2 items-start animate-fade-in">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="p-3 rounded-md bg-success/5 border border-success/20 text-success text-[10px] font-mono leading-relaxed flex gap-2 items-start animate-fade-in">
                                <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                                <span>{success}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !email.trim()}
                            className="btn-vercel-primary w-full h-11 flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Solicitar Enlace</span>
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <button onClick={() => navigate('/login')} className="text-[10px] text-text-dim hover:text-text-main transition-colors font-medium">
                            Volver al Login con contraseña
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MagicResend;
