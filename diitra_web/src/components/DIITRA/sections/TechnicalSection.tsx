import React from 'react';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface TechnicalSectionProps {
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any) => void;
}

export const TechnicalSection: React.FC<TechnicalSectionProps> = ({
    cowork,
    onUpdate
}) => {
    return (
        <div className="space-y-12 animate-fade-in">
            <div className="space-y-6">
                <CoWorkField 
                    name="Antecedentes" 
                    cowork={cowork} 
                    type="textarea" 
                    label="Justificación y Antecedentes"
                    onValueChange={(v) => onUpdate('Antecedentes', v)}
                    className="w-full h-64 bg-surface border border-border-thin rounded-2xl px-8 py-6 text-sm leading-relaxed" 
                />
            </div>

            <div className="space-y-6">
                <CoWorkField 
                    name="ObjetivoGeneral" 
                    cowork={cowork} 
                    type="textarea" 
                    label="Objetivo General del Proyecto"
                    onValueChange={(v) => onUpdate('ObjetivoGeneral', v)}
                    className="w-full h-32 bg-surface border border-border-thin rounded-2xl px-8 py-6 text-base font-bold italic" 
                />
            </div>
        </div>
    );
};
