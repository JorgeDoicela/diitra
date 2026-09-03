import React, { useState, useEffect } from 'react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../../DIITRA/SectionBlockGuard';
import api from '../../../api/axios_config';
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
    Layers,
    X,
    ChevronDown
} from 'lucide-react';

interface OdsItem {
    idOds: number;
    numeroOds: number;
    titulo: string;
    idEje: number;
    eje: string;
}

interface TechnicalSectionProps {
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
    formData?: any;
    config?: any;
}

interface TechnicalSubTab {
    id: string;
    label: string;
    rawTitle?: string;
    numberPrefix?: string;
    fieldKey?: string;
    placeholder?: string;
    requirementText?: string;
    hasContent?: boolean;
    isGroupHeader?: boolean;
    parentId?: string;
    icon: React.ComponentType<any>;
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({
    cowork,
    onUpdate,
    formData,
    config
}) => {
    const [odsList, setOdsList] = useState<OdsItem[]>([]);
    const [loadingOds, setLoadingOds] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setLoadingOds(true);
        api.get('/catalogs/ods')
            .then(res => {
                if (isMounted && Array.isArray(res.data)) {
                    setOdsList(res.data);
                }
            })
            .catch(err => console.error("Error al cargar ODS:", err))
            .finally(() => {
                if (isMounted) setLoadingOds(false);
            });
        return () => { isMounted = false; };
    }, []);
    const activeSubTabs = React.useMemo<TechnicalSubTab[]>(() => {
        const rawSections = config?.writingSections || config?.technicalSections;
        if (rawSections && Array.isArray(rawSections) && rawSections.length > 0) {
            return rawSections
                .filter((sec: any) => sec.enabled !== false)
                .map((sec: any): TechnicalSubTab => {
                    let Icon = BookOpen;
                    if (sec.fieldKey === 'DescripcionProyecto' || sec.id === 'sec_descripcion') Icon = FileText;
                    if (sec.fieldKey === 'Justificacion' || sec.id === 'sec_justificacion') Icon = CheckSquare;
                    if (sec.fieldKey === 'ObjetivoGeneral' || sec.fieldKey === 'ObjetivosEspecificos' || sec.id === 'sec_objetivo_general') Icon = Target;
                    if (sec.fieldKey === 'ObjetivosDesarrolloSostenible' || sec.id === 'sec_ods') Icon = Globe;
                    if (sec.fieldKey === 'MarcoTeorico' || sec.id === 'sec_marco_teorico') Icon = Book;
                    if (sec.fieldKey === 'Metodologia' || sec.id === 'sec_metodologia') Icon = Settings;
                    if (sec.fieldKey === 'Evaluacion' || sec.id === 'sec_evaluacion') Icon = ClipboardCheck;

                    const labelText = sec.numberPrefix ? `${sec.numberPrefix} ${sec.title}` : sec.title;
                    const isGroupHeader = sec.isGroupHeader || sec.hasContent === false || sec.id === 'sec_banner_objetivos' || sec.fieldKey === 'BannerObjetivos';
                    const parentId = sec.parentId || (sec.fieldKey === 'ObjetivoGeneral' || sec.fieldKey === 'ObjetivosEspecificos' || sec.id === 'sec_objetivo_general' || sec.id === 'sec_objetivos_especificos' ? 'BannerObjetivos' : undefined);
                    return {
                        id: sec.fieldKey || sec.id,
                        label: labelText,
                        rawTitle: sec.title,
                        numberPrefix: sec.numberPrefix,
                        fieldKey: sec.fieldKey,
                        placeholder: sec.placeholder || `Escriba el apartado de ${sec.title}...`,
                        requirementText: sec.requirementText,
                        hasContent: sec.hasContent !== false && !isGroupHeader,
                        isGroupHeader,
                        parentId,
                        icon: Icon
                    };
                });
        }

        const legacySubTabs: TechnicalSubTab[] = [
            { id: 'antecedentes', fieldKey: 'Antecedentes', label: '3.1 Antecedentes', icon: BookOpen, placeholder: 'Escriba los antecedentes del proyecto...' },
            { id: 'descripcion', fieldKey: 'DescripcionProyecto', label: '3.2 Descripción', icon: FileText, placeholder: 'Definir el propósito del proyecto...' },
            { id: 'justificacion', fieldKey: 'Justificacion', label: '3.3 Justificación', icon: CheckSquare, placeholder: 'Escriba la justificación del proyecto...' },
            { id: 'BannerObjetivos', fieldKey: 'BannerObjetivos', label: '3.4 Objetivos', icon: Target, placeholder: '', isGroupHeader: true, hasContent: false },
            { id: 'ObjetivoGeneral', fieldKey: 'ObjetivoGeneral', label: 'General', icon: Target, placeholder: 'Formular el objetivo general...', parentId: 'BannerObjetivos', hasContent: true },
            { id: 'ObjetivosEspecificos', fieldKey: 'ObjetivosEspecificos', label: 'Específicos', icon: Target, placeholder: 'Escriba los objetivos específicos...', parentId: 'BannerObjetivos', hasContent: true },
            { id: 'ods', fieldKey: 'ObjetivosDesarrolloSostenible', label: '3.5 ODS (Alineación)', icon: Globe, placeholder: 'Ejes y ODS Vinculados...' },
            { id: 'marco_teorico', fieldKey: 'MarcoTeorico', label: '3.6 Marco Teórico', icon: Book, placeholder: 'Escriba el fundamento teórico...' },
            { id: 'metodologia', fieldKey: 'Metodologia', label: '3.7 Metodología', icon: Settings, placeholder: 'Describa la metodología...' },
            { id: 'evaluacion', fieldKey: 'Evaluacion', label: '3.8 Evaluación', icon: ClipboardCheck, placeholder: 'Escriba los criterios de evaluación...' }
        ];

        return legacySubTabs.filter(tab => {
            if (tab.id === 'antecedentes') return config?.showAntecedentes !== false;
            if (tab.id === 'descripcion') return config?.showDescripcionProyecto !== false;
            if (tab.id === 'justificacion') return config?.showJustificacion !== false;
            if (tab.id === 'BannerObjetivos' || tab.id === 'ObjetivoGeneral' || tab.id === 'ObjetivosEspecificos') return config?.showObjetivoGeneral !== false || config?.showObjetivosEspecificos !== false;
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
            {/* Navegación lateral interna jerárquica */}
            <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-border-thin pr-0 md:pr-4">
                {activeSubTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    const isBlocked = isSubTabBlocked(tab.id);
                    const isChild = Boolean(tab.parentId);

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] uppercase tracking-wider transition-all whitespace-normal text-left w-full min-w-0 ${
                                isChild ? 'md:ml-4 pl-4 border-l-2 border-border-thin/40 font-bold' : 'font-black'
                            } ${
                                isActive
                                    ? 'bg-text-main text-bg-deep shadow-md font-black'
                                    : tab.isGroupHeader
                                        ? 'text-text-main bg-bg-deep/40 hover:bg-surface-hover font-black border border-border-thin/30 mt-1'
                                        : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                            }`}
                        >
                            <span className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                                {isChild ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
                                ) : (
                                    <Icon size={16} className="shrink-0" />
                                )}
                                <span className="break-words line-clamp-2 leading-tight block flex-1">{tab.label}</span>
                            </span>
                            {isBlocked && (
                                <Lock size={12} className={`shrink-0 ml-1 ${isActive ? 'text-bg-deep' : 'text-amber-500'}`} />
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
                    const toolbarMode = (currentTab as any)?.toolbarMode || 'apa_full';

                    // 0. Renderizado para Encabezado de Categoría / Grupo Unificado (isGroupHeader o hasContent: false)
                    // Manejo especial de Banner/Grupo de Objetivos (3.4)
                    if (currentTab.isGroupHeader || currentTab.hasContent === false || matchKey(['BannerObjetivos', 'sec_banner_objetivos'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-8 animate-fade-in">
                                    {/* Encabezado principal sobrio oficial */}
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Target size={20} className="text-text-main" /> {currentTab.label}
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Formular de manera clara y articulada el <strong>Objetivo General</strong> y los <strong>Objetivos Específicos</strong> que orientarán el desarrollo y los resultados del proyecto de investigación.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bloque 1: Objetivo General */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-text-main uppercase flex items-center gap-2">
                                                <Target size={18} className="text-text-main" /> 3.4.1 Objetivo General
                                            </h4>
                                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                                <p className="leading-relaxed font-medium">
                                                    Definir el propósito principal de la investigación respondiendo a: ¿Qué se investigará? + ¿Cómo se ejecutará? + ¿Para qué servirá? <br />
                                                    <span className="text-text-main font-black">FÓRMULA: VERBO EN INFINITIVO + OBJETO DE ESTUDIO + MEDIO O MÉTODO + FINALIDAD</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field="ObjetivoGeneral"
                                                cowork={cowork}
                                                toolbarMode="standard"
                                                onChange={(html, meta) => onUpdate('ObjetivoGeneral', html, meta)}
                                                placeholder="El objetivo general del proyecto de investigación consiste en..."
                                                className="min-h-[260px] border-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Bloque 2: Objetivos Específicos */}
                                    <div className="space-y-4 pt-4 border-t border-border-thin/40">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-text-main uppercase flex items-center gap-2">
                                                <Target size={18} className="text-text-main" /> 3.4.2 Objetivos Específicos
                                            </h4>
                                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                                <p className="leading-relaxed font-medium">
                                                    Detallar secuencialmente las metas técnicas y metodológicas para cumplir el objetivo general. <br />
                                                    <span className="text-text-main font-black">FÓRMULA: INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field="ObjetivosEspecificos"
                                                cowork={cowork}
                                                toolbarMode="standard"
                                                onChange={(html, meta) => onUpdate('ObjetivosEspecificos', html, meta)}
                                                placeholder="1. Desarrollar un modelo...&#10;2. Implementar técnicas de...&#10;3. Evaluar el impacto de..."
                                                className="min-h-[300px] border-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

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
                                            toolbarMode={toolbarMode}
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
                                            toolbarMode={toolbarMode}
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
                                            toolbarMode={toolbarMode}
                                            onChange={(html, meta) => onUpdate(fieldName, html, meta)}
                                            placeholder={currentTab.placeholder || "Escriba la justificación del proyecto aquí..."}
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 4a. Objetivo General
                    if (matchKey(['sec_objetivo_general', 'ObjetivoGeneral'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Target size={20} /> Objetivo General
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                FÓRMULA: VERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ?
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field="ObjetivoGeneral"
                                            cowork={cowork}
                                            toolbarMode="standard"
                                            onChange={(html, meta) => onUpdate('ObjetivoGeneral', html, meta)}
                                            placeholder="El objetivo general del proyecto de investigación consiste en..."
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 4b. Objetivos Específicos
                    if (matchKey(['sec_objetivos_especificos', 'ObjetivosEspecificos'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Target size={20} /> Objetivos Específicos
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                FÓRMULA: INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                        <CoWorkEditor
                                            field="ObjetivosEspecificos"
                                            cowork={cowork}
                                            toolbarMode="standard"
                                            onChange={(html, meta) => onUpdate('ObjetivosEspecificos', html, meta)}
                                            placeholder="1. Desarrollar un modelo...&#10;2. Implementar técnicas de...&#10;3. Evaluar el impacto de..."
                                            className="min-h-[400px] border-none"
                                        />
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 4c. Objetivos Combinados (Vista Legacy 3.4 Objetivos)
                    if (matchKey(['objetivos'])) {
                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-8 animate-fade-in">
                                    {/* Objetivo General */}
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                                <Target size={20} className="text-text-main" /> Objetivo General
                                            </h3>
                                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                                <p className="leading-relaxed font-medium">
                                                    Definir el propósito principal de la investigación respondiendo a: ¿Qué se investigará? + ¿Cómo se ejecutará? + ¿Para qué servirá? <br />
                                                    <span className="text-text-main font-black">FÓRMULA: VERBO EN INFINITIVO + OBJETO DE ESTUDIO + MEDIO O MÉTODO + FINALIDAD</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field="ObjetivoGeneral"
                                                cowork={cowork}
                                                toolbarMode="standard"
                                                onChange={(html, meta) => onUpdate('ObjetivoGeneral', html, meta)}
                                                placeholder="El objetivo general del proyecto de investigación consiste en..."
                                                className="min-h-[260px] border-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Objetivos Específicos */}
                                    <div id="objetivos-especificos-section" className="space-y-4 pt-4 border-t border-border-thin/40">
                                        <div className="space-y-1">
                                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                                <Target size={20} className="text-text-main" /> Objetivos Específicos
                                            </h3>
                                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                                <p className="leading-relaxed font-medium">
                                                    Detallar secuencialmente las metas técnicas y metodológicas para cumplir el objetivo general. <br />
                                                    <span className="text-text-main font-black">FÓRMULA: INFINITIVO + ACCIÓN ESPECÍFICA + MEDIO O METODOLOGÍA + PROPÓSITO</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field="ObjetivosEspecificos"
                                                cowork={cowork}
                                                toolbarMode="standard"
                                                onChange={(html, meta) => onUpdate('ObjetivosEspecificos', html, meta)}
                                                placeholder="1. Desarrollar un modelo...&#10;2. Implementar técnicas de...&#10;3. Evaluar el impacto de..."
                                                className="min-h-[300px] border-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </SectionBlockGuard>
                        );
                    }

                    // 5. Objetivos de Desarrollo Sostenible (ODS)
                    if (matchKey(['ods', 'sec_ods', 'ObjetivosDesarrolloSostenible'])) {
                        // Obtener array de ODS seleccionados de forma independiente
                        const rawOds = formData?.OdsSeleccionados;
                        const selectedOdsNums: number[] = Array.isArray(rawOds)
                            ? rawOds.map(Number).filter(n => !isNaN(n))
                            : (typeof rawOds === 'string' && rawOds.trim().length > 0
                                ? rawOds.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n))
                                : []);

                        const handleSelectOds = (numeroOdsStr: string) => {
                            if (!numeroOdsStr) return;
                            const num = parseInt(numeroOdsStr, 10);
                            if (isNaN(num)) return;

                            if (!selectedOdsNums.includes(num)) {
                                const nextList = [...selectedOdsNums, num].sort((a, b) => a - b);
                                onUpdate('OdsSeleccionados', nextList);
                            }
                        };

                        const handleRemoveOds = (odsNum: number) => {
                            const nextList = selectedOdsNums.filter(n => n !== odsNum);
                            onUpdate('OdsSeleccionados', nextList);
                        };

                        // Agrupar por Eje
                        const groupedEjes = odsList.reduce((acc, item) => {
                            const ejeName = item.eje || 'General';
                            if (!acc[ejeName]) acc[ejeName] = [];
                            acc[ejeName].push(item);
                            return acc;
                        }, {} as Record<string, OdsItem[]>);

                        const ejesOrder = ['Personas', 'Planeta', 'Prosperidad', 'Paz', 'Alianzas'];
                        const sortedEjeKeys = Object.keys(groupedEjes).sort((a, b) => {
                            const ia = ejesOrder.indexOf(a);
                            const ib = ejesOrder.indexOf(b);
                            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                        });

                        return (
                            <SectionBlockGuard id={currentTab.id} title={currentTab.label}>
                                <div className="space-y-6 animate-fade-in">
                                    <div className="space-y-1">
                                        <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                            <Globe size={20} className="text-text-main" /> Alineación con Objetivos de Desarrollo Sostenible (ODS)
                                        </h3>
                                        <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                            <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                            <p className="leading-relaxed font-medium">
                                                Seleccione los <strong>ODS</strong> desde el selector desplegable oficial. Puede vincular múltiples ODS y redactar la justificación y metas específicas en el editor inferior.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Selector compacto estilo Vercel Geist con optgroups por Eje */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Layers size={13} className="text-zinc-400" /> Seleccionar Objetivos de Desarrollo Sostenible
                                        </label>
                                        
                                        <div className="relative">
                                            <select
                                                value=""
                                                onChange={(e) => handleSelectOds(e.target.value)}
                                                className="w-full h-10 pl-3.5 pr-9 appearance-none bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[13px] font-medium text-zinc-900 dark:text-zinc-100 shadow-sm focus:outline-none focus:border-zinc-950 dark:focus:border-zinc-300 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-300 transition-colors cursor-pointer"
                                            >
                                                <option value="" disabled>
                                                    {loadingOds ? 'Cargando catálogo oficial...' : '+ Seleccionar y vincular un ODS...'}
                                                </option>
                                                {sortedEjeKeys.map(ejeName => (
                                                    <optgroup key={ejeName} label={`Eje: ${ejeName}`}>
                                                        {groupedEjes[ejeName].map(ods => (
                                                            <option 
                                                                key={ods.idOds} 
                                                                value={ods.numeroOds}
                                                                disabled={selectedOdsNums.includes(ods.numeroOds)}
                                                            >
                                                                {selectedOdsNums.includes(ods.numeroOds) ? '✓ ' : ''}ODS {ods.numeroOds} — {ods.titulo}
                                                            </option>
                                                        ))}
                                                    </optgroup>
                                                ))}
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                                        </div>

                                        {/* Chips / Badges de ODS Seleccionados estilo Vercel Geist */}
                                        {selectedOdsNums.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {selectedOdsNums.map(num => {
                                                    const ods = odsList.find(o => o.numeroOds === num);
                                                    return (
                                                        <span
                                                            key={num}
                                                            className="inline-flex items-center gap-2 h-7 px-2.5 rounded-md bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 text-[12px] font-medium transition-all hover:border-zinc-300"
                                                        >
                                                            <span className="w-4 h-4 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-[10px] font-bold flex items-center justify-center">
                                                                {num}
                                                            </span>
                                                            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{ods ? ods.titulo : `ODS ${num}`}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveOds(num)}
                                                                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors ml-0.5 p-0.5"
                                                                title="Quitar ODS"
                                                            >
                                                                <X size={12} strokeWidth={2.5} />
                                                            </button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Editor Enriquecido para Justificación y Metas Específicas ODS */}
                                    <div className="space-y-3 pt-2">
                                        <div className="space-y-1">
                                            <h4 className="text-[13px] font-bold text-text-main uppercase tracking-tight flex items-center gap-2">
                                                Justificación y Metas de Alineación ODS
                                            </h4>
                                            <p className="text-[11px] text-text-dim leading-snug">
                                                Describa de forma argumentada la articulación del proyecto con los ODS seleccionados, señalando metas directas, beneficiarios o impacto esperado.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                            <CoWorkEditor
                                                field={currentTab.fieldKey || "ObjetivosDesarrolloSostenible"}
                                                cowork={cowork}
                                                toolbarMode="standard"
                                                onChange={(html, meta) => onUpdate(currentTab.fieldKey || 'ObjetivosDesarrolloSostenible', html, meta)}
                                                placeholder="Describa la articulación de la propuesta con los ODS seleccionados, metas específicas e impacto esperado..."
                                                className="min-h-[240px] border-none"
                                            />
                                        </div>
                                    </div>
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
                                            toolbarMode={toolbarMode}
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
                                            toolbarMode={toolbarMode}
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
                                            toolbarMode={toolbarMode}
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
                                        toolbarMode={toolbarMode}
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
