import React, { useState, useEffect } from 'react';
import { User, Loader2, Shield, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios_config';
import { useNotifications } from '../../api/NotificationsContext';

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
        if (!checked) return; // Solo se registra cuando otorga el consentimiento

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
                                    disabled={profile.acepto_terminos_firma || isSavingConsent}
                                    onChange={handleConsentToggle}
                                />
                                <label htmlFor="termsConsent" className="text-xs text-text-dim leading-relaxed cursor-pointer select-none">
                                    Acepto los términos de la <strong>Ley Orgánica de Protección de Datos Personales (LOPDP)</strong> y autorizo el procesamiento temporal de mi firma electrónica para la suscripción de documentos institucionales. Entiendo que mi certificado <code className="bg-surface-dim px-1 py-0.5 rounded font-mono text-[10px] text-brand font-semibold">.p12</code> y contraseña se procesarán únicamente en memoria para firmar y <strong>nunca serán almacenados en el servidor</strong>.
                                </label>
                            </div>

                            {profile.acepto_terminos_firma && (
                                <div className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1.5 px-1 animate-fade-in">
                                    <CheckCircle2 size={12} />
                                    Consentimiento firmado electrónicamente y activo {profile.fecha_consentimiento_firma && `el ${new Date(profile.fecha_consentimiento_firma).toLocaleDateString()}`}
                                </div>
                            )}

                            <div className="p-4 bg-brand/5 border border-brand/20 rounded-xl space-y-1.5">
                                <p className="text-xs font-semibold text-text-main">🔒 Firma sin custodia</p>
                                <p className="text-[11px] text-text-dim leading-relaxed">
                                    Bajo esta modalidad, el sistema no almacena credenciales ni claves privadas en base de datos. Cada vez que firme un protocolo, deberá cargar su archivo de firma y digitar su contraseña. Esto garantiza la inmutabilidad de su identidad y el cumplimiento estricto del marco legal de protección de datos.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
