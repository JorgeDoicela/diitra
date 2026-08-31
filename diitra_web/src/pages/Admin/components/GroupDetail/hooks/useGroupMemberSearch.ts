import { useState } from 'react';
import api from '../../../../../api/axios_config';
import type { Group, GroupMember, Career } from '../useGroupDetail';
import type { SelectedMemberResult } from '../../../../../components/Common/MemberSearchSelector';

interface UseGroupMemberSearchProps {
    detailGroup: Group | null;
    detailMembers: GroupMember[];
    carreras: Career[];
    setEditFormData: React.Dispatch<React.SetStateAction<any>>;
    setSelectedCoordName: (name: string) => void;
    refreshGroupDetail: () => Promise<void>;
}

export const useGroupMemberSearch = ({
    detailGroup,
    detailMembers,
    carreras,
    setEditFormData,
    setSelectedCoordName,
    refreshGroupDetail
}: UseGroupMemberSearchProps) => {
    const [selectedCoordCareer, setSelectedCoordCareer] = useState('');

    const recalculateCarreras = (coordCareer: string, members: GroupMember[]) => {
        const uniqueIds = new Set<number>();
        const getMatchedIds = (careerStr: string) => {
            const careersList = careerStr.split(',').map((c: string) => c.trim().toUpperCase());
            return carreras
                .filter(c => careersList.includes(c.carrera1.trim().toUpperCase()))
                .map(c => c.id_carrera);
        };

        if (coordCareer) {
            getMatchedIds(coordCareer).forEach(id => uniqueIds.add(id));
        }

        members.forEach(m => {
            if (m.carrera) {
                getMatchedIds(m.carrera).forEach(id => uniqueIds.add(id));
            }
        });

        return Array.from(uniqueIds);
    };

    const handleSelectCoordinator = (coord: SelectedMemberResult) => {
        if (!coord) return;
        const cedula = coord.cedula.trim();

        if (detailMembers.some(m => m.cedula?.trim() === cedula)) {
            alert("Esta persona ya es un integrante del grupo y no puede ser asignada como Coordinador Responsable.");
            return;
        }

        const updatedCarreras = recalculateCarreras(coord.carrera || '', detailMembers);
        setEditFormData((prev: any) => ({
            ...prev,
            id_profesor_coordinador: cedula,
            carreras_ids: updatedCarreras
        }));

        setSelectedCoordName(coord.nombre_completo);
        setSelectedCoordCareer(coord.carrera || '');
    };

    const handleAddMember = async (member: SelectedMemberResult) => {
        if (!member || !detailGroup) return;
        const cedula = member.cedula.trim();

        if (cedula === detailGroup.id_profesor_coordinador?.trim()) {
            alert("No se puede agregar al Coordinador Responsable como integrante secundario.");
            return;
        }

        if (detailMembers.some(m => m.cedula?.trim() === cedula)) {
            alert("Esta persona ya es integrante del grupo.");
            return;
        }

        try {
            const memberDto = {
                id_usuario: member.id_usuario || 0,
                cedula: cedula,
                nombre_completo: member.nombre_completo,
                rol: member.rol || 'Co-Investigador',
                activo: true,
                telefono_contacto: member.telefono || ''
            };
            await api.post(`/Groups/${detailGroup.uuid}/members`, memberDto);
            await refreshGroupDetail();
        } catch (err: any) {
            console.error("Error al agregar integrante:", err);
            alert("No se pudo agregar al integrante: " + (err.response?.data?.message || err.message));
        }
    };

    const handleRemoveMember = async (idGrupoMiembro: number) => {
        const reason = window.prompt("Ingrese el motivo por el cual el integrante se retira del grupo (opcional):");
        if (reason === null) return;

        try {
            const encodedReason = encodeURIComponent(reason.trim());
            await api.delete(`/Groups/members/${idGrupoMiembro}?reason=${encodedReason}`);
            await refreshGroupDetail();
        } catch (error: any) {
            console.error("Error al retirar integrante:", error);
            alert("No se pudo retirar al integrante: " + (error.response?.data?.message || error.message));
        }
    };

    return {
        selectedCoordCareer,
        handleSelectCoordinator,
        handleAddMember,
        handleRemoveMember
    };
};
