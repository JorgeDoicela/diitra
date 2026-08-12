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
    RefreshCw
} from 'lucide-react';
import { DndContext, rectIntersection } from '@dnd-kit/core';
import type { BlockType } from './types';
import { TemplateCatalog } from './components/TemplateCatalog';
import { BlockCanvas } from './components/BlockCanvas';
import { BlockProperties } from './components/BlockProperties';
import { BlockPalette } from './components/BlockPalette';
import { useDocumentTemplatesPage } from './hooks/useDocumentTemplatesPage';

/** Tipos de bloques de los que solo se permite una única instancia por plantilla */
const UNIQUE_BLOCK_TYPES: BlockType[] = [
    'cover',
    'project_general_section',
    'project_technical_section',
    'project_budget_section',
    'project_progress_report',
    'researchers_table',
    'gantt',
    'impacts',
    'rubric_table',
    'resources',
    'expected_products',
    'project_approval_notice',
    'arbitration_dictamen_section'
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
        handleReorderTemplates,
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
                                    <BlockPalette
                                        blocks={blocks}
                                        uniqueBlockTypes={UNIQUE_BLOCK_TYPES}
                                        onAddBlock={handleAddBlock}
                                        onClose={() => setShowPalette(false)}
                                    />
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
                                <BlockPalette
                                    blocks={blocks}
                                    uniqueBlockTypes={UNIQUE_BLOCK_TYPES}
                                    onAddBlock={handleAddBlock}
                                    onClose={() => setShowPalette(false)}
                                />
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
                            onReorderTemplates={handleReorderTemplates}
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
