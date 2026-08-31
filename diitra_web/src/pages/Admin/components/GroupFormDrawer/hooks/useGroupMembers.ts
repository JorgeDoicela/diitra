import { useState, Dispatch, SetStateAction } from 'react';
import type { GroupMember, Career, GroupFormData } from '../types';
import type { SelectedMemberResult } from '../../../../../components/Common/MemberSearchSelector';

interface UseGroupMembersProps {
    carreras: Career[];
    formData: GroupFormData;
    setFormData: Dispatch<SetStateAction<GroupFormData>>;
    selectedCoordCareer: string;
    setSelectedCoordName: Dispatch<SetStateAction<string>>;
    setSelectedCoordCareer: Dispatch<SetStateAction<string>>;
}

export function useGroupMembers({
    carreras,
    formData,
    setFormData,
    selectedCoordCareer,
    setSelectedCoordName,
    setSelectedCoordCareer
}: UseGroupMembersProps) {
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);

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

        if (groupMembers.some(m => m.cedula?.trim() === cedula)) {
            alert("Esta persona ya es un integrante del grupo y no puede ser asignada como Coordinador Responsable.");
            return;
        }

        const updatedCarreras = recalculateCarreras(coord.carrera || '', groupMembers);
        setFormData(prev => ({
            ...prev,
            id_profesor_coordinador: cedula,
            carreras_ids: updatedCarreras
        }));

        setSelectedCoordName(coord.nombre_completo);
        setSelectedCoordCareer(coord.carrera || '');
    };

    const handleAddMember = (member: SelectedMemberResult) => {
        if (!member) return;
        const cedula = member.cedula.trim();

        if (cedula === formData.id_profesor_coordinador?.trim()) {
            alert("No se puede agregar al Coordinador Responsable como integrante secundario.");
            return;
        }

        if (groupMembers.some(m => m.cedula?.trim() === cedula)) {
            alert("Esta persona ya es integrante de la propuesta de grupo.");
            return;
        }

        const newMember: GroupMember = {
            id_grupo_miembro: Date.now(),
            id_usuario: member.id_usuario || 0,
            cedula: cedula,
            nombre_completo: member.nombre_completo,
            rol: member.rol || 'Co-Investigador',
            activo: true,
            carrera: member.carrera || member.departamento || '',
            telefono_contacto: member.telefono || ''
        };

        const updatedMembers = [...groupMembers, newMember];
        setGroupMembers(updatedMembers);
        const updatedCarreras = recalculateCarreras(selectedCoordCareer, updatedMembers);
        setFormData(prev => ({ ...prev, carreras_ids: updatedCarreras }));
    };

    const handleRemoveMember = (idGrupoMiembro: number) => {
        const updatedMembers = groupMembers.filter(m => m.id_grupo_miembro !== idGrupoMiembro);
        setGroupMembers(updatedMembers);
        const updatedCarreras = recalculateCarreras(selectedCoordCareer, updatedMembers);
        setFormData(prev => ({ ...prev, carreras_ids: updatedCarreras }));
    };

    return {
        groupMembers,
        setGroupMembers,
        handleSelectCoordinator,
        handleAddMember,
        handleRemoveMember
    };
}
