import React from 'react';
import { Users } from 'lucide-react';
import type { GroupMember } from '../types';
import { MemberList } from './MemberList';
import { MemberSearchSelector, type SelectedMemberResult } from '../../../../../components/Common/MemberSearchSelector';

interface TeamMembersSectionProps {
    groupMembers: GroupMember[];
    handleRemoveMember: (id: number) => void;
    formatCareerName: (name: string) => string;
    handleAddMember: (member: SelectedMemberResult) => void;
    coordinatorCedula?: string;
}

export const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
    groupMembers,
    handleRemoveMember,
    formatCareerName,
    handleAddMember,
    coordinatorCedula
}) => {
    return (
        <section className="space-y-6">
            <h4 className="text-[10px] font-black text-text-dim uppercase tracking-widest flex items-center gap-2">
                <Users size={12} /> Equipo de Trabajo Inicial
            </h4>

            <div className="space-y-6 p-6 bg-bg-deep/20 rounded-2xl border border-border-thin">
                <MemberList
                    groupMembers={groupMembers}
                    handleRemoveMember={handleRemoveMember}
                    formatCareerName={formatCareerName}
                />

                <MemberSearchSelector
                    onAddMember={handleAddMember}
                    existingCedulas={groupMembers.map(m => m.cedula).filter((c): c is string => !!c)}
                    excludeCoordinatorCedula={coordinatorCedula}
                    title="Añadir Integrante a la Propuesta"
                    subtitle="Seleccione docentes, administrativos, estudiantes activos/graduados o colaboradores externos."
                />
            </div>
        </section>
    );
};
