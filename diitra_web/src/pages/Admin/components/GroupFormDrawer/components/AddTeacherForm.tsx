import React from 'react';
import { Plus, Search } from 'lucide-react';
import { formatNombre } from '../hooks/useGroupFormDrawer';

interface AddTeacherFormProps {
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
}

export const AddTeacherForm: React.FC<AddTeacherFormProps> = ({
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
    selectedTeacher
}) => {
    return (
        <div className="p-4 bg-surface rounded-xl border border-border-thin space-y-4">
            <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Plus size={10} /> Añadir Docente Investigador
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 relative">
                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Buscar Docente</label>
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim/60" />
                        <input
                            type="text"
                            value={teacherSearchQuery}
                            onChange={(e) => {
                                setTeacherSearchQuery(e.target.value);
                                setShowTeacherResults(true);
                            }}
                            onFocus={() => setShowTeacherResults(true)}
                            className="w-full bg-bg-deep border border-border-thin rounded-lg pl-8 pr-3 py-2 text-xs text-text-main focus:outline-none transition-all uppercase placeholder:normal-case font-medium"
                            placeholder="Buscar por nombre o cédula..."
                        />
                        {showTeacherResults && (
                            <>
                                <div className="fixed inset-0 z-20" onClick={() => setShowTeacherResults(false)}></div>
                                <div className="absolute left-0 right-0 top-full mt-1 bg-surface border border-border-thin rounded-lg p-1.5 shadow-xl max-h-[150px] overflow-y-auto z-30 custom-scrollbar">
                                    {isTeacherSearching ? (
                                        <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                            Buscando...
                                        </div>
                                    ) : teacherSearchResults.length === 0 ? (
                                        <div className="p-3 text-center text-[10px] text-text-dim font-mono">
                                            No se encontraron resultados.
                                        </div>
                                    ) : (
                                        teacherSearchResults.map((teacher: any) => (
                                            <button
                                                key={teacher.cedula}
                                                type="button"
                                                onClick={() => handleSelectTeacher(teacher)}
                                                className="w-full text-left p-2 rounded hover:bg-bg-deep/50 transition-colors flex justify-between items-center"
                                            >
                                                <div className="space-y-0.5">
                                                    <p className="font-semibold text-text-main text-xs flex items-center gap-2">
                                                        <span>{formatNombre(teacher.nombre)}</span>
                                                        {teacher.horas_disponibles !== undefined && (
                                                            <span className={`badge-vercel text-[10px] font-medium px-2 py-0.5 ${
                                                                (teacher.horas_disponibles - (teacher.horas_asignadas || 0)) > 0 
                                                                    ? 'badge-vercel-success' 
                                                                    : 'badge-vercel-error'
                                                            }`}>
                                                                Disp: {teacher.horas_disponibles - (teacher.horas_asignadas || 0)}h / {teacher.horas_disponibles}h
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-text-dim font-mono text-[9px] mt-0.5">C.I. {teacher.cedula} | {teacher.carrera || 'SIN CARRERA'}</p>
                                                </div>
                                                <span className="badge-vercel text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 badge-vercel-violet">
                                                    Docente
                                                </span>
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
                        value={teacherPhone}
                        onChange={(e) => setTeacherPhone(e.target.value)}
                        placeholder="Opcional"
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-2 text-xs text-text-main focus:outline-none transition-all font-medium"
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-[8px] font-black text-text-dim uppercase tracking-wider block">Rol en el Grupo</label>
                    <select
                        value={teacherRol}
                        onChange={(e) => setTeacherRol(e.target.value)}
                        className="w-full bg-bg-deep border border-border-thin rounded-lg p-2.5 text-xs text-text-main focus:outline-none transition-all font-medium"
                    >
                        <option value="Co-Investigador">Co-Investigador</option>
                        <option value="Director de Proyecto">Director de Proyecto</option>
                    </select>
                </div>
            </div>

            <button
                type="button"
                onClick={handleAddTeacher}
                disabled={!selectedTeacher}
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-bg-deep font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
            >
                Añadir Docente
            </button>
        </div>
    );
};
