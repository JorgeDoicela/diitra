import React, { useState } from 'react';
import { UserPlus, AlertTriangle, Loader2, Check, ChevronRight } from 'lucide-react';
import { registerRevisorExterno } from '../../../services/peerReviewService';
import type { RegistrarRevisorExternoPayload } from '../../../services/peerReviewService';

export interface ModalRevisorExternoProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ModalRevisorExterno: React.FC<ModalRevisorExternoProps> = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState<RegistrarRevisorExternoPayload>({
        cedula: '',
        nombres: '',
        apellidos: '',
        email: '',
        institucion: '',
        grado_academico: '',
        orcid_id: '',
        especialidad: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<{ nombre: string; cedula: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await registerRevisorExterno(form);
            setDone({
                nombre: `${form.nombres} ${form.apellidos}`.toUpperCase().trim(),
                cedula: form.cedula || form.email
            });
        } catch (err: any) {
            setError(err?.response?.data?.message ?? 'Error al registrar el revisor externo.');
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="fixed inset-0 z-[9999] flex justify-end">
                <div className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in" onClick={onSuccess} />
                <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden shadow-2xl">
                    <div className="modal-header border-b border-border-thin">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
                                <Check size={16} className="text-success" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-text-main">Evaluador Registrado</h3>
                                <p className="section-label text-text-dim">Par Evaluador Externo · CACES I5</p>
                            </div>
                        </div>
                        <button onClick={onSuccess} className="text-text-dim hover:text-text-main transition-colors p-1.5 rounded-md hover:bg-surface-hover cursor-pointer">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="bento-card static p-5 space-y-3">
                            <p className="text-sm text-text-dim leading-relaxed">
                                <span className="text-text-main font-semibold">{done.nombre}</span> ha sido registrado exitosamente en la plataforma. Se han generado las siguientes credenciales de acceso por defecto:
                            </p>
                            <div className="p-4 rounded-xl bg-bg-deep border border-border-thin font-mono text-xs space-y-2 text-text-dim">
                                <div className="flex justify-between items-center"><span className="text-text-main font-semibold">Usuario (Cédula):</span> <span>{done.cedula}</span></div>
                                <div className="flex justify-between items-center"><span className="text-text-main font-semibold">Contraseña:</span> <span>Diitra2026*</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer border-t border-border-thin bg-surface p-4 flex items-center justify-end">
                        <button onClick={onSuccess} className="btn-vercel-primary">Entendido</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[9999] flex justify-end">
            <div className="absolute inset-0 bg-bg-deep/90 backdrop-blur-sm cursor-pointer animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-xl h-full bg-surface border-l border-border-thin flex flex-col z-10 animate-slide-in-right overflow-hidden shadow-2xl">
                <div className="modal-header border-b border-border-thin">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-brand">
                            <UserPlus size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-text-main">Registrar Revisor Externo</h3>
                            <p className="section-label text-text-dim">Par Evaluador Externo · CACES I5</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-text-dim hover:text-text-main transition-colors p-1.5 rounded-md hover:bg-surface-hover cursor-pointer">
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl bg-error/5 border border-error/20 text-error text-xs flex items-center gap-2.5">
                            <AlertTriangle size={14} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    <form id="form-externo" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="section-label text-text-dim">Cédula / Pasaporte *</label>
                            <input 
                                required 
                                className="input-vercel" 
                                placeholder="Ej: 1712345678" 
                                value={form.cedula} 
                                onChange={e => setForm(f => ({ ...f, cedula: e.target.value }))} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="section-label text-text-dim">Nombres *</label>
                                <input 
                                    required 
                                    className="input-vercel uppercase" 
                                    placeholder="JUAN CARLOS" 
                                    value={form.nombres} 
                                    onChange={e => setForm(f => ({ ...f, nombres: e.target.value }))} 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="section-label text-text-dim">Apellidos *</label>
                                <input 
                                    required 
                                    className="input-vercel uppercase" 
                                    placeholder="PÉREZ MORA" 
                                    value={form.apellidos} 
                                    onChange={e => setForm(f => ({ ...f, apellidos: e.target.value }))} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="section-label text-text-dim">Email *</label>
                            <input 
                                required 
                                type="email" 
                                className="input-vercel" 
                                placeholder="revisor@universidad.edu" 
                                value={form.email} 
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="section-label text-text-dim">Institución *</label>
                            <input 
                                required 
                                className="input-vercel" 
                                placeholder="Universidad Central del Ecuador" 
                                value={form.institucion} 
                                onChange={e => setForm(f => ({ ...f, institucion: e.target.value }))} 
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="section-label text-text-dim">Grado Académico</label>
                                <select 
                                    className="input-vercel" 
                                    value={form.grado_academico} 
                                    onChange={e => setForm(f => ({ ...f, grado_academico: e.target.value }))}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="PHD">Doctorado / PhD</option>
                                    <option value="MAESTRIA">Maestría</option>
                                    <option value="ESPECIALIDAD">Especialidad Médica</option>
                                    <option value="TERCER_NIVEL">Tercer Nivel</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="section-label text-text-dim">ORCID iD</label>
                                <input 
                                    className="input-vercel" 
                                    placeholder="0000-0000-0000-0000" 
                                    value={form.orcid_id} 
                                    onChange={e => setForm(f => ({ ...f, orcid_id: e.target.value }))} 
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="section-label text-text-dim">Área de Especialidad</label>
                            <input 
                                className="input-vercel" 
                                placeholder="Ej: Inteligencia Artificial, Biotecnología..." 
                                value={form.especialidad} 
                                onChange={e => setForm(f => ({ ...f, especialidad: e.target.value }))} 
                            />
                        </div>
                    </form>
                </div>
                <div className="modal-footer border-t border-border-thin bg-surface p-4 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="btn-vercel-secondary">Cancelar</button>
                    <button type="submit" form="form-externo" className="btn-vercel-primary flex items-center gap-2" disabled={loading}>
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                        <span>{loading ? 'Registrando...' : 'Registrar'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalRevisorExterno;
