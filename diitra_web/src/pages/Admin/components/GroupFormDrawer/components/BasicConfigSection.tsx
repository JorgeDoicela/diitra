import React from 'react';
import { Award } from 'lucide-react';
import type { Domain, GroupFormData } from '../types';

interface BasicConfigSectionProps {
    formData: GroupFormData;
    setFormData: React.Dispatch<React.SetStateAction<GroupFormData>>;
    dominios: Domain[];
}

export const BasicConfigSection: React.FC<BasicConfigSectionProps> = ({
    formData,
    setFormData,
    dominios
}) => {
    return (
        <section className="space-y-6">
            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                <Award size={12} /> Configuración Básica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Nombre del Grupo</label>
                    <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                        placeholder="Ej: Grupo de Investigación en Sistemas Inteligentes"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Siglas / Acrónimo</label>
                    <input
                        type="text"
                        required
                        value={formData.siglas}
                        onChange={(e) => setFormData(prev => ({ ...prev, siglas: e.target.value }))}
                        className="w-full bg-bg-deep border border-border-thin focus:border-text-main rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all uppercase font-semibold"
                        placeholder="Ej: GISI"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Tipo de Grupo</label>
                    <select
                        value={formData.tipo_grupo}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo_grupo: e.target.value }))}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="Investigación">Grupo de Investigación</option>
                        <option value="Semillero">Semillero de Investigación</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Dominio Académico</label>
                    <select
                        required
                        value={formData.id_dominio}
                        onChange={(e) => setFormData(prev => ({ ...prev, id_dominio: e.target.value }))}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="">Seleccione Dominio...</option>
                        {dominios.map(d => (
                            <option key={d.id_dominio} value={d.id_dominio}>{d.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-dim uppercase tracking-widest block">Etapa del grupo</label>
                    <select
                        value={formData.categoria_consolidacion}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria_consolidacion: e.target.value }))}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-3 text-sm text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="En Formación">En Formación (Grupo Inicial / Reciente)</option>
                        <option value="Consolidado">Consolidado (Trayectoria Probada)</option>
                    </select>
                </div>
            </div>
        </section>
    );
};
