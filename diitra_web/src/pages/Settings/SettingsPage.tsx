import React, { useState, useEffect } from 'react';
import { User, Loader2 } from 'lucide-react';
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


    return (
        <div className="p-4 md:p-10 space-y-8 animate-fade-up">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-text-dim uppercase tracking-[0.3em]">
                    <User size={12} className="text-brand" />
                    <span>Configuración de Cuenta</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-text-main tracking-tight">Mi Cuenta</h1>
                <p className="text-xs md:text-sm text-text-dim max-w-xl leading-relaxed">
                    Administre su perfil científico y sus identificadores de investigador. Su consentimiento para el tratamiento de datos personales y firma electrónica ya se encuentra activo en el sistema.
                </p>
            </header>

            <div className="max-w-4xl">
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
        </div>
    );
};

export default SettingsPage;
