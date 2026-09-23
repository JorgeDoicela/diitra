/**
 * @file OfficialTemplatesCatalogView.tsx
 * @description Vista institucional del Catálogo de Formatos Oficiales y Plantillas para Docentes y Estudiantes.
 * 
 * @architecture
 * Diseñado bajo el estándar Vercel Geist Design System (styles-diitra):
 * - Bento Grid responsivo con micro-interacciones pulidas.
 * - Filtro dinámico por categorías normativas e input de búsqueda en tiempo real.
 * - Acceso directo a previsualización en alta fidelidad (Web/PDF) y descarga oficial directa.
 * - Badges normativos institucionales (Firma Electrónica, CACES, LOPDP).
 */

import React, { useState, useMemo } from 'react';
import {
    FileText,
    Sparkles,
    Award,
    FlaskConical,
    BarChart3,
    Eye,
    Download,
    Search,
    X,
    FileCode2
} from 'lucide-react';
import { PageHeader } from '../../../../components/Common/PageHeader';
import type { DocumentTemplateDto } from '../types';

interface OfficialTemplatesCatalogViewProps {
    templates: DocumentTemplateDto[];
    loading: boolean;
    onOpenPreview: (tmpl: DocumentTemplateDto) => void;
    onDownloadPdf: (tmpl: DocumentTemplateDto) => void;
}

type TemplateCategoryFilter = 'INVESTIGACION' | 'INNOVACION' | 'CERTIFICADOS';

function getTemplateCategory(code: string): 'INVESTIGACION' | 'INNOVACION' | 'CERTIFICADOS' | 'REPORTES' {
    const c = (code || '').toUpperCase();
    if (c.includes('INNOVACION') || c.includes('TRL')) return 'INNOVACION';
    if (c.startsWith('CERTIFICADO') || c.includes('CERTIFICADO')) return 'CERTIFICADOS';
    if (c.startsWith('REPORTE') || c.includes('ANALITICAS')) return 'REPORTES';
    return 'INVESTIGACION';
}

function getCategoryBadge(category: 'INVESTIGACION' | 'INNOVACION' | 'CERTIFICADOS' | 'REPORTES') {
    switch (category) {
        case 'INNOVACION':
            return {
                label: 'Innovación & i+TT',
                icon: Sparkles,
                textClass: 'text-brand'
            };
        case 'CERTIFICADOS':
            return {
                label: 'Certificación Oficial',
                icon: Award,
                textClass: 'text-success'
            };
        case 'REPORTES':
            return {
                label: 'Reportes & Analíticas',
                icon: BarChart3,
                textClass: 'text-purple-400'
            };
        default:
            return {
                label: 'Investigación (I+D+i)',
                icon: FlaskConical,
                textClass: 'text-blue-400'
            };
    }
}

function getTemplateDescription(tmpl: DocumentTemplateDto): string {
    const c = (tmpl.code || '').toUpperCase();
    if (c.includes('PROTOCOLO_INVESTIGACION')) {
        return 'Estructura oficial para la formulación, metodología, cronograma Gantt y presupuesto de proyectos de investigación científica.';
    }
    if (c.includes('INFORME_AVANCE')) {
        return 'Matriz estandarizada para el reporte periódico de actividades ejecutadas, evidencias y estado de avance de hitos.';
    }
    if (c.includes('INFORME_FINAL')) {
        return 'Documento de cierre técnico con plan de redacción, productos académicos alcanzados e impactos institucionales.';
    }
    if (c.includes('PLAN_APRENDIZAJE')) {
        return 'Formato de vinculación y aprendizaje práctico (APE) para estudiantes investigadores colaboradores.';
    }
    if (c.includes('OFICIO_APROBACION')) {
        return 'Oficio institucional de validación y acreditación formal del proyecto ante la Dirección de Investigación.';
    }
    if (c.includes('DICTAMEN') || c.includes('ARBITRAJE')) {
        return 'Acta oficial de dictamen consolidado bajo metodología de evaluación por pares ciegos.';
    }
    if (c.includes('CERTIFICADO')) {
        return 'Certificación institucional con código de verificación QR y trazabilidad de participación en I+D.';
    }
    return 'Estructura documental oficial normada y estandarizada por el Vicerrectorado de Investigación.';
}

export const OfficialTemplatesCatalogView: React.FC<OfficialTemplatesCatalogViewProps> = ({
    templates,
    loading,
    onOpenPreview,
    onDownloadPdf
}) => {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategoryFilter>('INVESTIGACION');
    const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

    // Los reportes y analíticas internas no deben ser visibles para usuarios generales (docentes y estudiantes)
    const visibleTemplates = useMemo(() => {
        return templates.filter(t => getTemplateCategory(t.code) !== 'REPORTES');
    }, [templates]);

    const categories: { id: TemplateCategoryFilter; label: string }[] = useMemo(() => [
        { id: 'INVESTIGACION', label: 'Investigación (I+D)' },
        { id: 'INNOVACION', label: 'Innovación & Transferencia' },
        { id: 'CERTIFICADOS', label: 'Certificados' },
    ], []);

    const filteredTemplates = useMemo(() => {
        return visibleTemplates.filter(tmpl => {
            const matchesCategory = getTemplateCategory(tmpl.code) === selectedCategory;
            if (!matchesCategory) return false;

            if (!search.trim()) return true;
            const q = search.toLowerCase().trim();
            const name = (tmpl.name || '').toLowerCase();
            const code = (tmpl.code || '').toLowerCase();
            const desc = getTemplateDescription(tmpl).toLowerCase();
            return name.includes(q) || code.includes(q) || desc.includes(q);
        });
    }, [visibleTemplates, selectedCategory, search]);

    const handleDownload = async (tmpl: DocumentTemplateDto) => {
        setDownloadingCode(tmpl.code);
        try {
            await onDownloadPdf(tmpl);
        } finally {
            setDownloadingCode(null);
        }
    };

    return (
        <main className="flex-1 bg-bg-deep p-4 md:px-10 md:py-8 flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Cabecera Principal */}
            <div className="shrink-0 mb-6">
                <PageHeader
                    kicker="Repositorio Institucional"
                    icon={FileText}
                    title="Formatos"
                    description="Catálogo de plantillas oficiales para la formulación de proyectos de investigación, informes técnicos de avance y actas académicas reguladas por CACES y DIITRA."
                />
            </div>

            {/* Barra de Filtros y Búsqueda */}
            <div className="shrink-0 mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-surface p-3.5 rounded-xl border border-border-thin">
                {/* Categorías / Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                    {categories.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0 cursor-pointer ${
                                    isSelected
                                        ? 'bg-text-main text-bg-deep font-semibold shadow-sm'
                                        : 'text-text-dim hover:text-text-main hover:bg-surface-hover bg-transparent'
                                }`}
                            >
                                <span>{cat.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Input de Búsqueda */}
                <div className="relative min-w-[240px] md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim/60" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por nombre o código..."
                        className="w-full bg-bg-deep border border-border-thin rounded-lg pl-9 pr-8 py-1.5 text-xs text-text-main placeholder:text-text-dim/60 focus:outline-none focus:border-border-hover transition-colors"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-main p-0.5"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>



            {/* Estado de Carga (Skeleton) */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="bg-surface border border-border-thin rounded-xl p-5 animate-pulse flex flex-col justify-between h-56">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-surface-hover" />
                                    <div className="w-16 h-5 rounded bg-surface-hover" />
                                </div>
                                <div className="w-3/4 h-4 rounded bg-surface-hover mb-2" />
                                <div className="w-full h-3 rounded bg-surface-hover mb-1.5" />
                                <div className="w-2/3 h-3 rounded bg-surface-hover" />
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-border-thin/40">
                                <div className="flex-1 h-8 rounded bg-surface-hover" />
                                <div className="w-10 h-8 rounded bg-surface-hover" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Estado Vacío */}
            {!loading && filteredTemplates.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center bg-surface/40 rounded-xl border border-dashed border-border-thin">
                    <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center text-text-dim mb-3">
                        <FileCode2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-text-main mb-1">
                        No se encontraron formatos coincidentes
                    </h3>
                    <p className="text-xs text-text-dim max-w-sm mb-4">
                        {search
                            ? `No hay formatos que coincidan con "${search}". Intenta con otros términos.`
                            : 'No hay formatos disponibles en la categoría seleccionada.'}
                    </p>
                    {(search || selectedCategory !== 'INVESTIGACION') && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setSelectedCategory('INVESTIGACION'); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface hover:bg-surface-hover border border-border-thin text-text-main transition-colors cursor-pointer"
                        >
                            Limpiar Filtros
                        </button>
                    )}
                </div>
            )}

            {/* Grid de Formatos Bento */}
            {!loading && filteredTemplates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
                    {filteredTemplates.map(tmpl => {
                        const categoryKey = getTemplateCategory(tmpl.code);
                        const categoryInfo = getCategoryBadge(categoryKey);
                        const Icon = categoryInfo.icon;
                        const description = getTemplateDescription(tmpl);
                        const isDownloading = downloadingCode === tmpl.code;

                        return (
                            <div
                                key={tmpl.code}
                                className="bg-surface border border-border-thin hover:border-border-hover rounded-xl p-5 flex flex-col justify-between transition-colors duration-150"
                            >
                                <div>
                                    {/* Cabecera de Tarjeta: Categoría */}
                                    <div className={`flex items-center gap-1.5 mb-3 ${categoryInfo.textClass}`}>
                                        <Icon className="w-4 h-4 shrink-0" />
                                        <span className="text-[11px] font-medium tracking-wide">
                                            {categoryInfo.label}
                                        </span>
                                    </div>

                                    {/* Título */}
                                    <h3 className="text-[14px] font-semibold text-text-main leading-snug mb-2">
                                        {tmpl.name}
                                    </h3>

                                    {/* Descripción */}
                                    <p className="text-xs text-text-dim leading-relaxed mb-4 line-clamp-3">
                                        {description}
                                    </p>
                                </div>

                                {/* Acciones: Previsualizar y Descargar PDF */}
                                <div className="flex items-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => onOpenPreview(tmpl)}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border-thin hover:border-border-hover hover:bg-surface-hover text-text-main text-xs font-medium transition-colors cursor-pointer bg-transparent"
                                        title={`Previsualizar ${tmpl.name}`}
                                    >
                                        <Eye className="w-3.5 h-3.5 text-text-dim" />
                                        <span>Previsualizar</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleDownload(tmpl)}
                                        disabled={isDownloading}
                                        className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-text-main text-bg-deep hover:opacity-90 text-xs font-medium transition-opacity disabled:opacity-40 cursor-pointer"
                                        title={`Descargar PDF oficial de ${tmpl.name}`}
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        <span>{isDownloading ? 'Generando...' : 'Descargar PDF'}</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
};

export default OfficialTemplatesCatalogView;
