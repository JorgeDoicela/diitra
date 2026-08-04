/**
 * @file DocumentTemplatesPage.tsx
 * @description Vista principal de la consola de administración de plantillas de documentos en DIITRA.
 *
 * @architecture
 * Implementa un diseño de maquetación interactivo en 3 columnas (Catálogo, Lienzo A4 y Propiedades).
 * Utiliza el custom hook `useDocumentTemplatesPage` para la gestión centralizada de estado y API,
 * reduciendo la responsabilidad de este componente a la maquetación y estructura visual.
 *
 * @pattern Custom Hook + Sub-componentes Modularizados
 */

import React from 'react';
import { PageHeader } from '../../../components/Common/PageHeader';
import {
    FileCode2,
    Save,
    Plus,
    ChevronDown,
    Heading1,
    AlignLeft,
    Grid,
    Image,
    Users,
    Award,
    PenLine,
    Columns2,
    LayoutTemplate,
    Minus,
    BarChart2,
    BookOpen,
    Target,
    DollarSign,
    FileText,
    RefreshCw
} from 'lucide-react';
import { DndContext, rectIntersection } from '@dnd-kit/core';
import type { BlockType } from './types';
import { TemplateCatalog } from './components/TemplateCatalog';
import { BlockCanvas } from './components/BlockCanvas';
import { BlockProperties } from './components/BlockProperties';
import { useDocumentTemplatesPage } from './hooks/useDocumentTemplatesPage';

/** Tipos de bloques de los que solo se permite una única instancia por plantilla */
const UNIQUE_BLOCK_TYPES: BlockType[] = [
    'cover',
    'project_general_section',
    'project_technical_section',
    'project_budget_section',
    'project_progress_report',
    'project_ethics_report',
    'researchers_table',
    'gantt',
    'impacts',
    'rubric_table',
    'resources',
    'expected_products',
    'project_approval_notice'
];

const DocumentTemplatesPage: React.FC = () => {
    const {
        templates,
        selectedTemplate,
        saving,
        isDirty,
        isDark,
        blocks,
        activeBlockId,
        setActiveBlockId,
        showPalette,
        setShowPalette,
        activeMobileTab,
        setActiveMobileTab,
        paletteRef,
        headerCollapsed,
        setHeaderCollapsed,
        isSidebarCollapsed,
        toggleSidebar,
        sensors,
        activeBlock,
        handleSelectTemplate,
        handleAddBlock,
        handleDuplicateBlock,
        handleDeleteBlock,
        handleToggleActive,
        handleUpdateConfig,
        handleUpdateThemeConfig,
        handleSaveTemplate,
        handleCellChange,
        handleAddRow,
        handleRemoveRow,
        handleDragEnd,
    } = useDocumentTemplatesPage();

    return (
        <main className={`flex-1 bg-bg-deep p-4 md:px-10 md:pb-4 flex flex-col h-full overflow-hidden relative transition-[padding] duration-150 ease-out ${headerCollapsed
            ? 'md:pt-3'
            : 'md:pt-10'
            }`}>
            {/* Cabecera Principal Colapsable */}
            <div className={`transition-[max-height,opacity,margin,padding] duration-150 ease-out origin-top shrink-0 relative ${headerCollapsed
                ? 'max-h-0 opacity-0 mb-0 pb-0 pointer-events-none overflow-hidden'
                : 'max-h-[170px] opacity-100 pb-5 mb-1 overflow-visible'
                }`}>
                <PageHeader
                    kicker="Administración de Plantillas"
                    icon={FileCode2}
                    title="Editor de Plantillas"
                    description="Creador visual de documentos. Arrastra bloques, añade tablas y define la maquetación del PDF oficial."
                    className="relative z-30"
                />

                {selectedTemplate && !headerCollapsed && (
                    <div className="absolute bottom-1 right-0 flex items-center gap-2.5 z-30 animate-fade-in">
                        {selectedTemplate.code !== 'GLOBAL_THEME' && (
                            <div ref={paletteRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowPalette(p => !p)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-thin text-text-main bg-surface hover:bg-surface-hover hover:border-border-hover text-xs font-medium transition-all cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Agregar Bloque
                                    <ChevronDown className={`w-3 h-3 transition-transform ${showPalette ? 'rotate-180' : ''}`} />
                                </button>

                                {showPalette && (
                                    <div className="absolute top-full right-0 mt-2 z-50 bg-surface border border-border-thin rounded-md shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-4 w-[520px] max-h-[80vh] overflow-y-auto animate-fade-in-up flex flex-col gap-4">
                                        <div>
                                            <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">Bloques Estructurales & Contenido</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {([
                                                    { type: 'cover' as const, icon: Image, label: 'Portada Institucional', desc: 'Portada del PDF con logos y título.', color: 'text-blue-500 bg-blue-500/5' },
                                                    { type: 'title' as const, icon: Heading1, label: 'Título de Sección', desc: 'Encabezado de sección para el PDF.', color: 'text-blue-500 bg-blue-500/5' },
                                                    { type: 'rich_text' as const, icon: AlignLeft, label: 'Párrafo Enriquecido', desc: 'Editor colaborativo en el Workspace.', color: 'text-pink-500 bg-pink-500/5' },
                                                    { type: 'advanced_table' as const, icon: Grid, label: 'Tabla Avanzada', desc: 'Tabla con filas y columnas fijas.', color: 'text-blue-500 bg-blue-500/5' },
                                                    { type: 'multi_section_table' as const, icon: LayoutTemplate, label: 'Tabla Multi-Sección', desc: 'Conjunto de sub-tablas fijas.', color: 'text-blue-500 bg-blue-500/5' },
                                                    { type: 'two_column' as const, icon: Columns2, label: 'Dos Columnas', desc: 'Dos bloques de texto lado a lado.', color: 'text-blue-500 bg-blue-500/5' },
                                                    { type: 'page_break' as const, icon: Minus, label: 'Salto de Página', desc: 'Forzar salto de página en el PDF.', color: 'text-zinc-400 bg-zinc-400/5' },
                                                    { type: 'gantt' as const, icon: BarChart2, label: 'Diagrama de Gantt', desc: 'Pestaña de Cronograma en Workspace.', color: 'text-indigo-500 bg-indigo-500/5' },
                                                ]).map(item => {
                                                    const ItemIcon = item.icon;
                                                    const alreadyExists = UNIQUE_BLOCK_TYPES.includes(item.type) && blocks.some(b => b.type === item.type);
                                                    return (
                                                        <button key={item.type}
                                                            type="button"
                                                            disabled={alreadyExists}
                                                            onClick={() => { handleAddBlock(item.type); setShowPalette(false); }}
                                                            className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'}`}
                                                        >
                                                            <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                                                <ItemIcon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                                                    <span>{item.label}</span>
                                                                    {alreadyExists && <span className="text-[8px] font-medium font-mono bg-surface-hover border border-border-thin/30 px-1.5 py-0.5 rounded text-text-dim shrink-0">Añadido</span>}
                                                                </p>
                                                                <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-border-thin/30 pt-3">
                                            <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">Bloques de Base de Datos (Dinámicos)</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {([
                                                    { type: 'project_general_section' as const, icon: BookOpen, label: 'Ficha de Identificación', desc: 'Metadatos (título, carrera, plazos).', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'researchers_table' as const, icon: Users, label: 'Equipo de Investigadores', desc: 'Participantes del proyecto científico.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'project_technical_section' as const, icon: FileText, label: 'Plan Técnico', desc: '8 sub-secciones de redacción (Antecedentes, Metodología, etc.).', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'project_budget_section' as const, icon: DollarSign, label: 'Recursos y Presupuesto', desc: 'Tablas de recursos y financiamiento del proyecto.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'project_progress_report' as const, icon: BarChart2, label: 'Avance de Ejecución', desc: 'Hitos, evidencias y avance presupuestario.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'project_ethics_report' as const, icon: Award, label: 'Acta del Comité de Ética', desc: 'Dictamen final de pertinencia ética y bioética.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'expected_products' as const, icon: Target, label: 'Productos Esperados', desc: 'Tabla de entregables, patentes o publicaciones.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'impacts' as const, icon: Target, label: 'Matriz de Impactos', desc: 'Impactos y productos esperados.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'rubric_table' as const, icon: Award, label: 'Rúbrica de Calificación', desc: 'Criterios para los revisores pares.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'project_approval_notice' as const, icon: FileText, label: 'Oficio de Aprobación', desc: 'Metadatos y dictamen formal de aprobación legal.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                    { type: 'signatures' as const, icon: PenLine, label: 'Bloque de Firmas', desc: 'Firmas físicas o electrónica CACES.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                ]).map(item => {
                                                    const ItemIcon = item.icon;
                                                    const alreadyExists = UNIQUE_BLOCK_TYPES.includes(item.type) && blocks.some(b => b.type === item.type);
                                                    return (
                                                        <button key={item.type}
                                                            type="button"
                                                            disabled={alreadyExists}
                                                            onClick={() => { handleAddBlock(item.type); setShowPalette(false); }}
                                                            className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'}`}
                                                        >
                                                            <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                                                <ItemIcon className="w-3.5 h-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                                                    <span>{item.label}</span>
                                                                    {alreadyExists && <span className="text-[8px] font-medium font-mono bg-emerald-500/5 border border-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-600 shrink-0">Añadido</span>}
                                                                </p>
                                                                <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSaveTemplate}
                            disabled={saving || !isDirty}
                            className="btn-vercel-primary flex items-center gap-1.5 text-xs font-semibold !py-1.5 !px-3 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Save className="w-3.5 h-3.5" />
                            <span>{saving ? 'Publicando...' : 'Publicar Plantilla'}</span>
                        </button>
                    </div>
                )}
            </div>


            {/* Botones Flotantes Circulares cuando la Cabecera está Colapsada */}
            {selectedTemplate && headerCollapsed && (
                <div className="absolute top-[13px] right-6 md:right-14 z-50 flex items-center gap-3 animate-fade-in">
                    {selectedTemplate.code !== 'GLOBAL_THEME' && (
                        <div ref={paletteRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setShowPalette(p => !p)}
                                title="Agregar Bloque"
                                className="w-10 h-10 rounded-full border border-border-thin text-text-main bg-surface hover:bg-surface-hover hover:border-border-hover flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
                            >
                                <Plus className="w-5 h-5" />
                            </button>

                            {showPalette && (
                                <div className="absolute top-full right-0 mt-2 z-50 bg-surface border border-border-thin rounded-md shadow-[0_12px_30px_rgba(0,0,0,0.08)] p-4 w-[520px] max-h-[80vh] overflow-y-auto animate-fade-in-up flex flex-col gap-4">
                                    <div>
                                        <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">Bloques Estructurales & Contenido</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([
                                                { type: 'cover' as const, icon: Image, label: 'Portada Institucional', desc: 'Portada del PDF con logos y título.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'title' as const, icon: Heading1, label: 'Título de Sección', desc: 'Encabezado de sección para el PDF.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'rich_text' as const, icon: AlignLeft, label: 'Párrafo Enriquecido', desc: 'Editor colaborativo en el Workspace.', color: 'text-pink-500 bg-pink-500/5' },
                                                { type: 'advanced_table' as const, icon: Grid, label: 'Tabla Avanzada', desc: 'Tabla con filas y columnas fijas.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'multi_section_table' as const, icon: LayoutTemplate, label: 'Tabla Multi-Sección', desc: 'Conjunto de sub-tablas fijas.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'two_column' as const, icon: Columns2, label: 'Dos Columnas', desc: 'Dos bloques de texto lado a lado.', color: 'text-blue-500 bg-blue-500/5' },
                                                { type: 'page_break' as const, icon: Minus, label: 'Salto de Página', desc: 'Forzar salto de página en el PDF.', color: 'text-zinc-400 bg-zinc-400/5' },
                                                { type: 'gantt' as const, icon: BarChart2, label: 'Diagrama de Gantt', desc: 'Pestaña de Cronograma en Workspace.', color: 'text-indigo-500 bg-indigo-500/5' },
                                            ]).map(item => {
                                                const ItemIcon = item.icon;
                                                const alreadyExists = UNIQUE_BLOCK_TYPES.includes(item.type) && blocks.some(b => b.type === item.type);
                                                return (
                                                    <button key={item.type}
                                                        type="button"
                                                        disabled={alreadyExists}
                                                        onClick={() => { handleAddBlock(item.type); setShowPalette(false); }}
                                                        className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'}`}
                                                    >
                                                        <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                                            <ItemIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                                                <span>{item.label}</span>
                                                                {alreadyExists && <span className="text-[8px] font-medium font-mono bg-surface-hover border border-border-thin/30 px-1.5 py-0.5 rounded text-text-dim shrink-0">Añadido</span>}
                                                            </p>
                                                            <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="border-t border-border-thin/30 pt-3">
                                        <p className="text-[9px] font-semibold text-text-dim/80 uppercase tracking-wider px-1 mb-2">Bloques de Base de Datos (Dinámicos)</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {([
                                                { type: 'project_general_section' as const, icon: BookOpen, label: 'Ficha de Identificación', desc: 'Metadatos (título, carrera, plazos).', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'researchers_table' as const, icon: Users, label: 'Equipo de Investigadores', desc: 'Participantes del proyecto científico.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_technical_section' as const, icon: FileText, label: 'Plan Técnico', desc: '8 sub-secciones de redacción (Antecedentes, Metodología, etc.).', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_budget_section' as const, icon: DollarSign, label: 'Recursos y Presupuesto', desc: 'Tablas de recursos y financiamiento del proyecto.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_progress_report' as const, icon: BarChart2, label: 'Avance de Ejecución', desc: 'Hitos, evidencias y avance presupuestario.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_ethics_report' as const, icon: Award, label: 'Acta del Comité de Ética', desc: 'Dictamen final de pertinencia ética y bioética.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'expected_products' as const, icon: Target, label: 'Productos Esperados', desc: 'Tabla de entregables, patentes o publicaciones.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'impacts' as const, icon: Target, label: 'Matriz de Impactos', desc: 'Áreas e impactos del proyecto.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'rubric_table' as const, icon: Award, label: 'Rúbrica de Calificación', desc: 'Criterios para los revisores pares.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'project_approval_notice' as const, icon: FileText, label: 'Oficio de Aprobación', desc: 'Metadatos y dictamen formal de aprobación legal.', color: 'text-emerald-500 bg-emerald-500/5' },
                                                { type: 'signatures' as const, icon: PenLine, label: 'Bloque de Firmas', desc: 'Firmas físicas o electrónica CACES.', color: 'text-emerald-500 bg-emerald-500/5' },
                                            ]).map(item => {
                                                const ItemIcon = item.icon;
                                                const alreadyExists = UNIQUE_BLOCK_TYPES.includes(item.type) && blocks.some(b => b.type === item.type);
                                                return (
                                                    <button key={item.type}
                                                        type="button"
                                                        disabled={alreadyExists}
                                                        onClick={() => { handleAddBlock(item.type); setShowPalette(false); }}
                                                        className={`flex items-start gap-2.5 p-2 rounded-md text-left transition-all ${alreadyExists ? 'opacity-35 cursor-not-allowed' : 'hover:bg-surface-hover hover:text-text-main cursor-pointer'}`}
                                                    >
                                                        <div className={`p-1.5 rounded shrink-0 mt-0.5 ${item.color}`}>
                                                            <ItemIcon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-text-main truncate flex items-center gap-1.5">
                                                                <span>{item.label}</span>
                                                                {alreadyExists && <span className="text-[8px] font-medium font-mono bg-emerald-500/5 border border-emerald-500/15 px-1.5 py-0.5 rounded text-emerald-600 shrink-0">Añadido</span>}
                                                            </p>
                                                            <p className="text-[9px] text-text-dim leading-snug mt-0.5 line-clamp-2">{item.desc}</p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveTemplate}
                        disabled={saving || !isDirty}
                        title={selectedTemplate.code === 'GLOBAL_THEME' ? 'Guardar Diseño Global' : `Guardar y Publicar v${selectedTemplate.version}`}
                        className="w-10 h-10 rounded-full bg-text-main text-bg-deep flex items-center justify-center hover:opacity-90 transition-all shadow-md disabled:opacity-40 cursor-pointer shrink-0"
                    >
                        {saving ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                    </button>
                </div>
            )}

            {/* Pestañas Móviles Responsive */}
            {selectedTemplate && (
                <div className="flex md:hidden border-b border-border-thin bg-surface shrink-0 mb-3 rounded-lg overflow-hidden border">
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('catalog')}
                        className={`flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${activeMobileTab === 'catalog' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-text-dim'}`}
                    >
                        Catálogo
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('canvas')}
                        className={`flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${activeMobileTab === 'canvas' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-text-dim'}`}
                    >
                        Lienzo ({blocks.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveMobileTab('properties')}
                        className={`flex-1 py-2 text-center text-xs font-bold transition-colors cursor-pointer ${activeMobileTab === 'properties' ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-text-dim'}`}
                    >
                        Ajustes
                    </button>
                </div>
            )}

            {/* Área Principal de 3 Columnas */}
            <div className="flex-1 flex gap-4 min-h-0 overflow-hidden relative">
                <DndContext sensors={sensors} collisionDetection={rectIntersection} onDragEnd={handleDragEnd}>
                    {/* Columna Izquierda: Catálogo */}
                    <div className={`w-80 shrink-0 flex-col min-h-0 md:flex ${activeMobileTab === 'catalog' ? 'flex w-full md:w-80' : 'hidden'}`}>
                        <TemplateCatalog
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onSelectTemplate={handleSelectTemplate}
                            isSidebarCollapsed={isSidebarCollapsed}
                            onToggleSidebar={toggleSidebar}
                            headerCollapsed={headerCollapsed}
                        />
                    </div>

                    {/* Columna Central: Lienzo Interactivo A4 */}
                    <div className={`flex-1 min-w-0 flex-col min-h-0 md:flex ${activeMobileTab === 'canvas' ? 'flex w-full md:w-auto' : 'hidden'}`}>
                        <BlockCanvas
                            selectedTemplate={selectedTemplate}
                            blocks={blocks}
                            activeBlockId={activeBlockId}
                            onSelectBlock={setActiveBlockId}
                            onDuplicateBlock={handleDuplicateBlock}
                            onDeleteBlock={handleDeleteBlock}
                            onToggleActive={handleToggleActive}
                            onUpdateConfig={handleUpdateConfig}
                            onCellChange={handleCellChange}
                            onAddRow={handleAddRow}
                            onRemoveRow={handleRemoveRow}
                            isDark={isDark}
                            onSaveTemplate={handleSaveTemplate}
                            saving={saving}
                            isDirty={isDirty}
                            headerCollapsed={headerCollapsed}
                            onToggleHeader={() => setHeaderCollapsed(prev => !prev)}
                        />
                    </div>

                    {/* Columna Derecha: Panel de Propiedades y Tema */}
                    <div className={`w-96 shrink-0 flex-col min-h-0 md:flex ${activeMobileTab === 'properties' ? 'flex w-full md:w-96' : 'hidden'}`}>
                        <BlockProperties
                            selectedTemplate={selectedTemplate}
                            activeBlock={activeBlock}
                            onUpdateConfig={handleUpdateConfig}
                            onCellChange={handleCellChange}
                            onAddRow={handleAddRow}
                            onRemoveRow={handleRemoveRow}
                            themeConfigJson={selectedTemplate?.themeConfigJson}
                            onUpdateThemeConfig={handleUpdateThemeConfig}
                            headerCollapsed={headerCollapsed}
                        />
                    </div>
                </DndContext>
            </div>
        </main>
    );
};

export default DocumentTemplatesPage;
