import React from 'react';
import { Users } from 'lucide-react';
import type { GroupMember } from '../types';
import { MemberList } from './MemberList';
import { AddTeacherForm } from './AddTeacherForm';
import { AddStudentForm } from './AddStudentForm';

interface TeamMembersSectionProps {
    groupMembers: GroupMember[];
    handleRemoveMember: (id: number) => void;
    formatCareerName: (name: string) => string;

    // Docente
    teacherSearchQuery: string;
    setTeacherSearchQuery: (q: string) => void;
    teacherPhone: string;
    setTeacherPhone: (p: string) => void;
    teacherSearchResults: any[];
    isTeacherSearching: boolean;
    showTeacherResults: boolean;
    setShowTeacherResults: (show: boolean) => void;
    handleSelectTeacher: (teacher: any) => void;
    teacherRol: string;
    setTeacherRol: (r: string) => void;
    handleAddTeacher: () => void;
    selectedTeacher: any | null;

    // Estudiante
    studentSearchQuery: string;
    setStudentSearchQuery: (q: string) => void;
    studentPhone: string;
    setStudentPhone: (p: string) => void;
    studentSearchResults: any[];
    isStudentSearching: boolean;
    showStudentResults: boolean;
    setShowStudentResults: (show: boolean) => void;
    handleSelectStudent: (student: any) => void;
    studentRol: string;
    setStudentRol: (r: string) => void;
    handleAddStudent: () => void;
    selectedStudent: any | null;
}

export const TeamMembersSection: React.FC<TeamMembersSectionProps> = ({
    groupMembers,
    handleRemoveMember,
    formatCareerName,
    teacherSearchQuery,
    setTeacherSearchQuery,
    teacherPhone,
    setTeacherPhone,
    teacherSearchResults,
    isTeacherSearching,
    showTeacherResults,
    setShowTeacherResults,
    handleSelectTeacher,
    teacherRol,
    setTeacherRol,
    handleAddTeacher,
    selectedTeacher,
    studentSearchQuery,
    setStudentSearchQuery,
    studentPhone,
    setStudentPhone,
    studentSearchResults,
    isStudentSearching,
    showStudentResults,
    setShowStudentResults,
    handleSelectStudent,
    studentRol,
    setStudentRol,
    handleAddStudent,
    selectedStudent
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

                <AddTeacherForm
                    teacherSearchQuery={teacherSearchQuery}
                    setTeacherSearchQuery={setTeacherSearchQuery}
                    teacherPhone={teacherPhone}
                    setTeacherPhone={setTeacherPhone}
                    teacherSearchResults={teacherSearchResults}
                    isTeacherSearching={isTeacherSearching}
                    showTeacherResults={showTeacherResults}
                    setShowTeacherResults={setShowTeacherResults}
                    handleSelectTeacher={handleSelectTeacher}
                    teacherRol={teacherRol}
                    setTeacherRol={setTeacherRol}
                    handleAddTeacher={handleAddTeacher}
                    selectedTeacher={selectedTeacher}
                />

                <AddStudentForm
                    studentSearchQuery={studentSearchQuery}
                    setStudentSearchQuery={setStudentSearchQuery}
                    studentPhone={studentPhone}
                    setStudentPhone={setStudentPhone}
                    studentSearchResults={studentSearchResults}
                    isStudentSearching={isStudentSearching}
                    showStudentResults={showStudentResults}
                    setShowStudentResults={setShowStudentResults}
                    handleSelectStudent={handleSelectStudent}
                    studentRol={studentRol}
                    setStudentRol={setStudentRol}
                    handleAddStudent={handleAddStudent}
                    selectedStudent={selectedStudent}
                />
            </div>
        </section>
    );
};
