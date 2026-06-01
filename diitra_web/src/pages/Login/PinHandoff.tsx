import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import { Loader2, Laptop, ArrowRight, AlertTriangle, Sun, Moon } from 'lucide-react';

const PinHandoff = ({ currentTheme = 'dark', toggleTheme }: { currentTheme?: 'dark' | 'light'; toggleTheme?: () => void }) => {
    const { handoffLogin } = useAuth();
    const navigate = useNavigate();
    
    const [pin, setPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length !== 5) {
            setError('El código PIN debe tener 5 caracteres.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await handoffLogin(pin);
            navigate('/revisiones', { replace: true });
        } catch (err: any) {
            setError(err.response?.data?.message || 'El código PIN es inválido, ya fue utilizado o ha expirado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 5);
        setPin(raw);
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
                            Ingresar con PIN
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium tracking-tight uppercase tracking-wider">
                            Transferencia de sesión · DIITRA
                        </p>
                    </div>
                </div>

                {/* Contexto de uso */}
                <div className="p-3 rounded-xl border border-border-thin bg-surface/50 text-[10px] text-text-dim leading-relaxed space-y-1">
                    <p className="font-bold uppercase tracking-wider text-text-main">¿Cómo funciona?</p>
                    <p>
                        Abriste el enlace mágico de tu correo en tu <strong>teléfono</strong>. 
                        Allí encontrarás un código PIN de 5 caracteres. Ingrésalo aquí para iniciar sesión 
                        en esta computadora sin necesidad de contraseña.
                    </p>
                </div>

                {/* Form Card */}
                <div className="bento-card static p-8 border border-border-thin bg-surface/30 backdrop-blur-md rounded-2xl shadow-xl space-y-6">
                    <div className="space-y-4 text-center">
                        <div className="mx-auto flex items-center justify-center text-text-main">
                            <Laptop size={24} />
                        </div>
                        <p className="text-xs text-text-dim leading-relaxed">
                            Introduce el código PIN de 5 caracteres que se muestra en tu teléfono móvil para iniciar sesión en esta computadora de forma segura.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-text-dim ml-1" htmlFor="pin">
                                Código PIN de Handoff
                            </label>
                            <input
                                id="pin"
                                type="text"
                                value={pin}
                                onChange={handlePinChange}
                                placeholder="XXXXX"
                                className="input-vercel h-14 text-center text-xl font-mono font-bold tracking-[0.3em] uppercase"
                                maxLength={5}
                                autoComplete="off"
                                disabled={isSubmitting}
                                spellCheck={false}
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-md bg-error/5 border border-error/20 text-error text-[10px] font-mono leading-relaxed flex gap-2 items-start">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || pin.length !== 5}
                            className="btn-vercel-primary w-full h-11 flex items-center justify-center gap-2 group"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <span>Vincular Dispositivo</span>
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center pt-2">
                        <Link to="/login" className="text-[10px] text-text-dim hover:text-text-main transition-colors font-medium no-underline">
                            Volver al Login con contraseña
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PinHandoff;
