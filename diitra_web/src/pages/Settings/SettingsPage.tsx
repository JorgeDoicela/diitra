import React, { useState, useEffect } from 'react';
import { User, Key, UploadCloud, CheckCircle2, AlertCircle, Lock, FileSignature, Loader2 } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';
import { useConfirm } from '../../api/ConfirmContext';

interface PerfilData {
    orcid_id?: string;
    scopus_id?: string;
    google_scholar_url?: string;
    research_gate_url?: string;
    especialidad?: string;
    grado_academico_maximo?: string;
    acepto_terminos_firma: boolean;
    fecha_consentimiento_firma?: string;
    has_p12_certificate: boolean;
}

const SettingsPage: React.FC = () => {
    const { addToast } = useNotifications();
    const confirm = useConfirm();

    const [profile, setProfile] = useState<PerfilData>({
        orcid_id: '',
        scopus_id: '',
        google_scholar_url: '',
        research_gate_url: '',
        especialidad: '',
        grado_academico_maximo: '',
        acepto_terminos_firma: false,
        has_p12_certificate: false
    });

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingConsent, setIsSavingConsent] = useState(false);

    // Firma electrónica state
    const [p12File, setP12File] = useState<File | null>(null);
    const [p12Password, setP12Password] = useState('');
    const [isUploadingFirma, setIsUploadingFirma] = useState(false);

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
        if (!checked) {
            if (!await confirm({
                title: 'Revocar Consentimiento',
                message: '¿Está seguro de revocar el consentimiento de firma? No podrá realizar firmas electrónicas en DIITRA hasta otorgarlo nuevamente.',
                confirmText: 'Revocar',
                cancelText: 'Cancelar',
                variant: 'destructive'
            })) {
                return;
            }
        }

        setIsSavingConsent(true);
        try {
            await api.post('/lopdp/consentimiento', {
                version_politica: 'FIRMA_ELECTRONICA'
            });
            setProfile(prev => ({
                ...prev,
                acepto_terminos_firma: checked,
                fecha_consentimiento_firma: checked ? new Date().toISOString() : undefined
            }));
            addToast(
                checked ? 'Consentimiento Otorgado' : 'Consentimiento Revocado',
                checked ? 'Ha aceptado los términos para el uso de firma electrónica.' : 'Ha revocado su consentimiento.',
                checked ? 'success' : 'warning'
            );
        } catch (err) {
            console.error('Error logging consent:', err);
            addToast('Error', 'No se pudo actualizar el estado de consentimiento.', 'error');
        } finally {
            setIsSavingConsent(false);
        }
    };

    const handleFirmaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!p12File) {
            addToast('Validación', 'Seleccione un archivo de firma.', 'warning');
            return;
        }

        setIsUploadingFirma(true);
        const formData = new FormData();
        formData.append('file', p12File);
        formData.append('password', p12Password || '');

        try {
            const res = await api.post('/lopdp/perfil/firma', formData, {
                headers: { 'Content-Type': undefined },
                transformRequest: [(data, headers) => {
                    if (data instanceof FormData) {
                        delete headers['Content-Type'];
                    }
                    return data;
                }],
            });
            addToast('Certificado Guardado', res.data.message || 'Firma configurada exitosamente.', 'success');
            setP12File(null);
            setP12Password('');
            setProfile(prev => ({ ...prev, has_p12_certificate: true }));
        } catch (err: any) {
            console.error('Error uploading signature:', err);
            const errMsg = err.response?.data?.error || 'No se pudo validar o guardar la firma.';
            addToast('Error de Firma', errMsg, 'error');
        } finally {
            setIsUploadingFirma(false);
        }
    };

    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <User size={12} className="text-brand" />
                    <span>Configuración de Cuenta</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Mi Cuenta y Firma</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Administre su perfil científico y su certificado de firma electrónica para la validación y suscripción de documentos académicos en el sistema DIITRA.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Metadata form */}
                <div className="lg:col-span-2 space-y-6">
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
                </div>

                {/* Right: Signature settings & Consent */}
                <div className="space-y-6">
                    <div className="bento-card static p-6 space-y-6">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-main flex items-center gap-2">
                            <Key size={16} />
                            Firma Electrónica
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-surface border border-border-thin rounded-xl">
                                <input
                                    type="checkbox"
                                    id="termsConsent"
                                    className="mt-1"
                                    checked={profile.acepto_terminos_firma}
                                    disabled={isSavingConsent}
                                    onChange={handleConsentToggle}
                                />
                                <label htmlFor="termsConsent" className="text-xs text-text-dim leading-relaxed cursor-pointer select-none">
                                    Acepto los términos de la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> y autorizo a DIITRA a custodiar mi firma cifrada para uso exclusivo de documentos académicos.
                                </label>
                            </div>

                            {profile.acepto_terminos_firma && profile.fecha_consentimiento_firma && (
                                <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Consentimiento otorgado el {new Date(profile.fecha_consentimiento_firma).toLocaleDateString()}
                                </div>
                            )}

                            <hr className="border-border-thin" />

                            {profile.has_p12_certificate ? (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                                    <FileSignature className="text-emerald-500" size={24} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-semibold text-text-main">Certificado Guardado</h3>
                                        <p className="text-[10px] text-text-dim mt-0.5">La contraseña se encuentra cifrada bajo AES-256 en BD.</p>
                                    </div>
                                    <CheckCircle2 className="text-emerald-500" size={16} />
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="text-amber-500" size={24} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-semibold text-text-main">Sin Firma Registrada</h3>
                                        <p className="text-[10px] text-text-dim mt-0.5">Deberá cargar su certificado .p12 cada vez que desee firmar.</p>
                                    </div>
                                </div>
                            )}

                            {profile.acepto_terminos_firma && (
                                <form onSubmit={handleFirmaSubmit} className="space-y-4 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Subir Certificado</label>
                                        <div className="flex items-center justify-center border border-dashed border-border-thin rounded-lg p-4 bg-surface hover:border-brand/40 transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                onChange={e => setP12File(e.target.files?.[0] || null)}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                            <div className="text-center space-y-1">
                                                <UploadCloud className="mx-auto text-text-dim" size={20} />
                                                <p className="text-xs font-semibold text-text-main">{p12File ? p12File.name : 'Seleccionar Archivo'}</p>
                                                <p className="text-[10px] text-text-dim">En pruebas acepta cualquier archivo. En producción: .p12 / .pfx</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-semibold uppercase tracking-wider text-text-dim">Contraseña del Certificado</label>
                                        <div className="relative">
                                            <input
                                                type="password"
                                                className="w-full bg-surface border border-border-thin rounded-lg pl-3 pr-8 py-2 text-xs text-text-main focus:outline-none focus:border-brand"
                                                placeholder="Contraseña del certificado (opcional en pruebas)"
                                                value={p12Password}
                                                onChange={e => setP12Password(e.target.value)}
                                            />
                                            <Lock className="absolute right-2.5 top-2.5 text-text-dim" size={14} />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUploadingFirma}
                                        className="btn-vercel-primary text-xs w-full justify-center"
                                    >
                                        {isUploadingFirma && <Loader2 className="animate-spin mr-1.5" size={14} />}
                                        Guardar y Habilitar Firma
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
