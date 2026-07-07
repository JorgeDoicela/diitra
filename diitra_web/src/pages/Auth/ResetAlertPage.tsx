import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, Loader2, CheckCircle2, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';

const ResetAlertPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useNotifications();

    const token = searchParams.get('token') || '';

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            addToast('Error', 'El token de seguridad es requerido o es inválido.', 'error');
            return;
        }

        if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
            addToast('Validación', 'Por favor complete todos los campos.', 'warning');
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            addToast('Contraseña Débil', 'La nueva contraseña debe tener al menos 8 caracteres.', 'warning');
            return;
        }

        const hasLetter = /[a-zA-Z]/.test(passwordForm.newPassword);
        const hasNumber = /[0-9]/.test(passwordForm.newPassword);
        if (!hasLetter || !hasNumber) {
            addToast('Contraseña Débil', 'La nueva contraseña debe incluir al menos una letra y un número.', 'warning');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            addToast('Validación', 'La nueva contraseña y la confirmación no coinciden.', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            await api.post('/auth/revertir-contrasenia-alerta', {
                token: token,
                new_password: passwordForm.newPassword
            });
            setIsSuccess(true);
            addToast('Contraseña Reestablecida', 'Tu contraseña ha sido restablecida y las sesiones sospechosas han sido revocadas.', 'success');
        } catch (err: any) {
            console.error('Error reverting password:', err);
            const errMsg = err.response?.data?.message || 'El enlace de seguridad ha expirado o ya fue utilizado.';
            addToast('Error', errMsg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-deep p-6 font-sans select-none">
            <div className="w-full max-w-md bg-surface border border-border-thin rounded-2xl shadow-2xl p-8 space-y-6 relative overflow-hidden">
                {/* Decoración premium de fondo */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

                <header className="flex flex-col items-center text-center space-y-2.5">
                    <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-1">
                        <ShieldAlert size={24} />
                    </div>
                    <h1 className="text-xl font-bold text-text-main tracking-tight">
                        {isSuccess ? 'Cuenta Protegida' : 'Alerta de Seguridad'}
                    </h1>
                    <p className="text-xs text-text-dim max-w-xs leading-relaxed">
                        {isSuccess
                            ? 'La contraseña ha sido reestablecida de emergencia. Se han revocado todos los accesos sospechosos.'
                            : 'Has indicado que no autorizaste el cambio de contraseña de tu cuenta. Define una contraseña nueva inmediatamente.'
                        }
                    </p>
                </header>

                {!token ? (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-center space-y-3">
                        <p className="text-xs text-error font-medium leading-relaxed">
                            El enlace de alerta de seguridad es inválido o no contiene un token. Por favor revisa el enlace completo enviado a tu correo.
                        </p>
                        <Link to="/" className="btn-vercel-secondary w-full text-xs py-2 inline-flex items-center justify-center gap-1.5">
                            Ir al Inicio
                        </Link>
                    </div>
                ) : isSuccess ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-2.5 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500">
                            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                            <p className="text-xs font-medium leading-relaxed">
                                Tu contraseña ha sido cambiada de forma segura. El atacante ha perdido el acceso al sistema.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-vercel-primary w-full text-xs py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer font-medium"
                        >
                            <span>Iniciar Sesión</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-surface border border-border-thin rounded-lg pl-3 pr-10 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                    placeholder="Mínimo 8 caracteres (letras y números)"
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                                >
                                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Confirmar Nueva Contraseña</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    className="w-full bg-surface border border-border-thin rounded-lg pl-3 pr-10 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                    placeholder="Repita la nueva contraseña"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="btn-vercel-primary w-full text-xs py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer font-medium mt-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="animate-spin" size={14} />
                                    <span>Protegiendo Cuenta...</span>
                                </>
                            ) : (
                                <span>Restablecer y Bloquear Sesiones</span>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetAlertPage;
