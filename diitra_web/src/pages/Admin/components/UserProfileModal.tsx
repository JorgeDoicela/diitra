import { useState, useEffect, useRef } from 'react';
import { Award, Link, BookOpen, Fingerprint, Save, RefreshCw, ChevronRight, FileText } from 'lucide-react';
import api from '../../../api/axios_config';

interface UserProfileModalProps {
    user: {
        id_profesor: string;
        nombre_completo: string;
        user_uuid: string;
    };
    onClose: () => void;
    onDraftCleared?: () => void;
}

const UserProfileModal = ({ user, onClose, onDraftCleared }: UserProfileModalProps) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [metadata, setMetadata] = useState({
        orcid_id: '',
        scopus_id: '',
        google_scholar_url: '',
        research_gate_url: '',
        especialidad: '',
        grado_academico_maximo: ''
    });

    const [officialMetadata, setOfficialMetadata] = useState<any>(null);
    const [isDraftRestored, setIsDraftRestored] = useState(false);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (user.user_uuid) {
            fetchMetadata();
        }
    }, [user.user_uuid]);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Admin/metadata/${user.user_uuid}`);
            const officialData = response.data;
            setOfficialMetadata(officialData);
            
            // Check if there is a draft
            const draftKey = `edit_user_metadata_draft_${user.user_uuid}`;
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                try {
                    const parsed = JSON.parse(draft);
                    if (parsed && typeof parsed === 'object' && parsed.metadata && typeof parsed.metadata === 'object') {
                        const validated = {
                            orcid_id: typeof parsed.metadata.orcid_id === 'string' ? parsed.metadata.orcid_id : '',
                            scopus_id: typeof parsed.metadata.scopus_id === 'string' ? parsed.metadata.scopus_id : '',
                            google_scholar_url: typeof parsed.metadata.google_scholar_url === 'string' ? parsed.metadata.google_scholar_url : '',
                            research_gate_url: typeof parsed.metadata.research_gate_url === 'string' ? parsed.metadata.research_gate_url : '',
                            especialidad: typeof parsed.metadata.especialidad === 'string' ? parsed.metadata.especialidad : '',
                            grado_academico_maximo: typeof parsed.metadata.grado_academico_maximo === 'string' ? parsed.metadata.grado_academico_maximo : ''
                        };
                        setMetadata(validated);
                        setIsDraftRestored(true);
                    } else {
                        throw new Error("Estructura de borrador de perfil de usuario inválida");
                    }
                } catch (e) {
                    console.warn("Borrador corrupto o desactualizado detectado. Limpiando almacenamiento...", e);
                    localStorage.removeItem(draftKey);
                    localStorage.removeItem('user_metadata_draft_metadata');
                    setMetadata(officialData);
                    setIsDraftRestored(false);
                }
            } else {
                setMetadata(officialData);
                setIsDraftRestored(false);
            }
            isInitializedRef.current = true;
        } catch (error) {
            console.error('Error fetching metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearDraft = () => {
        localStorage.removeItem(`edit_user_metadata_draft_${user.user_uuid}`);
        localStorage.removeItem('user_metadata_draft_metadata');
        setIsDraftRestored(false);
        if (onDraftCleared) {
            onDraftCleared();
        }
    };

    // Auto-save effect
    useEffect(() => {
        if (loading || !isInitializedRef.current || !user.user_uuid) return;

        const draftData = { metadata };
        const draftKey = `edit_user_metadata_draft_${user.user_uuid}`;
        localStorage.setItem(draftKey, JSON.stringify(draftData));

        const meta = {
            type: 'edit',
            uuid: user.user_uuid,
            userName: user.nombre_completo,
            timestamp: Date.now()
        };
        localStorage.setItem('user_metadata_draft_metadata', JSON.stringify(meta));
    }, [metadata, loading, user.user_uuid, user.nombre_completo]);

    const handleCloseModal = () => {
        // Check if metadata has changes from officialMetadata
        const hasChanges = officialMetadata && JSON.stringify(metadata) !== JSON.stringify(officialMetadata);
        if (hasChanges) {
            if (window.confirm('¿Está seguro de salir? Perderá todos los cambios no guardados en este formulario.')) {
                clearDraft();
                onClose();
            }
        } else {
            clearDraft();
            onClose();
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/Admin/metadata/${user.user_uuid}`, metadata);
            clearDraft();
            onClose();
        } catch (error) {
            console.error('Error saving metadata:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div 
                className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in"
                onClick={handleCloseModal}
            />
            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-fade-up overflow-hidden">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-brand">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">{user.nombre_completo}</h3>
                            <p className="section-label text-text-dim">Perfil del Investigador - CACES/SENESCYT</p>
                        </div>
                    </div>
                    <button onClick={handleCloseModal} className="text-text-dim hover:text-text-main p-2 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isDraftRestored && (
                        <div className="bg-brand-subtle border border-brand/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in mb-6">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-brand shrink-0" />
                                <p className="text-[11px] text-text-dim uppercase tracking-wider font-bold">
                                    <span className="text-brand font-black">Borrador Restaurado:</span> Se han recuperado tus datos no guardados localmente.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (officialMetadata) {
                                        setMetadata(officialMetadata);
                                    }
                                    localStorage.removeItem(`edit_user_metadata_draft_${user.user_uuid}`);
                                    localStorage.removeItem('user_metadata_draft_metadata');
                                    setIsDraftRestored(false);
                                    if (onDraftCleared) {
                                        onDraftCleared();
                                    }
                                }}
                                className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline cursor-pointer shrink-0"
                            >
                                Revertir al Original
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="animate-spin text-brand" size={24} />
                            <p className="section-label text-text-dim">Cargando perfiles externos...</p>
                        </div>
                    ) : (
                        <>
                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        <Award size={12} /> ORCID ID
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.orcid_id || ''}
                                        onChange={(e) => setMetadata({...metadata, orcid_id: e.target.value})}
                                        className="input-vercel !font-mono"
                                        placeholder="0000-0000-0000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        <BookOpen size={12} /> Scopus ID
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.scopus_id || ''}
                                        onChange={(e) => setMetadata({...metadata, scopus_id: e.target.value})}
                                        className="input-vercel !font-mono"
                                        placeholder="572189..."
                                    />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        <Link size={12} /> Google Scholar Profile
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.google_scholar_url || ''}
                                        onChange={(e) => setMetadata({...metadata, google_scholar_url: e.target.value})}
                                        className="input-vercel"
                                        placeholder="https://scholar.google.com/citations?user=..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        <Link size={12} /> ResearchGate Profile
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.research_gate_url || ''}
                                        onChange={(e) => setMetadata({...metadata, research_gate_url: e.target.value})}
                                        className="input-vercel"
                                        placeholder="https://www.researchgate.net/profile/..."
                                    />
                                </div>
                            </section>

                            <div className="divider-vercel" />

                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="section-label text-text-dim">
                                        <Award size={12} /> Especialidad / Área de Conocimiento
                                    </label>
                                    <textarea 
                                        rows={2}
                                        value={metadata.especialidad || ''}
                                        onChange={(e) => setMetadata({...metadata, especialidad: e.target.value})}
                                        className="input-vercel resize-none"
                                        placeholder="Ej: Inteligencia Artificial aplicada a la Educación..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Máximo Grado Académico</label>
                                    <select 
                                        value={metadata.grado_academico_maximo || ''}
                                        onChange={(e) => setMetadata({...metadata, grado_academico_maximo: e.target.value})}
                                        className="input-vercel"
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="PHD">Doctorado (PhD)</option>
                                        <option value="MAESTRIA">Maestría</option>
                                        <option value="ESPECIALIDAD">Especialidad Médica</option>
                                        <option value="TERCER_NIVEL">Tercer Nivel / Grado</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">
                                        <Fingerprint size={12} /> Firma Electrónica
                                    </label>
                                    <div className="bento-card static p-3 text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center justify-between">
                                        <span>Estado del Certificado</span>
                                        <span className="text-error">No Cargado</span>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button onClick={handleCloseModal} className="btn-vercel-secondary">Cancelar</button>
                    <button 
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="btn-vercel-primary flex items-center gap-2"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                        {saving ? 'Guardando...' : 'Actualizar Perfil'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;