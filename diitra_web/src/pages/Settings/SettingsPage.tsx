import React, { useState, useEffect } from 'react';
import { User, Loader2, Shield, CheckCircle2, KeyRound, Info, Eye, EyeOff, CheckCircle, XCircle, Settings2, HardDrive } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/Common/PageHeader';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';
import { useAuth } from '../../api/AuthContext';
import { useConfirm } from '../../api/ConfirmContext';
import { SignatureProfileCard } from './components/SignatureProfileCard';
import ConfiguracionPage from '../Admin/ConfiguracionPage';
import DocumentMaintenancePage from '../Admin/DocumentMaintenancePage';

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
    const { logout, isRevisor, isAdmin } = useAuth();
    const confirm = useConfirm();

    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab');
    const mainTabParam = searchParams.get('mainTab');

    // Activar pestaña de administración si el parámetro de URL apunta a catálogos
    const isParamTab = tabParam === 'lineas' || tabParam === 'periodos' || tabParam === 'productos' || tabParam === 'dominios' || tabParam === 'indicadores' || tabParam === 'calendario';
    const activeMainTab = (isAdmin && isParamTab) 
        ? 'parametros' 
        : (isAdmin && (tabParam === 'plantillas' || mainTabParam === 'plantillas')) 
            ? 'plantillas' 
            : (isAdmin && (tabParam === 'almacenamiento' || mainTabParam === 'almacenamiento'))
                ? 'almacenamiento'
                : 'perfil';

    const setActiveMainTab = (tab: 'perfil' | 'parametros' | 'plantillas' | 'almacenamiento') => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('mainTab', tab);
            if (tab === 'parametros') {
                const currentTab = next.get('tab');
                if (!currentTab || currentTab === 'parametros' || currentTab === 'plantillas' || currentTab === 'almacenamiento') {
                    next.set('tab', 'lineas');
                }
            } else if (tab === 'plantillas') {
                next.set('tab', 'plantillas');
            } else if (tab === 'almacenamiento') {
                next.set('tab', 'almacenamiento');
            } else {
                next.delete('tab');
                next.delete('mainTab');
            }
            return next;
        });
    };

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

    // Estados para la configuración de firmas por plantilla (solo admins)
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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

    const fetchTemplates = async () => {
        setIsLoadingTemplates(true);
        try {
            const res = await api.get('/admin/templates');
            setTemplates(res.data || []);
        } catch (err) {
            console.error('[DIITRA] Error al cargar plantillas de firma:', err);
            addToast('Error', 'No se pudieron cargar las plantillas de firma institucional.', 'error');
        } finally {
            setIsLoadingTemplates(false);
        }
    };

    const handleUpdateSignatureConfig = async (code: string, requiresSignature: boolean, signatureType: string) => {
        try {
            await api.put(`/admin/templates/${code}/signature-config`, {
                requires_signature: requiresSignature,
                signature_type: signatureType
            });
            setTemplates(prev => prev.map(t => t.code === code ? { ...t, requiresElectronicSignature: requiresSignature, signatureType } : t));
            addToast('Configuración Actualizada', 'La configuración de firma se actualizó correctamente.', 'success');
        } catch (err) {
            console.error('[DIITRA] Error al actualizar configuración de firmas:', err);
            addToast('Error', 'No se pudo actualizar la configuración de firmas.', 'error');
        }
    };

    useEffect(() => {
        if (isAdmin && activeMainTab === 'plantillas') {
            fetchTemplates();
        }
    }, [isAdmin, activeMainTab]);

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
            <PageHeader
                kicker={
                    activeMainTab === 'parametros' ? 'Parámetros del Sistema'
                    : activeMainTab === 'plantillas' ? 'Seguridad Documental'
                    : activeMainTab === 'almacenamiento' ? 'Mantenimiento y Almacenamiento'
                    : 'Configuración de Cuenta'
                }
                icon={
                    activeMainTab === 'parametros' ? Settings2
                    : activeMainTab === 'plantillas' ? Shield
                    : activeMainTab === 'almacenamiento' ? HardDrive
                    : User
                }
                title={
                    activeMainTab === 'parametros' ? 'Administración Global'
                    : activeMainTab === 'plantillas' ? 'Firmas por Plantilla'
                    : activeMainTab === 'almacenamiento' ? 'Ciclo de Vida Documental'
                    : 'Mi Cuenta'
                }
                description={
                    activeMainTab === 'parametros' ? 'Administre las líneas de investigación, períodos académicos, dominios institucionales e hitos normativos CACES.'
                    : activeMainTab === 'plantillas' ? 'Configure las firmas requeridas y el tipo de firma electrónica para cada plantilla de documento oficial de la institución.'
                    : activeMainTab === 'almacenamiento' ? 'Depure y audite el almacenamiento físico de versiones preliminares de documentos obsoletos bajo políticas del CACES.'
                    : 'Administre su perfil científico, identificadores de investigación y otorgue su consentimiento de firma conforme a la LOPDP.'
                }
            />

            {isAdmin && (
                <div className="tabs-vercel !mb-2">
                    <button
                        onClick={() => setActiveMainTab('perfil')}
                        className={`tab-vercel-item flex items-center gap-2 ${
                            activeMainTab === 'perfil' ? 'active' : ''
                        }`}
                    >
                        <User size={14} />
                        <span>Mi Perfil de Firma</span>
                    </button>
                    <button
                        onClick={() => setActiveMainTab('parametros')}
                        className={`tab-vercel-item flex items-center gap-2 ${
                            activeMainTab === 'parametros' ? 'active' : ''
                        }`}
                    >
                        <Settings2 size={14} />
                        <span>Parámetros del Sistema</span>
                    </button>
                    <button
                        onClick={() => setActiveMainTab('plantillas')}
                        className={`tab-vercel-item flex items-center gap-2 ${
                            activeMainTab === 'plantillas' ? 'active' : ''
                        }`}
                    >
                        <Shield size={14} />
                        <span>Firmas por Plantilla</span>
                    </button>
                    <button
                        onClick={() => setActiveMainTab('almacenamiento')}
                        className={`tab-vercel-item flex items-center gap-2 ${
                            activeMainTab === 'almacenamiento' ? 'active' : ''
                        }`}
                    >
                        <HardDrive size={14} />
                        <span>Almacenamiento</span>
                    </button>
                </div>
            )}

            {activeMainTab === 'perfil' ? (
                <div className="max-w-6xl space-y-6">
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

                <SignatureProfileCard />



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
            ) : activeMainTab === 'parametros' ? (
                <div className="animate-fade-up">
                    <ConfiguracionPage embedded={true} />
                </div>
            ) : activeMainTab === 'plantillas' ? (
                <div className="max-w-6xl space-y-6 animate-fade-up">
                    <div className="bento-card static p-6 space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                                    <Shield size={16} className="text-brand" />
                                    Firmas por Plantilla de Documento
                                </h2>
                                <p className="text-xs text-text-dim mt-1">
                                    Defina qué plantillas de documentos institucionales requieren firma electrónica y qué tipo de firma se aplicará.
                                </p>
                            </div>
                        </div>

                        {isLoadingTemplates ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin text-brand" size={24} />
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar border border-border-thin rounded-xl">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="bg-surface/50 border-b border-border-thin text-[10px] font-mono text-text-dim uppercase">
                                            <th className="p-4 font-semibold tracking-widest">Documento</th>
                                            <th className="p-4 font-semibold tracking-widest">Código</th>
                                            <th className="p-4 font-semibold tracking-widest">Requiere Firma</th>
                                            <th className="p-4 font-semibold tracking-widest">Tipo de Firma Requerido</th>
                                            <th className="p-4 font-semibold tracking-widest">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-thin">
                                        {templates.map((t) => (
                                            <tr key={t.code} className="hover:bg-surface/30 transition-colors group">
                                                <td className="p-4 text-xs font-semibold text-text-main">
                                                    {t.name}
                                                </td>
                                                <td className="p-4 text-xs font-mono font-medium text-text-dim">
                                                    {t.code}
                                                </td>
                                                <td className="p-4">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={t.requiresElectronicSignature || false}
                                                            onChange={(e) => handleUpdateSignatureConfig(t.code, e.target.checked, t.signatureType || 'DIITRA')}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-9 h-5 bg-border-thin peer-focus:outline-none rounded-full peer peer-checked:bg-brand after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                                    </label>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={t.signatureType || 'DIITRA'}
                                                        onChange={(e) => handleUpdateSignatureConfig(t.code, t.requiresElectronicSignature || false, e.target.value)}
                                                        className="bg-surface border border-border-thin rounded-lg px-2.5 py-1.5 text-xs focus:border-brand outline-none transition-all text-text-main"
                                                        disabled={!t.requiresElectronicSignature}
                                                    >
                                                        <option value="DIITRA">Firma Institucional DIITRA (Sello)</option>
                                                        <option value="ECUADOR_P12">Firma Digital Ecuador (.p12)</option>
                                                        <option value="HIBRIDO">Firma Híbrida (Ambas)</option>
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    {t.isActive ? (
                                                        <span className="badge-vercel badge-vercel-success">
                                                            <CheckCircle size={10} strokeWidth={3} /> Activo
                                                        </span>
                                                    ) : (
                                                        <span className="badge-vercel badge-vercel-error">
                                                            <XCircle size={10} strokeWidth={3} /> Inactivo
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {templates.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-12 text-center text-text-dim text-xs font-mono uppercase">
                                                    No se encontraron plantillas de documentos registradas
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <DocumentMaintenancePage isEmbedded={true} />
            )}
        </div>
    );
};

export default SettingsPage;
