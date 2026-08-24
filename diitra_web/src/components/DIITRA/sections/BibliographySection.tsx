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
                    formData={formData}
                    onUpdate={onUpdate}
                    parentReadOnly={readOnly}
                    title={isBibliographyHidden ? sectionTitle : "9. Firmas de Responsabilidad"}
                    config={config}
                />
            </SectionBlockGuard>
        </div>
    );
};

const FirmasBlock: React.FC<{
    cowork: CoWorkHandle;
    formData: any;
    onUpdate: (field: string, value: any) => void;
    parentReadOnly?: boolean;
    title?: string;
    config?: any;
}> = ({ cowork, formData, onUpdate, parentReadOnly = false, title = "9. Firmas de Responsabilidad", config }) => {
    const { readOnly: blockReadOnly } = useContext(SectionGuardContext);
    const readOnly = parentReadOnly || blockReadOnly;

    const isCustomTitle = title !== "9. Firmas de Responsabilidad";
    const mode = config?.signaturesMode || 'team_dynamic';
    const signatories = config?.signatories || [];
    const hasCustomSignatories = mode === 'custom_manual' && Array.isArray(signatories) && signatories.length > 0;

    // Extraer equipo del proyecto directamente de la fuente de verdad (formData)
    const rawInvestigadores: any[] = formData?.Investigadores || formData?.investigadores || [];
    const directorProyecto = formData?.DirectorProyecto || formData?.directorProyecto || '';

    // Filtrar docentes y estudiantes
    const docentes = rawInvestigadores.filter(inv => {
        const rol = (inv.Rol || inv.rol || '').toUpperCase();
        return rol !== 'DIRECTOR' && rol !== 'ESTUDIANTE' && rol !== 'AUXILIAR';
    });

    const estudiantes = rawInvestigadores.filter(inv => {
        const rol = (inv.Rol || inv.rol || '').toUpperCase();
        return rol === 'ESTUDIANTE' || rol === 'AUXILIAR';
    });

    const includeDirector = config?.includeDirector !== false;
    const includeDocentes = config?.includeDocentes !== false;
    const includeEstudiantes = Boolean(config?.includeEstudiantes);
    const includeCoordCarrera = config?.includeCoordinadorCarrera !== false;
    const includeCoordDiitra = Boolean(config?.includeCoordinadorDiitra) || mode === 'institutional_chain';
    const includeVicerrector = Boolean(config?.includeVicerrectorado);

    const defaultOrder = ['director', 'docentes', 'estudiantes', 'coordinador_carrera', 'coordinador_diitra', 'vicerrectorado'];
    const order: string[] = config?.signaturesOrder || defaultOrder;
    const fullOrder = Array.from(new Set([...order, ...defaultOrder]));

    const renderDynamicSection = (sectionId: string) => {
        switch (sectionId) {
            case 'director':
                if (!includeDirector) return null;
                return (
                    <div key="director" className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-wider text-brand block border-b border-border-thin/20 pb-1.5">
                            Elaborado por: Director del Proyecto
                        </span>
                        <CoWorkField 
                            name="Firmas_DirectorNombre" 
                            cowork={cowork} 
                            label="Título, Apellidos y Nombres" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), DirectorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                            placeholder={directorProyecto || "Ej: Mgs. Juan Pérez"}
                            readOnly={readOnly}
                        />
                        <div>
                            <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Cargo</label>
                            <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">Director de Proyecto</span>
                        </div>
                    </div>
                );

            case 'docentes':
                if (!includeDocentes) return null;
                return docentes.map((inv, idx) => {
                    const invNombre = inv.Nombre || inv.nombre || '';
                    const invCarrera = inv.Carrera || inv.carrera || 'Docente Investigador';
                    return (
                        <div key={`docente_${idx}`} className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-text-dim block border-b border-border-thin/20 pb-1.5">
                                Elaborado por: Docente Investigador #{idx + 1}
                            </span>
                            <CoWorkField 
                                name={`Firmas_Docente_${idx}_Nombre`} 
                                cowork={cowork} 
                                label="Título, Apellidos y Nombres" 
                                onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), [`Docente_${idx}_Nombre`]: v }))}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                                placeholder={invNombre || `Docente Investigador ${idx + 1}`}
                                readOnly={readOnly}
                            />
                            <div>
                                <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Afiliación / Cargo</label>
                                <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">{invCarrera}</span>
                            </div>
                        </div>
                    );
                });

            case 'estudiantes':
                if (!includeEstudiantes) return null;
                return estudiantes.map((inv, idx) => {
                    const estNombre = inv.Nombre || inv.nombre || '';
                    return (
                        <div key={`estudiante_${idx}`} className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-text-dim block border-b border-border-thin/20 pb-1.5">
                                Colaborador: Estudiante Auxiliar #{idx + 1}
                            </span>
                            <CoWorkField 
                                name={`Firmas_Estudiante_${idx}_Nombre`} 
                                cowork={cowork} 
                                label="Apellidos y Nombres" 
                                onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), [`Estudiante_${idx}_Nombre`]: v }))}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                                placeholder={estNombre || `Estudiante Auxiliar ${idx + 1}`}
                                readOnly={readOnly}
                            />
                            <div>
                                <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Rol</label>
                                <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">Auxiliar de Investigación</span>
                            </div>
                        </div>
                    );
                });

            case 'coordinador_carrera':
                if (!includeCoordCarrera) return null;
                return (
                    <div key="coord_carrera" className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-dim block border-b border-border-thin/20 pb-1.5">
                            Revisado por: Coordinación de Carrera
                        </span>
                        <CoWorkField 
                            name="Firmas_CoordinadorNombre" 
                            cowork={cowork} 
                            label="Título, Apellidos y Nombres" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), CoordinadorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                            placeholder="Ej: Mgs. Carlos Gómez"
                            readOnly={readOnly}
                        />
                        <div>
                            <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Cargo</label>
                            <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">Coordinador de Carrera</span>
                        </div>
                    </div>
                );

            case 'coordinador_diitra':
                if (!includeCoordDiitra) return null;
                return (
                    <div key="coord_diitra" className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 block border-b border-border-thin/20 pb-1.5">
                            Aprobado por: Comisión de Investigación
                        </span>
                        <CoWorkField 
                            name="Firmas_DiitraNombre" 
                            cowork={cowork} 
                            label="Título, Apellidos y Nombres" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), DiitraNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                            placeholder="Ing. Estefani Sánchez Mgtr."
                            readOnly={readOnly}
                        />
                        <div>
                            <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Cargo</label>
                            <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">Coordinadora de Investigación DIITRA</span>
                        </div>
                    </div>
                );

            case 'vicerrectorado':
                if (!includeVicerrector) return null;
                return (
                    <div key="vicerrectorado" className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-wider text-text-dim block border-b border-border-thin/20 pb-1.5">
                            Resolución: Vicerrectorado Académico
                        </span>
                        <CoWorkField 
                            name="Firmas_VicerrectorNombre" 
                            cowork={cowork} 
                            label="Título, Apellidos y Nombres" 
                            onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), VicerrectorNombre: v }))}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                            placeholder="[Vicerrectorado Académico]"
                            readOnly={readOnly}
                        />
                        <div>
                            <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Cargo</label>
                            <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">Vicerrectorado Académico</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="p-6 bg-bg-deep border border-border-thin rounded-2xl space-y-6 shadow-sm animate-fade-in">
            <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 px-2">
                    <Shield size={18} /> {title}
                </h3>
                {!isCustomTitle && (
                    <p className="text-[10px] text-text-dim px-2 uppercase tracking-wider font-semibold">
                        Firmas y trazabilidad institucional del documento según equipo y autoridades registradas.
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hasCustomSignatories ? (
                    signatories.map((sig: any, idx: number) => (
                        <div key={idx} className="p-5 bg-surface border border-border-thin rounded-xl space-y-3 shadow-xs">
                            <span className="text-[9px] font-black uppercase tracking-wider text-text-dim block border-b border-border-thin/20 pb-1.5">
                                {sig.label || "Firmante:"}
                            </span>
                            <CoWorkField 
                                name={`Firmas_Firmante_${idx}_Nombre`} 
                                cowork={cowork} 
                                label="Nombre y Apellidos" 
                                onValueChange={(v) => onUpdate('FirmasResponsabilidad', (prev: any) => ({ ...(prev || {}), [`Firmante_${idx}_Nombre`]: v }))}
                                className="w-full bg-bg-deep border border-border-thin rounded-lg px-3 py-2 text-xs text-text-main font-bold outline-none focus:border-text-main transition-colors" 
                                placeholder={sig.name || "Ej: Mgs. Juan Pérez"}
                                readOnly={readOnly}
                            />
                            <div>
                                <label className="text-[8.5px] font-bold text-text-dim uppercase tracking-widest block">Cargo Oficial</label>
                                <span className="text-[9.5px] text-text-main font-semibold block mt-0.5">{sig.role}</span>
                            </div>
                        </div>
                    ))
                ) : (
                    fullOrder.map(sectionId => renderDynamicSection(sectionId))
                )}
            </div>
        </div>
    );
};
