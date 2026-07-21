import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
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
        <div className="w-full border border-border-thin/40 rounded-md bg-surface flex flex-col overflow-hidden shrink-0">
            <div className="p-2 px-3 border-b border-border-thin/30 bg-surface-hover shrink-0">
                <span className="text-[10px] font-black text-text-dim uppercase tracking-wider">
                    Catálogo de Documentos ({templates.length})
                </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {templates.map(t => {
                    const isSelected = selectedTemplate?.code === t.code;
                    return (
                        <button
                            key={t.code}
                            onClick={() => onSelectTemplate(t)}
                            className={`w-full text-left p-2 rounded-md border transition-all flex items-start gap-2 ${
                                isSelected 
                                    ? 'bg-surface-hover border-border-hover text-text-main shadow-none' 
                                    : 'bg-surface hover:bg-surface-hover/60 border-border-thin/30 hover:border-border-thin/60 text-text-dim hover:text-text-main'
                            }`}
                        >
                            <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${isSelected ? 'bg-surface text-text-main border border-border-thin' : 'bg-surface-hover text-text-dim'}`}>
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <span className="font-semibold text-xs truncate text-text-main">
                                        {t.name}
                                    </span>
                                    <span className="text-[9px] bg-surface-hover px-1.5 py-0.5 rounded font-mono border border-border-thin/20 shrink-0">
                                        v{t.version}
                                    </span>
                                </div>
                                <p className="text-[10px] truncate text-text-dim mt-0.5">
                                    {t.code}
                                </p>
                            </div>
                            <ChevronRight className={`w-3.5 h-3.5 mt-1 shrink-0 ${isSelected ? 'text-text-main' : 'text-text-dim/40'}`} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
