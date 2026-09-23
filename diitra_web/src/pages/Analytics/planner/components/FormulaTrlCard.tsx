import React, { useState } from 'react';
import { Search } from 'lucide-react';
import type { ProyectoResumen } from '../../types/analytics.types';
import type { CacesFormula2Result, CacesPlannerSimulationParams } from '../types/cacesPlanner.types';
import { TRL_DEFINITIONS } from '../utils/cacesPlannerEngine';

interface FormulaTrlCardProps {
    f2: CacesFormula2Result;
    projects: ProyectoResumen[];
    params: CacesPlannerSimulationParams;
    onSetProjectTrlOverride: (idProyecto: number, trl: number) => void;
    onToggleProjectPartnerOverride: (idProyecto: number) => void;
    onRemoveProjectOverride: (idProyecto: number) => void;
}

export const FormulaTrlCard: React.FC<FormulaTrlCardProps> = ({
    f2,
    projects,
    params,
    onSetProjectTrlOverride,
    onToggleProjectPartnerOverride,
    onRemoveProjectOverride
}) => {
    const [projectSearch, setProjectSearch] = useState('');
    const [filterOnlyActive, setFilterOnlyActive] = useState(false);

    const statusConfig = {
        CUMPLIDO: {
            badge: 'badge-vercel-success',
            text: 'text-success',
            border: 'border-success/30',
            bg: 'bg-success/5',
            label: 'Cumple Pertinencia'
        },
        'EN PROCESO': {
            badge: 'badge-vercel-warning',
            text: 'text-warning',
            border: 'border-warning/30',
            bg: 'bg-warning/5',
            label: 'Cercano a Meta (7.5% a 14%)'
        },
        ALERTA: {
            badge: 'badge-vercel-error',
            text: 'text-error',
            border: 'border-error/30',
            bg: 'bg-error/5',
            label: 'Crítico (< 7.5% de Proyectos)'
        }
    }[f2.estado];

    const filteredProjects = projects.filter(p => {
        const matchesSearch = !projectSearch || 
            p.titulo.toLowerCase().includes(projectSearch.toLowerCase()) ||
            (p.codigoInstitucional && p.codigoInstitucional.toLowerCase().includes(projectSearch.toLowerCase()));
        
        if (filterOnlyActive) {
            return matchesSearch && (p.estado === 'En Ejecución' || p.estado === 'Aprobado');
        }
        return matchesSearch;
    });

    return (
        <div className="bento-card static p-5 md:p-6 bg-surface border border-border-thin rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
                {/* Encabezado de la Fórmula 2 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-thin/50 pb-3">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">
                                Fórmula Oficial CACES #2
                            </span>
                            <span className="text-text-dim text-xs">•</span>
                            <span className={`text-[11px] font-mono font-bold tracking-wider uppercase ${statusConfig.text}`}>
                                {f2.estado}
                            </span>
                        </div>
                        <h3 className="text-base font-semibold text-text-main">
                            Madurez Tecnológica (TRL) y Transferencia con la Sociedad
                        </h3>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                        <span className="text-[9px] font-medium text-text-dim block uppercase font-mono">Pertinencia Alcanzada</span>
                        <span className={`text-xl font-bold font-mono ${statusConfig.text}`}>
                            {f2.porcentajePertinencia}%
                        </span>
                    </div>
                </div>

                {/* Expresión Matemática Visual */}
                <div className="p-3.5 bg-bg-deep/40 border border-border-thin/60 rounded-xl space-y-2">
                    <span className="text-[9.5px] font-mono uppercase tracking-wider text-text-dim block">
                        Cálculo de Pertinencia e Innovación CACES para ISTT:
                    </span>
                    <div className="flex items-center justify-center p-3 bg-surface/80 rounded-lg border border-border-thin text-center overflow-x-auto">
                        <div className="font-mono text-xs sm:text-sm text-text-main font-semibold flex items-center gap-2">
                            <span>Pertinencia Tecnológica = </span>
                            <div className="inline-flex flex-col items-center">
                                <span className="border-b border-text-main/60 px-2 pb-0.5">
                                    Proyectos con TRL ≥ 5 o Empresa ({f2.proyectosCumplenTrl})
                                </span>
                                <span className="pt-0.5 text-text-dim text-[11px]">
                                    Total Portafolio ({f2.totalProyectos})
                                </span>
                            </div>
                            <span> × 100 = </span>
                            <span className="text-brand font-bold">{f2.porcentajePertinencia}%</span>
                            <span className="text-text-dim text-[11px]">(Meta CACES: ≥ {f2.umbralMetaPct}%)</span>
                        </div>
                    </div>
                </div>

                {/* Resumen de Métricas Clave */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center py-2 border-y border-border-thin/40">
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Total Proyectos</span>
                        <span className="text-base font-bold font-mono text-text-main">{f2.totalProyectos}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Meta CACES (15%)</span>
                        <span className="text-base font-bold font-mono text-brand">{f2.metaProyectosTrlExigida} proys</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Cumplen TRL≥5/Empresa</span>
                        <span className="text-base font-bold font-mono text-text-main">{f2.proyectosCumplenTrl}</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-medium uppercase font-mono text-text-dim block">Brecha CACES</span>
                        <span className={`text-base font-bold font-mono ${f2.brechaFaltante === 0 ? 'text-success' : 'text-error'}`}>
                            {f2.brechaFaltante === 0 ? 'Cubierta' : `Faltan ${f2.brechaFaltante}`}
                        </span>
                    </div>
                </div>

                {/* Notificación de Brecha */}
                <p className={`text-xs leading-relaxed font-normal ${statusConfig.text}`}>
                    {f2.brechaFaltante > 0 
                        ? `Para cumplir el estándar técnico de acreditación se requiere que al menos ${f2.brechaFaltante} proyecto(s) adicional(es) alcancen fase de prototipo (TRL ≥ 5) o firmen convenio con una empresa del sector productivo.`
                        : `El portafolio institucional cumple plenamente con la exigencia del CACES, concentrando un ${f2.porcentajePertinencia}% de desarrollos tecnológicos aplicados y vinculados al entorno real.`}
                </p>

                {/* Mapa Visual de la Escala TRL (1 al 9) */}
                <div className="p-4 bg-surface/80 border border-border-thin rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-main uppercase tracking-wider font-mono">
                            Distribución de Proyectos por Escala TRL
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-border-thin" /> TRL 1-4 (Básica)
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand" /> TRL ≥ 5 (Acreditables CACES)
                        </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                            const count = f2.distribucionTrl[lvl] || 0;
                            const isCacesQualified = lvl >= 5;
                            const def = TRL_DEFINITIONS[lvl];

                            return (
                                <div
                                    key={lvl}
                                    className={`p-2 rounded-lg border text-center transition-all duration-150 flex flex-col justify-between min-h-[70px] ${
                                        isCacesQualified
                                            ? 'bg-brand/5 border-brand/30 hover:border-brand'
                                            : 'bg-bg-deep/40 border-border-thin hover:border-text-dim/30'
                                    }`}
                                    title={`${def.label}: ${def.phase} - ${def.description}`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[10px] font-mono font-bold ${isCacesQualified ? 'text-brand' : 'text-text-dim'}`}>
                                            {def.label}
                                        </span>
                                        {isCacesQualified && (
                                            <span className="text-[7.5px] px-1 py-0.2 rounded bg-brand text-white font-mono">
                                                CACES
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-base font-mono font-bold text-text-main my-1">
                                        {count}
                                    </span>
                                    <span className="text-[8px] text-text-dim truncate leading-tight">
                                        {def.phase}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Simulador Interactivo por Proyecto */}
                <div className="p-4 bg-surface/80 border border-brand/20 rounded-xl space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <span className="text-xs font-semibold text-text-main uppercase tracking-wider font-mono block">
                                Simulador de Proyectos Individuales
                            </span>
                            <p className="text-[11px] text-text-dim">
                                Eleva el nivel TRL o asigna convenios para proyectar el resultado institucional.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
                                <input
                                    type="text"
                                    placeholder="Buscar proyecto..."
                                    value={projectSearch}
                                    onChange={(e) => setProjectSearch(e.target.value)}
                                    className="pl-8 pr-2.5 py-1 text-xs bg-bg-deep border border-border-thin rounded-lg w-40 sm:w-48 focus:border-brand focus:outline-none"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setFilterOnlyActive(!filterOnlyActive)}
                                className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                                    filterOnlyActive
                                        ? 'bg-brand text-white border-brand'
                                        : 'bg-surface border-border-thin text-text-dim hover:text-text-main'
                                }`}
                            >
                                Solo Activos
                            </button>
                        </div>
                    </div>

                    {/* Lista Scrolleable de Proyectos para Simulación */}
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                        {filteredProjects.length === 0 ? (
                            <div className="p-6 text-center text-xs text-text-dim border border-dashed border-border-thin rounded-xl">
                                No se encontraron proyectos coincidentes para simulación.
                            </div>
                        ) : (
                            filteredProjects.map((p) => {
                                const override = params.projectOverrides[p.idProyecto];
                                const currentTrl = override?.simulatedTrl ?? (p.trlActual || 1);
                                const currentPartner = override?.simulatedEntidadAliada ?? Boolean(p.entidadAliada);
                                const isModified = Boolean(override);
                                const isQualified = currentTrl >= 5 || currentPartner;

                                return (
                                    <div
                                        key={p.idProyecto}
                                        className={`p-3 rounded-xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                            isQualified
                                                ? 'bg-brand/5 border-brand/20'
                                                : 'bg-surface border-border-thin'
                                        }`}
                                    >
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono text-text-dim">
                                                    {p.codigoInstitucional || `ID-${p.idProyecto}`}
                                                </span>
                                                <span className={`text-[8.5px] px-1.5 py-0.2 rounded border font-mono ${
                                                    isQualified
                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                        : 'bg-bg-deep text-text-dim border-border-thin'
                                                }`}>
                                                    {isQualified ? 'Acredita CACES' : 'Pendiente TRL'}
                                                </span>
                                                {isModified && (
                                                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-mono">
                                                        Modificado
                                                    </span>
                                                )}
                                            </div>
                                            <h5 className="text-xs font-semibold text-text-main line-clamp-1" title={p.titulo}>
                                                {p.titulo}
                                            </h5>
                                            <div className="flex items-center gap-3 text-[10px] text-text-dim">
                                                <span>Estado: <strong className="text-text-main">{p.estado}</strong></span>
                                                {p.entidadAliada && (
                                                    <span className="text-brand font-medium">
                                                        Alianza: {p.entidadAliada}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Controles de Simulación */}
                                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                            {/* Selector de Nivel TRL */}
                                            <div className="flex items-center gap-1.5 bg-bg-deep/70 border border-border-thin px-2 py-1 rounded-lg">
                                                <span className="text-[10px] font-mono text-text-dim font-medium">TRL:</span>
                                                <select
                                                    aria-label={`Nivel TRL para proyecto ${p.codigoInstitucional || p.idProyecto}`}
                                                    value={currentTrl}
                                                    onChange={(e) => onSetProjectTrlOverride(p.idProyecto, parseInt(e.target.value, 10))}
                                                    className="bg-transparent text-xs font-mono font-bold text-text-main focus:outline-none cursor-pointer"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
                                                        <option key={lvl} value={lvl} className="bg-surface text-text-main">
                                                            TRL {lvl} {lvl >= 5 ? '(CACES)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Toggle de Entidad Aliada */}
                                            <button
                                                type="button"
                                                onClick={() => onToggleProjectPartnerOverride(p.idProyecto)}
                                                className={`text-[10px] px-2.5 py-1 rounded-lg border font-mono cursor-pointer transition-colors ${
                                                    currentPartner
                                                        ? 'badge-vercel-success font-semibold'
                                                        : 'bg-surface border-border-thin text-text-dim hover:text-text-main'
                                                }`}
                                                title="Alternar simulación de convenio con empresa aliada"
                                            >
                                                <span>{currentPartner ? 'Con Convenio' : '+ Empresa'}</span>
                                            </button>

                                            {/* Revertir si fue modificado */}
                                            {isModified && (
                                                <button
                                                    type="button"
                                                    onClick={() => onRemoveProjectOverride(p.idProyecto)}
                                                    className="text-[10px] text-text-dim hover:text-text-main p-1 hover:underline font-mono"
                                                    title="Revertir a valores originales de este proyecto"
                                                >
                                                    Revertir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
