import React, { useContext, useCallback } from 'react';
import { Target } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../SectionBlockGuard';
import { SectionGuardContext, DocumentDataContext } from '../../../core/documents/context/DocumentDataContext';

interface ImpactCategoryItem {
    key: string;
    title: string;
    placeholder?: string;
}

interface ImpactSectionProps {
    cowork: CoWorkHandle;
    onUpdateImpacto?: (tipo: string, value: string) => void;
    onUpdate?: (field: string, value: unknown) => void;
    readOnly?: boolean;
    config?: Record<string, unknown>;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
    cowork,
    onUpdateImpacto,
    readOnly = false,
    config
}) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly;
    const globalFormData = useContext(DocumentDataContext);

    const activeImpacts = React.useMemo<ImpactCategoryItem[]>(() => {
        const cfg = config as Record<string, unknown> | undefined;
        const cats = cfg?.impactCategories;
        if (Array.isArray(cats) && cats.length > 0) {
            return (cats as Record<string, unknown>[])
                .filter((c) => c.enabled !== false)
                .map((c) => ({
                    key: String(c.key || String(c.title ?? '').toLowerCase()),
                    title: String(c.title || `Impacto ${String(c.key)}`),
                    placeholder: c.placeholder ? String(c.placeholder) : `Describa el ${String(c.title)}...`
                }));
        }

        const legacyList: ImpactCategoryItem[] = [];
        if (cfg?.showImpactoSocial !== false) legacyList.push({ key: 'social', title: 'Impacto Social' });
        if (cfg?.showImpactoCientifico !== false) legacyList.push({ key: 'cientifico', title: 'Impacto Científico' });
        if (cfg?.showImpactoEconomico !== false) legacyList.push({ key: 'economico', title: 'Impacto Económico' });
        if (cfg?.showImpactoPolitico !== false) legacyList.push({ key: 'politico', title: 'Impacto Político' });
        if (cfg?.showImpactoAmbiental !== false) legacyList.push({ key: 'ambiental', title: 'Impacto Ambiental' });
        if (cfg?.showImpactoOtro !== false) legacyList.push({ key: 'otro', title: 'Otro Impacto' });
        return legacyList;
    }, [config]);

    /**
     * Serializer explícito para la Matriz de Impactos.
     *
     * Los impactos NO se almacenan como un array en `globalFormData['Impactos']`,
     * sino como campos planos individuales: `Impacto_social`, `Impacto_cientifico`, etc.
     * Sin este serializer, el heurístico de `formatStructuredCollection` nunca encontraría
     * datos que serializar porque el campo 'Impactos' está vacío.
     */
    const impactSerializer = useCallback((_data: unknown): string => {
        const formRecord = globalFormData as Record<string, unknown> | null;
        return activeImpacts
            .map((item) => {
                const raw = formRecord?.[`Impacto_${item.key}`] ?? '';
                const text = typeof raw === 'string' ? raw.replace(/<[^>]+>/g, '').trim() : '';
                return `• ${item.title}: ${text || '(Sin descripción)'}`;
            })
            .join('\n');
    }, [activeImpacts, globalFormData]);

    return (
        <SectionBlockGuard
            id="matriz_impacto"
            title="6. Matriz de Impacto"
            fieldKey="Impactos"
            instructions="Determinar los impactos directos e indirectos de la investigación en los ámbitos científico, tecnológico, social, económico, político y ambiental."
            requirementText="Describir los beneficiarios y la transformación cuantitativa o cualitativa esperada por cada dimensión."
            showInlineLock={true}
            contentSerializer={impactSerializer}
        >
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xs font-black uppercase tracking-widest px-2 flex items-center gap-2">
                    <Target size={18} /> Matriz de Impactos del Proyecto
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    {activeImpacts.map((item) => (
                        <div key={item.key} className="p-5 bg-bg-deep border border-border-thin rounded-2xl flex gap-6 items-center shadow-sm">
                            <div className="w-36 text-[10px] font-black uppercase text-text-main">{item.title}</div>
                            <CoWorkField
                                name={`Impacto_${item.key}`}
                                cowork={cowork}
                                placeholder={item.placeholder || `Describa el ${item.title.toLowerCase()} del proyecto...`}
                                onValueChange={(v) => onUpdateImpacto && onUpdateImpacto(item.key, v)}
                                readOnly={effectiveReadOnly}
                                className="flex-1 bg-bg-deep border border-border-thin rounded-xl px-4 py-2.5 text-xs"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </SectionBlockGuard>
    );
};
