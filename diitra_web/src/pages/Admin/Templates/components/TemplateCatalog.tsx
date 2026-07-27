import React from 'react';
import { FileText, Palette } from 'lucide-react';
import type { DocumentTemplateDto } from '../types';

interface TemplateCatalogProps {
    templates: DocumentTemplateDto[];
    selectedTemplate: DocumentTemplateDto | null;
    onSelectTemplate: (tmpl: DocumentTemplateDto) => void;
}

export const TemplateCatalog: React.FC<TemplateCatalogProps> = ({
    templates,
    selectedTemplate,
    onSelectTemplate
}) => {
    return (
        <div className="w-full border border-border-thin rounded-md bg-surface flex flex-col overflow-hidden shrink-0">
            {/* Header del panel */}
            <div className="p-3 border-b border-border-thin bg-surface shrink-0">
                <span className="text-xs font-semibold text-text-main">
                    Catálogo de Documentos ({templates.length})
                </span>
            </div>
            
            {/* Lista unificada sin separaciones toscas */}
            <div className="flex-1 overflow-y-auto divide-y divide-border-thin/30">
                {/* OPCIÓN VIRTUAL: TEMA GLOBAL INSTITUCIONAL */}
                <button
                    type="button"
                    onClick={() => onSelectTemplate({
                        id: 0,
                        code: 'GLOBAL_THEME',
                        name: 'Diseño Global Institucional',
                        description: 'Configuración visual por defecto para todos los documentos de la institución (colores, márgenes, tipografía).',
                        category: 0,
                        version: 1,
                        isActive: true,
                        requiresLopdpClause: false,
                        supportsBlindMode: false,
                        requiresElectronicSignature: false,
                        signatureType: 'none',
                        themeConfigJson: '',
                        htmlContent: '',
                        customCss: '',
                        collaborativeFieldsJson: '',
                        updatedAt: new Date().toISOString(),
                        updatedBy: null
                    })}
                    className={`w-full text-left p-3 flex items-start gap-3 transition-all relative border-b border-border-thin/50 ${
                        selectedTemplate?.code === 'GLOBAL_THEME'
                            ? 'bg-text-main/5 text-text-main font-bold'
                            : 'bg-surface hover:bg-surface-hover/40 text-text-dim hover:text-text-main'
                    }`}
                >
                    {selectedTemplate?.code === 'GLOBAL_THEME' && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
                    )}
                    <div className="p-1.5 rounded bg-surface border border-border-thin/40 shrink-0 text-text-main shadow-none">
                        <Palette className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-[11px] leading-snug font-bold">
                            Diseño Global Institucional
                        </span>
                        <p className="text-[9.5px] text-text-dim/80 mt-0.5 leading-normal">
                            Traversari Branding Base
                        </p>
                    </div>
                </button>

                {templates.map(t => {
                    const isSelected = selectedTemplate?.code === t.code;
                    return (
                        <button
                            key={t.code}
                            type="button"
                            onClick={() => onSelectTemplate(t)}
                            className={`w-full text-left p-3 flex items-start gap-3 transition-all relative last:border-b-0 ${
                                isSelected 
                                    ? 'bg-surface-hover text-text-main' 
                                    : 'bg-surface hover:bg-surface-hover/40 text-text-dim hover:text-text-main'
                            }`}
                        >
                            {/* Línea de acento izquierda de selección activa */}
                            {isSelected && (
                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent" />
                            )}
                            
                            <div className="p-1.5 rounded bg-surface border border-border-thin/40 shrink-0 text-text-main shadow-none">
                                <FileText className="w-3.5 h-3.5" />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`text-[11px] leading-snug transition-colors break-words ${isSelected ? 'font-bold text-text-main' : 'font-medium text-text-main/80'}`}>
                                        {t.name}
                                    </span>
                                    <span className="text-[8px] bg-surface-hover/60 px-1.5 py-0.5 rounded font-mono border border-border-thin/10 shrink-0 text-text-dim">
                                        v{t.version}
                                    </span>
                                </div>
                                <p className="text-[9px] text-text-dim mt-1 font-mono tracking-tight select-all">
                                    {t.code}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
