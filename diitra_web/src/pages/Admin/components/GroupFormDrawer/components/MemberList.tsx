import React from 'react';
import { User, UserMinus, Shield } from 'lucide-react';
import type { GroupMember } from '../types';
import { formatNombre } from '../hooks/useGroupFormDrawer';

interface MemberListProps {
    groupMembers: GroupMember[];
    handleRemoveMember: (id: number) => void;
    formatCareerName: (name: string) => string;
}

export const MemberList: React.FC<MemberListProps> = ({
    groupMembers,
    handleRemoveMember,
    formatCareerName
}) => {
    if (groupMembers.length === 0) {
        return (
            <div className="p-4 text-center text-xs text-text-dim bg-bg-deep/30 rounded-xl border border-dashed border-border-thin font-mono uppercase">
                Sin integrantes agregados.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {groupMembers.map(member => (
                <div key={member.id_grupo_miembro} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border-thin animate-fade-up">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-black bg-surface-hover text-text-dim">
                            {member.rol === 'Director' ? <Shield size={14} /> : <User size={14} />}
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-text-main">{formatNombre(member.nombre_completo)}</p>
                            <p className="text-[8px] font-bold uppercase text-text-dim mt-0.5">{member.rol} {member.carrera ? `| ${formatCareerName(member.carrera)}` : ''}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id_grupo_miembro)}
                        className="p-1.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-all"
                    >
                        <UserMinus size={12} />
                    </button>
                </div>
            ))}
        </div>
    );
};
