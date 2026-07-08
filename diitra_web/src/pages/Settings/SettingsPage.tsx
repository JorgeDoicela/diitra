import React, { useState, useEffect } from 'react';
import { User, Loader2, Shield, CheckCircle2, KeyRound, Info, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';
import { useAuth } from '../../api/AuthContext';
import { useConfirm } from '../../api/ConfirmContext';
import { SignatureProfileCard } from './components/SignatureProfileCard';

interface PerfilData {
    orcid_id?: string;
    scopus_id?: string;
    google_scholar_url?: string;
    research_gate_url?: string;
    especialidad?: string;
    grado_academico_maximo?: string;
    acepto_terminos_firma: boolean;
    fecha_consentimiento_firma?: string;
}

const SettingsPage: React.FC = () => {
    const { addToast } = useNotifications();
    const { logout, isRevisor } = useAuth();
    const confirm = useConfirm();

    const [profile, setProfile] = useState<PerfilData>({
        orcid_id: '',
        scopus_id: '',
        google_scholar_url: '',
        research_gate_url: '',
        especialidad: '',
        grado_academico_maximo: '',
        acepto_terminos_firma: false
    });

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingConsent, setIsSavingConsent] = useState(false);

    // Formulario de cambio de contraseña para revisores externos
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
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

        setIsChangingPassword(true);
        try {
            await api.post('/auth/cambiar-contrasenia', {
                current_password: passwordForm.currentPassword,
                new_password: passwordForm.newPassword
            });
            addToast('Contraseña Actualizada', 'Su contraseña ha sido cambiada exitosamente.', 'success');
            setPasswordForm({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err: any) {
            console.error('Error changing password:', err);
            const errMsg = err.response?.data?.message || 'No se pudo cambiar la contraseña en este momento.';
            addToast('Error', errMsg, 'error');
        } finally {
            setIsChangingPassword(false);
        }
    };

    // Firma electrónica state — solo consentimiento, no se guarda certificado

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoadingProfile(true);
        try {
            const res = await api.get('/lopdp/perfil');
            setProfile(res.data);
        } catch (err) {
            console.error('Error fetching profile:', err);
            addToast('Error', 'No se pudo cargar el perfil científico.', 'error');
        } finally {
            setIsLoadingProfile(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            await api.put('/lopdp/perfil', {
                orcid_id: profile.orcid_id,
                scopus_id: profile.scopus_id,
                google_scholar_url: profile.google_scholar_url,
                research_gate_url: profile.research_gate_url,
                especialidad: profile.especialidad,
                grado_academico_maximo: profile.grado_academico_maximo
            });
            addToast('Perfil Guardado', 'Los datos científicos se actualizaron correctamente.', 'success');
        } catch (err) {
            console.error('Error updating profile:', err);
            addToast('Error', 'No se pudo guardar la información del perfil.', 'error');
        } finally {
            setIsSavingProfile(false);
        }
    };


    const handleConsentToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        if (checked) {
            setIsSavingConsent(true);
            try {
                await api.post('/lopdp/consentimiento', {
                    version_politica: 'FIRMA_ELECTRONICA'
                });
                setProfile(prev => ({
                    ...prev,
                    acepto_terminos_firma: true,
                    fecha_consentimiento_firma: new Date().toISOString()
                }));
                addToast('Consentimiento Registrado', 'Su autorización para el uso de firma electrónica ha sido guardada conforme a la LOPDP.', 'success');
            } catch (err) {
                console.error('Error al registrar consentimiento:', err);
                addToast('Error', 'No se pudo registrar el consentimiento en este momento.', 'error');
            } finally {
                setIsSavingConsent(false);
            }
        } else {
            const confirmar = await confirm({
                title: 'Revocar Consentimiento',
                message: '¿Está seguro de que desea revocar su consentimiento de firma electrónica y protección de datos (LOPDP)? Esta acción cerrará su sesión actual y restringirá el acceso al sistema hasta que vuelva a aceptarlo.',
                confirmText: 'Revocar',
                cancelText: 'Cancelar',
                variant: 'destructive'
            });
            if (!confirmar) {
                e.target.checked = true;
                return;
            }

            setIsSavingConsent(true);
            try {
                await api.post('/lopdp/revocar');
                addToast('Consentimiento Revocado', 'Su consentimiento ha sido revocado. Cerrando sesión...', 'info');
                setTimeout(async () => {
                    await logout();
                }, 1500);
            } catch (err) {
                console.error('Error al revocar consentimiento:', err);
                addToast('Error', 'No se pudo revocar el consentimiento en este momento.', 'error');
                e.target.checked = true;
            } finally {
                setIsSavingConsent(false);
            }
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <User size={12} className="text-brand" />
                    <span>Configuración de Cuenta</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Mi Cuenta</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Administre su perfil científico, identificadores de investigación y otorgue su consentimiento de firma conforme a la LOPDP.
                </p>
            </header>

            <div className="max-w-4xl space-y-6">
                <SignatureProfileCard />

                <form onSubmit={handleSaveProfile} className="bento-card static p-6 space-y-6">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                        <User size={16} />
                        Perfil Científico
                    </h2>

                    {isLoadingProfile ? (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="animate-spin text-brand" size={24} />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Especialidad Científica</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                        placeholder="Ej. Inteligencia Artificial, Biotecnología"
                                        value={profile.especialidad || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, especialidad: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Máximo Grado Académico</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                        placeholder="Ej. PhD en Ciencias de la Computación"
                                        value={profile.grado_academico_maximo || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, grado_academico_maximo: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">ORCID ID</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand font-mono"
                                        placeholder="0000-0000-0000-0000"
                                        value={profile.orcid_id || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, orcid_id: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Scopus Author ID</label>
                                    <input
                                        type="text"
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand font-mono"
                                        placeholder="Ej. 57218320492"
                                        value={profile.scopus_id || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, scopus_id: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Google Scholar URL</label>
                                    <input
                                        type="url"
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                        placeholder="https://scholar.google.com/citations?user=..."
                                        value={profile.google_scholar_url || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, google_scholar_url: e.target.value }))}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">ResearchGate URL</label>
                                    <input
                                        type="url"
                                        className="w-full bg-surface border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                        placeholder="https://www.researchgate.net/profile/..."
                                        value={profile.research_gate_url || ''}
                                        onChange={e => setProfile(prev => ({ ...prev, research_gate_url: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="btn-vercel-primary text-xs"
                                >
                                    {isSavingProfile && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                    Guardar Cambios
                                </button>
                            </div>
                        </>
                    )}
                </form>

                {!isLoadingProfile && (
                    <div className="bento-card static p-6 space-y-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <Shield size={16} className="text-brand" />
                            Firma Electrónica y Protección de Datos (LOPDP)
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-surface border border-border-thin rounded-xl">
                                <input
                                    type="checkbox"
                                    id="termsConsent"
                                    className="mt-1 cursor-pointer accent-brand"
                                    checked={profile.acepto_terminos_firma}
                                    disabled={isSavingConsent}
                                    onChange={handleConsentToggle}
                                />
                                <label htmlFor="termsConsent" className="text-xs text-text-dim leading-relaxed cursor-pointer select-none">
                                    Acepto los términos de la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> y autorizo el uso de mi firma digital en el sistema. Entiendo que: 1) si uso firma electrónica avanzada con certificado <code className="bg-surface-dim px-1 py-0.5 rounded font-mono text-[10px] text-brand font-semibold">.p12</code>, el archivo y su clave se procesarán temporalmente en memoria RAM y <strong>nunca serán almacenados en el servidor</strong>; 2) si utilizo la firma institucional DIITRA, autorizo la <strong>persistencia segura del trazo de mi firma y cargo</strong> en el servidor para estampar los documentos oficiales de los cuales soy responsable.
                                </label>
                            </div>

                            {profile.acepto_terminos_firma && (
                                <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1.5 px-1 animate-fade-in">
                                    <CheckCircle2 size={12} />
                                    Consentimiento firmado electrónicamente y activo {profile.fecha_consentimiento_firma && `el ${new Date(profile.fecha_consentimiento_firma).toLocaleDateString()}`}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {!isLoadingProfile && (
                    <div className="bento-card static p-6 space-y-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <KeyRound size={16} className="text-brand" />
                            Seguridad y Contraseña
                        </h2>

                        {isRevisor ? (
                            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                                <p className="text-xs text-text-dim leading-relaxed">
                                    Por motivos de seguridad, es recomendable cambiar su contraseña temporal por una contraseña robusta y personal.
                                </p>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Contraseña Actual</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            className="w-full bg-surface border border-border-thin rounded-lg pl-3 pr-10 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                            placeholder="Ingrese su contraseña actual"
                                            value={passwordForm.currentPassword}
                                            onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                                        >
                                            {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Nueva Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
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
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={isChangingPassword}
                                        className="btn-vercel-primary text-xs"
                                    >
                                        {isChangingPassword && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                        Actualizar Contraseña
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex items-start gap-3 p-4 bg-surface border border-border-thin rounded-xl max-w-2xl">
                                <Info size={16} className="text-brand mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <h4 className="text-xs font-semibold text-text-main">Cuenta Gestionada Institucionalmente</h4>
                                    <p className="text-[11px] text-text-dim leading-relaxed">
                                        Tu cuenta está vinculada al sistema de identidad institucional (SIGAFI / Microsoft SSO). Por motivos de seguridad y consistencia, el cambio de credenciales debe realizarse directamente a través del portal de autogestión de la institución, no de forma local en esta aplicación.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
