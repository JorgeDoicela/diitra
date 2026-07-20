import React from 'react';
import {
    Send, Sparkles, CheckCircle2, Layers, FileText, Shield, Paperclip,
    AlertTriangle, X, Loader2
} from 'lucide-react';
import type { UseEmailComposerResult } from '../hooks/useEmailComposer';
import type { Carrera, Proyecto, Convocatoria, PeerReview, EmailTemplate } from '../emailEngineTypes';
import RecipientPicker from './RecipientPicker';
import { TEMPLATE_RECOMMENDED_CONTEXT, getTokenLabel } from '../emailEngineConfig';

export interface EmailComposerSectionProps {
    composer: UseEmailComposerResult;
    templates: EmailTemplate[];
    carreras: Carrera[];
    projects: Proyecto[];
    convocatorias: Convocatoria[];
    peerReviews: PeerReview[];
}

export const EmailComposerSection: React.FC<EmailComposerSectionProps> = ({
    composer,
    templates,
    carreras,
    projects,
    convocatorias,
    peerReviews
}) => {
    const {
        selectedTemplateId,
        handleTemplateChange,
        selectedTemplate,
        selectedPeople,
        setSelectedPeople,
        selectedRole,
        setSelectedRole,
        selectedCarreraId,
        setSelectedCarreraId,
        contextType,
        setContextType,
        selectedEntityUuid,
        setSelectedEntityUuid,
        subjectVariantId,
        handleSubjectVariantChange,
        subjectVariants,
        customSubject,
        setCustomSubject,
        parsedPreview,
        additionalMessage,
        setAdditionalMessage,
        autoFilledTokens,
        userFacingTokens,
        tokenValues,
        handleTokenValChange,
        systemAttachments,
        setSystemAttachments,
        signatureFile,
        setSignatureFile,
        signaturePassword,
        setSignaturePassword,
        attachments,
        handleFileChange,
        removeAttachment,
        sendResult,
        sending,
        handleSendEmail
    } = composer;

    return (
        <div className="bento-card static p-6 space-y-6">
            <h3 className="text-base font-semibold text-text-main uppercase tracking-tight pb-3 border-b border-border-thin flex items-center gap-2">
                <Send size={16} className="text-brand" /> Asistente de Envío
            </h3>

            <form onSubmit={handleSendEmail} className="space-y-6">
                {/* Tipo de comunicación */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                        Tipo de comunicación *
                    </label>
                    <select
                        className="input-vercel text-sm"
                        value={selectedTemplateId}
                        onChange={e => handleTemplateChange(e.target.value)}
                    >
                        <option value="">— Ninguno / Seleccione qué desea notificar —</option>
                        {templates.filter(t => t.activo).map(t => (
                            <option key={t.idEmailTemplate} value={t.idEmailTemplate.toString()}>
                                {t.nombre}
                            </option>
                        ))}
                    </select>
                    {selectedTemplate?.descripcion && (
                        <p className="text-xs text-text-dim leading-relaxed mt-1.5 ml-0.5 font-medium">
                            {selectedTemplate.descripcion}
                        </p>
                    )}
                </div>

                {/* Selector inteligente de destinatarios */}
                <RecipientPicker
                    carreras={carreras}
                    selected={selectedPeople}
                    onSelected={setSelectedPeople}
                    broadcastRole={selectedRole}
                    onBroadcastRole={setSelectedRole}
                    broadcastCarreraId={selectedCarreraId}
                    onBroadcastCarreraId={setSelectedCarreraId}
                />

                {/* Dual System Context Selection */}
                <div className="space-y-4 p-4 bg-surface border border-border-thin rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-main uppercase tracking-widest">Vincular al sistema</span>
                        <span className="text-[9px] font-mono text-brand font-semibold flex items-center gap-1">
                            <Sparkles size={10} /> Datos automáticos
                        </span>
                    </div>
                    {selectedTemplate && TEMPLATE_RECOMMENDED_CONTEXT[selectedTemplate.codigo] && (
                        <p className="text-[9px] text-text-dim leading-relaxed -mt-2">
                            {TEMPLATE_RECOMMENDED_CONTEXT[selectedTemplate.codigo].hint}
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Entity Type Select */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Tipo de Entidad</label>
                            <select
                                className="input-vercel !py-2 text-xs"
                                value={contextType}
                                onChange={e => {
                                    setContextType(e.target.value);
                                    setSelectedEntityUuid('');
                                }}
                            >
                                <option value="">-- Sin Contexto --</option>
                                <option value="Proyecto">Proyecto de Investigación</option>
                                <option value="Convocatoria">Convocatoria Oficial</option>
                                <option value="PeerReview">Evaluación de Pares (Arbitraje)</option>
                            </select>
                        </div>

                        {/* Instance Select */}
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-text-dim uppercase tracking-wider">Instancia del Sistema</label>
                            <select
                                className="input-vercel !py-2 text-xs"
                                disabled={!contextType}
                                value={selectedEntityUuid}
                                onChange={e => setSelectedEntityUuid(e.target.value)}
                            >
                                <option value="">
                                    {contextType === 'Proyecto'
                                        ? '— Ningún proyecto (sin detalles) —'
                                        : contextType === 'Convocatoria'
                                            ? '— Ninguna convocatoria —'
                                            : contextType === 'PeerReview'
                                                ? '— Ninguna evaluación —'
                                                : '— Sin instancia —'}
                                </option>
                                {contextType === 'Proyecto' && projects.map(p => (
                                    <option key={p.uuid} value={p.uuid}>
                                        {p.codigo_institucional ? `[${p.codigo_institucional}] ` : ''}{p.titulo}
                                    </option>
                                ))}
                                {contextType === 'Convocatoria' && convocatorias.map(c => (
                                    <option key={c.uuid} value={c.uuid}>
                                        {c.codigoConvocatoria ? `[${c.codigoConvocatoria}] ` : ''}{c.titulo}
                                    </option>
                                ))}
                                {contextType === 'PeerReview' && peerReviews.map(r => (
                                    <option key={r.uuid} value={r.uuid}>
                                        [{r.estado.toUpperCase()}] {r.proyectoTitulo.substring(0, 30)}... ({r.revisorNombre})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Asunto — variantes predefinidas */}
                <div className="space-y-3 p-4 bg-surface border border-border-thin rounded-xl shadow-sm">
                    <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                        Título del correo (asunto)
                    </label>
                    <select
                        className="input-vercel text-sm"
                        value={subjectVariantId}
                        onChange={e => handleSubjectVariantChange(e.target.value)}
                        disabled={!selectedTemplate}
                    >
                        {subjectVariants.map(v => (
                            <option key={v.id} value={v.id}>{v.label}</option>
                        ))}
                        <option value="personalizado">Escribir asunto personalizado…</option>
                    </select>
                    {subjectVariantId === 'personalizado' ? (
                        <input
                            type="text"
                            className="input-vercel text-sm"
                            value={customSubject}
                            onChange={e => setCustomSubject(e.target.value)}
                            placeholder="Ej: DIITRA — Comunicado institucional"
                        />
                    ) : (
                        <p className="text-xs font-medium text-text-main leading-relaxed">
                            {parsedPreview.subject || '—'}
                        </p>
                    )}
                </div>

                {/* Nota adicional en texto plano */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider">
                        Nota adicional (opcional)
                    </label>
                    <textarea
                        rows={3}
                        className="input-vercel text-sm leading-relaxed"
                        value={additionalMessage}
                        onChange={e => setAdditionalMessage(e.target.value)}
                        placeholder="Texto breve que se agregará al mensaje institucional. No necesita formato especial."
                    />
                </div>

                {/* Datos automáticos del sistema */}
                {autoFilledTokens.length > 0 && (
                    <div className="space-y-2 p-4 rounded-xl border border-border-thin bg-surface shadow-sm">
                        <span className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle2 size={11} className="text-success" /> Autocompletados al enviar
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {autoFilledTokens.map(tok => (
                                <span key={tok} className="text-[8px] px-2 py-0.5 rounded-full bg-surface border border-border-thin text-text-dim">
                                    {getTokenLabel(tok)}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Campos editables con etiquetas en español */}
                {userFacingTokens.length > 0 && (
                    <div className="space-y-4 p-4 bg-surface border border-border-thin rounded-xl shadow-sm">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-brand" />
                            <h5 className="text-[10px] font-black text-text-main uppercase tracking-widest">
                                Variables del Mensaje ({userFacingTokens.length})
                            </h5>
                        </div>
                        <p className="text-[9px] text-text-dim leading-relaxed">
                            Revise o complete estos campos. Si eligió un proyecto, convocatoria o revisión arriba, muchos se llenan automáticamente.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userFacingTokens.map(tok => {
                                const meta = { label: getTokenLabel(tok) };
                                const filled = Boolean(tokenValues[tok]?.trim());
                                return (
                                    <div key={tok} className="space-y-1">
                                        <span className="text-[10px] font-bold text-text-main flex items-center gap-1">
                                            {meta.label}
                                            {filled && contextType && (
                                                <span className="text-[8px] text-success font-normal">✓ auto</span>
                                            )}
                                        </span>
                                        <input
                                            type="text"
                                            className="input-vercel !py-1.5 text-xs bg-bg-deep border-border-thin focus:border-brand font-sans"
                                            value={tokenValues[tok] || ''}
                                            onChange={e => handleTokenValChange(tok, e.target.value)}
                                            placeholder={`Ingrese ${meta.label.toLowerCase()}`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Documentos del Sistema Checkboxes */}
                <div className="space-y-3 p-4 bg-surface border border-border-thin rounded-xl shadow-sm">
                    <div className="flex items-center justify-between border-b border-border-thin pb-2">
                        <span className="text-[10px] font-black text-text-main uppercase tracking-widest flex items-center gap-1.5">
                            <FileText size={12} className="text-brand" /> Documentos del Sistema (PDF Autogenerado)
                        </span>
                        <span className="text-[8px] font-mono text-brand font-semibold uppercase tracking-wider">Generación al Vuelo</span>
                    </div>
                    <div className="space-y-2.5 pt-1">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sys-protocolo"
                                disabled={!selectedEntityUuid}
                                checked={systemAttachments['PROTOCOLO_INVESTIGACION']}
                                onChange={e => setSystemAttachments(prev => ({ ...prev, 'PROTOCOLO_INVESTIGACION': e.target.checked }))}
                                className="rounded border-border-thin text-brand focus:ring-brand shrink-0 cursor-pointer disabled:opacity-50"
                            />
                            <label htmlFor="sys-protocolo" className={`text-xs font-bold select-none cursor-pointer ${!selectedEntityUuid ? 'text-text-dim/40' : 'text-text-main hover:text-brand transition-colors'} flex items-center gap-1.5`}>
                                Generar Ficha / Protocolo de Investigación
                                {!selectedEntityUuid && <span className="text-[9px] text-text-dim font-normal italic">(Requiere seleccionar un contexto)</span>}
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sys-dictamen"
                                disabled={!selectedEntityUuid}
                                checked={systemAttachments['DICTAMEN_ARBITRAJE']}
                                onChange={e => setSystemAttachments(prev => ({ ...prev, 'DICTAMEN_ARBITRAJE': e.target.checked }))}
                                className="rounded border-border-thin text-brand focus:ring-brand shrink-0 cursor-pointer disabled:opacity-50"
                            />
                            <label htmlFor="sys-dictamen" className={`text-xs font-bold select-none cursor-pointer ${!selectedEntityUuid ? 'text-text-dim/40' : 'text-text-main hover:text-brand transition-colors'} flex items-center gap-1.5`}>
                                Generar Acta de Dictamen de Arbitraje CACES
                                {!selectedEntityUuid && <span className="text-[9px] text-text-dim font-normal italic">(Requiere seleccionar un contexto)</span>}
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sys-rubrica"
                                disabled={!selectedEntityUuid}
                                checked={systemAttachments['RUBRICA_DINAMICA']}
                                onChange={e => setSystemAttachments(prev => ({ ...prev, 'RUBRICA_DINAMICA': e.target.checked }))}
                                className="rounded border-border-thin text-brand focus:ring-brand shrink-0 cursor-pointer disabled:opacity-50"
                            />
                            <label htmlFor="sys-rubrica" className={`text-xs font-bold select-none cursor-pointer ${!selectedEntityUuid ? 'text-text-dim/40' : 'text-text-main hover:text-brand transition-colors'} flex items-center gap-1.5`}>
                                Generar Rúbrica de Evaluación Dinámica
                                {!selectedEntityUuid && <span className="text-[9px] text-text-dim font-normal italic">(Requiere seleccionar un contexto)</span>}
                            </label>
                        </div>
                    </div>

                    {/* Firma Electrónica (.p12) para adjuntos del sistema */}
                    <div className="mt-4 pt-3 border-t border-border-thin space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-text-main uppercase tracking-widest flex items-center gap-1">
                                <Shield size={11} className="text-brand" /> Firma Electrónica (.p12)
                            </span>
                            <span className="text-[8px] text-text-dim uppercase tracking-wider">Opcional para Actas/Rúbricas</span>
                        </div>

                        {Object.values(systemAttachments).some(v => v) ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Archivo de Firma (.p12)</label>
                                    <input
                                        type="file"
                                        accept=".p12,.pfx"
                                        onChange={e => setSignatureFile(e.target.files?.[0] || null)}
                                        className="w-full text-xs text-text-dim file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[8px] file:font-black file:uppercase file:tracking-widest file:bg-bg-deep file:text-text-main hover:file:opacity-85 file:cursor-pointer border border-border-thin rounded p-1.5 bg-bg-deep/20"
                                    />
                                    {signatureFile && (
                                        <span className="text-[8px] text-brand block mt-0.5 truncate">
                                            ✓ {signatureFile.name} ({(signatureFile.size / 1024).toFixed(1)} KB)
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-bold text-text-dim uppercase tracking-wider">Contraseña del Certificado</label>
                                    <input
                                        type="password"
                                        className="input-vercel !py-1.5 text-xs font-mono"
                                        placeholder="Clave .p12"
                                        value={signaturePassword}
                                        onChange={e => setSignaturePassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <p className="text-[8px] text-text-dim italic">
                                Active la generación de un documento en PDF del sistema para adjuntar firma electrónica si lo requiere.
                            </p>
                        )}
                    </div>
                </div>

                {/* Adjuntos locales */}
                <div className="space-y-2">
                    <label className="text-[11px] font-bold text-text-dim uppercase tracking-wider flex items-center gap-1.5">
                        <Paperclip size={13} /> Archivos Adjuntos Locales
                    </label>
                    <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="w-full text-xs text-text-dim file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-text-main hover:file:bg-surface-hover file:cursor-pointer border border-border-thin rounded-xl p-2 bg-surface/30"
                    />

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-thin bg-surface text-xs font-mono">
                                    <span className="truncate max-w-[150px]">{att.name}</span>
                                    <span className="text-[9px] text-text-dim">({(att.size / 1024).toFixed(1)} KB)</span>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(i)}
                                        className="text-text-dim hover:text-error transition-colors cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notification Result Banner */}
                {sendResult && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${sendResult.success ? 'bg-success-subtle border-success/30 text-success' : 'bg-error-subtle border-error/30 text-error'}`}>
                        {sendResult.success ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertTriangle size={18} className="shrink-0 mt-0.5" />}
                        <div className="text-xs font-medium leading-relaxed">{sendResult.message}</div>
                    </div>
                )}

                {/* Dispatch Button */}
                <button
                    type="submit"
                    disabled={sending}
                    className="w-full btn-vercel-primary py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                    {sending ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Procesando Envíos...</span>
                        </>
                    ) : (
                        <>
                            <Send size={14} />
                            <span>Despachar Correos</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default EmailComposerSection;
