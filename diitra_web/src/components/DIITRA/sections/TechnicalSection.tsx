import React, { useState } from 'react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../../DIITRA/SectionBlockGuard';
import {
    BookOpen,
    FileText,
    CheckSquare,
    Target,
    Globe,
    Book,
    Settings,
    ClipboardCheck,
    Info,
    Lock,
    ArrowDown
} from 'lucide-react';

interface TechnicalSectionProps {
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
    formData?: any;
    config?: any;
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({
    cowork,
    onUpdate,
    formData,
    config
}) => {
    const subTabs = [
        { id: 'antecedentes', label: '3.1 Antecedentes', icon: BookOpen },
        { id: 'descripcion', label: '3.2 Descripción', icon: FileText },
        { id: 'justificacion', label: '3.3 Justificación', icon: CheckSquare },
        { id: 'objetivos', label: '3.4 Objetivos', icon: Target },
        { id: 'ods', label: '3.5 ODS (Alineación)', icon: Globe },
        { id: 'marco_teorico', label: '3.6 Marco Teórico', icon: Book },
        { id: 'metodologia', label: '3.7 Metodología', icon: Settings },
        { id: 'evaluacion', label: '3.8 Evaluación', icon: ClipboardCheck }
    ];

    const activeSubTabs = React.useMemo(() => {
        if (config?.technicalSections && Array.isArray(config.technicalSections) && config.technicalSections.length > 0) {
            return config.technicalSections
                .filter((sec: any) => sec.enabled !== false)
                .map((sec: any) => {
                    let Icon = BookOpen;
                    if (sec.fieldKey === 'DescripcionProyecto' || sec.id === 'sec_descripcion') Icon = FileText;
                    if (sec.fieldKey === 'Justificacion' || sec.id === 'sec_justificacion') Icon = CheckSquare;
                    if (sec.fieldKey === 'ObjetivoGeneral' || sec.fieldKey === 'ObjetivosEspecificos' || sec.id === 'sec_objetivo_general') Icon = Target;
                    if (sec.fieldKey === 'ObjetivosDesarrolloSostenible' || sec.id === 'sec_ods') Icon = Globe;
                    if (sec.fieldKey === 'MarcoTeorico' || sec.id === 'sec_marco_teorico') Icon = Book;
                    if (sec.fieldKey === 'Metodologia' || sec.id === 'sec_metodologia') Icon = Settings;
                    if (sec.fieldKey === 'Evaluacion' || sec.id === 'sec_evaluacion') Icon = ClipboardCheck;

                    const labelText = sec.numberPrefix ? `${sec.numberPrefix} ${sec.title}` : sec.title;
                    return {
                        id: sec.fieldKey || sec.id,
                        label: labelText,
                        rawTitle: sec.title,
                        numberPrefix: sec.numberPrefix,
                        fieldKey: sec.fieldKey,
                        placeholder: sec.placeholder || `Escriba el apartado de ${sec.title}...`,
                        icon: Icon
                    };
                });
        }

        const legacySubTabs = [
            { id: 'antecedentes', fieldKey: 'Antecedentes', label: '3.1 Antecedentes', icon: BookOpen, placeholder: 'Escriba los antecedentes del proyecto...' },
            { id: 'descripcion', fieldKey: 'DescripcionProyecto', label: '3.2 Descripción', icon: FileText, placeholder: 'Definir el propósito del proyecto...' },
            { id: 'justificacion', fieldKey: 'Justificacion', label: '3.3 Justificación', icon: CheckSquare, placeholder: 'Escriba la justificación del proyecto...' },
            { id: 'objetivos', fieldKey: 'ObjetivoGeneral', label: '3.4 Objetivos', icon: Target, placeholder: 'Objetivos del proyecto...' },
            { id: 'ods', fieldKey: 'ObjetivosDesarrolloSostenible', label: '3.5 ODS (Alineación)', icon: Globe, placeholder: 'Ejes y ODS Vinculados...' },
            { id: 'marco_teorico', fieldKey: 'MarcoTeorico', label: '3.6 Marco Teórico', icon: Book, placeholder: 'Escriba el fundamento teórico...' },
            { id: 'metodologia', fieldKey: 'Metodologia', label: '3.7 Metodología', icon: Settings, placeholder: 'Describa la metodología...' },
            { id: 'evaluacion', fieldKey: 'Evaluacion', label: '3.8 Evaluación', icon: ClipboardCheck, placeholder: 'Escriba los criterios de evaluación...' }
        ];

        return legacySubTabs.filter(tab => {
            if (tab.id === 'antecedentes') return config?.showAntecedentes !== false;
            if (tab.id === 'descripcion') return config?.showDescripcionProyecto !== false;
            if (tab.id === 'justificacion') return config?.showJustificacion !== false;
            if (tab.id === 'objetivos') return config?.showObjetivoGeneral !== false || config?.showObjetivosEspecificos !== false;
            if (tab.id === 'ods') return config?.showOds !== false;
            if (tab.id === 'marco_teorico') return config?.showMarcoTeorico !== false;
            if (tab.id === 'metodologia') return config?.showMetodologia !== false;
            if (tab.id === 'evaluacion') return config?.showEvaluacion !== false;
            return true;
        });
    }, [config]);

    const [activeSubTab, setActiveSubTab] = useState(() => {
        return activeSubTabs[0]?.id || 'antecedentes';
    });

    React.useEffect(() => {
        if (activeSubTabs.length > 0 && !activeSubTabs.some(t => t.id === activeSubTab)) {
            setActiveSubTab(activeSubTabs[0].id);
        }
    }, [activeSubTabs, activeSubTab]);

    const isSubTabBlocked = (subTabId: string) => {
        return formData?.BlockedSections?.[subTabId] === true;
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 animate-fade-in pb-10 min-h-[600px]">
            {/* Navegación lateral interna */}
            <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-border-thin pr-0 md:pr-4">
                {activeSubTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    const isBlocked = isSubTabBlocked(tab.id);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap md:whitespace-normal text-left ${isActive
                                    ? 'bg-text-main text-bg-deep shadow-md'
                                    : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                                }`}
                        >
                            <span className="flex items-center gap-3">
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </span>
                            {isBlocked && (
                                <Lock size={12} className={isActive ? 'text-bg-deep' : 'text-amber-500'} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Contenedor del editor */}
            <div className="flex-1 min-w-0">
                {(() => {
                    const currentTab = activeSubTabs.find(t => t.id === activeSubTab);
                    if (!currentTab) return null;

                    const matchKey = (keys: string[]) => {
                        const idLower = (currentTab.id || '').toLowerCase();
                        const fkLower = (currentTab.fieldKey || '').toLowerCase();
                        return keys.some(k => k.toLowerCase() === idLower || k.toLowerCase() === fkLower);
                    };

                    const fieldName = currentTab.fieldKey || currentTab.id;
                    const reqText = currentTab.requirementText;

                    // 1. Antecedentes Específicos
                    if (matchKey(['antecedentes', 'sec_antecedentes', 'Antecedentes'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <BookOpen size={20} /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Identificar y analizar estudios previos, datos relevantes y casos similares que evidencien la existencia del problema. Incluir información contextual citando fuentes en formato <strong>APA 7ª edición</strong>. <br />
                                                <span className="text-text-main font-black">REQUISITO: {reqText || 'DETALLAR EN MÍNIMO DOS PÁRRAFOS DE 8 A 12 LÍNEAS.'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field={fieldName}
                                            cowork={cowork}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Escriba los antecedentes del proyecto..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 2. Descripción del Proyecto
                    if (matchKey(['descripcion', 'sec_descripcion', 'DescripcionProyecto'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <FileText size={20} /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Definir el propósito del proyecto, detallando qué se pretende lograr, cuál es su impacto esperado y delimitar su alcance (límites, áreas involucradas y aspectos a abordar). <br />
                                                <span className="text-text-main font-black">REQUISITO: {reqText || 'DETALLAR EN MÍNIMO UN PÁRRAFO DE 8 A 12 LÍNEAS.'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field={fieldName}
                                            cowork={cowork}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Describa el propósito y el alcance de la investigación..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 3. Justificación
                    if (matchKey(['justificacion', 'sec_justificacion', 'Justificacion'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <CheckSquare size={20} /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Especificar de manera fluida y coherente la importancia científica, tecnológica, educativa y social. Indicar su relación con otros proyectos del Instituto, impacto en la docencia, vinculación con carreras e infraestructura técnica disponible. <br />
                                                <span className="text-text-main font-black">REQUISITO: {reqText || 'DETALLAR EN DOS PÁRRAFOS DE 5 A 9 LÍNEAS MÍNIMO (CITAR BAJO NORMAS APA 7ª EDICIÓN).'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field={fieldName}
                                            cowork={cowork}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Escriba la justificación del proyecto aquí..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 4. Objetivos
                    if (matchKey(['objetivos', 'sec_objetivo_general', 'ObjetivoGeneral', 'ObjetivosEspecificos'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-8 animate-fade-in">
                                    {/* Objetivo General */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                                <Target size={20} /> Objetivo General
                                            </h3>
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="flex gap-2.5 p-3 rounded-xl bg-bg-deep/50 border border-border-thin text-[11px] text-text-dim w-full sm:w-1/2">
                                                    <Info size={14} className="text-text-main shrink-0 mt-0.5" />
                                                    <span className="font-bold">FÓRMULA: VERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ?</span>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById('objetivos-especificos-section');
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-text-dim hover:text-text-main transition-colors select-none shrink-0 pr-2"
                                                >
                                                    <span>Los objetivos específicos se encuentran abajo</span>
                                                    <ArrowDown size={12} className="animate-bounce" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field="ObjetivoGeneral"
                                                cowork={cowork}
                                                onChange={(html, meta) => onUpdate('ObjetivoGeneral', html, meta)}
                                                placeholder="El objetivo general del proyecto de investigación consiste en..."
                                                className="min-h-[180px] border-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Objetivos Específicos */}
                                    <div id="objetivos-especificos-section" className="space-y-4 scroll-mt-6">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                                <Target size={20} /> Objetivos Específicos
                                            </h3>
                                            <div className="flex gap-2.5 p-3 rounded-xl bg-bg-deep/50 border border-border-thin text-[11px] text-text-dim">
                                                <Info size={14} className="text-text-main shrink-0 mt-0.5" />
                                                <span className="font-bold">FÓRMULA: INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO.</span>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field="ObjetivosEspecificos"
                                                cowork={cowork}
                                                onChange={(html, meta) => onUpdate('ObjetivosEspecificos', html, meta)}
                                                placeholder="1. Desarrollar un modelo...&#10;2. Implementar técnicas de...&#10;3. Evaluar el impacto de..."
                                                className="min-h-[220px] border-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 5. Objetivos de Desarrollo Sostenible (ODS)
                    if (matchKey(['ods', 'sec_ods', 'ObjetivosDesarrolloSostenible'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Globe size={20} /> Alineación con Objetivos de Desarrollo Sostenible (ODS)
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Los objetivos de desarrollo sostenible de la ONU son 17. Especifique bajo qué objetivos y metas se alinea su proyecto de investigación (Ej: ODS 4 - Educación de Calidad, ODS 9 - Industria, Innovación e Infraestructura). Visite <a href="https://www.un.org/sustainabledevelopment/es/objetivos-de-desarrollo-sostenible/" target="_blank" rel="noopener noreferrer" className="text-text-main underline font-bold">Naciones Unidas ODS</a>.
                                            </p>
                                        </div>
                                    </div>
                                    <CoWorkField
                                        name="ObjetivosDesarrolloSostenible"
                                        cowork={cowork}
                                        label="Ejes y ODS Vinculados (Ej: ODS 4, ODS 9)"
                                        onValueChange={(v) => onUpdate('ObjetivosDesarrolloSostenible', v)}
                                        className="w-full bg-bg-deep border border-border-thin rounded-xl px-5 py-4 text-sm font-bold text-text-main"
                                    />
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 6. Marco Teórico
                    if (matchKey(['marco_teorico', 'sec_marco_teorico', 'MarcoTeorico'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Book size={20} /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Describir los conceptos clave, antecedentes y fundamentos teóricos que respaldan el proyecto, incluyendo referencias a estudios previos, normativas o metodologías. <br />
                                                <span className="text-text-main font-black">REQUISITO: {reqText || 'EL TEXTO MÁXIMO DEBE ABARCAR DOS PÁGINAS (CITAR BAJO NORMAS APA 7ª EDICIÓN).'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field={fieldName}
                                            cowork={cowork}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Escriba el fundamento teórico del proyecto..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 7. Metodología
                    if (matchKey(['metodologia', 'sec_metodologia', 'Metodologia'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Settings size={20} /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Describir el enfoque metodológico, las etapas técnicas del proyecto, detalle exhaustivo de los procedimientos científicos, recursos y el tiempo estimado para alcanzar los objetivos. <br />
                                                <span className="text-text-main font-black">REQUISITO: {reqText || 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS PARA PROCEDIMIENTOS Y MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS PARA RECURSOS Y TIEMPOS.'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field={fieldName}
                                            cowork={cowork}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Describa la metodología científica, fases del estudio e instrumentación técnica..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 8. Evaluación
                    if (matchKey(['evaluacion', 'sec_evaluacion', 'Evaluacion'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <ClipboardCheck size={20} /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Describir los criterios e indicadores cualitativos/cuantitativos que se utilizarán para medir el cumplimiento de los objetivos del proyecto, así como los métodos e instrumentos de evaluación previstos. <br />
                                                <span className="text-text-main font-black">REQUISITO: {reqText || 'DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS. PUEDE EXTENDERSE SEGÚN SU CRITERIO.'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field={fieldName}
                                            cowork={cowork}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Escriba los criterios, métricas e instrumentos de evaluación..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 9. Renderizado Dinámico Genérico para cualquier otra Sub-sección (Personalizada)
                    const Icon = currentTab.icon || BookOpen;

                    return (
                        <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                            <div className="space-y-6 animate-fade-in">
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                        <Icon size={20} /> {currentTab.label}
                                    </h3>
                                    <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                        <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                        <p className="leading-relaxed font-medium">
                                            {currentTab.placeholder}
                                            {reqText && (
                                                <>
                                                    <br />
                                                    <span className="text-text-main font-black">REQUISITO: {reqText}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                    <CoWorkEditor
                                        field={fieldName}
                                        cowork={cowork}
                                        onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                        placeholder={currentTab.placeholder || `Redactar ${currentTab.label}...`}
                                        className="min-h-[400px] border-none"
                                    />
                                </div>
                            </div>
                        </SectionBlockGuard>
                    );
                })()}
            </div>
        </div>
    );
};
