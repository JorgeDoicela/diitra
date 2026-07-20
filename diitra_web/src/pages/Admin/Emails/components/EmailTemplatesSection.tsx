import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import type { EmailTemplate } from '../emailEngineTypes';

export interface EmailTemplatesSectionProps {
    templates: EmailTemplate[];
    openCreateTemplateModal: () => void;
    openEditTemplateModal: (t: EmailTemplate) => void;
    handleDeleteTemplate: (id: number) => Promise<void>;
}

export const EmailTemplatesSection: React.FC<EmailTemplatesSectionProps> = ({
    templates,
    openCreateTemplateModal,
    openEditTemplateModal,
    handleDeleteTemplate
}) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-text-main uppercase tracking-widest">Plantillas del Sistema</h3>
                <button
                    onClick={openCreateTemplateModal}
                    className="btn-vercel-primary text-xs !py-2 flex items-center gap-2 cursor-pointer"
                >
                    <Plus size={14} /> Nueva Plantilla
                </button>
            </div>

            <div className="bento-card static overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-surface/50 border-b border-border-thin">
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/4">Nombre / Código</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/3">Descripción</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-1/4">Asunto</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase w-24">Estado</th>
                                <th className="p-4 font-bold tracking-widest text-[10px] font-mono text-text-dim uppercase text-right w-24">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-thin">
                            {templates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-text-dim">
                                        No se encontraron plantillas. Registre una para comenzar.
                                    </td>
                                </tr>
                            ) : (
                                templates.map(t => (
                                    <tr key={t.idEmailTemplate} className="hover:bg-surface/20 transition-all">
                                        <td className="p-4">
                                            <div className="font-bold text-text-main text-xs">{t.nombre}</div>
                                            <div className="text-[10px] font-mono text-brand mt-0.5">{t.codigo}</div>
                                        </td>
                                        <td className="p-4 text-xs text-text-dim leading-relaxed">
                                            {t.descripcion || '—'}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-text-main truncate max-w-xs" title={t.asunto}>
                                            {t.asunto}
                                        </td>
                                        <td className="p-4">
                                            <span className={`status-tag ${t.activo ? 'badge-vercel-success' : 'badge-vercel-neutral'}`}>
                                                {t.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => openEditTemplateModal(t)}
                                                    className="p-1.5 rounded-lg border border-border-thin text-text-dim hover:text-text-main hover:bg-surface-hover/50 transition-all cursor-pointer"
                                                    title="Editar Plantilla"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTemplate(t.idEmailTemplate)}
                                                    className="p-1.5 rounded-lg border border-border-thin text-text-dim hover:text-error hover:bg-error-subtle transition-all cursor-pointer"
                                                    title="Eliminar Plantilla"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplatesSection;
