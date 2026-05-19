import React, { useState } from 'react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { 
    BookOpen, 
    FileText, 
    CheckSquare, 
    Target, 
    Globe, 
    Book, 
    Settings, 
    ClipboardCheck, 
    Library, 
    Info 
} from 'lucide-react';

interface TechnicalSectionProps {
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any) => void;
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({
    cowork,
    onUpdate
}) => {
    const [activeSubTab, setActiveSubTab] = useState('antecedentes');

    const subTabs = [
        { id: 'antecedentes', label: '1. Antecedentes', icon: BookOpen },
        { id: 'descripcion', label: '2. Descripción', icon: FileText },
        { id: 'justificacion', label: '3. Justificación', icon: CheckSquare },
        { id: 'objetivos', label: '4. Objetivos', icon: Target },
        { id: 'ods', label: '5. ODS (Alineación)', icon: Globe },
        { id: 'marco_teorico', label: '6. Marco Teórico', icon: Book },
        { id: 'metodologia', label: '7. Metodología', icon: Settings },
        { id: 'evaluacion', label: '8. Evaluación', icon: ClipboardCheck },
        { id: 'bibliografia', label: '9. Bibliografía', icon: Library }
    ];

    return (
        <div className="flex flex-col md:flex-row gap-8 animate-fade-in pb-10 min-h-[600px]">
            {/* Navegación lateral interna */}
            <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-border-thin pr-0 md:pr-4">
                {subTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap md:whitespace-normal text-left ${
                                isActive 
                                    ? 'bg-text-main text-bg-deep shadow-md' 
                                    : 'text-text-dim hover:text-text-main hover:bg-surface-hover'
                            }`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Contenedor del editor */}
            <div className="flex-1 min-w-0">
                {/* 1. Antecedentes Específicos */}
                {activeSubTab === 'antecedentes' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <BookOpen size={20} /> 3.1 Antecedentes Específicos de la Problemática
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Identificar y analizar estudios previos, datos relevantes y casos similares que evidencien la existencia del problema. Incluir información contextual citando fuentes en formato <strong>APA 7ª edición</strong>. <br />
                                    <span className="text-text-main font-black">REQUISITO: DETALLAR EN MÍNIMO DOS PÁRRAFOS DE 8 A 12 LÍNEAS.</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="Antecedentes" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('Antecedentes', html)}
                                placeholder="Escriba los antecedentes del proyecto..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}

                {/* 2. Descripción del Proyecto */}
                {activeSubTab === 'descripcion' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <FileText size={20} /> 3.2 Descripción del Proyecto
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Definir el propósito del proyecto, detallando qué se pretende lograr, cuál es su impacto esperado y delimitar su alcance (límites, áreas involucradas y aspectos a abordar). <br />
                                    <span className="text-text-main font-black">REQUISITO: DETALLAR EN MÍNIMO UN PÁRRAFO DE 8 A 12 LÍNEAS.</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="DescripcionProyecto" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('DescripcionProyecto', html)}
                                placeholder="Describa el propósito y el alcance de la investigación..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}

                {/* 3. Justificación */}
                {activeSubTab === 'justificacion' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <CheckSquare size={20} /> 3.3 Justificación del Proyecto
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Especificar de manera fluida y coherente la importancia científica, tecnológica, educativa y social. Indicar su relación con otros proyectos del Instituto, impacto en la docencia, vinculación con carreras e infraestructura técnica disponible. <br />
                                    <span className="text-text-main font-black">REQUISITO: DETALLAR EN DOS PÁRRAFOS DE 5 A 9 LÍNEAS MÍNIMO (CITAR APA 7ª EDICIÓN).</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="Justificacion" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('Justificacion', html)}
                                placeholder="Escriba la justificación del proyecto aquí..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}

                {/* 4. Objetivos */}
                {activeSubTab === 'objetivos' && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Objetivo General */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                    <Target size={20} /> Objetivo General
                                </h3>
                                <div className="flex gap-2.5 p-3 rounded-xl bg-bg-deep/50 border border-border-thin text-[11px] text-text-dim">
                                    <Info size={14} className="text-text-main shrink-0 mt-0.5" />
                                    <span className="font-bold">FÓRMULA: VERBO EN INFINITIVO + ¿QUÉ? + ¿CÓMO? + ¿PARA QUÉ?</span>
                                </div>
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                                <CoWorkEditor 
                                    field="ObjetivoGeneral" 
                                    cowork={cowork} 
                                    onChange={(html) => onUpdate('ObjetivoGeneral', html)}
                                    placeholder="El objetivo general del proyecto de investigación consiste en..."
                                    className="min-h-[180px] border-none" 
                                />
                            </div>
                        </div>

                        {/* Objetivos Específicos */}
                        <div className="space-y-4">
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
                                    onChange={(html) => onUpdate('ObjetivosEspecificos', html)}
                                    placeholder="1. Desarrollar un modelo...&#10;2. Implementar técnicas de...&#10;3. Evaluar el impacto de..."
                                    className="min-h-[220px] border-none" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. Objetivos de Desarrollo Sostenible (ODS) */}
                {activeSubTab === 'ods' && (
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
                )}

                {/* 6. Marco Teórico */}
                {activeSubTab === 'marco_teorico' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <Book size={20} /> 3.5 Marco Teórico
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Describir los conceptos clave, antecedentes y fundamentos teóricos que respaldan el proyecto, incluyendo referencias a estudios previos, normativas o metodologías. <br />
                                    <span className="text-text-main font-black">REQUISITO: EL TEXTO MÁXIMO DEBE ABARCAR DOS PÁGINAS (CITAR BAJO NORMAS APA 7ª EDICIÓN).</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="MarcoTeorico" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('MarcoTeorico', html)}
                                placeholder="Escriba el fundamento teórico del proyecto..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}

                {/* 7. Metodología */}
                {activeSubTab === 'metodologia' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <Settings size={20} /> 3.6 Metodología de la Investigación
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Describir el enfoque metodológico, las etapas técnicas del proyecto, detalle exhaustivo de los procedimientos científicos, recursos y el tiempo estimado para alcanzar los objetivos. <br />
                                    <span className="text-text-main font-black">REQUISITO: DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS PARA PROCEDIMIENTOS Y MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS PARA RECURSOS Y TIEMPOS.</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="Metodologia" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('Metodologia', html)}
                                placeholder="Describa la metodología científica, fases del estudio e instrumentación técnica..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}

                {/* 8. Evaluación */}
                {activeSubTab === 'evaluacion' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <ClipboardCheck size={20} /> 3.7 Evaluación de Resultados
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Describir los criterios e indicadores cualitativos/cuantitativos que se utilizarán para medir el cumplimiento de los objetivos del proyecto, así como los métodos e instrumentos de evaluación previstos. <br />
                                    <span className="text-text-main font-black">REQUISITO: DETALLAR EN MÍNIMO 2 PÁRRAFOS DE 5 LÍNEAS. PUEDE EXTENDERSE SEGÚN SU CRITERIO.</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="Evaluacion" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('Evaluacion', html)}
                                placeholder="Escriba los criterios, métricas e instrumentos de evaluación..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}

                {/* 9. Bibliografía */}
                {activeSubTab === 'bibliografia' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="space-y-1">
                            <h3 className="text-base font-black text-text-main uppercase flex items-center gap-2">
                                <Library size={20} /> 8. Bibliografía
                            </h3>
                            <div className="flex gap-2.5 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
                                <Info size={16} className="text-text-main shrink-0 mt-0.5" />
                                <p className="leading-relaxed font-medium">
                                    Ingrese las fuentes bibliográficas de sustento científico del proyecto de investigación. <br />
                                    <span className="text-text-main font-black">REQUISITO: EL PROYECTO DEBE TENER MÍNIMO 10 Y MÁXIMO 15 FUENTES BIBLIOGRÁFICAS EN FORMATO APA 7ª EDICIÓN.</span>
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl overflow-hidden shadow-sm border border-border-thin bg-bg-deep">
                            <CoWorkEditor 
                                field="Bibliografia" 
                                cowork={cowork} 
                                onChange={(html) => onUpdate('Bibliografia', html)}
                                placeholder="1. Apellidos, A. A. (Año). Título del artículo. Título de la publicación, volumen(número), páginas.&#10;2. ..."
                                className="min-h-[400px] border-none" 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
