import { useState, useEffect } from 'react';
import { X, Award, Link, BookOpen, Fingerprint, Save, RefreshCw, ChevronRight } from 'lucide-react';
import api from '../../../api/axios_config';

interface UserProfileModalProps {
    user: {
        id_profesor: string;
        nombre_completo: string;
        user_uuid: string;
    };
    onClose: () => void;
}

const UserProfileModal = ({ user, onClose }: UserProfileModalProps) => {
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

    useEffect(() => {
        if (user.user_uuid) {
            fetchMetadata();
        }
    }, [user.user_uuid]);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/Admin/metadata/${user.user_uuid}`);
            setMetadata(response.data);
        } catch (error) {
            console.error('Error fetching metadata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/Admin/metadata/${user.user_uuid}`, metadata);
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
                onClick={onClose}
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
                    <button onClick={onClose} className="text-text-dim hover:text-text-main p-2 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    <button onClick={onClose} className="btn-vercel-secondary">Cancelar</button>
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