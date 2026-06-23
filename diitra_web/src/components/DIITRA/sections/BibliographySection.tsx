import React from 'react';
import { Library, Info, Shield } from 'lucide-react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';

interface BibliographySectionProps {
    formData: any;
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
    readOnly?: boolean;
}

export const BibliographySection: React.FC<BibliographySectionProps> = ({
    formData,
    cowork,
    onUpdate,
    readOnly = false
}) => {
    const signatures = formData?.FirmasResponsabilidad || {
        DirectorNombre: '',
        DirectorCargo: 'Director del Proyecto',
        CoordinadorNombre: '',
        CoordinadorCargo: 'Coordinador de Carrera'
    };

    return (
        <div className="space-y-12">
            {/* 8. Bibliografía */}
            <div className="space-y-6 animate-fade-in">
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                        <Library size={18} /> 8. Bibliografía
                    </h3>
                    <div className="flex gap-3 p-4 rounded-xl bg-bg-deep/50 border border-border-thin text-xs text-text-dim items-start">
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
                        onChange={(html, meta) => onUpdate('Bibliografia', html, meta)}
                        placeholder="1. Apellidos, A. A. (Año). Título del artículo. Título de la publicación, volumen(número), páginas.&#10;2. ..."
                        className="min-h-[400px] border-none" 
                        readOnly={readOnly}
                    />
                </div>
            </div>

            {/* 9. Firmas de Responsabilidad */}
            <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl space-y-6 shadow-sm animate-fade-in">
                <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                        <Shield size={18} /> 9. Firmas de Responsabilidad
                    </h3>
                    <p className="text-[10px] text-text-dim px-2 uppercase tracking-wider font-semibold">
                        Complete los datos de los responsables de la elaboración y aprobación del protocolo de investigación.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Director */}
                    <div className="p-5 bg-bg-deep border border-border-thin rounded-xl space-y-4">
                        <span className="text-[10px] font-black uppercase text-text-dim">Elaborado por: Director del Proyecto</span>
                        <CoWorkField 
                            name="Firmas_DirectorNombre" 
                            cowork={cowork} 
                            label="Título abreviado, Apellidos y Nombres Completos" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), DirectorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                            placeholder="Ej: Mgs. Juan Pérez"
                            readOnly={readOnly}
                        />
                        <CoWorkField 
                            name="Firmas_DirectorCargo" 
                            cowork={cowork} 
                            label="Cargo del Elaborador" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), DirectorCargo: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-dim outline-none focus:border-text-main transition-colors" 
                            placeholder="Director del Proyecto"
                            readOnly={readOnly}
                        />
                    </div>

                    {/* Coordinador */}
                    <div className="p-5 bg-bg-deep border border-border-thin rounded-xl space-y-4">
                        <span className="text-[10px] font-black uppercase text-text-dim">Aprobado por: Coordinador de Carrera</span>
                        <CoWorkField 
                            name="Firmas_CoordinadorNombre" 
                            cowork={cowork} 
                            label="Título abreviado, Apellidos y Nombres Completos" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), CoordinadorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                            placeholder="Ej: Mgs. Carlos Gómez"
                            readOnly={readOnly}
                        />
                        <CoWorkField 
                            name="Firmas_CoordinadorCargo" 
                            cowork={cowork} 
                            label="Cargo del Aprobador" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), CoordinadorCargo: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-dim outline-none focus:border-text-main transition-colors" 
                            placeholder="Coordinador de Carrera"
                            readOnly={readOnly}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
