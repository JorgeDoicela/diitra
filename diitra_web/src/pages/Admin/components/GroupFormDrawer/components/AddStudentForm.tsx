import React from 'react';
import { Plus, Search } from 'lucide-react';
import { formatNombre } from '../hooks/useGroupFormDrawer';

interface AddStudentFormProps {
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

export const AddStudentForm: React.FC<AddStudentFormProps> = ({
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
        <div className="p-4 bg-surface rounded-xl border border-border-thin space-y-4">
            <h5 className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                <Plus size={10} /> Añadir Estudiante Semillerista
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscar Estudiante</label>
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60" />
                        <input
                            type="text"
                            value={studentSearchQuery}
                            onChange={(e) => {
                                setStudentSearchQuery(e.target.value);
                                setShowStudentResults(true);
                            }}
                            onFocus={() => setShowStudentResults(true)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg pl-8 pr-3 py-2 text-xs text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                            placeholder="Buscar por nombre o cédula..."
                        />
                        {showStudentResults && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowStudentResults(false)}></div>
                                <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[150px] overflow-y-auto z-30 custom-scrollbar">
                                    {isStudentSearching ? (
                                        <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                            Buscando...
                                        </div>
                                    ) : studentSearchResults.length === 0 ? (
                                        <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                            No se encontraron resultados.
                                        </div>
                                    ) : (
                                        studentSearchResults.map((student: any) => (
                                            <button
                                                key={student.cedula}
                                                type="button"
                                                onClick={() => handleSelectStudent(student)}
                                                className="w-full text-left p-2 rounded hover:bg-bg-deep/50 transition-colors"
                                            >
                                                <p className="font-semibold text-text-main text-xs">{formatNombre(student.nombre)}</p>
                                                <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {student.cedula} | {student.carrera || 'SIN CARRERA'}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Teléfono (WhatsApp)</label>
                    <input
                        type="tel"
                        value={studentPhone}
                        onChange={(e) => setStudentPhone(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none transition-all font-medium"
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                    <select
                        value={studentRol}
                        onChange={(e) => setStudentRol(e.target.value)}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="Semillerista">Semillerista</option>
                    </select>
                </div>
            </div>

            <button
                type="button"
                onClick={handleAddStudent}
                disabled={!selectedStudent}
                className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
            >
                Añadir Estudiante
            </button>
        </div>
    );
};
