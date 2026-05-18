import React from 'react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { BookText, Target } from 'lucide-react';

interface TechnicalSectionProps {
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any) => void;
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({
    cowork,
    onUpdate
}) => {
    return (
        <div className="space-y-12 animate-fade-in pb-10">
            <div className="space-y-4">
                <h3 className="text-sm font-black text-text-main uppercase flex items-center gap-2">
                    <BookText size={16} /> Justificación y Antecedentes
                </h3>
                <p className="text-[11px] text-text-dim mb-4">
                    Redacte la fundamentación teórica y la problemática (soporta imágenes, tablas y negritas).
                </p>
                <div className="rounded-xl overflow-hidden shadow-sm border border-border-thin">
                    <CoWorkEditor 
                        field="Antecedentes" 
                        cowork={cowork} 
                        onChange={(html) => onUpdate('Antecedentes', html)}
                        placeholder="Comience a escribir la justificación de su proyecto aquí..."
                        className="min-h-[400px] border-none" 
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-black text-text-main uppercase flex items-center gap-2">
                    <Target size={16} /> Objetivo General
                </h3>
                <p className="text-[11px] text-text-dim mb-4">
                    Describa el objetivo principal que persigue esta investigación.
                </p>
                <div className="rounded-xl overflow-hidden shadow-sm border border-border-thin">
                    <CoWorkEditor 
                        field="ObjetivoGeneral" 
                        cowork={cowork} 
                        onChange={(html) => onUpdate('ObjetivoGeneral', html)}
                        placeholder="El objetivo de esta investigación es..."
                        className="min-h-[250px] border-none" 
                    />
                </div>
            </div>
        </div>
    );
};
