import React from 'react';
import { User, ShieldCheck } from 'lucide-react';
import { MemberSearchSelector, formatNombre, type SelectedMemberResult } from '../../../../../components/Common/MemberSearchSelector';

interface CoordinatorSectionProps {
    selectedCoordName: string;
    selectedCoordCedula: string;
    selectedCoordCareer: string;
    handleSelectCoordinator: (coord: SelectedMemberResult) => void;
}

export const CoordinatorSection: React.FC<CoordinatorSectionProps> = ({
    selectedCoordName,
    selectedCoordCedula,
    selectedCoordCareer,
    handleSelectCoordinator
}) => {
    return (
        <section className="space-y-4">
            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Coordinador Responsable
            </h4>

            {selectedCoordName && (
                <div className="p-3.5 bg-brand/10 border border-brand/30 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand/20 text-brand flex items-center justify-center shrink-0">
                            <ShieldCheck size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-text-main">
                                {formatNombre(selectedCoordName)}
                            </p>
                            <p className="text-[10px] text-text-dim font-mono">
                                C.I. {selectedCoordCedula} {selectedCoordCareer ? `• ${selectedCoordCareer}` : ''}
                            </p>
                        </div>
                    </div>
                    <span className="badge-vercel badge-vercel-brand text-[9px] uppercase font-bold px-2 py-0.5">
                        Coordinador Asignado
                    </span>
                </div>
            )}

            <MemberSearchSelector
                isCoordinatorSelectorOnly
                allowedTypes={['DOCENTE', 'ADMINISTRATIVO']}
                defaultType="DOCENTE"
                title={selectedCoordName ? "Cambiar Coordinador Responsable" : "Buscar y Asignar Coordinador"}
                subtitle="Seleccione al docente o personal institucional que liderará el grupo de investigación."
                onSelectCoordinator={handleSelectCoordinator}
                selectedCoordinatorCedula={selectedCoordCedula}
            />
        </section>
    );
};
