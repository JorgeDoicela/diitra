import { useState, useEffect } from 'react';
import { X, Award, Link, BookOpen, Fingerprint, Save, RefreshCw } from 'lucide-react';
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-surface border border-border-thin rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                <header className="p-6 border-b border-border-thin flex justify-between items-center bg-bg-deep/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-text-main/10 rounded-lg text-text-main">
                            <Award size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text-main uppercase tracking-tight">{user.nombre_completo}</h3>
                            <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Perfil del Investigador - CACES/SENESCYT</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-dim hover:text-text-main p-2 transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="animate-spin text-text-main" size={24} />
                            <p className="text-xs text-text-dim uppercase font-bold tracking-widest">Cargando perfiles externos...</p>
                        </div>
                    ) : (
                        <>
                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Award size={12} /> ORCID ID
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.orcid_id || ''}
                                        onChange={(e) => setMetadata({...metadata, orcid_id: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all font-mono"
                                        placeholder="0000-0000-0000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={12} /> Scopus ID
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.scopus_id || ''}
                                        onChange={(e) => setMetadata({...metadata, scopus_id: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all font-mono"
                                        placeholder="572189..."
                                    />
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Link size={12} /> Google Scholar Profile
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.google_scholar_url || ''}
                                        onChange={(e) => setMetadata({...metadata, google_scholar_url: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                                        placeholder="https://scholar.google.com/citations?user=..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Link size={12} /> ResearchGate Profile
                                    </label>
                                    <input 
                                        type="text" 
                                        value={metadata.research_gate_url || ''}
                                        onChange={(e) => setMetadata({...metadata, research_gate_url: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all"
                                        placeholder="https://www.researchgate.net/profile/..."
                                    />
                                </div>
                            </section>

                            <hr className="border-border-thin" />

                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Award size={12} /> Especialidad / Área de Conocimiento
                                    </label>
                                    <textarea 
                                        rows={2}
                                        value={metadata.especialidad || ''}
                                        onChange={(e) => setMetadata({...metadata, especialidad: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none"
                                        placeholder="Ej: Inteligencia Artificial aplicada a la Educación..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Máximo Grado Académico</label>
                                    <select 
                                        value={metadata.grado_academico_maximo || ''}
                                        onChange={(e) => setMetadata({...metadata, grado_academico_maximo: e.target.value})}
                                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all appearance-none"
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="PHD">Doctorado (PhD)</option>
                                        <option value="MAESTRIA">Maestría</option>
                                        <option value="ESPECIALIDAD">Especialidad Médica</option>
                                        <option value="TERCER_NIVEL">Tercer Nivel / Grado</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                                        <Fingerprint size={12} /> Firma Electrónica
                                    </label>
                                    <div className="bg-bg-deep/50 border border-border-thin rounded-lg p-3 text-[10px] font-bold text-text-dim uppercase tracking-widest flex items-center justify-between">
                                        <span>Estado del Certificado</span>
                                        <span className="text-red-500">No Cargado</span>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>

                <footer className="p-6 border-t border-border-thin bg-bg-deep/50 flex justify-end gap-4">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest text-text-dim hover:text-text-main transition-all"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-text-main text-bg-deep px-8 py-2.5 rounded-md text-[11px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-text-main/10 flex items-center gap-2"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                        {saving ? 'Guardando...' : 'Actualizar Perfil'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default UserProfileModal;
