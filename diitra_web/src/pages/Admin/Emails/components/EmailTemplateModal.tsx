import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { UseEmailTemplatesResult } from '../hooks/useEmailTemplates';

export interface EmailTemplateModalProps {
    templatesHook: UseEmailTemplatesResult;
}

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ templatesHook }) => {
    const {
        isTemplateModalOpen,
        setIsTemplateModalOpen,
        editingTemplate,
        templateForm,
        setTemplateForm,
        templateError,
        showTemplateHtmlEditor,
        setShowTemplateHtmlEditor,
        handleSaveTemplate
    } = templatesHook;

    if (!isTemplateModalOpen) return null;

    return (
        <div className="modal-overlay animate-fade-in">
            <div className="modal-card animate-fade-up max-w-3xl w-full">
                <header className="modal-header">
                    <h4 className="font-bold text-text-main text-base uppercase tracking-wider">
                        {editingTemplate ? 'Editar Plantilla de Email' : 'Crear Nueva Plantilla de Email'}
                    </h4>
                    <button
                        onClick={() => setIsTemplateModalOpen(false)}
                        className="text-text-dim hover:text-text-main transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </header>

                <form onSubmit={handleSaveTemplate}>
                    <div className="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
                        {templateError && (
                            <div className="badge-vercel-error !rounded-xl !p-3 text-xs flex items-center gap-2">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{templateError}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Codigo */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Código Único *</label>
                                <input
                                    type="text"
                                    disabled={editingTemplate !== null}
                                    className="input-vercel text-xs font-mono uppercase"
                                    placeholder="EJ: ALERTA_CRONOGRAMA"
                                    value={templateForm.codigo}
                                    onChange={e => setTemplateForm(prev => ({ ...prev, codigo: e.target.value }))}
                                />
                                <span className="text-[8px] text-text-dim block">Código interno del sistema. No se puede cambiar al editar.</span>
                            </div>

                            {/* Nombre */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Nombre de la Plantilla *</label>
                                <input
                                    type="text"
                                    className="input-vercel text-xs font-sans"
                                    placeholder="Ej: Notificación de Hito Vencido"
                                    value={templateForm.nombre}
                                    onChange={e => setTemplateForm(prev => ({ ...prev, nombre: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Descripcion */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Descripción del propósito</label>
                            <input
                                type="text"
                                className="input-vercel text-xs font-sans"
                                placeholder="Ej: Se envía automáticamente a los docentes cuando se aproxima la fecha límite de un informe de avance."
                                value={templateForm.descripcion}
                                onChange={e => setTemplateForm(prev => ({ ...prev, descripcion: e.target.value }))}
                            />
                        </div>

                        {/* Asunto */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">Asunto del correo predeterminado *</label>
                            <input
                                type="text"
                                className="input-vercel text-xs font-semibold"
                                placeholder="Ej: Alerta: Entrega pendiente en el proyecto [[proyecto_titulo]]"
                                value={templateForm.asunto}
                                onChange={e => setTemplateForm(prev => ({ ...prev, asunto: e.target.value }))}
                            />
                            <span className="text-[8px] text-text-dim block">Puede usar tokens de inyección como [[proyecto_titulo]]</span>
                        </div>

                        {/* Cuerpo Html — solo administradores técnicos */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                                    Diseño del correo (HTML interno) *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowTemplateHtmlEditor(v => !v)}
                                    className="text-[9px] font-bold text-brand uppercase tracking-wider hover:underline cursor-pointer"
                                >
                                    {showTemplateHtmlEditor ? 'Ocultar editor' : 'Mostrar editor avanzado'}
                                </button>
                            </div>
                            <p className="text-[8px] text-text-dim leading-relaxed">
                                Solo el contenido central (párrafos, tablas, botones). El encabezado SISTEMA DIITRA con logos y el pie LOPDP los agrega el sistema al enviar.
                            </p>
                            {showTemplateHtmlEditor && (
                                <textarea
                                    rows={12}
                                    className="input-vercel font-mono text-xs leading-relaxed"
                                    placeholder="<div style='...'>...</div>"
                                    value={templateForm.cuerpoHtml}
                                    onChange={e => setTemplateForm(prev => ({ ...prev, cuerpoHtml: e.target.value }))}
                                />
                            )}
                            {!showTemplateHtmlEditor && templateForm.cuerpoHtml && (
                                <p className="text-[9px] text-text-dim italic p-2 border border-dashed border-border-thin rounded-lg">
                                    Plantilla HTML configurada ({templateForm.cuerpoHtml.length} caracteres). Use el editor avanzado para modificarla.
                                </p>
                            )}
                            <div className="space-y-2 mt-2 select-none">
                                {[
                                    { label: 'Globales', tokens: ['[[destinatario_nombre]]', '[[destinatario_email]]', '[[anio_actual]]', '[[institucion_nombre]]', '[[sistema_url]]'] },
                                    { label: 'Proyecto', tokens: ['[[proyecto_titulo]]', '[[proyecto_codigo]]', '[[proyecto_descripcion]]', '[[proyecto_estado]]', '[[proyecto_director]]', '[[proyecto_director_email]]', '[[linea_investigacion]]', '[[proyecto_sublinea]]', '[[proyecto_workspace_url]]'] },
                                    { label: 'Convocatoria', tokens: ['[[convocatoria_titulo]]', '[[convocatoria_codigo]]', '[[convocatoria_anio]]', '[[convocatoria_apertura]]', '[[convocatoria_cierre]]', '[[convocatoria_presupuesto]]', '[[convocatoria_monto_maximo]]', '[[convocatoria_bases_url]]', '[[convocatoria_estado]]'] },
                                    { label: 'PeerReview', tokens: ['[[revisor_nombre]]', '[[revisor_email]]', '[[peer_review_dictamen]]', '[[peer_review_estado]]', '[[peer_review_fecha_limite]]', '[[peer_review_puntaje]]', '[[peer_review_observaciones]]', '[[peer_review_tipo]]', '[[peer_review_anonimo]]'] }
                                ].map(group => (
                                    <div key={group.label}>
                                        <span className="text-[8px] font-black text-text-dim uppercase tracking-widest block mb-1">{group.label}:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {group.tokens.map(tok => (
                                                <button
                                                    key={tok}
                                                    type="button"
                                                    onClick={() => setTemplateForm(prev => ({ ...prev, cuerpoHtml: prev.cuerpoHtml + tok }))}
                                                    className="px-1.5 py-0.5 rounded border border-border-thin bg-surface text-[8px] font-mono text-text-dim hover:text-brand hover:border-brand/40 transition-all cursor-pointer"
                                                >
                                                    {tok}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activo */}
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                type="checkbox"
                                id="activo-chk"
                                checked={templateForm.activo}
                                onChange={e => setTemplateForm(prev => ({ ...prev, activo: e.target.checked }))}
                                className="rounded border-border-thin text-brand focus:ring-brand shrink-0"
                            />
                            <label htmlFor="activo-chk" className="text-xs font-bold text-text-main select-none cursor-pointer">
                                Plantilla activa disponible para envío
                            </label>
                        </div>
                    </div>

                    <footer className="modal-footer">
                        <button
                            type="button"
                            onClick={() => setIsTemplateModalOpen(false)}
                            className="btn-vercel-secondary py-2 text-xs uppercase"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-vercel-primary py-2 text-xs uppercase cursor-pointer"
                        >
                            Guardar Plantilla
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EmailTemplateModal;
