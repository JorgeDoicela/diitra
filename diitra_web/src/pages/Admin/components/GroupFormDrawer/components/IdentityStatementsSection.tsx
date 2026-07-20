import React from 'react';
import { Award } from 'lucide-react';
import type { GroupFormData } from '../types';

interface IdentityStatementsSectionProps {
    formData: GroupFormData;
    setFormData: React.Dispatch<React.SetStateAction<GroupFormData>>;
}

export const IdentityStatementsSection: React.FC<IdentityStatementsSectionProps> = ({
    formData,
    setFormData
}) => {
    return (
        <section className="space-y-6">
            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                <Award size={12} /> Declaración de Identidad
            </h4>
            <div className="space-y-6 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Objetivo General</label>
                    <textarea
                        rows={3}
                        value={formData.objetivo_general}
                        onChange={(e) => setFormData(prev => ({ ...prev, objetivo_general: e.target.value }))}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                        placeholder="Ej: Fomentar el desarrollo e integración de soluciones tecnológicas..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Misión</label>
                        <textarea
                            rows={3}
                            value={formData.mision}
                            onChange={(e) => setFormData(prev => ({ ...prev, mision: e.target.value }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                            placeholder="La misión del grupo de investigación..."
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Visión</label>
                        <textarea
                            rows={3}
                            value={formData.vision}
                            onChange={(e) => setFormData(prev => ({ ...prev, vision: e.target.value }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none focus:border-text-main transition-all resize-none font-medium"
                            placeholder="Consolidarse como un referente académico..."
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};
