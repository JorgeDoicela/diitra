import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../api/AuthContext';
import {
    Loader2, ShieldCheck, Key, AlertTriangle,
    ArrowRight, Laptop, Smartphone, Copy, Check,
    Sun, Moon
} from 'lucide-react';

const MagicLogin = ({ currentTheme = 'dark', toggleTheme }: { currentTheme?: 'dark' | 'light'; toggleTheme?: () => void }) => {
    const { magicLogin, confirmMagicLogin } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [pin, setPin] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    // Estados temporales para Alta Seguridad (sesión no iniciada aún)
    const [userData, setUserData] = useState<any>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    const pinPageUrl = `${window.location.origin}/auth/pin`;

    const handleAccess = async () => {
        if (!token) return;
        setStatus('loading');
        setError(null);
        try {
            const result = await magicLogin(token);
            setPin(result.pin);
            setUserData(result.user);
            setAuthToken(result.token);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setError(err.response?.data?.message || 'El enlace mágico es inválido, ha caducado o ya fue utilizado.');
        }
    };

    const handleConfirmDevice = async () => {
        if (!userData || !authToken) return;
        setConfirming(true);
        try {
            await confirmMagicLogin(userData, authToken);
            navigate('/revisiones');
        } catch (err: any) {
            console.error('Error al confirmar la sesión en este dispositivo', err);
            setError('No se pudo establecer la sesión segura en este dispositivo.');
            setStatus('error');
        } finally {
            setConfirming(false);
        }
    };

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(pinPageUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
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
            <div className="w-full max-w-[460px] space-y-8 relative z-20 animate-fade-up">
                {/* Logo & Header */}
                <div className="flex flex-col items-center space-y-6">
                    <img
                        src={currentTheme === 'dark' ? '/logo_blanco.png' : '/logo_negro.png'}
                        alt="DIITRA Logo"
                        className="h-16 w-auto object-contain"
                    />
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-bold tracking-tighter text-text-main">
                            Acceso Seguro para Revisores
                        </h1>
                        <p className="text-[11px] text-text-dim font-medium uppercase tracking-wider">
                            Módulo de Arbitraje Científico · DIITRA
                        </p>
                    </div>
                </div>

                {/* Card Container */}
                <div className="bento-card static p-8 border border-border-thin bg-surface/30 backdrop-blur-md rounded-2xl shadow-xl space-y-6">

                    {/* ── Estado: sin token ── */}
                    {!token ? (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto flex items-center justify-center text-error">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-text-main uppercase">Falta el Token de Acceso</h3>
                            <p className="text-xs text-text-dim">
                                Este enlace no contiene un token válido. Verifica el correo recibido o contacta al administrador de DIITRA.
                            </p>
                            <Link to="/login" className="btn-vercel-secondary w-full h-11 flex items-center justify-center no-underline">
                                Volver al Login
                            </Link>
                        </div>

                    /* ── Estado: esperando confirmación ── */
                    ) : status === 'idle' ? (
                        <div className="space-y-6 text-center">
                            <div className="mx-auto flex items-center justify-center text-text-main">
                                <Key size={24} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold text-text-main uppercase">Verificación de Enlace</h3>
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Para evitar que los filtros automáticos de seguridad de tu correo consuman tu enlace de acceso único, presiona el botón a continuación para ingresar al sistema.
                                </p>
                            </div>
                            <button
                                onClick={handleAccess}
                                className="btn-vercel-primary w-full h-11 flex items-center justify-center gap-2 group"
                            >
                                <span>Ingresar a DIITRA</span>
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </button>
                        </div>

                    /* ── Estado: cargando ── */
                    ) : status === 'loading' ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                            <Loader2 className="animate-spin text-text-main" size={40} />
                            <p className="text-xs text-text-dim font-bold uppercase tracking-wider">
                                Verificando token de acceso...
                            </p>
                        </div>

                    /* ── Estado: éxito — el usuario elige qué hacer ── */
                    ) : status === 'success' ? (
                        <div className="space-y-5">
                            {/* Header de éxito */}
                            <div className="text-center space-y-3">
                                <div className="mx-auto flex items-center justify-center text-success">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-text-main uppercase">Acceso Autorizado</h3>
                                    <p className="text-xs text-text-dim mt-1">
                                        Tu identidad ha sido verificada. ¿Cómo quieres continuar?
                                    </p>
                                </div>
                            </div>

                            <div className="divider-vercel" />

                            {/* Opción A: Continuar en este dispositivo */}
                            <div className="p-4 rounded-xl border border-border-thin bg-bg-deep/50 space-y-3">
                                <div className="flex items-center gap-2 text-text-main">
                                    <Smartphone size={15} className="text-brand" />
                                    <span className="text-[11px] font-bold uppercase tracking-wider">
                                        Opción A — Revisar en este dispositivo
                                    </span>
                                </div>
                                <p className="text-[10px] text-text-dim leading-relaxed">
                                    Haz clic para ingresar directamente al portal de revisiones en este navegador.
                                </p>
                                <button
                                    onClick={handleConfirmDevice}
                                    disabled={confirming}
                                    className="btn-vercel-primary w-full h-10 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                                >
                                    {confirming ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <>
                                            <span>Ir a mis Revisiones</span>
                                            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Opción B: Transferir sesión a PC */}
                            {pin && (
                                <div className="p-4 rounded-xl border border-border-thin bg-bg-deep/50 space-y-3">
                                    <div className="flex items-center gap-2 text-text-main">
                                        <Laptop size={15} className="text-text-dim" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">
                                            Opción B — Transferir a PC u otro dispositivo
                                        </span>
                                    </div>

                                    <p className="text-[10px] text-text-dim leading-relaxed">
                                        Si prefieres trabajar desde tu computadora, abre la siguiente dirección en ese navegador e introduce el código PIN:
                                    </p>

                                    {/* URL del PIN */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 font-mono text-[10px] text-text-main bg-surface border border-border-thin rounded-md px-3 py-2 truncate">
                                            {pinPageUrl}
                                        </div>
                                        <button
                                            onClick={handleCopyUrl}
                                            title="Copiar URL"
                                            className="shrink-0 p-2 border border-border-thin rounded-md text-text-dim hover:text-text-main hover:border-border-hover transition-all"
                                        >
                                            {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                                        </button>
                                    </div>

                                    {/* Código PIN grande */}
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-text-dim font-bold uppercase tracking-widest text-center">
                                            Tu Código PIN
                                        </p>
                                        <div className="text-3xl font-mono font-black tracking-[0.35em] text-center text-text-main py-3 bg-surface rounded-lg border border-border-thin">
                                            {pin}
                                        </div>
                                        <p className="text-[9px] text-text-dim font-medium text-center">
                                            Válido durante 30 minutos. Úsalo una sola vez.
                                        </p>
                                        <div className="mt-2">
                                            <p className="text-[9px] text-brand text-center leading-relaxed">
                                                <strong>Aviso de seguridad:</strong> Cada vez que abres este enlace desde tu correo, se genera un nuevo PIN y el anterior se invalida automáticamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    /* ── Estado: error ── */
                    ) : (
                        <div className="space-y-4 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-error">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-sm font-bold text-text-main uppercase">Enlace Inválido o Expirado</h3>
                            <p className="text-xs text-text-dim leading-relaxed">
                                {error}
                            </p>
                            <Link to="/login" className="btn-vercel-secondary w-full h-11 flex items-center justify-center no-underline">
                                Volver al Login Principal
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MagicLogin;
