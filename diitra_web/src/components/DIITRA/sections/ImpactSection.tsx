import React, { useContext } from 'react';
import { Target } from 'lucide-react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../SectionBlockGuard';
import { SectionGuardContext } from '../../../core/documents/context/DocumentDataContext';

interface ImpactCategoryItem {
    key: string;
    title: string;
    placeholder?: string;
}

interface ImpactSectionProps {
    cowork: CoWorkHandle;
    onUpdateImpacto?: (tipo: string, value: string) => void;
    onUpdate?: (field: string, value: any) => void;
    readOnly?: boolean;
    config?: any;
}

export const ImpactSection: React.FC<ImpactSectionProps> = ({
    cowork,
    onUpdateImpacto,
    readOnly = false,
    config
}) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const effectiveReadOnly = readOnly || blockReadOnly;

    const activeImpacts = React.useMemo<ImpactCategoryItem[]>(() => {
        if (config?.impactCategories && Array.isArray(config.impactCategories) && config.impactCategories.length > 0) {
            return config.impactCategories
                .filter((c: any) => c.enabled !== false)
                .map((c: any) => ({
                    key: c.key || c.title.toLowerCase(),
                    title: c.title || `Impacto ${c.key}`,
                    placeholder: c.placeholder || `Describa el ${c.title}...`
                }));
        }

        const legacyList: ImpactCategoryItem[] = [];
        if (config?.showImpactoSocial !== false) legacyList.push({ key: 'social', title: 'Impacto Social' });
        if (config?.showImpactoCientifico !== false) legacyList.push({ key: 'cientifico', title: 'Impacto Científico' });
        if (config?.showImpactoEconomico !== false) legacyList.push({ key: 'economico', title: 'Impacto Económico' });
        if (config?.showImpactoPolitico !== false) legacyList.push({ key: 'politico', title: 'Impacto Político' });
        if (config?.showImpactoAmbiental !== false) legacyList.push({ key: 'ambiental', title: 'Impacto Ambiental' });
        if (config?.showImpactoOtro !== false) legacyList.push({ key: 'otro', title: 'Otro Impacto' });
        return legacyList;
    }, [config]);

    return (
        <SectionBlockGuard id="matriz_impacto" title="6. Matriz de Impacto" showInlineLock={true}>
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
