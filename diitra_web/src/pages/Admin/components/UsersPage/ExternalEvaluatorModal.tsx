import React from 'react';
import { Globe, X, AlertTriangle, FileText, Shield } from 'lucide-react';
import type { ExternalForm } from '../../hooks/useUsersPage';

interface ExternalEvaluatorModalProps {
    showExternalForm: boolean;
    handleCloseExternalModal: () => void;
    error: string;
    isExternalDraftRestored: boolean;
    externalForm: ExternalForm;
    setExternalForm: React.Dispatch<React.SetStateAction<ExternalForm>> | ((form: ExternalForm | ((prev: ExternalForm) => ExternalForm)) => void);
    setIsExternalDraftRestored: (restored: boolean) => void;
    setPendingExternalDraft: (draft: any) => void;
    handleRegisterExternal: (e: React.FormEvent) => void;
}

export const ExternalEvaluatorModal: React.FC<ExternalEvaluatorModalProps> = ({
    showExternalForm,
    handleCloseExternalModal,
    error,
    isExternalDraftRestored,
    externalForm,
    setExternalForm,
    setIsExternalDraftRestored,
    setPendingExternalDraft,
    handleRegisterExternal
}) => {
    if (!showExternalForm) return null;

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) handleCloseExternalModal(); }}>
            <div className="modal-card modal-card--lg animate-scale-up">
                <div className="modal-header">
                    <div className="flex items-center gap-3">
                        <div className="icon-circle icon-circle-info !p-2"><Globe size={20} /></div>
                        <div>
                            <h3 className="text-sm font-bold text-text-main uppercase tracking-tight">Registro de Evaluador Académico</h3>
                            <p className="section-label text-text-dim">Personal Externo DIITRA - IST Quito</p>
                        </div>
                    </div>
                    <button type="button" onClick={handleCloseExternalModal} className="text-text-dim hover:text-text-main transition-colors"><X size={20} /></button>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 p-3.5 mx-6 mt-4 rounded-lg bg-error/15 border border-error/30 text-error text-xs font-semibold animate-fade-up">
                        <AlertTriangle size={14} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form id="external-register-form" onSubmit={handleRegisterExternal} className="modal-body">
                    {isExternalDraftRestored && (
                        <div className="col-span-2 border border-border-thin bg-surface-hover rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-fade-in mb-6">
                            <div className="flex items-center gap-3">
                                <FileText size={16} className="text-text-main shrink-0" />
                                <p className="text-xs text-text-dim">
                                    <span className="text-text-main font-semibold">Borrador restaurado:</span> Se han recuperado los datos del evaluador no guardados.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setExternalForm({
                                        cedula: '',
                                        nombres: '',
                                        apellidos: '',
                                        email: '',
                                        especialidad: '',
                                        grado_academico: '',
                                        institucion: '',
                                        orcid_id: ''
                                    });
                                    localStorage.removeItem('new_external_form_draft');
                                    localStorage.removeItem('external_draft_metadata');
                                    setIsExternalDraftRestored(false);
                                    setPendingExternalDraft(null);
                                }}
                                className="text-xs font-medium text-brand hover:underline cursor-pointer shrink-0"
                            >
                                Descartar borrador
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-4">
                            <label className="section-label text-text-main">Identificación y Contacto</label>
                            <div className="divider-vercel !my-0" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Cédula / Pasaporte</label>
                                    <input required type="text" value={externalForm.cedula} onChange={e => setExternalForm(prev => ({ ...prev, cedula: e.target.value }))} className="input-vercel" placeholder="1712345678" />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Correo Electrónico</label>
                                    <input required type="email" value={externalForm.email} onChange={e => setExternalForm(prev => ({ ...prev, email: e.target.value }))} className="input-vercel" placeholder="dr.perez@universidad.edu.ec" />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Nombres</label>
                                    <input required type="text" value={externalForm.nombres} onChange={e => setExternalForm(prev => ({ ...prev, nombres: e.target.value }))} className="input-vercel !uppercase" placeholder="Ej: JUAN CARLOS" />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Apellidos</label>
                                    <input required type="text" value={externalForm.apellidos} onChange={e => setExternalForm(prev => ({ ...prev, apellidos: e.target.value }))} className="input-vercel !uppercase" placeholder="Ej: PÉREZ MORA" />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 space-y-4 mt-4">
                            <label className="section-label text-text-main">Perfil Profesional (Contexto SENESCYT)</label>
                            <div className="divider-vercel !my-0" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Grado Máximo</label>
                                    <select
                                        value={externalForm.grado_academico}
                                        onChange={e => setExternalForm(prev => ({ ...prev, grado_academico: e.target.value }))}
                                        className="input-vercel"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="PHD">Doctorado / PhD</option>
                                        <option value="MAESTRIA">Maestría / Magíster</option>
                                        <option value="ESPECIALIDAD">Especialidad Médica</option>
                                        <option value="TERCER_NIVEL">Tercer Nivel</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Especialidad (Línea de Inv.)</label>
                                    <input type="text" value={externalForm.especialidad} onChange={e => setExternalForm(prev => ({ ...prev, especialidad: e.target.value }))} className="input-vercel" placeholder="Ej: Inteligencia Artificial" />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">Institución de Origen</label>
                                    <input type="text" value={externalForm.institucion} onChange={e => setExternalForm(prev => ({ ...prev, institucion: e.target.value }))} className="input-vercel" placeholder="Ej: Escuela Politécnica Nacional" />
                                </div>
                                <div className="space-y-2">
                                    <label className="section-label text-text-dim">ORCID iD</label>
                                    <input type="text" value={externalForm.orcid_id} onChange={e => setExternalForm(prev => ({ ...prev, orcid_id: e.target.value }))} className="input-vercel" placeholder="0000-0000-0000-0000" />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="modal-footer">
                    <div className="flex items-center gap-2 text-text-dim text-[9px]">
                        <Shield size={10} />
                        <span>Se asignará automáticamente el rol de Revisor Externo DIITRA</span>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={handleCloseExternalModal} className="btn-vercel-secondary">Cancelar</button>
                        <button type="submit" form="external-register-form" className="btn-vercel-primary">Registrar Evaluador</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
