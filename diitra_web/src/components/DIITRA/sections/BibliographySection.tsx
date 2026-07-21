import React, { useContext } from 'react';
import { Library, Info, Shield } from 'lucide-react';
import { CoWorkEditor } from '../../../core/cowork/components/CoWorkEditor';
import { CoWorkField } from '../../../core/cowork/components/CoWorkField';
import type { CoWorkHandle } from '../../../core/cowork/types';
import { SectionBlockGuard } from '../SectionBlockGuard';
import { SectionGuardContext } from '../../../core/documents/context/DocumentDataContext';

interface BibliographySectionProps {
    formData: any;
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any, meta?: { source?: 'local' | 'remote' | 'system' }) => void;
    readOnly?: boolean;
    config?: any;
}

export const BibliographySection: React.FC<BibliographySectionProps> = ({
    cowork,
    onUpdate,
    readOnly = false,
    config
}) => {
    const isBibliographyHidden = config?.isBibliographyHidden === true;
    const sectionTitle = config?.title || "Bibliografía & Firmas";

    return (
        <div className="space-y-12">
            {/* 8. Bibliografía */}
            {!isBibliographyHidden && (
                <SectionBlockGuard id="bibliografia_texto" title="8. Bibliografía">
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
                                readonly={readOnly}
                            />
                        </div>
                    </div>
                </SectionBlockGuard>
            )}

            {/* 9. Firmas de Responsabilidad */}
            <SectionBlockGuard id="firmas" title={isBibliographyHidden ? sectionTitle : "9. Firmas de Responsabilidad"} showInlineLock={true}>
                <FirmasBlock 
                    cowork={cowork}
                    onUpdate={onUpdate}
                    parentReadOnly={readOnly}
                    title={isBibliographyHidden ? sectionTitle : "9. Firmas de Responsabilidad"}
                    signatories={config?.signatories}
                />
            </SectionBlockGuard>
        </div>
    );
};

const FirmasBlock: React.FC<{
    cowork: CoWorkHandle;
    onUpdate: (field: string, value: any) => void;
    parentReadOnly?: boolean;
    title?: string;
    signatories?: any[];
}> = ({ cowork, onUpdate, parentReadOnly = false, title = "9. Firmas de Responsabilidad", signatories }) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const readOnly = parentReadOnly || blockReadOnly;

    const isCustomTitle = title !== "9. Firmas de Responsabilidad";
    const hasCustomSignatories = Array.isArray(signatories) && signatories.length > 0;

    return (
        <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl space-y-6 shadow-sm animate-fade-in">
            <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                    <Shield size={18} /> {title}
                </h3>
                {!isCustomTitle && (
                    <p className="text-[10px] text-text-dim px-2 uppercase tracking-wider font-semibold">
                        Complete los datos de los responsables de la elaboración y aprobación del protocolo de investigación.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hasCustomSignatories ? (
                    signatories.map((sig, idx) => (
                        <div key={idx} className="p-5 bg-bg-deep border border-border-thin rounded-xl space-y-4">
                            <span className="text-[10px] font-black uppercase text-text-dim">
                                {sig.label || "Firmante:"} {sig.role}
                            </span>
                            <CoWorkField 
                                name={`Firmas_Firmante_${idx}_Nombre`} 
                                cowork={cowork} 
                                label="Título abreviado, Apellidos y Nombres" 
                                onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), [`Firmante_${idx}_Nombre`]: v }))}
                                className="w-full bg-bg-deep border border-border-thin rounded-xl px-4 py-3 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                                placeholder={sig.name || "Ej: Mgs. Juan Pérez"}
                                readOnly={readOnly}
                            />
                            <div>
                                <label className="text-[9px] font-black text-text-dim uppercase tracking-widest block px-2">Cargo Oficial</label>
                                <span className="text-[10px] text-text-main font-bold block mt-1 px-2">{sig.role}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    <>
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
                    </>
                )}
            </div>
        </div>
    );
};
